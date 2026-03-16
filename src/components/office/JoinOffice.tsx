import { useState, type FormEvent } from 'react';
import { Building2, Plus, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { createOffice, joinOffice } from '../../services/office';

export default function JoinOffice() {
  const { userData } = useAuth();
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!userData) return null;

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await createOffice(name, userData!.uid);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await joinOffice(code.toUpperCase(), userData!.uid);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <Building2 className="w-12 h-12 text-dunder-blue mx-auto mb-4" />
          <h2 className="text-2xl font-bold">Rejoindre un Bureau</h2>
          <p className="text-gray-500 mt-2">Crée ou rejoins un bureau pour commencer à parier !</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {mode === 'choose' && (
          <div className="space-y-3">
            <button
              onClick={() => setMode('create')}
              className="w-full flex items-center gap-3 p-4 border-2 border-gray-100 rounded-xl hover:border-dunder-blue transition-colors"
            >
              <Plus className="w-6 h-6 text-dunder-blue" />
              <div className="text-left">
                <p className="font-semibold">Créer un bureau</p>
                <p className="text-sm text-gray-400">Invite tes collègues</p>
              </div>
            </button>
            <button
              onClick={() => setMode('join')}
              className="w-full flex items-center gap-3 p-4 border-2 border-gray-100 rounded-xl hover:border-dunder-gold transition-colors"
            >
              <LogIn className="w-6 h-6 text-dunder-gold" />
              <div className="text-left">
                <p className="font-semibold">Rejoindre un bureau</p>
                <p className="text-sm text-gray-400">Avec un code d'invitation</p>
              </div>
            </button>
          </div>
        )}

        {mode === 'create' && (
          <form onSubmit={handleCreate} className="space-y-4">
            <input
              type="text"
              placeholder="Nom du bureau (ex: Dunder Mifflin)"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-dunder-blue focus:border-transparent outline-none"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-dunder-blue text-white py-3 rounded-lg font-semibold disabled:opacity-50"
            >
              {loading ? '...' : 'Créer le bureau'}
            </button>
            <button type="button" onClick={() => setMode('choose')} className="w-full text-sm text-gray-400 hover:text-gray-600">
              Retour
            </button>
          </form>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoin} className="space-y-4">
            <input
              type="text"
              placeholder="Code d'invitation (ex: ABC123)"
              value={code}
              onChange={e => setCode(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-dunder-gold focus:border-transparent outline-none text-center text-2xl tracking-widest uppercase"
              maxLength={6}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-dunder-gold text-white py-3 rounded-lg font-semibold disabled:opacity-50"
            >
              {loading ? '...' : 'Rejoindre'}
            </button>
            <button type="button" onClick={() => setMode('choose')} className="w-full text-sm text-gray-400 hover:text-gray-600">
              Retour
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
