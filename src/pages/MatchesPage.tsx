import { useState, useEffect } from 'react';
import MatchCard from '../components/matches/MatchCard';
import BetModal from '../components/bets/BetModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getUpcomingMatches, getLiveMatches } from '../services/matches';
import type { Match } from '../types';

const LEAGUES = ['Tous', 'Ligue 1', 'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Champions League'];

export default function MatchesPage() {
  const [selectedLeague, setSelectedLeague] = useState('Tous');
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [betMatch, setBetMatch] = useState<Match | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const league = selectedLeague === 'Tous' ? undefined : selectedLeague;
      const [upcoming, live] = await Promise.all([
        getUpcomingMatches(league),
        getLiveMatches(),
      ]);
      // Merge live + upcoming, live d'abord
      const liveFiltered = league ? live.filter(m => m.league === league) : live;
      setMatches([...liveFiltered, ...upcoming]);
      setLoading(false);
    }
    load();
  }, [selectedLeague]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Matchs</h1>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {LEAGUES.map((league) => (
          <button
            key={league}
            onClick={() => setSelectedLeague(league)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedLeague === league
                ? 'bg-dunder-blue text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {league}
          </button>
        ))}
      </div>

      {loading && <LoadingSpinner />}

      {!loading && matches.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">Aucun match disponible pour cette ligue.</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            onBet={setBetMatch}
          />
        ))}
      </div>

      {betMatch && (
        <BetModal match={betMatch} onClose={() => setBetMatch(null)} />
      )}
    </div>
  );
}
