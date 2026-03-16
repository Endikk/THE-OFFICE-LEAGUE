import { Calendar, Zap, Users } from 'lucide-react';
import type { Match, Bet, Sport } from '../../types';

interface MatchCardProps {
  match: Match;
  officeBets?: Bet[];
  onBet?: (match: Match) => void;
}

function getStatusLabel(status: Match['status']): string {
  const map: Record<string, string> = {
    upcoming: 'A venir',
    live: 'EN DIRECT',
    finished: 'Termine',
  };
  return map[status] || status;
}

function getStatusClasses(status: Match['status']): string {
  if (status === 'live') return 'bg-office-red text-white animate-pulse';
  if (status === 'finished') return 'bg-office-brown/20 text-office-brown/60';
  return 'bg-office-navy/10 text-office-navy';
}

function getSportEmoji(sport: Sport): string {
  const map: Record<Sport, string> = {
    football: '⚽',
    basketball: '🏀',
    nfl: '🏈',
    rugby: '🏉',
  };
  return map[sport] || '⚽';
}

function formatTime(date: Date | { toDate?: () => Date }): string {
  const d = date instanceof Date ? date : date?.toDate?.() || new Date();
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MatchCard({ match, officeBets = [], onBet }: MatchCardProps) {
  const startTime = match.startTime instanceof Date
    ? match.startTime
    : (match.startTime as { toDate?: () => Date })?.toDate?.() || new Date();

  // Compter les paris du bureau
  const homeBets = officeBets.filter(b => b.prediction === 'home').length;
  const drawBets = officeBets.filter(b => b.prediction === 'draw').length;
  const awayBets = officeBets.filter(b => b.prediction === 'away').length;
  const totalBets = officeBets.length;

  return (
    <div className={`card overflow-hidden transition-shadow hover:shadow-lg ${
      match.status === 'live' ? 'ring-2 ring-office-red/30' : ''
    }`}>
      {/* Header : ligue + statut */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-office-paper/50 border-b border-office-paper-dark/40">
        <div className="flex items-center gap-2">
          <span className="text-sm">{getSportEmoji(match.sport)}</span>
          <span className="text-xs font-medium text-office-navy/70">{match.league}</span>
          {match.isWorldCup && (
            <span className="text-xs bg-office-mustard/20 text-office-mustard px-1.5 py-0.5 rounded font-bold">WC</span>
          )}
        </div>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${getStatusClasses(match.status)}`}>
          {match.status === 'live' && <Zap className="w-3 h-3 inline mr-0.5 -mt-0.5" />}
          {getStatusLabel(match.status)}
        </span>
      </div>

      {/* Corps : equipes + score */}
      <div className="px-4 py-4">
        {/* Date */}
        <div className="flex items-center gap-1 mb-3">
          <Calendar className="w-3 h-3 text-office-brown/30" />
          <span className="text-[11px] text-office-brown/40">{formatTime(startTime)}</span>
          {match.worldCupGroup && (
            <span className="text-[11px] text-office-mustard font-medium ml-auto">
              Groupe {match.worldCupGroup}
            </span>
          )}
        </div>

        {/* Equipes */}
        <div className="flex items-center gap-3">
          {/* Home */}
          <div className="flex-1 text-center">
            {match.homeLogo && (
              <img src={match.homeLogo} alt="" className="w-8 h-8 mx-auto mb-1.5 object-contain" />
            )}
            <p className="text-sm font-semibold text-office-navy leading-tight">{match.homeTeam}</p>
          </div>

          {/* Score / VS */}
          <div className="text-center px-3 min-w-[70px]">
            {match.status === 'upcoming' ? (
              <span className="text-2xl font-bold text-office-brown/20">VS</span>
            ) : (
              <div className={`text-2xl font-bold ${match.status === 'live' ? 'text-office-red' : 'text-office-navy'}`}>
                {match.homeScore} - {match.awayScore}
              </div>
            )}
          </div>

          {/* Away */}
          <div className="flex-1 text-center">
            {match.awayLogo && (
              <img src={match.awayLogo} alt="" className="w-8 h-8 mx-auto mb-1.5 object-contain" />
            )}
            <p className="text-sm font-semibold text-office-navy leading-tight">{match.awayTeam}</p>
          </div>
        </div>

        {/* Cotes */}
        {match.status === 'upcoming' && (
          <div className="flex justify-between mt-4 gap-2">
            {[
              { key: 'home', label: '1', odds: match.odds.home },
              ...(match.odds.draw > 0 ? [{ key: 'draw', label: 'N', odds: match.odds.draw }] : []),
              { key: 'away', label: '2', odds: match.odds.away },
            ].map(({ key, label, odds }) => (
              <div key={key} className="flex-1 bg-office-paper rounded-lg py-1.5 text-center">
                <span className="text-[10px] text-office-brown/40 block">{label}</span>
                <span className="text-sm font-bold text-office-navy">x{odds.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Paris du bureau */}
        {totalBets > 0 && (
          <div className="mt-3 pt-3 border-t border-office-paper-dark/40">
            <div className="flex items-center gap-1.5 mb-2">
              <Users className="w-3.5 h-3.5 text-office-brown/40" />
              <span className="text-[11px] text-office-brown/40 font-medium">
                {totalBets} pari{totalBets > 1 ? 's' : ''} dans le bureau
              </span>
            </div>
            <div className="flex gap-1">
              {homeBets > 0 && (
                <div className="flex-1 bg-office-navy/5 rounded px-2 py-1 text-center">
                  <span className="text-[10px] text-office-navy/60">{match.homeTeam.split(' ')[0]}</span>
                  <span className="block text-xs font-bold text-office-navy">{homeBets}</span>
                </div>
              )}
              {drawBets > 0 && (
                <div className="flex-1 bg-office-brown/5 rounded px-2 py-1 text-center">
                  <span className="text-[10px] text-office-brown/60">Nul</span>
                  <span className="block text-xs font-bold text-office-brown">{drawBets}</span>
                </div>
              )}
              {awayBets > 0 && (
                <div className="flex-1 bg-office-mustard/5 rounded px-2 py-1 text-center">
                  <span className="text-[10px] text-office-mustard/80">{match.awayTeam.split(' ')[0]}</span>
                  <span className="block text-xs font-bold text-office-mustard">{awayBets}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bouton parier */}
      {match.status === 'upcoming' && onBet && (
        <button
          onClick={() => onBet(match)}
          className="w-full bg-office-mustard text-white py-2.5 font-semibold text-sm hover:bg-office-mustard-light transition-colors border-t border-office-mustard-dark/20"
        >
          Parier sur ce match
        </button>
      )}
    </div>
  );
}
