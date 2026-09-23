/**
 * A stack written as a path, and read back.
 *
 * The property that matters is the round trip: whatever a push produces, reading that URL in a fresh
 * window has to give the same stack. Everything else — how pretty it is, whether `_page` is trimmed
 * — is taste. This is arithmetic, so it is tested as arithmetic: no DOM, no React, no history.
 */
import { describe, it, expect } from 'vitest';
import {
  slugify,
  routeSlugs,
  encodeParams,
  decodeParams,
  soleParamNamesOf,
  buildPath,
  parsePath,
} from '../src/model/paths';
import type { StackEntry } from '../src/types';

const navLink = {
  stock_page: () => null,
  product_page: () => null,
  history_page: () => null,
};

const entry = (key: string, params?: Record<string, unknown>, title?: string): StackEntry => ({
  uid: `u:${key}`,
  key,
  params,
  metadata: title ? { title } : undefined,
});

describe('slugs', () => {
  it('makes words a URL can carry', () => {
    expect(slugify('Gulder 60cl')).toBe('gulder-60cl');
    expect(slugify('  Ìrèkànmí  ')).toBe('irekanmi');
    expect(slugify('Are you sure?!')).toBe('are-you-sure');
  });

  it('drops a trailing _page, because every route has one', () => {
    const slugs = routeSlugs(navLink);
    expect(slugs.get('product_page')).toBe('product');
    expect(slugs.get('stock_page')).toBe('stock');
  });

  it('keeps it when dropping it would make two routes answer to one name', () => {
    // A prettier URL is not worth an ambiguous one.
    const slugs = routeSlugs({ product: () => null, product_page: () => null });
    expect(slugs.get('product')).toBe('product');
    expect(slugs.get('product_page')).toBe('product-page');
  });
});

describe('params in a segment', () => {
  it('one param is its bare value', () => {
    expect(encodeParams({ id: 7 })).toBe('7');
    expect(decodeParams('7', 'id')).toEqual({ id: '7' });
  });

  it('several are named, because a URL that cannot say which is which cannot be read back', () => {
    expect(encodeParams({ id: 7, tab: 'sales' })).toBe('id=7;tab=sales');
    expect(decodeParams('id=7;tab=sales')).toEqual({ id: '7', tab: 'sales' });
  });

  it('survives characters a path would otherwise eat', () => {
    const encoded = encodeParams({ code: 'a/b c' })!;
    expect(encoded).not.toContain('/');
    expect(decodeParams(encoded, 'code')).toEqual({ code: 'a/b c' });
  });

  it('nothing to say is nothing written', () => {
    expect(encodeParams(undefined)).toBeNull();
    expect(encodeParams({})).toBeNull();
    expect(encodeParams({ id: undefined })).toBeNull();
  });
});

describe('a stack as a path', () => {
  it('names the route, the identity, and then the page', () => {
    const stack = [entry('stock_page'), entry('product_page', { id: 7 }, 'Gulder 60cl')];
    expect(buildPath(stack, navLink)).toBe('/stock/product/7~gulder-60cl');
  });

  it('leaves the words off where there is no identity to decorate', () => {
    // One unrecognised segment after a route would be either params or a title, and nothing in the
    // URL would say which.
    const stack = [entry('stock_page', undefined, 'All your stock')];
    expect(buildPath(stack, navLink)).toBe('/stock');
  });

  it('a page with no name still has a URL', () => {
    const stack = [entry('stock_page'), entry('product_page', { id: 7 })];
    expect(buildPath(stack, navLink)).toBe('/stock/product/7');
  });
});

describe('reading it back', () => {
  const roundTrip = (stack: StackEntry[]) => {
    const path = buildPath(stack, navLink);
    const { entries } = parsePath(path, navLink, soleParamNamesOf(stack));
    return { path, entries };
  };

  it('gives back what was pushed', () => {
    const stack = [entry('stock_page'), entry('product_page', { id: '7' }, 'Gulder 60cl')];
    const { entries } = roundTrip(stack);
    expect(entries).toEqual([
      { key: 'stock_page', params: undefined },
      { key: 'product_page', params: { id: '7' } },
    ]);
  });

  it('three deep, with the middle one carrying the identity', () => {
    const stack = [
      entry('stock_page'),
      entry('product_page', { id: '7' }, 'Gulder 60cl'),
      entry('history_page'),
    ];
    expect(buildPath(stack, navLink)).toBe('/stock/product/7~gulder-60cl/history');
    const { entries } = roundTrip(stack);
    expect(entries.map((e) => e.key)).toEqual(['stock_page', 'product_page', 'history_page']);
  });

  it('IGNORES the words, so renaming a page does not change where it goes', () => {
    // The whole reason identity lives in the params: a title is translated, shortened and corrected,
    // and none of that may alter what a link opens.
    const { entries } = parsePath('/product/7~gulder-60cl', navLink, { product_page: 'id' });
    const renamed = parsePath('/product/7~gulder-600ml-bottle', navLink, { product_page: 'id' });
    expect(entries).toEqual(renamed.entries);
  });

  it('skips whatever mounted the stack, like /main', () => {
    const { entries } = parsePath('/main/stock/product/7', navLink, { product_page: 'id' });
    expect(entries.map((e) => e.key)).toEqual(['stock_page', 'product_page']);
  });

  it('hands the leftovers to whoever owns them — a NESTED stack', () => {
    // The parent cannot resolve segments belonging to a navLink that is not mounted yet, so it takes
    // what it knows and passes the rest down.
    const { entries, rest } = parsePath('/stock/product/7/reviews/12', navLink, { product_page: 'id' });
    expect(entries.map((e) => e.key)).toEqual(['stock_page', 'product_page']);
    expect(rest).toEqual(['reviews', '12']);
  });

  it('a path with nothing of ours in it claims nothing', () => {
    const { entries, rest } = parsePath('/somewhere/else', navLink);
    expect(entries).toEqual([]);
    expect(rest).toEqual(['somewhere', 'else']);
  });

  it('remembers what a bare value was called', () => {
    const stack = [entry('product_page', { productId: 'abc' })];
    expect(soleParamNamesOf(stack)).toEqual({ product_page: 'productId' });
    const { entries } = parsePath(buildPath(stack, navLink), navLink, soleParamNamesOf(stack));
    expect(entries[0].params).toEqual({ productId: 'abc' });
  });

  it('falls back to id when nothing remembers', () => {
    // A cold load has no previous stack to learn from, and a lone param is almost always an id.
    const { entries } = parsePath('/product/7', navLink);
    expect(entries[0].params).toEqual({ id: '7' });
  });
});
