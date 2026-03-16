import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { RankingEntry } from '../../types';
import { getDynamicTitle } from '../../services/leaderboard';

interface LeaderboardTableProps {
  entries: RankingEntry[];
  currentUserId?: string;
}

// ─── Médaille pour le top 3 ───
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 flex items-center justify-center shadow-lg shadow-yellow-200/50">
        <span className="text-lg">🥇</span>
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-400 flex items-center justify-center shadow-lg shadow-gray-200/50">
        <span className="text-lg">🥈</span>
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-200/50">
        <span className="text-lg">🥉</span>
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-full bg-office-paper flex items-center justify-center">
      <span className="text-sm font-bold text-office-brown/40">{rank}</span>
    </div>
  );
}

// ─── Avatar ───
function Avatar({ entry, size = 'md' }: { entry: RankingEntry; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
  };

  if (entry.photoURL) {
    return (
      <img
        src={entry.photoURL}
        alt={entry.displayName}
        className={`${sizeClasses[size]} rounded-full object-cover border-2 border-white shadow-sm`}
      />
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-office-navy/10 flex items-center justify-center font-bold text-office-navy border-2 border-white shadow-sm`}>
      {entry.displayName.charAt(0).toUpperCase()}
    </div>
  );
}

// ─── Streak indicator ───
function StreakBadge({ streak }: { streak: number }) {
  if (streak === 0) {
    return (
      <span className="flex items-center gap-0.5 text-xs text-office-brown/30">
        <Minus className="w-3 h-3" /> 0
      </span>
    );
  }
  if (streak > 0) {
    return (
      <span className="flex items-center gap-0.5 text-xs text-office-green font-medium">
        <TrendingUp className="w-3 h-3" />
        +{streak}
        {streak >= 5 && ' 🔥'}
        {streak >= 3 && streak < 5 && ' ⚡'}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 text-xs text-office-red font-medium">
      <TrendingDown className="w-3 h-3" />
      {streak}
    </span>
  );
}

// ─── Podium (top 3) ───
function Podium({ entries }: { entries: RankingEntry[] }) {
  const top3 = entries.slice(0, 3);
  if (top3.length < 1) return null;

  // Order for podium display: 2nd, 1st, 3rd
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);
  const heights = ['h-24', 'h-32', 'h-20'];
  const podiumBg = [
    'from-gray-200 to-gray-300',
    'from-yellow-200 to-yellow-400',
    'from-amber-200 to-amber-400',
  ];

  return (
    <div className="flex items-end justify-center gap-3 mb-8 px-4">
      {podiumOrder.map((entry, idx) => {
        const { title, emoji: titleEmoji } = getDynamicTitle(entry, entries);
        const isFirst = idx === 1;

        return (
          <div key={entry.userId} className="flex flex-col items-center">
            {/* Avatar + name */}
            <div className={`mb-2 text-center ${isFirst ? 'scale-110' : ''}`}>
              <div className="relative inline-block">
                <Avatar entry={entry} size={isFirst ? 'lg' : 'md'} />
                {isFirst && (
                  <div className="absolute -top-3 -right-2 text-xl animate-bounce">👑</div>
                )}
              </div>
              <p className={`font-bold text-office-navy mt-1 ${isFirst ? 'text-sm' : 'text-xs'}`}>
                {entry.displayName}
              </p>
              <p className="text-[10px] text-office-brown/40">
                {titleEmoji} {title}
              </p>
            </div>

            {/* Podium block */}
            <div
              className={`${heights[idx]} w-24 rounded-t-xl bg-gradient-to-t ${podiumBg[idx]} flex flex-col items-center justify-start pt-3 shadow-inner`}
            >
              <span className="text-2xl font-black text-white/80">{entry.rank}</span>
              <span className="text-xs font-bold text-white/70 mt-1">
                {entry.points.toLocaleString()}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Table principale ───
export default function LeaderboardTable({ entries, currentUserId }: LeaderboardTableProps) {
  const restEntries = entries.slice(3);

  return (
    <div>
      {/* Podium */}
      {entries.length >= 1 && <Podium entries={entries} />}

      {/* Reste du classement */}
      {restEntries.length > 0 && (
        <div className="card overflow-hidden">
          {/* Table header */}
          <div className="bg-office-navy px-5 py-3 flex items-center text-xs font-medium text-white/60 uppercase tracking-wider">
            <div className="w-12 text-center">#</div>
            <div className="flex-1">Joueur</div>
            <div className="w-20 text-center">W/L</div>
            <div className="w-16 text-center">Streak</div>
            <div className="w-24 text-right">Points</div>
          </div>

          <div className="divide-y divide-office-paper-dark/30">
            {restEntries.map((entry) => {
              const total = entry.wins + entry.losses;
              const winRate = total > 0 ? Math.round((entry.wins / total) * 100) : 0;
              const { title, emoji: titleEmoji } = getDynamicTitle(entry, entries);
              const isCurrentUser = entry.userId === currentUserId;

              return (
                <div
                  key={entry.userId}
                  className={`flex items-center px-5 py-3.5 transition-colors hover:bg-office-paper/30 ${
                    isCurrentUser ? 'bg-office-mustard/5 border-l-4 border-office-mustard' : ''
                  }`}
                >
                  {/* Rank */}
                  <div className="w-12 flex justify-center">
                    <RankBadge rank={entry.rank} />
                  </div>

                  {/* Player info */}
                  <div className="flex-1 flex items-center gap-3 min-w-0">
                    <Avatar entry={entry} size="sm" />
                    <div className="min-w-0">
                      <p className={`font-medium text-sm text-office-navy truncate ${isCurrentUser ? 'font-bold' : ''}`}>
                        {entry.displayName}
                        {isCurrentUser && <span className="text-office-mustard ml-1 text-xs">(toi)</span>}
                      </p>
                      <p className="text-[11px] text-office-brown/40 truncate">
                        {titleEmoji} {title}
                      </p>
                    </div>
                  </div>

                  {/* W/L */}
                  <div className="w-20 text-center">
                    <span className="text-xs font-medium text-office-navy">
                      {entry.wins}<span className="text-office-brown/30">/</span>{entry.losses}
                    </span>
                    <p className="text-[10px] text-office-brown/30">{winRate}%</p>
                  </div>

                  {/* Streak */}
                  <div className="w-16 flex justify-center">
                    <StreakBadge streak={entry.streak} />
                  </div>

                  {/* Points */}
                  <div className="w-24 text-right">
                    <span className="font-bold text-sm text-office-mustard">
                      {entry.points.toLocaleString()}
                    </span>
                    <p className="text-[10px] text-office-brown/30">OfficeCoins</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
