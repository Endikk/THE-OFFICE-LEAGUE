import { useState } from 'react';
import { X, Coins, Trophy, Flame, Zap } from 'lucide-react';
import type { Match, BetPrediction, Bet, User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { placeBet, getStreakMultiplier, getStreakLabel, MIN_BET, MAX_BET } from '../../services/bets';

interface BetModalProps {
  match: Match;
  initialPrediction?: BetPrediction;
  officeBets?: Bet[];
  officeMembers?: Pick<User, 'uid' | 'displayName' | 'photoURL'>[];
  onClose: () => void;
  onSuccess?: () => void;
}

const QUICK_AMOUNTS = [10, 25, 50, 100, 200, 500];

export default function BetModal({ match, initialPrediction, officeBets = [], officeMembers = [], onClose, onSuccess }: BetModalProps) {
  const { userData } = useAuth();
  const [prediction, setPrediction] = useState<BetPrediction | null>(initialPrediction || null);
  const [amount, setAmount] = useState(50);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!userData) return null;

  const maxBet = Math.min(userData.officeCoins, MAX_BET);
  const streakMultiplier = getStreakMultiplier(userData.streak);
  const streakLabel = getStreakLabel(userData.streak);

  // Helper : qui a parié sur quoi
  const getMember = (userId: string) => officeMembers.find(m => m.uid === userId);
  const bettersForPrediction = (pred: BetPrediction) =>
    officeBets
      .filter(b => b.prediction === pred)
      .map(b => getMember(b.userId))
      .filter((m): m is Pick<User, 'uid' | 'displayName' | 'photoURL'> => !!m);

  async function handleBet() {
    if (!prediction || !userData?.officeId) return;
    if (amount < MIN_BET || amount > maxBet) {
      setError(`Mise entre ${MIN_BET} et ${maxBet} OfficeCoins`);
      return;
    }
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
      onSuccess?.();
      setTimeout(onClose, 2000);
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

  const potentialGain = prediction
    ? Math.round(amount * match.odds[prediction] * streakMultiplier)
    : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full relative overflow-hidden max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-office-navy px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h3 className="text-white font-bold">Placer un pari</h3>
            <p className="text-white/40 text-xs">{match.league}</p>
          </div>
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
              <p className="text-office-brown/50 mt-2">
                {prediction === 'home' ? match.homeTeam : prediction === 'away' ? match.awayTeam : 'Match Nul'} pour {amount} coins
              </p>
              <p className="text-sm text-office-brown/40 mt-1">
                Gain potentiel : <span className="font-bold text-office-green">{potentialGain} OfficeCoins</span>
              </p>
            </div>
          ) : (
            <>
              {/* Match info */}
              <div className="text-center mb-5">
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    {match.homeLogo && <img src={match.homeLogo} alt="" className="w-10 h-10 mx-auto mb-1 object-contain" />}
                    <p className="text-sm font-semibold text-office-navy">{match.homeTeam}</p>
                  </div>
                  <span className="text-lg font-bold text-office-brown/20">VS</span>
                  <div className="text-center">
                    {match.awayLogo && <img src={match.awayLogo} alt="" className="w-10 h-10 mx-auto mb-1 object-contain" />}
                    <p className="text-sm font-semibold text-office-navy">{match.awayTeam}</p>
                  </div>
                </div>
              </div>

              {/* Streak bonus */}
              {streakLabel && (
                <div className="bg-office-mustard/10 border border-office-mustard/20 rounded-xl px-4 py-2.5 mb-5 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-office-mustard flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-office-mustard">{streakLabel}</p>
                    <p className="text-xs text-office-brown/50">
                      Serie de {userData.streak} victoire{userData.streak > 1 ? 's' : ''} — tes gains sont multiplies !
                    </p>
                  </div>
                </div>
              )}

              {error && <div className="error-box mb-4 text-sm">{error}</div>}

              {/* Choix du pronostic */}
              <div className="space-y-2 mb-5">
                <p className="text-xs font-medium text-office-brown/50 uppercase tracking-wide">Ton pronostic</p>
                {options.map(({ key, label, odds }) => {
                  const betters = bettersForPrediction(key);
                  return (
                    <button
                      key={key}
                      onClick={() => setPrediction(key)}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all ${
                        prediction === key
                          ? 'border-office-mustard bg-office-mustard/5 shadow-sm'
                          : 'border-office-paper-dark hover:border-office-navy/20'
                      }`}
                    >
                      <span className={`font-medium flex-1 text-left ${prediction === key ? 'text-office-navy' : 'text-office-brown/70'}`}>
                        {label}
                      </span>

                      {/* Avatars collègues */}
                      {betters.length > 0 && (
                        <div className="flex items-center">
                          {betters.slice(0, 3).map(m => (
                            m.photoURL ? (
                              <img key={m.uid} src={m.photoURL} alt="" title={m.displayName}
                                className="w-5 h-5 rounded-full border border-white -ml-1 first:ml-0 object-cover" />
                            ) : (
                              <div key={m.uid} title={m.displayName}
                                className="w-5 h-5 rounded-full border border-white bg-office-navy/10 flex items-center justify-center text-[8px] font-bold text-office-navy -ml-1 first:ml-0">
                                {m.displayName.charAt(0).toUpperCase()}
                              </div>
                            )
                          ))}
                          {betters.length > 3 && (
                            <span className="text-[10px] text-office-brown/40 ml-1">+{betters.length - 3}</span>
                          )}
                        </div>
                      )}

                      <span className={`text-sm font-bold px-2.5 py-1 rounded-lg ${
                        prediction === key
                          ? 'bg-office-mustard text-white'
                          : 'bg-office-paper text-office-navy'
                      }`}>
                        x{odds.toFixed(2)}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Mise */}
              <div className="mb-5">
                <p className="text-xs font-medium text-office-brown/50 uppercase tracking-wide mb-2">Ta mise</p>

                {/* Quick amounts */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {QUICK_AMOUNTS.filter(a => a <= maxBet).map(a => (
                    <button
                      key={a}
                      onClick={() => setAmount(a)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        amount === a
                          ? 'bg-office-navy text-white'
                          : 'bg-office-paper text-office-navy hover:bg-office-paper-dark'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                  <button
                    onClick={() => setAmount(maxBet)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      amount === maxBet && !QUICK_AMOUNTS.includes(maxBet)
                        ? 'bg-office-navy text-white'
                        : 'bg-office-red/10 text-office-red hover:bg-office-red/20'
                    }`}
                  >
                    MAX
                  </button>
                </div>

                {/* Slider */}
                <input
                  type="range"
                  min={MIN_BET}
                  max={maxBet}
                  step={10}
                  value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                  className="w-full accent-office-mustard"
                />
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-office-brown/30">{MIN_BET}</span>
                  <span className="font-bold text-office-navy flex items-center gap-1">
                    <Coins className="w-4 h-4 text-office-mustard" /> {amount}
                  </span>
                  <span className="text-office-brown/30">{maxBet}</span>
                </div>

                {/* Solde restant */}
                <p className="text-[11px] text-office-brown/40 text-center mt-1">
                  Solde apres pari : {(userData.officeCoins - amount).toLocaleString()} OfficeCoins
                </p>
              </div>

              {/* Gain potentiel */}
              {prediction && (
                <div className="bg-office-green/5 border border-office-green/20 rounded-xl p-4 mb-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-office-brown/40">Gain potentiel</p>
                      <p className="text-2xl font-bold text-office-green flex items-center gap-1.5">
                        <Coins className="w-5 h-5" />
                        {potentialGain.toLocaleString()}
                      </p>
                    </div>
                    {streakMultiplier > 1 && (
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-office-mustard">
                          <Zap className="w-4 h-4" />
                          <span className="text-sm font-bold">x{streakMultiplier}</span>
                        </div>
                        <p className="text-[10px] text-office-brown/40">bonus streak</p>
                      </div>
                    )}
                  </div>
                  {streakMultiplier > 1 && (
                    <p className="text-[11px] text-office-brown/40 mt-1.5">
                      {amount} x {match.odds[prediction].toFixed(2)} x {streakMultiplier} = {potentialGain}
                    </p>
                  )}
                </div>
              )}

              {/* Confirmer */}
              <button
                onClick={handleBet}
                disabled={!prediction || loading || amount < MIN_BET}
                className="btn-mustard w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  'Placement...'
                ) : (
                  <>
                    <Coins className="w-5 h-5" />
                    Confirmer — {amount} OfficeCoins
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
