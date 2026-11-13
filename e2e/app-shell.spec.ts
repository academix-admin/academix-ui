/**
 * THE APP SHELL ON PHONE-SHAPED ENGINES — examples/app-shell, as a person uses it.
 *
 * No test browser raises a soft keyboard, so the KEYBOARD is stood in for: `window.visualViewport` is a
 * controllable copy, and "the keyboard comes up" is that copy getting shorter, as it does on a phone.
 * Everything else is the real engine: WebKit's touch events and pointer types, CSS, history, layout.
 */
import { test, expect, type Page } from '@playwright/test';

const phone = (name: string) => name === 'iphone' || name === 'android';

/** A visual viewport the test can shrink, as a keyboard does. */
async function standInViewport(page: Page) {
  await page.addInitScript(() => {
    // Read live, as a real one is: at document start the window is not yet the phone's size (the
    // viewport tag applies later), and a copy taken then measured a keyboard that was never there.
    let keyboardHeight = 0;
    const vv = Object.assign(new EventTarget(), { offsetTop: 0, offsetLeft: 0, scale: 1 });
    Object.defineProperty(vv, 'width', { get: () => window.innerWidth });
    Object.defineProperty(vv, 'height', { get: () => window.innerHeight - keyboardHeight });
    Object.defineProperty(window, 'visualViewport', { configurable: true, get: () => vv });
    (window as unknown as { __keyboard: (h: number) => void }).__keyboard = (h) => {
      keyboardHeight = h;
      vv.dispatchEvent(new Event('resize'));
    };
  });
}
const keyboard = (page: Page, height: number) =>
  page.evaluate((h) => (window as unknown as { __keyboard: (h: number) => void }).__keyboard(h), height);
const flag = (page: Page) => page.evaluate(() => document.documentElement.getAttribute('data-ax-keyboard'));
const bar = (page: Page) => page.locator('[data-ax-shell="demo"] .ax-shell__bar');
/** The tab bar draws itself fixed at the foot, so its wrapper has no height: look at its tabs. */
const barTabs = (page: Page) => bar(page).getByText('People', { exact: true });
const side = (page: Page) => page.locator('[data-ax-shell="demo"] .ax-shell__side');
const tab = (page: Page, name: string) =>
  (phone(test.info().project.name) ? bar(page) : side(page)).getByText(name, { exact: true }).first();
const heading = (page: Page, name: string) => page.getByRole('heading', { name, exact: true }).locator('visible=true');

test.beforeEach(async ({ page }) => {
  await standInViewport(page);
  await page.goto('/');
  await expect(heading(page, 'Stock')).toBeVisible();
});

test('a phone has the tab bar and no sidebar; a wide screen the sidebar and no bar', async ({ page }, info) => {
  if (phone(info.project.name)) {
    await expect(barTabs(page)).toBeVisible();
    await expect(side(page)).toBeHidden();
  } else {
    await expect(side(page)).toBeVisible();
    await expect(barTabs(page)).toBeHidden();
  }
});

test('a tab keeps its place when you leave it and come back', async ({ page }) => {
  await page.getByRole('button', { name: 'Product 3', exact: true }).click();
  await page.getByRole('button', { name: 'Sell some →' }).click();
  await expect(heading(page, 'Sell Product 3')).toBeVisible();
  await tab(page, 'People').click();
  await expect(heading(page, 'People')).toBeVisible();
  await tab(page, 'Stock').click();
  await expect(heading(page, 'Sell Product 3')).toBeVisible();
});

test('tapping the open tab goes back to its first page', async ({ page }) => {
  await page.getByRole('button', { name: 'Product 2', exact: true }).click();
  await page.getByRole('button', { name: 'Sell some →' }).click();
  await expect(heading(page, 'Sell Product 2')).toBeVisible();
  await tab(page, 'Stock').click();
  await expect(heading(page, 'Stock')).toBeVisible();
});

test('Back pops the tab on screen, never another tab', async ({ page }) => {
  await page.getByRole('button', { name: 'Product 1', exact: true }).click();
  await expect(heading(page, 'Product 1')).toBeVisible();
  await tab(page, 'People').click();
  await page.getByRole('button', { name: 'Customer 2', exact: true }).click();
  await expect(heading(page, 'Customer 2')).toBeVisible();
  await tab(page, 'Stock').click();
  await expect(heading(page, 'Product 1')).toBeVisible();
  await page.goBack();
  await expect(heading(page, 'Stock')).toBeVisible();
  // People was not touched by it (13 Nov: it went back to its first page).
  await tab(page, 'People').click();
  await expect(heading(page, 'Customer 2')).toBeVisible();
  // And Back on People pops People, leaving Stock where it is.
  await page.goBack();
  await expect(heading(page, 'People')).toBeVisible();
  await tab(page, 'Stock').click();
  await expect(heading(page, 'Stock')).toBeVisible();
});

test('a page can open another tab', async ({ page }) => {
  await page.getByRole('button', { name: 'Go to People' }).click();
  await expect(heading(page, 'People')).toBeVisible();
});

test('full screen hides the tab bar and the sidebar, and the pages stay', async ({ page }) => {
  await page.getByRole('button', { name: 'Product 5', exact: true }).click();
  await page.getByRole('button', { name: '‹ Back' }).locator('visible=true').click();
  await page.getByRole('button', { name: 'Full screen' }).click();
  await expect(bar(page)).toHaveCount(0);
  await expect(side(page)).toHaveCount(0);
  await expect(heading(page, 'Stock')).toBeVisible();
  await page.getByRole('button', { name: 'Leave full screen' }).click();
  await expect(phone(test.info().project.name) ? barTabs(page) : side(page)).toBeVisible();
});

test.describe('the keyboard', () => {
  test.beforeEach(async ({}, info) => {
    test.skip(!phone(info.project.name), 'a phone thing');
  });

  async function toTheForm(page: Page) {
    await page.getByRole('button', { name: 'Product 7', exact: true }).click();
    await page.getByRole('button', { name: 'Sell some →' }).click();
    await expect(heading(page, 'Sell Product 7')).toBeVisible();
  }

  test('a tapped field hides the tab bar at once; the shell follows the keyboard; the bar comes back when it goes', async ({ page }) => {
    await toTheForm(page);
    await page.getByLabel('How many').tap();
    expect(await flag(page)).toBe('open');
    await expect(barTabs(page)).toBeHidden();
    // The keyboard arrives: the shell is what is left above it.
    await keyboard(page, 300);
    const inner = await page.evaluate(() => window.innerHeight);
    await expect.poll(async () => Math.round((await page.locator('[data-ax-shell="demo"]').boundingBox())?.height ?? 0)).toBe(inner - 300);
    // Swiped away, the field still focused: the bar is back.
    await keyboard(page, 0);
    await expect.poll(() => flag(page)).toBeNull();
    await expect(barTabs(page)).toBeVisible();
  });

  test('the cursor put back in a box from code raises no keyboard, and the tab bar stays (12 Nov)', async ({ page }) => {
    await toTheForm(page);
    await page.getByRole('button', { name: 'Add' }).tap();
    await expect(page.getByText('1 added')).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.activeElement?.getAttribute('aria-label'))).toBe('How many');
    await page.waitForTimeout(1200);
    expect(await flag(page)).toBeNull();
    await expect(barTabs(page)).toBeVisible();
  });

  test('a tapped field whose keyboard never comes gives the bar back', async ({ page }) => {
    await toTheForm(page);
    await page.getByLabel('How many').tap();
    expect(await flag(page)).toBe('open');
    await page.waitForTimeout(1300);
    expect(await flag(page)).toBeNull();
    await expect(barTabs(page)).toBeVisible();
  });
});

test('a pill on the bar\'s line knows where the bar is', async ({ page }, info) => {
  await expect(page.getByTestId('total')).toHaveAttribute('data-bar', phone(info.project.name) ? 'shown' : 'hidden');
});

test('the shell\'s CSS is in the page before anything runs', async ({ page }) => {
  const html = await (await page.request.get('/')).text();
  // The example is client-rendered, so this checks the style is drawn with the shell, in the DOM.
  expect(html).toContain('id="root"');
  await expect(page.locator('style[data-ax-shell-style="demo"]')).toHaveCount(1);
});
