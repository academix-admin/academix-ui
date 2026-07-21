// Smart default adapter: IndexedDB-first with localStorage fallback.

import type { StorageAdapter } from '../types';
import { indexedDBAdapter } from './indexeddb';
import { browserStorageAdapter } from './browser';

export const defaultStorageAdapter: StorageAdapter = {
  getItem: async (key) => {
    try {
      return await indexedDBAdapter.getItem(key);
    } catch {
      try {
        return await browserStorageAdapter.getItem(key);
      } catch (err) {
        console.error('[StateStack] All storage adapters failed (getItem):', err);
        return null;
      }
    }
  },

  setItem: async (key, value) => {
    try {
      await indexedDBAdapter.setItem(key, value);
    } catch {
      try {
        await browserStorageAdapter.setItem(key, value);
      } catch (err) {
        console.error('[StateStack] All storage adapters failed (setItem):', err);
        throw err;
      }
    }
  },

  removeItem: async (key) => {
    await Promise.allSettled([
      indexedDBAdapter.removeItem(key),
      browserStorageAdapter.removeItem(key),
    ]);
  },

  clear: async () => {
    await Promise.allSettled([
      indexedDBAdapter.clear(),
      browserStorageAdapter.clear?.() ?? Promise.resolve(),
    ]);
  },

  getAllKeys: async () => {
    const [idbKeys, lsKeys] = await Promise.all([
      indexedDBAdapter.getAllKeys().catch(() => [] as string[]),
      browserStorageAdapter.getAllKeys?.().catch(() => [] as string[]) ??
        Promise.resolve([] as string[]),
    ]);
    return Array.from(new Set([...idbKeys, ...lsKeys]));
  },
};
