import { describe, it, expect } from 'vitest';
import SideDrawer, { SideDrawer as Named } from '../src/index';

describe('@academix/side-drawer', () => {
  it('exports a default component (and named alias)', () => {
    expect(typeof SideDrawer).toBe('function');
    expect(Named).toBe(SideDrawer);
  });
});
