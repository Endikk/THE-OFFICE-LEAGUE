import { Calendar, Lock } from 'lucide-react';
import type { Match, Bet, BetPrediction, Sport, User } from '../../types';

interface MatchCardProps {
  match: Match;
  officeBets?: Bet[];
  officeMembers?: Pick<User, 'uid' | 'displayName' | 'photoURL'>[];
  currentUserId?: string;
  onBet?: (match: Match, prediction: BetPrediction) => void;
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
  if (status === 'live') return 'bg-office-red text-white';
  if (status === 'finished') return 'bg-office-brown-light/20 text-office-brown-light/60';
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

// ─── Avatar mini-composant ───
function MemberAvatar({ member }: { member: Pick<User, 'uid' | 'displayName' | 'photoURL'> }) {
  if (member.photoURL) {
    return (
      <img
        src={member.photoURL}
        alt={member.displayName}
        title={member.displayName}
        className="w-6 h-6 rounded-full border-2 border-white object-cover -ml-1.5 first:ml-0"
      />
    );
  }
  return (
    <div
      title={member.displayName}
      className="w-6 h-6 rounded-full border-2 border-white bg-office-navy/10 flex items-center justify-center text-[10px] font-bold text-office-navy -ml-1.5 first:ml-0"
    >
      {member.displayName.charAt(0).toUpperCase()}
    </div>
  );
}

export default function MatchCard({ match, officeBets = [], officeMembers = [], currentUserId, onBet }: MatchCardProps) {
  const startTime = match.startTime instanceof Date
    ? match.startTime
    : (match.startTime as { toDate?: () => Date })?.toDate?.() || new Date();

  // Grouper les paris par prédiction
  const betsByPrediction = (prediction: BetPrediction) =>
    officeBets.filter(b => b.prediction === prediction);

  const homeBets = betsByPrediction('home');
  const drawBets = betsByPrediction('draw');
  const awayBets = betsByPrediction('away');

  // Le user courant a-t-il déjà parié ?
  const userBet = currentUserId ? officeBets.find(b => b.userId === currentUserId) : null;

  // Trouver le membre correspondant à un userId
  const getMember = (userId: string) => officeMembers.find(m => m.uid === userId);

  // Construire les options de pari
  const betOptions: { key: BetPrediction; label: string; shortLabel: string; odds: number; bets: Bet[] }[] = [
    { key: 'home', label: match.homeTeam, shortLabel: '1', odds: match.odds.home, bets: homeBets },
    ...(match.odds.draw > 0 ? [{
      key: 'draw' as BetPrediction,
      label: 'Nul',
      shortLabel: 'N',
      odds: match.odds.draw,
      bets: drawBets,
    }] : []),
    { key: 'away', label: match.awayTeam, shortLabel: '2', odds: match.odds.away, bets: awayBets },
  ];

  return (
    <div className={`overflow-hidden transition-shadow hover:shadow-lg animate-slide-up ${
      match.status === 'live' ? 'card-accent-red ring-1 ring-office-red/20' :
      match.status === 'finished' ? 'card opacity-90' : 'card'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-office-paper/50 border-b border-office-paper-dark/40">
        <div className="flex items-center gap-2">
          <span className="text-sm">{getSportEmoji(match.sport)}</span>
          <span className="text-xs font-medium text-office-navy/70">{match.league}</span>
          {match.isWorldCup && (
            <span className="text-xs bg-office-mustard/20 text-office-mustard px-1.5 py-0.5 rounded font-bold">WC</span>
          )}
        </div>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${getStatusClasses(match.status)}`}>
          {match.status === 'live' && <span className="live-dot mr-1 inline-block" />}
          {getStatusLabel(match.status)}
        </span>
      </div>

      {/* Corps */}
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

        {/* Equipes + Score */}
        <div className="flex items-center gap-3">
          <div className="flex-1 text-center">
            {match.homeLogo && (
              <img src={match.homeLogo} alt="" className="w-8 h-8 mx-auto mb-1.5 object-contain" />
            )}
            <p className="text-sm font-semibold text-office-navy leading-tight">{match.homeTeam}</p>
          </div>

          <div className="text-center px-3 min-w-[70px]">
            {match.status === 'upcoming' ? (
              <span className="text-2xl font-bold text-office-brown/20">VS</span>
            ) : (
              <div className={`text-2xl font-mono font-bold ${match.status === 'live' ? 'text-office-red' : 'text-office-navy'}`}>
                {match.homeScore} - {match.awayScore}
              </div>
            )}
          </div>

          <div className="flex-1 text-center">
            {match.awayLogo && (
              <img src={match.awayLogo} alt="" className="w-8 h-8 mx-auto mb-1.5 object-contain" />
            )}
            <p className="text-sm font-semibold text-office-navy leading-tight">{match.awayTeam}</p>
          </div>
        </div>

        {/* Boutons de pari inline + avatars des collègues */}
        {match.status === 'upcoming' && (
          <div className="mt-4 space-y-1.5">
            {betOptions.map(({ key, label, shortLabel, odds, bets }) => {
              const isUserChoice = userBet?.prediction === key;
              const betMembers = bets
                .map(b => getMember(b.userId))
                .filter((m): m is Pick<User, 'uid' | 'displayName' | 'photoURL'> => !!m);

              return (
                <button
                  key={key}
                  onClick={() => !userBet && onBet?.(match, key)}
                  disabled={!!userBet}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 transition-all text-left ${
                    isUserChoice
                      ? 'border-office-mustard bg-office-mustard/10'
                      : userBet
                      ? 'border-office-paper-dark/40 opacity-60 cursor-default'
                      : 'border-office-paper-dark hover:border-office-navy/20 hover:bg-office-paper/50 cursor-pointer'
                  }`}
                >
                  {/* Cote badge */}
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0 ${
                    isUserChoice
                      ? 'bg-office-mustard text-white'
                      : 'bg-office-paper text-office-navy'
                  }`}>
                    {shortLabel}
                  </span>

                  {/* Label */}
                  <span className="flex-1 text-sm font-medium text-office-navy truncate">
                    {label}
                  </span>

                  {/* Avatars des collègues qui ont parié */}
                  {betMembers.length > 0 && (
                    <div className="flex items-center pl-1">
                      {betMembers.slice(0, 4).map(member => (
                        <MemberAvatar key={member.uid} member={member} />
                      ))}
                      {betMembers.length > 4 && (
                        <span className="text-[10px] text-office-brown/40 ml-1">
                          +{betMembers.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Cote */}
                  <span className={`text-sm font-mono font-bold flex-shrink-0 ${
                    isUserChoice ? 'text-office-mustard' : 'text-office-navy/70'
                  }`}>
                    x{odds.toFixed(2)}
                  </span>
                </button>
              );
            })}

            {/* Indicateur pari déjà placé */}
            {userBet && (
              <div className="flex items-center justify-center gap-1.5 pt-1.5 text-xs text-office-brown/40">
                <Lock className="w-3 h-3" />
                <span>Pari place : {userBet.amount} coins</span>
              </div>
            )}
          </div>
        )}

        {/* Résultat des paris (match terminé) */}
        {match.status === 'finished' && officeBets.length > 0 && (
          <div className="mt-3 pt-3 border-t border-office-paper-dark/40">
            <div className="space-y-1">
              {officeBets.map((bet) => {
                const member = getMember(bet.userId);
                if (!member) return null;
                const isMe = bet.userId === currentUserId;
                return (
                  <div key={bet.id} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs ${
                    bet.status === 'won' ? 'bg-office-green/5' : bet.status === 'lost' ? 'bg-office-red/5' : 'bg-office-paper/50'
                  }`}>
                    <MemberAvatar member={member} />
                    <span className={`font-medium ${isMe ? 'text-office-navy' : 'text-office-brown/60'}`}>
                      {isMe ? 'Toi' : member.displayName.split(' ')[0]}
                    </span>
                    <span className="text-office-brown/40">→ {bet.prediction === 'home' ? match.homeTeam.split(' ')[0] : bet.prediction === 'away' ? match.awayTeam.split(' ')[0] : 'Nul'}</span>
                    <span className="ml-auto font-bold">
                      {bet.status === 'won' ? (
                        <span className="text-office-green">+{bet.gainedPoints}</span>
                      ) : bet.status === 'lost' ? (
                        <span className="text-office-red">-{bet.amount}</span>
                      ) : (
                        <span className="text-office-brown/40">{bet.amount}</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Paris du bureau (match live) */}
        {match.status === 'live' && officeBets.length > 0 && (
          <div className="mt-3 pt-3 border-t border-office-paper-dark/40">
            <div className="flex gap-2">
              {betOptions.map(({ key, shortLabel, bets }) => {
                if (bets.length === 0) return null;
                const betMembers = bets
                  .map(b => getMember(b.userId))
                  .filter((m): m is Pick<User, 'uid' | 'displayName' | 'photoURL'> => !!m);

                return (
                  <div key={key} className="flex-1 bg-office-paper/50 rounded-lg p-2 text-center">
                    <span className="text-[10px] text-office-brown/40 block mb-1">{shortLabel}</span>
                    <div className="flex justify-center">
                      {betMembers.slice(0, 3).map(member => (
                        <MemberAvatar key={member.uid} member={member} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
