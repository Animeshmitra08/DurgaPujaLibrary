import type { StoredTrack } from '../types'

const DB_NAME = 'durga-puja-library'
const DB_VERSION = 1
const STORE = 'tracks'

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  return dbPromise
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode)
        const request = run(transaction.objectStore(STORE))
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      }),
  )
}

export function getAllTracks(): Promise<StoredTrack[]> {
  return tx<StoredTrack[]>('readonly', (store) => store.getAll())
}

export function putTrack(track: StoredTrack): Promise<IDBValidKey> {
  return tx('readwrite', (store) => store.put(track))
}

export function deleteTrack(id: string): Promise<undefined> {
  return tx('readwrite', (store) => store.delete(id))
}

export function clearTracks(): Promise<undefined> {
  return tx('readwrite', (store) => store.clear())
}
