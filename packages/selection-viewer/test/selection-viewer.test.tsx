import { describe, it, expect } from 'vitest';
import SelectionViewer, { useSelectionController } from '../src/index';

describe('@academix-admin/selection-viewer', () => {
  it('exposes the public API', () => {
    expect(SelectionViewer).toBeTruthy();
    expect(typeof useSelectionController).toBe('function');
  });
});
