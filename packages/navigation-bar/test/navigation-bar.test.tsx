import { describe, it, expect } from 'vitest';
import NavigationBar, { NavigationBar as Named } from '../src/index';

describe('@academix/navigation-bar', () => {
  it('exports a default component (and named alias)', () => {
    expect(typeof NavigationBar).toBe('function');
    expect(Named).toBe(NavigationBar);
  });
});
