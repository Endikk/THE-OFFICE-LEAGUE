// ─── ESPN API (gratuite, sans clé) - API de secours ───

import type { Sport } from '../types';

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports';

// Mapping sport → endpoint ESPN
const ESPN_ENDPOINTS: Record<Sport, string> = {
  football: '/soccer/fra.1/scoreboard',   // Ligue 1 par défaut
  basketball: '/basketball/nba/scoreboard',
  nfl: '/football/nfl/scoreboard',
  rugby: '/rugby/scoreboard',
};

// Endpoints football par ligue
const ESPN_FOOTBALL_LEAGUES: Record<string, string> = {
  'Ligue 1': '/soccer/fra.1/scoreboard',
  'Premier League': '/soccer/eng.1/scoreboard',
  'La Liga': '/soccer/esp.1/scoreboard',
  'Serie A': '/soccer/ita.1/scoreboard',
  'Bundesliga': '/soccer/ger.1/scoreboard',
  'Champions League': '/soccer/uefa.champions/scoreboard',
};

// ─── Types ESPN ───
interface EspnCompetitor {
  id: string;
  team: {
    id: string;
    displayName: string;
    abbreviation: string;
    logo: string;
  };
  score: string;
  homeAway: 'home' | 'away';
  winner?: boolean;
}

interface EspnCompetition {
  id: string;
  date: string;
  status: {
    type: {
      id: string;
      name: string;      // "STATUS_SCHEDULED", "STATUS_IN_PROGRESS", "STATUS_FINAL"
      state: string;      // "pre", "in", "post"
      completed: boolean;
    };
    displayClock: string;
  };
  competitors: EspnCompetitor[];
}

interface EspnEvent {
  id: string;
  name: string;
  date: string;
  competitions: EspnCompetition[];
}

interface EspnScoreboard {
  events: EspnEvent[];
  leagues: Array<{ name: string }>;
}

// ─── Normaliser vers notre format ───
export interface NormalizedMatch {
  apiMatchId: number;
  sport: Sport;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo: string;
  awayLogo: string;
  homeScore: number | null;
  awayScore: number | null;
  status: 'upcoming' | 'live' | 'finished';
  startTime: Date;
}

function mapEspnStatus(state: string, completed: boolean): 'upcoming' | 'live' | 'finished' {
  if (completed || state === 'post') return 'finished';
  if (state === 'in') return 'live';
  return 'upcoming';
}

function normalizeEspnEvent(event: EspnEvent, sport: Sport, leagueName: string): NormalizedMatch | null {
  const comp = event.competitions[0];
  if (!comp || comp.competitors.length < 2) return null;

  const home = comp.competitors.find(c => c.homeAway === 'home') || comp.competitors[0];
  const away = comp.competitors.find(c => c.homeAway === 'away') || comp.competitors[1];

  const status = mapEspnStatus(comp.status.type.state, comp.status.type.completed);
  const homeScore = status !== 'upcoming' ? parseInt(home.score) || 0 : null;
  const awayScore = status !== 'upcoming' ? parseInt(away.score) || 0 : null;

  return {
    apiMatchId: parseInt(event.id) || Math.abs(hashCode(event.id)),
    sport,
    league: leagueName,
    homeTeam: home.team.displayName,
    awayTeam: away.team.displayName,
    homeLogo: home.team.logo,
    awayLogo: away.team.logo,
    homeScore,
    awayScore,
    status,
    startTime: new Date(event.date),
  };
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash;
}

// ─── Fetch ESPN ───
async function fetchEspn(endpoint: string): Promise<EspnScoreboard> {
  const url = `${ESPN_BASE}${endpoint}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`ESPN API error: ${response.status}`);
  }

  return response.json();
}

// ─── Matchs du jour par sport ───
export async function getEspnMatches(sport: Sport): Promise<NormalizedMatch[]> {
  try {
    const endpoint = ESPN_ENDPOINTS[sport];
    const data = await fetchEspn(endpoint);
    const leagueName = data.leagues?.[0]?.name || sport;

    return data.events
      .map(event => normalizeEspnEvent(event, sport, leagueName))
      .filter((m): m is NormalizedMatch => m !== null);
  } catch {
    return [];
  }
}

// ─── Matchs football par ligue spécifique ───
export async function getEspnFootballByLeague(league: string): Promise<NormalizedMatch[]> {
  const endpoint = ESPN_FOOTBALL_LEAGUES[league];
  if (!endpoint) return [];

  try {
    const data = await fetchEspn(endpoint);
    return data.events
      .map(event => normalizeEspnEvent(event, 'football', league))
      .filter((m): m is NormalizedMatch => m !== null);
  } catch {
    return [];
  }
}

// ─── Tous les matchs football (toutes ligues) ───
export async function getAllEspnFootball(): Promise<NormalizedMatch[]> {
  const leagues = Object.keys(ESPN_FOOTBALL_LEAGUES);
  const results = await Promise.allSettled(
    leagues.map(league => getEspnFootballByLeague(league))
  );

  return results
    .filter((r): r is PromiseFulfilledResult<NormalizedMatch[]> => r.status === 'fulfilled')
    .flatMap(r => r.value);
}
