import { useState, useEffect } from 'react';
import { getTodayFixtures, getUpcomingFixtures, type ApiFixture } from '../services/api-football';

export function useTodayMatches(leagueId?: number) {
  const [matches, setMatches] = useState<ApiFixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTodayFixtures(leagueId)
      .then(setMatches)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [leagueId]);

  return { matches, loading, error };
}

export function useUpcomingMatches(leagueId: number, count: number = 10) {
  const [matches, setMatches] = useState<ApiFixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getUpcomingFixtures(leagueId, count)
      .then(setMatches)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [leagueId, count]);

  return { matches, loading, error };
}
