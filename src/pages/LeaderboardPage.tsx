import { useEffect, useState } from 'react';
import { Trophy, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { subscribeToLeaderboard } from '../services/leaderboard';
import { getOfficeAwards, getCurrentSeason, getRandomMichaelQuote, groupAwardsBySeason } from '../services/dundie-awards';
import LeaderboardTable from '../components/leaderboard/LeaderboardTable';
import DundieAwardsSection from '../components/awards/DundieAwardsSection';
import LoadingSpinner from '../components/common/LoadingSpinner';
import type { RankingEntry, DundieAward } from '../types';

type Tab = 'leaderboard' | 'dundies';

export default function LeaderboardPage() {
  const { userData } = useAuth();
  const [entries, setEntries] = useState<RankingEntry[]>([]);
  const [awards, setAwards] = useState<DundieAward[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('leaderboard');
  const [quote] = useState(() => getRandomMichaelQuote());

  // Real-time leaderboard
  useEffect(() => {
    if (!userData?.officeId) return;

    const unsubscribe = subscribeToLeaderboard(userData.officeId, (updated) => {
      setEntries(updated);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData?.officeId]);

  // Load awards
  useEffect(() => {
    if (!userData?.officeId) return;
    getOfficeAwards(userData.officeId).then(setAwards);
  }, [userData?.officeId]);

  if (loading) return <LoadingSpinner />;

  const season = getCurrentSeason();
  const seasonAwards = awards.filter(a => a.season === season);
  const awardsByseason = groupAwardsBySeason(awards);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-office-navy">Classement du Bureau</h1>
        <p className="text-sm text-office-brown/40 mt-0.5">
          {entries.length} membre{entries.length !== 1 ? 's' : ''} · Saison {season}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-office-paper rounded-xl p-1">
        <button
          onClick={() => setTab('leaderboard')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            tab === 'leaderboard' ? 'bg-white text-office-navy shadow-sm' : 'text-office-brown/40 hover:text-office-brown/60'
          }`}
        >
          <Trophy className="w-4 h-4" />
          Classement
        </button>
        <button
          onClick={() => setTab('dundies')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            tab === 'dundies' ? 'bg-white text-office-navy shadow-sm' : 'text-office-brown/40 hover:text-office-brown/60'
          }`}
        >
          <Award className="w-4 h-4" />
          Dundie Awards ({seasonAwards.length})
        </button>
      </div>

      {/* Content */}
      {tab === 'leaderboard' && (
        <>
          {entries.length > 0 ? (
            <LeaderboardTable entries={entries} currentUserId={userData?.uid} />
          ) : (
            <div className="text-center py-16">
              <span className="text-5xl block mb-4">🏅</span>
              <p className="text-office-brown/40 font-medium">
                Aucun classement disponible. Placez vos premiers paris !
              </p>
            </div>
          )}
        </>
      )}

      {tab === 'dundies' && (
        <DundieAwardsSection
          awards={awards}
          awardsBySeason={awardsByseason}
          currentSeason={season}
        />
      )}

      {/* Michael Scott quote */}
      <div className="mt-10 text-center">
        <div className="inline-block bg-office-paper rounded-xl px-6 py-4 max-w-md">
          <p className="text-sm text-office-brown/50 italic leading-relaxed">
            "{quote}"
          </p>
          <p className="text-xs text-office-brown/30 mt-2 font-medium">
            — Michael Scott
          </p>
        </div>
      </div>
    </div>
  );
}
