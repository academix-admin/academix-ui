// No-op fallback storage adapter (used when no persistence is available).

import type { StorageAdapter } from '../types';

export const fallbackStorageAdapter: StorageAdapter = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
  clear: async () => {},
  getAllKeys: async () => [],
};
