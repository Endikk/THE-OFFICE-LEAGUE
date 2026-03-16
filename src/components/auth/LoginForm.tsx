import { useState, type FormEvent } from 'react';
import { Trophy } from 'lucide-react';
import { signIn, signUp, signInWithGoogle } from '../../services/auth';

export default function LoginForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password, displayName);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-dunder-blue p-4 rounded-full">
              <Trophy className="w-10 h-10 text-dunder-gold" />
            </div>
          </div>
          <h1 className="text-3xl font-bold font-office text-dunder-blue">
            THE OFFICE LEAGUE
          </h1>
          <p className="text-gray-500 mt-2">
            Paris sportifs entre collègues
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input
              type="text"
              placeholder="Nom d'affichage"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-dunder-blue focus:border-transparent outline-none"
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-dunder-blue focus:border-transparent outline-none"
            required
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-dunder-blue focus:border-transparent outline-none"
            required
            minLength={6}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-dunder-blue text-white py-3 rounded-lg font-semibold hover:bg-dunder-blue/90 transition-colors disabled:opacity-50"
          >
            {loading ? '...' : isLogin ? 'Se connecter' : "S'inscrire"}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 text-gray-400">ou</span>
          </div>
        </div>

        <button
          onClick={() => signInWithGoogle().catch(err => setError(err.message))}
          className="w-full border border-gray-200 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
        >
          Continuer avec Google
        </button>

        <p className="text-center text-sm text-gray-500 mt-6">
          {isLogin ? "Pas encore de compte ?" : 'Déjà un compte ?'}{' '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-dunder-blue font-semibold hover:underline"
          >
            {isLogin ? "S'inscrire" : 'Se connecter'}
          </button>
        </p>
      </div>
    </div>
  );
}
