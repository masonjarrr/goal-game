import { useState, useEffect, useCallback } from 'react';
import * as backup from '../../services/githubGistBackup';
import { exportDatabase, importDatabase } from '../../db/database';
import styles from '../../styles/components/backup.module.css';

interface BackupFile {
  fileName: string;
  size: number;
}

export function BackupSettings() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastBackup, setLastBackup] = useState<Date | null>(null);
  const [backupStatus, setBackupStatus] = useState<string>('');
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [showRestoreList, setShowRestoreList] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [showGistIdInput, setShowGistIdInput] = useState(false);
  const [gistIdInput, setGistIdInput] = useState('');

  const checkAuth = useCallback(() => {
    setIsConnected(backup.isAuthenticated());
    setLastBackup(backup.getLastBackupTime());
  }, []);

  useEffect(() => {
    checkAuth();
    setIsLoading(false);
  }, [checkAuth]);

  const handleConnect = async () => {
    if (!tokenInput.trim()) {
      setBackupStatus('Please enter a GitHub token');
      return;
    }

    setBackupStatus('Verifying token...');
    const isValid = await backup.verifyToken(tokenInput.trim());

    if (isValid) {
      backup.saveToken(tokenInput.trim());
      setIsConnected(true);
      setShowTokenInput(false);
      setTokenInput('');
      setBackupStatus('Connected to GitHub!');
    } else {
      setBackupStatus('Invalid token. Please check and try again.');
    }
  };

  const handleDisconnect = () => {
    backup.signOut();
    setIsConnected(false);
    setLastBackup(null);
    setBackupStatus('Disconnected');
    setBackups([]);
  };

  const handleManualBackup = async () => {
    setBackupStatus('Backing up...');
    try {
      const data = await exportDatabase();
      const result = await backup.uploadBackup(data);

      if (result.success) {
        setBackupStatus(`Backup saved: ${result.fileName}`);
        setLastBackup(new Date());
        // Cleanup old backups (keep last 7)
        await backup.cleanupOldBackups(7);
      } else {
        setBackupStatus(`Backup failed: ${result.error}`);
      }
    } catch (error) {
      setBackupStatus(`Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleShowBackups = async () => {
    setShowRestoreList(!showRestoreList);
    if (!showRestoreList) {
      setBackupStatus('Loading backups...');
      const files = await backup.listBackups();
      setBackups(files);
      setBackupStatus('');
    }
  };

  const handleSetGistId = () => {
    const id = gistIdInput.trim();
    if (!id) {
      setBackupStatus('Please enter a gist ID');
      return;
    }
    // Extract ID from URL if full URL was pasted
    const match = id.match(/([a-f0-9]{32})/i);
    if (match) {
      localStorage.setItem('github_gist_id', match[1]);
      setBackupStatus('Gist ID set! Click "Restore from Backup" to see backups.');
      setShowGistIdInput(false);
      setGistIdInput('');
    } else {
      setBackupStatus('Invalid gist ID. Paste the gist URL or ID.');
    }
  };

  const handleRestore = async (fileName: string) => {
    if (!confirm(`Restore from "${fileName}"? This will replace all current data.`)) {
      return;
    }

    setBackupStatus('Restoring...');
    try {
      const data = await backup.downloadBackup(fileName);
      if (data) {
        await importDatabase(data);
        setBackupStatus('Restored successfully! Refreshing...');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setBackupStatus('Failed to download backup');
      }
    } catch (error) {
      setBackupStatus(`Restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const formatFileName = (fileName: string) => {
    // Convert backup-2024-01-15T10-30-00-000Z.db.b64 to readable format
    const match = fileName.match(/backup-(\d{4})-(\d{2})-(\d{2})T(\d{2})-(\d{2})/);
    if (match) {
      const [, year, month, day, hour, minute] = match;
      return `${year}-${month}-${day} ${hour}:${minute}`;
    }
    return fileName;
  };

  if (isLoading) {
    return <div className={styles.container}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Cloud Backup (GitHub)</h3>

      <div className={styles.status}>
        <span className={`${styles.indicator} ${isConnected ? styles.connected : styles.disconnected}`} />
        <span>{isConnected ? 'Connected to GitHub' : 'Not connected'}</span>
      </div>

      {lastBackup && (
        <p className={styles.lastBackup}>
          Last backup: {lastBackup.toLocaleString()}
        </p>
      )}

      {backupStatus && (
        <p className={styles.statusMessage}>{backupStatus}</p>
      )}

      <div className={styles.actions}>
        {!isConnected ? (
          <>
            {!showTokenInput ? (
              <button onClick={() => setShowTokenInput(true)} className={styles.button}>
                Connect GitHub
              </button>
            ) : (
              <div className={styles.tokenInputContainer}>
                <p className={styles.tokenHelp}>
                  Create a token at <a href="https://github.com/settings/tokens/new?description=Goal%20Game%20Backup&scopes=gist" target="_blank" rel="noopener noreferrer">GitHub Settings</a> with <strong>gist</strong> scope.
                </p>
                <input
                  type="password"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Paste your GitHub token"
                  className={styles.tokenInput}
                />
                <div className={styles.tokenActions}>
                  <button onClick={handleConnect} className={styles.button}>
                    Save Token
                  </button>
                  <button onClick={() => { setShowTokenInput(false); setTokenInput(''); }} className={styles.buttonSecondary}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <button onClick={handleManualBackup} className={styles.button}>
              Backup Now
            </button>
            <button onClick={handleShowBackups} className={styles.buttonSecondary}>
              {showRestoreList ? 'Hide Backups' : 'Restore from Backup'}
            </button>
            <button onClick={() => setShowGistIdInput(!showGistIdInput)} className={styles.buttonSecondary}>
              {showGistIdInput ? 'Cancel' : 'Link Existing Gist'}
            </button>
            <button onClick={handleDisconnect} className={styles.buttonDanger}>
              Disconnect
            </button>
            {showGistIdInput && (
              <div className={styles.tokenInputContainer}>
                <p className={styles.tokenHelp}>
                  Paste your gist URL or ID to restore from an existing backup:
                </p>
                <input
                  type="text"
                  value={gistIdInput}
                  onChange={(e) => setGistIdInput(e.target.value)}
                  placeholder="https://gist.github.com/user/abc123... or just abc123..."
                  className={styles.tokenInput}
                />
                <button onClick={handleSetGistId} className={styles.button}>
                  Link Gist
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showRestoreList && backups.length > 0 && (
        <div className={styles.backupList}>
          <h4>Available Backups (Last 7 kept)</h4>
          {backups.map((file) => (
            <div key={file.fileName} className={styles.backupItem}>
              <span className={styles.backupName}>{formatFileName(file.fileName)}</span>
              <span className={styles.backupDate}>{Math.round(file.size / 1024)} KB</span>
              <button
                onClick={() => handleRestore(file.fileName)}
                className={styles.restoreButton}
              >
                Restore
              </button>
            </div>
          ))}
        </div>
      )}

      {showRestoreList && backups.length === 0 && (
        <p className={styles.noBackups}>No backups found</p>
      )}
    </div>
  );
}
