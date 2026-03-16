import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getLeaderboard } from '../services/leaderboard';
import LeaderboardTable from '../components/leaderboard/LeaderboardTable';
import LoadingSpinner from '../components/common/LoadingSpinner';
import type { RankingEntry } from '../types';

export default function LeaderboardPage() {
  const { userData } = useAuth();
  const [entries, setEntries] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData?.officeId) return;

    getLeaderboard(userData.officeId)
      .then(setEntries)
      .finally(() => setLoading(false));
  }, [userData?.officeId]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Classement</h1>
      {entries.length > 0 ? (
        <LeaderboardTable entries={entries} />
      ) : (
        <p className="text-gray-400 text-center py-12">
          Aucun classement disponible pour le moment.
        </p>
      )}
    </div>
  );
}
