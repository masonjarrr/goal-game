import initSqlJs, { Database } from 'sql.js';
import { CREATE_TABLES, SEED_DOMAINS, SEED_CHARACTER } from './schema';

const DB_NAME = 'goal-game-db';
const DB_STORE = 'database';
const DB_KEY = 'main';

let db: Database | null = null;

function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const idb = request.result;
      if (!idb.objectStoreNames.contains(DB_STORE)) {
        idb.createObjectStore(DB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function loadFromIndexedDB(): Promise<Uint8Array | null> {
  const idb = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(DB_STORE, 'readonly');
    const store = tx.objectStore(DB_STORE);
    const request = store.get(DB_KEY);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => idb.close();
  });
}

async function saveToIndexedDB(data: Uint8Array): Promise<void> {
  const idb = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(DB_STORE, 'readwrite');
    const store = tx.objectStore(DB_STORE);
    store.put(data, DB_KEY);
    tx.oncomplete = () => {
      idb.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function getDatabase(): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs({
    locateFile: () => `${import.meta.env.BASE_URL}sql-wasm.wasm`,
  });

  const saved = await loadFromIndexedDB();
  if (saved) {
    db = new SQL.Database(saved);
  } else {
    db = new SQL.Database();
  }

  // Ensure tables exist (idempotent)
  db.run(CREATE_TABLES);
  db.run(SEED_DOMAINS);
  db.run(SEED_CHARACTER);

  await persist();
  return db;
}

export async function persist(): Promise<void> {
  if (!db) return;
  const data = db.export();
  await saveToIndexedDB(data);
}

export function getDB(): Database {
  if (!db) throw new Error('Database not initialized. Call getDatabase() first.');
  return db;
}

export async function exportDatabase(): Promise<Uint8Array> {
  const d = getDB();
  return d.export();
}

export async function importDatabase(data: Uint8Array): Promise<void> {
  const SQL = await initSqlJs({
    locateFile: () => `${import.meta.env.BASE_URL}sql-wasm.wasm`,
  });
  if (db) db.close();
  db = new SQL.Database(data);
  await persist();
}
