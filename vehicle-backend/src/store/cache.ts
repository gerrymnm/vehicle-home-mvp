// Minimal async memoizer — safe to import anywhere.

const cache = new Map<string, unknown>();

export function memoizeAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  namespace = "ns"
): T {
  return (async (...args: any[]) => {
    const key = `${namespace}:${JSON.stringify(args)}`;
    if (cache.has(key)) return cache.get(key);
    const val = await fn(...args);
    cache.set(key, val);
    return val;
  }) as T;
}

export function clearCache() {
  cache.clear();
}
