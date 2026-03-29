const isBrowser = () => typeof window !== 'undefined';
const RELOAD_CONSUMED_PREFIX = '__draft_reload_consumed__:';
const PAGE_LOAD_ID = isBrowser() ? String(window.performance.timeOrigin) : '';

const isReloadNavigation = () => {
  if (!isBrowser()) return false;

  const navigationEntries = window.performance.getEntriesByType?.('navigation') as PerformanceNavigationTiming[] | undefined;
  if (navigationEntries && navigationEntries.length > 0) {
    return navigationEntries[0].type === 'reload';
  }

  return window.performance.navigation?.type === 1;
};

export const readDraftCache = <T>(
  key: string,
  fallback: T,
  options?: {
    clearOnReload?: boolean;
  }
): T => {
  if (!isBrowser()) return fallback;

  if (options?.clearOnReload && isReloadNavigation()) {
    const sessionKey = `${RELOAD_CONSUMED_PREFIX}${key}`;
    const hasConsumedReloadClear = window.sessionStorage.getItem(sessionKey) === PAGE_LOAD_ID;

    if (!hasConsumedReloadClear) {
      window.localStorage.removeItem(key);
      window.sessionStorage.setItem(sessionKey, PAGE_LOAD_ID);
      return fallback;
    }
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    const draft = JSON.parse(raw) as Partial<T>;
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
    JSON.stringify(draft)
  );
};
