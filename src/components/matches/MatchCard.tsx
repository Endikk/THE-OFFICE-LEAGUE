import { Calendar } from 'lucide-react';
import type { ApiFixture } from '../../services/api-football';

interface MatchCardProps {
  fixture: ApiFixture;
  onBet?: (fixtureId: number) => void;
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    NS: 'À venir',
    '1H': '1ère MT',
    HT: 'Mi-temps',
    '2H': '2ème MT',
    FT: 'Terminé',
    AET: 'Prolongations',
    PEN: 'Tirs au but',
  };
  return map[status] || status;
}

function getStatusColor(status: string): string {
  if (status === 'FT' || status === 'AET' || status === 'PEN') return 'bg-gray-500';
  if (status === 'NS') return 'bg-dunder-blue';
  return 'bg-dunder-green animate-pulse';
}

export default function MatchCard({ fixture, onBet }: MatchCardProps) {
  const { fixture: fix, teams, goals } = fixture;
  const isUpcoming = fix.status.short === 'NS';
  const matchDate = new Date(fix.date);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {matchDate.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
        <span className={`text-xs text-white px-2 py-0.5 rounded-full ${getStatusColor(fix.status.short)}`}>
          {getStatusLabel(fix.status.short)}
        </span>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 text-center">
          <img src={teams.home.logo} alt={teams.home.name} className="w-12 h-12 mx-auto mb-2 object-contain" />
          <p className="text-sm font-medium truncate">{teams.home.name}</p>
        </div>

        <div className="text-center px-4">
          {isUpcoming ? (
            <span className="text-2xl font-bold text-gray-300">VS</span>
          ) : (
            <div className="text-2xl font-bold text-dunder-blue">
              {goals.home} - {goals.away}
            </div>
          )}
        </div>

        <div className="flex-1 text-center">
          <img src={teams.away.logo} alt={teams.away.name} className="w-12 h-12 mx-auto mb-2 object-contain" />
          <p className="text-sm font-medium truncate">{teams.away.name}</p>
        </div>
      </div>

      {isUpcoming && onBet && (
        <button
          onClick={() => onBet(fix.id)}
          className="mt-4 w-full bg-dunder-gold text-white py-2 rounded-lg font-semibold text-sm hover:bg-dunder-gold/90 transition-colors"
        >
          Parier sur ce match
        </button>
      )}
    </div>
  );
}
