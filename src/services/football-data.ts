// ─── football-data.org API v4 (100% gratuit, 10 req/min, 12 compétitions) ───
// Docs: https://docs.football-data.org/general/v4/index.html

const API_BASE = 'https://api.football-data.org/v4';
const API_TOKEN = import.meta.env.VITE_FOOTBALL_DATA_TOKEN;

// ─── Types football-data.org ───

interface FdTeam {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
}

interface FdScore {
  home: number | null;
  away: number | null;
}

interface FdMatch {
  id: number;
  utcDate: string;
  status: string; // SCHEDULED, TIMED, IN_PLAY, PAUSED, FINISHED, POSTPONED, CANCELLED, SUSPENDED, AWARDED
  matchday: number | null;
  stage: string;
  group: string | null;
  homeTeam: FdTeam;
  awayTeam: FdTeam;
  score: {
    winner: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null;
    duration: string;
    fullTime: FdScore;
    halfTime: FdScore;
  };
  competition: {
    id: number;
    name: string;
    code: string;
    emblem: string;
  };
}

interface FdMatchesResponse {
  matches: FdMatch[];
  resultSet: {
    count: number;
    competitions: string;
    first: string;
    last: string;
    played: number;
  };
}

export interface FdStandingEntry {
  position: number;
  team: FdTeam;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

interface FdStandingsResponse {
  competition: { id: number; name: string };
  standings: Array<{
    stage: string;
    type: string;
    group: string | null;
    table: FdStandingEntry[];
  }>;
}

// ─── Fetch wrapper ───
async function fetchApi<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${API_BASE}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  }

  const response = await fetch(url.toString(), {
    headers: { 'X-Auth-Token': API_TOKEN },
  });

  if (response.status === 429) {
    // Rate limited — attendre 6s et réessayer une fois
    await new Promise(r => setTimeout(r, 6000));
    const retry = await fetch(url.toString(), {
      headers: { 'X-Auth-Token': API_TOKEN },
    });
    if (!retry.ok) throw new Error(`football-data.org error: ${retry.status}`);
    return retry.json();
  }

  if (!response.ok) {
    throw new Error(`football-data.org error: ${response.status}`);
  }

  return response.json();
}

// ─── Mapper le statut football-data.org → notre statut ───
export function mapFdStatus(status: string): 'upcoming' | 'live' | 'finished' {
  const liveStatuses = ['IN_PLAY', 'PAUSED', 'SUSPENDED'];
  const finishedStatuses = ['FINISHED', 'AWARDED'];
  if (liveStatuses.includes(status)) return 'live';
  if (finishedStatuses.includes(status)) return 'finished';
  return 'upcoming';
}

// ─── Normaliser un match football-data.org ───
export interface NormalizedFdMatch {
  apiMatchId: number;
  league: string;
  leagueCode: string;
  leagueEmblem: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo: string;
  awayLogo: string;
  homeScore: number | null;
  awayScore: number | null;
  status: 'upcoming' | 'live' | 'finished';
  startTime: Date;
  matchday: number | null;
}

function normalizeMatch(m: FdMatch): NormalizedFdMatch {
  const status = mapFdStatus(m.status);
  return {
    apiMatchId: m.id,
    league: m.competition.name,
    leagueCode: m.competition.code,
    leagueEmblem: m.competition.emblem,
    homeTeam: m.homeTeam.name,
    awayTeam: m.awayTeam.name,
    homeLogo: m.homeTeam.crest,
    awayLogo: m.awayTeam.crest,
    homeScore: m.score.fullTime.home,
    awayScore: m.score.fullTime.away,
    status,
    startTime: new Date(m.utcDate),
    matchday: m.matchday,
  };
}

// ─── Matchs du jour (toutes compétitions) ───
export async function getTodayMatches(): Promise<NormalizedFdMatch[]> {
  const data = await fetchApi<FdMatchesResponse>('/matches');
  return data.matches.map(normalizeMatch);
}

// ─── Matchs par date ───
export async function getMatchesByDate(dateFrom: string, dateTo?: string): Promise<NormalizedFdMatch[]> {
  const params: Record<string, string> = { dateFrom };
  if (dateTo) params.dateTo = dateTo;
  const data = await fetchApi<FdMatchesResponse>('/matches', params);
  return data.matches.map(normalizeMatch);
}

// ─── Matchs par compétition ───
export async function getCompetitionMatches(competitionCode: string, matchday?: number): Promise<NormalizedFdMatch[]> {
  const params: Record<string, string> = {};
  if (matchday) params.matchday = matchday.toString();
  const data = await fetchApi<FdMatchesResponse>(`/competitions/${competitionCode}/matches`, params);
  return data.matches.map(normalizeMatch);
}

// ─── Matchs à venir par compétition ───
export async function getUpcomingCompetitionMatches(competitionCode: string): Promise<NormalizedFdMatch[]> {
  const data = await fetchApi<FdMatchesResponse>(`/competitions/${competitionCode}/matches`, {
    status: 'SCHEDULED,TIMED',
  });
  return data.matches.map(normalizeMatch);
}

// ─── Classement d'une compétition ───
export async function getCompetitionStandings(competitionCode: string): Promise<FdStandingEntry[]> {
  const data = await fetchApi<FdStandingsResponse>(`/competitions/${competitionCode}/standings`);
  const total = data.standings.find(s => s.type === 'TOTAL');
  return total?.table || [];
}

// ─── IDs des compétitions (codes football-data.org) ───
export const COMPETITION_CODES = {
  LIGUE_1: 'FL1',
  PREMIER_LEAGUE: 'PL',
  LA_LIGA: 'PD',
  SERIE_A: 'SA',
  BUNDESLIGA: 'BL1',
  CHAMPIONS_LEAGUE: 'CL',
  EREDIVISIE: 'DED',
  PRIMEIRA_LIGA: 'PPL',
  CHAMPIONSHIP: 'ELC',
  WORLD_CUP: 'WC',
  EURO: 'EC',
  COPA_LIBERTADORES: 'CLI',
} as const;

export const FOOTBALL_LEAGUES = [
  { code: COMPETITION_CODES.LIGUE_1, name: 'Ligue 1', country: 'France' },
  { code: COMPETITION_CODES.PREMIER_LEAGUE, name: 'Premier League', country: 'England' },
  { code: COMPETITION_CODES.LA_LIGA, name: 'La Liga', country: 'Spain' },
  { code: COMPETITION_CODES.SERIE_A, name: 'Serie A', country: 'Italy' },
  { code: COMPETITION_CODES.BUNDESLIGA, name: 'Bundesliga', country: 'Germany' },
  { code: COMPETITION_CODES.CHAMPIONS_LEAGUE, name: 'Champions League', country: 'Europe' },
  { code: COMPETITION_CODES.EREDIVISIE, name: 'Eredivisie', country: 'Netherlands' },
  { code: COMPETITION_CODES.PRIMEIRA_LIGA, name: 'Primeira Liga', country: 'Portugal' },
  { code: COMPETITION_CODES.CHAMPIONSHIP, name: 'Championship', country: 'England' },
  { code: COMPETITION_CODES.WORLD_CUP, name: 'Coupe du Monde', country: 'International' },
  { code: COMPETITION_CODES.EURO, name: 'Euro', country: 'Europe' },
] as const;

export type { FdMatch, FdMatchesResponse, FdStandingsResponse };
