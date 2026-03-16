import { Calendar } from 'lucide-react';
import type { Match } from '../../types';

interface MatchCardProps {
  match: Match;
  onBet?: (match: Match) => void;
}

function getStatusLabel(status: Match['status']): string {
  const map: Record<string, string> = {
    upcoming: 'A venir',
    live: 'En direct',
    finished: 'Terminé',
  };
  return map[status] || status;
}

function getStatusColor(status: Match['status']): string {
  if (status === 'finished') return 'bg-gray-500';
  if (status === 'upcoming') return 'bg-dunder-blue';
  return 'bg-dunder-green animate-pulse';
}

export default function MatchCard({ match, onBet }: MatchCardProps) {
  const startTime = match.startTime instanceof Date
    ? match.startTime
    : match.startTime?.toDate?.() || new Date();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-dunder-blue font-medium">{match.league}</span>
        <span className={`text-xs text-white px-2 py-0.5 rounded-full ${getStatusColor(match.status)}`}>
          {getStatusLabel(match.status)}
        </span>
      </div>
      <div className="flex items-center gap-1 mb-4">
        <Calendar className="w-3 h-3 text-gray-400" />
        <span className="text-xs text-gray-400">
          {startTime.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 text-center">
          <p className="text-sm font-semibold">{match.homeTeam}</p>
        </div>

        <div className="text-center px-4">
          {match.status === 'upcoming' ? (
            <span className="text-2xl font-bold text-gray-300">VS</span>
          ) : (
            <div className="text-2xl font-bold text-dunder-blue">
              {match.homeScore} - {match.awayScore}
            </div>
          )}
        </div>

        <div className="flex-1 text-center">
          <p className="text-sm font-semibold">{match.awayTeam}</p>
        </div>
      </div>

      {match.status === 'upcoming' && (
        <div className="flex justify-between mt-4 text-xs text-gray-400">
          <span>x{match.odds.home.toFixed(2)}</span>
          <span>x{match.odds.draw.toFixed(2)}</span>
          <span>x{match.odds.away.toFixed(2)}</span>
        </div>
      )}

      {match.status === 'upcoming' && onBet && (
        <button
          onClick={() => onBet(match)}
          className="mt-3 w-full bg-dunder-gold text-white py-2 rounded-lg font-semibold text-sm hover:bg-dunder-gold/90 transition-colors"
        >
          Parier sur ce match
        </button>
      )}
    </div>
  );
}
