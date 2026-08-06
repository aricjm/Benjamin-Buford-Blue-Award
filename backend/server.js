require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const db = require('./db');
const api = require('./api');
const scheduler = require('./scheduler');

const app = express();
const PORT = process.env.PORT || 4000;
const DEFAULT_SEASON = new Date().getUTCFullYear().toString();

app.use(cors());
app.use(compression()); // Enable Gzip compression for all responses
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
    // Only fetch live from ESPN for the current season — historical seasons are already in the DB
    if (season === DEFAULT_SEASON) {
      const gamesFromApi = await api.fetchWeekGames(week, season);
      await db.saveGamesForWeek(week, gamesFromApi, season);
    }
    const games = await db.getWeekGames(week, season);
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

// Import historical seasons from ESPN API (regular season weeks 1-15)
app.post('/api/import-historical', async (req, res) => {
  const { seasons = [2022, 2023, 2024, 2025], weeks = Array.from({ length: 15 }, (_, i) => i + 1) } = req.body;

  const results = [];
  let totalGames = 0;
  const failed = [];

  for (const season of seasons) {
    for (const week of weeks) {
      try {
        const games = await api.fetchWeekGames(week, season.toString());
        if (games.length > 0) {
          // Ensure week row exists
          await db.ensureWeekRow(season.toString(), week);
          const saved = await db.saveGamesForWeek(week, games, season.toString());
          totalGames += saved;
          results.push({ season, week, saved });
        } else {
          results.push({ season, week, saved: 0 });
        }
        // Small delay to be polite to ESPN API
        await new Promise((r) => setTimeout(r, 400));
      } catch (err) {
        failed.push({ season, week, error: err.message });
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }

  res.json({ totalGames, results, failed });
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

app.get('/api/season/:season/awards', async (req, res) => {
  try {
    const season = req.params.season;
    const awards = await db.getSeasonAwards(season);
    res.json(awards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/player/:player/awards', async (req, res) => {
  try {
    const player = req.params.player;
    const awards = await db.getPlayerAwards(player);
    res.json(awards);
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

app.put('/api/picks/lock', async (req, res) => {
  try {
    const { player, week, season, gameId, lockType } = req.body;
    if (!player || !week || !season || !gameId || !lockType) {
      return res.status(400).json({ error: 'player, week, season, gameId, and lockType are required' });
    }
    await db.setHistoricalLock(player, Number(week), season, Number(gameId), lockType);
    res.json({ success: true });
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

app.get('/api/stats/leaders', async (req, res) => {
  try {
    const { range, week, season } = req.query;
    const players = await db.getPlayers();
    const allStats = await Promise.all(
      players.map(async (p) => {
        const stats = await db.getPlayerStats(p.name, range || null, Number(week) || null, season || null);
        return { player: p.name, ...stats };
      })
    );
    res.json(allStats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stats/:player', async (req, res) => {
  try {
    const { range, week, season } = req.query;
    const stats = await db.getPlayerStats(req.params.player, range || null, Number(week) || null, season || null);
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

app.get('/api/stats/:player/ally-nemesis', async (req, res) => {
  try {
    const { conference } = req.query;
    const result = await db.getAllyNemesisByConference(req.params.player, conference || null);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stats/:player/conferences', async (req, res) => {
  try {
    const result = await db.getPlayerConferenceStats(req.params.player);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stats/:player/teams', async (req, res) => {
  try {
    const { conference } = req.query;
    const result = await db.getPlayerTeamStats(req.params.player, conference || null);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stats/:player/faded-teams', async (req, res) => {
  try {
    const { conference } = req.query;
    const result = await db.getPlayerFadedTeamStats(req.params.player, conference || null);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stats/:player/trend', async (req, res) => {
  try {
    const { range, week, season, conference } = req.query;
    const result = await db.getPlayerTrend(req.params.player, range || null, Number(week) || null, season || null, conference || null);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/research/rankings', async (req, res) => {
  try {
    const { entity, stat, location, role, minGames, conference, range, week, season } = req.query;
    const result = await db.getResearchRankings(
      entity || 'school',
      stat || 'su',
      location || 'both',
      role || 'either',
      minGames || 1,
      conference || null,
      range || null,
      Number(week) || null,
      season || null
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/research/conference/:conference', async (req, res) => {
  try {
    const { range, week, season } = req.query;
    const result = await db.getConferenceResearchStats(req.params.conference, range || null, Number(week) || null, season || null);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/research/:team', async (req, res) => {
  try {
    const { range, week, season } = req.query;
    const result = await db.getTeamResearchStats(req.params.team, range || null, Number(week) || null, season || null);
    res.json(result);
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

app.get('/api/injuries', async (req, res) => {
  try {
    const injuries = await api.fetchInjuries();
    res.json(injuries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Queue endpoint: accept picks and append to pending JSONL file for later flushing
const fs = require('fs');
const path = require('path');
const PENDING_PATH = path.join(__dirname, '..', 'backend', 'pending-picks.jsonl');

app.post('/api/queue/picks', async (req, res) => {
  try {
    const { week, season, player, picks } = req.body;
    if (!player || !Array.isArray(picks) || week === undefined || !season) {
      return res.status(400).json({ error: 'week, season, player and picks are required' });
    }

    const entry = {
      id: Date.now() + '-' + Math.floor(Math.random() * 10000),
      createdAt: new Date().toISOString(),
      attempts: 0,
      week: Number(week),
      season: String(season),
      player,
      picks
    };

    fs.appendFileSync(PENDING_PATH, JSON.stringify(entry) + '\n', { encoding: 'utf8' });
    res.status(202).json({ accepted: true, id: entry.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: list queued picks
app.get('/api/queue/picks', async (req, res) => {
  try {
    if (!fs.existsSync(PENDING_PATH)) return res.json([]);
    const lines = fs.readFileSync(PENDING_PATH, 'utf8').split('\n').filter(Boolean);
    const items = lines.map(l => {
      try { return JSON.parse(l); } catch (e) { return { raw: l }; }
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: trigger immediate flush attempt (best-effort)
app.post('/api/queue/flush', async (req, res) => {
  try {
    // Run the flusher script programmatically
    const flusher = require('./flush_pending_picks');
    const result = await flusher.flushOnce(db);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Retry a single queued item by id
app.post('/api/queue/retry/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const flusher = require('./flush_pending_picks');
    const result = await flusher.flushOne(db, id);
    if (result.error === 'not-found') return res.status(404).json({ error: 'not found' });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a queued item (admin) by id
app.delete('/api/queue/picks/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const fs = require('fs');
    const path = require('path');
    const PENDING_PATH = path.join(__dirname, 'pending-picks.jsonl');
    if (!fs.existsSync(PENDING_PATH)) return res.status(404).json({ error: 'not found' });
    const lines = fs.readFileSync(PENDING_PATH, 'utf8').split('\n').filter(Boolean);
    const remaining = [];
    let found = false;
    for (const l of lines) {
      try {
        const item = JSON.parse(l);
        if (item.id === id) { found = true; continue; }
        remaining.push(item);
      } catch (e) { remaining.push(l); }
    }
    fs.writeFileSync(PENDING_PATH, remaining.map(r => JSON.stringify(r)).join('\n') + (remaining.length ? '\n' : ''), 'utf8');
    if (!found) return res.status(404).json({ error: 'not found' });
    res.json({ deleted: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Retry a single pick within a queued item
app.post('/api/queue/retry/:id/pick/:index', async (req, res) => {
  try {
    const { id, index } = req.params;
    const flusher = require('./flush_pending_picks');
    const result = await flusher.flushOnePick(db, id, index);
    if (result.error === 'not-found' || result.error === 'no-file') return res.status(404).json({ error: 'not found' });
    res.json(result);
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
