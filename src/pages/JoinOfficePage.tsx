import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Building2, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { joinOffice } from '../services/office';

export default function JoinOfficePage() {
  const { userData, signOut } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!userData) return null;

  // Si le user a déjà un office, redirect
  if (userData.officeId) {
    navigate('/', { replace: true });
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode.length !== 6) {
      setError('Le code doit contenir exactement 6 caracteres.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await joinOffice(cleanCode, userData!.uid);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-office-paper flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-office-mustard/10 rounded-2xl mb-4">
              <Building2 className="w-8 h-8 text-office-mustard" />
            </div>
            <h1 className="text-2xl font-bold text-office-navy">Rejoindre un Bureau</h1>
            <p className="text-sm text-office-brown/50 mt-2">
              Entre le code d'invitation de 6 caracteres
            </p>
          </div>

          {error && <div className="error-box mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="invite-code" className="block text-sm font-medium text-office-navy mb-1.5">
                Code d'invitation
              </label>
              <input
                id="invite-code"
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase().slice(0, 6))}
                className="input-field text-center text-3xl font-mono tracking-[0.4em] uppercase"
                placeholder="ABC123"
                maxLength={6}
                required
                autoFocus
                autoComplete="off"
              />
            </div>

            <button type="submit" disabled={loading || code.length !== 6} className="btn-mustard w-full flex items-center justify-center gap-2">
              <LogIn className="w-5 h-5" />
              {loading ? 'Verification...' : 'Rejoindre'}
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

          <Link to="/office/create" className="btn-outline w-full flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" />
            Creer un nouveau bureau
          </Link>

          <button
            onClick={signOut}
            className="w-full text-sm text-office-brown/40 hover:text-office-red mt-6 transition-colors text-center"
          >
            Se deconnecter
          </button>
        </div>
      </div>
    </div>
  );
}
