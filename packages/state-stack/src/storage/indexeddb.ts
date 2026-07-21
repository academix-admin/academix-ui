// IndexedDB storage adapter (+ shared singleton instance).

import type { StorageAdapter } from '../types';

export class IndexedDBAdapter implements StorageAdapter {
  private readonly dbName = 'StateStackDB';
  private readonly storeName = 'state';
  private readonly version = 1;
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  private async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise<IDBDatabase>((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not available'));
        return;
      }

      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });

    return this.initPromise;
  }

  private async getStore(
    mode: IDBTransactionMode = 'readonly'
  ): Promise<IDBObjectStore> {
    const db = await this.init();
    return db.transaction([this.storeName], mode).objectStore(this.storeName);
  }

  async getItem(key: string): Promise<string | null> {
    try {
      const store = await this.getStore();
      return new Promise<string | null>((resolve, reject) => {
        const req = store.get(key);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve(req.result ?? null);
      });
    } catch (err) {
      console.warn('[IndexedDBAdapter] getItem failed:', err);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      const store = await this.getStore('readwrite');
      return new Promise<void>((resolve, reject) => {
        const req = store.put(value, key);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve();
      });
    } catch (err) {
      console.error('[IndexedDBAdapter] setItem failed:', err);
      throw err;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      const store = await this.getStore('readwrite');
      return new Promise<void>((resolve, reject) => {
        const req = store.delete(key);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve();
      });
    } catch (err) {
      console.error('[IndexedDBAdapter] removeItem failed:', err);
      throw err;
    }
  }

  async clear(): Promise<void> {
    try {
      const store = await this.getStore('readwrite');
      return new Promise<void>((resolve, reject) => {
        const req = store.clear();
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve();
      });
    } catch (err) {
      console.error('[IndexedDBAdapter] clear failed:', err);
      throw err;
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      const store = await this.getStore();
      return new Promise<string[]>((resolve, reject) => {
        const req = store.getAllKeys();
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve(req.result as string[]);
      });
    } catch (err) {
      console.error('[IndexedDBAdapter] getAllKeys failed:', err);
      return [];
    }
  }
}

export const indexedDBAdapter = new IndexedDBAdapter();
