import {
  doc,
  getDoc,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

const CACHE_COLLECTION = 'apiCache';

// Durées de cache par contexte
const CACHE_DURATIONS = {
  fixtures_today: 10 * 60 * 1000,      // 10 minutes pour les matchs du jour
  fixtures_live: 60 * 1000,             // 1 minute pour les matchs live
  fixtures_upcoming: 30 * 60 * 1000,    // 30 minutes pour les matchs à venir
  standings: 6 * 60 * 60 * 1000,        // 6 heures pour les classements
  worldcup: 15 * 60 * 1000,             // 15 minutes pour la Coupe du Monde
} as const;

type CacheContext = keyof typeof CACHE_DURATIONS;

interface CacheDoc {
  data: string;
  expiresAt: Timestamp;
  createdAt: Timestamp;
}

// ─── Lire depuis le cache ───
export async function getFromCache<T>(cacheKey: string): Promise<T | null> {
  try {
    const snap = await getDoc(doc(db, CACHE_COLLECTION, cacheKey));
    if (!snap.exists()) return null;

    const cached = snap.data() as CacheDoc;
    const now = Timestamp.now();

    // Expiré ?
    if (cached.expiresAt.toMillis() < now.toMillis()) {
      return null;
    }

    return JSON.parse(cached.data) as T;
  } catch {
    return null;
  }
}

// ─── Écrire dans le cache ───
export async function setInCache<T>(
  cacheKey: string,
  data: T,
  context: CacheContext
): Promise<void> {
  try {
    const now = Timestamp.now();
    const duration = CACHE_DURATIONS[context];
    const expiresAt = Timestamp.fromMillis(now.toMillis() + duration);

    const cacheDoc: CacheDoc = {
      data: JSON.stringify(data),
      expiresAt,
      createdAt: now,
    };

    await setDoc(doc(db, CACHE_COLLECTION, cacheKey), cacheDoc);
  } catch {
    // Silently fail - cache is optional
  }
}

// ─── Fetch avec cache ───
export async function cachedFetch<T>(
  cacheKey: string,
  context: CacheContext,
  fetcher: () => Promise<T>
): Promise<T> {
  // 1. Tenter le cache
  const cached = await getFromCache<T>(cacheKey);
  if (cached !== null) return cached;

  // 2. Fetch réel
  const data = await fetcher();

  // 3. Mettre en cache
  await setInCache(cacheKey, data, context);

  return data;
}

export { CACHE_DURATIONS };
export type { CacheContext };
