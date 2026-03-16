import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Bet, BetPrediction } from '../types';

// ─── Placer un pari ───
export async function placeBet(
  userId: string,
  matchId: string,
  officeId: string,
  prediction: BetPrediction,
  amount: number,
  oddsAtBet: number
): Promise<string> {
  // Vérifier que le user a assez de coins
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) throw new Error('Utilisateur introuvable');

  const currentCoins = userSnap.data().officeCoins;
  if (currentCoins < amount) {
    throw new Error(`Solde insuffisant (${currentCoins} OfficeCoins disponibles)`);
  }

  // Vérifier qu'il n'a pas déjà parié sur ce match dans cet office
  const existingQ = query(
    collection(db, 'bets'),
    where('userId', '==', userId),
    where('matchId', '==', matchId),
    where('officeId', '==', officeId)
  );
  const existingSnap = await getDocs(existingQ);
  if (!existingSnap.empty) {
    throw new Error('Tu as déjà parié sur ce match');
  }

  // Déduire les coins
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
    oddsAtBet,
    status: 'pending',
    gainedPoints: 0,
    createdAt: serverTimestamp() as Bet['createdAt'],
  };

  const docRef = await addDoc(collection(db, 'bets'), betData);
  return docRef.id;
}

// ─── Récupérer les paris d'un user ───
export async function getUserBets(userId: string): Promise<Bet[]> {
  const q = query(
    collection(db, 'bets'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Bet));
}

// ─── Récupérer les paris d'un office ───
export async function getOfficeBets(officeId: string): Promise<Bet[]> {
  const q = query(
    collection(db, 'bets'),
    where('officeId', '==', officeId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Bet));
}

// ─── Récupérer les paris pour un match dans un office ───
export async function getMatchBets(matchId: string, officeId: string): Promise<Bet[]> {
  const q = query(
    collection(db, 'bets'),
    where('matchId', '==', matchId),
    where('officeId', '==', officeId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Bet));
}

// ─── Récupérer les paris pending d'un match (pour résolution) ───
export async function getPendingBetsForMatch(matchId: string): Promise<Bet[]> {
  const q = query(
    collection(db, 'bets'),
    where('matchId', '==', matchId),
    where('status', '==', 'pending')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Bet));
}

// ─── Résoudre un pari (appelé côté backend/admin) ───
export async function resolveBet(betId: string, won: boolean): Promise<void> {
  const betRef = doc(db, 'bets', betId);
  const betSnap = await getDoc(betRef);
  if (!betSnap.exists()) throw new Error('Pari introuvable');

  const bet = betSnap.data() as Omit<Bet, 'id'>;
  const gainedPoints = won ? Math.round(bet.amount * bet.oddsAtBet) : 0;

  // Update le pari
  await updateDoc(betRef, {
    status: won ? 'won' : 'lost',
    gainedPoints,
  });

  // Update le user
  const userRef = doc(db, 'users', bet.userId);
  if (won) {
    await updateDoc(userRef, {
      officeCoins: increment(gainedPoints),
      totalWins: increment(1),
      streak: increment(1), // simplifié, en prod il faut reset si loss->win
    });
  } else {
    await updateDoc(userRef, {
      totalLosses: increment(1),
      streak: increment(-1), // simplifié
    });
  }
}
