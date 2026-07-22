import { openDB, IDBPDatabase } from 'idb';

export interface GalleryEntry {
  id: string;
  prompt: string;
  enhancedPrompt: string;
  model: string;
  provider: string;
  params: Record<string, unknown>;
  images: { url: string; thumbnail?: string }[];
  timestamp: number;
  tags?: string[];
  note?: string;
}

const DB_NAME = 't2i-gallery';
const DB_VERSION = 1;
const STORE = 'entries';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('model', 'model', { unique: false });
          store.createIndex('provider', 'provider', { unique: false });
        }
      },
    });
  }
  return dbPromise;
}

export async function addEntry(entry: GalleryEntry): Promise<void> {
  const db = await getDb();
  await db.add(STORE, entry);
}

export async function getAllEntries(): Promise<GalleryEntry[]> {
  const db = await getDb();
  const entries = await db.getAll(STORE);
  return entries.sort((a, b) => b.timestamp - a.timestamp);
}

export async function getEntry(id: string): Promise<GalleryEntry | undefined> {
  const db = await getDb();
  return db.get(STORE, id);
}

export async function deleteEntry(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE, id);
}

export async function clearAll(): Promise<void> {
  const db = await getDb();
  await db.clear(STORE);
}

export async function getEntriesByModel(model: string): Promise<GalleryEntry[]> {
  const db = await getDb();
  const entries = await db.getAllFromIndex(STORE, 'model', model);
  return entries.sort((a, b) => b.timestamp - a.timestamp);
}

export async function getEntriesByDateRange(
  from: number,
  to: number
): Promise<GalleryEntry[]> {
  const db = await getDb();
  const all = await db.getAll(STORE);
  return all
    .filter((e) => e.timestamp >= from && e.timestamp <= to)
    .sort((a, b) => b.timestamp - a.timestamp);
}