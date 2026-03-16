import { useState } from 'react';
import { X, Plus, Trash2, Clock, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { createPoll, POLL_TEMPLATES, type PollTemplate } from '../../services/polls';
import type { PollCategory } from '../../types';

interface CreatePollModalProps {
  onClose: () => void;
  onCreated: () => void;
}

const CATEGORIES: { key: PollCategory; emoji: string; label: string }[] = [
  { key: 'sport', emoji: '🏆', label: 'Sportif' },
  { key: 'team_building', emoji: '🤝', label: 'Team Building' },
  { key: 'fun', emoji: '🎉', label: 'Fun' },
];

const DURATION_OPTIONS = [
  { hours: 1, label: '1 heure' },
  { hours: 24, label: '24 heures' },
  { hours: 48, label: '2 jours' },
  { hours: 72, label: '3 jours' },
  { hours: 168, label: '1 semaine' },
];

export default function CreatePollModal({ onClose, onCreated }: CreatePollModalProps) {
  const { userData } = useAuth();
  const [mode, setMode] = useState<'templates' | 'custom'>('templates');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [category, setCategory] = useState<PollCategory>('sport');
  const [emoji, setEmoji] = useState('🏆');
  const [duration, setDuration] = useState(24);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!userData?.officeId) return null;

  function applyTemplate(template: PollTemplate) {
    setQuestion(template.question);
    setOptions(template.options.length > 0 ? template.options : ['', '']);
    setCategory(template.category);
    setEmoji(template.emoji);
    setDuration(template.closesInHours);
    setMode('custom');
  }

  function addOption() {
    if (options.length >= 6) return;
    setOptions([...options, '']);
  }

  function removeOption(index: number) {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  }

  function updateOption(index: number, value: string) {
    const next = [...options];
    next[index] = value;
    setOptions(next);
  }

  async function handleSubmit() {
    const cleanOptions = options.map(o => o.trim()).filter(Boolean);
    if (!question.trim()) {
      setError('La question est obligatoire');
      return;
    }
    if (cleanOptions.length < 2) {
      setError('Il faut au moins 2 options');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await createPoll({
        officeId: userData!.officeId!,
        createdBy: userData!.uid,
        question: question.trim(),
        options: cleanOptions,
        category,
        emoji,
        closesInHours: duration,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la creation');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full relative overflow-hidden max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-office-navy px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <h3 className="text-white font-bold">Creer un sondage</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Mode selector */}
          <div className="flex gap-1 mb-6 bg-office-paper rounded-xl p-1">
            <button
              onClick={() => setMode('templates')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'templates' ? 'bg-white text-office-navy shadow-sm' : 'text-office-brown/40'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Templates
            </button>
            <button
              onClick={() => setMode('custom')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'custom' ? 'bg-white text-office-navy shadow-sm' : 'text-office-brown/40'
              }`}
            >
              <Plus className="w-4 h-4" />
              Personnalise
            </button>
          </div>

          {/* Templates */}
          {mode === 'templates' && (
            <div className="space-y-2">
              {POLL_TEMPLATES.map((template, idx) => (
                <button
                  key={idx}
                  onClick={() => applyTemplate(template)}
                  className="w-full card p-4 text-left hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{template.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-office-navy group-hover:text-office-mustard transition-colors">
                        {template.question}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-office-brown/40">
                          {template.options.length > 0 ? `${template.options.length} options` : 'A personnaliser'}
                        </span>
                        <span className="text-[11px] text-office-brown/30">|</span>
                        <span className="text-[11px] text-office-brown/40">
                          {CATEGORIES.find(c => c.key === template.category)?.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Custom form */}
          {mode === 'custom' && (
            <div className="space-y-5">
              {error && <div className="error-box text-sm">{error}</div>}

              {/* Catégorie */}
              <div>
                <label className="text-xs font-medium text-office-brown/50 uppercase tracking-wide mb-2 block">Categorie</label>
                <div className="flex gap-2">
                  {CATEGORIES.map(({ key, emoji: catEmoji, label }) => (
                    <button
                      key={key}
                      onClick={() => { setCategory(key); setEmoji(catEmoji); }}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all border-2 ${
                        category === key
                          ? 'border-office-mustard bg-office-mustard/5 text-office-navy'
                          : 'border-office-paper-dark text-office-brown/50 hover:border-office-navy/20'
                      }`}
                    >
                      <span>{catEmoji}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question */}
              <div>
                <label className="text-xs font-medium text-office-brown/50 uppercase tracking-wide mb-2 block">Question</label>
                <input
                  type="text"
                  placeholder="Ex: Qui va gagner la Champions League ?"
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  className="input-field"
                  maxLength={200}
                />
              </div>

              {/* Options */}
              <div>
                <label className="text-xs font-medium text-office-brown/50 uppercase tracking-wide mb-2 block">
                  Options ({options.length}/6)
                </label>
                <div className="space-y-2">
                  {options.map((opt, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        placeholder={`Option ${i + 1}`}
                        value={opt}
                        onChange={e => updateOption(i, e.target.value)}
                        className="input-field"
                        maxLength={80}
                      />
                      {options.length > 2 && (
                        <button
                          onClick={() => removeOption(i)}
                          className="text-office-brown/30 hover:text-office-red transition-colors p-2 flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {options.length < 6 && (
                  <button
                    onClick={addOption}
                    className="flex items-center gap-1.5 text-sm text-office-mustard hover:text-office-mustard-dark font-medium mt-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter une option
                  </button>
                )}
              </div>

              {/* Durée */}
              <div>
                <label className="text-xs font-medium text-office-brown/50 uppercase tracking-wide mb-2 block">
                  <Clock className="w-3.5 h-3.5 inline -mt-0.5 mr-1" />
                  Duree du sondage
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DURATION_OPTIONS.map(({ hours, label }) => (
                    <button
                      key={hours}
                      onClick={() => setDuration(hours)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        duration === hours
                          ? 'bg-office-navy text-white'
                          : 'bg-office-paper text-office-navy hover:bg-office-paper-dark'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={loading || !question.trim() || options.filter(o => o.trim()).length < 2}
                className="btn-mustard w-full"
              >
                {loading ? 'Creation...' : 'Publier le sondage'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
