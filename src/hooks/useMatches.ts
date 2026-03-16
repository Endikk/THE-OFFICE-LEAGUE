import { useState, useEffect } from 'react';
import { getTodayMatches, getUpcomingCompetitionMatches, type NormalizedFdMatch } from '../services/football-data';

export function useTodayMatches() {
  const [matches, setMatches] = useState<NormalizedFdMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTodayMatches()
      .then(setMatches)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { matches, loading, error };
}

export function useUpcomingMatches(competitionCode: string) {
  const [matches, setMatches] = useState<NormalizedFdMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getUpcomingCompetitionMatches(competitionCode)
      .then(setMatches)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [competitionCode]);

  return { matches, loading, error };
}
