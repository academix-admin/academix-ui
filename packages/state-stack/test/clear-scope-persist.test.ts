/**
 * clearScope() must clear what is PERSISTED, not only what happens to be in memory.
 *
 * It iterated `this.stacks.get(scope)` plus orphaned `loadedKeys` — both in-memory structures. A key
 * that was persisted in an earlier session, or whose entry has since been evicted, is in neither, so
 * its stored record survived the clear and rehydrated on the next visit.
 *
 * That is the shape of the reported bug: leaving a flow appears to clear it (the in-memory values
 * really do go), and the stale data only reappears later, on a fresh load, far from the clear that
 * was supposed to have removed it. A scope-scoped clear that leaves the durable copy behind is the
 * worst of both — it looks correct at the moment it runs.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StateStack, initStateStack, type StorageAdapter } from '../src/index';

const SEP = '::';

function makeAdapter(seed: Record<string, string> = {}) {
  const map = new Map<string, string>(Object.entries(seed));
  const adapter: StorageAdapter = {
    getItem: vi.fn(async (k: string) => map.get(k) ?? null),
    setItem: vi.fn(async (k: string, v: string) => { map.set(k, v); }),
    removeItem: vi.fn(async (k: string) => { map.delete(k); }),
    clear: vi.fn(async () => map.clear()),
    getAllKeys: vi.fn(async () => [...map.keys()]),
  };
  return { adapter, map };
}

describe('clearScope persistence', () => {
  beforeEach(() => { initStateStack({ storagePrefix: '' }); });

  it('removes persisted keys the current session never hydrated', async () => {
    // Exactly the cold-load case: the records exist, this session has never read them, so nothing
    // about them is in memory.
    const { adapter, map } = makeAdapter({
      [`mission_flow${SEP}missionData`]: '{"v":1}',
      [`mission_flow${SEP}missionProgress`]: '{"v":2}',
      [`secondary_flow${SEP}other`]: '{"v":3}',
    });
    initStateStack({ defaultStorageAdapter: adapter });

    await StateStack.core.clearScope('mission_flow');

    expect(map.has(`mission_flow${SEP}missionData`),
      'a persisted key the session never touched must still be cleared').toBe(false);
    expect(map.has(`mission_flow${SEP}missionProgress`)).toBe(false);
    expect(map.has(`secondary_flow${SEP}other`),
      'clearing one scope must not touch another').toBe(true);
  });

  it('does not clear a scope whose name is a prefix of the target', async () => {
    // 'mission' vs 'mission_flow' — matching on the raw name would take both. The separator is what
    // makes the boundary exact, and getting this wrong silently destroys an unrelated flow.
    const { adapter, map } = makeAdapter({
      [`mission${SEP}k`]: 'a',
      [`mission_flow${SEP}k`]: 'b',
    });
    initStateStack({ defaultStorageAdapter: adapter });

    await StateStack.core.clearScope('mission');

    expect(map.has(`mission${SEP}k`), 'the target scope is cleared').toBe(false);
    expect(map.has(`mission_flow${SEP}k`),
      'a different scope that merely starts with the same text must survive').toBe(true);
  });

  it('honours the storagePrefix', async () => {
    const { adapter, map } = makeAdapter({ [`app:mission_flow${SEP}k`]: 'a' });
    initStateStack({ defaultStorageAdapter: adapter, storagePrefix: 'app' });

    await StateStack.core.clearScope('mission_flow');

    expect(map.has(`app:mission_flow${SEP}k`)).toBe(false);
  });

  it('leaves persisted data alone when asked not to remove it', async () => {
    const { adapter, map } = makeAdapter({ [`keep_flow${SEP}k`]: 'a' });
    initStateStack({ defaultStorageAdapter: adapter });

    await StateStack.core.clearScope('keep_flow', false);

    expect(map.has(`keep_flow${SEP}k`),
      'removePersist=false must still mean the durable copy stays').toBe(true);
  });
});
