// ─── BallDontLie API - Coupe du Monde 2026 ───

import type { WorldCupTeam, WorldCupGroupTeam } from '../types';

const API_BASE = 'https://api.balldontlie.io/fifa/worldcup/v1';

interface BdlMatch {
  id: number;
  date: string;
  status: string;         // "scheduled", "in_progress", "completed"
  stage: string;          // "group_stage", "round_of_32", "round_of_16", "quarter_final", "semi_final", "third_place", "final"
  group?: string;         // "A", "B", etc.
  home_team: {
    id: number;
    name: string;
    code: string;
    flag: string;
  };
  away_team: {
    id: number;
    name: string;
    code: string;
    flag: string;
  };
  home_score: number | null;
  away_score: number | null;
  venue?: string;
}

interface BdlTeam {
  id: number;
  name: string;
  code: string;
  flag: string;
  group: string;
}

interface BdlStanding {
  group: string;
  teams: Array<{
    team: BdlTeam;
    played: number;
    wins: number;
    draws: number;
    losses: number;
    goals_for: number;
    goals_against: number;
    goal_difference: number;
    points: number;
  }>;
}

// ─── Fetch wrapper ───
async function fetchBdl<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`);
  if (!response.ok) {
    throw new Error(`BallDontLie API error: ${response.status}`);
  }
  return response.json();
}

// ─── Mapper le statut ───
function mapBdlStatus(status: string): 'upcoming' | 'live' | 'finished' {
  if (status === 'completed') return 'finished';
  if (status === 'in_progress') return 'live';
  return 'upcoming';
}

// ─── Mapper le stage ───
function mapBdlStage(stage: string): 'group' | 'round_of_32' | 'round_of_16' | 'quarter' | 'semi' | 'third_place' | 'final' {
  const map: Record<string, 'group' | 'round_of_32' | 'round_of_16' | 'quarter' | 'semi' | 'third_place' | 'final'> = {
    'group_stage': 'group',
    'round_of_32': 'round_of_32',
    'round_of_16': 'round_of_16',
    'quarter_final': 'quarter',
    'semi_final': 'semi',
    'third_place': 'third_place',
    'final': 'final',
  };
  return map[stage] || 'group';
}

// ─── Normaliser un match BDL ───
export interface NormalizedWorldCupMatch {
  apiMatchId: number;
  homeTeam: string;
  awayTeam: string;
  homeLogo: string;
  awayLogo: string;
  homeScore: number | null;
  awayScore: number | null;
  status: 'upcoming' | 'live' | 'finished';
  startTime: Date;
  group?: string;
  stage: 'group' | 'round_of_32' | 'round_of_16' | 'quarter' | 'semi' | 'third_place' | 'final';
}

function normalizeMatch(m: BdlMatch): NormalizedWorldCupMatch {
  return {
    apiMatchId: m.id + 900000, // offset pour éviter les collisions avec API-Football
    homeTeam: m.home_team.name,
    awayTeam: m.away_team.name,
    homeLogo: m.home_team.flag,
    awayLogo: m.away_team.flag,
    homeScore: m.home_score,
    awayScore: m.away_score,
    status: mapBdlStatus(m.status),
    startTime: new Date(m.date),
    group: m.group,
    stage: mapBdlStage(m.stage),
  };
}

// ─── API publique ───

export async function getWorldCupMatches(): Promise<NormalizedWorldCupMatch[]> {
  try {
    const data = await fetchBdl<{ data: BdlMatch[] }>('/matches');
    return (data.data || []).map(normalizeMatch);
  } catch {
    return [];
  }
}

export async function getWorldCupTeams(): Promise<WorldCupTeam[]> {
  try {
    const data = await fetchBdl<{ data: BdlTeam[] }>('/teams');
    return (data.data || []).map(t => ({
      id: t.id,
      name: t.name,
      code: t.code,
      flag: t.flag,
      group: t.group,
    }));
  } catch {
    return [];
  }
}

export async function getWorldCupStandings(): Promise<{ name: string; teams: WorldCupGroupTeam[] }[]> {
  try {
    const data = await fetchBdl<{ data: BdlStanding[] }>('/standings');
    return (data.data || []).map(g => ({
      name: `Groupe ${g.group}`,
      teams: g.teams.map(t => ({
        team: {
          id: t.team.id,
          name: t.team.name,
          code: t.team.code,
          flag: t.team.flag,
          group: t.team.group,
        },
        played: t.played,
        wins: t.wins,
        draws: t.draws,
        losses: t.losses,
        goalsFor: t.goals_for,
        goalsAgainst: t.goals_against,
        goalDifference: t.goal_difference,
        points: t.points,
      })),
    }));
  } catch {
    return [];
  }
}

// ─── Dates de la Coupe du Monde 2026 ───
export const WORLD_CUP_2026 = {
  startDate: new Date('2026-06-11'),
  endDate: new Date('2026-07-19'),
  totalTeams: 48,
  hostCountries: ['USA', 'Mexico', 'Canada'],
} as const;

export function isWorldCupActive(): boolean {
  const now = new Date();
  return now >= WORLD_CUP_2026.startDate && now <= WORLD_CUP_2026.endDate;
}

export function isWorldCupSoon(): boolean {
  const now = new Date();
  const oneMonthBefore = new Date(WORLD_CUP_2026.startDate);
  oneMonthBefore.setMonth(oneMonthBefore.getMonth() - 1);
  return now >= oneMonthBefore && now <= WORLD_CUP_2026.endDate;
}
