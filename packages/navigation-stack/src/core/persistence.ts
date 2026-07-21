import type { NavParams, NavigationMap, ParsedStack, StackEntry } from '../types';
import { NAV_STACK_VERSION, STACK_SEPARATOR, STORAGE_TTL_MS } from '../constants';
import type { GroupNavigationContextType } from './contexts';
// Stack persistence, URL/param encoding and uid helpers.
import type { ComponentType, ReactNode, ReactElement } from 'react';

export function isEqual(a: StackEntry[], b: StackEntry[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((entry, i) =>
    entry.key === b[i].key &&
    JSON.stringify(entry.params) === JSON.stringify(b[i].params)
  );
}

export function generateStableUid(key: string, params?: NavParams): string {
  const str = key + (params ? JSON.stringify(params) : '');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `uid_${Math.abs(hash)}`;
}

// Generate composite UID: "groupId:stackId:pageUid"
export function generateCompositeUid(
  stackId: string,
  groupContext: GroupNavigationContextType | null,
  groupStackId: string | null,
  key: string,
  params?: NavParams
): string {
  const groupStackKey = groupContext
    ? `${groupContext.getGroupId()}:${groupStackId}`
    : 'root:root';
  const pageUid = generateStableUid(key, params);
  return `${groupStackKey}:${pageUid}`;
}

// Ensure UID is composite format - upgrade old non-composite UIDs if needed
export function ensureCompositeUid(
  uid: string | undefined,
  stackId: string,
  groupContext: GroupNavigationContextType | null,
  groupStackId: string | null,
  key: string,
  params?: NavParams
): string {
  // If already composite (contains ':'), return as-is
  if (uid && uid.includes(':')) {
    return uid;
  }
  // Otherwise regenerate as composite
  return generateCompositeUid(stackId, groupContext, groupStackId, key, params);
}

export function parseRawKey(raw: string, params?: NavParams) {
  if (!raw) return { key: '', params };

  const [k, qs] = raw.split("?");
  let merged = params;
  if (qs) {
    try {
      const sp = new URLSearchParams(qs);
      const obj = Object.fromEntries(sp.entries());
      merged = merged ? { ...merged, ...obj } : obj;
    } catch (e) { }
  }
  return { key: k, params: merged };
}

export function storageKeyFor(id: string) {
  return `navstack:${id}`;
}

export function readPersistedStack(id: string, groupContext: GroupNavigationContextType | null, groupStackId: string | null): StackEntry[] | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = sessionStorage.getItem(storageKeyFor(id));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { timestamp: number; entries: any[] };
    if (!parsed.timestamp || !parsed.entries || !Array.isArray(parsed.entries)) return null;
    const expired = Date.now() - parsed.timestamp > STORAGE_TTL_MS;
    if (expired) {
      sessionStorage.removeItem(storageKeyFor(id));
      return null;
    }
    return parsed.entries.map((p) => {
      const compositeUid = ensureCompositeUid(p.uid, id, groupContext, groupStackId, p.key, p.params);
      return { uid: compositeUid, key: p.key, params: p.params, metadata: p.metadata };
    });
  } catch (e) {
    return null;
  }
}

export function writePersistedStack(id: string, stack: StackEntry[]) {
  try {
    if (typeof window === "undefined") return;
    const simplified = {
      timestamp: Date.now(),
      entries: stack.map((s) => ({ key: s.key, params: s.params, metadata: s.metadata })),
    };
    sessionStorage.setItem(storageKeyFor(id), JSON.stringify(simplified));
  } catch (e) { }
}

export function encodeStackPath(navLink: NavigationMap, key: string): string {
  const keys = Object.keys(navLink);
  const index = keys.indexOf(key);

  if (index === -1) {
    try {
      return 'k:' + encodeURIComponent(key);
    } catch {
      return 'k:' + key;
    }
  }
  if (index < 26) return String.fromCharCode(97 + index) + '1';
  if (index < 52) return 'a' + String.fromCharCode(65 + index - 26);

  const firstChar = String.fromCharCode(97 + Math.floor((index - 52) / 26));
  const secondChar = String.fromCharCode(97 + ((index - 52) % 26));
  return `${firstChar}${secondChar}1`;
}

export function decodeStackPath(navLink: NavigationMap, code: string): string | null {
  if (code.startsWith('k:')) {
    try {
      return decodeURIComponent(code.slice(2));
    } catch {
      return code.slice(2);
    }
  }

  const keys = Object.keys(navLink);

  if (code.length === 2 && code[1] === '1' && code[0] >= 'a' && code[0] <= 'z') {
    const index = code.charCodeAt(0) - 97;
    return keys[index] || null;
  }

  if (code.length === 2 && code[0] === 'a' && code[1] >= 'A' && code[1] <= 'Z') {
    const index = 26 + (code.charCodeAt(1) - 65);
    return keys[index] || null;
  }

  if (code.length === 3 && code[2] === '1' &&
    code[0] >= 'a' && code[0] <= 'z' &&
    code[1] >= 'a' && code[1] <= 'z') {
    const first = code.charCodeAt(0) - 97;
    const second = code.charCodeAt(1) - 97;
    const index = 52 + (first * 26) + second;
    return keys[index] || null;
  }

  return null;
}

export function encodeParams(params: NavParams): string {
  if (!params) return '';
  try {
    return 'p:' + btoa(encodeURIComponent(JSON.stringify(params)));
  } catch {
    return '';
  }
}

export function decodeParams(encoded: string): NavParams {
  if (!encoded.startsWith('p:')) return undefined;
  try {
    return JSON.parse(decodeURIComponent(atob(encoded.slice(2))));
  } catch {
    return undefined;
  }
}

export function buildUrlPath(stacks: Array<{ navLink: NavigationMap, stack: StackEntry[] }>): string {
  let path = NAV_STACK_VERSION;

  stacks.forEach(({ navLink, stack }, depth) => {
    if (depth > 0) path += '.' + STACK_SEPARATOR;

    stack.forEach(entry => {
      const code = encodeStackPath(navLink, entry.key);
      if (!code) return;

      path += '.' + code;

      if (entry.params) {
        const paramsStr = encodeParams(entry.params);
        if (paramsStr) path += '.' + paramsStr;
      }
    });
  });

  return path;
}

export function parseUrlPathIntoStacks(path: string) {
  const parts = path.split('.');
  if (parts[0] !== NAV_STACK_VERSION) return [];

  const stacks: ParsedStack[] = [];
  let currentStack: ParsedStack = [];

  for (let i = 1; i < parts.length; i++) {
    const token = parts[i];
    if (!token) continue;

    if (token === STACK_SEPARATOR) {
      if (currentStack.length > 0) {
        stacks.push(currentStack);
      } else {
        stacks.push([]);
      }
      currentStack = [];
      continue;
    }

    if (token.startsWith('p:')) {
      if (currentStack.length > 0) {
        currentStack[currentStack.length - 1].params = decodeParams(token);
      }
      continue;
    }

    currentStack.push({ code: token });
  }

  stacks.push(currentStack);

  return stacks;
}

export function parseCombinedNavParam(navParam: string | null | undefined): Record<string, string> {
  const map: Record<string, string> = {};
  if (!navParam) return map;
  try {
    navParam.split('|').forEach(segment => {
      if (!segment) return;
      const idx = segment.indexOf(':');
      if (idx === -1) return;
      const id = segment.slice(0, idx);
      const path = segment.slice(idx + 1);
      if (id) map[id] = path;
    });
  } catch (e) {
  }
  return map;
}

export function buildCombinedNavParam(map: Record<string, string>): string {
  return Object.keys(map)
    .filter(k => map[k] && map[k].length > 0)
    .map(k => `${k}:${map[k]}`)
    .join('|');
}

export function updateNavQueryParamForStack(stackId: string, path: string | null, groupContext: GroupNavigationContextType | null, groupStackId: string | null) {
  if (typeof window === "undefined") return;

  try {
    const url = new URL(window.location.href);
    const current = url.searchParams.get('nav');
    const map = parseCombinedNavParam(current || undefined);

    if (path && path.length > 0) {
      map[stackId] = path;
    } else {
      delete map[stackId];
    }

    const newParam = buildCombinedNavParam(map);

    if (newParam) {
      if (groupContext) url.searchParams.set('group', groupStackId || '');
      url.searchParams.set('nav', newParam);
    } else {
      if (groupContext) url.searchParams.delete('group');
      url.searchParams.delete('nav');
    }

    const newHref = url.toString();
    if (window.location.href !== newHref) {
      if (groupContext) window.history.replaceState({ group: groupStackId }, "", newHref);
      window.history.replaceState({ navStack: newParam }, "", newHref);
    }
  } catch (e) {
  }
}
export function removeNavQueryParamForStack(stackId: string, groupContext: GroupNavigationContextType | null, groupStackId: string | null) {
  if (typeof window === "undefined") return;

  try {
    const url = new URL(window.location.href);

    if (groupContext) url.searchParams.delete('group');
    url.searchParams.delete('nav');


    const newHref = url.toString();
    if (window.location.href !== newHref) {
      if (groupContext) window.history.replaceState({ group: null }, "", newHref);
      window.history.replaceState({ navStack: null }, "", newHref);
    }
  } catch (e) {
  }
}


