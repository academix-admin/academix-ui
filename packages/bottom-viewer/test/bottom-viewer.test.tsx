import { describe, it, expect } from 'vitest';
import BottomViewer, { useBottomController, useBottomSheet } from '../src/index';

describe('@academix-admin/bottom-viewer', () => {
  it('exposes the public API', () => {
    expect(BottomViewer).toBeTruthy();
    expect(typeof useBottomController).toBe('function');
    expect(typeof useBottomSheet).toBe('function');
  });
});
