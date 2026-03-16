import type { Timestamp } from 'firebase/firestore';

// ============ FIRESTORE TIMESTAMP HELPER ============
export type FirestoreDate = Timestamp | Date;

// ============ USERS ============
export interface User {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  officeId?: string;
  officeCoins: number;          // défaut 1000
  totalWins: number;
  totalLosses: number;
  streak: number;               // série en cours (+3 = 3 wins, -2 = 2 losses)
  dundieAwards: string[];       // IDs des dundieAwards gagnés
  createdAt: FirestoreDate;
}

// ============ OFFICES ============
export interface Office {
  id: string;
  name: string;
  inviteCode: string;           // 6 caractères unique (ex: "X7K9M2")
  createdBy: string;            // userId du créateur
  membersCount: number;
  createdAt: FirestoreDate;
}

// ============ MATCHES ============
export type MatchStatus = 'upcoming' | 'live' | 'finished';

export interface MatchOdds {
  home: number;
  draw: number;
  away: number;
}

export interface Match {
  id: string;
  sport: string;                // "football", "basketball", etc.
  league: string;               // "Ligue 1", "Premier League", etc.
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: MatchStatus;
  startTime: FirestoreDate;
  apiMatchId: number;           // ID API-Football
  odds: MatchOdds;
}

// ============ BETS ============
export type BetPrediction = 'home' | 'draw' | 'away';
export type BetStatus = 'pending' | 'won' | 'lost';

export interface Bet {
  id: string;
  userId: string;
  matchId: string;
  officeId: string;
  prediction: BetPrediction;
  amount: number;               // OfficeCoins misés
  oddsAtBet: number;            // cote au moment du pari
  status: BetStatus;
  gainedPoints: number;         // 0 si pending/lost, amount * odds si won
  createdAt: FirestoreDate;
}

// ============ POLLS ============
export interface Poll {
  id: string;
  officeId: string;
  question: string;
  options: string[];            // ["Option A", "Option B", ...]
  votes: Record<string, string>; // userId → choix (valeur = option text)
  createdBy: string;
  closesAt: FirestoreDate;
  createdAt: FirestoreDate;
}

// ============ LEADERBOARD (subcollection) ============
// Path: leaderboard/{officeId}/rankings/{userId}
export interface RankingEntry {
  userId: string;
  displayName: string;
  photoURL?: string;
  points: number;
  wins: number;
  losses: number;
  streak: number;
  rank: number;
}

// ============ DUNDIE AWARDS ============
export interface DundieAward {
  id: string;
  officeId: string;
  title: string;
  emoji: string;                // "🏆", "😏", etc.
  description: string;
  winnerId: string;             // userId
  season: string;               // "2026-S1", "2026-S2", etc.
  createdAt: FirestoreDate;
}
