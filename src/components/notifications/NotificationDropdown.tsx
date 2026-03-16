import { useState } from 'react';
import { Check, CheckCheck } from 'lucide-react';
import { markAsRead, markAllAsRead } from '../../services/notifications';
import { useAuth } from '../../context/AuthContext';
import type { AppNotification } from '../../types';

interface NotificationDropdownProps {
  notifications: AppNotification[];
  onClose: () => void;
}

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}j`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return 'maintenant';
}

function getNotifAccent(type: AppNotification['type']): string {
  switch (type) {
    case 'bet_won': return 'border-l-office-green';
    case 'bet_lost': return 'border-l-office-red';
    case 'match_reminder':
    case 'match_live': return 'border-l-office-mustard';
    case 'poll_created': return 'border-l-purple-400';
    case 'leaderboard_pass': return 'border-l-office-navy';
    case 'dundie_awarded': return 'border-l-yellow-400';
    case 'match_finished': return 'border-l-office-brown-light';
    default: return 'border-l-office-navy';
  }
}

export default function NotificationDropdown({ notifications }: NotificationDropdownProps) {
  const { userData } = useAuth();
  const [markingAll, setMarkingAll] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  async function handleMarkAllRead() {
    if (!userData?.uid || markingAll) return;
    setMarkingAll(true);
    try {
      await markAllAsRead(userData.uid);
    } finally {
      setMarkingAll(false);
    }
  }

  async function handleMarkRead(notifId: string) {
    await markAsRead(notifId);
  }

  return (
    <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-office-paper-dark/60 overflow-hidden z-50 animate-slide-down">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-office-navy">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-white">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-office-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="flex items-center gap-1 text-[11px] text-white/50 hover:text-white transition-colors disabled:opacity-50"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Tout marquer lu
          </button>
        )}
      </div>

      {/* Notification list */}
      <div className="max-h-[400px] overflow-y-auto divide-y divide-office-paper-dark/30">
        {notifications.length === 0 ? (
          <div className="py-12 text-center">
            <span className="text-3xl block mb-2">🔔</span>
            <p className="text-sm text-office-brown-light/40">Aucune notification</p>
          </div>
        ) : (
          notifications.map((notif) => {
            const createdAt = notif.createdAt instanceof Date
              ? notif.createdAt
              : (notif.createdAt as { toDate?: () => Date })?.toDate?.() || new Date();

            return (
              <div
                key={notif.id}
                className={`flex items-start gap-3 px-4 py-3 border-l-3 transition-colors ${
                  getNotifAccent(notif.type)
                } ${notif.read ? 'bg-white' : 'bg-office-paper/50'}`}
              >
                {/* Emoji */}
                <span className="text-lg flex-shrink-0 mt-0.5">{notif.emoji}</span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${notif.read ? 'text-office-brown-light/60' : 'text-office-navy font-medium'}`}>
                    {notif.title}
                  </p>
                  <p className="text-xs text-office-brown-light/40 mt-0.5 line-clamp-2">
                    {notif.message}
                  </p>
                  <span className="text-[10px] text-office-brown-light/30 mt-1 block">
                    {timeAgo(createdAt)}
                  </span>
                </div>

                {/* Mark as read */}
                {!notif.read && (
                  <button
                    onClick={() => handleMarkRead(notif.id)}
                    className="text-office-brown-light/30 hover:text-office-green transition-colors flex-shrink-0 mt-1"
                    title="Marquer comme lu"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-2.5 border-t border-office-paper-dark/30 bg-office-paper/30">
          <p className="text-[10px] text-office-brown-light/30 text-center">
            {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
