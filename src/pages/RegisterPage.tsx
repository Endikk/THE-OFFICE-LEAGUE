import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Trophy, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { signUp, signInWithGoogle } from '../services/auth';

export default function RegisterPage() {
  const { firebaseUser, loading } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && firebaseUser) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (displayName.trim().length < 2) {
      setError('Le nom doit contenir au moins 2 caracteres.');
      return;
    }

    setSubmitting(true);
    try {
      await signUp(email, password, displayName.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'inscription');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    setError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur Google');
    }
  }

  return (
    <div className="min-h-screen bg-office-paper flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-office-navy rounded-2xl shadow-lg mb-5">
            <Trophy className="w-10 h-10 text-office-mustard" />
          </div>
          <h1 className="text-3xl font-extrabold font-office text-office-navy tracking-tight">
            THE OFFICE LEAGUE
          </h1>
          <p className="text-office-brown/60 mt-2">
            Rejoins l'arene des paris entre collegues
          </p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <h2 className="text-xl font-bold text-office-navy mb-1 flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Inscription
          </h2>
          <p className="text-sm text-office-brown/50 mb-6">
            Tu recevras 1 000 OfficeCoins pour commencer !
          </p>

          {error && <div className="error-box mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-office-navy mb-1.5">
                Nom d'affichage
              </label>
              <input
                id="name"
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="input-field"
                placeholder="Michael Scott"
                required
                minLength={2}
                maxLength={30}
                autoComplete="name"
              />
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-office-navy mb-1.5">
                Email
              </label>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field"
                placeholder="michael@dundermifflin.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium text-office-navy mb-1.5">
                Mot de passe
              </label>
              <input
                id="reg-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-field"
                placeholder="Min. 6 caracteres"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <div>
              <label htmlFor="reg-confirm" className="block text-sm font-medium text-office-navy mb-1.5">
                Confirmer le mot de passe
              </label>
              <input
                id="reg-confirm"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Inscription...' : 'Creer mon compte'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-office-paper-dark" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-sm text-office-brown/40">ou</span>
            </div>
          </div>

          <button onClick={handleGoogle} className="btn-outline w-full flex items-center justify-center gap-3">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuer avec Google
          </button>

          <p className="text-center text-sm text-office-brown/50 mt-6">
            Deja un compte ?{' '}
            <Link to="/login" className="text-office-navy font-semibold hover:text-office-mustard transition-colors">
              Se connecter
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-office-brown/30 mt-6">
          "I'm not superstitious, but I am a little stitious." — Michael Scott
        </p>
      </div>
    </div>
  );
}
