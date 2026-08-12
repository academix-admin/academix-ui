/**
 * Step 5 — stand down where the platform owns the back gesture.
 *
 * The failure this prevents is a double pop: on Android the system gesture is OS-level and cannot
 * be preventDefault'd, so our handler running as well pops twice. The standalone-PWA carve-out is
 * the case most likely to regress, since installed apps have no browser gesture to defer to and
 * would silently lose the ability to go back.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { hasNativeBackGesture } from '../src/gestures/swipe-back';

// jsdom's navigator does not define maxTouchPoints at all, so vi.spyOn(..., 'get') throws
// ("maxTouchPoints does not exist"). Defining own properties works whether or not the prototype
// has the key; they are deleted afterwards so the prototype values show through again.
const PATCHED = ['userAgent', 'platform', 'maxTouchPoints', 'standalone'] as const;

function define(prop: string, value: unknown) {
  Object.defineProperty(navigator, prop, { value, configurable: true, writable: true });
}

function setPlatform(opts: { ua?: string; platform?: string; touchPoints?: number; standalone?: boolean; displayMode?: boolean }) {
  define('userAgent', opts.ua ?? '');
  define('platform', opts.platform ?? '');
  define('maxTouchPoints', opts.touchPoints ?? 0);
  define('standalone', opts.standalone);
  vi.spyOn(window, 'matchMedia').mockImplementation(
    ((q: string) => ({ matches: !!opts.displayMode && q.includes('standalone'), media: q })) as unknown as typeof window.matchMedia,
  );
}

function restorePlatform() {
  for (const p of PATCHED) {
    delete (navigator as unknown as Record<string, unknown>)[p];
  }
}

const IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15';
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120';
const DESKTOP = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120';

describe('hasNativeBackGesture', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    restorePlatform();
  });

  it('is true in mobile Safari (its edge-swipe owns the same region)', () => {
    setPlatform({ ua: IOS });
    expect(hasNativeBackGesture()).toBe(true);
  });

  it('is true on Android (system back gesture cannot be preventDefault-ed)', () => {
    setPlatform({ ua: ANDROID });
    expect(hasNativeBackGesture()).toBe(true);
  });

  it('is FALSE on desktop, where there is no touch back gesture', () => {
    setPlatform({ ua: DESKTOP });
    expect(hasNativeBackGesture()).toBe(false);
  });

  it('is FALSE in an installed iOS PWA — ours is the only gesture there', () => {
    setPlatform({ ua: IOS, standalone: true });
    expect(hasNativeBackGesture()).toBe(false);
  });

  it('is FALSE in standalone display-mode on Android', () => {
    setPlatform({ ua: ANDROID, displayMode: true });
    expect(hasNativeBackGesture()).toBe(false);
  });

  it('detects iPadOS 13+, which reports itself as MacIntel', () => {
    setPlatform({ ua: DESKTOP, platform: 'MacIntel', touchPoints: 5 });
    expect(hasNativeBackGesture()).toBe(true);
  });

  it('does not mistake a real Mac for an iPad', () => {
    setPlatform({ ua: DESKTOP, platform: 'MacIntel', touchPoints: 0 });
    expect(hasNativeBackGesture()).toBe(false);
  });
});
