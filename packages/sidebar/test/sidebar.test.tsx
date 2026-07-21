import { describe, it, expect } from 'vitest';
import Sidebar, { Sidebar as Named } from '../src/index';

describe('@academix/sidebar', () => {
  it('exports a default component (and named alias)', () => {
    expect(typeof Sidebar).toBe('function');
    expect(Named).toBe(Sidebar);
  });
});
