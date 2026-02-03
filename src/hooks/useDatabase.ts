import { useState, useEffect } from 'react';
import { getDatabase } from '../db/database';
import { runFebruary2026BillingMigration } from '../db/migrations/february2026Billing';

export function useDatabase() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDatabase()
      .then(async () => {
        // Run migrations
        await runFebruary2026BillingMigration();
        setReady(true);
      })
      .catch((err) => setError(err.message));
  }, []);

  return { ready, error };
}
