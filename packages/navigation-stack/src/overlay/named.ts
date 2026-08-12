/**
 * Step 4 — named overlays.
 *
 * `nav.overlay.insert(render)` takes a CLOSURE and mints a random id, so an open overlay cannot be
 * expressed in a URL: you cannot serialize a function, and the id changes every run. That is why a
 * reload or a deep link could never land a user inside an open sheet.
 *
 * A named overlay is addressed by a stable KEY that the app registers up front — exactly how it
 * already registers pages via `navLink`. The URL then carries `key + serializable params`, and the
 * factory turns that back into a component on load.
 *
 * The Library Charter holds: this package still has no idea what a BottomViewer or DialogViewer is.
 * It stores an opaque factory the app supplies and calls it with plain data.
 */
import type { OverlayRender } from '../types';

export type OverlayParams = Record<string, string | number | boolean>;

export type OverlayDescriptor = {
  /** Scope that hosts it: a stack id, or a group id for the group layer. */
  scope: string;
  /** Registered factory key. */
  key: string;
  params?: OverlayParams;
};

export type OverlayFactory = (params: OverlayParams) => OverlayRender;

const _factories = new Map<string, OverlayFactory>();

/**
 * Register a reconstructible overlay. Call once at startup, alongside your route map.
 * Returns an unregister fn (useful in tests and hot-reload).
 */
export function registerOverlayFactory(key: string, factory: OverlayFactory): () => void {
  _factories.set(key, factory);
  return () => { _factories.delete(key); };
}

export function getOverlayFactory(key: string): OverlayFactory | undefined {
  return _factories.get(key);
}

export function clearOverlayFactories(): void {
  _factories.clear();
}

/**
 * JSON rather than a custom delimiter scheme: params are arbitrary user data and would otherwise
 * need escaping rules for every separator. The fragment codec percent-encodes the whole string,
 * so JSON's punctuation is safe in a URL.
 */
export function serializeOverlays(descs: OverlayDescriptor[]): string {
  if (!descs.length) return '';
  return JSON.stringify(
    descs.map((d) => (d.params && Object.keys(d.params).length ? [d.scope, d.key, d.params] : [d.scope, d.key])),
  );
}

/**
 * Parse, defensively. This string comes from the URL bar, so it is untrusted input: it can be
 * truncated by a chat client, hand-edited, or left over from an older release. Anything that does
 * not match the expected shape is dropped rather than throwing — a malformed fragment must not
 * take the app down on boot.
 */
export function parseOverlays(raw: string | null | undefined): OverlayDescriptor[] {
  if (!raw) return [];
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];

  const out: OverlayDescriptor[] = [];
  for (const item of data) {
    if (!Array.isArray(item) || item.length < 2) continue;
    const [scope, key, params] = item as [unknown, unknown, unknown];
    if (typeof scope !== 'string' || !scope) continue;
    if (typeof key !== 'string' || !key) continue;

    let safeParams: OverlayParams | undefined;
    if (params && typeof params === 'object' && !Array.isArray(params)) {
      safeParams = {};
      for (const [k, v] of Object.entries(params as Record<string, unknown>)) {
        // Only primitives survive: nested objects cannot be reconstructed safely and would let a
        // crafted URL smuggle unexpected shapes into a component's props.
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
          safeParams[k] = v;
        }
      }
    }
    out.push(safeParams && Object.keys(safeParams).length ? { scope, key, params: safeParams } : { scope, key });
  }
  return out;
}

/** Stable id for a descriptor, so reopening the same overlay does not stack duplicates. */
export function descriptorId(d: OverlayDescriptor): string {
  return `ax:${d.key}`;
}
