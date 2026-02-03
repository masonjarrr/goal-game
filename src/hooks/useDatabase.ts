import { useState, useEffect } from 'react';
import { getDatabase } from '../db/database';

export function useDatabase() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDatabase()
      .then(() => setReady(true))
      .catch((err) => setError(err.message));
  }, []);

  return { ready, error };
}
