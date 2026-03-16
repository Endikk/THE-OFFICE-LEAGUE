import type { Match, WorldCupStage } from '../../types';

interface BracketProps {
  matches: Match[];
  onBet?: (match: Match) => void;
}

const STAGE_ORDER: WorldCupStage[] = ['round_of_32', 'round_of_16', 'quarter', 'semi', 'third_place', 'final'];

const STAGE_LABELS: Record<WorldCupStage, string> = {
  group: 'Phase de groupes',
  round_of_32: '32es de finale',
  round_of_16: '8es de finale',
  quarter: 'Quarts de finale',
  semi: 'Demi-finales',
  third_place: 'Petite finale',
  final: 'FINALE',
};

function getStatusDot(status: Match['status']): string {
  if (status === 'live') return 'bg-office-red animate-pulse';
  if (status === 'finished') return 'bg-office-green';
  return 'bg-office-brown/20';
}

export default function Bracket({ matches, onBet }: BracketProps) {
  // Grouper les matchs par stage
  const matchesByStage = STAGE_ORDER.reduce<Record<string, Match[]>>((acc, stage) => {
    acc[stage] = matches.filter(m => m.worldCupStage === stage);
    return acc;
  }, {});

  const hasKnockout = STAGE_ORDER.some(stage => matchesByStage[stage]?.length > 0);

  if (!hasKnockout) {
    return (
      <div className="text-center py-12">
        <p className="text-2xl mb-2">🏟️</p>
        <p className="text-office-brown/40 font-medium">Les phases finales n'ont pas encore commence</p>
        <p className="text-xs text-office-brown/30 mt-1">La phase a elimination commence apres la phase de groupes</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {STAGE_ORDER.map((stage) => {
        const stageMatches = matchesByStage[stage];
        if (!stageMatches || stageMatches.length === 0) return null;

        const isFinal = stage === 'final';

        return (
          <div key={stage}>
            <h3 className={`font-bold mb-3 flex items-center gap-2 ${
              isFinal ? 'text-xl text-office-mustard' : 'text-sm text-office-navy'
            }`}>
              {isFinal && <span>🏆</span>}
              {STAGE_LABELS[stage]}
              <span className="text-xs font-normal text-office-brown/40">
                ({stageMatches.length} match{stageMatches.length > 1 ? 's' : ''})
              </span>
            </h3>

            <div className={`grid gap-3 ${
              isFinal ? 'max-w-md mx-auto' : 'md:grid-cols-2 lg:grid-cols-4'
            }`}>
              {stageMatches.map((match) => {
                const startTime = match.startTime instanceof Date
                  ? match.startTime
                  : (match.startTime as { toDate?: () => Date })?.toDate?.() || new Date();

                return (
                  <div
                    key={match.id}
                    className={`card p-3 ${isFinal ? 'ring-2 ring-office-mustard/30 bg-office-mustard/5' : ''}`}
                  >
                    {/* Statut */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-office-brown/40">
                        {startTime.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className={`w-2 h-2 rounded-full ${getStatusDot(match.status)}`} />
                    </div>

                    {/* Match */}
                    <div className="space-y-1.5">
                      {/* Home */}
                      <div className={`flex items-center justify-between p-2 rounded-lg ${
                        match.status === 'finished' && match.homeScore !== null && match.awayScore !== null && match.homeScore > match.awayScore
                          ? 'bg-office-green/10' : 'bg-office-paper/50'
                      }`}>
                        <div className="flex items-center gap-2">
                          {match.homeLogo && <img src={match.homeLogo} alt="" className="w-5 h-4 object-cover" />}
                          <span className="text-sm font-medium text-office-navy">{match.homeTeam}</span>
                        </div>
                        <span className={`text-sm font-bold ${match.status === 'live' ? 'text-office-red' : 'text-office-navy'}`}>
                          {match.homeScore ?? '-'}
                        </span>
                      </div>

                      {/* Away */}
                      <div className={`flex items-center justify-between p-2 rounded-lg ${
                        match.status === 'finished' && match.homeScore !== null && match.awayScore !== null && match.awayScore > match.homeScore
                          ? 'bg-office-green/10' : 'bg-office-paper/50'
                      }`}>
                        <div className="flex items-center gap-2">
                          {match.awayLogo && <img src={match.awayLogo} alt="" className="w-5 h-4 object-cover" />}
                          <span className="text-sm font-medium text-office-navy">{match.awayTeam}</span>
                        </div>
                        <span className={`text-sm font-bold ${match.status === 'live' ? 'text-office-red' : 'text-office-navy'}`}>
                          {match.awayScore ?? '-'}
                        </span>
                      </div>
                    </div>

                    {/* Parier */}
                    {match.status === 'upcoming' && onBet && (
                      <button
                        onClick={() => onBet(match)}
                        className="w-full mt-2 text-xs font-medium text-office-mustard hover:text-office-mustard-dark transition-colors py-1"
                      >
                        Parier →
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
