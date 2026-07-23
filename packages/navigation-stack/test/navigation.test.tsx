import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NavigationStack, {
  useNav,
  useIsTop,
  useObject,
  useProvideObject,
  usePageLifecycle,
  useLocation,
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

describe('NavigationStack — C3 location & deep links', () => {
  let capturedPath = '';

  function Root() {
    const nav = useNav();
    const loc = useLocation();
    return (
      <div>
        <span>{`root-loc:${loc?.key}`}</span>
        <button onClick={() => nav.push('detail', { id: 5 })}>open</button>
        <button
          onClick={async () => {
            await nav.pushLocation(capturedPath);
          }}
        >
          deeplink
        </button>
      </div>
    );
  }
  function Detail() {
    const nav = useNav();
    const loc = useLocation();
    return (
      <div>
        <span>{`detail-loc:${loc?.key}`}</span>
        <button
          onClick={async () => {
            capturedPath = nav.getLocation().path;
            await nav.pop();
          }}
        >
          capture-and-back
        </button>
      </div>
    );
  }

  it('useLocation tracks the top entry reactively', async () => {
    renderStack({ root: Root, detail: Detail }, 'root');
    expect(screen.getByText('root-loc:root')).toBeInTheDocument();
    fireEvent.click(screen.getByText('open'));
    await waitFor(() => expect(screen.getByText('detail-loc:detail')).toBeInTheDocument());
  });

  it('pushLocation rebuilds a captured location (prefix-idempotent)', async () => {
    renderStack({ root: Root, detail: Detail }, 'root');
    // open detail, capture its location path, pop back to root
    fireEvent.click(screen.getByText('open'));
    await waitFor(() => expect(screen.getByText('capture-and-back')).toBeInTheDocument());
    fireEvent.click(screen.getByText('capture-and-back'));
    await waitFor(() => expect(screen.getByText('root-loc:root')).toBeInTheDocument());
    expect(capturedPath.length).toBeGreaterThan(0);
    // deep-link back using the captured path — shared 'root' prefix is skipped
    fireEvent.click(screen.getByText('deeplink'));
    await waitFor(() => expect(screen.getByText('detail-loc:detail')).toBeInTheDocument());
  });
});

describe('NavigationStack — C2 redirects', () => {
  let lastResult: unknown = null;

  function Home() {
    const nav = useNav();
    return (
      <div>
        <span>home-page</span>
        <button onClick={() => nav.push('locked')}>try-locked</button>
        <button
          onClick={async () => {
            lastResult = await nav.push('looper');
          }}
        >
          try-loop
        </button>
      </div>
    );
  }
  const Locked = () => <span>locked-page</span>;
  const Login = () => <span>login-page</span>;
  const Looper = () => <span>looper-page</span>;
  const navLink = { home: Home, locked: Locked, login: Login, looper: Looper };

  it('stack-level redirect sends push to another route (runs before render)', async () => {
    render(
      <NavigationStack
        id={`r1-${Math.random().toString(36).slice(2)}`}
        navLink={navLink}
        entry="home"
        transition="none"
        redirect={(ctx) => (ctx.to.key === 'locked' ? 'login' : null)}
      />
    );
    fireEvent.click(screen.getByText('try-locked'));
    await waitFor(() => expect(screen.getByText('login-page')).toBeInTheDocument());
    expect(screen.queryByText('locked-page')).not.toBeInTheDocument();
  });

  it('cyclic redirects fail with { ok:false, reason:"redirect-loop" }', async () => {
    lastResult = null;
    render(
      <NavigationStack
        id={`r2-${Math.random().toString(36).slice(2)}`}
        navLink={navLink}
        entry="home"
        transition="none"
        redirect={(ctx) => (ctx.to.key === 'looper' ? 'looper' : null)}
      />
    );
    fireEvent.click(screen.getByText('try-loop'));
    await waitFor(() => expect(lastResult).toEqual({ ok: false, reason: 'redirect-loop' }));
    expect(screen.queryByText('looper-page')).not.toBeInTheDocument();
  });

  it('routeOptions redirect applies only to its own route', async () => {
    render(
      <NavigationStack
        id={`r3-${Math.random().toString(36).slice(2)}`}
        navLink={navLink}
        entry="home"
        transition="none"
        routeOptions={{ locked: { redirect: () => 'login' } }}
      />
    );
    fireEvent.click(screen.getByText('try-loop')); // 'looper' is unaffected
    await waitFor(() => expect(screen.getByText('looper-page')).toBeInTheDocument());
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
