import { useAuth } from '../context/AuthContext';
import DundieCard from '../components/awards/DundieCard';
import type { DundieAward } from '../types';

const ALL_DUNDIES: DundieAward[] = [
  { id: '1', title: 'Michael Scott Award', description: 'Premier pari placé', icon: '🏆', earnedAt: new Date() },
  { id: '2', title: 'Jim Halpert', description: '5 paris gagnés d\'affilée', icon: '😏', earnedAt: new Date() },
  { id: '3', title: 'Dwight Schrute', description: 'Meilleur win rate du bureau', icon: '🥋', earnedAt: new Date() },
  { id: '4', title: 'Stanley Hudson', description: '50 paris placés', icon: '📰', earnedAt: new Date() },
  { id: '5', title: 'Kevin Malone', description: 'Perdre 500 OfficeCoins en un jour', icon: '🫠', earnedAt: new Date() },
  { id: '6', title: 'Oscar Martinez', description: 'Win rate > 70%', icon: '🧠', earnedAt: new Date() },
  { id: '7', title: 'Pam Beesly', description: 'Créer 10 sondages', icon: '🎨', earnedAt: new Date() },
  { id: '8', title: 'Ryan Howard', description: 'Rejoindre 3 bureaux différents', icon: '🔥', earnedAt: new Date() },
];

export default function AwardsPage() {
  const { userData } = useAuth();
  const earnedIds = new Set(userData?.dundieAwards.map(a => a.id) || []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Dundie Awards</h1>
      <p className="text-gray-500 mb-8">Collectionne les trophées en accomplissant des défis !</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {ALL_DUNDIES.map(award => (
          <div key={award.id} className={earnedIds.has(award.id) ? '' : 'opacity-40 grayscale'}>
            <DundieCard award={award} />
          </div>
        ))}
      </div>
    </div>
  );
}
