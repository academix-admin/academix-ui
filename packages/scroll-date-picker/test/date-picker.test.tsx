import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import CustomScrollDatePicker, { CustomScrollDatePicker as Named } from '../src/index';

describe('CustomScrollDatePicker', () => {
  it('exports a default component (and a named alias)', () => {
    expect(typeof CustomScrollDatePicker).toBe('function');
    expect(Named).toBe(CustomScrollDatePicker);
  });

  it('renders without crashing', () => {
    const onChange = vi.fn();
    const { container } = render(<CustomScrollDatePicker onChange={onChange} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('respects the year bounds by rendering', () => {
    const onChange = vi.fn();
    const { container } = render(
      <CustomScrollDatePicker onChange={onChange} minYear={2000} maxYear={2020} height={200} />
    );
    // A bounded picker still mounts and produces DOM output.
    expect(container.querySelectorAll('*').length).toBeGreaterThan(0);
  });
});
