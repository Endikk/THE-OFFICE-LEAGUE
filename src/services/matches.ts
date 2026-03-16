import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Match, MatchStatus, MatchOdds, WorldCupStage } from '../types';

// ─── Créer un match (admin) ───
export async function createMatch(data: {
  homeTeam: string;
  awayTeam: string;
  startTime: Date;
  odds: MatchOdds;
  homeLogo?: string;
  awayLogo?: string;
  worldCupGroup?: string;
  worldCupStage?: WorldCupStage;
  matchday?: number;
  createdBy: string;
}): Promise<string> {
  const matchData = {
    sport: 'football' as const,
    league: 'Coupe du Monde 2026',
    homeTeam: data.homeTeam,
    awayTeam: data.awayTeam,
    homeScore: null,
    awayScore: null,
    status: 'upcoming' as MatchStatus,
    startTime: data.startTime,
    odds: data.odds,
    homeLogo: data.homeLogo || null,
    awayLogo: data.awayLogo || null,
    worldCupGroup: data.worldCupGroup || null,
    worldCupStage: data.worldCupStage || 'group',
    matchday: data.matchday || null,
    createdBy: data.createdBy,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'matches'), matchData);
  return docRef.id;
}

// ─── Mettre à jour un match (admin) ───
export async function updateMatch(matchId: string, data: Partial<{
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: MatchStatus;
  startTime: Date;
  odds: MatchOdds;
  homeLogo: string;
  awayLogo: string;
  worldCupGroup: string;
  worldCupStage: WorldCupStage;
  matchday: number;
}>): Promise<void> {
  await updateDoc(doc(db, 'matches', matchId), data);
}

// ─── Supprimer un match (admin) ───
export async function deleteMatch(matchId: string): Promise<void> {
  await deleteDoc(doc(db, 'matches', matchId));
}

// ─── Passer un match en live (admin) ───
export async function startMatch(matchId: string): Promise<void> {
  await updateDoc(doc(db, 'matches', matchId), {
    status: 'live',
    homeScore: 0,
    awayScore: 0,
  });
}

// ─── Mettre à jour le score (admin) ───
export async function updateMatchScore(
  matchId: string,
  homeScore: number,
  awayScore: number,
  status?: MatchStatus
): Promise<void> {
  const data: Record<string, unknown> = { homeScore, awayScore };
  if (status) data.status = status;
  await updateDoc(doc(db, 'matches', matchId), data);
}

// ─── Terminer un match (admin) ───
export async function finishMatch(matchId: string, homeScore: number, awayScore: number): Promise<void> {
  await updateDoc(doc(db, 'matches', matchId), {
    status: 'finished',
    homeScore,
    awayScore,
  });
}

// ─── Récupérer un match par ID ───
export async function getMatch(matchId: string): Promise<Match | null> {
  const snap = await getDoc(doc(db, 'matches', matchId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Match;
}

// ─── Tous les matchs ───
export async function getAllMatches(): Promise<Match[]> {
  const q = query(
    collection(db, 'matches'),
    orderBy('startTime', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Match));
}

// ─── Matchs à venir ───
export async function getUpcomingMatches(): Promise<Match[]> {
  const q = query(
    collection(db, 'matches'),
    where('status', '==', 'upcoming'),
    orderBy('startTime', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Match));
}

// ─── Matchs en live ───
export async function getLiveMatches(): Promise<Match[]> {
  const q = query(
    collection(db, 'matches'),
    where('status', '==', 'live'),
    orderBy('startTime', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Match));
}

// ─── Matchs terminés ───
export async function getFinishedMatches(limitCount: number = 30): Promise<Match[]> {
  const q = query(
    collection(db, 'matches'),
    where('status', '==', 'finished'),
    orderBy('startTime', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.slice(0, limitCount).map(d => ({ id: d.id, ...d.data() } as Match));
}

// ─── Matchs par groupe ───
export async function getMatchesByGroup(group: string): Promise<Match[]> {
  const q = query(
    collection(db, 'matches'),
    where('worldCupGroup', '==', group),
    orderBy('startTime', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Match));
}

// ─── Matchs par phase ───
export async function getMatchesByStage(stage: WorldCupStage): Promise<Match[]> {
  const q = query(
    collection(db, 'matches'),
    where('worldCupStage', '==', stage),
    orderBy('startTime', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Match));
}

// ─── Déterminer le résultat d'un match (pour résolution des paris) ───
export function getMatchResult(match: Match): 'home' | 'draw' | 'away' | null {
  if (match.status !== 'finished' || match.homeScore === null || match.awayScore === null) {
    return null;
  }
  if (match.homeScore > match.awayScore) return 'home';
  if (match.homeScore < match.awayScore) return 'away';
  return 'draw';
}
