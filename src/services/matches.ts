import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,

} from 'firebase/firestore';
import { db } from './firebase';
import type { Match, MatchStatus, MatchOdds } from '../types';

// ─── Créer / importer un match (depuis l'API-Football) ───
export async function upsertMatch(data: {
  apiMatchId: number;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  startTime: Date;
  odds: MatchOdds;
  status?: MatchStatus;
  homeScore?: number | null;
  awayScore?: number | null;
}): Promise<string> {
  // Utiliser apiMatchId comme ID doc pour éviter les doublons
  const docId = `api_${data.apiMatchId}`;
  const matchRef = doc(db, 'matches', docId);

  const matchData: Omit<Match, 'id'> = {
    sport: data.sport,
    league: data.league,
    homeTeam: data.homeTeam,
    awayTeam: data.awayTeam,
    homeScore: data.homeScore ?? null,
    awayScore: data.awayScore ?? null,
    status: data.status || 'upcoming',
    startTime: data.startTime,
    apiMatchId: data.apiMatchId,
    odds: data.odds,
  };

  await setDoc(matchRef, matchData, { merge: true });
  return docId;
}

// ─── Récupérer un match par ID ───
export async function getMatch(matchId: string): Promise<Match | null> {
  const snap = await getDoc(doc(db, 'matches', matchId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Match;
}

// ─── Récupérer un match par apiMatchId ───
export async function getMatchByApiId(apiMatchId: number): Promise<Match | null> {
  return getMatch(`api_${apiMatchId}`);
}

// ─── Matchs à venir ───
export async function getUpcomingMatches(league?: string): Promise<Match[]> {
  let q;
  if (league) {
    q = query(
      collection(db, 'matches'),
      where('status', '==', 'upcoming'),
      where('league', '==', league),
      orderBy('startTime', 'asc')
    );
  } else {
    q = query(
      collection(db, 'matches'),
      where('status', '==', 'upcoming'),
      orderBy('startTime', 'asc')
    );
  }
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
export async function getFinishedMatches(league?: string, limitCount: number = 20): Promise<Match[]> {
  let q;
  if (league) {
    q = query(
      collection(db, 'matches'),
      where('status', '==', 'finished'),
      where('league', '==', league),
      orderBy('startTime', 'desc')
    );
  } else {
    q = query(
      collection(db, 'matches'),
      where('status', '==', 'finished'),
      orderBy('startTime', 'desc')
    );
  }
  const snapshot = await getDocs(q);
  // Limit côté client (Firestore v9 web n'a pas de limit dans query composite facilement)
  return snapshot.docs.slice(0, limitCount).map(d => ({ id: d.id, ...d.data() } as Match));
}

// ─── Mettre à jour le score / statut d'un match ───
export async function updateMatchScore(
  matchId: string,
  homeScore: number,
  awayScore: number,
  status: MatchStatus
): Promise<void> {
  await updateDoc(doc(db, 'matches', matchId), {
    homeScore,
    awayScore,
    status,
  });
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
