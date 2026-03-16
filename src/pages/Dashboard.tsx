import { Trophy, TrendingUp, Target, Coins } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { userData } = useAuth();

  if (!userData) return null;

  const stats = [
    { label: 'OfficeCoins', value: userData.officeCoins, icon: Coins, color: 'text-dunder-gold' },
    { label: 'Paris gagnés', value: userData.wonBets, icon: Trophy, color: 'text-dunder-green' },
    { label: 'Total paris', value: userData.totalBets, icon: Target, color: 'text-dunder-blue' },
    {
      label: 'Win Rate',
      value: userData.totalBets > 0 ? `${Math.round((userData.wonBets / userData.totalBets) * 100)}%` : '-',
      icon: TrendingUp,
      color: 'text-purple-500',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Salut, {userData.displayName} ! 👋
        </h1>
        <p className="text-gray-500 mt-1">Prêt à parier aujourd'hui ?</p>
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
          <h2 className="text-lg font-bold mb-4">Tes Dundie Awards 🏆</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {userData.dundieAwards.map((award) => (
              <div
                key={award.id}
                className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl border border-yellow-200 p-4 text-center"
              >
                <div className="text-3xl mb-2">{award.icon}</div>
                <p className="font-semibold text-sm">{award.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
