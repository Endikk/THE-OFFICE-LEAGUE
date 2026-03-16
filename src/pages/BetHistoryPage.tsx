import { useState, useEffect } from 'react';
import { Trophy, TrendingDown, Clock, Coins, Flame, Target, TrendingUp, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserBets, getUserBetStats } from '../services/bets';
import { getMatch } from '../services/matches';
import LoadingSpinner from '../components/common/LoadingSpinner';
import type { Bet, BetStatus, Match } from '../types';

type FilterStatus = 'all' | BetStatus;

const FILTERS: { key: FilterStatus; label: string; icon: typeof Trophy }[] = [
  { key: 'all', label: 'Tous', icon: Filter },
  { key: 'pending', label: 'En cours', icon: Clock },
  { key: 'won', label: 'Gagnes', icon: Trophy },
  { key: 'lost', label: 'Perdus', icon: TrendingDown },
];

interface BetWithMatch extends Bet {
  match?: Match | null;
}

export default function BetHistoryPage() {
  const { userData } = useAuth();
  const [bets, setBets] = useState<BetWithMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [stats, setStats] = useState({
    total: 0, pending: 0, won: 0, lost: 0,
    totalWagered: 0, totalWon: 0, biggestWin: 0,
  });

  useEffect(() => {
    if (!userData) return;

    async function load() {
      setLoading(true);
      try {
        const [allBets, betStats] = await Promise.all([
          getUserBets(userData!.uid),
          getUserBetStats(userData!.uid),
        ]);
        setStats(betStats);

        // Charger les matchs en parallèle
        const betsWithMatches = await Promise.all(
          allBets.map(async (bet) => {
            const match = await getMatch(bet.matchId).catch(() => null);
            return { ...bet, match };
          })
        );
        setBets(betsWithMatches);
      } catch (err) {
        console.error('Erreur chargement historique:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userData]);

  if (!userData) return null;

  const filteredBets = filter === 'all' ? bets : bets.filter(b => b.status === filter);
  const winRate = stats.total > 0 ? Math.round((stats.won / (stats.won + stats.lost)) * 100) : 0;
  const profit = stats.totalWon - stats.totalWagered;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-office-navy">Mes paris</h1>
        <p className="text-sm text-office-brown/40 mt-1">
          Historique complet de tes paris
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-office-navy" />
            <span className="text-xs text-office-brown/40">Total</span>
          </div>
          <p className="text-xl font-bold text-office-navy">{stats.total}</p>
          <p className="text-[11px] text-office-brown/30">{stats.pending} en cours</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-office-green" />
            <span className="text-xs text-office-brown/40">Win Rate</span>
          </div>
          <p className="text-xl font-bold text-office-green">{winRate}%</p>
          <p className="text-[11px] text-office-brown/30">{stats.won}W / {stats.lost}L</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Coins className="w-4 h-4 text-office-mustard" />
            <span className="text-xs text-office-brown/40">Profit</span>
          </div>
          <p className={`text-xl font-bold ${profit >= 0 ? 'text-office-green' : 'text-office-red'}`}>
            {profit >= 0 ? '+' : ''}{profit.toLocaleString()}
          </p>
          <p className="text-[11px] text-office-brown/30">{stats.totalWagered} mises</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-4 h-4 text-office-mustard" />
            <span className="text-xs text-office-brown/40">Best Win</span>
          </div>
          <p className="text-xl font-bold text-office-mustard">
            {stats.biggestWin > 0 ? `+${stats.biggestWin}` : '-'}
          </p>
          <p className="text-[11px] text-office-brown/30">Streak : {userData.streak > 0 ? `+${userData.streak}` : userData.streak}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1 mb-6 bg-office-paper rounded-xl p-1">
        {FILTERS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              filter === key
                ? 'bg-white text-office-navy shadow-sm'
                : 'text-office-brown/40 hover:text-office-brown/60'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {key !== 'all' && (
              <span className="text-xs">
                ({key === 'pending' ? stats.pending : key === 'won' ? stats.won : stats.lost})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Bets list */}
      {loading ? (
        <LoadingSpinner text="Chargement de l'historique..." />
      ) : filteredBets.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-office-paper rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Target className="w-7 h-7 text-office-brown/30" />
          </div>
          <p className="text-office-brown/40 font-medium">
            {filter === 'all' ? 'Aucun pari pour le moment' : `Aucun pari ${filter === 'pending' ? 'en cours' : filter === 'won' ? 'gagne' : 'perdu'}`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredBets.map((bet) => {
            const match = bet.match;
            const createdAt = bet.createdAt instanceof Date
              ? bet.createdAt
              : (bet.createdAt as { toDate?: () => Date })?.toDate?.() || new Date();

            const predictionLabel = bet.prediction === 'home'
              ? match?.homeTeam || 'Domicile'
              : bet.prediction === 'away'
              ? match?.awayTeam || 'Exterieur'
              : 'Nul';

            return (
              <div
                key={bet.id}
                className={`card p-4 flex items-center gap-4 ${
                  bet.status === 'won' ? 'border-l-4 border-l-office-green' :
                  bet.status === 'lost' ? 'border-l-4 border-l-office-red' :
                  'border-l-4 border-l-office-mustard'
                }`}
              >
                {/* Icone statut */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  bet.status === 'won' ? 'bg-office-green/10' :
                  bet.status === 'lost' ? 'bg-office-red/10' :
                  'bg-office-mustard/10'
                }`}>
                  {bet.status === 'won' && <Trophy className="w-5 h-5 text-office-green" />}
                  {bet.status === 'lost' && <TrendingDown className="w-5 h-5 text-office-red" />}
                  {bet.status === 'pending' && <Clock className="w-5 h-5 text-office-mustard" />}
                </div>

                {/* Info match */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-office-navy truncate">
                    {match ? `${match.homeTeam} vs ${match.awayTeam}` : 'Match inconnu'}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-office-brown/40">
                      {createdAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </span>
                    <span className="text-xs text-office-brown/30">|</span>
                    <span className="text-xs text-office-brown/50 font-medium">{predictionLabel}</span>
                    <span className="text-xs text-office-brown/30">|</span>
                    <span className="text-xs text-office-brown/40">x{bet.oddsAtBet.toFixed(2)}</span>
                  </div>
                  {/* Score si terminé */}
                  {match && match.status === 'finished' && (
                    <p className="text-xs text-office-brown/40 mt-0.5">
                      Score : {match.homeScore} - {match.awayScore}
                    </p>
                  )}
                </div>

                {/* Montant */}
                <div className="text-right flex-shrink-0">
                  {bet.status === 'won' ? (
                    <p className="text-lg font-bold text-office-green">+{bet.gainedPoints.toLocaleString()}</p>
                  ) : bet.status === 'lost' ? (
                    <p className="text-lg font-bold text-office-red">-{bet.amount.toLocaleString()}</p>
                  ) : (
                    <p className="text-lg font-bold text-office-mustard">{bet.amount.toLocaleString()}</p>
                  )}
                  <p className="text-[10px] text-office-brown/30">
                    {bet.status === 'pending' ? 'en jeu' : bet.status === 'won' ? 'gagne' : 'perdu'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
