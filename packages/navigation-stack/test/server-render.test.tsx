/**
 * A STACK RENDERED ON A SERVER.
 *
 * The thing that makes a public page findable. A crawler fetches a URL and reads what comes back; it
 * does not run the app first. Until now a stack started empty and was filled by an effect, and a
 * server runs no effects — so every page was a 15 KB shell with the product nowhere in it.
 *
 * These tests render with `react-dom/server`, which is as close to the real thing as a test gets:
 * no window, no document, no effects. If the product's name is in the string, a crawler sees it.
 */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import NavigationStack, { useLocation } from '../src/index';

function Shop() {
  return <h1>Ashabi Global Resources</h1>;
}

function Product() {
  // Exactly what a page does in the browser — there is no server-only version of this.
  const id = useLocation()?.params?.id as string | undefined;
  return (
    <article>
      <h1>Gulder 60cl</h1>
      <p>₦12,500 · in stock</p>
      <small>{id}</small>
    </article>
  );
}

const routes = { shop_page: Shop, product_page: Product };

const onTheServer = (location: string) =>
  renderToString(
    <NavigationStack
      id="shop"
      navLink={routes}
      entry="shop_page"
      paths
      location={location}
      transitionDuration={0}
    />,
  );

describe('rendered on a server, from the URL alone', () => {
  it('puts the PRODUCT in the HTML, not a shell', () => {
    const html = onTheServer('/s/7R8U2A/shop/product/gulder-60cl~2d6ab81c-0e67-4bcd-ae22-38160f0f1965');

    // What a crawler, and a link preview, actually read.
    expect(html).toContain('Gulder 60cl');
    expect(html).toContain('₦12,500');
    expect(html).toContain('2d6ab81c-0e67-4bcd-ae22-38160f0f1965');
  });

  it('renders the page the URL names, not the entry route', () => {
    const product = onTheServer('/s/7R8U2A/shop/product/gulder-60cl~7');
    expect(product).toContain('Gulder 60cl');

    const shop = onTheServer('/s/7R8U2A/shop');
    expect(shop).toContain('Ashabi Global Resources');
    expect(shop).not.toContain('Gulder 60cl');
  });

  it('survives a URL it cannot make sense of, rather than throwing', () => {
    // A crawler follows links that are years old. A 500 on a stale URL is worse than a shell.
    expect(() => onTheServer('/s/7R8U2A/nothing-we-know/12')).not.toThrow();
  });

  it('needs no window, no document and no effects', () => {
    // renderToString provides none of them; that this returns at all is the assertion.
    const html = onTheServer('/s/7R8U2A/shop/product/x~1');
    expect(html.length).toBeGreaterThan(0);
  });

  it('is off unless the stack asked for it', () => {
    // Without `paths` there is no location to read, and the server renders what it always did.
    const html = renderToString(
      <NavigationStack id="off" navLink={routes} entry="shop_page" transitionDuration={0} />,
    );
    expect(html).not.toContain('Gulder 60cl');
  });
});
