// ─── Hook : écoute les matchs en temps réel via Firestore onSnapshot ───
// Quand un match passe à "finished", résout les paris automatiquement

import { useEffect, useRef, useCallback } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { resolveMatchBets, type ResolutionResult } from '../services/match-resolver';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import type { Match } from '../types';

export function useMatchListener() {
  const { userData } = useAuth();
  const { addNotification, triggerVictory } = useNotifications();
  const previousStatusRef = useRef<Map<string, string>>(new Map());
  const resolvedMatchesRef = useRef<Set<string>>(new Set());

  const handleResolution = useCallback(async (result: ResolutionResult, match: Match) => {
    if (!userData) return;

    // Chercher si le user courant a un résultat dans ce match
    const myWin = result.winners.find(w => w.userId === userData.uid);
    const myLoss = result.losers.find(l => l.userId === userData.uid);

    if (myWin) {
      // Victoire !
      triggerVictory();
      addNotification({
        type: 'win',
        title: 'Pari gagne !',
        message: `${match.homeTeam} ${match.homeScore} - ${match.awayScore} ${match.awayTeam}`,
        amount: myWin.gainedPoints,
      });

      // Notification streak si applicable
      if (myWin.streakBonus > 1) {
        setTimeout(() => {
          addNotification({
            type: 'streak',
            title: `Bonus streak x${myWin.streakBonus} !`,
            message: 'Ta serie de victoires booste tes gains !',
          });
        }, 1500);
      }
    } else if (myLoss) {
      addNotification({
        type: 'loss',
        title: 'Pari perdu',
        message: `${match.homeTeam} ${match.homeScore} - ${match.awayScore} ${match.awayTeam}`,
        amount: -myLoss.amount,
      });
    }
  }, [userData, addNotification, triggerVictory]);

  useEffect(() => {
    // Écouter les matchs live pour détecter les passages à "finished"
    const q = query(
      collection(db, 'matches'),
      where('status', 'in', ['live', 'finished'])
    );

    const unsub = onSnapshot(q, async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        if (change.type !== 'modified') continue;

        const match = { id: change.doc.id, ...change.doc.data() } as Match;
        const previousStatus = previousStatusRef.current.get(match.id);

        // Détecter le passage à "finished"
        if (match.status === 'finished' && previousStatus === 'live') {
          // Éviter les doubles résolutions
          if (resolvedMatchesRef.current.has(match.id)) continue;
          resolvedMatchesRef.current.add(match.id);

          // Résoudre les paris
          const result = await resolveMatchBets(match);
          if (result.resolved > 0) {
            await handleResolution(result, match);
          }
        }

        previousStatusRef.current.set(match.id, match.status);
      }

      // Initialiser le map des statuts
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (!previousStatusRef.current.has(doc.id)) {
          previousStatusRef.current.set(doc.id, data.status);
        }
      });
    });

    return unsub;
  }, [handleResolution]);
}
