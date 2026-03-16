import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { subscribeToNotifications } from '../../services/notifications';
import NotificationDropdown from './NotificationDropdown';
import type { AppNotification } from '../../types';

export default function NotificationBell() {
  const { userData } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Real-time listener
  useEffect(() => {
    if (!userData?.uid) return;

    const unsubscribe = subscribeToNotifications(userData.uid, (notifs) => {
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, [userData?.uid]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-1.5 text-white/50 hover:text-white transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />

        {/* Badge compteur */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-office-red rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1 animate-bounce">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <NotificationDropdown
          notifications={notifications}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
