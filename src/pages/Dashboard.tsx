import { Trophy, TrendingUp, Target, Coins, Flame } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { userData } = useAuth();

  if (!userData) return null;

  const totalBets = userData.totalWins + userData.totalLosses;
  const winRate = totalBets > 0 ? Math.round((userData.totalWins / totalBets) * 100) : 0;

  const stats = [
    { label: 'OfficeCoins', value: userData.officeCoins.toLocaleString(), icon: Coins, color: 'text-office-mustard', bg: 'bg-office-mustard/10' },
    { label: 'Victoires', value: userData.totalWins, icon: Trophy, color: 'text-office-green', bg: 'bg-office-green/10' },
    { label: 'Total paris', value: totalBets, icon: Target, color: 'text-office-navy', bg: 'bg-office-navy/10' },
    { label: 'Win Rate', value: totalBets > 0 ? `${winRate}%` : '-', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-office-navy">
          Salut, {userData.displayName} !
        </h1>
        <p className="text-office-brown/50 mt-1">
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-5">
            <div className={`inline-flex items-center justify-center w-10 h-10 ${bg} rounded-xl mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-office-navy">{value}</p>
            <p className="text-sm text-office-brown/40 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-bold text-office-navy mb-4">Matchs du jour</h2>
          <p className="text-office-brown/40 text-sm">
            Connecte l'API Football pour voir les matchs en direct.
          </p>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-bold text-office-navy mb-4">Derniers paris</h2>
          <p className="text-office-brown/40 text-sm">
            Tes paris apparaitront ici une fois places.
          </p>
        </div>
      </div>

      {userData.dundieAwards.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-office-navy mb-4">Tes Dundie Awards</h2>
          <p className="text-office-brown/40 text-sm">
            {userData.dundieAwards.length} trophee{userData.dundieAwards.length > 1 ? 's' : ''} gagne{userData.dundieAwards.length > 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
