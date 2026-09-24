/**
 * A READ THAT WAS THROWN AWAY MUST NOT COUNT AS ONE THAT WAS SERVED.
 *
 * `demand()` runs a loader once per key and returns early ever after — that is the whole point of
 * it, and it is what stops five components asking the same question five times. The flag is set
 * when the loader STARTS.
 *
 * So when a component unmounts while its read is in the air, the read is aborted and never commits,
 * and the key is left marked as served. Nothing will ever fetch it again. The next mount asks
 * `demand()`, is told the key is already handled, and sits on a spinner for ever:
 *
 *     { loaded: false, loading: true, error: null, data: null }
 *
 * No error, because nothing failed. A screen that never resolves and never explains itself.
 *
 * REACT'S STRICT MODE DOES EXACTLY THIS ON EVERY MOUNT — mount, unmount, mount — so in development
 * every such screen hangs, and in production it hangs only for the person who happened to leave and
 * come straight back. It was found on a screen that was stuck loading in dev while its RPC had
 * plainly answered `200 []`.
 */
import React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, act, waitFor } from '@testing-library/react';
import { useDemandResource } from '../src/hooks/useDemandResource';
import { StateStack } from '../src/index';

afterEach(async () => {
  cleanup();
  await StateStack.core.clearScope('orders');
});

function Orders({ read }: { read: () => Promise<string[]> }) {
  const { data, loaded, loading, error } = useDemandResource<string[]>(() => read(), {
    key: 'waiting',
    scope: 'orders',
    // `persist: true` is the app default and the case that actually breaks: the value is kept for
    // the next mount, which is exactly why the second mount trusts the demanded flag.
    persist: true,
  });

  if (error) return <p>failed: {error}</p>;
  if (!loaded) return <p>{loading ? 'loading' : 'idle'}</p>;
  return <p>{data && data.length > 0 ? data.join(', ') : 'none waiting'}</p>;
}

describe('a read interrupted by an unmount', () => {
  it('under Strict Mode — mount, unmount, mount — still answers', async () => {
    /*
     * THE ACTUAL REPRODUCTION. Strict Mode does mount → unmount → mount on every component in
     * development, with no delay between them, so the first read is aborted by the cleanup while
     * it is still in the air and the second mount has to be the one that answers.
     *
     * A plain `render()` does not do this, which is why the first version of this test passed
     * against the broken library.
     */
    let release: (rows: string[]) => void = () => {};
    const inFlight = new Promise<string[]>((res) => {
      release = res;
    });
    const read = vi.fn().mockReturnValueOnce(inFlight).mockResolvedValue([]);

    render(
      <React.StrictMode>
        <Orders read={read} />
      </React.StrictMode>,
    );

    await act(async () => {
      release([]);
      await Promise.resolve();
    });

    await waitFor(() => expect(screen.getByText('none waiting')).toBeTruthy(), { timeout: 3000 });
  });

  it('under Strict Mode, an empty answer still resolves the screen', async () => {
    render(
      <React.StrictMode>
        <Orders read={async () => []} />
      </React.StrictMode>,
    );
    await waitFor(() => expect(screen.getByText('none waiting')).toBeTruthy(), { timeout: 3000 });
  });

  it('is read again by the next mount, rather than leaving it on a spinner', async () => {
    // Held open, so the unmount lands while the answer is still in the air — which is the whole
    // point. A resolved promise would hide the bug entirely.
    let release: (rows: string[]) => void = () => {};
    const inFlight = new Promise<string[]>((res) => {
      release = res;
    });

    const read = vi.fn().mockReturnValueOnce(inFlight).mockResolvedValue([]);

    const first = render(<Orders read={read} />);
    expect(screen.getByText('loading')).toBeTruthy();

    // Gone before the answer arrives. This is what Strict Mode does to every component, and what a
    // person does by leaving a screen.
    first.unmount();
    await act(async () => {
      release([]);
      await Promise.resolve();
    });

    // Back again, and the question must be asked again.
    render(<Orders read={read} />);
    await waitFor(() => expect(screen.getByText('none waiting')).toBeTruthy(), { timeout: 3000 });
  });

  it('an empty answer is an answer, and the screen says so', async () => {
    render(<Orders read={async () => []} />);
    await waitFor(() => expect(screen.getByText('none waiting')).toBeTruthy(), { timeout: 3000 });
  });

  it('shows the last answer immediately on a remount, rather than a spinner', async () => {
    /*
     * The other half of the same rule. A read that DID land belongs to the key too, so coming back
     * to the screen shows what it said while a fresh read runs behind it. `revalidateOnMount`
     * defaults to true, so the second read is expected — what must not happen is a blank screen
     * while it runs.
     */
    const read = vi.fn().mockResolvedValue(['one']);

    const first = render(<Orders read={read} />);
    await waitFor(() => expect(screen.getByText('one')).toBeTruthy(), { timeout: 3000 });
    first.unmount();

    render(<Orders read={read} />);
    // Synchronously, before anything is awaited: the cached answer, not 'loading'.
    expect(screen.getByText('one')).toBeTruthy();
  });
});
