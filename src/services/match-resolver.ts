// ─── Résolution automatique des paris quand un match passe à "finished" ───
// Orchestre : résolution des paris → mise à jour leaderboard → check dundies → notifications

import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { getMatchResult } from './matches';
import { getPendingBetsForMatch, resolveBet } from './bets';
import { updateRanking } from './leaderboard';
import { checkAndAwardDundies } from './dundie-awards';
import type { Match, User } from '../types';

export interface ResolutionResult {
  matchId: string;
  resolved: number;
  errors: number;
  winners: ResolvedBetInfo[];
  losers: ResolvedBetInfo[];
}

export interface ResolvedBetInfo {
  betId: string;
  userId: string;
  displayName: string;
  prediction: string;
  amount: number;
  gainedPoints: number;
  streakBonus: number;
  won: boolean;
}

// ─── Résoudre tous les paris d'un match terminé ───
export async function resolveMatchBets(match: Match): Promise<ResolutionResult> {
  const result: ResolutionResult = {
    matchId: match.id,
    resolved: 0,
    errors: 0,
    winners: [],
    losers: [],
  };

  if (match.status !== 'finished') return result;

  const matchResult = getMatchResult(match);
  if (!matchResult) return result;

  const pendingBets = await getPendingBetsForMatch(match.id);
  if (pendingBets.length === 0) return result;

  // Résoudre chaque pari
  for (const bet of pendingBets) {
    try {
      const won = bet.prediction === matchResult;
      const { gainedPoints, streakBonus } = await resolveBet(bet.id, won);

      // Récupérer le user mis à jour
      const userSnap = await getDoc(doc(db, 'users', bet.userId));
      if (!userSnap.exists()) continue;
      const user = { uid: userSnap.id, ...userSnap.data() } as User;

      const info: ResolvedBetInfo = {
        betId: bet.id,
        userId: bet.userId,
        displayName: user.displayName,
        prediction: bet.prediction,
        amount: bet.amount,
        gainedPoints,
        streakBonus,
        won,
      };

      if (won) {
        result.winners.push(info);
      } else {
        result.losers.push(info);
      }

      // Mettre à jour le leaderboard
      if (user.officeId) {
        await updateRanking(user.officeId, user).catch(() => {});
      }

      // Vérifier les dundies automatiques
      if (user.officeId) {
        await checkAndAwardDundies(user, user.officeId).catch(() => {});
      }

      result.resolved++;
    } catch {
      result.errors++;
    }
  }

  return result;
}

// ─── Vérifier et résoudre pour une liste de matchs ───
export async function checkAndResolveFinished(matches: Match[]): Promise<ResolutionResult[]> {
  const finishedMatches = matches.filter(m => m.status === 'finished');
  const results: ResolutionResult[] = [];

  for (const match of finishedMatches) {
    const result = await resolveMatchBets(match);
    if (result.resolved > 0) {
      results.push(result);
    }
  }

  return results;
}

// ─── Détecteur de changement de statut ───
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

// ─── Helper : formater le résultat pour les notifications ───
export function formatResolutionMessage(result: ResolutionResult, match: Match): string {
  const score = `${match.homeTeam} ${match.homeScore} - ${match.awayScore} ${match.awayTeam}`;
  const winnersText = result.winners.length > 0
    ? result.winners.map(w => `${w.displayName} +${w.gainedPoints}`).join(', ')
    : 'Aucun gagnant';
  return `${score} | Gagnants : ${winnersText}`;
}
