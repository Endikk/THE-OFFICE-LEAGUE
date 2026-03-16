import { useEffect, useState } from 'react';
import { Building2, Users, Copy, Check, Crown, Coins, Trophy, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getOffice, getOfficeMembers, leaveOffice } from '../services/office';
import LoadingSpinner from '../components/common/LoadingSpinner';
import type { Office, User } from '../types';

export default function OfficeDashboard() {
  const { userData } = useAuth();
  const [office, setOffice] = useState<Office | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!userData?.officeId) return;

    async function load() {
      const [officeData, membersData] = await Promise.all([
        getOffice(userData!.officeId!),
        getOfficeMembers(userData!.officeId!),
      ]);
      setOffice(officeData);
      setMembers(membersData);
      setLoading(false);
    }
    load();
  }, [userData?.officeId]);

  if (loading) return <LoadingSpinner text="Chargement du bureau..." />;
  if (!office || !userData) return null;

  function handleCopy() {
    navigator.clipboard.writeText(office!.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleLeave() {
    if (!confirm('Es-tu sur de vouloir quitter ce bureau ?')) return;
    setLeaving(true);
    try {
      await leaveOffice(userData!.uid, office!.id);
    } catch {
      setLeaving(false);
    }
  }

  const isCreator = office.createdBy === userData.uid;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Office Header */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-office-navy rounded-xl flex items-center justify-center flex-shrink-0">
              <Building2 className="w-7 h-7 text-office-mustard" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-office-navy">{office.name}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-office-brown/50">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {office.membersCount} membre{office.membersCount > 1 ? 's' : ''}
                </span>
                {isCreator && (
                  <span className="flex items-center gap-1 text-office-mustard">
                    <Crown className="w-4 h-4" /> Createur
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Invite code */}
          <div className="bg-office-paper rounded-xl px-5 py-3 flex items-center gap-3">
            <div>
              <p className="text-xs text-office-brown/40 mb-0.5">Code d'invitation</p>
              <p className="font-mono text-xl font-bold text-office-navy tracking-widest">
                {office.inviteCode}
              </p>
            </div>
            <button
              onClick={handleCopy}
              className="p-2 rounded-lg hover:bg-office-paper-dark transition-colors"
              title="Copier le code"
            >
              {copied ? (
                <Check className="w-5 h-5 text-office-green" />
              ) : (
                <Copy className="w-5 h-5 text-office-brown/40" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Members */}
      <div className="card overflow-hidden">
        <div className="bg-office-navy px-6 py-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-office-mustard" />
            Membres du bureau
          </h2>
        </div>

        <div className="divide-y divide-office-paper-dark/60">
          {members.map((member, index) => {
            const totalBets = member.totalWins + member.totalLosses;
            const winRate = totalBets > 0 ? Math.round((member.totalWins / totalBets) * 100) : 0;
            const isMe = member.uid === userData.uid;
            const isMemberCreator = member.uid === office.createdBy;

            return (
              <div
                key={member.uid}
                className={`flex items-center gap-4 px-6 py-4 ${isMe ? 'bg-office-mustard/5' : ''} ${index < 3 ? 'bg-office-paper/30' : ''}`}
              >
                {/* Rank */}
                <div className="w-8 text-center">
                  {index === 0 && <span className="text-lg">🥇</span>}
                  {index === 1 && <span className="text-lg">🥈</span>}
                  {index === 2 && <span className="text-lg">🥉</span>}
                  {index > 2 && <span className="text-sm font-medium text-office-brown/40">#{index + 1}</span>}
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-office-navy/10 flex items-center justify-center flex-shrink-0">
                  {member.photoURL ? (
                    <img src={member.photoURL} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-office-navy">
                      {member.displayName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-office-navy truncate">
                      {member.displayName}
                    </p>
                    {isMe && (
                      <span className="text-xs bg-office-navy/10 text-office-navy px-1.5 py-0.5 rounded font-medium">toi</span>
                    )}
                    {isMemberCreator && (
                      <Crown className="w-3.5 h-3.5 text-office-mustard flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-office-brown/40 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Trophy className="w-3 h-3" />
                      {member.totalWins}W / {member.totalLosses}L
                    </span>
                    {totalBets > 0 && <span>{winRate}% win</span>}
                    {member.streak !== 0 && (
                      <span className={member.streak > 0 ? 'text-office-green' : 'text-office-red'}>
                        streak {member.streak > 0 ? '+' : ''}{member.streak}
                      </span>
                    )}
                  </div>
                </div>

                {/* Coins */}
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-1.5 justify-end">
                    <Coins className="w-4 h-4 text-office-mustard" />
                    <span className="font-bold text-office-navy">{member.officeCoins.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-office-brown/30">OfficeCoins</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leave button */}
      <div className="mt-6 text-center">
        <button
          onClick={handleLeave}
          disabled={leaving}
          className="inline-flex items-center gap-2 text-sm text-office-brown/40 hover:text-office-red transition-colors disabled:opacity-50"
        >
          <LogOut className="w-4 h-4" />
          {leaving ? 'En cours...' : 'Quitter ce bureau'}
        </button>
      </div>
    </div>
  );
}
