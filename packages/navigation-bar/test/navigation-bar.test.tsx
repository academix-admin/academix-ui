import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
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
