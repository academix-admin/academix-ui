/**
 * Compile-time route-key safety. These assertions are types, not runtime behaviour — the value of
 * the feature is that a typo fails `tsc`, so the test is written as type-level expectations that
 * would fail the package typecheck if the generics regressed.
 */
import { describe, it, expect } from 'vitest';
import type { NavStackAPI, RouteKeys, NavigationMap } from '../src/types';

const routes = {
  home: () => null,
  detail: () => null,
} satisfies NavigationMap;

type Keys = RouteKeys<typeof routes>;

describe('RouteKeys', () => {
  it('narrows to the literal route names', () => {
    const valid: Keys[] = ['home', 'detail'];
    expect(valid).toEqual(['home', 'detail']);

    // @ts-expect-error 'typo' is not one of the declared routes
    const invalid: Keys = 'typo';
    expect(invalid).toBe('typo'); // runtime is unaffected; the guarantee is the error above
  });

  it('a typed api rejects unknown keys while the default stays permissive', () => {
    const typed = { push: async (_k: Keys) => true } as unknown as NavStackAPI<Keys>;
    const loose = { push: async (_k: string) => true } as unknown as NavStackAPI;

    // @ts-expect-error unknown route key on a typed api
    void typed.push('nope');
    void typed.push('home');
    void loose.push('anything'); // default K = string keeps existing consumers compiling

    expect(typeof typed.push).toBe('function');
  });
});
