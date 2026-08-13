export const leagueTeams: Record<string, string[]> = {
  "Brasileirão": ["Flamengo", "Palmeiras", "Corinthians", "São Paulo", "Vasco", "Fluminense", "Botafogo", "Atlético-MG", "Cruzeiro", "Grêmio", "Internacional", "Bahia", "Santos", "Sport", "Outro"],
  "Copa do Brasil": ["Flamengo", "Palmeiras", "Corinthians", "São Paulo", "Vasco", "Fluminense", "Botafogo", "Atlético-MG", "Cruzeiro", "Grêmio", "Internacional", "Bahia", "Santos", "Outro"],
  "Libertadores": ["Flamengo", "Palmeiras", "River Plate", "Boca Juniors", "Peñarol", "Nacional", "Colo-Colo", "Atlético Nacional", "LDU", "Olimpia", "Outro"],
  "Champions League": ["Real Madrid", "Barcelona", "Manchester City", "Manchester United", "Liverpool", "Arsenal", "Chelsea", "Bayern de Munique", "Borussia Dortmund", "PSG", "Inter de Milão", "Milan", "Juventus", "Outro"],
  "Premier League": ["Manchester City", "Manchester United", "Liverpool", "Arsenal", "Chelsea", "Tottenham", "Newcastle", "Aston Villa", "Everton", "West Ham", "Outro"],
  "La Liga": ["Real Madrid", "Barcelona", "Atlético de Madrid", "Sevilla", "Valencia", "Athletic Bilbao", "Villarreal", "Real Betis", "Outro"],
  "Outro": ["Outro"],
};

export const leagueOptions = Object.keys(leagueTeams);

export function teamsForLeague(league: string, savedTeam?: string) {
  const teams = leagueTeams[league] ?? ["Outro"];
  if (savedTeam && !teams.includes(savedTeam)) return [savedTeam, ...teams];
  return teams;
}
