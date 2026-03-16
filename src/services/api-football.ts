const API_BASE = 'https://v3.football.api-sports.io';
const API_KEY = import.meta.env.VITE_API_FOOTBALL_KEY;

interface ApiResponse<T> {
  response: T[];
  results: number;
  errors: Record<string, string>;
}

async function fetchApi<T>(endpoint: string, params?: Record<string, string>): Promise<T[]> {
  const url = new URL(`${API_BASE}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  }

  const response = await fetch(url.toString(), {
    headers: {
      'x-apisports-key': API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`API-Football error: ${response.status}`);
  }

  const data: ApiResponse<T> = await response.json();
  return data.response;
}

export interface ApiFixture {
  fixture: {
    id: number;
    date: string;
    status: {
      short: string;
      long: string;
    };
  };
  league: {
    id: number;
    name: string;
    logo: string;
  };
  teams: {
    home: { id: number; name: string; logo: string; winner: boolean | null };
    away: { id: number; name: string; logo: string; winner: boolean | null };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
}

// Récupérer les matchs du jour
export async function getTodayFixtures(leagueId?: number): Promise<ApiFixture[]> {
  const today = new Date().toISOString().split('T')[0];
  const params: Record<string, string> = { date: today };
  if (leagueId) params.league = leagueId.toString();
  return fetchApi<ApiFixture>('/fixtures', params);
}

// Récupérer les matchs à venir
export async function getUpcomingFixtures(leagueId: number, next: number = 10): Promise<ApiFixture[]> {
  return fetchApi<ApiFixture>('/fixtures', {
    league: leagueId.toString(),
    next: next.toString(),
  });
}

// Récupérer un match par ID
export async function getFixtureById(fixtureId: number): Promise<ApiFixture | undefined> {
  const results = await fetchApi<ApiFixture>('/fixtures', { id: fixtureId.toString() });
  return results[0];
}

// IDs des ligues populaires
export const POPULAR_LEAGUES = {
  LIGUE_1: 61,
  PREMIER_LEAGUE: 39,
  LA_LIGA: 140,
  SERIE_A: 135,
  BUNDESLIGA: 78,
  CHAMPIONS_LEAGUE: 2,
} as const;
