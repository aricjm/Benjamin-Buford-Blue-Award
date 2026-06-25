require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const cors = require('cors');
const db = require('./db');
const api = require('./api');
const scheduler = require('./scheduler');

const app = express();
const PORT = process.env.PORT || 4000;
const DEFAULT_SEASON = new Date().getUTCFullYear().toString();

app.use(cors());
app.use(express.json());

function getSeason(req) {
  return req.query.season || DEFAULT_SEASON;
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/players', async (req, res) => {
  try {
    const players = await db.getPlayers();
    res.json(players);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/teams', async (req, res) => {
  try {
    const teams = await db.getTeams();
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/seasons', async (req, res) => {
  try {
    const seasons = await db.getSeasons();
    res.json(seasons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/weeks', async (req, res) => {
  try {
    const season = getSeason(req);
    const weeks = await db.getWeeks(season);
    res.json(weeks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/week/:week/games', async (req, res) => {
  try {
    const week = Number(req.params.week);
    const season = getSeason(req);
    let games = await db.getWeekGames(week, season);
    if (!games.length) {
      const gamesFromApi = await api.fetchWeekGames(week, season);
      await db.saveGamesForWeek(week, gamesFromApi, season);
      games = await db.getWeekGames(week, season);
    }
    const picks = await db.getPicksByWeek(week, season);
    const summary = await db.getWeekSummary(week, season);
    res.json({ games, picks, summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/week/:week/picks', async (req, res) => {
  try {
    const week = Number(req.params.week);
    const season = getSeason(req);
    const { player, picks } = req.body;
    if (!player || !Array.isArray(picks)) {
      return res.status(400).json({ error: 'player and picks array are required' });
    }

    // Clear existing picks for this player, week, and season 
    // to allow for removals (selecting "Neither")
    await db.deletePicksForPlayerWeek(player, week, season);

    const saved = [];
    for (const pick of picks) {
      saved.push(await db.savePick(week, player, pick));
    }
    const summary = await db.getWeekSummary(week, season);
    res.json({ saved, summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/week/:week/games', async (req, res) => {
  try {
    const week = Number(req.params.week);
    const season = getSeason(req);
    const {
      home_team,
      away_team,
      commence_time,
      site,
      is_televised,
      is_mandatory,
      spread_home,
      spread_away,
      home_price,
      away_price
    } = req.body;
    if (!home_team || !away_team || !commence_time) {
      return res.status(400).json({ error: 'home_team, away_team, and commence_time are required' });
    }
    const gameId = await db.saveManualGame(week, season, {
      home_team,
      away_team,
      commence_time,
      site,
      is_televised,
      is_mandatory,
      spread_home,
      spread_away,
      home_price,
      away_price
    });
    const games = await db.getWeekGames(week, season);
    res.json({ gameId, games });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/week/:week/sync', async (req, res) => {
  try {
    const week = Number(req.params.week);
    const season = getSeason(req);
    const games = await api.fetchWeekGames(week, season);
    const updatedCount = await db.saveGamesForWeek(week, games, season);
    res.json({ updatedCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sync-all', async (req, res) => {
  try {
    const oddsGames = await api.fetchSeasonGames();
    const savedCount = await db.saveGamesForSeason(oddsGames);
    const scoreGames = await api.fetchSeasonScores();
    const updatedCount = await db.updateScoresFromSeason(scoreGames);
    res.json({ savedCount, updatedCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/week/:week/summary', async (req, res) => {
  try {
    const week = Number(req.params.week);
    const season = getSeason(req);
    const summary = await db.getWeekSummary(week, season);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/week/:week/picks', async (req, res) => {
  try {
    const week = Number(req.params.week);
    const season = getSeason(req);
    const picks = await db.getPicksByWeek(week, season);
    res.json(picks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/game/:id', async (req, res) => {
  try {
    const gameId = Number(req.params.id);
    const { spread_home, spread_away, home_price, away_price } = req.body;
    const game = await db.updateGameLine(gameId, {
      spread_home: spread_home !== undefined ? spread_home : null,
      spread_away: spread_away !== undefined ? spread_away : null,
      home_price: home_price !== undefined ? home_price : null,
      away_price: away_price !== undefined ? away_price : null
    });
    res.json({ success: true, game });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/pick/:id', async (req, res) => {
  try {
    const pickId = Number(req.params.id);
    const { selection_team, selection_side, spread } = req.body;
    const pick = await db.updatePick(pickId, {
      selection_team,
      selection_side,
      spread: spread !== undefined ? spread : null
    });
    res.json({ success: true, pick });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/mappings', async (req, res) => {
  try {
    const mappings = await db.getTeamMappings();
    res.json(mappings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/mappings', async (req, res) => {
  try {
    const { api_name, team_id } = req.body;
    if (!api_name || !team_id) {
      return res.status(400).json({ error: 'api_name and team_id are required' });
    }
    await db.addTeamMapping(api_name, team_id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/mapping/:id', async (req, res) => {
  try {
    await db.deleteTeamMapping(Number(req.params.id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/season/:season/summary', async (req, res) => {
  try {
    const season = String(req.params.season);
    const summary = await db.getSeasonSummary(season);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stats/:player', async (req, res) => {
  try {
    const stats = await db.getPlayerStats(req.params.player);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stats/:player/conference', async (req, res) => {
  try {
    const { conference, range, week, season } = req.query;
    const stats = await db.getConferenceStats(req.params.player, conference, range, Number(week), season);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/summary/alltime', async (req, res) => {
  try {
    const summary = await db.getAllTimeSummary();
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

(async () => {
  if (process.env.VERCEL !== '1') {
    try {
      await db.init();
      await db.seedPlayers();
      await db.seedTeams();
      await db.seedWeeks();
      await db.seedTestData();
      scheduler.start(db);
      app.listen(PORT, () => {
        console.log(`Backend API listening on http://localhost:${PORT}`);
      });
    } catch (error) {
      console.error('Failed to start backend', error);
      process.exit(1);
    }
  } else {
    // On Vercel, we only ensure the database tables exist.
    db.init().catch(err => console.error('Database initialization failed', err));
  }
})();

module.exports = app;
