import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Poll } from '../types';

export async function createPoll(
  officeId: string,
  creatorId: string,
  question: string,
  options: string[],
  expiresInHours: number = 24
): Promise<string> {
  const pollData: Omit<Poll, 'id'> = {
    officeId,
    creatorId,
    question,
    options: options.map((text, i) => ({
      id: `opt_${i}`,
      text,
      votes: [],
    })),
    expiresAt: new Date(Date.now() + expiresInHours * 60 * 60 * 1000),
    createdAt: new Date(),
  };

  const docRef = await addDoc(collection(db, 'polls'), pollData);
  return docRef.id;
}

export async function votePoll(pollId: string, optionId: string, userId: string): Promise<void> {
  const pollRef = doc(db, 'polls', pollId);
  // Note: in production, use a transaction to prevent double-voting
  const snapshot = await getDocs(query(collection(db, 'polls'), where('__name__', '==', pollId)));
  if (snapshot.empty) throw new Error('Sondage introuvable');

  const poll = snapshot.docs[0].data() as Omit<Poll, 'id'>;
  const updatedOptions = poll.options.map(opt => {
    // Retirer le vote précédent de l'utilisateur
    const filteredVotes = opt.votes.filter(uid => uid !== userId);
    if (opt.id === optionId) {
      filteredVotes.push(userId);
    }
    return { ...opt, votes: filteredVotes };
  });

  await updateDoc(pollRef, { options: updatedOptions });
}

export async function getOfficePolls(officeId: string): Promise<Poll[]> {
  const q = query(collection(db, 'polls'), where('officeId', '==', officeId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Poll));
}
