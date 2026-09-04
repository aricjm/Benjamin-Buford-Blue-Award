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

// Configure CORS
const corsOptions = {
  origin: process.env.VERCEL === '1' 
    ? [process.env.FRONTEND_URL || 'https://my-bbba-app.vercel.app'] // Replace with your actual Vercel URL
    : '*', // Allow all in local development
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(compression()); // Enable Gzip compression for all responses
app.use(express.json());

function getSeason(req) {
  return req.query.season || DEFAULT_SEASON;
}

// Simple Admin Authentication Middleware
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'bbba-admin-2026';

function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${ADMIN_PASSWORD}`) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing admin token' });
  }
  next();
}

// Ensure database is initialized before handling requests on Vercel
let dbInitPromise = null;
app.use(async (req, res, next) => {
  if (process.env.VERCEL === '1') {
    // Skip db.init() on Vercel to avoid permission issues with information_schema
    // We assume the schema is already set up via local init_db.js
    if (!dbInitPromise) {
      console.log(`[Vercel Init] Starting serverless function. Database dialect configured as: ${db.getDialect()}`);
      if (db.getDialect() === 'postgres') {
        console.log(`[Vercel Init] POSTGRES_URL is present. Connecting to PostgreSQL...`);
      } else {
        console.warn(`[Vercel Init] WARNING: POSTGRES_URL is missing! Falling back to SQLite.`);
      }
      dbInitPromise = Promise.resolve();
    }
    try {
      await dbInitPromise;
    } catch (err) {
      console.error(`[Vercel Init] Database initialization failed:`, err);
      return res.status(500).json({ error: 'Database initialization failed' });
    }
  }
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', dialect: db.getDialect() });
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

app.get('/api/week/:week/odds-history', async (req, res) => {
  try {
    const week = Number(req.params.week);
    const season = getSeason(req);
    const history = await db.getOddsHistoryForWeek(week, season);
    res.json({ history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Track last ESPN sync time per week to avoid writing on every page load
const lastEspnSync = new Map();
const ESPN_SYNC_TTL_MS = 5 * 60 * 1000; // 5 minutes

app.get('/api/week/:week/games', async (req, res) => {
  app.get('/api/model-games', async (req, res) => {
    try {
      const games = await db.getModelTestGames(10);
      res.json({ games });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  try {
    const week = Number(req.params.week);
    const season = getSeason(req);
    // Only fetch live from ESPN for the current season — historical seasons are already in the DB
    if (season === DEFAULT_SEASON) {
      const syncKey = `${season}_${week}`;
      const lastSync = lastEspnSync.get(syncKey) || 0;
      if (Date.now() - lastSync > ESPN_SYNC_TTL_MS) {
        const gamesFromApi = await api.fetchWeekGames(week, season);
        await db.saveGamesForWeek(week, gamesFromApi, season);
        lastEspnSync.set(syncKey, Date.now());
      }
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

app.post('/api/week/:week/games', requireAdmin, async (req, res) => {
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

app.post('/api/week/:week/sync', requireAdmin, async (req, res) => {
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

app.post('/api/sync-all', requireAdmin, async (req, res) => {
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
app.post('/api/import-historical', requireAdmin, async (req, res) => {
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

app.get('/api/games/:id/insights', async (req, res) => {
  try {
    const gameId = Number(req.params.id);
    const insights = await db.getGameInsights(gameId);
    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/games/:id/insights', async (req, res) => {
  try {
    const gameId = Number(req.params.id);
    const { player, comment } = req.body;
    if (!player || !comment) {
      return res.status(400).json({ error: 'player and comment are required' });
    }
    const updated = await db.addGameInsight(gameId, player, comment);
    res.json({ success: true, insights: updated });
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

app.put('/api/game/:id', requireAdmin, async (req, res) => {
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

app.put('/api/pick/:id', requireAdmin, async (req, res) => {
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

app.put('/api/picks/lock', requireAdmin, async (req, res) => {
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

app.post('/api/mappings', requireAdmin, async (req, res) => {
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

app.delete('/api/mapping/:id', requireAdmin, async (req, res) => {
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

app.get('/api/bbbmlp', async (req, res) => {
  try {
    const season = req.query.season || null;
    const result = await db.getBBBMLPData(season);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/bbbmlp/current', async (req, res) => {
  try {
    const result = await db.getCurrentWeekLocks();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/matchup-stats', async (req, res) => {
  try {
    const { homeTeam, awayTeam, apiGameId } = req.query;
    if (!homeTeam || !awayTeam) {
      return res.status(400).json({ error: 'homeTeam and awayTeam are required' });
    }

    // 1. Get head-to-head history from database
    const h2h = await db.getHeadToHeadHistory(homeTeam, awayTeam);

    // 2. Get team research stats (ATS, O/U, and recent games for streaks)
    const [homeResearch, awayResearch] = await Promise.all([
      db.getTeamResearchStats(homeTeam, 'All-Time'),
      db.getTeamResearchStats(awayTeam, 'All-Time')
    ]);

    const formatResearchStats = (r) => {
      // Get last 5 games for streak
      const last5 = r.recent.slice(0, 5);
      const atsStreak = last5.map(g => g.atsResult === 'win' ? 'W' : g.atsResult === 'loss' ? 'L' : 'P').join('-');
      const ouStreak = last5.map(g => g.ouResult === 'over' ? 'O' : g.ouResult === 'under' ? 'U' : 'P').join('-');

      return {
        ats: {
          overall: `${r.ats.wins}-${r.ats.losses}-${r.ats.pushes}`,
          home: `${r.atsHome.wins}-${r.atsHome.losses}-${r.atsHome.pushes}`,
          away: `${r.atsAway.wins}-${r.atsAway.losses}-${r.atsAway.pushes}`,
          favorite: `${r.atsFav.wins}-${r.atsFav.losses}-${r.atsFav.pushes}`,
          underdog: `${r.atsDog.wins}-${r.atsDog.losses}-${r.atsDog.pushes}`
        },
        ou: {
          overall: `${r.ou.overs}-${r.ou.unders}-${r.ou.pushes}`,
          home: `${r.ouHome.overs}-${r.ouHome.unders}-${r.ouHome.pushes}`,
          away: `${r.ouAway.overs}-${r.ouAway.unders}-${r.ouAway.pushes}`
        },
        streak: {
          ats: atsStreak || 'N/A',
          ou: ouStreak || 'N/A'
        }
      };
    };

    const researchStats = {
      home: formatResearchStats(homeResearch),
      away: formatResearchStats(awayResearch)
    };

    // 3. Fetch ESPN stats if apiGameId is provided
    let espnStats = null;
    if (apiGameId) {
      const axios = require('axios');
      try {
        // Fetch game summary to get team IDs
        const summaryRes = await axios.get(`https://site.api.espn.com/apis/site/v2/sports/football/college-football/summary?event=${apiGameId}`);
        const competitors = summaryRes.data?.header?.competitions?.[0]?.competitors || [];
        
        const homeCompetitor = competitors.find(c => c.homeAway === 'home');
        const awayCompetitor = competitors.find(c => c.homeAway === 'away');

        if (homeCompetitor?.id && awayCompetitor?.id) {
          // Fetch stats for both teams
          const [homeStatsRes, awayStatsRes] = await Promise.all([
            axios.get(`https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/${homeCompetitor.id}/statistics`),
            axios.get(`https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/${awayCompetitor.id}/statistics`)
          ]);

          const parseStats = (data) => {
            const stats = {};
            const findStat = (categories, catName, statName) => {
              const cat = categories.find(c => c.name === catName);
              const stat = cat?.stats?.find(s => s.name === statName);
              return stat ? parseFloat(stat.displayValue.replace(/,/g, '')) : null;
            };
            const findStatString = (categories, catName, statName) => {
              const cat = categories.find(c => c.name === catName);
              const stat = cat?.stats?.find(s => s.name === statName);
              return stat ? stat.displayValue : null;
            };

            const cats = data.results?.stats?.categories || [];
            const oppCats = data.results?.opponent || [];

            stats.scoringOffense = findStat(cats, 'scoring', 'totalPointsPerGame');
            stats.scoringDefense = findStat(oppCats, 'scoring', 'totalPointsPerGame');

            const totalYards = findStat(cats, 'rushing', 'totalYards');
            const totalPlays = findStat(cats, 'rushing', 'totalOffensivePlays');
            stats.yardsPerPlay = totalYards && totalPlays ? parseFloat((totalYards / totalPlays).toFixed(2)) : null;

            const totalYardsAllowed = findStat(oppCats, 'rushing', 'totalYards');
            const totalPlaysAllowed = findStat(oppCats, 'rushing', 'totalOffensivePlays');
            stats.yardsPerPlayAllowed = totalYardsAllowed && totalPlaysAllowed ? parseFloat((totalYardsAllowed / totalPlaysAllowed).toFixed(2)) : null;

            stats.turnoverMargin = findStatString(cats, 'miscellaneous', 'turnOverDifferential');
            return stats;
          };

          espnStats = {
            home: parseStats(homeStatsRes.data),
            away: parseStats(awayStatsRes.data)
          };
        }
      } catch (err) {
        console.error('Failed to fetch ESPN matchup stats:', err.message);
      }
    }

    res.json({ h2h, researchStats, espnStats });
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

app.get('/api/experts/tweets', async (req, res) => {
  try {
    const handle = req.query.handle || null;
    const tweets = await api.fetchExpertTweets(handle);
    res.json(tweets);
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
app.get('/api/queue/picks', requireAdmin, async (req, res) => {
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
app.post('/api/queue/flush', requireAdmin, async (req, res) => {
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
app.post('/api/queue/retry/:id', requireAdmin, async (req, res) => {
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
app.delete('/api/queue/picks/:id', requireAdmin, async (req, res) => {
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
app.post('/api/queue/retry/:id/pick/:index', requireAdmin, async (req, res) => {
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

// --- Vercel Cron Job Endpoints ---

// Middleware to verify Vercel Cron requests
function requireCronAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    console.warn('CRON_SECRET is not set in environment variables.');
    // If no secret is set, we allow it for local testing, but warn.
    // In production, you MUST set CRON_SECRET.
    return next();
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized: Invalid CRON_SECRET' });
  }
  next();
}

app.get('/api/cron/sync-daily', requireCronAuth, async (req, res) => {
  try {
    console.log('[cron] syncing season games, scores, spreads, and over/unders');
    const games = await api.fetchSeasonGames();
    const savedCount = await db.saveGamesForSeason(games);
    const scoreUpdates = await api.fetchSeasonScores();
    const updatedCount = await db.updateScoresFromSeason(scoreUpdates);
    res.json({ success: true, savedCount, updatedCount });
  } catch (error) {
    console.error('[cron] daily sync failed', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/cron/sync-live', requireCronAuth, async (req, res) => {
  try {
    const activeWeeks = await db.getInProgressWeeks();
    let updatedCount = 0;
    
    if (activeWeeks.length > 0) {
      console.log(`[cron] found ${activeWeeks.length} active week(s). Syncing live scores...`);
      for (const { season, week } of activeWeeks) {
        const scoreUpdates = await api.fetchWeekScores(week, season);
        updatedCount += await db.updateScoresFromSeason(scoreUpdates);
      }
    }
    
    // Attempt to flush pending picks
    let flushResult = { processed: 0 };
    try { 
      const flusher = require('./flush_pending_picks'); 
      flushResult = await flusher.flushOnce(db); 
    } catch(e) { 
      console.error('[cron] Pending flush error', e.message); 
    }
    
    res.json({ success: true, updatedCount, flushed: flushResult.processed });
  } catch (error) {
    console.error('[cron] live sync failed', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/cron/sync-odds', requireCronAuth, async (req, res) => {
  try {
    console.log('[cron] syncing odds and lines');
    const games = await api.fetchSeasonGames();
    const savedCount = await db.saveGamesForSeason(games);
    res.json({ success: true, savedCount });
  } catch (error) {
    console.error('[cron] odds sync failed', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/cron/sync-rankings', requireCronAuth, async (req, res) => {
  try {
    console.log('[cron] syncing Top 25 rankings');
    const season = req.query.season || getSeason(req);
    const week = req.query.week !== undefined ? Number(req.query.week) : null;
    const ranks = await api.fetchRankings(season, week);
    const savedCount = await db.saveRankings(ranks, season, week);
    res.json({ success: true, savedCount, count: ranks.length });
  } catch (error) {
    console.error('[cron] rankings sync failed', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/rankings', async (req, res) => {
  try {
    const season = req.query.season || getSeason(req);
    const week = req.query.week !== undefined && req.query.week !== '' ? req.query.week : null;
    const pollId = req.query.pollId || '1';

    let rankings = await db.getRankingsHistory(season, week, pollId);

    // If no rankings are in database yet, fetch live from ESPN and save
    if (!rankings || rankings.length === 0) {
      const liveRanks = await api.fetchRankings(season, week, pollId);
      if (liveRanks.length > 0) {
        await db.saveRankings(liveRanks, season, week);
        rankings = await db.getRankingsHistory(season, week, pollId);
      }
    }

    res.json(rankings || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/rankings/weeks', async (req, res) => {
  try {
    const season = req.query.season || getSeason(req);
    const weeks = await db.getRankingsWeeks(season);
    res.json(weeks);
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
  }
})();

module.exports = app;
