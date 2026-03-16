import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import type { RankingEntry, User } from '../types';

// Path: leaderboard/{officeId}/rankings/{userId}

// ─── Récupérer le classement d'un office ───
export async function getLeaderboard(officeId: string): Promise<RankingEntry[]> {
  const q = query(
    collection(db, 'leaderboard', officeId, 'rankings'),
    orderBy('points', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d, index) => ({
    ...(d.data() as RankingEntry),
    userId: d.id,
    rank: index + 1,
  }));
}

// ─── Récupérer le rang d'un user ───
export async function getUserRanking(officeId: string, userId: string): Promise<RankingEntry | null> {
  const snap = await getDoc(doc(db, 'leaderboard', officeId, 'rankings', userId));
  if (!snap.exists()) return null;
  return { userId: snap.id, ...snap.data() } as RankingEntry;
}

// ─── Mettre à jour l'entrée d'un user dans le leaderboard ───
export async function updateRanking(officeId: string, user: User): Promise<void> {
  const entry: Omit<RankingEntry, 'rank'> = {
    userId: user.uid,
    displayName: user.displayName,
    photoURL: user.photoURL,
    points: user.officeCoins,
    wins: user.totalWins,
    losses: user.totalLosses,
    streak: user.streak,
  };

  await setDoc(
    doc(db, 'leaderboard', officeId, 'rankings', user.uid),
    entry,
    { merge: true }
  );
}

// ─── Recalculer tout le classement d'un office ───
// Appelé périodiquement ou après résolution de paris
export async function rebuildLeaderboard(
  officeId: string,
  members: User[]
): Promise<RankingEntry[]> {
  // Trier par points décroissants
  const sorted = [...members].sort((a, b) => b.officeCoins - a.officeCoins);

  const batch = writeBatch(db);

  const entries: RankingEntry[] = sorted.map((user, index) => {
    const entry: RankingEntry = {
      userId: user.uid,
      displayName: user.displayName,
      photoURL: user.photoURL,
      points: user.officeCoins,
      wins: user.totalWins,
      losses: user.totalLosses,
      streak: user.streak,
      rank: index + 1,
    };

    batch.set(
      doc(db, 'leaderboard', officeId, 'rankings', user.uid),
      entry
    );

    return entry;
  });

  await batch.commit();
  return entries;
}
