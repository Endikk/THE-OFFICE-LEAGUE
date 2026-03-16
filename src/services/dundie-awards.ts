import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import type { DundieAward, DundieType, RankingEntry, User } from '../types';
import { notifyDundieAwarded } from './notifications';

// ─── Créer un Dundie Award ───
export async function createDundieAward(data: {
  officeId: string;
  title: string;
  emoji: string;
  description: string;
  winnerId: string;
  winnerName?: string;
  season: string;
  dundieType?: DundieType;
  period?: 'weekly' | 'monthly';
}): Promise<string> {
  const awardData: Omit<DundieAward, 'id'> = {
    ...data,
    createdAt: serverTimestamp() as DundieAward['createdAt'],
  };

  const docRef = await addDoc(collection(db, 'dundieAwards'), awardData);

  // Ajouter l'award ID au profil du gagnant
  await updateDoc(doc(db, 'users', data.winnerId), {
    dundieAwards: arrayUnion(docRef.id),
  });

  return docRef.id;
}

// ─── Récupérer les awards d'un office ───
export async function getOfficeAwards(officeId: string): Promise<DundieAward[]> {
  const q = query(
    collection(db, 'dundieAwards'),
    where('officeId', '==', officeId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as DundieAward));
}

// ─── Récupérer les awards d'un office par saison ───
export async function getAwardsBySeason(officeId: string, season: string): Promise<DundieAward[]> {
  const q = query(
    collection(db, 'dundieAwards'),
    where('officeId', '==', officeId),
    where('season', '==', season)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as DundieAward));
}

// ─── Récupérer les awards d'un user ───
export async function getUserAwards(userId: string): Promise<DundieAward[]> {
  const q = query(
    collection(db, 'dundieAwards'),
    where('winnerId', '==', userId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as DundieAward));
}

// ─── Listener temps réel sur les awards d'un office ───
export function subscribeToAwards(
  officeId: string,
  callback: (awards: DundieAward[]) => void
): () => void {
  const q = query(
    collection(db, 'dundieAwards'),
    where('officeId', '==', officeId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const awards = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as DundieAward));
    callback(awards);
  });
}

// ─── Saison courante (format "2026-S1") ───
export function getCurrentSeason(): string {
  const now = new Date();
  const semester = now.getMonth() < 6 ? 'S1' : 'S2';
  return `${now.getFullYear()}-${semester}`;
}

// ─── Semaine courante (format "2026-W12") ───
export function getCurrentWeek(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const weekNumber = Math.ceil((diff / 86400000 + start.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}

// ─── Catalogue de Dundies automatiques (milestone-based) ───
export interface DundieCriteria {
  title: string;
  emoji: string;
  description: string;
  check: (user: User) => boolean;
}

export const AUTO_DUNDIES: DundieCriteria[] = [
  {
    title: 'The Michael Scott Award',
    emoji: '🏆',
    description: 'Premier pari place',
    check: (u) => (u.totalWins + u.totalLosses) >= 1,
  },
  {
    title: 'Jim Halpert Streak',
    emoji: '😏',
    description: '5 victoires d\'affilee',
    check: (u) => u.streak >= 5,
  },
  {
    title: 'Dwight Schrute Dominance',
    emoji: '🥋',
    description: '10 victoires d\'affilee',
    check: (u) => u.streak >= 10,
  },
  {
    title: 'Stanley Hudson Veteran',
    emoji: '📰',
    description: '50 paris places',
    check: (u) => (u.totalWins + u.totalLosses) >= 50,
  },
  {
    title: 'Kevin Malone Award',
    emoji: '🫠',
    description: '5 defaites d\'affilee',
    check: (u) => u.streak <= -5,
  },
  {
    title: 'Oscar Martinez Brain',
    emoji: '🧠',
    description: 'Win rate > 70% (min 10 paris)',
    check: (u) => {
      const total = u.totalWins + u.totalLosses;
      return total >= 10 && (u.totalWins / total) > 0.7;
    },
  },
];

// ─── Dundies périodiques (hebdo/mensuel) ───
export interface PeriodicDundie {
  dundieType: DundieType;
  title: string;
  emoji: string;
  description: string;
  period: 'weekly' | 'monthly';
  pickWinner: (entries: RankingEntry[]) => RankingEntry | null;
}

export const PERIODIC_DUNDIES: PeriodicDundie[] = [
  {
    dundieType: 'nostradamus',
    title: 'Le Nostradamus',
    emoji: '🏆',
    description: 'Plus long streak de bonnes reponses',
    period: 'weekly',
    pickWinner: (entries) => {
      const active = entries.filter(e => e.streak > 0);
      if (active.length === 0) return null;
      return active.reduce((best, e) => e.streak > best.streak ? e : best, active[0]);
    },
  },
  {
    dundieType: 'flambeur',
    title: 'Le Flambeur',
    emoji: '💸',
    description: 'A le plus perdu cette semaine',
    period: 'weekly',
    pickWinner: (entries) => {
      const active = entries.filter(e => e.losses > 0);
      if (active.length === 0) return null;
      return active.reduce((best, e) => e.losses > best.losses ? e : best, active[0]);
    },
  },
  {
    dundieType: 'ice_cold',
    title: 'Ice Cold Bets',
    emoji: '🧊',
    description: 'Ne joue que les favoris',
    period: 'monthly',
    pickWinner: (entries) => {
      const active = entries.filter(e => (e.wins + e.losses) >= 5 && e.favoriteRate > 60);
      if (active.length === 0) return null;
      return active.reduce((best, e) => e.favoriteRate > best.favoriteRate ? e : best, active[0]);
    },
  },
  {
    dundieType: 'chaotique',
    title: 'Le Chaotique',
    emoji: '🎰',
    description: 'Parie toujours sur l\'outsider',
    period: 'monthly',
    pickWinner: (entries) => {
      // Inverse of favoriteRate → lowest favorite rate = most outsider bets
      const active = entries.filter(e => (e.wins + e.losses) >= 5 && e.favoriteRate < 30);
      if (active.length === 0) return null;
      return active.reduce((best, e) => e.favoriteRate < best.favoriteRate ? e : best, active[0]);
    },
  },
  {
    dundieType: 'statisticien',
    title: 'Le Statisticien',
    emoji: '📊',
    description: 'Meilleur ratio wins/losses',
    period: 'monthly',
    pickWinner: (entries) => {
      const active = entries.filter(e => (e.wins + e.losses) >= 10);
      if (active.length === 0) return null;
      return active.reduce((best, e) => {
        const eRate = e.wins / (e.wins + e.losses);
        const bestRate = best.wins / (best.wins + best.losses);
        return eRate > bestRate ? e : best;
      }, active[0]);
    },
  },
  {
    dundieType: 'fantome',
    title: 'Le Fantome',
    emoji: '😐',
    description: 'Le moins actif du bureau',
    period: 'monthly',
    pickWinner: (entries) => {
      if (entries.length === 0) return null;
      return entries.reduce((least, e) =>
        (e.wins + e.losses) < (least.wins + least.losses) ? e : least,
        entries[0]
      );
    },
  },
  {
    dundieType: 'decontracte',
    title: 'Mr. Decontracte',
    emoji: '😎',
    description: 'Gagne sans forcer',
    period: 'weekly',
    pickWinner: (entries) => {
      // Best ratio with fewer bets (efficient wins)
      const active = entries.filter(e => {
        const total = e.wins + e.losses;
        return total >= 3 && total <= 15 && (e.wins / total) > 0.6;
      });
      if (active.length === 0) return null;
      return active.reduce((best, e) => {
        const eRate = e.wins / (e.wins + e.losses);
        const bestRate = best.wins / (best.wins + best.losses);
        return eRate > bestRate ? e : best;
      }, active[0]);
    },
  },
  {
    dundieType: 'soldat',
    title: 'Le Soldat',
    emoji: '🫡',
    description: 'Le plus de paris places',
    period: 'weekly',
    pickWinner: (entries) => {
      const active = entries.filter(e => (e.wins + e.losses) > 0);
      if (active.length === 0) return null;
      return active.reduce((best, e) =>
        (e.wins + e.losses) > (best.wins + best.losses) ? e : best,
        active[0]
      );
    },
  },
];

// ─── Attribuer les dundies périodiques ───
export async function awardPeriodicDundies(
  officeId: string,
  entries: RankingEntry[],
  period: 'weekly' | 'monthly'
): Promise<DundieAward[]> {
  const season = getCurrentSeason();
  const weekOrMonth = period === 'weekly' ? getCurrentWeek() : `${new Date().getFullYear()}-M${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  // Check existing awards to avoid duplicates
  const existing = await getOfficeAwards(officeId);
  const existingKeys = new Set(
    existing
      .filter(a => a.dundieType && a.season === season)
      .map(a => `${a.dundieType}-${a.period}-${weekOrMonth}`)
  );

  const dundies = PERIODIC_DUNDIES.filter(d => d.period === period);
  const newAwards: DundieAward[] = [];

  for (const dundie of dundies) {
    const key = `${dundie.dundieType}-${dundie.period}-${weekOrMonth}`;
    if (existingKeys.has(key)) continue;

    const winner = dundie.pickWinner(entries);
    if (!winner) continue;

    const id = await createDundieAward({
      officeId,
      title: dundie.title,
      emoji: dundie.emoji,
      description: dundie.description,
      winnerId: winner.userId,
      winnerName: winner.displayName,
      season,
      dundieType: dundie.dundieType,
      period: dundie.period,
    });

    // Notify the winner
    notifyDundieAwarded(winner.userId, officeId, dundie.title, dundie.emoji).catch(() => {});

    newAwards.push({
      id,
      officeId,
      title: dundie.title,
      emoji: dundie.emoji,
      description: dundie.description,
      winnerId: winner.userId,
      winnerName: winner.displayName,
      season,
      dundieType: dundie.dundieType,
      period: dundie.period,
      createdAt: new Date(),
    });
  }

  return newAwards;
}

// ─── Vérifier et attribuer les Dundies automatiques (milestones) ───
export async function checkAndAwardDundies(
  user: User,
  officeId: string
): Promise<DundieAward[]> {
  const existingAwards = await getUserAwards(user.uid);
  const existingTitles = new Set(existingAwards.map(a => a.title));
  const season = getCurrentSeason();
  const newAwards: DundieAward[] = [];

  for (const criteria of AUTO_DUNDIES) {
    if (existingTitles.has(criteria.title)) continue;
    if (!criteria.check(user)) continue;

    const id = await createDundieAward({
      officeId,
      title: criteria.title,
      emoji: criteria.emoji,
      description: criteria.description,
      winnerId: user.uid,
      winnerName: user.displayName,
      season,
    });

    // Notify the winner
    notifyDundieAwarded(user.uid, officeId, criteria.title, criteria.emoji).catch(() => {});

    newAwards.push({
      id,
      officeId,
      title: criteria.title,
      emoji: criteria.emoji,
      description: criteria.description,
      winnerId: user.uid,
      winnerName: user.displayName,
      season,
      createdAt: new Date(),
    });
  }

  return newAwards;
}

// ─── Citations de Michael Scott ───
export const MICHAEL_SCOTT_QUOTES = [
  "Would I rather be feared or loved? Easy. Both. I want people to be afraid of how much they love me.",
  "I'm not superstitious, but I am a little stitious.",
  "Sometimes I'll start a sentence and I don't even know where it's going. I just hope I find it along the way.",
  "I knew exactly what to do. But in a much more real sense, I had no idea what to do.",
  "You miss 100% of the shots you don't take. — Wayne Gretzky — Michael Scott",
  "I am Beyonce, always.",
  "It's a beautiful morning at Dunder Mifflin. Or, as I like to call it, Great Bratton.",
  "I am running away from my responsibilities. And it feels good.",
  "I declare bankruptcy!",
  "That's what she said.",
  "I am dead inside.",
  "Wikipedia is the best thing ever. Anyone in the world can write anything they want about any subject. So you know you are getting the best possible information.",
  "Guess what, I have flaws. What are they? Oh, I don't know. I sing in the shower. Sometimes I spend too much time volunteering.",
  "I'm an early bird and a night owl. So I'm wise and I have worms.",
  "Well, well, well, how the turntables...",
  "Bros before hoes. Why? Because your bros are always there for you.",
];

export function getRandomMichaelQuote(): string {
  return MICHAEL_SCOTT_QUOTES[Math.floor(Math.random() * MICHAEL_SCOTT_QUOTES.length)];
}

// ─── Grouper les awards par saison ───
export function groupAwardsBySeason(awards: DundieAward[]): Record<string, DundieAward[]> {
  const groups: Record<string, DundieAward[]> = {};
  for (const award of awards) {
    const key = award.season || 'unknown';
    if (!groups[key]) groups[key] = [];
    groups[key].push(award);
  }
  return groups;
}
