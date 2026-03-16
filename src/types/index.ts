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
  totalBets: number;
  favoriteRate: number;         // % de paris sur les favoris (cote < 2.0)
}

// ─── Titres dynamiques basés sur les stats ───
export type LeaderboardTitle =
  | 'Le Nostradamus'
  | 'Le Flambeur'
  | 'Ice Cold Bets'
  | 'Le Soldat'
  | 'Mr. Decontracte'
  | 'Le Fantome'
  | 'Le Rookie';

export const LEADERBOARD_TITLES: Record<LeaderboardTitle, { emoji: string; description: string }> = {
  'Le Nostradamus': { emoji: '🔮', description: 'Plus de victoires' },
  'Le Flambeur': { emoji: '💸', description: 'Plus de defaites' },
  'Ice Cold Bets': { emoji: '🧊', description: 'Ne parie que sur les favoris' },
  'Le Soldat': { emoji: '🫡', description: 'Le plus de paris places' },
  'Mr. Decontracte': { emoji: '😎', description: 'Meilleur ratio wins/losses' },
  'Le Fantome': { emoji: '👻', description: '0 participation' },
  'Le Rookie': { emoji: '🐣', description: 'Nouveau dans le game' },
};

// ============ DUNDIE AWARDS ============
export type DundieType =
  | 'nostradamus'
  | 'flambeur'
  | 'ice_cold'
  | 'chaotique'
  | 'statisticien'
  | 'fantome'
  | 'decontracte'
  | 'soldat';

export interface DundieAward {
  id: string;
  officeId: string;
  title: string;
  emoji: string;                // "🏆", "😏", etc.
  description: string;
  winnerId: string;             // userId
  winnerName?: string;          // displayName du gagnant
  season: string;               // "2026-S1", "2026-S2", etc.
  dundieType?: DundieType;      // type pour dédupliquer
  period?: 'weekly' | 'monthly';
  createdAt: FirestoreDate;
}

export const DUNDIE_CATALOG: Record<DundieType, { title: string; emoji: string; description: string }> = {
  nostradamus: { title: 'Le Nostradamus', emoji: '🏆', description: 'Plus long streak de bonnes reponses' },
  flambeur: { title: 'Le Flambeur', emoji: '💸', description: 'A le plus perdu en une semaine' },
  ice_cold: { title: 'Ice Cold Bets', emoji: '🧊', description: 'Ne joue que les favoris' },
  chaotique: { title: 'Le Chaotique', emoji: '🎰', description: 'Parie toujours sur l\'outsider' },
  statisticien: { title: 'Le Statisticien', emoji: '📊', description: 'Meilleur ratio wins/losses' },
  fantome: { title: 'Le Fantome', emoji: '😐', description: 'Le moins actif' },
  decontracte: { title: 'Mr. Decontracte', emoji: '😎', description: 'Gagne sans forcer' },
  soldat: { title: 'Le Soldat', emoji: '🫡', description: 'Le plus de paris places' },
};

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

// ============ NOTIFICATIONS ============
export type AppNotifType =
  | 'match_reminder'    // match commence dans 30 min
  | 'bet_won'           // pari gagné
  | 'bet_lost'          // pari perdu
  | 'poll_created'      // nouveau sondage
  | 'leaderboard_pass'  // quelqu'un te dépasse
  | 'dundie_awarded'    // tu reçois un dundie
  | 'match_live'        // un match est en direct
  | 'match_finished';   // un match est terminé

export interface AppNotification {
  id: string;
  userId: string;
  officeId: string;
  type: AppNotifType;
  emoji: string;
  title: string;
  message: string;
  read: boolean;
  data?: Record<string, string>;  // matchId, pollId, etc.
  createdAt: FirestoreDate;
}
