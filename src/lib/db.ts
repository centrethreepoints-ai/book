// ============================================================
//  قاعدة البيانات المحلية (IndexedDB)
//  المحفوظات: books, units, chapters, lessons, sections,
//  subsections, concepts, terms, documents, maps, tables,
//  charts, activities, questions, answers, worksheets,
//  lesson_plans, tests, test_questions, corrections, pages,
//  sources, settings, pdfs
// ============================================================

const DB_NAME = 'manar-geo-db';
const DB_VERSION = 1;

export const STORES = [
  'books',
  'units',
  'chapters',
  'lessons',
  'sections',
  'subsections',
  'concepts',
  'terms',
  'documents',
  'maps',
  'tables',
  'charts',
  'activities',
  'questions',
  'answers',
  'worksheets',
  'lesson_plans',
  'tests',
  'test_questions',
  'corrections',
  'pages',
  'sources',
  'diagnostics',
  'settings',
  'pdfs',
  'demo',
] as const;

export type StoreName = (typeof STORES)[number];

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const name of STORES) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: 'id' });
        }
      }
      // فهرسات مساعدة
      const t = req.transaction;
      if (!t) return;
      t.objectStore('pages').createIndex('byBook', 'bookId', { unique: false });
      t.objectStore('lessons').createIndex('byBook', 'bookId', { unique: false });
      t.objectStore('concepts').createIndex('byBook', 'bookId', { unique: false });
      t.objectStore('documents').createIndex('byBook', 'bookId', { unique: false });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(store: StoreName, mode: IDBTransactionMode) {
  return openDB().then(
    (db) => db.transaction(store, mode).objectStore(store)
  );
}

export async function idbGet<T>(store: StoreName, id: string): Promise<T | undefined> {
  const s = await tx(store, 'readonly');
  return new Promise((resolve, reject) => {
    const r = s.get(id);
    r.onsuccess = () => resolve(r.result as T | undefined);
    r.onerror = () => reject(r.error);
  });
}

export async function idbPut<T extends { id: string }>(store: StoreName, value: T): Promise<void> {
  const s = await tx(store, 'readwrite');
  return new Promise((resolve, reject) => {
    const r = s.put(value);
    r.onsuccess = () => resolve();
    r.onerror = () => reject(r.error);
  });
}

export async function idbBulkPut<T extends { id: string }>(store: StoreName, values: T[]): Promise<void> {
  if (!values.length) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, 'readwrite');
    const s = t.objectStore(store);
    for (const v of values) s.put(v);
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
}

export async function idbGetAll<T>(store: StoreName): Promise<T[]> {
  const s = await tx(store, 'readonly');
  return new Promise((resolve, reject) => {
    const r = s.getAll();
    r.onsuccess = () => resolve(r.result as T[]);
    r.onerror = () => reject(r.error);
  });
}

export async function idbDelete(store: StoreName, id: string): Promise<void> {
  const s = await tx(store, 'readwrite');
  return new Promise((resolve, reject) => {
    const r = s.delete(id);
    r.onsuccess = () => resolve();
    r.onerror = () => reject(r.error);
  });
}

export async function idbClear(store: StoreName): Promise<void> {
  const s = await tx(store, 'readwrite');
  return new Promise((resolve, reject) => {
    const r = s.clear();
    r.onsuccess = () => resolve();
    r.onerror = () => reject(r.error);
  });
}

export async function idbStoreAll(store: StoreName, values: { id: string }[]): Promise<void> {
  await idbClear(store);
  await idbBulkPut(store, values);
}

/** حفظ ملف PDF في قاعدة البيانات */
export async function storePdf(bookId: string, data: ArrayBuffer): Promise<void> {
  await idbPut('pdfs', { id: bookId, data, storedAt: Date.now() } as never);
}

export async function loadPdf(bookId: string): Promise<ArrayBuffer | undefined> {
  const row = await idbGet<{ id: string; data: ArrayBuffer }>('pdfs', bookId);
  return row?.data;
}
