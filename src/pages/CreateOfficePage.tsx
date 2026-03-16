import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Copy, Check, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createOffice, getOffice } from '../services/office';

export default function CreateOfficePage() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!userData) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError('Le nom doit contenir au moins 2 caracteres.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const officeId = await createOffice(name.trim(), userData!.uid);
      const office = await getOffice(officeId);
      if (office) {
        setCreatedCode(office.inviteCode);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la creation');
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!createdCode) return;
    navigator.clipboard.writeText(createdCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-office-paper flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="card p-8">
          {!createdCode ? (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-office-navy/10 rounded-2xl mb-4">
                  <Building2 className="w-8 h-8 text-office-navy" />
                </div>
                <h1 className="text-2xl font-bold text-office-navy">Creer un Bureau</h1>
                <p className="text-sm text-office-brown/50 mt-2">
                  Donne un nom a ton bureau et invite tes collegues !
                </p>
              </div>

              {error && <div className="error-box mb-4">{error}</div>}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="office-name" className="block text-sm font-medium text-office-navy mb-1.5">
                    Nom du bureau
                  </label>
                  <input
                    id="office-name"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="input-field"
                    placeholder="Dunder Mifflin Scranton"
                    required
                    minLength={2}
                    maxLength={50}
                  />
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? 'Creation...' : 'Creer le bureau'}
                </button>
              </form>

              <Link
                to="/office/join"
                className="flex items-center justify-center gap-2 text-sm text-office-brown/50 hover:text-office-navy mt-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Plutot rejoindre un bureau existant ?
              </Link>
            </>
          ) : (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-office-green/10 rounded-2xl mb-4">
                <Check className="w-8 h-8 text-office-green" />
              </div>
              <h2 className="text-2xl font-bold text-office-navy mb-2">Bureau cree !</h2>
              <p className="text-sm text-office-brown/50 mb-6">
                Partage ce code a tes collegues pour qu'ils rejoignent le bureau :
              </p>

              <div className="bg-office-paper rounded-xl p-6 mb-6">
                <p className="text-4xl font-mono font-bold text-office-navy tracking-[0.3em] mb-3">
                  {createdCode}
                </p>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-2 text-sm text-office-mustard hover:text-office-mustard-dark font-medium transition-colors"
                >
                  {copied ? (
                    <><Check className="w-4 h-4" /> Copie !</>
                  ) : (
                    <><Copy className="w-4 h-4" /> Copier le code</>
                  )}
                </button>
              </div>

              <button
                onClick={() => navigate('/')}
                className="btn-mustard w-full"
              >
                Aller au dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
