// ─── Hook : détecte quand tu reçois un nouveau Dundie Award ───

import { useEffect, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import type { DundieAward } from '../types';

export function useDundieListener() {
  const { userData } = useAuth();
  const { addNotification, triggerVictory } = useNotifications();
  const knownAwardsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!userData?.uid) return;

    const q = query(
      collection(db, 'dundieAwards'),
      where('winnerId', '==', userData.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const awards = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as DundieAward));

      if (!initializedRef.current) {
        // First load: populate known awards without notifications
        awards.forEach(a => knownAwardsRef.current.add(a.id));
        initializedRef.current = true;
        return;
      }

      // Check for new awards
      for (const award of awards) {
        if (knownAwardsRef.current.has(award.id)) continue;
        knownAwardsRef.current.add(award.id);

        // New dundie! Celebration
        triggerVictory();
        addNotification({
          type: 'win',
          title: 'Dundie Award recu !',
          message: `${award.emoji} Tu as recu le Dundie "${award.title}" !`,
        });
      }
    });

    return () => unsubscribe();
  }, [userData?.uid, addNotification, triggerVictory]);
}
