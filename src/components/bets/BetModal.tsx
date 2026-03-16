import { useState } from 'react';
import { X, Coins } from 'lucide-react';
import type { ApiFixture } from '../../services/api-football';
import { useAuth } from '../../context/AuthContext';
import { placeBet } from '../../services/bets';

interface BetModalProps {
  fixture: ApiFixture;
  onClose: () => void;
}

type Prediction = 'home' | 'draw' | 'away';

const ODDS: Record<Prediction, number> = {
  home: 1.8,
  draw: 3.2,
  away: 2.5,
};

export default function BetModal({ fixture, onClose }: BetModalProps) {
  const { userData } = useAuth();
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [amount, setAmount] = useState(50);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!userData) return null;

  const maxBet = Math.min(userData.officeCoins, 500);

  async function handleBet() {
    if (!prediction || !userData?.officeId) return;
    setLoading(true);
    try {
      await placeBet(
        userData.uid,
        fixture.fixture.id.toString(),
        userData.officeId,
        prediction,
        amount,
        ODDS[prediction]
      );
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }

  const options: { key: Prediction; label: string }[] = [
    { key: 'home', label: fixture.teams.home.name },
    { key: 'draw', label: 'Match Nul' },
    { key: 'away', label: fixture.teams.away.name },
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
              {fixture.teams.home.name} vs {fixture.teams.away.name}
            </p>

            <div className="space-y-2 mb-6">
              {options.map(({ key, label }) => (
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
                  <span className="text-sm text-dunder-gold font-semibold">x{ODDS[key]}</span>
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
                  {Math.round(amount * ODDS[prediction])} OfficeCoins
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
