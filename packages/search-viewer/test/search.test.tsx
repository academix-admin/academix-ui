import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { SearchViewer, MultipleSearchViewer, EachViewer, useSearchController } from '../src/index';

describe('search-viewer exports', () => {
  it('exposes the public components and controller', () => {
    expect(typeof SearchViewer).toBe('function');
    expect(typeof MultipleSearchViewer).toBe('function');
    expect(typeof EachViewer).toBe('function');
    expect(typeof useSearchController).toBe('function');
  });
});

describe('useSearchController', () => {
  it('returns [searchId, operations, isOpen, searchState]', () => {
    const { result } = renderHook(() => useSearchController());
    const [searchId, ops, isOpen, searchState] = result.current;
    expect(typeof searchId).toBe('string');
    expect(searchId.length).toBeGreaterThan(0);
    expect(typeof ops.open).toBe('function');
    expect(typeof ops.close).toBe('function');
    expect(typeof ops.toggle).toBe('function');
    expect(isOpen).toBe(false);
    expect(searchState).toBe('initial');
  });

  it('opens, closes and toggles', () => {
    const { result } = renderHook(() => useSearchController());
    act(() => result.current[1].open());
    expect(result.current[2]).toBe(true);
    act(() => result.current[1].close());
    expect(result.current[2]).toBe(false);
    act(() => result.current[1].toggle());
    expect(result.current[2]).toBe(true);
  });

  it('accepts an initial search state', () => {
    const { result } = renderHook(() => useSearchController('loading'));
    expect(result.current[3]).toBe('loading');
  });
});
