// ─── Hook : écoute les matchs en temps réel via Firestore onSnapshot ───
// Quand un match passe à "finished", résout les paris automatiquement
// Quand un match passe à "live", envoie une notification
// Détecte les matchs qui commencent dans 30 min pour les rappels

import { useEffect, useRef, useCallback } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { resolveMatchBets, type ResolutionResult } from '../services/match-resolver';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import {
  notifyBetWon,
  notifyBetLost,
  notifyMatchLive,
  notifyMatchFinished,
} from '../services/notifications';
import { getOfficeMembers } from '../services/office';
import type { Match } from '../types';

export function useMatchListener() {
  const { userData } = useAuth();
  const { addNotification, triggerVictory } = useNotifications();
  const previousStatusRef = useRef<Map<string, string>>(new Map());
  const resolvedMatchesRef = useRef<Set<string>>(new Set());
  const notifiedLiveRef = useRef<Set<string>>(new Set());

  const handleResolution = useCallback(async (result: ResolutionResult, match: Match) => {
    if (!userData?.officeId) return;

    // Chercher si le user courant a un résultat dans ce match
    const myWin = result.winners.find(w => w.userId === userData.uid);
    const myLoss = result.losers.find(l => l.userId === userData.uid);

    if (myWin) {
      // Victoire ! Toast + confetti
      triggerVictory();
      addNotification({
        type: 'win',
        title: 'Pari gagne !',
        message: `${match.homeTeam} ${match.homeScore} - ${match.awayScore} ${match.awayTeam}`,
        amount: myWin.gainedPoints,
      });

      // Firestore persistent notification
      notifyBetWon(
        userData.uid,
        userData.officeId,
        match.homeTeam,
        match.awayTeam,
        myWin.gainedPoints,
        match.id
      ).catch(() => {});

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
      // Chercher un rival qui a gagné pour le message
      const rival = result.winners.length > 0 ? result.winners[0] : null;

      addNotification({
        type: 'loss',
        title: 'Pari perdu',
        message: `${match.homeTeam} ${match.homeScore} - ${match.awayScore} ${match.awayTeam}`,
        amount: -myLoss.amount,
      });

      // Firestore persistent notification
      notifyBetLost(
        userData.uid,
        userData.officeId,
        match.homeTeam,
        match.awayTeam,
        myLoss.amount,
        rival?.displayName,
        match.id
      ).catch(() => {});
    }

    // Notify all office members that match finished
    try {
      const members = await getOfficeMembers(userData.officeId);
      const memberIds = members.map(m => m.uid);
      notifyMatchFinished(
        userData.officeId,
        memberIds,
        match.homeTeam,
        match.awayTeam,
        match.homeScore ?? 0,
        match.awayScore ?? 0,
        match.id
      ).catch(() => {});
    } catch {
      // ignore
    }
  }, [userData, addNotification, triggerVictory]);

  useEffect(() => {
    // Écouter les matchs live et finished pour détecter les transitions
    const q = query(
      collection(db, 'matches'),
      where('status', 'in', ['live', 'finished'])
    );

    const unsub = onSnapshot(q, async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        if (change.type !== 'modified' && change.type !== 'added') continue;

        const match = { id: change.doc.id, ...change.doc.data() } as Match;
        const previousStatus = previousStatusRef.current.get(match.id);

        // Détecter le passage upcoming → live
        if (
          match.status === 'live' &&
          previousStatus === 'upcoming' &&
          !notifiedLiveRef.current.has(match.id)
        ) {
          notifiedLiveRef.current.add(match.id);

          // Toast notification
          addNotification({
            type: 'info',
            title: 'Match en direct !',
            message: `${match.homeTeam} vs ${match.awayTeam} vient de commencer`,
          });

          // Firestore persistent notification for office
          if (userData?.officeId) {
            getOfficeMembers(userData.officeId).then(members => {
              notifyMatchLive(
                userData.officeId!,
                members.map(m => m.uid),
                match.homeTeam,
                match.awayTeam,
                match.id
              ).catch(() => {});
            }).catch(() => {});
          }
        }

        // Détecter le passage live → finished
        if (match.status === 'finished' && previousStatus === 'live') {
          if (resolvedMatchesRef.current.has(match.id)) continue;
          resolvedMatchesRef.current.add(match.id);

          const result = await resolveMatchBets(match);
          if (result.resolved > 0) {
            await handleResolution(result, match);
          }
        }

        previousStatusRef.current.set(match.id, match.status);
      }

      // Initialiser le map des statuts pour les docs déjà existants
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (!previousStatusRef.current.has(doc.id)) {
          previousStatusRef.current.set(doc.id, data.status);
        }
      });
    });

    return unsub;
  }, [handleResolution, addNotification, userData]);
}

// ─── Hook : écoute les matchs upcoming pour les rappels 30 min ───
export function useMatchReminderListener() {
  const { userData } = useAuth();
  const remindedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!userData?.officeId) return;

    const q = query(
      collection(db, 'matches'),
      where('status', '==', 'upcoming')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const now = Date.now();
      const THIRTY_MIN = 30 * 60 * 1000;

      for (const doc of snapshot.docs) {
        const match = { id: doc.id, ...doc.data() } as Match;
        if (remindedRef.current.has(match.id)) continue;

        const startTime = match.startTime instanceof Date
          ? match.startTime.getTime()
          : (match.startTime as { toDate?: () => Date })?.toDate?.()?.getTime() || 0;

        const diff = startTime - now;

        // Si le match commence dans moins de 30 min et plus de 0 min
        if (diff > 0 && diff <= THIRTY_MIN) {
          remindedRef.current.add(match.id);
          // The actual notification creation is handled by the match-resolver
          // or can be triggered server-side. Here we just track locally.
        }
      }
    });

    return unsub;
  }, [userData?.officeId]);
}
