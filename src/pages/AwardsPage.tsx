import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getOfficeAwards } from '../services/dundie-awards';
import { AUTO_DUNDIES } from '../services/dundie-awards';
import DundieCard from '../components/awards/DundieCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import type { DundieAward } from '../types';

export default function AwardsPage() {
  const { userData } = useAuth();
  const [awards, setAwards] = useState<DundieAward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData?.officeId) return;
    getOfficeAwards(userData.officeId)
      .then(setAwards)
      .finally(() => setLoading(false));
  }, [userData?.officeId]);

  if (loading) return <LoadingSpinner />;

  // Groupe les awards gagnés par titre
  const earnedTitles = new Set(awards.map(a => a.title));

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Dundie Awards</h1>
      <p className="text-gray-500 mb-8">Collectionne les trophées en accomplissant des défis !</p>

      <h2 className="text-xl font-bold mb-4">Trophées disponibles</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {AUTO_DUNDIES.map((dundie) => (
          <div key={dundie.title} className={earnedTitles.has(dundie.title) ? '' : 'opacity-40 grayscale'}>
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl border border-yellow-200 p-5 text-center">
              <div className="text-4xl mb-3">{dundie.emoji}</div>
              <h3 className="font-bold text-lg text-dunder-blue">{dundie.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{dundie.description}</p>
            </div>
          </div>
        ))}
      </div>

      {awards.length > 0 && (
        <>
          <h2 className="text-xl font-bold mb-4">Trophées du bureau ({awards.length})</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {awards.map((award) => (
              <DundieCard key={award.id} award={award} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
