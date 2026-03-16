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
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Poll } from '../types';

// ─── Créer un sondage ───
export async function createPoll(
  officeId: string,
  createdBy: string,
  question: string,
  options: string[],
  closesInHours: number = 24
): Promise<string> {
  if (options.length < 2) throw new Error('Il faut au moins 2 options');
  if (options.length > 6) throw new Error('Maximum 6 options');

  const pollData: Omit<Poll, 'id'> = {
    officeId,
    question,
    options,
    votes: {},
    createdBy,
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
    throw new Error('Ce sondage est fermé');
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

// ─── Récupérer les sondages actifs (non expirés) ───
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
