import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import LeaderboardTable from '../components/leaderboard/LeaderboardTable';
import LoadingSpinner from '../components/common/LoadingSpinner';
import type { LeaderboardEntry, User } from '../types';

export default function LeaderboardPage() {
  const { userData } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData?.officeId) return;

    async function loadLeaderboard() {
      const q = query(collection(db, 'users'), where('officeId', '==', userData!.officeId));
      const snapshot = await getDocs(q);

      const users = snapshot.docs.map(d => ({ uid: d.id, ...d.data() } as User));
      const sorted = users.sort((a, b) => b.officeCoins - a.officeCoins);

      setEntries(
        sorted.map((u, i) => ({
          userId: u.uid,
          displayName: u.displayName,
          photoURL: u.photoURL,
          officeCoins: u.officeCoins,
          wonBets: u.wonBets,
          totalBets: u.totalBets,
          winRate: u.totalBets > 0 ? (u.wonBets / u.totalBets) * 100 : 0,
          rank: i + 1,
        }))
      );
      setLoading(false);
    }

    loadLeaderboard();
  }, [userData?.officeId]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Classement</h1>
      {entries.length > 0 ? (
        <LeaderboardTable entries={entries} />
      ) : (
        <p className="text-gray-400 text-center py-12">
          Aucun membre dans le bureau pour le moment.
        </p>
      )}
    </div>
  );
}
