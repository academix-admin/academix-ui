// @vitest-environment node
/**
 * A PAGE THAT FETCHES, RENDERED ON A SERVER, WITH THE DATA IN IT.
 *
 * Node rather than jsdom, deliberately: there must be no `window`, because "is there a window" is
 * exactly the question the hook asks. Under jsdom this would test the browser path and prove nothing.
 *
 * On a client these hooks never suspend — a screen with an answer must not be blanked to wait for a
 * newer one. On a server there is no screen, nothing to blank and nobody watching, so waiting is the
 * honest thing: the difference between a crawler receiving a product and receiving an empty frame.
 */
import React, { Suspense } from 'react';
import { describe, it, expect } from 'vitest';
import { renderToPipeableStream } from 'react-dom/server';
import { PassThrough } from 'node:stream';
import { StateStackProvider, createRequestStore, useDemandResource } from '../src/index';

/** Render to a string the way a server actually does — streaming, awaiting suspense. */
function renderOnServer(element: React.ReactElement): Promise<string> {
  return new Promise((resolve, reject) => {
    let html = '';
    const sink = new PassThrough();
    sink.on('data', (c) => { html += c.toString(); });
    sink.on('end', () => resolve(html));
    sink.on('error', reject);

    const { pipe } = renderToPipeableStream(element, {
      onAllReady() { pipe(sink); },
      onError: reject,
    });
    setTimeout(() => reject(new Error('server render did not finish')), 5000);
  });
}

const PRODUCT = { name: 'Gulder 60cl', price: 12500 };

function ProductPage({ store }: { store: ReturnType<typeof createRequestStore> }) {
  // Exactly what the page writes in a browser. Nothing here knows where it is running.
  const product = useDemandResource<typeof PRODUCT>(
    async () => {
      await new Promise((r) => setTimeout(r, 10));   // a real read takes a moment
      return PRODUCT;
    },
    { key: 'product:2d6ab81c', scope: 'shop', persist: false, deps: [] },
  );

  return (
    <article>
      <h1>{product.data?.name ?? 'Loading'}</h1>
      <p>₦{product.data?.price ?? ''}</p>
    </article>
  );
}

const page = (store: ReturnType<typeof createRequestStore>) => (
  <StateStackProvider store={store}>
    <Suspense fallback={<p>waiting</p>}>
      <ProductPage store={store} />
    </Suspense>
  </StateStackProvider>
);

describe('rendered on a server', () => {
  it('waits for the read and puts the product in the HTML', async () => {
    const store = createRequestStore();
    const html = await renderOnServer(page(store));

    expect(html).toContain('Gulder 60cl');
    expect(html).toContain('12500');
    expect(html).not.toContain('Loading');
  });

  it('and what it fetched can be carried to the browser', async () => {
    // What goes into the page as a <script>, so the browser does not read it a second time.
    const store = createRequestStore();
    await renderOnServer(page(store));

    expect(store.dehydrate()).toEqual({ shop: { 'product:2d6ab81c': PRODUCT } });
  });

  it('reads once, however many times React renders the tree', async () => {
    /*
     * React renders a suspended tree again once its promise settles. Without one read per key per
     * request the second attempt would start a second fetch and suspend again — for ever, and
     * charging the shop for each attempt.
     */
    let reads = 0;
    const store = createRequestStore();

    function Counted() {
      const r = useDemandResource<string>(
        async () => { reads += 1; await new Promise((x) => setTimeout(x, 5)); return 'once'; },
        { key: 'k', scope: 'counted', persist: false, deps: [] },
      );
      return <p>{r.data}</p>;
    }

    const html = await renderOnServer(
      <StateStackProvider store={store}>
        <Suspense fallback={<p>waiting</p>}><Counted /></Suspense>
      </StateStackProvider>,
    );

    expect(html).toContain('once');
    expect(reads).toBe(1);
  });

  it('a failed read renders the page without it, rather than a 500', async () => {
    // A crawler receiving a page missing one price is better than a crawler receiving an error, and
    // a person whose network blinked still gets their screen.
    const store = createRequestStore();

    function Broken() {
      const r = useDemandResource<string>(async () => { throw new Error('offline'); }, {
        key: 'k', scope: 'broken', persist: false, deps: [],
      });
      return <p>{r.data ?? 'no price yet'}</p>;
    }

    const html = await renderOnServer(
      <StateStackProvider store={store}>
        <Suspense fallback={<p>waiting</p>}><Broken /></Suspense>
      </StateStackProvider>,
    );

    expect(html).toContain('no price yet');
  });
});
