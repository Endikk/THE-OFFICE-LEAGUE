import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToAwards, getCurrentSeason, getRandomMichaelQuote, groupAwardsBySeason } from '../services/dundie-awards';
import DundieAwardsSection from '../components/awards/DundieAwardsSection';
import LoadingSpinner from '../components/common/LoadingSpinner';
import type { DundieAward } from '../types';

export default function AwardsPage() {
  const { userData } = useAuth();
  const [awards, setAwards] = useState<DundieAward[]>([]);
  const [loading, setLoading] = useState(true);
  const [quote] = useState(() => getRandomMichaelQuote());

  useEffect(() => {
    if (!userData?.officeId) return;

    const unsubscribe = subscribeToAwards(userData.officeId, (updated) => {
      setAwards(updated);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData?.officeId]);

  if (loading) return <LoadingSpinner />;

  const season = getCurrentSeason();
  const awardsBySeason = groupAwardsBySeason(awards);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-office-navy">Dundie Awards</h1>
        <p className="text-sm text-office-brown/40 mt-0.5">
          Les trophees du bureau · Saison {season}
        </p>
      </div>

      <DundieAwardsSection
        awards={awards}
        awardsBySeason={awardsBySeason}
        currentSeason={season}
      />

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
