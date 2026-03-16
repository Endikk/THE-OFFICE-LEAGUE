// ─── Service unifié : football-data.org (principal) + ESPN (autres sports) ───

import type { Sport, Match } from '../types';
import { cachedFetch } from './api-cache';
import {
  getTodayMatches,
  getUpcomingCompetitionMatches,
  type NormalizedFdMatch,
} from './football-data';
import { getEspnMatches, getAllEspnFootball, type NormalizedMatch } from './espn';
import { getWorldCupMatches, type NormalizedWorldCupMatch } from './balldontlie';
import { calculateOdds } from './odds';
import { upsertMatch } from './matches';

// ─── Convertir un match football-data.org en Match ───
function fdMatchToMatch(m: NormalizedFdMatch): Omit<Match, 'id'> {
  return {
    sport: 'football' as Sport,
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
    odds: calculateOdds(m.homeTeam, m.awayTeam, 'football'),
    apiSource: 'football-data',
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
    let matches: Omit<Match, 'id'>[] = [];

    if (sport === 'football' || !sport) {
      // football-data.org pour le football (gratuit, 10 req/min)
      try {
        const fdMatches = await getTodayMatches();
        matches.push(...fdMatches.map(fdMatchToMatch));
      } catch {
        // Fallback ESPN si football-data.org échoue
        try {
          const espnMatches = await getAllEspnFootball();
          matches.push(...espnMatches.map(espnToMatch));
        } catch {
          // Les deux APIs ont échoué, on continue avec Firestore
        }
      }
    }

    // Sports non-football : ESPN
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

// ─── Matchs live ───
export async function fetchLiveMatches(): Promise<Omit<Match, 'id'>[]> {
  const cacheKey = `live_${Date.now().toString().slice(0, -4)}`; // cache ~10s

  return cachedFetch(cacheKey, 'fixtures_live', async () => {
    let matches: Omit<Match, 'id'>[] = [];

    // football-data.org pour les matchs live football
    try {
      const fdMatches = await getTodayMatches();
      const liveOnly = fdMatches.filter(m => m.status === 'live');
      matches.push(...liveOnly.map(fdMatchToMatch));
    } catch {
      // Fallback: on récupère depuis Firestore (déjà synced)
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

// ─── Matchs à venir par compétition (football-data.org) ───
export async function fetchUpcomingByCompetition(competitionCode: string): Promise<Omit<Match, 'id'>[]> {
  const cacheKey = `upcoming_${competitionCode}`;

  return cachedFetch(cacheKey, 'fixtures_upcoming', async () => {
    try {
      const fdMatches = await getUpcomingCompetitionMatches(competitionCode);
      const matches = fdMatches.map(fdMatchToMatch);
      syncToFirestore(matches).catch(() => {});
      return matches;
    } catch {
      return [];
    }
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

// ─── Leagues par sport ───
export const LEAGUES_BY_SPORT: Record<Sport, { code: string; name: string }[]> = {
  football: [
    { code: 'FL1', name: 'Ligue 1' },
    { code: 'PL', name: 'Premier League' },
    { code: 'PD', name: 'La Liga' },
    { code: 'SA', name: 'Serie A' },
    { code: 'BL1', name: 'Bundesliga' },
    { code: 'CL', name: 'Champions League' },
    { code: 'WC', name: 'Coupe du Monde' },
  ],
  basketball: [{ code: 'NBA', name: 'NBA' }],
  nfl: [{ code: 'NFL', name: 'NFL' }],
  rugby: [{ code: 'RUGBY', name: 'Rugby' }],
};
