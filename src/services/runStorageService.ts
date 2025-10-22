import { RunSession, RunPoint, RunSplit } from '@/types/run';

const DB_NAME = 'tapfit_runs';
const DB_VERSION = 1;
const SESSIONS_STORE = 'sessions';
const POINTS_STORE = 'points';
const SPLITS_STORE = 'splits';

class RunStorageService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create sessions store
        if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
          const sessionsStore = db.createObjectStore(SESSIONS_STORE, { keyPath: 'id' });
          sessionsStore.createIndex('user_id', 'user_id', { unique: false });
          sessionsStore.createIndex('status', 'status', { unique: false });
          sessionsStore.createIndex('started_at', 'started_at', { unique: false });
        }

        // Create points store
        if (!db.objectStoreNames.contains(POINTS_STORE)) {
          const pointsStore = db.createObjectStore(POINTS_STORE, { autoIncrement: true });
          pointsStore.createIndex('session_id', 'session_id', { unique: false });
        }

        // Create splits store
        if (!db.objectStoreNames.contains(SPLITS_STORE)) {
          const splitsStore = db.createObjectStore(SPLITS_STORE, { autoIncrement: true });
          splitsStore.createIndex('session_id', 'session_id', { unique: false });
        }
      };
    });
  }

  async saveSession(session: RunSession): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SESSIONS_STORE], 'readwrite');
      const store = transaction.objectStore(SESSIONS_STORE);
      const request = store.put(session);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSession(id: string): Promise<RunSession | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SESSIONS_STORE], 'readonly');
      const store = transaction.objectStore(SESSIONS_STORE);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getActiveSession(): Promise<RunSession | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SESSIONS_STORE], 'readonly');
      const store = transaction.objectStore(SESSIONS_STORE);
      const index = store.index('status');
      const request = index.get('active');

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllSessions(userId: string): Promise<RunSession[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SESSIONS_STORE], 'readonly');
      const store = transaction.objectStore(SESSIONS_STORE);
      const index = store.index('user_id');
      const request = index.getAll(userId);

      request.onsuccess = () => {
        const sessions = request.result || [];
        // Sort by date, newest first
        sessions.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
        resolve(sessions);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteSession(id: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [SESSIONS_STORE, POINTS_STORE, SPLITS_STORE],
        'readwrite'
      );

      // Delete session
      const sessionsStore = transaction.objectStore(SESSIONS_STORE);
      sessionsStore.delete(id);

      // Delete associated points
      const pointsStore = transaction.objectStore(POINTS_STORE);
      const pointsIndex = pointsStore.index('session_id');
      const pointsRequest = pointsIndex.openCursor(IDBKeyRange.only(id));
      pointsRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      // Delete associated splits
      const splitsStore = transaction.objectStore(SPLITS_STORE);
      const splitsIndex = splitsStore.index('session_id');
      const splitsRequest = splitsIndex.openCursor(IDBKeyRange.only(id));
      splitsRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async savePoints(sessionId: string, points: RunPoint[]): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([POINTS_STORE], 'readwrite');
      const store = transaction.objectStore(POINTS_STORE);

      points.forEach(point => {
        store.add({ session_id: sessionId, ...point });
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async saveSplit(sessionId: string, split: RunSplit): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SPLITS_STORE], 'readwrite');
      const store = transaction.objectStore(SPLITS_STORE);
      const request = store.add({ session_id: sessionId, ...split });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const runStorageService = new RunStorageService();
