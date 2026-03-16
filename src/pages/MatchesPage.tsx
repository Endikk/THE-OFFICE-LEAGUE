import { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, Wifi, WifiOff, Trophy, Clock, CheckCircle } from 'lucide-react';
import MatchCard from '../components/matches/MatchCard';
import BetModal from '../components/bets/BetModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { getUpcomingMatches, getLiveMatches, getFinishedMatches } from '../services/matches';
import { getMatchBets } from '../services/bets';
import { fetchTodayMatches, getApiFootballUsage } from '../services/sports-api';
import { checkAndResolveFinished, detectNewlyFinished } from '../services/match-resolver';
import type { Match, Bet, Sport } from '../types';

// ─── Config des sports ───
const SPORTS: { key: Sport | 'all'; emoji: string; label: string }[] = [
  { key: 'all', emoji: '🔥', label: 'Tous' },
  { key: 'football', emoji: '⚽', label: 'Football' },
  { key: 'basketball', emoji: '🏀', label: 'NBA' },
  { key: 'nfl', emoji: '🏈', label: 'NFL' },
  { key: 'rugby', emoji: '🏉', label: 'Rugby' },
];

type TabKey = 'live' | 'upcoming' | 'finished';

const TABS: { key: TabKey; label: string; icon: typeof Trophy }[] = [
  { key: 'live', label: 'En direct', icon: Wifi },
  { key: 'upcoming', label: 'A venir', icon: Clock },
  { key: 'finished', label: 'Termines', icon: CheckCircle },
];

const REFRESH_INTERVAL = 60_000; // 60 secondes

export default function MatchesPage() {
  const { userData } = useAuth();
  const [selectedSport, setSelectedSport] = useState<Sport | 'all'>('all');
  const [activeTab, setActiveTab] = useState<TabKey>('upcoming');
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [betMatch, setBetMatch] = useState<Match | null>(null);
  const [officeBets, setOfficeBets] = useState<Record<string, Bet[]>>({});
  const [apiUsage, setApiUsage] = useState({ count: 0, remaining: 100 });
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [liveCount, setLiveCount] = useState(0);
  const previousMatchesRef = useRef<Match[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Charger les matchs ───
  const loadMatches = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    else setRefreshing(true);

    try {
      const sport = selectedSport === 'all' ? undefined : selectedSport;

      // D'abord fetch depuis les APIs externes (cache intelligent)
      try {
        await fetchTodayMatches(sport);
      } catch {
        // Les APIs externes ont échoué, on continue avec Firestore
      }

      // Ensuite lire depuis Firestore
      let result: Match[] = [];
      if (activeTab === 'live') {
        result = await getLiveMatches();
        if (sport) result = result.filter(m => m.sport === sport);
      } else if (activeTab === 'upcoming') {
        result = await getUpcomingMatches();
        if (sport) result = result.filter(m => m.sport === sport);
      } else {
        result = await getFinishedMatches(undefined, 30);
        if (sport) result = result.filter(m => m.sport === sport);
      }

      // Détecter les matchs nouvellement terminés → résoudre les paris
      const newlyFinished = detectNewlyFinished(previousMatchesRef.current, result);
      if (newlyFinished.length > 0) {
        checkAndResolveFinished(newlyFinished).catch(() => {});
      }
      previousMatchesRef.current = result;

      setMatches(result);

      // Compter les lives (pour le badge)
      const allLive = await getLiveMatches();
      setLiveCount(allLive.length);

      // Charger les paris du bureau
      if (userData?.officeId) {
        const betsMap: Record<string, Bet[]> = {};
        await Promise.allSettled(
          result.slice(0, 20).map(async (m) => {
            const bets = await getMatchBets(m.id, userData.officeId!);
            if (bets.length > 0) betsMap[m.id] = bets;
          })
        );
        setOfficeBets(betsMap);
      }

      // API usage
      const usage = await getApiFootballUsage();
      setApiUsage(usage);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Erreur chargement matchs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedSport, activeTab, userData?.officeId]);

  // ─── Chargement initial + changement de filtre ───
  useEffect(() => {
    loadMatches(true);
  }, [loadMatches]);

  // ─── Auto-refresh pour les matchs live ───
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (activeTab === 'live' || liveCount > 0) {
      intervalRef.current = setInterval(() => {
        loadMatches(false);
      }, REFRESH_INTERVAL);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeTab, liveCount, loadMatches]);

  const handleRefresh = () => loadMatches(false);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-office-navy">Matchs</h1>
          <p className="text-sm text-office-brown/40 mt-1">
            {lastRefresh && (
              <span>Mis a jour a {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* API usage indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-office-brown/40">
            <div className={`w-2 h-2 rounded-full ${apiUsage.remaining > 20 ? 'bg-office-green' : apiUsage.remaining > 5 ? 'bg-office-mustard' : 'bg-office-red'}`} />
            API: {apiUsage.remaining}/100
          </div>
          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-sm text-office-navy bg-office-paper hover:bg-office-paper-dark px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Rafraichir
          </button>
        </div>
      </div>

      {/* Sport filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
        {SPORTS.map(({ key, emoji, label }) => (
          <button
            key={key}
            onClick={() => setSelectedSport(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              selectedSport === key
                ? 'bg-office-navy text-white shadow-sm'
                : 'bg-white text-office-brown/60 hover:bg-office-paper-dark border border-office-paper-dark/60'
            }`}
          >
            <span>{emoji}</span>
            {label}
          </button>
        ))}
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 mb-6 bg-office-paper rounded-xl p-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === key
                ? 'bg-white text-office-navy shadow-sm'
                : 'text-office-brown/40 hover:text-office-brown/60'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {key === 'live' && liveCount > 0 && (
              <span className="bg-office-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center animate-pulse">
                {liveCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner text="Chargement des matchs..." />
      ) : matches.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-office-paper rounded-2xl flex items-center justify-center mx-auto mb-4">
            {activeTab === 'live' ? (
              <WifiOff className="w-7 h-7 text-office-brown/30" />
            ) : (
              <Trophy className="w-7 h-7 text-office-brown/30" />
            )}
          </div>
          <p className="text-office-brown/40 font-medium">
            {activeTab === 'live'
              ? 'Aucun match en direct pour le moment'
              : activeTab === 'upcoming'
              ? 'Aucun match a venir'
              : 'Aucun match termine'}
          </p>
          <p className="text-xs text-office-brown/30 mt-1">
            {activeTab === 'live'
              ? 'Les scores se mettent a jour toutes les 60 secondes'
              : 'Revenez plus tard ou changez de sport'}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {matches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              officeBets={officeBets[match.id]}
              onBet={match.status === 'upcoming' ? setBetMatch : undefined}
            />
          ))}
        </div>
      )}

      {/* Live indicator */}
      {activeTab === 'live' && liveCount > 0 && (
        <div className="fixed bottom-6 right-6 bg-office-navy text-white px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 text-sm">
          <Wifi className="w-4 h-4 text-office-green animate-pulse" />
          Mise a jour auto toutes les 60s
        </div>
      )}

      {/* Bet modal */}
      {betMatch && (
        <BetModal match={betMatch} onClose={() => setBetMatch(null)} />
      )}
    </div>
  );
}
