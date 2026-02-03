import { useEffect, useRef, useState } from 'react';
import * as backup from '../services/githubGistBackup';
import { exportDatabase } from '../db/database';

export function useAutoBackup() {
  const [status, setStatus] = useState<'idle' | 'backing-up' | 'success' | 'error'>('idle');
  const [lastBackup, setLastBackup] = useState<Date | null>(null);
  const [message, setMessage] = useState<string>('');
  const hasAttemptedRef = useRef(false);

  useEffect(() => {
    // Only attempt once per session
    if (hasAttemptedRef.current) return;
    hasAttemptedRef.current = true;

    const attemptAutoBackup = async () => {
      // Check if backup is configured
      if (!backup.isConfigured()) {
        return;
      }

      // Check if we're authenticated
      if (!backup.isAuthenticated()) {
        return;
      }

      // Check if backup is needed (24 hours since last)
      if (!backup.isBackupNeeded()) {
        setLastBackup(backup.getLastBackupTime());
        return;
      }

      // Perform auto backup
      setStatus('backing-up');
      setMessage('Auto-backing up to GitHub...');

      try {
        const data = await exportDatabase();
        const result = await backup.uploadBackup(data);

        if (result.success) {
          setStatus('success');
          setMessage('Auto-backup complete!');
          setLastBackup(new Date());

          // Cleanup old backups (keep last 7)
          await backup.cleanupOldBackups(7);

          // Clear success message after 5 seconds
          setTimeout(() => {
            setStatus('idle');
            setMessage('');
          }, 5000);
        } else {
          setStatus('error');
          setMessage(`Auto-backup failed: ${result.error}`);
        }
      } catch (error) {
        setStatus('error');
        setMessage(`Auto-backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    // Wait a bit for the app to fully load before attempting backup
    const timer = setTimeout(attemptAutoBackup, 3000);
    return () => clearTimeout(timer);
  }, []);

  return { status, lastBackup, message };
}
