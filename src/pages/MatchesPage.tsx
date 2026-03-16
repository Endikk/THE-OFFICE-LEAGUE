import { useState } from 'react';
import MatchCard from '../components/matches/MatchCard';
import BetModal from '../components/bets/BetModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useTodayMatches } from '../hooks/useMatches';
import { POPULAR_LEAGUES, type ApiFixture } from '../services/api-football';

const leagues = [
  { id: undefined as number | undefined, label: 'Tous' },
  { id: POPULAR_LEAGUES.LIGUE_1, label: 'Ligue 1' },
  { id: POPULAR_LEAGUES.PREMIER_LEAGUE, label: 'Premier League' },
  { id: POPULAR_LEAGUES.LA_LIGA, label: 'La Liga' },
  { id: POPULAR_LEAGUES.CHAMPIONS_LEAGUE, label: 'Champions League' },
];

export default function MatchesPage() {
  const [selectedLeague, setSelectedLeague] = useState<number | undefined>(undefined);
  const { matches, loading, error } = useTodayMatches(selectedLeague);
  const [betFixture, setBetFixture] = useState<ApiFixture | null>(null);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Matchs du jour</h1>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {leagues.map(({ id, label }) => (
          <button
            key={label}
            onClick={() => setSelectedLeague(id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedLeague === id
                ? 'bg-dunder-blue text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && <LoadingSpinner />}
      {error && (
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
          <p className="text-gray-400 text-sm mt-2">
            Vérifie ta clé API Football dans le fichier .env
          </p>
        </div>
      )}

      {!loading && !error && matches.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">Aucun match aujourd'hui pour cette ligue.</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {matches.map((fixture) => (
          <MatchCard
            key={fixture.fixture.id}
            fixture={fixture}
            onBet={() => setBetFixture(fixture)}
          />
        ))}
      </div>

      {betFixture && (
        <BetModal fixture={betFixture} onClose={() => setBetFixture(null)} />
      )}
    </div>
  );
}
