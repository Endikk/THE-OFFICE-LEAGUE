import { useState } from 'react';
import { X, Coins } from 'lucide-react';
import type { Match, BetPrediction } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { placeBet } from '../../services/bets';

interface BetModalProps {
  match: Match;
  onClose: () => void;
}

export default function BetModal({ match, onClose }: BetModalProps) {
  const { userData } = useAuth();
  const [prediction, setPrediction] = useState<BetPrediction | null>(null);
  const [amount, setAmount] = useState(50);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!userData) return null;

  const maxBet = Math.min(userData.officeCoins, 500);

  async function handleBet() {
    if (!prediction || !userData?.officeId) return;
    setLoading(true);
    setError('');
    try {
      await placeBet(
        userData.uid,
        match.id,
        userData.officeId,
        prediction,
        amount,
        match.odds[prediction]
      );
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du pari');
    } finally {
      setLoading(false);
    }
  }

  const options: { key: BetPrediction; label: string; odds: number }[] = [
    { key: 'home', label: match.homeTeam, odds: match.odds.home },
    { key: 'draw', label: 'Match Nul', odds: match.odds.draw },
    { key: 'away', label: match.awayTeam, odds: match.odds.away },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-dunder-green">Pari placé !</h3>
            <p className="text-gray-500 mt-2">Bonne chance !</p>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-bold mb-1">Placer un pari</h3>
            <p className="text-sm text-gray-500 mb-6">
              {match.homeTeam} vs {match.awayTeam}
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2 mb-6">
              {options.map(({ key, label, odds }) => (
                <button
                  key={key}
                  onClick={() => setPrediction(key)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-colors ${
                    prediction === key
                      ? 'border-dunder-blue bg-dunder-blue/5'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <span className="font-medium">{label}</span>
                  <span className="text-sm text-dunder-gold font-semibold">x{odds.toFixed(2)}</span>
                </button>
              ))}
            </div>

            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Mise (OfficeCoins)
              </label>
              <input
                type="range"
                min={10}
                max={maxBet}
                step={10}
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-400">10</span>
                <span className="font-bold text-dunder-blue flex items-center gap-1">
                  <Coins className="w-4 h-4" /> {amount}
                </span>
                <span className="text-gray-400">{maxBet}</span>
              </div>
            </div>

            {prediction && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
                Gain potentiel :{' '}
                <span className="font-bold text-dunder-green">
                  {Math.round(amount * match.odds[prediction])} OfficeCoins
                </span>
              </div>
            )}

            <button
              onClick={handleBet}
              disabled={!prediction || loading}
              className="w-full bg-dunder-blue text-white py-3 rounded-lg font-semibold hover:bg-dunder-blue/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Placement...' : 'Confirmer le pari'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
