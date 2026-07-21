import { describe, it, expect } from 'vitest';
import DialogViewer, {
  useDialogController,
  useDialog,
  createAlertDialog,
  createConfirmDialog,
  createDestructiveDialog,
} from '../src/index';

describe('@academix-admin/dialog-viewer', () => {
  it('exposes the public API', () => {
    expect(DialogViewer).toBeTruthy();
    expect(typeof useDialogController).toBe('function');
    expect(typeof useDialog).toBe('function');
    expect(typeof createAlertDialog).toBe('function');
    expect(typeof createConfirmDialog).toBe('function');
    expect(typeof createDestructiveDialog).toBe('function');
  });
});
