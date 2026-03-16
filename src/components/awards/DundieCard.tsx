import type { DundieAward } from '../../types';

interface DundieCardProps {
  award: DundieAward;
}

export default function DundieCard({ award }: DundieCardProps) {
  return (
    <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl border border-yellow-200 p-5 text-center hover:shadow-md transition-shadow">
      <div className="text-4xl mb-3">{award.icon}</div>
      <h3 className="font-bold text-lg text-dunder-blue">{award.title}</h3>
      <p className="text-sm text-gray-500 mt-1">{award.description}</p>
      <p className="text-xs text-gray-400 mt-3">
        {new Date(award.earnedAt).toLocaleDateString('fr-FR')}
      </p>
    </div>
  );
}
