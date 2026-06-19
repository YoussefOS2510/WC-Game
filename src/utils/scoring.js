/**
 * Normalizes team names to handle spelling differences between user picks and API matches
 * (e.g. "Türkiye" / "Turkiye" -> "Turkey", "Czechia" -> "Czech Republic")
 * 
 * @param {string} name - The team name to normalize
 * @returns {string} Normalized lowercase team name
 */
export function normalizeTeamName(name) {
  if (!name) return '';
  const clean = name.trim().toLowerCase();
  if (clean === 'türkiye' || clean === 'turkiye') return 'turkey';
  if (clean === 'czechia' || clean === 'czech republic') return 'czech republic';
  return clean;
}

/**
 * Calculate the points for a single match for a given team.
 * 
 * @param {Object} match - The match object (homeTeam, awayTeam, homeScore, awayScore, status)
 * @param {string} team - The team name to check
 * @param {number} baseWinPoints - Points for a standard win in this team's pot
 * @param {number} gdPointsBonus - Points per positive goal difference
 * @param {boolean} isDarkHorse - Whether the team is selected as a dark horse
 * @param {number} darkHorseMultiplier - Multiplier for dark horse wins
 * @returns {number} Points earned by this team in this match
 */
export function calculateMatchPointsForTeam(match, team, baseWinPoints, baseDrawPoints, gdPointsBonus, isDarkHorse, darkHorseMultiplier) {
  if (match.status !== 'FINISHED') return 0;
  
  const homeNorm = normalizeTeamName(match.homeTeam);
  const awayNorm = normalizeTeamName(match.awayTeam);
  const teamNorm = normalizeTeamName(team);
  
  const isHome = homeNorm === teamNorm;
  const isAway = awayNorm === teamNorm;
  
  if (!isHome && !isAway) return 0;
  
  const teamScore = isHome ? match.homeScore : match.awayScore;
  const oppScore = isHome ? match.awayScore : match.homeScore;
  
  // Win
  if (teamScore > oppScore) {
    const gd = teamScore - oppScore;
    const gdPoints = gd > 0 ? gd * gdPointsBonus : 0;
    const basePoints = baseWinPoints + gdPoints;
    
    if (isDarkHorse) {
      return basePoints * darkHorseMultiplier;
    }
    return basePoints;
  }
  
  // Draw
  if (teamScore === oppScore) {
    if (isDarkHorse) {
      return baseDrawPoints * darkHorseMultiplier;
    }
    return baseDrawPoints;
  }
  
  // Loss gives 0 points
  return 0;
}

/**
 * Calculates a player's total points and breakdown.
 * 
 * @param {Object} player - The player record
 * @param {Array} matches - The list of all matches
 * @param {Object} settings - The scoring rules settings
 * @returns {Object} Total points and breakdown
 */
export function calculatePlayerPoints(player, matches, settings) {
  const {
    pot1WinPoints = 3,
    pot2WinPoints = 4,
    pot3WinPoints = 5,
    pot1DrawPoints = 1,
    pot2DrawPoints = 2,
    pot3DrawPoints = 3,
    darkHorseMultiplier = 2,
    goalDifferenceBonus = 1,
    awardPointsBonus = 10,
    actualBestPlayer = '',
    actualTopScorer = '',
    actualBestGoalkeeper = ''
  } = settings;

  const breakdown = {
    pot1: {},
    pot2: {},
    pot3: {},
    darkHorses: {},
    awards: {
      bestPlayer: 0,
      topScorer: 0,
      bestGoalkeeper: 0
    }
  };

  let totalPoints = 0;

  // 1. Pot 1 Selections (usually 2 teams)
  const pot1Teams = player.selections?.pot1 || [];
  pot1Teams.forEach(team => {
    let teamPoints = 0;
    matches.forEach(match => {
      teamPoints += calculateMatchPointsForTeam(
        match,
        team,
        pot1WinPoints,
        pot1DrawPoints,
        goalDifferenceBonus,
        false, // Pot 1 selections are not dark horses in their Pot 1 slot
        darkHorseMultiplier
      );
    });
    breakdown.pot1[team] = teamPoints;
    totalPoints += teamPoints;
  });

  // 2. Pot 2 Selection (1 team)
  const pot2Team = player.selections?.pot2 || '';
  if (pot2Team) {
    let teamPoints = 0;
    matches.forEach(match => {
      teamPoints += calculateMatchPointsForTeam(
        match,
        pot2Team,
        pot2WinPoints,
        pot2DrawPoints,
        goalDifferenceBonus,
        false,
        darkHorseMultiplier
      );
    });
    breakdown.pot2[pot2Team] = teamPoints;
    totalPoints += teamPoints;
  }

  // 3. Pot 3 Selection (1 team)
  const pot3Team = player.selections?.pot3 || '';
  if (pot3Team) {
    let teamPoints = 0;
    matches.forEach(match => {
      teamPoints += calculateMatchPointsForTeam(
        match,
        pot3Team,
        pot3WinPoints,
        pot3DrawPoints,
        goalDifferenceBonus,
        false,
        darkHorseMultiplier
      );
    });
    breakdown.pot3[pot3Team] = teamPoints;
    totalPoints += teamPoints;
  }

  // 4. Dark Horse Selections (2 teams)
  const darkHorses = player.selections?.darkHorses || [];
  darkHorses.forEach(team => {
    let teamPoints = 0;
    // Determine base points for this team
    const baseWinPoints = getTeamBaseWinPoints(team, settings);
    const baseDrawPoints = getTeamBaseDrawPoints(team, settings);
    
    matches.forEach(match => {
      teamPoints += calculateMatchPointsForTeam(
        match,
        team,
        baseWinPoints,
        baseDrawPoints,
        goalDifferenceBonus,
        true, // isDarkHorse = true
        darkHorseMultiplier
      );
    });
    breakdown.darkHorses[team] = teamPoints;
    totalPoints += teamPoints;
  });

  // 5. Awards (Golden Ball, Boot, Glove) - given at the end of the tournament
  if (actualBestPlayer && player.awards?.bestPlayer && 
      player.awards.bestPlayer.trim().toLowerCase() === actualBestPlayer.trim().toLowerCase()) {
    breakdown.awards.bestPlayer = awardPointsBonus;
    totalPoints += awardPointsBonus;
  }
  if (actualTopScorer && player.awards?.topScorer && 
      player.awards.topScorer.trim().toLowerCase() === actualTopScorer.trim().toLowerCase()) {
    breakdown.awards.topScorer = awardPointsBonus;
    totalPoints += awardPointsBonus;
  }
  if (actualBestGoalkeeper && player.awards?.bestGoalkeeper && 
      player.awards.bestGoalkeeper.trim().toLowerCase() === actualBestGoalkeeper.trim().toLowerCase()) {
    breakdown.awards.bestGoalkeeper = awardPointsBonus;
    totalPoints += awardPointsBonus;
  }

  return { totalPoints, breakdown };
}

/**
 * Static map or inference helper for team pots.
 * Based on responses, here is the categorization of teams chosen:
 * Pot 1: Argentina, Spain, France, England, Portugal, Brazil, Netherlands.
 * Pot 2: Morocco, Croatia, Japan, Switzerland, Senegal, Colombia.
 * Pot 3: Egypt, Norway, Ivory Coast, Tunisia, Algeria, Saudi Arabia, Australia, Ghana, Paraguay, Sweden, Czechia, South Africa, Türkiye.
 */
export function getTeamBaseWinPoints(team, settings) {
  const t = normalizeTeamName(team);
  
  const pot1 = ['argentina', 'spain', 'france', 'england', 'portugal', 'brazil', 'netherlands'];
  const pot2 = ['morocco', 'croatia', 'japan', 'switzerland', 'senegal', 'colombia'];
  
  if (pot1.includes(t)) {
    return settings.pot1WinPoints || 3;
  } else if (pot2.includes(t)) {
    return settings.pot2WinPoints || 4;
  } else {
    // Default to Pot 3
    return settings.pot3WinPoints || 5;
  }
}

export function getTeamBaseDrawPoints(team, settings) {
  const t = normalizeTeamName(team);
  
  const pot1 = ['argentina', 'spain', 'france', 'england', 'portugal', 'brazil', 'netherlands'];
  const pot2 = ['morocco', 'croatia', 'japan', 'switzerland', 'senegal', 'colombia'];
  
  if (pot1.includes(t)) {
    return settings.pot1DrawPoints !== undefined ? settings.pot1DrawPoints : 1;
  } else if (pot2.includes(t)) {
    return settings.pot2DrawPoints !== undefined ? settings.pot2DrawPoints : 2;
  } else {
    // Default to Pot 3
    return settings.pot3DrawPoints !== undefined ? settings.pot3DrawPoints : 3;
  }
}
