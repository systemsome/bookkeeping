// IndexedDB-backed high-capacity storage for Dual-Library Card Art assets
// Solves browser localStorage 5MB quota limitation to store all 8,000+ cards reliably

import { CardArtItem } from './cardArtSync';
import { CardentifyCard } from './cardentifyPresets';

const DB_NAME = 'asset_keeper_gallery_db';
const DB_VERSION = 1;
const STORE_NAME = 'gallery_cards_store';

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.reject(new Error('IndexedDB not supported in this environment'));
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  return dbPromise;
}

export async function saveCardsToStorage(
  cardartCards?: CardArtItem[],
  cardentifyCards?: CardentifyCard[]
): Promise<boolean> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    if (cardartCards && cardartCards.length > 0) {
      store.put(cardartCards, 'cardart_cards');
    }
    if (cardentifyCards && cardentifyCards.length > 0) {
      store.put(cardentifyCards, 'cardentify_cards');
    }
    store.put(new Date().toISOString(), 'last_synced_at');

    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

export async function loadCardsFromStorage(): Promise<{
  cardartCards: CardArtItem[] | null;
  cardentifyCards: CardentifyCard[] | null;
  lastSyncedAt: string | null;
}> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    const artReq = store.get('cardart_cards');
    const entifyReq = store.get('cardentify_cards');
    const syncReq = store.get('last_synced_at');

    return new Promise((resolve) => {
      tx.oncomplete = () => {
        resolve({
          cardartCards: (artReq.result as CardArtItem[]) || null,
          cardentifyCards: (entifyReq.result as CardentifyCard[]) || null,
          lastSyncedAt: (syncReq.result as string) || null,
        });
      };
      tx.onerror = () => {
        resolve({ cardartCards: null, cardentifyCards: null, lastSyncedAt: null });
      };
    });
  } catch {
    return { cardartCards: null, cardentifyCards: null, lastSyncedAt: null };
  }
}
