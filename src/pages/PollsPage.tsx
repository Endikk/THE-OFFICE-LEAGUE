import { useEffect, useState } from 'react';
import { Plus, BarChart3, Archive } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PollCard from '../components/polls/PollCard';
import CreatePollModal from '../components/polls/CreatePollModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { subscribeToPollsRealtime } from '../services/polls';
import { getOfficeMembers } from '../services/office';
import type { Poll, User } from '../types';

type Tab = 'active' | 'closed';

export default function PollsPage() {
  const { userData } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [tab, setTab] = useState<Tab>('active');
  const [officeMembers, setOfficeMembers] = useState<Pick<User, 'uid' | 'displayName' | 'photoURL'>[]>([]);

  // Real-time polls listener
  useEffect(() => {
    if (!userData?.officeId) return;

    const unsubscribe = subscribeToPollsRealtime(userData.officeId, (updatedPolls) => {
      setPolls(updatedPolls);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData?.officeId]);

  // Load office members for avatars
  useEffect(() => {
    if (!userData?.officeId) return;
    getOfficeMembers(userData.officeId).then(members => {
      setOfficeMembers(members.map(m => ({ uid: m.uid, displayName: m.displayName, photoURL: m.photoURL })));
    });
  }, [userData?.officeId]);

  const now = new Date();
  const activePolls = polls.filter(p => {
    const closesAt = p.closesAt instanceof Date ? p.closesAt : (p.closesAt as { toDate?: () => Date })?.toDate?.() || new Date(0);
    return closesAt > now;
  });
  const closedPolls = polls.filter(p => {
    const closesAt = p.closesAt instanceof Date ? p.closesAt : (p.closesAt as { toDate?: () => Date })?.toDate?.() || new Date(0);
    return closesAt <= now;
  });

  const displayedPolls = tab === 'active' ? activePolls : closedPolls;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-office-navy">Sondages</h1>
          <p className="text-sm text-office-brown/40 mt-0.5">
            {activePolls.length} actif{activePolls.length !== 1 ? 's' : ''} · {closedPolls.length} termine{closedPolls.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-mustard flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Creer un sondage
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-office-paper rounded-xl p-1">
        <button
          onClick={() => setTab('active')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            tab === 'active' ? 'bg-white text-office-navy shadow-sm' : 'text-office-brown/40 hover:text-office-brown/60'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Actifs ({activePolls.length})
        </button>
        <button
          onClick={() => setTab('closed')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            tab === 'closed' ? 'bg-white text-office-navy shadow-sm' : 'text-office-brown/40 hover:text-office-brown/60'
          }`}
        >
          <Archive className="w-4 h-4" />
          Termines ({closedPolls.length})
        </button>
      </div>

      {/* Polls list */}
      <div className="space-y-4">
        {displayedPolls.map(poll => (
          <PollCard
            key={poll.id}
            poll={poll}
            officeMembers={officeMembers}
          />
        ))}

        {displayedPolls.length === 0 && (
          <div className="text-center py-16">
            <span className="text-5xl block mb-4">{tab === 'active' ? '📊' : '📦'}</span>
            <p className="text-office-brown/40 font-medium">
              {tab === 'active'
                ? 'Aucun sondage actif. Cree le premier !'
                : 'Aucun sondage termine pour le moment.'}
            </p>
            {tab === 'active' && (
              <button
                onClick={() => setShowCreate(true)}
                className="mt-4 text-sm text-office-mustard hover:text-office-mustard-dark font-medium transition-colors"
              >
                + Creer un sondage
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <CreatePollModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {/* real-time listener handles refresh */}}
        />
      )}
    </div>
  );
}
