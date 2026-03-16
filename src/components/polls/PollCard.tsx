import { useState, useEffect } from 'react';
import { Clock, Users, Check, RotateCcw, Lock } from 'lucide-react';
import type { Poll, User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { votePoll, unvotePoll, getPollResults } from '../../services/polls';

interface PollCardProps {
  poll: Poll;
  officeMembers?: Pick<User, 'uid' | 'displayName' | 'photoURL'>[];
  onVoted?: () => void;
}

// ─── Couleurs pour les barres de progression ───
const BAR_COLORS = [
  'bg-office-navy',
  'bg-office-mustard',
  'bg-office-red',
  'bg-office-green',
  'bg-purple-500',
  'bg-orange-500',
];

const BAR_BG_COLORS = [
  'bg-office-navy/10',
  'bg-office-mustard/10',
  'bg-office-red/10',
  'bg-office-green/10',
  'bg-purple-100',
  'bg-orange-100',
];

// ─── Countdown helper ───
function getTimeRemaining(closesAt: Date): string {
  const diff = closesAt.getTime() - Date.now();
  if (diff <= 0) return 'Ferme';

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}j ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
}

// ─── Mini avatar ───
function MiniAvatar({ member }: { member: Pick<User, 'uid' | 'displayName' | 'photoURL'> }) {
  if (member.photoURL) {
    return (
      <img
        src={member.photoURL}
        alt={member.displayName}
        title={member.displayName}
        className="w-5 h-5 rounded-full border border-white object-cover -ml-1 first:ml-0"
      />
    );
  }
  return (
    <div
      title={member.displayName}
      className="w-5 h-5 rounded-full border border-white bg-office-navy/10 flex items-center justify-center text-[8px] font-bold text-office-navy -ml-1 first:ml-0"
    >
      {member.displayName.charAt(0).toUpperCase()}
    </div>
  );
}

export default function PollCard({ poll, officeMembers = [], onVoted }: PollCardProps) {
  const { userData } = useAuth();
  const [voting, setVoting] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  const results = getPollResults(poll);
  const totalVotes = Object.values(results).reduce((sum, n) => sum + n, 0);
  const userVote = userData ? poll.votes[userData.uid] : undefined;
  const closesAt = poll.closesAt instanceof Date ? poll.closesAt : (poll.closesAt as { toDate?: () => Date })?.toDate?.() || new Date(0);
  const isExpired = closesAt < new Date();
  const showResults = !!userVote || isExpired;

  // Countdown timer
  useEffect(() => {
    if (isExpired) {
      setTimeLeft('Ferme');
      return;
    }
    const update = () => setTimeLeft(getTimeRemaining(closesAt));
    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, [closesAt, isExpired]);

  // Animation des barres au premier affichage
  useEffect(() => {
    if (showResults) {
      const timer = setTimeout(() => setAnimateIn(true), 50);
      return () => clearTimeout(timer);
    }
  }, [showResults]);

  async function handleVote(option: string) {
    if (!userData || isExpired || voting) return;
    setVoting(true);
    try {
      await votePoll(poll.id, userData.uid, option);
      onVoted?.();
    } catch {
      // ignore
    } finally {
      setVoting(false);
    }
  }

  async function handleUnvote() {
    if (!userData || isExpired || voting) return;
    setVoting(true);
    try {
      await unvotePoll(poll.id, userData.uid);
      setAnimateIn(false);
      onVoted?.();
    } catch {
      // ignore
    } finally {
      setVoting(false);
    }
  }

  // Trouver l'option gagnante
  const maxVotes = Math.max(...Object.values(results));
  const winnerOption = isExpired && maxVotes > 0
    ? Object.entries(results).find(([_, count]) => count === maxVotes)?.[0]
    : null;

  // Membres qui ont voté pour une option
  const getVotersForOption = (option: string) =>
    Object.entries(poll.votes)
      .filter(([_, choice]) => choice === option)
      .map(([userId]) => officeMembers.find(m => m.uid === userId))
      .filter((m): m is Pick<User, 'uid' | 'displayName' | 'photoURL'> => !!m);

  const categoryEmoji = poll.emoji || '📊';

  return (
    <div className={`card overflow-hidden ${isExpired ? 'opacity-90' : ''}`}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-office-paper-dark/40">
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">{categoryEmoji}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-office-navy text-lg leading-snug">{poll.question}</h3>
            <div className="flex items-center gap-3 mt-1.5">
              {/* Votes count */}
              <span className="flex items-center gap-1 text-xs text-office-brown/40">
                <Users className="w-3.5 h-3.5" />
                {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
              </span>
              {/* Time remaining */}
              <span className={`flex items-center gap-1 text-xs ${
                isExpired ? 'text-office-brown/30' : 'text-office-mustard'
              }`}>
                {isExpired ? <Lock className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                {timeLeft}
              </span>
              {/* Category */}
              {poll.category && (
                <span className="text-[10px] bg-office-paper text-office-brown/40 px-1.5 py-0.5 rounded font-medium">
                  {poll.category === 'sport' ? 'Sportif' : poll.category === 'team_building' ? 'Team Building' : 'Fun'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="px-5 py-4 space-y-2.5">
        {poll.options.map((option, idx) => {
          const count = results[option] || 0;
          const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const isSelected = userVote === option;
          const isWinner = winnerOption === option;
          const voters = getVotersForOption(option);
          const barColor = BAR_COLORS[idx % BAR_COLORS.length];
          const barBg = BAR_BG_COLORS[idx % BAR_BG_COLORS.length];

          if (showResults) {
            // ─── Mode résultats ───
            return (
              <div key={option} className={`rounded-xl overflow-hidden ${isWinner && isExpired ? 'ring-2 ring-office-mustard/30' : ''}`}>
                <div className={`relative p-3 ${barBg}`}>
                  {/* Barre de progression animée */}
                  <div
                    className={`absolute inset-y-0 left-0 ${barColor} opacity-15 rounded-xl transition-all duration-700 ease-out`}
                    style={{ width: animateIn ? `${percentage}%` : '0%' }}
                  />

                  <div className="relative flex items-center gap-3">
                    {/* Selected check */}
                    {isSelected && (
                      <div className="w-5 h-5 bg-office-green rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}

                    {/* Winner badge */}
                    {isWinner && isExpired && !isSelected && (
                      <span className="text-sm flex-shrink-0">🏆</span>
                    )}

                    {/* Option label */}
                    <span className={`font-medium text-sm flex-1 ${isSelected ? 'text-office-navy' : 'text-office-brown/70'}`}>
                      {option}
                    </span>

                    {/* Voters avatars */}
                    {voters.length > 0 && (
                      <div className="flex items-center">
                        {voters.slice(0, 4).map(member => (
                          <MiniAvatar key={member.uid} member={member} />
                        ))}
                        {voters.length > 4 && (
                          <span className="text-[10px] text-office-brown/40 ml-1">+{voters.length - 4}</span>
                        )}
                      </div>
                    )}

                    {/* Count + percentage */}
                    <div className="text-right flex-shrink-0">
                      <span className={`text-sm font-bold transition-all duration-500 ${
                        animateIn ? 'opacity-100' : 'opacity-0'
                      } ${isWinner && isExpired ? 'text-office-mustard' : 'text-office-navy'}`}>
                        {percentage}%
                      </span>
                      <span className="text-[10px] text-office-brown/30 ml-1">({count})</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          // ─── Mode vote ───
          return (
            <button
              key={option}
              onClick={() => handleVote(option)}
              disabled={voting}
              className={`w-full text-left p-3.5 rounded-xl border-2 transition-all hover:shadow-sm ${
                voting
                  ? 'border-office-paper-dark opacity-50 cursor-wait'
                  : 'border-office-paper-dark hover:border-office-navy/20 hover:bg-office-paper/30 active:scale-[0.98]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full border-2 border-office-paper-dark flex items-center justify-center flex-shrink-0`}>
                  <span className="text-xs font-bold text-office-brown/40">{String.fromCharCode(65 + idx)}</span>
                </div>
                <span className="font-medium text-sm text-office-navy flex-1">{option}</span>
                {voters.length > 0 && (
                  <div className="flex items-center">
                    {voters.slice(0, 3).map(member => (
                      <MiniAvatar key={member.uid} member={member} />
                    ))}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer: changer de vote */}
      {userVote && !isExpired && (
        <div className="px-5 pb-4">
          <button
            onClick={handleUnvote}
            disabled={voting}
            className="flex items-center gap-1.5 text-xs text-office-brown/40 hover:text-office-red transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Changer mon vote
          </button>
        </div>
      )}
    </div>
  );
}
