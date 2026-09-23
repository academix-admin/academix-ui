/**
 * Does the example demonstrate what its comment claims?
 *
 * Scoped to the ACTIVE stack: both stacks stay mounted (that is the point — a tab you left is
 * still there), so a bare `.last()` picks whichever tab is last in the DOM.
 */
import { chromium } from '@playwright/test';

const BASE = 'http://localhost:4173';
let failed = 0;
const check = (what, ok, detail = '') => {
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${what}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failed += 1;
};

/** The top page of one tab, by the uid prefix the stack writes. */
const topOf = (p, stack) =>
  p.evaluate((s) => {
    const pages = [...document.querySelectorAll(`[data-nav-uid^="main:${s}:"]`)];
    const last = pages[pages.length - 1];
    return { h2: last?.querySelector('h2')?.textContent ?? null, depth: pages.length };
  }, stack);

const browser = await chromium.launch();
const p = await browser.newPage({ viewport: { width: 390, height: 780 } });
try {
  await p.goto(BASE, { waitUntil: 'networkidle' });
  await p.waitForTimeout(900);

  await p.getByRole('button', { name: 'Product 3', exact: true }).click();
  await p.waitForTimeout(700);
  await p.getByRole('button', { name: /Open its history/ }).click();
  await p.waitForTimeout(900);

  const deep = await topOf(p, 'stock');
  check('three pages deep in Stock', deep.depth === 3 && deep.h2 === 'History', `${deep.depth} pages, top "${deep.h2}"`);
  check('and the param reached the page', (await p.locator('p').filter({ hasText: 'Product 3' }).count()) > 0);

  // Back, BEFORE any tab switching: it pops this tab one page.
  await p.goBack();
  await p.waitForTimeout(900);
  const popped = await topOf(p, 'stock');
  check("the browser's Back pops a page of this tab", popped.depth === 2 && popped.h2 === 'Product 3', `${popped.depth} pages, top "${popped.h2}"`);
  await p.getByRole('button', { name: /Open its history/ }).click();
  await p.waitForTimeout(800);

  const scroller = p.locator('[data-nav-uid^="main:stock:"]').last().locator('div[style*="overflow-y: auto"]').first();
  await scroller.evaluate((el) => { el.scrollTop = 1500; });
  await p.waitForTimeout(500);
  const left = await scroller.evaluate((el) => el.scrollTop);
  check('scrolled a long way down', left > 1000, `${left}px`);

  await p.getByRole('button', { name: 'People', exact: true }).click();
  await p.waitForTimeout(800);
  await p.getByRole('button', { name: 'Customer 2', exact: true }).click();
  await p.waitForTimeout(800);
  const other = await topOf(p, 'people');
  check('the other tab has a stack of its own', other.depth === 2 && other.h2 === 'Customer 2', `${other.depth} pages, top "${other.h2}"`);

  await p.getByRole('button', { name: 'Stock', exact: true }).click();
  await p.waitForTimeout(1400);

  const back = await topOf(p, 'stock');
  check('coming back, still three pages deep', back.depth === 3 && back.h2 === 'History', `${back.depth} pages, top "${back.h2}"`);
  const at = await scroller.evaluate((el) => el.scrollTop);
  check('and still scrolled where it was', Math.abs(at - left) < 80, `left at ${left}px, came back to ${at}px`);

} catch (e) {
  console.log('STOPPED:', String(e).split('\n')[0]);
  failed += 1;
} finally {
  await browser.close();
  console.log(failed ? `\n${failed} failed` : '\nthe example demonstrates what it says');
  process.exit(failed ? 1 : 0);
}
