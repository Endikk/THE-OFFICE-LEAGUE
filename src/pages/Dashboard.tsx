import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, TrendingUp, Target, Coins, Flame, Clock, TrendingDown, ChevronRight, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserBets } from '../services/bets';
import { getMatch } from '../services/matches';
import { getStreakMultiplier, getStreakLabel } from '../services/bets';
import StickyNote from '../components/common/StickyNote';
import type { Bet, Match } from '../types';

interface BetWithMatch extends Bet {
  match?: Match | null;
}

const TIPS = [
  { text: 'Ne parie jamais plus que tu ne peux perdre... en OfficeCoins.', rotate: -2 },
  { text: 'Les favoris ne gagnent pas toujours. Demande a Kevin.', rotate: 1.5 },
  { text: 'Streak x2 a 5 victoires. Vise les etoiles !', rotate: -1 },
];

export default function Dashboard() {
  const { userData } = useAuth();
  const [recentBets, setRecentBets] = useState<BetWithMatch[]>([]);
  const [loadingBets, setLoadingBets] = useState(true);

  useEffect(() => {
    if (!userData) return;
    async function load() {
      try {
        const bets = await getUserBets(userData!.uid, 5);
        const withMatches = await Promise.all(
          bets.map(async (bet) => {
            const match = await getMatch(bet.matchId).catch(() => null);
            return { ...bet, match };
          })
        );
        setRecentBets(withMatches);
      } catch {
        // ignore
      } finally {
        setLoadingBets(false);
      }
    }
    load();
  }, [userData]);

  if (!userData) return null;

  const totalBets = userData.totalWins + userData.totalLosses;
  const winRate = totalBets > 0 ? Math.round((userData.totalWins / totalBets) * 100) : 0;
  const streakLabel = getStreakLabel(userData.streak);
  const streakMultiplier = getStreakMultiplier(userData.streak);

  const stats = [
    { label: 'OfficeCoins', value: userData.officeCoins.toLocaleString(), icon: Coins, color: 'text-office-mustard', bg: 'bg-office-mustard/10' },
    { label: 'Victoires', value: userData.totalWins, icon: Trophy, color: 'text-office-green', bg: 'bg-office-green/10' },
    { label: 'Total paris', value: totalBets, icon: Target, color: 'text-office-navy', bg: 'bg-office-navy/10' },
    { label: 'Win Rate', value: totalBets > 0 ? `${winRate}%` : '-', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 animate-slide-up">
        <h1 className="text-3xl font-heading font-bold text-office-navy">
          Salut, {userData.displayName} !
        </h1>
        <p className="text-office-brown-light/60 mt-1">
          {userData.streak > 0 && (
            <span className="text-office-green font-medium">
              <Flame className="w-4 h-4 inline" /> Serie de {userData.streak} victoire{userData.streak > 1 ? 's' : ''} !
            </span>
          )}
          {userData.streak < 0 && (
            <span className="text-office-red font-medium">
              Serie de {Math.abs(userData.streak)} defaite{Math.abs(userData.streak) > 1 ? 's' : ''}...
            </span>
          )}
          {userData.streak === 0 && 'Pret a parier aujourd\'hui ?'}
        </p>
      </div>

      {/* Streak bonus banner */}
      {streakLabel && (
        <div className="card-accent-mustard bg-gradient-to-r from-office-mustard/10 to-office-mustard/5 p-4 mb-6 flex items-center gap-3 animate-slide-up">
          <div className="w-10 h-10 bg-office-mustard/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-office-mustard" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-office-mustard">{streakLabel}</p>
            <p className="text-xs text-office-brown-light/50">
              Tes gains sont multiplies par {streakMultiplier} grace a ta serie de {userData.streak} victoires
            </p>
          </div>
          <Link to="/matches" className="text-sm font-medium text-office-mustard hover:text-office-mustard-dark transition-colors">
            Parier →
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color, bg }, idx) => (
          <div
            key={label}
            className="card p-5 animate-slide-up"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <div className={`inline-flex items-center justify-center w-10 h-10 ${bg} rounded-xl mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-mono font-bold text-office-navy">{value}</p>
            <p className="text-xs data-label mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Derniers paris */}
        <div className="md:col-span-2 card-accent-navy overflow-hidden animate-slide-up">
          <div className="flex items-center justify-between px-5 py-4 border-b border-office-paper-dark/40">
            <h2 className="font-heading text-lg font-bold text-office-navy">Derniers paris</h2>
            <Link to="/bets" className="text-xs text-office-mustard hover:text-office-mustard-dark font-medium flex items-center gap-0.5 transition-colors">
              Voir tout <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loadingBets ? (
            <div className="p-5 text-center text-sm text-office-brown-light/40">Chargement...</div>
          ) : recentBets.length === 0 ? (
            <div className="p-5 text-center">
              <p className="text-sm text-office-brown-light/40 mb-2">Aucun pari pour le moment</p>
              <Link to="/matches" className="text-sm font-medium text-office-mustard hover:text-office-mustard-dark transition-colors">
                Placer ton premier pari →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-office-paper-dark/40">
              {recentBets.map((bet) => {
                const match = bet.match;
                const predLabel = bet.prediction === 'home'
                  ? match?.homeTeam?.split(' ')[0] || 'Dom.'
                  : bet.prediction === 'away'
                  ? match?.awayTeam?.split(' ')[0] || 'Ext.'
                  : 'Nul';

                return (
                  <div key={bet.id} className="flex items-center gap-3 px-5 py-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      bet.status === 'won' ? 'bg-office-green/10' :
                      bet.status === 'lost' ? 'bg-office-red/10' :
                      'bg-office-mustard/10'
                    }`}>
                      {bet.status === 'won' && <Trophy className="w-4 h-4 text-office-green" />}
                      {bet.status === 'lost' && <TrendingDown className="w-4 h-4 text-office-red" />}
                      {bet.status === 'pending' && <Clock className="w-4 h-4 text-office-mustard" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-office-navy truncate">
                        {match ? `${match.homeTeam} vs ${match.awayTeam}` : 'Match'}
                      </p>
                      <p className="text-[11px] text-office-brown-light/40 font-mono">{predLabel} | x{bet.oddsAtBet.toFixed(2)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {bet.status === 'won' ? (
                        <span className="text-sm font-mono font-bold text-office-green">+{bet.gainedPoints}</span>
                      ) : bet.status === 'lost' ? (
                        <span className="text-sm font-mono font-bold text-office-red">-{bet.amount}</span>
                      ) : (
                        <span className="text-sm font-mono font-bold text-office-mustard">{bet.amount}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar: Post-it tip + Actions */}
        <div className="space-y-4 animate-slide-up" style={{ animationDelay: '150ms' }}>
          {/* Post-it */}
          <StickyNote rotate={TIPS[0].rotate}>
            <p className="text-sm text-office-brown leading-relaxed">{TIPS[0].text}</p>
            <p className="text-[10px] text-office-brown-light/40 mt-2">— Conseil du jour</p>
          </StickyNote>

          {/* Actions rapides */}
          <Link to="/matches" className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow group block">
            <div className="w-10 h-10 bg-office-mustard/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-office-mustard/20 transition-colors">
              <Trophy className="w-5 h-5 text-office-mustard" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm text-office-navy">Matchs du jour</h3>
              <p className="text-[11px] text-office-brown-light/40">Place tes paris</p>
            </div>
            <ChevronRight className="w-4 h-4 text-office-brown-light/30" />
          </Link>

          <Link to="/bets" className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow group block">
            <div className="w-10 h-10 bg-office-navy/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-office-navy/15 transition-colors">
              <Target className="w-5 h-5 text-office-navy" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm text-office-navy">Historique</h3>
              <p className="text-[11px] text-office-brown-light/40">Tes paris passes</p>
            </div>
            <ChevronRight className="w-4 h-4 text-office-brown-light/30" />
          </Link>

          <Link to="/leaderboard" className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow group block">
            <div className="w-10 h-10 bg-office-green/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-office-green/15 transition-colors">
              <TrendingUp className="w-5 h-5 text-office-green" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm text-office-navy">Classement</h3>
              <p className="text-[11px] text-office-brown-light/40">Qui domine le bureau ?</p>
            </div>
            <ChevronRight className="w-4 h-4 text-office-brown-light/30" />
          </Link>
        </div>
      </div>

      {/* Dundies */}
      {userData.dundieAwards.length > 0 && (
        <div className="mt-8 animate-slide-up">
          <h2 className="font-heading text-lg font-bold text-office-navy mb-4">Tes Dundie Awards</h2>
          <p className="text-office-brown-light/40 text-sm">
            {userData.dundieAwards.length} trophee{userData.dundieAwards.length > 1 ? 's' : ''} gagne{userData.dundieAwards.length > 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
