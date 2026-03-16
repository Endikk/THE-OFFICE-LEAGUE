import { Trophy, TrendingUp, Target, Coins, Flame } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { userData } = useAuth();

  if (!userData) return null;

  const totalBets = userData.totalWins + userData.totalLosses;
  const winRate = totalBets > 0 ? Math.round((userData.totalWins / totalBets) * 100) : 0;

  const stats = [
    { label: 'OfficeCoins', value: userData.officeCoins, icon: Coins, color: 'text-dunder-gold' },
    { label: 'Victoires', value: userData.totalWins, icon: Trophy, color: 'text-dunder-green' },
    { label: 'Total paris', value: totalBets, icon: Target, color: 'text-dunder-blue' },
    { label: 'Win Rate', value: totalBets > 0 ? `${winRate}%` : '-', icon: TrendingUp, color: 'text-purple-500' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Salut, {userData.displayName} !
        </h1>
        <p className="text-gray-500 mt-1">
          {userData.streak > 0 && (
            <span className="text-dunder-green font-medium">
              <Flame className="w-4 h-4 inline" /> Série de {userData.streak} victoire{userData.streak > 1 ? 's' : ''} !
            </span>
          )}
          {userData.streak < 0 && (
            <span className="text-dunder-red font-medium">
              Série de {Math.abs(userData.streak)} défaite{Math.abs(userData.streak) > 1 ? 's' : ''}...
            </span>
          )}
          {userData.streak === 0 && 'Prêt à parier aujourd\'hui ?'}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-5 h-5 ${color}`} />
              <span className="text-sm text-gray-500">{label}</span>
            </div>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold mb-4">Matchs du jour</h2>
          <p className="text-gray-400 text-sm">
            Connecte l'API Football pour voir les matchs en direct.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold mb-4">Derniers paris</h2>
          <p className="text-gray-400 text-sm">
            Tes paris apparaîtront ici une fois placés.
          </p>
        </div>
      </div>

      {userData.dundieAwards.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold mb-4">Tes Dundie Awards</h2>
          <p className="text-gray-400 text-sm">
            {userData.dundieAwards.length} trophée{userData.dundieAwards.length > 1 ? 's' : ''} gagné{userData.dundieAwards.length > 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
