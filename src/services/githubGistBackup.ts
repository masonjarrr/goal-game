// GitHub Gist Backup Service
// Handles automatic daily backups to GitHub Gist

const BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
const GIST_DESCRIPTION = 'Goal Game Backup';
const STORAGE_KEY_TOKEN = 'github_gist_token';
const STORAGE_KEY_GIST_ID = 'github_gist_id';
const STORAGE_KEY_LAST_BACKUP = 'github_last_backup';

// Check if backup is configured
export function isConfigured(): boolean {
  return Boolean(localStorage.getItem(STORAGE_KEY_TOKEN));
}

// Check if authenticated
export function isAuthenticated(): boolean {
  return Boolean(localStorage.getItem(STORAGE_KEY_TOKEN));
}

// Get stored token
function getToken(): string | null {
  return localStorage.getItem(STORAGE_KEY_TOKEN);
}

// Save token
export function saveToken(token: string): void {
  localStorage.setItem(STORAGE_KEY_TOKEN, token);
}

// Sign out
export function signOut(): void {
  localStorage.removeItem(STORAGE_KEY_TOKEN);
  localStorage.removeItem(STORAGE_KEY_GIST_ID);
  localStorage.removeItem(STORAGE_KEY_LAST_BACKUP);
}

// Check if backup is needed (24 hours since last backup)
export function isBackupNeeded(): boolean {
  const lastBackup = localStorage.getItem(STORAGE_KEY_LAST_BACKUP);
  if (!lastBackup) return true;
  return Date.now() - Number(lastBackup) > BACKUP_INTERVAL_MS;
}

// Get last backup time
export function getLastBackupTime(): Date | null {
  const lastBackup = localStorage.getItem(STORAGE_KEY_LAST_BACKUP);
  if (!lastBackup) return null;
  return new Date(Number(lastBackup));
}

// Convert Uint8Array to base64
function uint8ArrayToBase64(data: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return btoa(binary);
}

// Convert base64 to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Search for existing backup gist by description
async function findExistingBackupGist(token: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.github.com/gists?per_page=100', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
    });

    if (!response.ok) return null;

    const gists = await response.json();

    // Find gist with matching description
    for (const gist of gists) {
      if (gist.description === GIST_DESCRIPTION) {
        return gist.id;
      }
    }

    return null;
  } catch {
    return null;
  }
}

// Get or create backup gist
async function getOrCreateGist(token: string): Promise<string> {
  const existingGistId = localStorage.getItem(STORAGE_KEY_GIST_ID);

  // Check if existing gist still exists
  if (existingGistId) {
    const response = await fetch(`https://api.github.com/gists/${existingGistId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
    });

    if (response.ok) {
      return existingGistId;
    }
    // Gist was deleted, remove stored ID
    localStorage.removeItem(STORAGE_KEY_GIST_ID);
  }

  // Search for existing backup gist (in case app was reinstalled)
  const foundGistId = await findExistingBackupGist(token);
  if (foundGistId) {
    localStorage.setItem(STORAGE_KEY_GIST_ID, foundGistId);
    return foundGistId;
  }

  // Create new gist
  const response = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description: GIST_DESCRIPTION,
      public: false,
      files: {
        'README.md': {
          content: '# Goal Game Backups\n\nThis gist contains automatic backups of your Goal Game data.\n\nBackups are stored as base64-encoded database files.',
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create backup gist');
  }

  const data = await response.json();
  localStorage.setItem(STORAGE_KEY_GIST_ID, data.id);
  return data.id;
}

// Upload backup to GitHub Gist
export async function uploadBackup(data: Uint8Array): Promise<{ success: boolean; fileName?: string; error?: string }> {
  const token = getToken();
  if (!token) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const gistId = await getOrCreateGist(token);

    // Create filename with timestamp
    const now = new Date();
    const fileName = `backup-${now.toISOString().replace(/[:.]/g, '-')}.db.b64`;

    // Convert to base64 for text storage
    const base64Data = uint8ArrayToBase64(data);

    // Update gist with new backup file
    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: {
          [fileName]: {
            content: base64Data,
          },
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.message || 'Upload failed' };
    }

    // Update last backup time
    localStorage.setItem(STORAGE_KEY_LAST_BACKUP, String(Date.now()));

    return { success: true, fileName };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// List backups from GitHub Gist
export async function listBackups(): Promise<{ fileName: string; size: number }[]> {
  const token = getToken();
  if (!token) return [];

  let gistId = localStorage.getItem(STORAGE_KEY_GIST_ID);

  // If no gist ID stored, try to find existing backup gist
  if (!gistId) {
    gistId = await findExistingBackupGist(token);
    if (gistId) {
      localStorage.setItem(STORAGE_KEY_GIST_ID, gistId);
    } else {
      return [];
    }
  }

  try {
    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
    });

    if (!response.ok) return [];

    const data = await response.json();
    const backups: { fileName: string; size: number }[] = [];

    for (const [fileName, fileData] of Object.entries(data.files)) {
      if (fileName.endsWith('.db.b64')) {
        backups.push({
          fileName,
          size: (fileData as { size: number }).size,
        });
      }
    }

    // Sort by filename (newest first)
    return backups.sort((a, b) => b.fileName.localeCompare(a.fileName));
  } catch {
    return [];
  }
}

// Download a backup from GitHub Gist
export async function downloadBackup(fileName: string): Promise<Uint8Array | null> {
  const token = getToken();
  if (!token) return null;

  const gistId = localStorage.getItem(STORAGE_KEY_GIST_ID);
  if (!gistId) return null;

  try {
    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    const fileData = data.files[fileName];

    if (!fileData) return null;

    // If truncated, fetch raw content
    let content: string;
    if (fileData.truncated) {
      const rawResponse = await fetch(fileData.raw_url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      content = await rawResponse.text();
    } else {
      content = fileData.content;
    }

    return base64ToUint8Array(content);
  } catch {
    return null;
  }
}

// Verify token is valid
export async function verifyToken(token: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Delete old backups (keep only last N)
export async function cleanupOldBackups(keepCount: number = 7): Promise<void> {
  const token = getToken();
  if (!token) return;

  const gistId = localStorage.getItem(STORAGE_KEY_GIST_ID);
  if (!gistId) return;

  try {
    const backups = await listBackups();

    if (backups.length <= keepCount) return;

    const toDelete = backups.slice(keepCount);
    const filesToDelete: Record<string, null> = {};

    for (const backup of toDelete) {
      filesToDelete[backup.fileName] = null;
    }

    await fetch(`https://api.github.com/gists/${gistId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ files: filesToDelete }),
    });
  } catch {
    // Ignore cleanup errors
  }
}
