// Internal utilities.

export function safeClone<T>(v: T): T {
  try {
    if (typeof structuredClone === 'function') return structuredClone(v);
    return JSON.parse(JSON.stringify(v));
  } catch {
    return v;
  }
}
