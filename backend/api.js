const { getWeekNumberFromDate, getSeasonFromDate } = require('./utils');
const axios = require('axios');

const BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/college-football';
const DEFAULT_SEASON = new Date().getUTCFullYear().toString();

async function fetchJson(url) {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    throw new Error(`ESPN API error: ${error.message}`);
  }
}

function mapGame(event) {
  const competition = event.competitions[0];
  const homeCompetitor = competition.competitors.find(c => c.homeAway === 'home');
  const awayCompetitor = competition.competitors.find(c => c.homeAway === 'away');

  const odds = competition.odds?.[0] || {};
  const spread = odds.details ? parseFloat(odds.details.split(' ')[1]) : null;

  let spread_home = null;
  let spread_away = null;

  if (spread !== null && !isNaN(spread)) {
      if (odds.favorite?.homeAway === 'home') {
          spread_home = spread;
          spread_away = -spread;
      } else if (odds.favorite?.homeAway === 'away') {
          spread_away = spread;
          spread_home = -spread;
      }
  }

  return {
    api_game_id: event.id,
    week: event.week.number,
    season: event.season.year.toString(),
    commence_time: event.date,
    home_team: homeCompetitor.team.displayName,
    away_team: awayCompetitor.team.displayName,
    site: competition.venue?.fullName || 'N/A',
    is_televised: competition.broadcasts?.length > 0 ? 1 : 0,
    is_mandatory: 0,
    spread_home,
    spread_away,
    home_price: null,
    away_price: null,
    score_home: homeCompetitor.score ? parseInt(homeCompetitor.score) : null,
    score_away: awayCompetitor.score ? parseInt(awayCompetitor.score) : null,
    completed: event.status.type.completed
  };
}

function mapScore(event) {
  const competition = event.competitions[0];
  const homeCompetitor = competition.competitors.find(c => c.homeAway === 'home');
  const awayCompetitor = competition.competitors.find(c => c.homeAway === 'away');

  return {
    api_game_id: event.id,
    score_home: homeCompetitor.score ? parseInt(homeCompetitor.score) : null,
    score_away: awayCompetitor.score ? parseInt(awayCompetitor.score) : null,
    completed: event.status.type.completed
  };
}

function shuffle(array) {
  const copied = array.slice();
  for (let i = copied.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }
  return copied;
}

async function fetchSeasonGames(season = DEFAULT_SEASON) {
  const url = `${BASE_URL}/scoreboard`;
  const data = await fetchJson(url);
  return data.events.map(mapGame);
}

async function fetchWeekGames(week, season = DEFAULT_SEASON) {
  const url = `${BASE_URL}/scoreboard?week=${week}&season=${season}`;
  const data = await fetchJson(url);
  const weekGames = data.events.map(mapGame);

  const selectedCount = Math.min(5, weekGames.length);
  const indices = shuffle([...Array(weekGames.length).keys()]).slice(0, selectedCount);
  const televisedSet = new Set(indices);
  return weekGames.map((game, index) => ({
    ...game,
    is_televised: televisedSet.has(index) ? 1 : 0,
    is_mandatory: televisedSet.has(index) ? 1 : 0
  }));
}

async function fetchSeasonScores(season = DEFAULT_SEASON) {
  const url = `${BASE_URL}/scoreboard`;
  const data = await fetchJson(url);
  return data.events.map(mapScore);
}

async function fetchInjuries() {
  const url = `${BASE_URL}/injuries`;
  const data = await fetchJson(url);

  const allInjuries = [];
  if (data.injuries && Array.isArray(data.injuries)) {
    for (const team of data.injuries) {
      if (team.injuries && Array.isArray(team.injuries)) {
        for (const injury of team.injuries) {
          allInjuries.push({
            team_id: team.id,
            team_name: team.displayName,
            player_name: injury.athlete?.displayName || 'Unknown',
            status: injury.status,
            date: injury.date,
            short_comment: injury.shortComment,
            long_comment: injury.longComment
          });
        }
      }
    }
  }
  return allInjuries;
}

module.exports = {
  fetchSeasonGames,
  fetchWeekGames,
  fetchSeasonScores,
  fetchInjuries
};
