import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { signOut as authSignOut } from '../services/auth';
import type { User } from '../types';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  userData: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Écoute l'état d'authentification Firebase (persiste grâce à browserLocalPersistence)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (!user) {
        setUserData(null);
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  // Écoute en temps réel les données user dans Firestore
  useEffect(() => {
    if (!firebaseUser) return;

    const unsub = onSnapshot(
      doc(db, 'users', firebaseUser.uid),
      (snap) => {
        if (snap.exists()) {
          setUserData({ uid: snap.id, ...snap.data() } as User);
        } else {
          setUserData(null);
        }
        setLoading(false);
      },
      () => {
        // En cas d'erreur de permissions, on set loading false quand même
        setLoading(false);
      }
    );

    return unsub;
  }, [firebaseUser]);

  const signOut = useCallback(async () => {
    await authSignOut();
    setFirebaseUser(null);
    setUserData(null);
  }, []);

  return (
    <AuthContext.Provider value={{ firebaseUser, userData, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
