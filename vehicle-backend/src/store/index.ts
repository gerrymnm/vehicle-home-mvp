// vehicle-marketplace/src/store/index.ts
// Minimal in-memory key/value store used across the frontend.
// Safe to replace later with Zustand, Redux, or any persistent store.

const mem = new Map<string, unknown>();

export function set<T>(key: string, value: T): void {
  mem.set(key, value);
}

export function get<T>(key: string): T | undefined {
  return mem.get(key) as T | undefined;
}

export function del(key: string): void {
  mem.delete(key);
}

export function clear(): void {
  mem.clear();
}

// Optional helpers for VIN-scoped data
export function setForVin<T>(vin: string, key: string, value: T): void {
  set(`${vin}:${key}`, value);
}

export function getForVin<T>(vin: string, key: string): T | undefined {
  return get<T>(`${vin}:${key}`);
}
