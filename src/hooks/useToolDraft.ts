import { useCallback, useRef } from 'react';
import { persistDraftCache, readDraftCache } from '../utils/draftCache';

export const useToolDraft = <T>(
  key: string,
  fallback: T,
  options?: {
    clearOnReload?: boolean;
  }
) => {
  const initialDraftRef = useRef<T | null>(null);

  if (initialDraftRef.current === null) {
    initialDraftRef.current = readDraftCache(key, fallback, options);
  }

  const persistDraft = useCallback((draft: T, shouldPersist: boolean) => {
    persistDraftCache(key, draft, shouldPersist);
  }, [key]);

  return {
    initialDraft: initialDraftRef.current,
    persistDraft,
  };
};
