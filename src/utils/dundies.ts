import type { DundieAward, User } from '../types';

interface DundieCheck {
  id: string;
  title: string;
  description: string;
  icon: string;
  check: (user: User) => boolean;
}

export const DUNDIE_CHECKS: DundieCheck[] = [
  {
    id: '1',
    title: 'Michael Scott Award',
    description: 'Premier pari placé',
    icon: '🏆',
    check: (u) => u.totalBets >= 1,
  },
  {
    id: '3',
    title: 'Dwight Schrute',
    description: 'Meilleur win rate du bureau',
    icon: '🥋',
    check: (u) => u.totalBets >= 10 && (u.wonBets / u.totalBets) > 0.7,
  },
  {
    id: '4',
    title: 'Stanley Hudson',
    description: '50 paris placés',
    icon: '📰',
    check: (u) => u.totalBets >= 50,
  },
  {
    id: '6',
    title: 'Oscar Martinez',
    description: 'Win rate > 70%',
    icon: '🧠',
    check: (u) => u.totalBets >= 5 && (u.wonBets / u.totalBets) > 0.7,
  },
];

export function checkNewDundies(user: User): DundieAward[] {
  const earnedIds = new Set(user.dundieAwards.map(a => a.id));
  const newAwards: DundieAward[] = [];

  for (const dundie of DUNDIE_CHECKS) {
    if (!earnedIds.has(dundie.id) && dundie.check(user)) {
      newAwards.push({
        id: dundie.id,
        title: dundie.title,
        description: dundie.description,
        icon: dundie.icon,
        earnedAt: new Date(),
      });
    }
  }

  return newAwards;
}
