const { getWeekNumberFromDate, getSeasonFromDate } = require('./utils');

const API_KEY = process.env.ODDS_API_KEY || '2cb8e2786b5a2c43c58bbbefb50394ce';
const BASE_URL = 'https://api.the-odds-api.com/v4';
const SPORT_KEY = 'americanfootball_ncaaf';
const DEFAULT_SEASON = new Date().getUTCFullYear().toString();

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Odds API error ${response.status}: ${payload}`);
  }
  return response.json();
}

function parseMarketSpreads(event) {
  const firstBookmaker = event.bookmakers?.[0];
  if (!firstBookmaker) return {};
  const spreadMarket = firstBookmaker.markets?.find((market) => market.key === 'spreads');
  if (!spreadMarket) return {};

  const homeOutcome = spreadMarket.outcomes.find((item) => item.name === event.home_team);
  const awayOutcome = spreadMarket.outcomes.find((item) => item.name === event.away_team);

  return {
    spread_home: homeOutcome?.point ?? null,
    spread_away: awayOutcome?.point ?? null,
    home_price: homeOutcome?.price ?? null,
    away_price: awayOutcome?.price ?? null
  };
}

function mapGame(event) {
  const week = getWeekNumberFromDate(event.commence_time);
  const season = getSeasonFromDate(event.commence_time) || DEFAULT_SEASON;
  const spreads = parseMarketSpreads(event);
  return {
    api_game_id: event.id,
    week,
    season,
    commence_time: event.commence_time,
    home_team: event.home_team,
    away_team: event.away_team,
    site: event.bookmakers?.[0]?.title || 'N/A',
    is_televised: 0,
    is_mandatory: 0,
    spread_home: spreads.spread_home,
    spread_away: spreads.spread_away,
    home_price: spreads.home_price,
    away_price: spreads.away_price,
    score_home: null,
    score_away: null,
    completed: false
  };
}

function mapScore(event) {
  const scores = event.scores || [];
  const homeScore = scores.find((item) => item.name === event.home_team)?.score;
  const awayScore = scores.find((item) => item.name === event.away_team)?.score;

  return {
    api_game_id: event.id,
    score_home: homeScore ?? null,
    score_away: awayScore ?? null,
    completed: event.completed === true
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

async function fetchSeasonGames() {
  const url = `${BASE_URL}/sports/${SPORT_KEY}/odds/?regions=us&markets=spreads&oddsFormat=american&dateFormat=iso&apiKey=${API_KEY}`;
  const data = await fetchJson(url);
  return data.map(mapGame).filter((game) => game.week !== null);
}

async function fetchWeekGames(week, season = DEFAULT_SEASON) {
  const games = await fetchSeasonGames();
  const weekGames = games.filter((game) => game.week === week && game.season === season);
  const selectedCount = Math.min(5, weekGames.length);
  const indices = shuffle([...Array(weekGames.length).keys()]).slice(0, selectedCount);
  const televisedSet = new Set(indices);
  return weekGames.map((game, index) => ({
    ...game,
    is_televised: televisedSet.has(index) ? 1 : 0,
    is_mandatory: televisedSet.has(index) ? 1 : 0
  }));
}

async function fetchSeasonScores() {
  const url = `${BASE_URL}/sports/${SPORT_KEY}/scores/?apiKey=${API_KEY}`;
  const data = await fetchJson(url);
  return data.map(mapScore);
}

module.exports = {
  fetchSeasonGames,
  fetchWeekGames,
  fetchSeasonScores
};
