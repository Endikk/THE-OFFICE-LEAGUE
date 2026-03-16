import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  type AuthError,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { User } from '../types';

const INITIAL_COINS = 1000;

// ─── Traduction des erreurs Firebase Auth ───
const AUTH_ERRORS: Record<string, string> = {
  'auth/email-already-in-use': 'Cet email est déjà utilisé.',
  'auth/invalid-email': 'Adresse email invalide.',
  'auth/operation-not-allowed': 'Opération non autorisée.',
  'auth/weak-password': 'Le mot de passe doit contenir au moins 6 caractères.',
  'auth/user-disabled': 'Ce compte a été désactivé.',
  'auth/user-not-found': 'Aucun compte trouvé avec cet email.',
  'auth/wrong-password': 'Mot de passe incorrect.',
  'auth/invalid-credential': 'Email ou mot de passe incorrect.',
  'auth/too-many-requests': 'Trop de tentatives. Réessaye dans quelques minutes.',
  'auth/popup-closed-by-user': 'Connexion annulée.',
  'auth/network-request-failed': 'Erreur réseau. Vérifie ta connexion.',
};

function getAuthErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as AuthError).code;
    return AUTH_ERRORS[code] || `Erreur d'authentification (${code})`;
  }
  return error instanceof Error ? error.message : 'Une erreur est survenue.';
}

function newUserData(displayName: string, email: string, photoURL?: string): Omit<User, 'uid'> {
  return {
    displayName,
    email,
    photoURL,
    role: 'user',
    officeCoins: INITIAL_COINS,
    totalWins: 0,
    totalLosses: 0,
    streak: 0,
    dundieAwards: [],
    createdAt: serverTimestamp() as User['createdAt'],
  };
}

// ─── Inscription email/password ───
export async function signUp(email: string, password: string, displayName: string): Promise<void> {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName });
    await setDoc(doc(db, 'users', credential.user.uid), newUserData(displayName, email));
  } catch (error) {
    throw new Error(getAuthErrorMessage(error));
  }
}

// ─── Connexion email/password ───
export async function signIn(email: string, password: string): Promise<void> {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    throw new Error(getAuthErrorMessage(error));
  }
}

// ─── Connexion Google OAuth ───
export async function signInWithGoogle(): Promise<void> {
  try {
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
  } catch (error) {
    throw new Error(getAuthErrorMessage(error));
  }
}

// ─── Déconnexion ───
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

// ─── Helpers ───
export async function getUser(userId: string): Promise<User | null> {
  const snap = await getDoc(doc(db, 'users', userId));
  if (!snap.exists()) return null;
  return { uid: snap.id, ...snap.data() } as User;
}

export async function updateUser(userId: string, data: Partial<User>): Promise<void> {
  await setDoc(doc(db, 'users', userId), data, { merge: true });
}
