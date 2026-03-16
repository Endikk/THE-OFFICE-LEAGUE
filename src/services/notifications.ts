import {
  collection,
  addDoc,
  doc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';
import type { AppNotification, AppNotifType } from '../types';

// ─── Créer une notification ───
export async function createNotification(data: {
  userId: string;
  officeId: string;
  type: AppNotifType;
  emoji: string;
  title: string;
  message: string;
  data?: Record<string, string>;
}): Promise<string> {
  const notifData: Omit<AppNotification, 'id'> = {
    ...data,
    read: false,
    createdAt: serverTimestamp() as AppNotification['createdAt'],
  };
  const docRef = await addDoc(collection(db, 'notifications'), notifData);
  return docRef.id;
}

// ─── Créer des notifications pour tous les membres d'un office ───
export async function createNotificationForOffice(data: {
  officeId: string;
  userIds: string[];
  type: AppNotifType;
  emoji: string;
  title: string;
  message: string;
  data?: Record<string, string>;
  excludeUserId?: string;
}): Promise<void> {
  const batch = writeBatch(db);
  const recipients = data.excludeUserId
    ? data.userIds.filter(id => id !== data.excludeUserId)
    : data.userIds;

  for (const userId of recipients) {
    const ref = doc(collection(db, 'notifications'));
    batch.set(ref, {
      userId,
      officeId: data.officeId,
      type: data.type,
      emoji: data.emoji,
      title: data.title,
      message: data.message,
      read: false,
      data: data.data || {},
      createdAt: serverTimestamp(),
    });
  }

  await batch.commit();
}

// ─── Récupérer les notifications d'un user ───
export async function getUserNotifications(
  userId: string,
  maxResults: number = 50
): Promise<AppNotification[]> {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(maxResults)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification));
}

// ─── Listener temps réel sur les notifications ───
export function subscribeToNotifications(
  userId: string,
  callback: (notifs: AppNotification[]) => void
): () => void {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  return onSnapshot(q, (snapshot) => {
    const notifs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification));
    callback(notifs);
  });
}

// ─── Marquer une notification comme lue ───
export async function markAsRead(notifId: string): Promise<void> {
  await updateDoc(doc(db, 'notifications', notifId), { read: true });
}

// ─── Marquer toutes les notifications comme lues ───
export async function markAllAsRead(userId: string): Promise<void> {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('read', '==', false)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return;

  const batch = writeBatch(db);
  snapshot.docs.forEach(d => {
    batch.update(d.ref, { read: true });
  });
  await batch.commit();
}

// ─── Compter les non-lues ───
export async function getUnreadCount(userId: string): Promise<number> {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('read', '==', false)
  );
  const snapshot = await getDocs(q);
  return snapshot.size;
}

// ═══════════════════════════════════════════════════
// ─── NOTIFICATION TRIGGERS ───
// ═══════════════════════════════════════════════════

// ─── Match commence bientot (30 min) ───
export async function notifyMatchReminder(
  officeId: string,
  userIds: string[],
  homeTeam: string,
  awayTeam: string,
  matchId: string,
  sport: string
): Promise<void> {
  const sportEmoji: Record<string, string> = {
    football: '⚽', basketball: '🏀', nfl: '🏈', rugby: '🏉',
  };
  await createNotificationForOffice({
    officeId,
    userIds,
    type: 'match_reminder',
    emoji: sportEmoji[sport] || '⚽',
    title: 'Match dans 30 min !',
    message: `${homeTeam} vs ${awayTeam} commence bientot. Place ton pari !`,
    data: { matchId },
  });
}

// ─── Pari gagné ───
export async function notifyBetWon(
  userId: string,
  officeId: string,
  homeTeam: string,
  awayTeam: string,
  gainedPoints: number,
  matchId: string
): Promise<void> {
  await createNotification({
    userId,
    officeId,
    type: 'bet_won',
    emoji: '🎉',
    title: 'Pari gagne !',
    message: `${homeTeam} vs ${awayTeam} — Tu gagnes +${gainedPoints} OfficeCoins !`,
    data: { matchId },
  });
}

// ─── Pari perdu ───
export async function notifyBetLost(
  userId: string,
  officeId: string,
  homeTeam: string,
  awayTeam: string,
  amount: number,
  rivalName?: string,
  matchId?: string
): Promise<void> {
  const rivalMsg = rivalName
    ? ` ${rivalName} a parie contre toi et il a eu raison...`
    : '';
  await createNotification({
    userId,
    officeId,
    type: 'bet_lost',
    emoji: '😬',
    title: 'Pari perdu...',
    message: `${homeTeam} vs ${awayTeam} — -${amount} OfficeCoins.${rivalMsg}`,
    data: matchId ? { matchId } : undefined,
  });
}

// ─── Nouveau sondage ───
export async function notifyNewPoll(
  officeId: string,
  userIds: string[],
  question: string,
  creatorId: string,
  pollId: string
): Promise<void> {
  await createNotificationForOffice({
    officeId,
    userIds,
    type: 'poll_created',
    emoji: '🗳️',
    title: 'Nouveau sondage !',
    message: question,
    data: { pollId },
    excludeUserId: creatorId,
  });
}

// ─── Quelqu'un te dépasse au classement ───
export async function notifyLeaderboardPass(
  userId: string,
  officeId: string,
  passerName: string,
  newRank: number
): Promise<void> {
  await createNotification({
    userId,
    officeId,
    type: 'leaderboard_pass',
    emoji: '🏆',
    title: 'Depasse au classement !',
    message: `${passerName} vient de te depasser. Tu es maintenant #${newRank}.`,
  });
}

// ─── Dundie Award reçu ───
export async function notifyDundieAwarded(
  userId: string,
  officeId: string,
  dundieTitle: string,
  dundieEmoji: string
): Promise<void> {
  await createNotification({
    userId,
    officeId,
    type: 'dundie_awarded',
    emoji: dundieEmoji,
    title: 'Dundie Award recu !',
    message: `Tu as recu le Dundie "${dundieTitle}" ! Bravo !`,
  });
}

// ─── Match en direct ───
export async function notifyMatchLive(
  officeId: string,
  userIds: string[],
  homeTeam: string,
  awayTeam: string,
  matchId: string
): Promise<void> {
  await createNotificationForOffice({
    officeId,
    userIds,
    type: 'match_live',
    emoji: '🔴',
    title: 'Match EN DIRECT !',
    message: `${homeTeam} vs ${awayTeam} vient de commencer !`,
    data: { matchId },
  });
}

// ─── Match terminé ───
export async function notifyMatchFinished(
  officeId: string,
  userIds: string[],
  homeTeam: string,
  awayTeam: string,
  homeScore: number,
  awayScore: number,
  matchId: string
): Promise<void> {
  await createNotificationForOffice({
    officeId,
    userIds,
    type: 'match_finished',
    emoji: '🏁',
    title: 'Match termine !',
    message: `${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}`,
    data: { matchId },
  });
}
