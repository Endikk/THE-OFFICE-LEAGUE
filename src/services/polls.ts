import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteField,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Poll, PollCategory } from '../types';

// ─── Templates de sondages pré-créés ───
export interface PollTemplate {
  question: string;
  options: string[];
  category: PollCategory;
  emoji: string;
  closesInHours: number;
}

export const POLL_TEMPLATES: PollTemplate[] = [
  {
    question: 'Qui va gagner la Coupe du Monde 2026 ?',
    options: ['France', 'Bresil', 'Argentine', 'Angleterre', 'Espagne', 'Allemagne'],
    category: 'sport',
    emoji: '🏆',
    closesInHours: 168,
  },
  {
    question: 'Le GOAT : Messi, Jordan, Nadal ou Brady ?',
    options: ['Messi', 'Michael Jordan', 'Rafael Nadal', 'Tom Brady'],
    category: 'fun',
    emoji: '🐐',
    closesInHours: 72,
  },
  {
    question: 'Prochain sport de team building ?',
    options: ['Football', 'Basket', 'Padel', 'Bowling', 'Laser Game', 'Karting'],
    category: 'team_building',
    emoji: '🤝',
    closesInHours: 48,
  },
  {
    question: 'Meilleure equipe de Ligue 1 cette saison ?',
    options: ['PSG', 'Marseille', 'Monaco', 'Lyon', 'Lille', 'Lens'],
    category: 'sport',
    emoji: '⚽',
    closesInHours: 168,
  },
  {
    question: 'Meilleur commentateur sportif ?',
    options: ['Thierry Henry', 'Omar Da Fonseca', 'Grégoire Margotton', 'Pierre Ménès'],
    category: 'fun',
    emoji: '🎙️',
    closesInHours: 48,
  },
  {
    question: 'Meilleur joueur du mois au bureau ?',
    options: [],  // À remplir avec les membres du bureau
    category: 'sport',
    emoji: '🌟',
    closesInHours: 168,
  },
];

// ─── Créer un sondage ───
export async function createPoll(data: {
  officeId: string;
  createdBy: string;
  question: string;
  options: string[];
  category: PollCategory;
  emoji?: string;
  closesInHours?: number;
}): Promise<string> {
  if (data.options.length < 2) throw new Error('Il faut au moins 2 options');
  if (data.options.length > 6) throw new Error('Maximum 6 options');
  if (!data.question.trim()) throw new Error('La question est obligatoire');

  const closesInHours = data.closesInHours || 24;

  const pollData: Omit<Poll, 'id'> = {
    officeId: data.officeId,
    question: data.question.trim(),
    options: data.options.map(o => o.trim()).filter(Boolean),
    votes: {},
    createdBy: data.createdBy,
    category: data.category,
    emoji: data.emoji,
    closesAt: new Date(Date.now() + closesInHours * 60 * 60 * 1000),
    createdAt: serverTimestamp() as Poll['createdAt'],
  };

  const docRef = await addDoc(collection(db, 'polls'), pollData);
  return docRef.id;
}

// ─── Voter sur un sondage ───
export async function votePoll(pollId: string, userId: string, choice: string): Promise<void> {
  const pollRef = doc(db, 'polls', pollId);
  const pollSnap = await getDoc(pollRef);
  if (!pollSnap.exists()) throw new Error('Sondage introuvable');

  const poll = pollSnap.data() as Omit<Poll, 'id'>;

  // Vérifier que le sondage est encore ouvert
  const closesAt = poll.closesAt instanceof Date ? poll.closesAt : poll.closesAt.toDate();
  if (closesAt < new Date()) {
    throw new Error('Ce sondage est ferme');
  }

  // Vérifier que l'option existe
  if (!poll.options.includes(choice)) {
    throw new Error('Option invalide');
  }

  // Mettre à jour le vote (userId → choix)
  await updateDoc(pollRef, {
    [`votes.${userId}`]: choice,
  });
}

// ─── Retirer son vote ───
export async function unvotePoll(pollId: string, userId: string): Promise<void> {
  await updateDoc(doc(db, 'polls', pollId), {
    [`votes.${userId}`]: deleteField(),
  });
}

// ─── Récupérer les sondages d'un office ───
export async function getOfficePolls(officeId: string): Promise<Poll[]> {
  const q = query(
    collection(db, 'polls'),
    where('officeId', '==', officeId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Poll));
}

// ─── Récupérer les sondages actifs ───
export async function getActivePolls(officeId: string): Promise<Poll[]> {
  const q = query(
    collection(db, 'polls'),
    where('officeId', '==', officeId),
    where('closesAt', '>', new Date()),
    orderBy('closesAt', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Poll));
}

// ─── Récupérer un sondage par ID ───
export async function getPoll(pollId: string): Promise<Poll | null> {
  const snap = await getDoc(doc(db, 'polls', pollId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Poll;
}

// ─── Résultats d'un sondage ───
export function getPollResults(poll: Poll): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const option of poll.options) {
    counts[option] = 0;
  }
  for (const choice of Object.values(poll.votes)) {
    if (counts[choice] !== undefined) {
      counts[choice]++;
    }
  }
  return counts;
}

// ─── Listener temps réel sur les sondages d'un office ───
export function subscribeToPollsRealtime(
  officeId: string,
  callback: (polls: Poll[]) => void
): () => void {
  const q = query(
    collection(db, 'polls'),
    where('officeId', '==', officeId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const polls = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Poll));
    callback(polls);
  });
}

// ─── Listener temps réel sur un sondage spécifique ───
export function subscribeToPoll(
  pollId: string,
  callback: (poll: Poll | null) => void
): () => void {
  return onSnapshot(doc(db, 'polls', pollId), (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    callback({ id: snap.id, ...snap.data() } as Poll);
  });
}
