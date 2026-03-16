import { useState } from 'react';
import { X, Coins, Trophy } from 'lucide-react';
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
    ...(match.odds.draw > 0 ? [{ key: 'draw' as BetPrediction, label: 'Match Nul', odds: match.odds.draw }] : []),
    { key: 'away', label: match.awayTeam, odds: match.odds.away },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full relative overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-office-navy px-6 py-4 flex items-center justify-between">
          <h3 className="text-white font-bold">Placer un pari</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-office-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-office-green" />
              </div>
              <h3 className="text-xl font-bold text-office-green">Pari place !</h3>
              <p className="text-office-brown/50 mt-2">Bonne chance !</p>
            </div>
          ) : (
            <>
              {/* Match info */}
              <div className="text-center mb-6">
                <p className="text-xs text-office-brown/40 mb-1">{match.league}</p>
                <p className="font-semibold text-office-navy">
                  {match.homeTeam} <span className="text-office-brown/30">vs</span> {match.awayTeam}
                </p>
              </div>

              {error && <div className="error-box mb-4 text-sm">{error}</div>}

              {/* Choix du pronostic */}
              <div className="space-y-2 mb-6">
                {options.map(({ key, label, odds }) => (
                  <button
                    key={key}
                    onClick={() => setPrediction(key)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl border-2 transition-all ${
                      prediction === key
                        ? 'border-office-mustard bg-office-mustard/5 shadow-sm'
                        : 'border-office-paper-dark hover:border-office-navy/20'
                    }`}
                  >
                    <span className={`font-medium ${prediction === key ? 'text-office-navy' : 'text-office-brown/70'}`}>
                      {label}
                    </span>
                    <span className={`text-sm font-bold px-2.5 py-1 rounded-lg ${
                      prediction === key
                        ? 'bg-office-mustard text-white'
                        : 'bg-office-paper text-office-navy'
                    }`}>
                      x{odds.toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>

              {/* Mise */}
              <div className="mb-6">
                <label className="text-sm font-medium text-office-navy mb-2 block">
                  Mise (OfficeCoins)
                </label>
                <input
                  type="range"
                  min={10}
                  max={maxBet}
                  step={10}
                  value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                  className="w-full accent-office-mustard"
                />
                <div className="flex justify-between text-sm mt-1.5">
                  <span className="text-office-brown/30">10</span>
                  <span className="font-bold text-office-navy flex items-center gap-1">
                    <Coins className="w-4 h-4 text-office-mustard" /> {amount}
                  </span>
                  <span className="text-office-brown/30">{maxBet}</span>
                </div>
              </div>

              {/* Gain potentiel */}
              {prediction && (
                <div className="bg-office-green/5 border border-office-green/20 rounded-xl p-3.5 mb-5 text-center">
                  <p className="text-xs text-office-brown/40 mb-0.5">Gain potentiel</p>
                  <p className="text-xl font-bold text-office-green flex items-center justify-center gap-1.5">
                    <Coins className="w-5 h-5" />
                    {Math.round(amount * match.odds[prediction])} OfficeCoins
                  </p>
                </div>
              )}

              {/* Confirmer */}
              <button
                onClick={handleBet}
                disabled={!prediction || loading}
                className="btn-mustard w-full"
              >
                {loading ? 'Placement...' : 'Confirmer le pari'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
