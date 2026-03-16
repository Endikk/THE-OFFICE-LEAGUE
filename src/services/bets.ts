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
  limit,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Bet, BetPrediction, User } from '../types';

// ─── Constantes ───
export const MIN_BET = 10;
export const MAX_BET = 500;
export const STARTING_COINS = 1000;

// ─── Streak bonus ───
export function getStreakMultiplier(streak: number): number {
  if (streak >= 5) return 2.0;   // 5+ wins d'affilée → x2
  if (streak >= 3) return 1.5;   // 3-4 wins d'affilée → x1.5
  return 1.0;
}

export function getStreakLabel(streak: number): string | null {
  if (streak >= 5) return 'x2 Bonus streak !';
  if (streak >= 3) return 'x1.5 Bonus streak';
  return null;
}

// ─── Placer un pari ───
export async function placeBet(
  userId: string,
  matchId: string,
  officeId: string,
  prediction: BetPrediction,
  amount: number,
  oddsAtBet: number
): Promise<string> {
  // Validation montant
  if (amount < MIN_BET) throw new Error(`Mise minimum : ${MIN_BET} OfficeCoins`);
  if (amount > MAX_BET) throw new Error(`Mise maximum : ${MAX_BET} OfficeCoins`);

  // Vérifier que le user a assez de coins
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) throw new Error('Utilisateur introuvable');

  const userData = userSnap.data() as Omit<User, 'uid'>;
  if (userData.officeCoins < amount) {
    throw new Error(`Solde insuffisant (${userData.officeCoins} OfficeCoins disponibles)`);
  }

  // Vérifier que le match est bien "upcoming"
  const matchRef = doc(db, 'matches', matchId);
  const matchSnap = await getDoc(matchRef);
  if (!matchSnap.exists()) throw new Error('Match introuvable');
  if (matchSnap.data().status !== 'upcoming') {
    throw new Error('Tu ne peux parier que sur les matchs a venir');
  }

  // Vérifier qu'il n'a pas déjà parié sur ce match
  const existingQ = query(
    collection(db, 'bets'),
    where('userId', '==', userId),
    where('matchId', '==', matchId),
    where('officeId', '==', officeId)
  );
  const existingSnap = await getDocs(existingQ);
  if (!existingSnap.empty) {
    throw new Error('Tu as deja parie sur ce match');
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
export async function getUserBets(userId: string, maxResults?: number): Promise<Bet[]> {
  let q;
  if (maxResults) {
    q = query(
      collection(db, 'bets'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(maxResults)
    );
  } else {
    q = query(
      collection(db, 'bets'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
  }
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

// ─── Récupérer les paris pending d'un match ───
export async function getPendingBetsForMatch(matchId: string): Promise<Bet[]> {
  const q = query(
    collection(db, 'bets'),
    where('matchId', '==', matchId),
    where('status', '==', 'pending')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Bet));
}

// ─── Récupérer les paris par statut pour un user ───
export async function getUserBetsByStatus(userId: string, status: Bet['status']): Promise<Bet[]> {
  const q = query(
    collection(db, 'bets'),
    where('userId', '==', userId),
    where('status', '==', status),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Bet));
}

// ─── Résoudre un pari avec streak bonus ───
export async function resolveBet(betId: string, won: boolean): Promise<{ gainedPoints: number; streakBonus: number }> {
  const betRef = doc(db, 'bets', betId);
  const betSnap = await getDoc(betRef);
  if (!betSnap.exists()) throw new Error('Pari introuvable');

  const bet = betSnap.data() as Omit<Bet, 'id'>;

  // Lire le streak actuel du user pour le bonus
  const userRef = doc(db, 'users', bet.userId);
  const userSnap = await getDoc(userRef);
  const currentStreak = userSnap.exists() ? (userSnap.data().streak as number) || 0 : 0;

  let gainedPoints = 0;
  let streakBonus = 1.0;

  if (won) {
    // Calcul du streak bonus basé sur le streak AVANT ce pari
    streakBonus = getStreakMultiplier(currentStreak);
    gainedPoints = Math.round(bet.amount * bet.oddsAtBet * streakBonus);

    // Update le pari
    await updateDoc(betRef, {
      status: 'won',
      gainedPoints,
    });

    // Update le user : ajouter gains, incrémenter wins
    // Streak : si le streak actuel est positif, on incrémente, sinon on reset à 1
    const newStreak = currentStreak >= 0 ? currentStreak + 1 : 1;
    await updateDoc(userRef, {
      officeCoins: increment(gainedPoints),
      totalWins: increment(1),
      streak: newStreak,
    });
  } else {
    // Update le pari
    await updateDoc(betRef, {
      status: 'lost',
      gainedPoints: 0,
    });

    // Update le user : incrémenter losses
    // Streak : si le streak actuel est négatif, on décrémente, sinon on reset à -1
    const newStreak = currentStreak <= 0 ? currentStreak - 1 : -1;
    await updateDoc(userRef, {
      totalLosses: increment(1),
      streak: newStreak,
    });
  }

  return { gainedPoints, streakBonus };
}

// ─── Stats rapides d'un user ───
export async function getUserBetStats(userId: string): Promise<{
  total: number;
  pending: number;
  won: number;
  lost: number;
  totalWagered: number;
  totalWon: number;
  biggestWin: number;
}> {
  const bets = await getUserBets(userId);

  const pending = bets.filter(b => b.status === 'pending');
  const won = bets.filter(b => b.status === 'won');
  const lost = bets.filter(b => b.status === 'lost');

  return {
    total: bets.length,
    pending: pending.length,
    won: won.length,
    lost: lost.length,
    totalWagered: bets.reduce((sum, b) => sum + b.amount, 0),
    totalWon: won.reduce((sum, b) => sum + b.gainedPoints, 0),
    biggestWin: won.length > 0 ? Math.max(...won.map(b => b.gainedPoints)) : 0,
  };
}
