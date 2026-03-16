// ─── Calcul simplifié des cotes ───
// Basé sur la réputation des équipes (tiers) et l'avantage domicile

import type { Sport, MatchOdds } from '../types';

// Tiers de force des équipes (football)
const FOOTBALL_TIERS: Record<string, number> = {
  // Tier 1 : Élite (facteur 1.0)
  'Paris Saint Germain': 1.0, 'PSG': 1.0, 'Paris Saint-Germain': 1.0,
  'Manchester City': 1.0, 'Real Madrid': 1.0, 'Bayern Munich': 1.0, 'Bayern München': 1.0,
  'Barcelona': 1.0, 'Liverpool': 1.0, 'Arsenal': 1.0, 'Inter': 1.0, 'Inter Milan': 1.0,
  // Tier 2 : Très fort (0.85)
  'Marseille': 0.85, 'Olympique de Marseille': 0.85, 'OM': 0.85,
  'Manchester United': 0.85, 'Chelsea': 0.85, 'Tottenham': 0.85,
  'Atletico Madrid': 0.85, 'Atletico de Madrid': 0.85,
  'Juventus': 0.85, 'AC Milan': 0.85, 'Napoli': 0.85, 'SSC Napoli': 0.85,
  'Borussia Dortmund': 0.85, 'RB Leipzig': 0.85, 'Bayer Leverkusen': 0.85,
  // Tier 3 : Bon (0.70)
  'Lyon': 0.70, 'Olympique Lyonnais': 0.70, 'OL': 0.70,
  'Monaco': 0.70, 'AS Monaco': 0.70, 'Lille': 0.70, 'LOSC': 0.70, 'LOSC Lille': 0.70,
  'Lens': 0.70, 'RC Lens': 0.70, 'Nice': 0.70, 'OGC Nice': 0.70,
  'Aston Villa': 0.70, 'Newcastle': 0.70, 'Newcastle United': 0.70,
  'West Ham': 0.70, 'West Ham United': 0.70,
  'Real Sociedad': 0.70, 'Athletic Bilbao': 0.70, 'Villarreal': 0.70,
  'AS Roma': 0.70, 'Roma': 0.70, 'Lazio': 0.70, 'SS Lazio': 0.70, 'Atalanta': 0.70,
  'Fiorentina': 0.70, 'ACF Fiorentina': 0.70,
  // Tier 4 : Moyen (0.55) - défaut
  // Tier sélections (Coupe du Monde)
  'France': 1.0, 'Brazil': 1.0, 'Brasil': 1.0, 'Brésil': 1.0,
  'Argentina': 1.0, 'Argentine': 1.0, 'England': 0.95, 'Angleterre': 0.95,
  'Germany': 0.95, 'Allemagne': 0.95, 'Spain': 0.95, 'Espagne': 0.95,
  'Portugal': 0.90, 'Netherlands': 0.90, 'Pays-Bas': 0.90, 'Holland': 0.90,
  'Belgium': 0.85, 'Belgique': 0.85, 'Italy': 0.85, 'Italie': 0.85,
  'Croatia': 0.80, 'Croatie': 0.80, 'Uruguay': 0.80,
  'Colombia': 0.75, 'Colombie': 0.75, 'Mexico': 0.75, 'Mexique': 0.75,
  'USA': 0.75, 'United States': 0.75, 'États-Unis': 0.75,
  'Japan': 0.70, 'Japon': 0.70, 'South Korea': 0.70, 'Corée du Sud': 0.70,
  'Morocco': 0.75, 'Maroc': 0.75, 'Senegal': 0.70, 'Sénégal': 0.70,
};


function getTeamStrength(teamName: string, _sport: Sport): number {
  return FOOTBALL_TIERS[teamName] || 0.55; // Défaut : équipe moyenne
}

// ─── Calcul des cotes ───
export function calculateOdds(homeTeam: string, awayTeam: string, sport: Sport): MatchOdds {
  const homeStrength = getTeamStrength(homeTeam, sport);
  const awayStrength = getTeamStrength(awayTeam, sport);

  // Avantage domicile
  const homeAdvantage = sport === 'football' ? 0.10 : 0.07;
  const adjustedHome = Math.min(homeStrength + homeAdvantage, 1.0);

  // Probabilités brutes
  const total = adjustedHome + awayStrength;
  let homeProb = adjustedHome / total;
  let awayProb = awayStrength / total;

  // Nul (football uniquement, ~25% base, ajusté si équipes proches)
  let drawProb = 0;
  if (sport === 'football') {
    const diff = Math.abs(homeStrength - awayStrength);
    drawProb = Math.max(0.12, 0.30 - diff * 0.4); // Plus les équipes sont proches, plus le nul est probable
    homeProb = homeProb * (1 - drawProb);
    awayProb = awayProb * (1 - drawProb);
  }

  // Convertir en cotes (1/prob) avec marge bookmaker ~8%
  const margin = 1.08;
  const homeOdds = Math.max(1.05, round2(margin / homeProb));
  const drawOdds = drawProb > 0 ? Math.max(1.05, round2(margin / drawProb)) : 0;
  const awayOdds = Math.max(1.05, round2(margin / awayProb));

  return {
    home: homeOdds,
    draw: sport === 'football' ? drawOdds : 0,
    away: awayOdds,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
