import { useEffect, useRef, useState } from 'react';

export const useCopyFeedback = <T extends string | number>(duration = 1200) => {
  const [copiedKey, setCopiedKey] = useState<T | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const copyText = async (text: string | number, key: T) => {
    await navigator.clipboard.writeText(String(text));
    setCopiedKey(key);

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      setCopiedKey(current => (current === key ? null : current));
    }, duration);
  };

  return {
    copiedKey,
    copyText,
  };
};
