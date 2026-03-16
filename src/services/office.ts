import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Office } from '../types';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // pas de 0/O/1/I pour éviter confusion
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Vérifie que le code est unique avant de créer
async function getUniqueInviteCode(): Promise<string> {
  let code = generateInviteCode();
  let exists = true;
  while (exists) {
    const q = query(collection(db, 'offices'), where('inviteCode', '==', code));
    const snap = await getDocs(q);
    if (snap.empty) {
      exists = false;
    } else {
      code = generateInviteCode();
    }
  }
  return code;
}

export async function createOffice(name: string, userId: string): Promise<string> {
  const inviteCode = await getUniqueInviteCode();

  const officeData: Omit<Office, 'id'> = {
    name,
    inviteCode,
    createdBy: userId,
    membersCount: 1,
    createdAt: serverTimestamp() as Office['createdAt'],
  };

  const docRef = await addDoc(collection(db, 'offices'), officeData);

  // Lier l'utilisateur à cet office
  await updateDoc(doc(db, 'users', userId), { officeId: docRef.id });

  return docRef.id;
}

export async function joinOffice(inviteCode: string, userId: string): Promise<string> {
  const q = query(collection(db, 'offices'), where('inviteCode', '==', inviteCode));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    throw new Error('Code d\'invitation invalide');
  }

  const officeDoc = snapshot.docs[0];

  // Vérifier que l'utilisateur n'est pas déjà dans un office
  const userSnap = await getDoc(doc(db, 'users', userId));
  if (userSnap.exists() && userSnap.data().officeId) {
    throw new Error('Tu es déjà dans un bureau. Quitte-le d\'abord.');
  }

  // Incrémenter le membersCount
  await updateDoc(officeDoc.ref, {
    membersCount: increment(1),
  });

  // Lier l'utilisateur
  await updateDoc(doc(db, 'users', userId), { officeId: officeDoc.id });

  return officeDoc.id;
}

export async function getOffice(officeId: string): Promise<Office | null> {
  const snap = await getDoc(doc(db, 'offices', officeId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Office;
}

export async function getOfficeByCode(inviteCode: string): Promise<Office | null> {
  const q = query(collection(db, 'offices'), where('inviteCode', '==', inviteCode));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const d = snapshot.docs[0];
  return { id: d.id, ...d.data() } as Office;
}

export async function leaveOffice(userId: string, officeId: string): Promise<void> {
  await updateDoc(doc(db, 'offices', officeId), {
    membersCount: increment(-1),
  });
  await updateDoc(doc(db, 'users', userId), { officeId: null });
}
