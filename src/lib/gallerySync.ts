// Dual-Library Unified Real-time Synchronization Engine
// Coordinates real-time updates across CardArt (cardart.cc) and Cardentify (cards.no2.ac)

import { getAllCardArtCards, cacheCardArtCards, normalizeBaseCard, CardArtItem } from './cardArtSync';
import { getAllCardentifyCards, cacheCardentifyCards, getTotalGalleryCardsCount, CardentifyCard } from './cardentifyPresets';

export interface DualSyncResult {
  success: boolean;
  totalCount: number;
  cardArtCount: number;
  cardentifyCount: number;
  newCardsCount: number;
  message: string;
  timestamp: string;
  sourceBreakdown: {
    cardart: number;
    cardentify: number;
  };
}

let lastAutoSyncTimestamp = 0;
let isSyncInProgress = false;

/**
 * Proactively perform dual-library synchronization across CardArt and Cardentify
 */
export async function syncDualLibrariesOnline(force = false): Promise<DualSyncResult> {
  const now = Date.now();
  // Throttle automatic non-forced sync calls to at least 45 seconds apart
  if (!force && isSyncInProgress) {
    const artCount = getAllCardArtCards().length;
    const entifyCount = getAllCardentifyCards().length;
    return {
      success: true,
      totalCount: artCount + entifyCount,
      cardArtCount: artCount,
      cardentifyCount: entifyCount,
      newCardsCount: 0,
      message: `同步进行中，使用当前双库 ${artCount + entifyCount} 款卡面`,
      timestamp: new Date().toISOString(),
      sourceBreakdown: { cardart: artCount, cardentify: entifyCount },
    };
  }

  isSyncInProgress = true;
  lastAutoSyncTimestamp = now;

  try {
    const res = await fetch('/api/gallery/sync-all', { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      let addedArt = 0;
      let addedEntify = 0;

      // 1. Process CardArt items
      if (data.cardartCards && Array.isArray(data.cardartCards)) {
        const normalized = data.cardartCards.map(normalizeBaseCard);
        addedArt = cacheCardArtCards(normalized);
      }

      // 2. Process Cardentify items
      if (data.cardentifyCards && Array.isArray(data.cardentifyCards)) {
        addedEntify = cacheCardentifyCards(data.cardentifyCards);
      }

      const total = getTotalGalleryCardsCount();
      const artCount = getAllCardArtCards().length;
      const entifyCount = getAllCardentifyCards().length;
      const nowIso = data.lastSyncedAt || new Date().toISOString();

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('gallery-updated', {
            detail: {
              total,
              cardArtCount: artCount,
              cardentifyCount: entifyCount,
              newAdded: addedArt + addedEntify,
            },
          })
        );
      }

      return {
        success: true,
        totalCount: total,
        cardArtCount: artCount,
        cardentifyCount: entifyCount,
        newCardsCount: addedArt + addedEntify,
        message:
          addedArt + addedEntify > 0
            ? `✨ 双库实时同步完成！已成功发现并扩充 ${addedArt + addedEntify} 款新卡面（双库共计 ${total} 款）`
            : `✨ 双库已处于最新状态！现有 ${total} 款高清卡面 (CardArt: ${artCount} 款 · Cardentify: ${entifyCount} 款)`,
        timestamp: nowIso,
        sourceBreakdown: { cardart: artCount, cardentify: entifyCount },
      };
    }
  } catch (err) {
    console.warn('[GallerySync] Dual-library online sync warning:', err);
  } finally {
    isSyncInProgress = false;
  }

  // Fallback to local synced cache
  const artCount = getAllCardArtCards().length;
  const entifyCount = getAllCardentifyCards().length;
  const total = artCount + entifyCount;

  return {
    success: true,
    totalCount: total,
    cardArtCount: artCount,
    cardentifyCount: entifyCount,
    newCardsCount: 0,
    message: `双库当前共有 ${total} 款高清卡面 (CardArt: ${artCount} 款 · Cardentify: ${entifyCount} 款)`,
    timestamp: new Date().toISOString(),
    sourceBreakdown: { cardart: artCount, cardentify: entifyCount },
  };
}

/**
 * Query fast server stats without full payload
 */
export async function fetchDualGalleryStats(): Promise<{
  totalCount: number;
  cardartCount: number;
  cardentifyCount: number;
  lastSyncedAt: string;
}> {
  try {
    const res = await fetch('/api/gallery/stats');
    if (res.ok) {
      const data = await res.json();
      return {
        totalCount: data.totalCount || getTotalGalleryCardsCount(),
        cardartCount: data.cardartCount || getAllCardArtCards().length,
        cardentifyCount: data.cardentifyCount || getAllCardentifyCards().length,
        lastSyncedAt: data.lastSyncedAt || new Date().toISOString(),
      };
    }
  } catch {}

  const artCount = getAllCardArtCards().length;
  const entifyCount = getAllCardentifyCards().length;
  return {
    totalCount: artCount + entifyCount,
    cardartCount: artCount,
    cardentifyCount: entifyCount,
    lastSyncedAt: new Date().toISOString(),
  };
}
