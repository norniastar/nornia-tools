const isBrowser = () => typeof window !== 'undefined';

export const readDraftCache = <T>(key: string, ttl: number, fallback: T): T => {
  if (!isBrowser()) return fallback;

  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as Partial<T> & { savedAt?: number };
    if (!parsed.savedAt || Date.now() - parsed.savedAt > ttl) {
      window.localStorage.removeItem(key);
      return fallback;
    }

    const { savedAt: _savedAt, ...draft } = parsed;
    return {
      ...fallback,
      ...draft,
    };
  } catch {
    window.localStorage.removeItem(key);
    return fallback;
  }
};

export const persistDraftCache = <T>(key: string, draft: T, shouldPersist: boolean) => {
  if (!isBrowser()) return;

  if (!shouldPersist) {
    window.localStorage.removeItem(key);
    return;
  }

  window.localStorage.setItem(
    key,
    JSON.stringify({
      ...draft,
      savedAt: Date.now(),
    })
  );
};
