import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import PollCard from '../components/polls/PollCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getOfficePolls, createPoll } from '../services/polls';
import type { Poll } from '../types';

export default function PollsPage() {
  const { userData } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  async function loadPolls() {
    if (!userData?.officeId) return;
    const data = await getOfficePolls(userData.officeId);
    setPolls(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setLoading(false);
  }

  useEffect(() => {
    loadPolls();
  }, [userData?.officeId]);

  async function handleCreate() {
    if (!userData?.officeId || !question || options.filter(Boolean).length < 2) return;
    await createPoll(userData.officeId, userData.uid, question, options.filter(Boolean));
    setShowCreate(false);
    setQuestion('');
    setOptions(['', '']);
    loadPolls();
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Sondages</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-dunder-blue text-white px-4 py-2 rounded-lg text-sm font-semibold"
        >
          + Nouveau sondage
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
          <input
            type="text"
            placeholder="Question du sondage..."
            value={question}
            onChange={e => setQuestion(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg mb-3 outline-none focus:ring-2 focus:ring-dunder-blue"
          />
          {options.map((opt, i) => (
            <input
              key={i}
              type="text"
              placeholder={`Option ${i + 1}`}
              value={opt}
              onChange={e => {
                const next = [...options];
                next[i] = e.target.value;
                setOptions(next);
              }}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg mb-2 outline-none"
            />
          ))}
          <div className="flex gap-2 mt-2">
            {options.length < 4 && (
              <button
                onClick={() => setOptions([...options, ''])}
                className="text-sm text-dunder-blue hover:underline"
              >
                + Ajouter une option
              </button>
            )}
            <button
              onClick={handleCreate}
              className="ml-auto bg-dunder-gold text-white px-4 py-2 rounded-lg text-sm font-semibold"
            >
              Publier
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {polls.map(poll => (
          <PollCard key={poll.id} poll={poll} onVoted={loadPolls} />
        ))}
        {polls.length === 0 && (
          <p className="text-gray-400 text-center py-12">Aucun sondage. Crée le premier !</p>
        )}
      </div>
    </div>
  );
}
