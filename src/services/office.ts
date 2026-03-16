import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  arrayUnion,
  query,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Office } from '../types';

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function createOffice(name: string, ownerId: string): Promise<string> {
  const officeData: Omit<Office, 'id'> = {
    name,
    code: generateCode(),
    ownerId,
    members: [ownerId],
    createdAt: new Date(),
  };

  const docRef = await addDoc(collection(db, 'offices'), officeData);

  // Mettre à jour l'utilisateur avec l'officeId
  await updateDoc(doc(db, 'users', ownerId), { officeId: docRef.id });

  return docRef.id;
}

export async function joinOffice(code: string, userId: string): Promise<string> {
  const q = query(collection(db, 'offices'), where('code', '==', code));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    throw new Error('Code de bureau invalide');
  }

  const officeDoc = snapshot.docs[0];
  await updateDoc(officeDoc.ref, {
    members: arrayUnion(userId),
  });

  await updateDoc(doc(db, 'users', userId), { officeId: officeDoc.id });

  return officeDoc.id;
}

export async function getOffice(officeId: string): Promise<Office | null> {
  const snap = await getDoc(doc(db, 'offices', officeId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Office;
}
