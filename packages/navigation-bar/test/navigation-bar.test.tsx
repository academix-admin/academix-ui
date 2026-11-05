import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import NavigationBar, { NavigationBar as Named } from '../src/index';

describe('@academix-admin/navigation-bar', () => {
  it('exports a default component (and named alias)', () => {
    expect(typeof NavigationBar).toBe('function');
    expect(Named).toBe(NavigationBar);
  });

  const items = [
    { id: 'home', text: 'Home', svg: null },
    { id: 'profile', text: 'Profile', svg: null },
  ];

  it('fires onReselect only when the ALREADY-active tab is tapped again', () => {
    const onChange = vi.fn();
    const onReselect = vi.fn();
    const { getAllByRole } = render(
      <NavigationBar navKeys={items} activeId="home" onChange={onChange} onReselect={onReselect} />,
    );
    // role="button" nav items, in navKeys order: [0]=home (active), [1]=profile.
    const [homeTab, profileTab] = getAllByRole('button');

    // Tapping a DIFFERENT tab → onChange, never onReselect.
    fireEvent.click(profileTab);
    expect(onChange).toHaveBeenCalledWith('profile', expect.objectContaining({ id: 'profile' }));
    expect(onReselect).not.toHaveBeenCalled();

    // Tapping the ACTIVE tab again → onReselect fires (after onChange).
    fireEvent.click(homeTab);
    expect(onReselect).toHaveBeenCalledTimes(1);
    expect(onReselect).toHaveBeenCalledWith('home', expect.objectContaining({ id: 'home' }));
  });

  it('does not fire onReselect on the first tap of a not-yet-active tab', () => {
    const onReselect = vi.fn();
    const { getAllByRole } = render(
      <NavigationBar navKeys={items} activeId="home" onReselect={onReselect} />,
    );
    const [, profileTab] = getAllByRole('button');
    fireEvent.click(profileTab); // first selection of 'profile' (active is 'home')
    expect(onReselect).not.toHaveBeenCalled();
  });
});

describe('media: shown only while a query matches', () => {
  const items = [
    { id: 'home', text: 'Home', svg: null },
    { id: 'profile', text: 'Profile', svg: null },
  ];
  const real = window.matchMedia;

  /** A media query list whose answer the test controls. */
  function fakeMedia(initial: boolean) {
    const listeners = new Set<() => void>();
    const list = {
      matches: initial,
      addEventListener: (_: string, l: () => void) => listeners.add(l),
      removeEventListener: (_: string, l: () => void) => listeners.delete(l),
      addListener: (l: () => void) => listeners.add(l),
      removeListener: (l: () => void) => listeners.delete(l),
    };
    // @ts-expect-error test stub
    window.matchMedia = () => list;
    return {
      set(matches: boolean) {
        list.matches = matches;
        act(() => listeners.forEach((l) => l()));
      },
    };
  }

  afterEach(() => {
    window.matchMedia = real;
    document.body.style.removeProperty('--nav-height');
  });

  it('renders the bar and writes --nav-height while the query matches', () => {
    fakeMedia(true);
    const { getAllByRole } = render(<NavigationBar navKeys={items} activeId="home" media="(max-width: 800px)" />);
    expect(getAllByRole('button')).toHaveLength(2);
    expect(document.body.style.getPropertyValue('--nav-height')).not.toBe('');
  });

  it('renders nothing, leaves --nav-height alone and reports hidden while it does not', () => {
    fakeMedia(false);
    const onVisibilityChange = vi.fn();
    document.body.style.setProperty('--nav-height', '99px');
    const { queryAllByRole } = render(
      <NavigationBar navKeys={items} activeId="home" media="(max-width: 800px)" onVisibilityChange={onVisibilityChange} />,
    );
    expect(queryAllByRole('button')).toHaveLength(0);
    expect(document.body.style.getPropertyValue('--nav-height')).toBe('');
    expect(onVisibilityChange).toHaveBeenLastCalledWith(expect.objectContaining({ hidden: true, height: '0px' }));
  });

  it('follows the query as it changes', () => {
    const media = fakeMedia(true);
    const onVisibilityChange = vi.fn();
    const { queryAllByRole } = render(
      <NavigationBar navKeys={items} activeId="home" media="(max-width: 800px)" onVisibilityChange={onVisibilityChange} />,
    );
    expect(queryAllByRole('button')).toHaveLength(2);
    media.set(false);
    expect(queryAllByRole('button')).toHaveLength(0);
    expect(document.body.style.getPropertyValue('--nav-height')).toBe('');
    media.set(true);
    expect(queryAllByRole('button')).toHaveLength(2);
    expect(onVisibilityChange).toHaveBeenLastCalledWith(expect.objectContaining({ hidden: false }));
  });

  it('without media, is always shown, as before', () => {
    fakeMedia(false);
    const { getAllByRole } = render(<NavigationBar navKeys={items} activeId="home" />);
    expect(getAllByRole('button')).toHaveLength(2);
  });
});
