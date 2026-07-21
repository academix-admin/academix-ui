// createStateStack — typed, method-based stores (Redux-like pure reducers).

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSyncExternalStore } from 'react';
import { StateStackCore } from '../core/StateStackCore';
import { getDefaultStorage } from '../config';
import type {
  MethodFn,
  MethodDict,
  StackConfig,
  InferStateFromMethods,
  MethodsFor,
  ParamsForMethod,
} from '../types';

export function createStateStack<
  Blueprints extends Record<string, MethodDict>
>(methodBlueprints: Blueprints) {
  const core = StateStackCore.instance;

  function useStack<Key extends keyof Blueprints & string>(
    key: Key,
    config: StackConfig<InferStateFromMethods<Blueprints[Key]>>,
    scope = 'global'
  ) {
    type StateType = InferStateFromMethods<Blueprints[Key]>;
    const storage = config.storage || getDefaultStorage();
    const keyStr = String(key);
    const persist = !!config.persist;
    const ttl = config.ttl;
    const historyDepth = config.historyDepth ?? 50;

    // Stabilise initial value so inline literals don't cause dep-loop renders.
    const initialRef = useRef(config.initial as StateType);

    const [isHydrated, setIsHydrated] = useState(() =>
      core.isHydrated(scope, keyStr)
    );

    useEffect(
      () =>
        core.subscribeToHydration(scope, keyStr, () => {
          setIsHydrated((prev) => {
            const next = core.isHydrated(scope, keyStr);
            return prev === next ? prev : next;
          });
        }),
      [scope, keyStr]
    );

    const state = useSyncExternalStore(
      useCallback((callback) => core.subscribe(scope, keyStr, callback), [scope, keyStr]),
      useCallback(() => core.getStateSync(scope, keyStr, initialRef.current), [scope, keyStr]),
      useCallback(() => initialRef.current, [])
    );

    useEffect(() => {
      if (!persist) return;
      let mounted = true;
      (async () => {
        try {
          const didHydrate = await core.ensureHydrated(
            scope,
            keyStr,
            initialRef.current,
            persist,
            storage
          );
          if (mounted && didHydrate) core.notify(scope, keyStr);
        } catch (err) {
          console.error('[StateStack] hydrate error:', err);
        }
      })();
      return () => { mounted = false; };
    }, [scope, keyStr, persist, storage]);

    useEffect(() => {
      core.setHistoryDepth(scope, keyStr, historyDepth);
    }, [scope, keyStr, historyDepth]);

    useEffect(() => {
      if (config.clearOnZeroSubscribers) core.enableAutoClearOnZero(scope);
      return () => {
        if (config.clearOnZeroSubscribers)
          core.disableAutoClearOnZero(scope);
      };
    }, [scope, config.clearOnZeroSubscribers]);

    const methods = useMemo(() => {
      const m = methodBlueprints[key];
      const out: Record<string, (...args: unknown[]) => Promise<void>> = {};

      for (const methodName of Object.keys(m)) {
        out[methodName] = async (...args: unknown[]) => {
          const current = await core.getState(
            scope,
            keyStr,
            initialRef.current,
            persist,
            storage
          );
          let next = (m as Record<string, MethodFn>)[methodName](
            current,
            ...args
          );
          if (config.middleware?.length) {
            for (const mw of config.middleware) {
              const result = mw(
                current as StateType,
                next as StateType,
                methodName
              );
              if (result !== undefined) next = result;
            }
          }
          await core.setState(scope, keyStr, next, persist, storage, true);
          core.setTTL(scope, keyStr, ttl);
        };
      }
      return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scope, keyStr, ttl, persist, config.middleware, storage]);

    const undo = useCallback(
      async () => core.undo(scope, keyStr, persist, storage),
      [scope, keyStr, persist, storage]
    );

    const redo = useCallback(
      async () => core.redo(scope, keyStr, persist, storage),
      [scope, keyStr, persist, storage]
    );

    const result = {
      [keyStr]: state,
      [`${keyStr}$`]: methods,
      __meta: {
        undo,
        redo,
        canUndo: () => core.canUndo(scope, keyStr),
        canRedo: () => core.canRedo(scope, keyStr),
        clear: (removePersist = true) => core.clearKey(scope, keyStr, removePersist),
        clearByScope: (removePersist = true) => core.clearScope(scope, removePersist),
        isHydrated,
      },
    } as unknown as {
      [K in Key]: StateType;
    } & {
      [K2 in `${Key}$`]: {
        [M in keyof MethodsFor<Blueprints[Key]>]: (...args: ParamsForMethod<MethodsFor<Blueprints[Key]>[M]>) => Promise<void>;
      };
    } & { __meta: any };

    return result;
  }

  return { useStack };
}

/** Infers __meta type only — never executed at runtime. */
function _metaShape() {
  return {
    undo: async () => {},
    redo: async () => {},
    canUndo: () => false as boolean,
    canRedo: () => false as boolean,
    clear: (_removePersist?: boolean): void => {},
    clearByScope: (_removePersist?: boolean): Promise<void> =>
      Promise.resolve(),
    isHydrated: false as boolean,
  };
}
