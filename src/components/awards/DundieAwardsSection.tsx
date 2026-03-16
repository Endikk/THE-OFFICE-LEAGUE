import { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { PERIODIC_DUNDIES } from '../../services/dundie-awards';
import type { DundieAward } from '../../types';

interface DundieAwardsSectionProps {
  awards: DundieAward[];
  awardsBySeason: Record<string, DundieAward[]>;
  currentSeason: string;
}

// ─── Animation wrapper pour les trophées ───
function TrophyCard({ award, index }: { award: DundieAward; index: number }) {
  const dateStr = award.createdAt instanceof Date
    ? award.createdAt.toLocaleDateString('fr-FR')
    : (award.createdAt as { toDate?: () => Date })?.toDate?.()?.toLocaleDateString('fr-FR') || '';

  return (
    <div
      className="group relative overflow-hidden"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 rounded-xl border border-yellow-200/60 p-5 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

        {/* Trophy emoji with bounce */}
        <div className="text-4xl mb-3 group-hover:animate-bounce transition-all">
          {award.emoji}
        </div>

        <h3 className="font-bold text-office-navy text-sm">{award.title}</h3>
        <p className="text-xs text-office-brown/40 mt-1">{award.description}</p>

        {/* Winner */}
        {award.winnerName && (
          <div className="mt-3 inline-flex items-center gap-1.5 bg-office-navy/5 rounded-full px-3 py-1">
            <span className="text-xs font-medium text-office-navy">{award.winnerName}</span>
          </div>
        )}

        {/* Period + date */}
        <div className="flex items-center justify-center gap-2 mt-2">
          {award.period && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
              award.period === 'weekly'
                ? 'bg-blue-50 text-blue-500'
                : 'bg-purple-50 text-purple-500'
            }`}>
              {award.period === 'weekly' ? 'Hebdo' : 'Mensuel'}
            </span>
          )}
          {dateStr && (
            <span className="text-[10px] text-office-brown/30">{dateStr}</span>
          )}
        </div>

        {/* Season badge */}
        {award.season && (
          <span className="inline-block text-[10px] bg-office-mustard/10 text-office-mustard px-2 py-0.5 rounded-full mt-2 font-medium">
            {award.season}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Catalogue des dundies disponibles ───
function DundieCatalog() {
  return (
    <div className="mb-8">
      <h3 className="flex items-center gap-2 text-sm font-bold text-office-navy mb-4">
        <Sparkles className="w-4 h-4 text-office-mustard" />
        Trophees a gagner
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {PERIODIC_DUNDIES.map((dundie) => (
          <div
            key={dundie.dundieType}
            className="bg-white rounded-xl border border-office-paper-dark/40 p-4 text-center hover:border-office-mustard/30 transition-colors"
          >
            <div className="text-3xl mb-2">{dundie.emoji}</div>
            <h4 className="font-bold text-xs text-office-navy">{dundie.title}</h4>
            <p className="text-[10px] text-office-brown/40 mt-1">{dundie.description}</p>
            <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded mt-2 font-medium ${
              dundie.period === 'weekly'
                ? 'bg-blue-50 text-blue-400'
                : 'bg-purple-50 text-purple-400'
            }`}>
              {dundie.period === 'weekly' ? 'Chaque semaine' : 'Chaque mois'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DundieAwardsSection({ awardsBySeason, currentSeason }: DundieAwardsSectionProps) {
  const [expandedSeason, setExpandedSeason] = useState<string | null>(currentSeason);

  const sortedSeasons = Object.keys(awardsBySeason).sort().reverse();
  const currentSeasonAwards = awardsBySeason[currentSeason] || [];

  return (
    <div>
      {/* Catalogue */}
      <DundieCatalog />

      {/* Current season awards */}
      {currentSeasonAwards.length > 0 && (
        <div className="mb-8">
          <h3 className="flex items-center gap-2 text-sm font-bold text-office-navy mb-4">
            🏆 Saison en cours ({currentSeason})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {currentSeasonAwards.map((award, idx) => (
              <TrophyCard key={award.id} award={award} index={idx} />
            ))}
          </div>
        </div>
      )}

      {currentSeasonAwards.length === 0 && (
        <div className="text-center py-12 mb-8">
          <span className="text-5xl block mb-4">🏆</span>
          <p className="text-office-brown/40 font-medium text-sm">
            Aucun Dundie Award attribue cette saison.
          </p>
          <p className="text-xs text-office-brown/30 mt-1">
            Les awards sont attribues automatiquement chaque semaine et chaque mois.
          </p>
        </div>
      )}

      {/* Historical seasons */}
      {sortedSeasons.filter(s => s !== currentSeason).length > 0 && (
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-office-navy mb-4">
            📜 Historique des saisons
          </h3>
          <div className="space-y-2">
            {sortedSeasons
              .filter(s => s !== currentSeason)
              .map((season) => {
                const seasonAwards = awardsBySeason[season];
                const isExpanded = expandedSeason === season;

                return (
                  <div key={season} className="card overflow-hidden">
                    <button
                      onClick={() => setExpandedSeason(isExpanded ? null : season)}
                      className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-office-paper/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">🏆</span>
                        <div className="text-left">
                          <span className="font-medium text-sm text-office-navy">Saison {season}</span>
                          <span className="text-xs text-office-brown/40 ml-2">
                            {seasonAwards.length} award{seasonAwards.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      {isExpanded
                        ? <ChevronUp className="w-4 h-4 text-office-brown/30" />
                        : <ChevronDown className="w-4 h-4 text-office-brown/30" />
                      }
                    </button>

                    {isExpanded && (
                      <div className="px-5 pb-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {seasonAwards.map((award, idx) => (
                            <TrophyCard key={award.id} award={award} index={idx} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
