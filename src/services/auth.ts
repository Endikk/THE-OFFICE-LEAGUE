import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { User } from '../types';

const INITIAL_COINS = 1000;

export async function signUp(email: string, password: string, displayName: string): Promise<void> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName });

  const userData: Omit<User, 'uid'> = {
    displayName,
    email,
    officeCoins: INITIAL_COINS,
    totalBets: 0,
    wonBets: 0,
    dundieAwards: [],
    createdAt: new Date(),
  };

  await setDoc(doc(db, 'users', credential.user.uid), userData);
}

export async function signIn(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email, password);
}

export async function signInWithGoogle(): Promise<void> {
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);

  const userData: Omit<User, 'uid'> = {
    displayName: credential.user.displayName || 'Joueur',
    email: credential.user.email || '',
    photoURL: credential.user.photoURL || undefined,
    officeCoins: INITIAL_COINS,
    totalBets: 0,
    wonBets: 0,
    dundieAwards: [],
    createdAt: new Date(),
  };

  await setDoc(doc(db, 'users', credential.user.uid), userData, { merge: true });
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}
