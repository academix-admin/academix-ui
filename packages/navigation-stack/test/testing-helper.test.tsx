/**
 * The test helper, tested.
 *
 * It exists so that a page can be tested the way it is used — pushed to, popped from, given params
 * — rather than by mocking `useNav`, which only ever proves the page called a function.
 */
import React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { renderInStack, forgetStack } from '../src/testing';
import { useNav, useIsTop, useLocation, usePageLifecycle } from '../src/index';

afterEach(() => cleanup());

function CustomerPage() {
  const nav = useNav();
  const top = useIsTop();
  return (
    <div>
      <p>Customer{top ? ' (on top)' : ' (underneath)'}</p>
      <button onClick={() => void nav.push('receipt', { id: '7' })}>Open receipt</button>
    </div>
  );
}

function ReceiptPage() {
  const id = useLocation()?.params?.id as string | undefined;
  return <p>Receipt {id}</p>;
}

describe('renderInStack', () => {
  it('renders a page that needs a stack around it', async () => {
    const { settle } = renderInStack(<CustomerPage />);
    await settle();
    expect(screen.getByText(/^Customer/)).toBeTruthy();
  });

  it('hands back the same nav the app uses', async () => {
    const { nav, stack, settle } = renderInStack(<CustomerPage />, {
      navLink: { receipt: ReceiptPage },
    });
    await settle();

    await nav.push('receipt', { id: '7' });
    await settle();

    expect(stack().map((e) => e.key)).toEqual(['page', 'receipt']);
    expect(screen.getByText('Receipt 7')).toBeTruthy();
  });

  it('pops back, and the page underneath is the one that was there', async () => {
    const { nav, stack, settle } = renderInStack(<CustomerPage />, {
      navLink: { receipt: ReceiptPage },
    });
    await settle();
    await nav.push('receipt');
    await settle();

    await nav.pop();
    await settle();

    expect(stack().map((e) => e.key)).toEqual(['page']);
    expect(screen.getByText(/on top/)).toBeTruthy();
  });

  it('drives the page through its own button, not through the api', async () => {
    // What a person does. The push happens inside the page, which is the part worth testing.
    const { stack, settle, getByText } = renderInStack(<CustomerPage />, {
      navLink: { receipt: ReceiptPage },
    });
    await settle();

    getByText('Open receipt').click();
    await settle(50);

    expect(stack().map((e) => e.key)).toEqual(['page', 'receipt']);
  });

  it('gives each render its own stack, so one test cannot see another one pages', async () => {
    // The registry is process-global and survives cleanup(). Sharing an id is how a test starts
    // with the previous test's stack already pushed.
    const a = renderInStack(<CustomerPage />, { navLink: { receipt: ReceiptPage } });
    await a.settle();
    await a.nav.push('receipt');
    await a.settle();
    cleanup();

    const b = renderInStack(<CustomerPage />, { navLink: { receipt: ReceiptPage } });
    await b.settle();

    expect(a.id).not.toBe(b.id);
    expect(b.stack().map((e) => e.key)).toEqual(['page']);
  });

  it('accepts a component as well as an element', async () => {
    const { settle } = renderInStack(CustomerPage);
    await settle();
    expect(screen.getByText(/^Customer/)).toBeTruthy();
  });

  it('lets a test watch a page resume, which is where screens refetch', async () => {
    // Documented in TESTING.md, so it is run here rather than asserted on a README page.
    const refetch = vi.fn();
    function Watched() {
      const nav = useNav();
      usePageLifecycle(nav, { onResume: () => refetch() }, []);
      return <p>Watched</p>;
    }

    const { nav, settle } = renderInStack(<Watched />, { navLink: { receipt: ReceiptPage } });
    await settle();
    expect(refetch).not.toHaveBeenCalled();

    await nav.push('receipt');
    await settle();
    await nav.pop();
    await settle(50);

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('says what is wrong when nav is used before the stack is mounted', () => {
    const { nav } = renderInStack(<CustomerPage />, { id: 'not-yet' });
    forgetStack('not-yet');
    expect(() => nav.push('anything')).toThrow(/not mounted yet/);
  });
});
