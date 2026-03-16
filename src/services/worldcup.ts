// ─── Configuration Coupe du Monde 2026 ───
// Plus d'API externe — les matchs sont gérés manuellement par l'admin

export const WORLD_CUP_2026 = {
  startDate: new Date('2026-06-11'),
  endDate: new Date('2026-07-19'),
  totalTeams: 48,
  hostCountries: ['USA', 'Mexico', 'Canada'],
} as const;

export function isWorldCupActive(): boolean {
  const now = new Date();
  return now >= WORLD_CUP_2026.startDate && now <= WORLD_CUP_2026.endDate;
}

export function isWorldCupSoon(): boolean {
  const now = new Date();
  const oneMonthBefore = new Date(WORLD_CUP_2026.startDate);
  oneMonthBefore.setMonth(oneMonthBefore.getMonth() - 1);
  return now >= oneMonthBefore && now <= WORLD_CUP_2026.endDate;
}
