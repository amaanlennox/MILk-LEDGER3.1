import { IDBPDatabase, openDB } from 'idb';

const DB_NAME = 'MilkDiaryDB';
const DB_VERSION = 1;
const STORE_NAME = 'keyval';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
}

export async function get<T>(key: IDBValidKey): Promise<T | undefined> {
    const db = await getDb();
    return db.get(STORE_NAME, key);
}

export async function set(key: IDBValidKey, val: any): Promise<IDBValidKey> {
    const db = await getDb();
    return db.put(STORE_NAME, val, key);
}

export async function del(key: IDBValidKey): Promise<void> {
    const db = await getDb();
    return db.delete(STORE_NAME, key);
}
