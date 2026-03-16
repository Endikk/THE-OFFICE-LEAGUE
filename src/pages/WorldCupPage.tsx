import { useState, useEffect } from 'react';
import { Globe, Trophy, Users, BarChart3, Calendar } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import MatchCard from '../components/matches/MatchCard';
import BetModal from '../components/bets/BetModal';
import GroupStage from '../components/worldcup/GroupStage';
import Bracket from '../components/worldcup/Bracket';
import { getWorldCupMatches } from '../services/matches';
import { fetchWorldCupMatches } from '../services/sports-api';
import { getWorldCupStandings, WORLD_CUP_2026, isWorldCupActive, isWorldCupSoon } from '../services/balldontlie';
import type { Match, WorldCupGroupTeam } from '../types';

type WCTab = 'matches' | 'groups' | 'bracket';

export default function WorldCupPage() {
  const [activeTab, setActiveTab] = useState<WCTab>('matches');
  const [matches, setMatches] = useState<Match[]>([]);
  const [groups, setGroups] = useState<{ name: string; teams: WorldCupGroupTeam[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [betMatch, setBetMatch] = useState<Match | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Fetch depuis les APIs
        await fetchWorldCupMatches().catch(() => {});

        // Charger depuis Firestore
        const [wcMatches, wcGroups] = await Promise.all([
          getWorldCupMatches(),
          getWorldCupStandings(),
        ]);

        setMatches(wcMatches);
        setGroups(wcGroups);
      } catch (err) {
        console.error('Erreur World Cup:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const wcActive = isWorldCupActive();
  const wcSoon = isWorldCupSoon();

  // Stats
  const liveMatches = matches.filter(m => m.status === 'live');
  const upcomingMatches = matches.filter(m => m.status === 'upcoming');
  const finishedMatches = matches.filter(m => m.status === 'finished');
  const knockoutMatches = matches.filter(m => m.worldCupStage && m.worldCupStage !== 'group');

  // Countdown
  const daysUntil = Math.max(0, Math.ceil((WORLD_CUP_2026.startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  const tabs: { key: WCTab; label: string; icon: typeof Trophy }[] = [
    { key: 'matches', label: 'Matchs', icon: Calendar },
    { key: 'groups', label: 'Groupes', icon: Users },
    { key: 'bracket', label: 'Bracket', icon: BarChart3 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="card overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-office-navy via-office-navy-light to-office-navy p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Globe className="w-8 h-8 text-office-mustard" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  Coupe du Monde 2026
                </h1>
                {wcActive && (
                  <span className="bg-office-red text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                    LIVE
                  </span>
                )}
              </div>
              <p className="text-white/60 text-sm">
                {WORLD_CUP_2026.hostCountries.join(' / ')} - {WORLD_CUP_2026.totalTeams} equipes
              </p>
              <p className="text-white/40 text-xs mt-1">
                11 juin - 19 juillet 2026
              </p>
            </div>

            {/* Countdown ou stats live */}
            <div className="text-center sm:text-right">
              {!wcActive && !wcSoon ? (
                <div>
                  <p className="text-3xl font-bold text-office-mustard">{daysUntil}</p>
                  <p className="text-xs text-white/40">jours avant le coup d'envoi</p>
                </div>
              ) : wcActive ? (
                <div className="flex gap-4">
                  <div>
                    <p className="text-2xl font-bold text-office-red">{liveMatches.length}</p>
                    <p className="text-[10px] text-white/40">En direct</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{finishedMatches.length}</p>
                    <p className="text-[10px] text-white/40">Joues</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-office-mustard">{upcomingMatches.length}</p>
                    <p className="text-[10px] text-white/40">A venir</p>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-bold text-office-mustard">Bientot !</p>
                  <p className="text-xs text-white/40">J-{daysUntil}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-office-paper rounded-xl p-1">
        {tabs.map(({ key, label, icon: Icon }) => (
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
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner text="Chargement Coupe du Monde..." />
      ) : (
        <>
          {/* Matchs tab */}
          {activeTab === 'matches' && (
            <div>
              {/* Live matches first */}
              {liveMatches.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-lg font-bold text-office-red flex items-center gap-2 mb-4">
                    <span className="w-2 h-2 bg-office-red rounded-full animate-pulse" />
                    En direct
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {liveMatches.map(m => (
                      <MatchCard key={m.id} match={m} />
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming */}
              {upcomingMatches.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-lg font-bold text-office-navy flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5 text-office-mustard" />
                    Prochains matchs
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {upcomingMatches.slice(0, 12).map(m => (
                      <MatchCard key={m.id} match={m} onBet={setBetMatch} />
                    ))}
                  </div>
                </div>
              )}

              {/* Finished */}
              {finishedMatches.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-office-brown/60 flex items-center gap-2 mb-4">
                    <Trophy className="w-5 h-5" />
                    Resultats
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {finishedMatches.slice(0, 12).map(m => (
                      <MatchCard key={m.id} match={m} />
                    ))}
                  </div>
                </div>
              )}

              {matches.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-4xl mb-3">🏟️</p>
                  <p className="text-office-brown/40 font-medium">Les matchs seront disponibles prochainement</p>
                  <p className="text-xs text-office-brown/30 mt-1">
                    La Coupe du Monde commence le 11 juin 2026
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Groups tab */}
          {activeTab === 'groups' && <GroupStage groups={groups} />}

          {/* Bracket tab */}
          {activeTab === 'bracket' && <Bracket matches={knockoutMatches} onBet={setBetMatch} />}
        </>
      )}

      {/* Bet modal */}
      {betMatch && (
        <BetModal match={betMatch} onClose={() => setBetMatch(null)} />
      )}
    </div>
  );
}
