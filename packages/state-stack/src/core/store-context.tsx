'use client';

import React, { createContext, useContext } from 'react';
import { StateStackCore } from './StateStackCore';

/**
 * WHICH STORE THIS TREE READS AND WRITES.
 *
 * In a browser there is one store, because there is one person and one tab: the module-level
 * singleton, which is what every existing app uses and what `StateStack.core` exposes.
 *
 * ON A SERVER THAT IS NOT SAFE. A module is shared by every request the process handles, so a store
 * written during one shopper's render is visible while rendering another's — and what leaks is not a
 * detail, it is their cart, their account, their prices. The answer is a store per request, provided
 * around the tree being rendered and thrown away with the response.
 *
 * Nothing changes for an app that provides nothing. Client components are server-rendered by Next
 * even today, and they reach the singleton there — which has been harmless only because nothing
 * WRITES during a server render. The moment a server render fetches, that stops being true, and this
 * is what makes it safe.
 */
const StoreContext = createContext<StateStackCore | null>(null);

export function StateStackProvider({
  store,
  children,
}: {
  store: StateStackCore;
  children?: React.ReactNode;
}) {
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

/** A store of its own, for one server render. */
export function createRequestStore(): StateStackCore {
  return StateStackCore.createIsolated();
}

/**
 * The store this component should use: the one provided around it, or the singleton.
 *
 * A hook, so it follows the tree — two stacks rendered for two requests get two stores without
 * either knowing the other exists.
 */
export function useCore(): StateStackCore {
  const provided = useContext(StoreContext);
  return provided ?? StateStackCore.instance;
}
