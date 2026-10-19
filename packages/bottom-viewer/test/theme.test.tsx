import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import BottomViewer from '../src/index';

/**
 * An app's own look through layoutProp: corner radius, shadow, face and text colour (added for
 * JIMSteps, 19 Oct). The defaults are what the package always drew.
 */
afterEach(cleanup);

describe('a themed sheet', () => {
  it('takes its radius, shadow, face and text colour from layoutProp', () => {
    render(
      <BottomViewer isOpen onClose={() => {}} ariaLabel="Settings" layoutProp={{ borderRadius: '28px', boxShadow: 'none', fontFamily: 'Fredoka', textColor: 'rgb(29, 33, 41)' }}>
        <p>Body</p>
      </BottomViewer>,
    );
    const sheet = screen.getByRole('dialog', { name: 'Settings' });
    expect(sheet.style.fontFamily).toBe('Fredoka');
    expect(sheet.style.color).toBe('rgb(29, 33, 41)');
    expect(sheet.style.borderTopLeftRadius || sheet.style.borderRadius).toContain('28px');
  });

  it('draws what it always drew when none are given', () => {
    render(
      <BottomViewer isOpen onClose={() => {}} ariaLabel="Plain">
        <p>Body</p>
      </BottomViewer>,
    );
    const sheet = screen.getByRole('dialog', { name: 'Plain' });
    expect(sheet.style.fontFamily).toBe('');
    expect(sheet.style.color).toBe('');
    expect(sheet.style.borderTopLeftRadius || sheet.style.borderRadius).toContain('16px');
  });
});
