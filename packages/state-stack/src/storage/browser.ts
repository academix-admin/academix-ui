// localStorage storage adapter.

import type { StorageAdapter } from '../types';

export const browserStorageAdapter: StorageAdapter = {
  getItem: async (k) =>
    typeof window !== 'undefined'
      ? Promise.resolve(localStorage.getItem(k))
      : Promise.resolve(null),

  setItem: async (k, v) => {
    if (typeof window !== 'undefined') localStorage.setItem(k, v);
  },

  removeItem: async (k) => {
    if (typeof window !== 'undefined') localStorage.removeItem(k);
  },

  clear: async () => {
    if (typeof window !== 'undefined') localStorage.clear();
  },

  getAllKeys: async () =>
    typeof window !== 'undefined' ? Object.keys(localStorage) : [],
};
