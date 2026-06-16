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

app.get('/api/players', (req, res) => {
  try {
    const players = db.getPlayers();
    res.json(players);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/teams', (req, res) => {
  try {
    const teams = db.getTeams();
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/seasons', (req, res) => {
  try {
    const seasons = db.getSeasons();
    res.json(seasons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/weeks', (req, res) => {
  try {
    const season = getSeason(req);
    const weeks = db.getWeeks(season);
    res.json(weeks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/week/:week/games', async (req, res) => {
  try {
    const week = Number(req.params.week);
    const season = getSeason(req);
    let games = db.getWeekGames(week, season);
    if (!games.length) {
      const gamesFromApi = await api.fetchWeekGames(week, season);
      db.saveGamesForWeek(week, gamesFromApi, season);
      games = db.getWeekGames(week, season);
    }
    const picks = db.getPicksByWeek(week, season);
    const summary = db.getWeekSummary(week, season);
    res.json({ games, picks, summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/week/:week/picks', (req, res) => {
  try {
    const week = Number(req.params.week);
    const season = getSeason(req);
    const { player, picks } = req.body;
    if (!player || !Array.isArray(picks)) {
      return res.status(400).json({ error: 'player and picks array are required' });
    }

    // Clear existing picks for this player, week, and season 
    // to allow for removals (selecting "Neither")
    db.deletePicksForPlayerWeek(player, week, season);

    const saved = [];
    for (const pick of picks) {
      saved.push(db.savePick(week, player, pick));
    }
    const summary = db.getWeekSummary(week, season);
    res.json({ saved, summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/week/:week/games', (req, res) => {
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
    const gameId = db.saveManualGame(week, season, {
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
    const games = db.getWeekGames(week, season);
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
    const updatedCount = db.saveGamesForWeek(week, games, season);
    res.json({ updatedCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sync-all', async (req, res) => {
  try {
    const oddsGames = await api.fetchSeasonGames();
    const savedCount = db.saveGamesForSeason(oddsGames);
    const scoreGames = await api.fetchSeasonScores();
    const updatedCount = db.updateScoresFromSeason(scoreGames);
    res.json({ savedCount, updatedCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/week/:week/summary', (req, res) => {
  try {
    const week = Number(req.params.week);
    const season = getSeason(req);
    const summary = db.getWeekSummary(week, season);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/week/:week/picks', (req, res) => {
  try {
    const week = Number(req.params.week);
    const season = getSeason(req);
    const picks = db.getPicksByWeek(week, season);
    res.json(picks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/game/:id', (req, res) => {
  try {
    const gameId = Number(req.params.id);
    const { spread_home, spread_away, home_price, away_price } = req.body;
    const game = db.updateGameLine(gameId, {
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

app.put('/api/pick/:id', (req, res) => {
  try {
    const pickId = Number(req.params.id);
    const { selection_team, selection_side, spread } = req.body;
    const pick = db.updatePick(pickId, {
      selection_team,
      selection_side,
      spread: spread !== undefined ? spread : null
    });
    res.json({ success: true, pick });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/mappings', (req, res) => {
  try {
    const mappings = db.getTeamMappings();
    res.json(mappings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/mappings', (req, res) => {
  try {
    const { api_name, team_id } = req.body;
    if (!api_name || !team_id) {
      return res.status(400).json({ error: 'api_name and team_id are required' });
    }
    db.addTeamMapping(api_name, team_id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/mapping/:id', (req, res) => {
  try {
    db.deleteTeamMapping(Number(req.params.id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/season/:season/summary', (req, res) => {
  try {
    const season = String(req.params.season);
    const summary = db.getSeasonSummary(season);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stats/:player', (req, res) => {
  try {
    const stats = db.getPlayerStats(req.params.player);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stats/:player/conference', (req, res) => {
  try {
    const { conference, range, week, season } = req.query;
    const stats = db.getConferenceStats(req.params.player, conference, range, Number(week), season);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/summary/alltime', (req, res) => {
  try {
    const summary = db.getAllTimeSummary();
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

(async () => {
  try {
    await db.init();
    await db.seedPlayers();
    await db.seedTeams();
    await db.seedWeeks();
    db.seedTestData();
    scheduler.start(db);
    app.listen(PORT, () => {
      console.log(`Backend API listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start backend', error);
    process.exit(1);
  }
})();
