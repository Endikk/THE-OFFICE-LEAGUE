// ============ USER ============
export interface User {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  officeCoins: number;
  officeId?: string;
  totalBets: number;
  wonBets: number;
  dundieAwards: DundieAward[];
  createdAt: Date;
}

// ============ OFFICE (Groupe) ============
export interface Office {
  id: string;
  name: string;
  code: string; // code d'invitation
  ownerId: string;
  members: string[]; // UIDs
  createdAt: Date;
}

// ============ MATCH ============
export interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  league: string;
  date: Date;
  status: 'upcoming' | 'live' | 'finished';
  scoreHome?: number;
  scoreAway?: number;
  apiFootballId: number;
}

export interface Team {
  id: number;
  name: string;
  logo: string;
}

// ============ BET (Pari) ============
export interface Bet {
  id: string;
  userId: string;
  matchId: string;
  officeId: string;
  prediction: 'home' | 'draw' | 'away';
  amount: number; // OfficeCoins misés
  odds: number;
  status: 'pending' | 'won' | 'lost';
  potentialWin: number;
  createdAt: Date;
}

// ============ POLL (Sondage) ============
export interface Poll {
  id: string;
  officeId: string;
  creatorId: string;
  question: string;
  options: PollOption[];
  expiresAt: Date;
  createdAt: Date;
}

export interface PollOption {
  id: string;
  text: string;
  votes: string[]; // UIDs
}

// ============ DUNDIE AWARD ============
export interface DundieAward {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedAt: Date;
}

// ============ LEADERBOARD ============
export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  photoURL?: string;
  officeCoins: number;
  wonBets: number;
  totalBets: number;
  winRate: number;
  rank: number;
}
