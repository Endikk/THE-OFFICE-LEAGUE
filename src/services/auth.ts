import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { User } from '../types';

const INITIAL_COINS = 1000;

function newUserData(displayName: string, email: string, photoURL?: string): Omit<User, 'uid'> {
  return {
    displayName,
    email,
    photoURL,
    officeCoins: INITIAL_COINS,
    totalWins: 0,
    totalLosses: 0,
    streak: 0,
    dundieAwards: [],
    createdAt: serverTimestamp() as User['createdAt'],
  };
}

export async function signUp(email: string, password: string, displayName: string): Promise<void> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName });
  await setDoc(doc(db, 'users', credential.user.uid), newUserData(displayName, email));
}

export async function signIn(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email, password);
}

export async function signInWithGoogle(): Promise<void> {
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);

  // Ne pas écraser un profil existant
  const existing = await getDoc(doc(db, 'users', credential.user.uid));
  if (!existing.exists()) {
    await setDoc(
      doc(db, 'users', credential.user.uid),
      newUserData(
        credential.user.displayName || 'Joueur',
        credential.user.email || '',
        credential.user.photoURL || undefined
      )
    );
  }
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export async function getUser(userId: string): Promise<User | null> {
  const snap = await getDoc(doc(db, 'users', userId));
  if (!snap.exists()) return null;
  return { uid: snap.id, ...snap.data() } as User;
}

export async function updateUser(userId: string, data: Partial<User>): Promise<void> {
  await setDoc(doc(db, 'users', userId), data, { merge: true });
}
