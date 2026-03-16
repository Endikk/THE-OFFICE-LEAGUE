import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type NotificationType = 'win' | 'loss' | 'info' | 'streak';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  amount?: number;
  streak?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notif: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  showVictory: boolean;
  triggerVictory: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  addNotification: () => {},
  removeNotification: () => {},
  showVictory: false,
  triggerVictory: () => {},
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showVictory, setShowVictory] = useState(false);

  const addNotification = useCallback((notif: Omit<Notification, 'id'>) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    setNotifications(prev => [...prev, { ...notif, id }]);

    // Auto-remove après 5s
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const triggerVictory = useCallback(() => {
    setShowVictory(true);
    // Son de caisse enregistreuse
    playCashRegisterSound();
    setTimeout(() => setShowVictory(false), 4000);
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      showVictory,
      triggerVictory,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}

// ─── Son de caisse enregistreuse (synthétisé avec Web Audio API) ───
function playCashRegisterSound() {
  try {
    const ctx = new AudioContext();

    // "Ka-ching" : deux tons rapides
    const playTone = (freq: number, startTime: number, duration: number, gain: number) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gainNode.gain.setValueAtTime(gain, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    // "Ka" - son métallique
    playTone(2000, now, 0.08, 0.3);
    playTone(3000, now, 0.06, 0.15);
    // "Ching" - son de cloche
    playTone(4000, now + 0.1, 0.3, 0.25);
    playTone(5000, now + 0.1, 0.25, 0.15);
    playTone(6000, now + 0.12, 0.2, 0.1);

    // Fermer le contexte après
    setTimeout(() => ctx.close(), 1000);
  } catch {
    // Audio non disponible, on ignore silencieusement
  }
}
