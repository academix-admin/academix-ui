import { describe, it, expect } from 'vitest';
import { getCachedLottie, preloadLottie } from '../src/index';

describe('@academix-admin/lottie-cache', () => {
  it('exports its functions', () => {
    expect(typeof getCachedLottie).toBe('function');
    expect(typeof preloadLottie).toBe('function');
  });

  it('returns null for an uncached id', () => {
    expect(getCachedLottie('does-not-exist')).toBeNull();
  });
});
