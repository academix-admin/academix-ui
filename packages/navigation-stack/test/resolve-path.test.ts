/**
 * WHAT A URL MEANS, ANSWERED WITHOUT RENDERING.
 *
 * The capability a server needs before anything renders: which page this address refers to, and with
 * what. What happens next — the title, the og:image, the fetch — belongs to the app, which owns the
 * copy and the data. This library's job ends at a straight answer.
 *
 * Keeping it a plain function rather than a framework integration is what lets the two libraries stay
 * strangers: navigation-stack hands back data, state-stack holds data, and the app joins them. Neither
 * needs to learn the other exists.
 */
import { describe, it, expect } from 'vitest';
import { resolvePath } from '../src/index';

const shopRoutes = {
  shop_page: () => null,
  product_page: () => null,
  category_page: () => null,
};

describe('resolvePath', () => {
  it('says which page an address names, and with what', () => {
    const { top } = resolvePath('/s/7R8U2A/shop/product/gulder-60cl~2d6ab81c', shopRoutes, {
      product_page: 'id',
    });

    expect(top).toEqual({ key: 'product_page', params: { id: '2d6ab81c' } });
  });

  it('is everything a generateMetadata needs, and nothing more', () => {
    // The shape of a real route file: resolve, then the app's own data layer and its own words.
    const { top } = resolvePath('/s/7R8U2A/shop/product/x~7', shopRoutes);
    const title =
      top?.key === 'product_page' ? `product ${top.params?.id}` : 'Ashabi Global Resources';

    expect(title).toBe('product 7');
  });

  it('gives the whole stack, not just the top', () => {
    const { entries, base } = resolvePath('/s/7R8U2A/shop/product/x~7', shopRoutes);
    expect(entries.map((e) => e.key)).toEqual(['shop_page', 'product_page']);
    expect(base).toBe('/s/7R8U2A');
  });

  it('hands back what belongs to a nested stack', () => {
    const { top, rest } = resolvePath('/s/7R8U2A/shop/product/x~7/reviews/12', shopRoutes);
    expect(top?.key).toBe('product_page');
    expect(rest).toEqual(['reviews', '12']);
  });

  it('answers honestly about an address it does not recognise', () => {
    // A crawler follows links that are years old, and a route that was renamed is not an exception.
    const { top, entries } = resolvePath('/s/7R8U2A/something-retired/9', shopRoutes);
    expect(top).toBeNull();
    expect(entries).toEqual([]);
  });

  it('needs no React, no DOM and no history', () => {
    // Which is what lets it run in a server component, a route handler, or a sitemap script.
    expect(typeof resolvePath).toBe('function');
    expect(resolvePath('/shop', shopRoutes).top?.key).toBe('shop_page');
  });
});
