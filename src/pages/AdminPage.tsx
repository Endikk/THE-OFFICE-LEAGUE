import { useState, useEffect } from 'react';
import {
  Shield, Plus, Play, Square, Pencil, Trash2, Save, X,
  Trophy, Clock, Wifi, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getAllMatches, createMatch, updateMatch, deleteMatch,
  startMatch, finishMatch, updateMatchScore,
} from '../services/matches';
import { calculateOdds } from '../services/odds';
import type { Match, MatchStatus, WorldCupStage } from '../types';

// ─── Equipes Coupe du Monde 2026 ───
const WC_TEAMS = [
  'France', 'Bresil', 'Argentine', 'Angleterre', 'Espagne', 'Allemagne',
  'Portugal', 'Pays-Bas', 'Belgique', 'Italie', 'Croatie', 'Uruguay',
  'Colombie', 'Mexique', 'USA', 'Canada', 'Japon', 'Coree du Sud',
  'Australie', 'Arabie Saoudite', 'Qatar', 'Iran', 'Maroc', 'Senegal',
  'Ghana', 'Cameroun', 'Nigeria', 'Tunisie', 'Egypte', 'Afrique du Sud',
  'Equateur', 'Perou', 'Chili', 'Paraguay', 'Venezuela',
  'Serbie', 'Suisse', 'Danemark', 'Pologne', 'Autriche',
  'Ukraine', 'Turquie', 'Ecosse', 'Pays de Galles', 'Republique Tcheque',
  'Slovaquie', 'Hongrie', 'Roumanie', 'Grece', 'Norvege', 'Suede',
];

const WC_GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
const WC_STAGES: { value: WorldCupStage; label: string }[] = [
  { value: 'group', label: 'Phase de groupes' },
  { value: 'round_of_32', label: '32emes de finale' },
  { value: 'round_of_16', label: '8emes de finale' },
  { value: 'quarter', label: 'Quarts de finale' },
  { value: 'semi', label: 'Demi-finales' },
  { value: 'third_place', label: 'Match 3eme place' },
  { value: 'final', label: 'Finale' },
];

const STATUS_CONFIG: Record<MatchStatus, { label: string; color: string; icon: typeof Trophy }> = {
  upcoming: { label: 'A venir', color: 'bg-office-mustard/10 text-office-mustard', icon: Clock },
  live: { label: 'En direct', color: 'bg-office-red/10 text-office-red', icon: Wifi },
  finished: { label: 'Termine', color: 'bg-office-green/10 text-office-green', icon: Trophy },
};

// ─── Formulaire de creation/edition ───
interface MatchFormData {
  homeTeam: string;
  awayTeam: string;
  startDate: string;
  startTime: string;
  worldCupStage: WorldCupStage;
  worldCupGroup: string;
  matchday: number;
  oddsHome: number;
  oddsDraw: number;
  oddsAway: number;
}

const emptyForm: MatchFormData = {
  homeTeam: '',
  awayTeam: '',
  startDate: '',
  startTime: '21:00',
  worldCupStage: 'group',
  worldCupGroup: 'A',
  matchday: 1,
  oddsHome: 2.0,
  oddsDraw: 3.2,
  oddsAway: 3.5,
};

export default function AdminPage() {
  const { userData } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MatchFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [scoreEditing, setScoreEditing] = useState<string | null>(null);
  const [scoreHome, setScoreHome] = useState(0);
  const [scoreAway, setScoreAway] = useState(0);
  const [expandedStatus, setExpandedStatus] = useState<MatchStatus>('upcoming');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Guard: non-admin
  if (userData?.role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <Shield className="w-16 h-16 text-office-red mx-auto mb-4 opacity-40" />
        <h1 className="text-2xl font-heading font-bold text-office-navy mb-2">Acces refuse</h1>
        <p className="text-office-brown-light/50">Cette page est reservee aux administrateurs.</p>
      </div>
    );
  }

  // Load matches
  useEffect(() => {
    loadMatches();
  }, []);

  async function loadMatches() {
    setLoading(true);
    try {
      const all = await getAllMatches();
      setMatches(all);
    } catch (err) {
      console.error('Erreur chargement matchs:', err);
    } finally {
      setLoading(false);
    }
  }

  // Auto-calculate odds when teams change
  function handleTeamChange(field: 'homeTeam' | 'awayTeam', value: string) {
    const newForm = { ...form, [field]: value };
    if (newForm.homeTeam && newForm.awayTeam) {
      const odds = calculateOdds(newForm.homeTeam, newForm.awayTeam, 'football');
      newForm.oddsHome = odds.home;
      newForm.oddsDraw = odds.draw;
      newForm.oddsAway = odds.away;
    }
    setForm(newForm);
  }

  // Create or edit match
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.homeTeam || !form.awayTeam || !form.startDate) return;

    setSaving(true);
    try {
      const startTime = new Date(`${form.startDate}T${form.startTime}:00`);
      const odds = { home: form.oddsHome, draw: form.oddsDraw, away: form.oddsAway };

      if (editingId) {
        await updateMatch(editingId, {
          homeTeam: form.homeTeam,
          awayTeam: form.awayTeam,
          startTime,
          odds,
          worldCupGroup: form.worldCupStage === 'group' ? form.worldCupGroup : undefined,
          worldCupStage: form.worldCupStage,
          matchday: form.matchday,
        });
      } else {
        await createMatch({
          homeTeam: form.homeTeam,
          awayTeam: form.awayTeam,
          startTime,
          odds,
          worldCupGroup: form.worldCupStage === 'group' ? form.worldCupGroup : undefined,
          worldCupStage: form.worldCupStage,
          matchday: form.matchday,
          createdBy: userData!.uid,
        });
      }

      setForm(emptyForm);
      setShowForm(false);
      setEditingId(null);
      await loadMatches();
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
    } finally {
      setSaving(false);
    }
  }

  // Edit existing match
  function handleEdit(match: Match) {
    const st = match.startTime instanceof Date
      ? match.startTime
      : (match.startTime as { toDate(): Date }).toDate();

    setForm({
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      startDate: st.toISOString().split('T')[0],
      startTime: st.toTimeString().slice(0, 5),
      worldCupStage: match.worldCupStage || 'group',
      worldCupGroup: match.worldCupGroup || 'A',
      matchday: match.matchday || 1,
      oddsHome: match.odds.home,
      oddsDraw: match.odds.draw,
      oddsAway: match.odds.away,
    });
    setEditingId(match.id);
    setShowForm(true);
  }

  // Delete match
  async function handleDelete(matchId: string) {
    try {
      await deleteMatch(matchId);
      setConfirmDelete(null);
      await loadMatches();
    } catch (err) {
      console.error('Erreur suppression:', err);
    }
  }

  // Start match (→ live)
  async function handleStart(matchId: string) {
    await startMatch(matchId);
    await loadMatches();
  }

  // Update score
  async function handleScoreSave(matchId: string) {
    await updateMatchScore(matchId, scoreHome, scoreAway);
    setScoreEditing(null);
    await loadMatches();
  }

  // Finish match
  async function handleFinish(matchId: string) {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;
    await finishMatch(matchId, match.homeScore ?? 0, match.awayScore ?? 0);
    await loadMatches();
  }

  // Group matches by status
  const matchesByStatus: Record<MatchStatus, Match[]> = {
    live: matches.filter(m => m.status === 'live'),
    upcoming: matches.filter(m => m.status === 'upcoming'),
    finished: matches.filter(m => m.status === 'finished'),
  };

  function formatDate(match: Match): string {
    const d = match.startTime instanceof Date
      ? match.startTime
      : (match.startTime as { toDate(): Date }).toDate();
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-office-red/10 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-office-red" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold text-office-navy">Administration</h1>
            <p className="text-xs text-office-brown-light/50">Gestion des matchs Coupe du Monde 2026</p>
          </div>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(emptyForm); }}
          className="flex items-center gap-2 bg-office-mustard text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-office-mustard/90 transition-colors"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Fermer' : 'Nouveau match'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {(['upcoming', 'live', 'finished'] as MatchStatus[]).map(status => {
          const config = STATUS_CONFIG[status];
          const Icon = config.icon;
          return (
            <div key={status} className="card p-4 text-center">
              <Icon className={`w-5 h-5 mx-auto mb-1 ${config.color.split(' ')[1]}`} />
              <p className="text-2xl font-mono font-bold text-office-navy">{matchesByStatus[status].length}</p>
              <p className="text-xs text-office-brown-light/50">{config.label}</p>
            </div>
          );
        })}
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card p-6 mb-6 animate-slide-up">
          <h2 className="font-heading font-bold text-office-navy mb-4">
            {editingId ? 'Modifier le match' : 'Creer un match'}
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Equipe domicile */}
            <div>
              <label className="block text-xs font-medium text-office-brown-light/60 mb-1">Equipe domicile</label>
              <select
                value={form.homeTeam}
                onChange={e => handleTeamChange('homeTeam', e.target.value)}
                className="w-full border border-office-paper-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-office-mustard bg-white"
                required
              >
                <option value="">Selectionner...</option>
                {WC_TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Equipe exterieur */}
            <div>
              <label className="block text-xs font-medium text-office-brown-light/60 mb-1">Equipe exterieur</label>
              <select
                value={form.awayTeam}
                onChange={e => handleTeamChange('awayTeam', e.target.value)}
                className="w-full border border-office-paper-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-office-mustard bg-white"
                required
              >
                <option value="">Selectionner...</option>
                {WC_TEAMS.filter(t => t !== form.homeTeam).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-medium text-office-brown-light/60 mb-1">Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={e => setForm({ ...form, startDate: e.target.value })}
                className="w-full border border-office-paper-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-office-mustard bg-white"
                required
              />
            </div>

            {/* Heure */}
            <div>
              <label className="block text-xs font-medium text-office-brown-light/60 mb-1">Heure</label>
              <input
                type="time"
                value={form.startTime}
                onChange={e => setForm({ ...form, startTime: e.target.value })}
                className="w-full border border-office-paper-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-office-mustard bg-white"
                required
              />
            </div>

            {/* Phase */}
            <div>
              <label className="block text-xs font-medium text-office-brown-light/60 mb-1">Phase</label>
              <select
                value={form.worldCupStage}
                onChange={e => setForm({ ...form, worldCupStage: e.target.value as WorldCupStage })}
                className="w-full border border-office-paper-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-office-mustard bg-white"
              >
                {WC_STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            {/* Groupe (si phase de groupes) */}
            {form.worldCupStage === 'group' && (
              <div>
                <label className="block text-xs font-medium text-office-brown-light/60 mb-1">Groupe</label>
                <select
                  value={form.worldCupGroup}
                  onChange={e => setForm({ ...form, worldCupGroup: e.target.value })}
                  className="w-full border border-office-paper-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-office-mustard bg-white"
                >
                  {WC_GROUPS.map(g => <option key={g} value={g}>Groupe {g}</option>)}
                </select>
              </div>
            )}

            {/* Journee */}
            <div>
              <label className="block text-xs font-medium text-office-brown-light/60 mb-1">Journee</label>
              <input
                type="number"
                min={1}
                max={7}
                value={form.matchday}
                onChange={e => setForm({ ...form, matchday: parseInt(e.target.value) || 1 })}
                className="w-full border border-office-paper-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-office-mustard bg-white"
              />
            </div>
          </div>

          {/* Cotes */}
          <div className="mt-4 p-4 bg-office-paper rounded-lg">
            <p className="text-xs font-medium text-office-brown-light/60 mb-2">
              Cotes (auto-calculees, modifiables)
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-office-brown-light/40 mb-1">{form.homeTeam || 'Dom.'}</label>
                <input
                  type="number"
                  step="0.01"
                  min="1.01"
                  value={form.oddsHome}
                  onChange={e => setForm({ ...form, oddsHome: parseFloat(e.target.value) || 1.5 })}
                  className="w-full border border-office-paper-dark rounded-lg px-3 py-2 text-sm font-mono text-center focus:outline-none focus:border-office-mustard bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-office-brown-light/40 mb-1">Nul</label>
                <input
                  type="number"
                  step="0.01"
                  min="1.01"
                  value={form.oddsDraw}
                  onChange={e => setForm({ ...form, oddsDraw: parseFloat(e.target.value) || 3.0 })}
                  className="w-full border border-office-paper-dark rounded-lg px-3 py-2 text-sm font-mono text-center focus:outline-none focus:border-office-mustard bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-office-brown-light/40 mb-1">{form.awayTeam || 'Ext.'}</label>
                <input
                  type="number"
                  step="0.01"
                  min="1.01"
                  value={form.oddsAway}
                  onChange={e => setForm({ ...form, oddsAway: parseFloat(e.target.value) || 3.5 })}
                  className="w-full border border-office-paper-dark rounded-lg px-3 py-2 text-sm font-mono text-center focus:outline-none focus:border-office-mustard bg-white"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditingId(null); }}
              className="px-4 py-2 text-sm text-office-brown-light/60 hover:text-office-navy transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-office-navy text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-office-navy/90 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Enregistrement...' : editingId ? 'Modifier' : 'Creer le match'}
            </button>
          </div>
        </form>
      )}

      {/* Matches list by status */}
      {loading ? (
        <div className="text-center py-12 text-office-brown-light/40">Chargement...</div>
      ) : (
        <div className="space-y-4">
          {(['live', 'upcoming', 'finished'] as MatchStatus[]).map(status => {
            const list = matchesByStatus[status];
            if (list.length === 0) return null;
            const config = STATUS_CONFIG[status];
            const isExpanded = expandedStatus === status;

            return (
              <div key={status} className="card overflow-hidden">
                <button
                  onClick={() => setExpandedStatus(isExpanded ? status : status)}
                  className="w-full flex items-center justify-between px-5 py-3 hover:bg-office-paper/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.color}`}>
                      {config.label}
                    </span>
                    <span className="text-sm font-mono text-office-brown-light/40">{list.length} match{list.length > 1 ? 's' : ''}</span>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-office-brown-light/40" /> : <ChevronDown className="w-4 h-4 text-office-brown-light/40" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-office-paper-dark/40 divide-y divide-office-paper-dark/40">
                    {list.map(match => (
                      <div key={match.id} className="px-5 py-3">
                        <div className="flex items-center gap-4">
                          {/* Teams */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm text-office-navy truncate">{match.homeTeam}</span>
                              {match.status !== 'upcoming' && (
                                <span className="font-mono font-bold text-sm text-office-navy">
                                  {match.homeScore} - {match.awayScore}
                                </span>
                              )}
                              {match.status === 'upcoming' && (
                                <span className="text-xs text-office-brown-light/40">vs</span>
                              )}
                              <span className="font-medium text-sm text-office-navy truncate">{match.awayTeam}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-office-brown-light/40">{formatDate(match)}</span>
                              {match.worldCupGroup && (
                                <span className="text-[10px] bg-office-paper px-1.5 py-0.5 rounded">Gr. {match.worldCupGroup}</span>
                              )}
                              {match.worldCupStage && match.worldCupStage !== 'group' && (
                                <span className="text-[10px] bg-office-mustard/10 text-office-mustard px-1.5 py-0.5 rounded">
                                  {WC_STAGES.find(s => s.value === match.worldCupStage)?.label}
                                </span>
                              )}
                              <span className="text-[10px] font-mono text-office-brown-light/30">
                                {match.odds.home} / {match.odds.draw} / {match.odds.away}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {/* Score editing for live matches */}
                            {match.status === 'live' && scoreEditing === match.id ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min={0}
                                  value={scoreHome}
                                  onChange={e => setScoreHome(parseInt(e.target.value) || 0)}
                                  className="w-10 border border-office-paper-dark rounded px-1 py-0.5 text-xs font-mono text-center"
                                />
                                <span className="text-xs">-</span>
                                <input
                                  type="number"
                                  min={0}
                                  value={scoreAway}
                                  onChange={e => setScoreAway(parseInt(e.target.value) || 0)}
                                  className="w-10 border border-office-paper-dark rounded px-1 py-0.5 text-xs font-mono text-center"
                                />
                                <button
                                  onClick={() => handleScoreSave(match.id)}
                                  className="p-1 text-office-green hover:bg-office-green/10 rounded"
                                  title="Sauver le score"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setScoreEditing(null)}
                                  className="p-1 text-office-brown-light/40 hover:bg-office-paper rounded"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <>
                                {/* Start match */}
                                {match.status === 'upcoming' && (
                                  <button
                                    onClick={() => handleStart(match.id)}
                                    className="p-1.5 text-office-green hover:bg-office-green/10 rounded-lg transition-colors"
                                    title="Demarrer le match"
                                  >
                                    <Play className="w-4 h-4" />
                                  </button>
                                )}

                                {/* Update score */}
                                {match.status === 'live' && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setScoreEditing(match.id);
                                        setScoreHome(match.homeScore ?? 0);
                                        setScoreAway(match.awayScore ?? 0);
                                      }}
                                      className="p-1.5 text-office-mustard hover:bg-office-mustard/10 rounded-lg transition-colors"
                                      title="Modifier le score"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleFinish(match.id)}
                                      className="p-1.5 text-office-red hover:bg-office-red/10 rounded-lg transition-colors"
                                      title="Terminer le match"
                                    >
                                      <Square className="w-4 h-4" />
                                    </button>
                                  </>
                                )}

                                {/* Edit match info */}
                                {match.status === 'upcoming' && (
                                  <button
                                    onClick={() => handleEdit(match)}
                                    className="p-1.5 text-office-navy hover:bg-office-navy/10 rounded-lg transition-colors"
                                    title="Modifier"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                )}

                                {/* Delete */}
                                {confirmDelete === match.id ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => handleDelete(match.id)}
                                      className="text-[10px] bg-office-red text-white px-2 py-1 rounded"
                                    >
                                      Confirmer
                                    </button>
                                    <button
                                      onClick={() => setConfirmDelete(null)}
                                      className="text-[10px] text-office-brown-light/40 px-2 py-1"
                                    >
                                      Non
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setConfirmDelete(match.id)}
                                    className="p-1.5 text-office-brown-light/30 hover:text-office-red hover:bg-office-red/10 rounded-lg transition-colors"
                                    title="Supprimer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {matches.length === 0 && (
            <div className="text-center py-16">
              <Trophy className="w-12 h-12 text-office-brown-light/20 mx-auto mb-3" />
              <p className="text-office-brown-light/40 font-medium">Aucun match cree</p>
              <p className="text-xs text-office-brown-light/30 mt-1">Clique sur "Nouveau match" pour commencer</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
