// IndexedDB-backed keystore for wrapped private keys

import { openDB, type IDBPDatabase } from 'idb';

export interface WrappedKeyData {
  wrappedECDHPrivateKey: string;
  wrappedSigningPrivateKey: string;
  salt: string;
  iv: string;
}

interface KeyStoreSchema {
  keystore: {
    key: string;
    value: WrappedKeyData;
  };
}

const DB_NAME = '25th-july-keys';
const DB_VERSION = 1;
const STORE_NAME = 'keystore';
const KEY_ID = 'user-keys';

let dbInstance: IDBPDatabase<KeyStoreSchema> | null = null;

async function getDB(): Promise<IDBPDatabase<KeyStoreSchema>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<KeyStoreSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });

  return dbInstance;
}

export async function storeWrappedKeys(data: WrappedKeyData): Promise<void> {
  const db = await getDB();
  await db.put(STORE_NAME, data, KEY_ID);
}

export async function getWrappedKeys(): Promise<WrappedKeyData | undefined> {
  const db = await getDB();
  return db.get(STORE_NAME, KEY_ID);
}

export async function clearKeys(): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, KEY_ID);
}

export async function hasStoredKeys(): Promise<boolean> {
  const db = await getDB();
  const keys = await db.get(STORE_NAME, KEY_ID);
  return keys !== undefined;
}
