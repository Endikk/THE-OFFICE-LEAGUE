import { Clock } from 'lucide-react';
import type { Poll } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { votePoll } from '../../services/polls';

interface PollCardProps {
  poll: Poll;
  onVoted?: () => void;
}

export default function PollCard({ poll, onVoted }: PollCardProps) {
  const { userData } = useAuth();
  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes.length, 0);
  const userVotedOption = poll.options.find(opt => opt.votes.includes(userData?.uid || ''));
  const isExpired = new Date(poll.expiresAt) < new Date();

  async function handleVote(optionId: string) {
    if (!userData || isExpired) return;
    await votePoll(poll.id, optionId, userData.uid);
    onVoted?.();
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-start justify-between mb-4">
        <h3 className="font-bold text-lg">{poll.question}</h3>
        {isExpired && (
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3" /> Expiré
          </span>
        )}
      </div>

      <div className="space-y-2">
        {poll.options.map((option) => {
          const percentage = totalVotes > 0 ? Math.round((option.votes.length / totalVotes) * 100) : 0;
          const isSelected = userVotedOption?.id === option.id;

          return (
            <button
              key={option.id}
              onClick={() => handleVote(option.id)}
              disabled={isExpired}
              className={`w-full text-left p-3 rounded-lg border-2 relative overflow-hidden transition-colors ${
                isSelected
                  ? 'border-dunder-blue bg-dunder-blue/5'
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              {(userVotedOption || isExpired) && (
                <div
                  className="absolute inset-y-0 left-0 bg-dunder-blue/10 transition-all"
                  style={{ width: `${percentage}%` }}
                />
              )}
              <div className="relative flex justify-between">
                <span className="font-medium">{option.text}</span>
                {(userVotedOption || isExpired) && (
                  <span className="text-sm text-gray-500">{percentage}%</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 mt-3">{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</p>
    </div>
  );
}
