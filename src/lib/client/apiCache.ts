"use client";

type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();
const storagePrefix = "edumanage-api-cache:";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function readStoredEntry<T>(key: string) {
  if (!canUseStorage()) return null;
  try {
    const raw = window.sessionStorage.getItem(`${storagePrefix}${key}`);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (!entry || entry.expiresAt <= Date.now()) {
      window.sessionStorage.removeItem(`${storagePrefix}${key}`);
      return null;
    }
    cache.set(key, entry as CacheEntry<unknown>);
    return entry.data;
  } catch {
    return null;
  }
}

function writeStoredEntry<T>(key: string, entry: CacheEntry<T>) {
  if (!canUseStorage()) return;
  try {
    window.sessionStorage.setItem(`${storagePrefix}${key}`, JSON.stringify(entry));
  } catch {
    // Storage can be full or unavailable; in-memory cache still works.
  }
}

export function getCachedApiData<T>(key: string) {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry || entry.expiresAt <= Date.now()) return readStoredEntry<T>(key);
  return entry.data;
}

export async function cachedJson<T>(key: string, options: { ttlMs?: number; force?: boolean } = {}) {
  const ttlMs = options.ttlMs ?? 60_000;
  const cached = options.force ? null : getCachedApiData<T>(key);
  if (cached) return cached;

  if (!options.force && inflight.has(key)) {
    return inflight.get(key) as Promise<T>;
  }

  const request = fetch(key, { cache: "no-store" })
    .then(async (response) => {
      const data = (await response.json()) as T;
      if (!response.ok) {
        const message = typeof data === "object" && data && "error" in data ? String(data.error) : "Request failed.";
        throw new Error(message);
      }
      const entry = { data, expiresAt: Date.now() + ttlMs };
      cache.set(key, entry);
      writeStoredEntry(key, entry);
      return data;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, request);
  return request;
}

export function setCachedApiData<T>(key: string, data: T, ttlMs = 60_000) {
  const entry = { data, expiresAt: Date.now() + ttlMs };
  cache.set(key, entry);
  writeStoredEntry(key, entry);
}

export function invalidateApiCache(prefix?: string) {
  if (!prefix) {
    cache.clear();
    inflight.clear();
    if (canUseStorage()) {
      for (let index = window.sessionStorage.length - 1; index >= 0; index -= 1) {
        const key = window.sessionStorage.key(index);
        if (key?.startsWith(storagePrefix)) window.sessionStorage.removeItem(key);
      }
    }
    return;
  }

  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
  for (const key of inflight.keys()) {
    if (key.startsWith(prefix)) inflight.delete(key);
  }
  if (canUseStorage()) {
    for (let index = window.sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = window.sessionStorage.key(index);
      if (key?.startsWith(`${storagePrefix}${prefix}`)) window.sessionStorage.removeItem(key);
    }
  }
}
