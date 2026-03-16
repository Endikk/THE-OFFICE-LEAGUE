import type { Timestamp } from 'firebase/firestore';

// ============ FIRESTORE TIMESTAMP HELPER ============
export type FirestoreDate = Timestamp | Date;

// ============ SPORTS ============
export type Sport = 'football' | 'basketball' | 'nfl' | 'rugby';

export const SPORT_CONFIG: Record<Sport, { emoji: string; label: string }> = {
  football: { emoji: '⚽', label: 'Football' },
  basketball: { emoji: '🏀', label: 'NBA' },
  nfl: { emoji: '🏈', label: 'NFL' },
  rugby: { emoji: '🏉', label: 'Rugby' },
};

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
  sport: Sport;
  league: string;               // "Ligue 1", "Premier League", etc.
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string;
  awayLogo?: string;
  homeScore: number | null;
  awayScore: number | null;
  status: MatchStatus;
  startTime: FirestoreDate;
  apiMatchId: number;           // ID API-Football ou hash ESPN
  odds: MatchOdds;
  apiSource?: 'api-football' | 'espn' | 'balldontlie';
  isWorldCup?: boolean;
  worldCupGroup?: string;       // "A", "B", etc.
  worldCupStage?: WorldCupStage;
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
export type PollCategory = 'sport' | 'team_building' | 'fun';

export const POLL_CATEGORY_CONFIG: Record<PollCategory, { emoji: string; label: string; color: string }> = {
  sport: { emoji: '🏆', label: 'Sportif', color: 'text-office-navy' },
  team_building: { emoji: '🤝', label: 'Team Building', color: 'text-office-green' },
  fun: { emoji: '🎉', label: 'Fun', color: 'text-office-mustard' },
};

export interface Poll {
  id: string;
  officeId: string;
  question: string;
  options: string[];            // ["Option A", "Option B", ...]
  votes: Record<string, string>; // userId → choix (valeur = option text)
  createdBy: string;
  category: PollCategory;
  emoji?: string;               // emoji personnalisé pour le sondage
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

// ============ API CACHE ============
export interface ApiCacheEntry {
  id: string;
  data: string;                 // JSON stringified
  expiresAt: FirestoreDate;
  sport: Sport;
  cacheKey: string;
  createdAt: FirestoreDate;
}

// ============ WORLD CUP 2026 ============
export type WorldCupStage = 'group' | 'round_of_32' | 'round_of_16' | 'quarter' | 'semi' | 'third_place' | 'final';

export interface WorldCupTeam {
  id: number | string;
  name: string;
  code: string;                 // "FRA", "BRA", etc.
  flag?: string;
  group: string;                // "A", "B", etc.
}

export interface WorldCupGroup {
  name: string;                 // "Groupe A"
  teams: WorldCupGroupTeam[];
}

export interface WorldCupGroupTeam {
  team: WorldCupTeam;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface WorldCupSpecialBet {
  id: string;
  officeId: string;
  userId: string;
  type: 'winner' | 'top_scorer' | 'exact_score';
  prediction: string;           // nom d'équipe, joueur, ou "2-1"
  matchId?: string;             // pour exact_score seulement
  amount: number;
  status: BetStatus;
  gainedPoints: number;
  createdAt: FirestoreDate;
}
