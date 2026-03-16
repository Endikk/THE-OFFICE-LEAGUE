import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Bet } from '../types';

export async function placeBet(
  userId: string,
  matchId: string,
  officeId: string,
  prediction: 'home' | 'draw' | 'away',
  amount: number,
  odds: number
): Promise<string> {
  // Déduire les coins du joueur
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    officeCoins: increment(-amount),
  });

  // Créer le pari
  const betData: Omit<Bet, 'id'> = {
    userId,
    matchId,
    officeId,
    prediction,
    amount,
    odds,
    status: 'pending',
    potentialWin: Math.round(amount * odds),
    createdAt: new Date(),
  };

  const docRef = await addDoc(collection(db, 'bets'), betData);
  return docRef.id;
}

export async function getUserBets(userId: string): Promise<Bet[]> {
  const q = query(collection(db, 'bets'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Bet));
}

export async function getOfficeBets(officeId: string): Promise<Bet[]> {
  const q = query(collection(db, 'bets'), where('officeId', '==', officeId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Bet));
}

export async function resolveBet(betId: string, won: boolean): Promise<void> {
  const betRef = doc(db, 'bets', betId);
  await updateDoc(betRef, { status: won ? 'won' : 'lost' });
}
