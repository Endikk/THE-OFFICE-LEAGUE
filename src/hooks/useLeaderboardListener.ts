// ─── Hook : détecte quand quelqu'un te dépasse au classement ───

import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { subscribeToLeaderboard } from '../services/leaderboard';
import { notifyLeaderboardPass } from '../services/notifications';
import type { RankingEntry } from '../types';

export function useLeaderboardListener() {
  const { userData } = useAuth();
  const { addNotification } = useNotifications();
  const previousRankRef = useRef<number | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!userData?.officeId) return;

    const unsubscribe = subscribeToLeaderboard(userData.officeId, (entries: RankingEntry[]) => {
      const myEntry = entries.find(e => e.userId === userData.uid);
      if (!myEntry) return;

      const currentRank = myEntry.rank;
      const previousRank = previousRankRef.current;

      // Skip the first load (initialization)
      if (!initializedRef.current) {
        initializedRef.current = true;
        previousRankRef.current = currentRank;
        return;
      }

      // Si mon rang a baissé (nombre augmenté), quelqu'un m'a dépassé
      if (previousRank !== null && currentRank > previousRank) {
        // Trouver qui est juste devant moi maintenant
        const passer = entries.find(e => e.rank === previousRank);
        const passerName = passer?.displayName || 'Quelqu\'un';

        addNotification({
          type: 'info',
          title: 'Depasse au classement !',
          message: `${passerName} vient de te depasser. Tu es maintenant #${currentRank}.`,
        });

        // Firestore persistent notification
        notifyLeaderboardPass(
          userData.uid,
          userData.officeId!,
          passerName,
          currentRank
        ).catch(() => {});
      }

      previousRankRef.current = currentRank;
    });

    return () => unsubscribe();
  }, [userData?.officeId, userData?.uid, addNotification]);
}
