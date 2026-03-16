// ─── Service unifié : API-Football (principal) → ESPN (secours) ───

import type { Sport, Match } from '../types';
import { cachedFetch, getApiFootballUsage } from './api-cache';
import {
  getTodayFixtures,
  getLiveFixtures,
  getUpcomingFixtures,
  mapApiStatus,
  LEAGUE_IDS,
  type ApiFixture,
} from './api-football';
import { getEspnMatches, getAllEspnFootball, type NormalizedMatch } from './espn';
import { getWorldCupMatches, type NormalizedWorldCupMatch } from './balldontlie';
import { calculateOdds } from './odds';
import { upsertMatch } from './matches';

// ─── Convertir un fixture API-Football en Match ───
function apiFixtureToMatch(fixture: ApiFixture): Omit<Match, 'id'> {
  const status = mapApiStatus(fixture.fixture.status.short);
  return {
    sport: 'football' as Sport,
    league: fixture.league.name,
    homeTeam: fixture.teams.home.name,
    awayTeam: fixture.teams.away.name,
    homeLogo: fixture.teams.home.logo,
    awayLogo: fixture.teams.away.logo,
    homeScore: fixture.goals.home,
    awayScore: fixture.goals.away,
    status,
    startTime: new Date(fixture.fixture.date),
    apiMatchId: fixture.fixture.id,
    odds: calculateOdds(fixture.teams.home.name, fixture.teams.away.name, 'football'),
    apiSource: 'api-football',
  };
}

// ─── Convertir un match ESPN en Match ───
function espnToMatch(m: NormalizedMatch): Omit<Match, 'id'> {
  return {
    sport: m.sport,
    league: m.league,
    homeTeam: m.homeTeam,
    awayTeam: m.awayTeam,
    homeLogo: m.homeLogo,
    awayLogo: m.awayLogo,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    status: m.status,
    startTime: m.startTime,
    apiMatchId: m.apiMatchId,
    odds: calculateOdds(m.homeTeam, m.awayTeam, m.sport),
    apiSource: 'espn',
  };
}

// ─── Convertir un match World Cup BDL en Match ───
function worldCupToMatch(m: NormalizedWorldCupMatch): Omit<Match, 'id'> {
  return {
    sport: 'football' as Sport,
    league: 'Coupe du Monde 2026',
    homeTeam: m.homeTeam,
    awayTeam: m.awayTeam,
    homeLogo: m.homeLogo,
    awayLogo: m.awayLogo,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    status: m.status,
    startTime: m.startTime,
    apiMatchId: m.apiMatchId,
    odds: calculateOdds(m.homeTeam, m.awayTeam, 'football'),
    apiSource: 'balldontlie',
    isWorldCup: true,
    worldCupGroup: m.group,
    worldCupStage: m.stage,
  };
}

// ─── Sync vers Firestore ───
async function syncToFirestore(matches: Omit<Match, 'id'>[]): Promise<void> {
  await Promise.allSettled(
    matches.map(m =>
      upsertMatch({
        apiMatchId: m.apiMatchId,
        sport: m.sport,
        league: m.league,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        startTime: m.startTime instanceof Date ? m.startTime : new Date(),
        odds: m.odds,
        status: m.status,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        homeLogo: m.homeLogo,
        awayLogo: m.awayLogo,
        apiSource: m.apiSource,
        isWorldCup: m.isWorldCup,
        worldCupGroup: m.worldCupGroup,
        worldCupStage: m.worldCupStage,
      })
    )
  );
}

// ─── Matchs du jour (toutes sources) ───
export async function fetchTodayMatches(sport?: Sport): Promise<Omit<Match, 'id'>[]> {
  const cacheKey = `today_${sport || 'all'}_${new Date().toISOString().split('T')[0]}`;

  return cachedFetch(cacheKey, 'fixtures_today', async () => {
    const { remaining } = await getApiFootballUsage();
    let matches: Omit<Match, 'id'>[] = [];

    if (sport === 'football' || !sport) {
      // Tenter API-Football d'abord
      if (remaining > 10) {
        try {
          const fixtures = await getTodayFixtures();
          matches.push(...fixtures.map(apiFixtureToMatch));
        } catch (err) {
          // Fallback ESPN si API-Football échoue
          if (err instanceof Error && err.message === 'API_FOOTBALL_QUOTA_EXCEEDED') {
            const espnMatches = await getAllEspnFootball();
            matches.push(...espnMatches.map(espnToMatch));
          }
        }
      } else {
        // Quota bas, utiliser ESPN directement
        const espnMatches = await getAllEspnFootball();
        matches.push(...espnMatches.map(espnToMatch));
      }
    }

    // Sports non-football : toujours ESPN
    if (sport && sport !== 'football') {
      const espnMatches = await getEspnMatches(sport);
      matches.push(...espnMatches.map(espnToMatch));
    } else if (!sport) {
      // Tous les sports
      const otherSports: Sport[] = ['basketball', 'nfl', 'rugby'];
      const espnResults = await Promise.allSettled(
        otherSports.map(s => getEspnMatches(s))
      );
      espnResults.forEach(r => {
        if (r.status === 'fulfilled') {
          matches.push(...r.value.map(espnToMatch));
        }
      });
    }

    // Sync vers Firestore en arrière-plan
    syncToFirestore(matches).catch(() => {});

    return matches;
  });
}

// ─── Matchs live (pas de cache long) ───
export async function fetchLiveMatches(): Promise<Omit<Match, 'id'>[]> {
  const cacheKey = `live_${Date.now().toString().slice(0, -4)}`; // cache ~10s

  return cachedFetch(cacheKey, 'fixtures_live', async () => {
    const { remaining } = await getApiFootballUsage();
    let matches: Omit<Match, 'id'>[] = [];

    // API-Football pour les matchs live football
    if (remaining > 5) {
      try {
        const fixtures = await getLiveFixtures();
        matches.push(...fixtures.map(apiFixtureToMatch));
      } catch {
        // Fallback: on récupère depuis Firestore (déjà synced)
      }
    }

    // ESPN pour les autres sports
    const sports: Sport[] = ['basketball', 'nfl', 'rugby'];
    const espnResults = await Promise.allSettled(
      sports.map(s => getEspnMatches(s))
    );
    espnResults.forEach(r => {
      if (r.status === 'fulfilled') {
        const liveOnly = r.value.filter(m => m.status === 'live');
        matches.push(...liveOnly.map(espnToMatch));
      }
    });

    // Sync live matches
    if (matches.length > 0) {
      syncToFirestore(matches).catch(() => {});
    }

    return matches;
  });
}

// ─── Matchs à venir par ligue (API-Football) ───
export async function fetchUpcomingByLeague(leagueId: number, count: number = 10): Promise<Omit<Match, 'id'>[]> {
  const cacheKey = `upcoming_${leagueId}_${count}`;

  return cachedFetch(cacheKey, 'fixtures_upcoming', async () => {
    const { remaining } = await getApiFootballUsage();

    if (remaining > 10) {
      try {
        const fixtures = await getUpcomingFixtures(leagueId, count);
        const matches = fixtures.map(apiFixtureToMatch);
        syncToFirestore(matches).catch(() => {});
        return matches;
      } catch {
        return [];
      }
    }
    return [];
  });
}

// ─── Matchs Coupe du Monde ───
export async function fetchWorldCupMatches(): Promise<Omit<Match, 'id'>[]> {
  const cacheKey = `worldcup_matches_${new Date().toISOString().split('T')[0]}`;

  return cachedFetch(cacheKey, 'worldcup', async () => {
    const wcMatches = await getWorldCupMatches();
    const matches = wcMatches.map(worldCupToMatch);
    syncToFirestore(matches).catch(() => {});
    return matches;
  });
}

// ─── Infos API usage (pour le dashboard) ───
export { getApiFootballUsage };

// ─── Leagues par sport ───
export const LEAGUES_BY_SPORT: Record<Sport, { id: number; name: string }[]> = {
  football: [
    { id: LEAGUE_IDS.LIGUE_1, name: 'Ligue 1' },
    { id: LEAGUE_IDS.PREMIER_LEAGUE, name: 'Premier League' },
    { id: LEAGUE_IDS.LA_LIGA, name: 'La Liga' },
    { id: LEAGUE_IDS.SERIE_A, name: 'Serie A' },
    { id: LEAGUE_IDS.BUNDESLIGA, name: 'Bundesliga' },
    { id: LEAGUE_IDS.CHAMPIONS_LEAGUE, name: 'Champions League' },
    { id: LEAGUE_IDS.WORLD_CUP, name: 'Coupe du Monde 2026' },
  ],
  basketball: [{ id: LEAGUE_IDS.NBA, name: 'NBA' }],
  nfl: [{ id: LEAGUE_IDS.NFL, name: 'NFL' }],
  rugby: [{ id: 0, name: 'Rugby' }],
};
