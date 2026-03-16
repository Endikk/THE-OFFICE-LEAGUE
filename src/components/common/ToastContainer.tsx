import { X, Trophy, TrendingDown, Info, Flame } from 'lucide-react';
import { useNotifications, type NotificationType } from '../../context/NotificationContext';

const TOAST_STYLES: Record<NotificationType, { bg: string; icon: typeof Trophy; color: string }> = {
  win: { bg: 'bg-office-green', icon: Trophy, color: 'text-white' },
  loss: { bg: 'bg-office-red', icon: TrendingDown, color: 'text-white' },
  info: { bg: 'bg-office-navy', icon: Info, color: 'text-white' },
  streak: { bg: 'bg-office-mustard', icon: Flame, color: 'text-white' },
};

export default function ToastContainer() {
  const { notifications, removeNotification } = useNotifications();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[90] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {notifications.map((notif) => {
        const style = TOAST_STYLES[notif.type];
        const Icon = style.icon;

        return (
          <div
            key={notif.id}
            className={`${style.bg} rounded-xl shadow-lg p-4 flex items-start gap-3 animate-slide-in pointer-events-auto`}
          >
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon className={`w-5 h-5 ${style.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-bold text-sm ${style.color}`}>{notif.title}</p>
              <p className={`text-xs ${style.color} opacity-80 mt-0.5`}>{notif.message}</p>
              {notif.amount && notif.amount > 0 && (
                <p className={`text-lg font-bold ${style.color} mt-1`}>
                  +{notif.amount.toLocaleString()} OfficeCoins
                </p>
              )}
            </div>
            <button
              onClick={() => removeNotification(notif.id)}
              className={`${style.color} opacity-50 hover:opacity-100 transition-opacity flex-shrink-0`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
