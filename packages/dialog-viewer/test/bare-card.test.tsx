/**
 * A dialog whose customView is a whole card of its own: the dialog can draw nothing around it.
 * Added for JIMSteps' question card (19 Oct); the defaults are what the package always drew.
 */
import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import DialogViewer from '../src/index';

const styleFor = (id: string) => document.getElementById(`dialog-viewer-styles-${id}`)?.innerHTML ?? '';

describe('a bare custom card', () => {
  afterEach(() => cleanup());

  it('takes its shadow and content padding from layoutProp', () => {
    render(
      <DialogViewer id="bare" isOpen onClose={() => {}} buttons={[]} showCancel={false} customView={<div>CARD</div>} layoutProp={{ backgroundColor: 'transparent', boxShadow: 'none', contentPadding: '0' }} />,
    );
    const css = styleFor('bare');
    expect(css).toMatch(/#bare \.dialog-container \{[^}]*box-shadow: none;/);
    expect(css).toMatch(/#bare \.dialog-content \{[^}]*padding: 0;/);
  });

  it('keeps the shadow and padding it always had when none are given', () => {
    render(<DialogViewer id="plain" isOpen onClose={() => {}} title="T" message="M" />);
    const css = styleFor('plain');
    expect(css).toContain('box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1)');
    expect(css).toMatch(/#plain \.dialog-content \{[^}]*padding: 0 20px 20px;/);
  });

  it('draws no actions row when there is nothing in it', () => {
    const { container, rerender } = render(<DialogViewer id="a" isOpen onClose={() => {}} buttons={[]} showCancel={false} customView={<div>CARD</div>} />);
    expect(container.ownerDocument.querySelector('#a .dialog-actions')).toBeNull();
    rerender(<DialogViewer id="a" isOpen onClose={() => {}} customView={<div>CARD</div>} />);
    expect(container.ownerDocument.querySelector('#a .dialog-actions'), 'the default OK and Cancel still get their row').not.toBeNull();
  });
});
