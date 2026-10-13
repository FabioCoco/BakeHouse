import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

// Reads and writes URL query params. Pass undefined, null, or '' to remove a key.
export default function useQueryParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const setParams = useCallback(
    (updates, { replace = true } = {}) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(updates).forEach(([key, value]) => {
            if (value === undefined || value === null || value === '') {
              next.delete(key);
            } else {
              next.set(key, String(value));
            }
          });
          return next;
        },
        { replace },
      );
    },
    [setSearchParams],
  );

  return [searchParams, setParams];
}
