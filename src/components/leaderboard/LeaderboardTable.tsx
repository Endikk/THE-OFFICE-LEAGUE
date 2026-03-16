import { Trophy, Medal, Award } from 'lucide-react';
import type { LeaderboardEntry } from '../../types';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
  if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
  return <span className="text-sm font-medium text-gray-400 w-5 text-center">{rank}</span>;
}

export default function LeaderboardTable({ entries }: LeaderboardTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-dunder-blue text-white px-6 py-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <BarChart3Icon />
          Classement du Bureau
        </h2>
      </div>
      <div className="divide-y divide-gray-50">
        {entries.map((entry) => (
          <div
            key={entry.userId}
            className={`flex items-center gap-4 px-6 py-4 ${
              entry.rank <= 3 ? 'bg-yellow-50/50' : ''
            }`}
          >
            <div className="w-8 flex justify-center">{getRankIcon(entry.rank)}</div>
            <div className="w-10 h-10 rounded-full bg-dunder-blue/10 flex items-center justify-center text-sm font-bold text-dunder-blue">
              {entry.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-medium">{entry.displayName}</p>
              <p className="text-xs text-gray-400">
                {entry.wonBets}/{entry.totalBets} paris gagnés ({Math.round(entry.winRate)}%)
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-dunder-gold">{entry.officeCoins}</p>
              <p className="text-xs text-gray-400">OfficeCoins</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart3Icon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 20V10M18 20V4M6 20v-4" />
    </svg>
  );
}
