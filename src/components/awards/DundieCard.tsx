import type { DundieAward } from '../../types';

interface DundieCardProps {
  award: DundieAward;
}

export default function DundieCard({ award }: DundieCardProps) {
  const dateStr = award.createdAt instanceof Date
    ? award.createdAt.toLocaleDateString('fr-FR')
    : award.createdAt?.toDate?.().toLocaleDateString('fr-FR') || '';

  return (
    <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl border border-yellow-200 p-5 text-center hover:shadow-md transition-shadow">
      <div className="text-4xl mb-3">{award.emoji}</div>
      <h3 className="font-bold text-lg text-dunder-blue">{award.title}</h3>
      <p className="text-sm text-gray-500 mt-1">{award.description}</p>
      {award.season && (
        <span className="inline-block text-xs bg-dunder-blue/10 text-dunder-blue px-2 py-0.5 rounded-full mt-2">
          {award.season}
        </span>
      )}
      {dateStr && <p className="text-xs text-gray-400 mt-2">{dateStr}</p>}
    </div>
  );
}
