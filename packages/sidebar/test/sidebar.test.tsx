import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import Sidebar, { Sidebar as Named } from '../src/index';

describe('@academix-admin/sidebar', () => {
  it('exports a default component (and named alias)', () => {
    expect(typeof Sidebar).toBe('function');
    expect(Named).toBe(Sidebar);
  });
});

describe('reselect and colours', () => {
  const items = [
    { id: 'home', text: 'Home', svg: null },
    { id: 'profile', text: 'Profile', svg: null },
  ];

  it('fires onReselect only when the ALREADY-active item is tapped again, after onChange', () => {
    const calls: string[] = [];
    const onChange = vi.fn((id: string) => calls.push(`change:${id}`));
    const onReselect = vi.fn((id: string) => calls.push(`reselect:${id}`));
    const { getByText } = render(<Sidebar navKeys={items} activeId="home" onChange={onChange} onReselect={onReselect} />);
    fireEvent.click(getByText('Profile'));
    expect(onReselect).not.toHaveBeenCalled();
    fireEvent.click(getByText('Home'));
    expect(onReselect).toHaveBeenCalledWith('home', expect.objectContaining({ id: 'home' }));
    expect(calls).toEqual(['change:profile', 'change:home', 'reselect:home']);
  });

  it('sets only the colours it is given, so unset ones keep the defaults', () => {
    const { container } = render(
      <Sidebar navKeys={items} activeBackground="#e6f2ef" hoverBackground="#f1f3f3" height="100%" />,
    );
    const aside = container.querySelector('aside') as HTMLElement;
    expect(aside.style.getPropertyValue('--sb-active-bg')).toBe('#e6f2ef');
    expect(aside.style.getPropertyValue('--sb-hover-bg')).toBe('#f1f3f3');
    expect(aside.style.getPropertyValue('--sb-height')).toBe('100%');
    expect(aside.style.getPropertyValue('--sb-divider')).toBe('');
  });
});
