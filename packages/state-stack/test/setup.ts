// Polyfill IndexedDB for the jsdom environment (state-stack is IndexedDB-first).
import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';
