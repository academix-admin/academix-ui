/**
 * THE UID RULE, on its own.
 *
 * "An entry is named by its group, its stack, which page it is, and its position." Everything keyed
 * by a uid — scroll position above all — is a fact about one entry that has to survive that entry
 * being thrown away and rebuilt, so this rule is load-bearing for whether the app feels like an app.
 *
 * Until now it could only be exercised through a mounted React tree: the rule was handed the live
 * group context and called it. It takes the group as a VALUE now, so the rule can be checked the
 * way a rule should be — inputs in, string out, no DOM, no React, no jsdom.
 *
 * These are the four bugs it was shaped by, written as arithmetic rather than as a rendered stack.
 */
import { describe, it, expect } from 'vitest';
import { generateCompositeUid, ensureCompositeUid, generateStableUid } from '../src/core/persistence';

const page = (key: string, params?: Record<string, unknown>) => generateStableUid(key, params);

describe('a uid names a place', () => {
  it('is group, stack, page and position', () => {
    expect(generateCompositeUid({ id: 'main' }, 'sell', 'customer', { id: '7' }, 2)).toBe(
      `main:sell:${page('customer', { id: '7' })}:at2`,
    );
  });

  it('says root:root when there is no group at all', () => {
    expect(generateCompositeUid(null, null, 'home')).toBe(`root:root:${page('home')}:at?`);
  });

  it('but a group that has not named itself is NOT the same as no group', () => {
    // The distinction `GroupRef` exists to keep: `null` is "no group", `{ id: null }` is "a group,
    // still unnamed". Collapsing them would rename every entry in a group the moment it was named,
    // and every page the shop had scrolled would reopen at the top.
    const unnamed = generateCompositeUid({ id: null }, 'sell', 'home', undefined, 0);
    const none = generateCompositeUid(null, 'sell', 'home', undefined, 0);
    expect(unnamed).not.toBe(none);
    expect(unnamed).toBe(`null:sell:${page('home')}:at0`);
  });

  it('tells two copies of one page apart, by where they are', () => {
    const first = generateCompositeUid({ id: 'main' }, 'people', 'empties', undefined, 1);
    const again = generateCompositeUid({ id: 'main' }, 'people', 'empties', undefined, 3);
    expect(first).not.toBe(again);
  });

  it('and gives the same answer when the stack is rebuilt', () => {
    // A tab switch unmounts the stack that leaves; coming back rebuilds it from the URL, carrying
    // no uid. Position is what makes the rebuilt entry the same entry — a counter here is what
    // broke scroll restoration once already.
    const built = () => generateCompositeUid({ id: 'main' }, 'stock', 'product', { id: '9' }, 4);
    expect(built()).toBe(built());
  });
});

describe('a uid read back from storage', () => {
  it('is kept when it already names one entry', () => {
    const mine = 'main:sell:uid_123:at2';
    expect(ensureCompositeUid(mine, { id: 'main' }, 'sell', 'home', undefined, 2)).toBe(mine);
  });

  it('is regenerated when it only names a page', () => {
    // Three segments is a uid written before uids were per-entry: a stack holding two of the same
    // page would carry it twice, and React would render both under one key.
    const old = 'main:sell:uid_123';
    expect(ensureCompositeUid(old, { id: 'main' }, 'sell', 'home', undefined, 2)).toBe(
      `main:sell:${page('home')}:at2`,
    );
  });

  it('and is generated from scratch when there is none', () => {
    expect(ensureCompositeUid(undefined, null, null, 'home', undefined, 0)).toBe(
      `root:root:${page('home')}:at0`,
    );
  });
});
