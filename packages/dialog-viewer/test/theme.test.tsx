/**
 * An app's own look through layoutProp: face, title band, button shape (added for JIMSteps, 19 Oct).
 * The defaults are what the package always drew.
 */
import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import DialogViewer from '../src/index';

const styleFor = (id: string) => document.getElementById(`dialog-viewer-styles-${id}`)?.innerHTML ?? '';

describe('a themed dialog', () => {
  afterEach(() => cleanup());

  it('takes its face, title band and button shape from layoutProp', () => {
    render(
      <DialogViewer
        id="game"
        isOpen
        onClose={() => {}}
        title="T"
        message="M"
        layoutProp={{
          fontFamily: 'Fredoka',
          headerBackground: 'linear-gradient(#f80, #e50)',
          headerAlign: 'left',
          titleFontSize: '24px',
          titleFontWeight: 700,
          buttonRadius: '18px',
          buttonFontSize: '20px',
          buttonFontWeight: 700,
          buttonShadow: '0 4px 0 rgba(0,0,0,.2)',
          borderRadius: '28px',
          dangerTextColor: '#111',
        }}
      />,
    );
    const css = styleFor('game');
    expect(css).toMatch(/#game \.dialog-container \{[^}]*font-family: Fredoka;[^}]*overflow: hidden;/);
    expect(css).toMatch(/#game \.dialog-header \{[^}]*text-align: left;[^}]*background: linear-gradient\(#f80, #e50\);/);
    expect(css).toMatch(/#game \.dialog-title \{[^}]*font-size: 24px;[^}]*font-weight: 700;/);
    expect(css).toMatch(/#game \.dialog-button \{[^}]*border-radius: 18px;[^}]*font-size: 20px;[^}]*font-weight: 700;[^}]*box-shadow: 0 4px 0 rgba\(0,0,0,\.2\);/);
    expect(css, 'the radius holds on a phone').toMatch(/@media \(max-width: 480px\)[\s\S]*border-radius: 28px;/);
    expect(css, 'dangerTextColor is no longer overridden').toMatch(/\.dialog-button-danger \{[^}]*color: #111;\s*\}/);
  });

  it('draws what it always drew when none are given', () => {
    render(<DialogViewer id="plain" isOpen onClose={() => {}} title="T" message="M" />);
    const css = styleFor('plain');
    expect(css).toMatch(/#plain \.dialog-header \{[^}]*text-align: center;/);
    expect(css).not.toMatch(/#plain \.dialog-header \{[^}]*background:/);
    expect(css).toMatch(/#plain \.dialog-title \{[^}]*font-size: 18px;[^}]*font-weight: 600;/);
    expect(css).toMatch(/#plain \.dialog-button \{[^}]*border-radius: 8px;[^}]*font-weight: 500;/);
    expect(css).not.toMatch(/#plain \.dialog-button \{[^}]*box-shadow/);
    expect(css).toMatch(/@media \(max-width: 480px\)[\s\S]*border-radius: 16px;/);
  });
});
