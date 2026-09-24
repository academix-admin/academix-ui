/**
 * A STACK, WRITTEN AS A PATH — and read back from one.
 *
 * `?nav=` says where you are in a codec only this library can read. That is right for the tabs you
 * are not looking at, and wrong for the one you are: a person cannot read it, a crawler cannot index
 * it, and a link pasted into a message tells the person receiving it nothing.
 *
 *     /stock/product/gulder-60cl~2d6ab81c-0e67-4bcd-ae22-38160f0f1965
 *      │     │       │           └─ the params: the identity
 *      │     │       └───────────── the page's own title, from nav.title()
 *      │     └───────────────────── the route key, slugified
 *      └─────────────────────────── the page underneath
 *
 * THE WORDS COME FIRST, and that is about ids being uuids as often as they are numbers. Put the
 * identity first and a real URL opens with thirty-six characters of noise before the only part a
 * person reads — and a search result truncates the tail, so the keywords are exactly what is lost.
 *
 * The words ride WITH the identity rather than in a segment of their own, because a segment of
 * their own cannot be told apart from the first segment of a NESTED stack — both are simply
 * something this stack does not recognise.
 *
 * NOTHING HERE IS CONFIGURED. `navLink` already declares every route a stack has, which makes it
 * both the writer's vocabulary and the reader's schema: walking the segments, anything that names a
 * route starts a new entry and anything that does not belongs to the entry before it. A second map
 * of paths would be a second thing to keep in step with the first, and it would drift.
 *
 * The slug is DECORATION. Identity lives in the params, so renaming a page — or translating it —
 * changes the URL's words and never its meaning. This is the shape Stack Overflow uses for
 * `/questions/12345/why-does-this-happen`, and for the same reason.
 *
 * Pure: no React, no window, no history. Given the same stack and the same navLink it produces the
 * same string, and reading that string gives the stack back.
 */

import type { NavParams, NavigationMap, StackEntry } from '../types';

/** Words a person can read, in a URL. */
export function slugify(input: string): string {
  return String(input)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/**
 * The segment that names a route.
 *
 * A trailing `_page` is dropped, because every route in a real app carries it and `/product` reads
 * better than `/product-page` — but only when dropping it does not collide with another route in
 * the same map. A prettier URL is not worth two routes answering to one name.
 */
export function routeSlugs(navLink: NavigationMap): Map<string, string> {
  const keys = Object.keys(navLink);
  const trimmed = new Map<string, string>();
  const seen = new Map<string, number>();

  for (const key of keys) {
    const short = slugify(key.replace(/[_-]?page$/i, '')) || slugify(key);
    seen.set(short, (seen.get(short) ?? 0) + 1);
  }
  for (const key of keys) {
    const short = slugify(key.replace(/[_-]?page$/i, '')) || slugify(key);
    trimmed.set(key, (seen.get(short) ?? 0) > 1 ? slugify(key) : short);
  }
  return trimmed;
}

/**
 * Params as one segment.
 *
 * One param is its bare value, which is the common case and the readable one (`/product/7`). Several
 * become `name=value` pairs joined by `;`, which is ugly and honest — a URL that cannot say which
 * value is which is a URL that cannot be read back.
 */
export function encodeParams(params: NavParams): string | null {
  if (!params) return null;
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null);
  if (entries.length === 0) return null;
  const safe = (v: unknown) => encodeURIComponent(String(v)).replace(/~/g, '%7E');
  if (entries.length === 1) return safe(entries[0][1]);
  return entries.map(([k, v]) => `${safe(k)}=${safe(v)}`).join(';');
}

/** The reverse, given the names the single-param form leaves out. */
export function decodeParams(segment: string, soleParamName?: string): NavParams {
  if (!segment) return undefined;
  // The words come first; the identity is everything after the first ~. A slug is [a-z0-9-] only,
  // so it can never contain one, which is what makes this unambiguous with a uuid on the other side.
  const tilde = segment.indexOf('~');
  if (tilde >= 0) segment = segment.slice(tilde + 1);
  if (!segment) return undefined;
  if (segment.includes('=')) {
    const out: Record<string, string> = {};
    for (const pair of segment.split(';')) {
      const i = pair.indexOf('=');
      if (i < 0) continue;
      out[decodeURIComponent(pair.slice(0, i))] = decodeURIComponent(pair.slice(i + 1));
    }
    return Object.keys(out).length ? out : undefined;
  }
  // A bare value only means something if we know what it was called.
  if (!soleParamName) return undefined;
  return { [soleParamName]: decodeURIComponent(segment) };
}

/**
 * What a bare value is called, for each route.
 *
 * `/product/7` has to become `{ id: 7 }` again, and the name is not in the URL. It is remembered
 * from the push that wrote it — the stack is the record of its own vocabulary — and falls back to
 * `id`, which is what a single param almost always is.
 */
export type SoleParamNames = Record<string, string>;

export function soleParamNamesOf(stack: StackEntry[]): SoleParamNames {
  const names: SoleParamNames = {};
  for (const entry of stack) {
    const keys = entry.params ? Object.keys(entry.params) : [];
    if (keys.length === 1) names[entry.key] = keys[0];
  }
  return names;
}

/** Write a stack as a path. Always absolute, never trailing-slashed. */
export function buildPath(stack: StackEntry[], navLink: NavigationMap): string {
  const slugs = routeSlugs(navLink);
  const out: string[] = [];

  for (const entry of stack) {
    const routeSlug = slugs.get(entry.key) ?? slugify(entry.key);
    out.push(routeSlug);

    const params = encodeParams(entry.params);
    if (params) {

      /*
       * The page's own name, but ONLY where there are params to decorate.
       *
       * The slug is decoration on an identity. A page with no params is already named by its route
       * slug — /stock says stock — and adding a second word there would be unreadable in the other
       * direction: one unrecognised segment after a route would be either params or a title, and
       * nothing in the URL says which. Tied to params, a title is always the third segment and
       * never ambiguous.
       */
      const title = entry.metadata?.title ? slugify(entry.metadata.title) : '';
      out.push(title && title !== routeSlug ? `${title}~${params}` : params);
    }
  }

  return out.length ? `/${out.join('/')}` : '/';
}

export interface ParsedPathEntry {
  key: string;
  params: NavParams;
}

/**
 * Read a path back into entries, and say what it could not account for.
 *
 * The leftovers matter: a NESTED stack's segments sit at the end of its parent's path, and the
 * parent cannot resolve them because they belong to a different `navLink` that is not mounted yet.
 * So the parent takes what it recognises and hands the rest on, the way each level of a nested
 * route resolves only its own part.
 */
export function parsePath(
  path: string,
  navLink: NavigationMap,
  soleParamNames: SoleParamNames = {},
): { entries: ParsedPathEntry[]; rest: string[] } {
  const slugs = routeSlugs(navLink);
  const bySlug = new Map<string, string>();
  for (const [key, slug] of slugs) bySlug.set(slug, key);

  const segments = String(path).split('/').filter(Boolean);
  const entries: ParsedPathEntry[] = [];
  let i = 0;

  // Anything before the first route we recognise belongs to whoever mounted us (e.g. `/main`).
  while (i < segments.length && !bySlug.has(segments[i])) i += 1;
  if (i >= segments.length) return { entries, rest: segments };

  while (i < segments.length) {
    const key = bySlug.get(segments[i]);
    if (!key) break; // Not ours — a nested stack's, and it gets the remainder.
    i += 1;

    let params: NavParams;
    // The next segment is this entry's, unless it names a route.
    if (i < segments.length && !bySlug.has(segments[i])) {
      params = decodeParams(segments[i], soleParamNames[key] ?? 'id');
      i += 1;

    }

    entries.push({ key, params });
  }

  return { entries, rest: segments.slice(i) };
}

/**
 * WHERE THIS STACK'S PART OF THE PATH BEGINS.
 *
 * A stack mounted at `/s/7R8U2A` writes its pages after that prefix, and nothing tells it what the
 * prefix is — so it works it out: everything before the first segment that names one of its own
 * routes belongs to whoever mounted it.
 *
 * Derived rather than configured, because a base path passed as a prop is one more thing to keep in
 * step with the route that renders the stack, and it would be wrong the first time either moved.
 */
export function splitBase(path: string, navLink: NavigationMap): { base: string; rest: string } {
  const slugs = new Set(routeSlugs(navLink).values());
  const segments = String(path).split('/').filter(Boolean);

  let i = 0;
  while (i < segments.length && !slugs.has(segments[i])) i += 1;

  return {
    base: i === 0 ? '' : `/${segments.slice(0, i).join('/')}`,
    rest: i >= segments.length ? '' : `/${segments.slice(i).join('/')}`,
  };
}

/** The pathname this stack should be showing, given where it is mounted. */
export function pathnameFor(base: string, stack: StackEntry[], navLink: NavigationMap): string {
  const own = buildPath(stack, navLink);
  const joined = `${base}${own === '/' ? '' : own}`;
  return joined || '/';
}

/**
 * WHAT A URL MEANS, WITHOUT RENDERING ANYTHING.
 *
 * The whole codec in one answer: which pages this address names, which of them is on top, and where
 * the stack is mounted. Pure — no React, no DOM, no history — so it runs in a server component, in a
 * route handler, in a script that builds a sitemap, or in a test.
 *
 * It exists because a server needs to know what a URL means BEFORE any of this renders. Deciding a
 * page's title and its og:image is the app's business — it owns the copy and the data — and all it
 * needs from this library is a straight answer about what the address refers to:
 *
 * ```ts
 * const { top } = resolvePath(pathname, shopRoutes);
 * if (top?.key === 'product_page') {
 *   const product = await fetchProduct(top.params.id);
 *   return { title: `${product.name} — ₦${product.price}` };
 * }
 * ```
 *
 * No coupling in either direction: this hands back plain data, and what happens next is the app's.
 */
export function resolvePath(
  location: string,
  navLink: NavigationMap,
  soleParamNames: SoleParamNames = {},
): {
  /** Where this stack is mounted — everything before its own first route. */
  base: string;
  /** Every page the address names, deepest last. */
  entries: ParsedPathEntry[];
  /** The page on top, which is the one a title and an og:image describe. */
  top: ParsedPathEntry | null;
  /** Segments this stack did not recognise — a nested stack's, if there is one. */
  rest: string[];
} {
  const { base, rest } = splitBase(location, navLink);
  const parsed = parsePath(rest, navLink, soleParamNames);
  return {
    base,
    entries: parsed.entries,
    top: parsed.entries[parsed.entries.length - 1] ?? null,
    rest: parsed.rest,
  };
}
