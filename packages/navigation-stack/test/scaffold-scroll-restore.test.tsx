/**
 * A SCAFFOLD PAGE COMES BACK WHERE IT WAS LEFT — on Safari too.
 *
 * Safari drops a hidden element's scroll offset: a page covered by a push is `display: none`, and
 * when it is uncovered it is at 0. Restoring it is this package's job, and for every page built on
 * `Scaffold` it never happened. The page's wrapper registers as its scroller first and the Scaffold
 * body claims the scroll a render later; the restore listened to the first answer for good, so the
 * body's scrolling was never recorded and the page went back to the top (reported on iPhone across a
 * whole app, 9 Nov). Chrome keeps the offset through `display: none`, which hid it there.
 *
 * jsdom keeps the offset too, so the test zeroes the covered body as Safari does. In jsdom the body
 * happens to be registered before the listener is attached, so this passes on 1.10.0 as well: the
 * fix (1.10.1) is proven in WebKit, by store-manager's `probe-scroll-kept-ui` with BROWSER=webkit
 * (1680 -> 0 on 1.10.0, 1680 -> 1680 on 1.10.1). This guards the path itself: a Scaffold body's
 * scroll is recorded, and the restore puts it back.
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import NavigationStack, { Scaffold } from '../src/index';
import { getRegistry } from '../src/core/registry';

const Long = () => (
  <Scaffold appBar={<div>List</div>}>
    <div>rows</div>
  </Scaffold>
);
const Detail = () => <div>Detail</div>;

async function settle(ms = 150) {
  await act(async () => {
    await new Promise((r) => setTimeout(r, ms));
  });
}

/** Give the body the size of a long list on a phone, which jsdom does not lay out. */
function sized(body: HTMLElement) {
  Object.defineProperty(body, 'clientHeight', { configurable: true, value: 800 });
  Object.defineProperty(body, 'clientWidth', { configurable: true, value: 390 });
  Object.defineProperty(body, 'scrollHeight', { configurable: true, value: 3000 });
}

describe('a Scaffold page keeps its place through a push', () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, '', '/app');
  });
  afterEach(() => cleanup());

  it('scrolled to 1200, covered, zeroed as Safari does, uncovered: back at 1200', async () => {
    const { container } = render(
      <NavigationStack id="scroll-restore" navLink={{ list: Long, detail: Detail }} entry="list" />,
    );
    await settle();
    const api = getRegistry().get('scroll-restore')!.api!;

    const body = container.querySelector('.navstack-column-body') as HTMLElement;
    expect(body, 'the Scaffold body is the page scroller').toBeTruthy();
    sized(body);
    // Past the moment the page is being restored on arrival, when its scroll events are not the user's.
    await settle(1000);

    // Where the user put it. A scroll event does not bubble — as in a browser.
    body.scrollTop = 1200;
    body.dispatchEvent(new Event('scroll'));
    await settle(50);

    await act(async () => {
      await api.push('detail');
    });
    await settle(400);

    // What Safari does to the covered page.
    body.scrollTop = 0;

    await act(async () => {
      await api.pop();
    });
    await settle(1000);

    expect(body.scrollTop).toBe(1200);
  });
});
