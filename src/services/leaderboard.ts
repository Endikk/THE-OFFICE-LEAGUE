import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  orderBy,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import type { RankingEntry, User, LeaderboardTitle } from '../types';

// Path: leaderboard/{officeId}/rankings/{userId}

// ─── Titre dynamique basé sur les stats ───
export function getDynamicTitle(entry: RankingEntry, allEntries: RankingEntry[]): { title: LeaderboardTitle; emoji: string } {
  const total = entry.wins + entry.losses;

  // 0 participation
  if (total === 0) {
    return { title: 'Le Fantome', emoji: '👻' };
  }

  // Moins de 3 paris → Rookie
  if (total < 3) {
    return { title: 'Le Rookie', emoji: '🐣' };
  }

  const winRate = total > 0 ? entry.wins / total : 0;
  const activeEntries = allEntries.filter(e => (e.wins + e.losses) >= 3);

  // Trouver le "champion" de chaque catégorie parmi les actifs
  const mostWins = activeEntries.reduce((max, e) => e.wins > max.wins ? e : max, activeEntries[0]);
  const mostLosses = activeEntries.reduce((max, e) => e.losses > max.losses ? e : max, activeEntries[0]);
  const mostBets = activeEntries.reduce((max, e) => (e.wins + e.losses) > (max.wins + max.losses) ? e : max, activeEntries[0]);
  const bestRatio = activeEntries.reduce((max, e) => {
    const eTotal = e.wins + e.losses;
    const maxTotal = max.wins + max.losses;
    const eRate = eTotal > 0 ? e.wins / eTotal : 0;
    const maxRate = maxTotal > 0 ? max.wins / maxTotal : 0;
    return eRate > maxRate ? e : max;
  }, activeEntries[0]);

  // Favoris only (>60% de paris sur favoris)
  if (entry.favoriteRate > 60) {
    return { title: 'Ice Cold Bets', emoji: '🧊' };
  }

  // Meilleur ratio (minimum 5 paris)
  if (bestRatio && entry.userId === bestRatio.userId && total >= 5 && winRate > 0.6) {
    return { title: 'Mr. Decontracte', emoji: '😎' };
  }

  // Plus de wins
  if (mostWins && entry.userId === mostWins.userId) {
    return { title: 'Le Nostradamus', emoji: '🔮' };
  }

  // Plus de participations
  if (mostBets && entry.userId === mostBets.userId) {
    return { title: 'Le Soldat', emoji: '🫡' };
  }

  // Plus de losses
  if (mostLosses && entry.userId === mostLosses.userId) {
    return { title: 'Le Flambeur', emoji: '💸' };
  }

  // Defaut basé sur le ratio
  if (winRate >= 0.6) return { title: 'Le Nostradamus', emoji: '🔮' };
  if (winRate <= 0.35) return { title: 'Le Flambeur', emoji: '💸' };
  return { title: 'Le Soldat', emoji: '🫡' };
}

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

// ─── Listener temps réel sur le classement ───
export function subscribeToLeaderboard(
  officeId: string,
  callback: (entries: RankingEntry[]) => void
): () => void {
  const q = query(
    collection(db, 'leaderboard', officeId, 'rankings'),
    orderBy('points', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const entries = snapshot.docs.map((d, index) => ({
      ...(d.data() as RankingEntry),
      userId: d.id,
      rank: index + 1,
    }));
    callback(entries);
  });
}

// ─── Récupérer le rang d'un user ───
export async function getUserRanking(officeId: string, userId: string): Promise<RankingEntry | null> {
  const snap = await getDoc(doc(db, 'leaderboard', officeId, 'rankings', userId));
  if (!snap.exists()) return null;
  return { userId: snap.id, ...snap.data() } as RankingEntry;
}

// ─── Mettre à jour l'entrée d'un user dans le leaderboard ───
export async function updateRanking(officeId: string, user: User, favoriteRate?: number): Promise<void> {
  const entry: Omit<RankingEntry, 'rank'> = {
    userId: user.uid,
    displayName: user.displayName,
    photoURL: user.photoURL,
    points: user.officeCoins,
    wins: user.totalWins,
    losses: user.totalLosses,
    streak: user.streak,
    totalBets: user.totalWins + user.totalLosses,
    favoriteRate: favoriteRate ?? 0,
  };

  await setDoc(
    doc(db, 'leaderboard', officeId, 'rankings', user.uid),
    entry,
    { merge: true }
  );
}

// ─── Recalculer tout le classement d'un office ───
export async function rebuildLeaderboard(
  officeId: string,
  members: User[]
): Promise<RankingEntry[]> {
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
      totalBets: user.totalWins + user.totalLosses,
      favoriteRate: 0,
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
