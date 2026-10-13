import { useEffect, useState } from 'react';

// Runs `fetcher` when `deps` change and ignores results from stale requests.
// Returns the full API body: { data, meta } on success, or the normalized error.
export default function useFetch(fetcher, deps = []) {
  const [state, setState] = useState({ body: null, error: null, loading: true });

  useEffect(() => {
    let active = true;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    fetcher()
      .then((body) => {
        if (active) setState({ body, error: null, loading: false });
      })
      .catch((error) => {
        if (active) setState({ body: null, error, loading: false });
      });

    return () => {
      active = false;
    };
    // The caller controls when to refetch through `deps`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
