import { useEffect, useState } from 'react';

// Loads data from the API when the component appears: { data, error, reload }.
// `load` is a function that returns a promise, e.g. getMyVisits.
// The same loading pattern was repeated in many components; this keeps it in one place.
export function useApiData(load) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let ignore = false;
    load()
      .then((result) => {
        if (!ignore) setData(result);
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      });
    return () => {
      ignore = true;
    };
  }, [load, reloadCount]);

  return { data, error, reload: () => setReloadCount((n) => n + 1) };
}
