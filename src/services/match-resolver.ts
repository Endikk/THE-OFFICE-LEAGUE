// ─── Résolution automatique des paris quand un match passe à "finished" ───

import { getMatchResult } from './matches';
import { getPendingBetsForMatch, resolveBet } from './bets';
import type { Match } from '../types';

// ─── Résoudre tous les paris d'un match terminé ───
export async function resolveMatchBets(match: Match): Promise<{ resolved: number; errors: number }> {
  if (match.status !== 'finished') {
    return { resolved: 0, errors: 0 };
  }

  const result = getMatchResult(match);
  if (!result) return { resolved: 0, errors: 0 };

  const pendingBets = await getPendingBetsForMatch(match.id);
  if (pendingBets.length === 0) return { resolved: 0, errors: 0 };

  let resolved = 0;
  let errors = 0;

  await Promise.allSettled(
    pendingBets.map(async (bet) => {
      try {
        const won = bet.prediction === result;
        await resolveBet(bet.id, won);
        resolved++;
      } catch {
        errors++;
      }
    })
  );

  return { resolved, errors };
}

// ─── Vérifier et résoudre pour une liste de matchs ───
// Appelé quand on détecte qu'un match est passé de "live" à "finished"
export async function checkAndResolveFinished(matches: Match[]): Promise<void> {
  const finishedMatches = matches.filter(m => m.status === 'finished');

  await Promise.allSettled(
    finishedMatches.map(match => resolveMatchBets(match))
  );
}

// ─── Détecteur de changement de statut ───
// Compare anciens et nouveaux matchs pour détecter les passages à "finished"
export function detectNewlyFinished(
  previousMatches: Match[],
  currentMatches: Match[]
): Match[] {
  const previousMap = new Map(previousMatches.map(m => [m.id, m]));

  return currentMatches.filter(current => {
    if (current.status !== 'finished') return false;
    const previous = previousMap.get(current.id);
    return !previous || previous.status !== 'finished';
  });
}
