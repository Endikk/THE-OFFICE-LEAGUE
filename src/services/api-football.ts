import { incrementApiFootballCounter } from './api-cache';

const API_BASE = 'https://v3.football.api-sports.io';
const API_KEY = import.meta.env.VITE_API_FOOTBALL_KEY;

interface ApiResponse<T> {
  response: T[];
  results: number;
  errors: Record<string, string>;
}

// ─── Fetch wrapper avec rate limiting ───
async function fetchApi<T>(endpoint: string, params?: Record<string, string>): Promise<T[]> {
  // Vérifier et incrémenter le compteur quotidien
  const allowed = await incrementApiFootballCounter();
  if (!allowed) {
    throw new Error('API_FOOTBALL_QUOTA_EXCEEDED');
  }

  const url = new URL(`${API_BASE}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  }

  const response = await fetch(url.toString(), {
    headers: { 'x-apisports-key': API_KEY },
  });

  if (!response.ok) {
    throw new Error(`API-Football error: ${response.status}`);
  }

  const data: ApiResponse<T> = await response.json();

  if (data.errors && Object.keys(data.errors).length > 0) {
    const errorMsg = Object.values(data.errors).join(', ');
    throw new Error(`API-Football: ${errorMsg}`);
  }

  return data.response;
}

// ─── Types API-Football ───
export interface ApiFixture {
  fixture: {
    id: number;
    date: string;
    status: {
      short: string;
      long: string;
      elapsed: number | null;
    };
  };
  league: {
    id: number;
    name: string;
    logo: string;
    country: string;
  };
  teams: {
    home: { id: number; name: string; logo: string; winner: boolean | null };
    away: { id: number; name: string; logo: string; winner: boolean | null };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    fulltime: { home: number | null; away: number | null };
  };
}

export interface ApiStanding {
  league: {
    id: number;
    standings: Array<Array<{
      rank: number;
      team: { id: number; name: string; logo: string };
      points: number;
      all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
    }>>;
  };
}

// ─── Mapper le statut API-Football → notre statut ───
export function mapApiStatus(shortStatus: string): 'upcoming' | 'live' | 'finished' {
  const liveStatuses = ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'SUSP', 'INT', 'LIVE'];
  const finishedStatuses = ['FT', 'AET', 'PEN', 'AWD', 'WO'];
  if (liveStatuses.includes(shortStatus)) return 'live';
  if (finishedStatuses.includes(shortStatus)) return 'finished';
  return 'upcoming';
}

// ─── Récupérer les matchs du jour ───
export async function getTodayFixtures(leagueId?: number): Promise<ApiFixture[]> {
  const today = new Date().toISOString().split('T')[0];
  const params: Record<string, string> = { date: today };
  if (leagueId) params.league = leagueId.toString();
  return fetchApi<ApiFixture>('/fixtures', params);
}

// ─── Récupérer les matchs à venir ───
export async function getUpcomingFixtures(leagueId: number, next: number = 10): Promise<ApiFixture[]> {
  return fetchApi<ApiFixture>('/fixtures', {
    league: leagueId.toString(),
    next: next.toString(),
  });
}

// ─── Récupérer les matchs live ───
export async function getLiveFixtures(): Promise<ApiFixture[]> {
  return fetchApi<ApiFixture>('/fixtures', { live: 'all' });
}

// ─── Récupérer un match par ID ───
export async function getFixtureById(fixtureId: number): Promise<ApiFixture | undefined> {
  const results = await fetchApi<ApiFixture>('/fixtures', { id: fixtureId.toString() });
  return results[0];
}

// ─── Récupérer les classements d'une ligue ───
export async function getLeagueStandings(leagueId: number, season: number): Promise<ApiStanding[]> {
  return fetchApi<ApiStanding>('/standings', {
    league: leagueId.toString(),
    season: season.toString(),
  });
}

// ─── IDs des ligues populaires ───
export const LEAGUE_IDS = {
  // Football
  LIGUE_1: 61,
  PREMIER_LEAGUE: 39,
  LA_LIGA: 140,
  SERIE_A: 135,
  BUNDESLIGA: 78,
  CHAMPIONS_LEAGUE: 2,
  WORLD_CUP: 1,
  // Basketball (API-Sports basketball)
  NBA: 12,
  // NFL (API-Sports american-football)
  NFL: 1,
} as const;

export const FOOTBALL_LEAGUES = [
  { id: LEAGUE_IDS.LIGUE_1, name: 'Ligue 1', country: 'France' },
  { id: LEAGUE_IDS.PREMIER_LEAGUE, name: 'Premier League', country: 'England' },
  { id: LEAGUE_IDS.LA_LIGA, name: 'La Liga', country: 'Spain' },
  { id: LEAGUE_IDS.SERIE_A, name: 'Serie A', country: 'Italy' },
  { id: LEAGUE_IDS.BUNDESLIGA, name: 'Bundesliga', country: 'Germany' },
  { id: LEAGUE_IDS.CHAMPIONS_LEAGUE, name: 'Champions League', country: 'Europe' },
  { id: LEAGUE_IDS.WORLD_CUP, name: 'Coupe du Monde 2026', country: 'International' },
] as const;
