import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NavigationStack, {
  useNav,
  useIsTop,
  useObject,
  useProvideObject,
  usePageLifecycle,
} from '../src/index';

function renderStack(navLink: Record<string, React.ComponentType<any>>, entry: string) {
  return render(
    <NavigationStack id={`t-${Math.random().toString(36).slice(2)}`} navLink={navLink} entry={entry} transition="none" />
  );
}

describe('NavigationStack — basic navigation', () => {
  function Home() {
    const nav = useNav();
    return (
      <div>
        <span>home</span>
        <button onClick={() => nav.push('details', { id: 7 })}>go</button>
        <button onClick={() => nav.replace('other')}>replace</button>
      </div>
    );
  }
  function Details({ id }: { id?: number }) {
    const nav = useNav();
    return (
      <div>
        <span>{`details ${id}`}</span>
        <button onClick={() => nav.pop()}>back</button>
      </div>
    );
  }
  function Other() {
    return <span>other</span>;
  }
  const navLink = { home: Home, details: Details, other: Other };

  it('renders the entry page', () => {
    renderStack(navLink, 'home');
    expect(screen.getByText('home')).toBeInTheDocument();
  });

  it('pushes to a page with params and pops back', async () => {
    renderStack(navLink, 'home');
    fireEvent.click(screen.getByText('go'));
    await waitFor(() => expect(screen.getByText('details 7')).toBeInTheDocument());
    fireEvent.click(screen.getByText('back'));
    await waitFor(() => expect(screen.getByText('home')).toBeInTheDocument());
  });

  it('replaces the top entry', async () => {
    renderStack(navLink, 'home');
    fireEvent.click(screen.getByText('replace'));
    await waitFor(() => expect(screen.getByText('other')).toBeInTheDocument());
    await waitFor(() => expect(screen.queryByText('home')).not.toBeInTheDocument());
  });
});

describe('NavigationStack — useIsTop', () => {
  function Top() {
    const nav = useNav();
    const isTop = useIsTop();
    return (
      <div>
        <span>top:{String(isTop)}</span>
        <button onClick={() => nav.push('next')}>go</button>
      </div>
    );
  }
  function Next() {
    const isTop = useIsTop();
    return <span>next-top:{String(isTop)}</span>;
  }

  it('reports the top of the stack', async () => {
    renderStack({ top: Top, next: Next }, 'top');
    expect(screen.getByText('top:true')).toBeInTheDocument();
    fireEvent.click(screen.getByText('go'));
    await waitFor(() => expect(screen.getByText('next-top:true')).toBeInTheDocument());
  });
});

describe('NavigationStack — lifecycle', () => {
  const events: string[] = [];
  function A() {
    const nav = useNav();
    usePageLifecycle(nav, { onEnter: () => events.push('A:enter') }, []);
    return <button onClick={() => nav.push('b')}>go</button>;
  }
  function B() {
    const nav = useNav();
    usePageLifecycle(nav, { onEnter: () => events.push('B:enter') }, []);
    return <span>b-page</span>;
  }

  it('fires onEnter for the entered page', async () => {
    renderStack({ a: A, b: B }, 'a');
    fireEvent.click(screen.getByText('go'));
    await waitFor(() => expect(screen.getByText('b-page')).toBeInTheDocument());
    await waitFor(() => expect(events).toContain('B:enter'));
  });
});

describe('NavigationStack — cross-page dependency injection', () => {
  function Provider() {
    const nav = useNav();
    useProvideObject('answer', () => 42, { scope: 'di', global: true });
    return <button onClick={() => nav.push('reader')}>go</button>;
  }
  function Reader() {
    const res = useObject<number>('answer', { scope: 'di', global: true });
    return <span>answer:{res.isProvided ? res.getter() : 'none'}</span>;
  }

  it('provides an object readable from a pushed page', async () => {
    renderStack({ provider: Provider, reader: Reader }, 'provider');
    fireEvent.click(screen.getByText('go'));
    await waitFor(() => expect(screen.getByText('answer:42')).toBeInTheDocument());
  });
});
