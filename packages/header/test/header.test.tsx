import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Header, { Header as Named, type HeaderAction } from '../src/index';

describe('@academix-admin/header', () => {
  it('exports a default component and a named alias', () => {
    expect(typeof Header).toBe('function');
    expect(Named).toBe(Header);
  });

  it('renders the title', () => {
    render(<Header title="Redeem Codes" />);
    expect(screen.getByRole('heading', { name: 'Redeem Codes' })).toBeInTheDocument();
  });

  it('shows a back button when onBack is provided and calls it', () => {
    const onBack = vi.fn();
    render(<Header title="X" onBack={onBack} />);
    const back = screen.getByRole('button', { name: 'Go back' });
    fireEvent.click(back);
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('hides the back button when there is no onBack', () => {
    render(<Header title="X" />);
    expect(screen.queryByRole('button', { name: 'Go back' })).not.toBeInTheDocument();
  });

  it('renders actions and fires their handlers', () => {
    const onRefresh = vi.fn();
    const actions: HeaderAction[] = [
      { icon: <span>refresh</span>, onClick: onRefresh, ariaLabel: 'Refresh' },
    ];
    render(<Header title="X" actions={actions} />);
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    expect(onRefresh).toHaveBeenCalledOnce();
  });

  it('disables an action and swaps to a spinner while loading', () => {
    const actions: HeaderAction[] = [
      { icon: <span>refresh</span>, ariaLabel: 'Refresh', loading: true },
    ];
    render(<Header title="X" actions={actions} />);
    const btn = screen.getByRole('button', { name: 'Refresh' });
    expect(btn).toBeDisabled();
    expect(screen.queryByText('refresh')).not.toBeInTheDocument();
  });

  it('renders the title variant with a description and no back button', () => {
    const { container } = render(
      <Header variant="title" theme="dark" title="Ajibe" description="Welcome back" />
    );
    const root = container.querySelector('header');
    expect(root).toHaveAttribute('data-variant', 'title');
    expect(root).toHaveAttribute('data-position', 'static');
    expect(screen.getByRole('heading', { name: 'Ajibe' })).toBeInTheDocument();
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Go back' })).not.toBeInTheDocument();
  });

  it('supports the beside description placement (payment style)', () => {
    const { container } = render(
      <Header variant="title" title="Today" description="23 July" descriptionPlacement="beside" />
    );
    const titles = container.querySelector('[data-placement="beside"]');
    expect(titles).toBeTruthy();
    expect(screen.getByText('23 July')).toBeInTheDocument();
  });

  it('renders an action badge (notification count)', () => {
    render(
      <Header
        variant="title"
        title="Home"
        actions={[{ icon: <span>bell</span>, ariaLabel: 'Notifications', badge: 3 }]}
      />
    );
    const btn = screen.getByRole('button', { name: 'Notifications' });
    expect(btn).toContainElement(screen.getByText('3'));
    expect(btn).toContainElement(screen.getByText('bell'));
  });

  it('applies theme and per-part class overrides', () => {
    render(
      <Header
        title="X"
        theme="dark"
        onBack={() => {}}
        classNames={{ title: 'my-title', backButton: 'my-back' }}
      />
    );
    expect(screen.getByRole('heading', { name: 'X' })).toHaveClass('my-title');
    expect(screen.getByRole('button', { name: 'Go back' })).toHaveClass('my-back');
  });
});
