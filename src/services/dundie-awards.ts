import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { DundieAward, User } from '../types';

// ─── Créer un Dundie Award ───
export async function createDundieAward(data: {
  officeId: string;
  title: string;
  emoji: string;
  description: string;
  winnerId: string;
  season: string;
}): Promise<string> {
  const awardData: Omit<DundieAward, 'id'> = {
    ...data,
    createdAt: serverTimestamp() as DundieAward['createdAt'],
  };

  const docRef = await addDoc(collection(db, 'dundieAwards'), awardData);

  // Ajouter l'award ID au profil du gagnant
  await updateDoc(doc(db, 'users', data.winnerId), {
    dundieAwards: arrayUnion(docRef.id),
  });

  return docRef.id;
}

// ─── Récupérer les awards d'un office ───
export async function getOfficeAwards(officeId: string): Promise<DundieAward[]> {
  const q = query(
    collection(db, 'dundieAwards'),
    where('officeId', '==', officeId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as DundieAward));
}

// ─── Récupérer les awards d'un office par saison ───
export async function getAwardsBySeason(officeId: string, season: string): Promise<DundieAward[]> {
  const q = query(
    collection(db, 'dundieAwards'),
    where('officeId', '==', officeId),
    where('season', '==', season)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as DundieAward));
}

// ─── Récupérer les awards d'un user ───
export async function getUserAwards(userId: string): Promise<DundieAward[]> {
  const q = query(
    collection(db, 'dundieAwards'),
    where('winnerId', '==', userId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as DundieAward));
}

// ─── Saison courante (format "2026-S1") ───
export function getCurrentSeason(): string {
  const now = new Date();
  const semester = now.getMonth() < 6 ? 'S1' : 'S2';
  return `${now.getFullYear()}-${semester}`;
}

// ─── Catalogue de Dundies automatiques ───
export interface DundieCriteria {
  title: string;
  emoji: string;
  description: string;
  check: (user: User) => boolean;
}

export const AUTO_DUNDIES: DundieCriteria[] = [
  {
    title: 'The Michael Scott Award',
    emoji: '🏆',
    description: 'Premier pari placé',
    check: (u) => (u.totalWins + u.totalLosses) >= 1,
  },
  {
    title: 'Jim Halpert Streak',
    emoji: '😏',
    description: '5 victoires d\'affilée',
    check: (u) => u.streak >= 5,
  },
  {
    title: 'Dwight Schrute Dominance',
    emoji: '🥋',
    description: '10 victoires d\'affilée',
    check: (u) => u.streak >= 10,
  },
  {
    title: 'Stanley Hudson Veteran',
    emoji: '📰',
    description: '50 paris placés',
    check: (u) => (u.totalWins + u.totalLosses) >= 50,
  },
  {
    title: 'Kevin Malone Award',
    emoji: '🫠',
    description: '5 défaites d\'affilée',
    check: (u) => u.streak <= -5,
  },
  {
    title: 'Oscar Martinez Brain',
    emoji: '🧠',
    description: 'Win rate > 70% (min 10 paris)',
    check: (u) => {
      const total = u.totalWins + u.totalLosses;
      return total >= 10 && (u.totalWins / total) > 0.7;
    },
  },
  {
    title: 'Ryan Howard Comeback',
    emoji: '🔥',
    description: 'Remonter de -5 streak à +3 streak',
    check: () => false, // Nécessite un tracking historique, à implémenter
  },
];

// ─── Vérifier et attribuer les Dundies automatiques ───
export async function checkAndAwardDundies(
  user: User,
  officeId: string
): Promise<DundieAward[]> {
  const existingAwards = await getUserAwards(user.uid);
  const existingTitles = new Set(existingAwards.map(a => a.title));
  const season = getCurrentSeason();
  const newAwards: DundieAward[] = [];

  for (const criteria of AUTO_DUNDIES) {
    if (existingTitles.has(criteria.title)) continue;
    if (!criteria.check(user)) continue;

    const id = await createDundieAward({
      officeId,
      title: criteria.title,
      emoji: criteria.emoji,
      description: criteria.description,
      winnerId: user.uid,
      season,
    });

    newAwards.push({
      id,
      officeId,
      title: criteria.title,
      emoji: criteria.emoji,
      description: criteria.description,
      winnerId: user.uid,
      season,
      createdAt: new Date(),
    });
  }

  return newAwards;
}
