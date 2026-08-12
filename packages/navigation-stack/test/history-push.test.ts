/**
 * Step 1 — real browser history entries.
 *
 * These target the history bookkeeping directly rather than through React, because the risky part
 * is not "does a page render" but "how many entries did we create, and how many are we allowed to
 * give back". Over-consuming walks the user off the front of our history and out of the app.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  updateNavQueryParamForStack,
  consumeHistoryEntries,
  getPushDepth,
  resetPushDepth,
} from '../src/core/persistence';

describe('history push/consume bookkeeping', () => {
  beforeEach(() => {
    resetPushDepth('s1');
    resetPushDepth('s2');
    window.history.replaceState({}, '', '/app');
    vi.restoreAllMocks();
  });

  it('defaults to replace, so existing callers gain no history entries', () => {
    const push = vi.spyOn(window.history, 'pushState');
    const replace = vi.spyOn(window.history, 'replaceState');

    updateNavQueryParamForStack('s1', 'a.b', null, null); // no mode argument

    expect(push).not.toHaveBeenCalled();
    expect(replace).toHaveBeenCalled();
    expect(getPushDepth('s1')).toBe(0);
  });

  it("mode 'push' creates exactly one entry per navigation", () => {
    const push = vi.spyOn(window.history, 'pushState');

    updateNavQueryParamForStack('s1', 'a.b', null, null, 'push');

    // Exactly one: the replace path writes twice for groups, and duplicating that here would
    // require two Back presses to move one page.
    expect(push).toHaveBeenCalledTimes(1);
    expect(getPushDepth('s1')).toBe(1);
  });

  it('does not create an entry when the URL is unchanged', () => {
    updateNavQueryParamForStack('s1', 'a.b', null, null, 'push');
    const push = vi.spyOn(window.history, 'pushState');

    updateNavQueryParamForStack('s1', 'a.b', null, null, 'push'); // same path again

    expect(push).not.toHaveBeenCalled();
    expect(getPushDepth('s1')).toBe(1);
  });

  it('consumes only as many entries as it pushed', () => {
    const go = vi.spyOn(window.history, 'go').mockImplementation(() => {});

    updateNavQueryParamForStack('s1', 'a', null, null, 'push');
    updateNavQueryParamForStack('s1', 'a.b', null, null, 'push');
    expect(getPushDepth('s1')).toBe(2);

    expect(consumeHistoryEntries('s1', 2)).toBe(2);
    expect(go).toHaveBeenCalledWith(-2);
    expect(getPushDepth('s1')).toBe(0);
  });

  it('CLAMPS a deep pop to entries we actually pushed (deep-link safety)', () => {
    const go = vi.spyOn(window.history, 'go').mockImplementation(() => {});

    // A user who deep-linked straight into a nested page has ONE entry, not four.
    updateNavQueryParamForStack('s1', 'a.b.c.d', null, null, 'push');
    expect(getPushDepth('s1')).toBe(1);

    // popToRoot from depth 4 asks for 3; only 1 is ours to give.
    expect(consumeHistoryEntries('s1', 3)).toBe(1);
    expect(go).toHaveBeenCalledWith(-1);
    expect(go).not.toHaveBeenCalledWith(-3); // -3 would leave the site
    expect(getPushDepth('s1')).toBe(0);
  });

  it('is a no-op when nothing was pushed', () => {
    const go = vi.spyOn(window.history, 'go').mockImplementation(() => {});
    expect(consumeHistoryEntries('s1', 5)).toBe(0);
    expect(go).not.toHaveBeenCalled();
  });

  it('tracks depth per stack, not globally', () => {
    updateNavQueryParamForStack('s1', 'a', null, null, 'push');
    updateNavQueryParamForStack('s2', 'x', null, null, 'push');
    updateNavQueryParamForStack('s2', 'x.y', null, null, 'push');

    expect(getPushDepth('s1')).toBe(1);
    expect(getPushDepth('s2')).toBe(2);

    vi.spyOn(window.history, 'go').mockImplementation(() => {});
    consumeHistoryEntries('s2', 2);

    expect(getPushDepth('s1')).toBe(1); // untouched
    expect(getPushDepth('s2')).toBe(0);
  });

  it('keeps the nav param correct regardless of mode', () => {
    updateNavQueryParamForStack('s1', 'a.b', null, null, 'push');
    expect(new URL(window.location.href).searchParams.get('nav')).toBe('s1:a.b');

    updateNavQueryParamForStack('s1', 'a', null, null, 'replace');
    expect(new URL(window.location.href).searchParams.get('nav')).toBe('s1:a');
  });
});
