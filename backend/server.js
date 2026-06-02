// server.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { readRange, appendRow, updateRange } = require('./sheets');
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(bodyParser.json());

/* Helper: parse sheet rows into objects (assumes header row) */
function rowsToObjects(rows) {
  if (!rows || rows.length === 0) return [];
  const headers = rows[0];
  return rows.slice(1).map(r => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = r[i] ?? '');
    return obj;
  });
}

/* GET weeks */
app.get('/api/weeks', async (req, res) => {
  const rows = await readRange('Weeks!A:Z');
  res.json(rowsToObjects(rows));
});

/* GET week details (games + picks) */
app.get('/api/week/:weekId', async (req, res) => {
  const weekId = req.params.weekId;
  const gamesRows = await readRange('Games!A:Z');
  const picksRows = await readRange('Picks!A:Z');
  const games = rowsToObjects(gamesRows).filter(g => g.WeekId === weekId);
  const picks = rowsToObjects(picksRows).filter(p => p.WeekId === weekId);
  res.json({ games, picks });
});

/* POST submit picks */
app.post('/api/week/:weekId/picks', async (req, res) => {
  const weekId = req.params.weekId;
  const { player, picks } = req.body; // picks: [{gameId, chosenTeam, chosenSide, chosenSpread}]
  if (!['Aric','Nick','Cisco'].includes(player)) return res.status(400).json({error:'Invalid player'});
  // Validate mandatory televised picks count = 5
  const televisedCount = picks.filter(p => p.isTelevised).length;
  if (televisedCount !== 5) return res.status(400).json({error:'Must pick exactly 5 televised games'});
  // Append each pick to Picks sheet
  for (const p of picks) {
    const row = [
      uuidv4(), weekId, p.gameId, player, p.chosenTeam, p.chosenSide, p.chosenSpread, new Date().toISOString(), 'undecided', ''
    ];
    await appendRow('Picks', row);
  }
  res.json({ success: true });
});

/* POST sync scores (cron or webhook) */
app.post('/api/games/sync', async (req, res) => {
  // Fetch games from sheet
  const gamesRows = await readRange('Games!A:Z');
  const games = rowsToObjects(gamesRows);
  // For each scheduled or live game, fetch latest score from sports API
  const apiBase = process.env.SPORTS_API_BASE;
  const apiKey = process.env.SPORTS_API_KEY;
  for (let i = 0; i < games.length; i++) {
    const g = games[i];
    if (g.Status === 'final') continue;
    // Example API call (provider dependent)
    const url = `${apiBase}/games/${g.GameId}?api_key=${apiKey}`;
    try {
      const r = await fetch(url);
      if (!r.ok) continue;
      const data = await r.json();
      // Map provider fields to our sheet fields
      const status = data.status; // scheduled/live/final
      const homeScore = data.homeScore;
      const awayScore = data.awayScore;
      const spreadHome = data.spreadHome; // provider spread
      // Update Games sheet row (find row index)
      // For simplicity, rewrite the entire Games sheet after updating objects
      g.Status = status;
      g.HomeScore = homeScore;
      g.AwayScore = awayScore;
      g.SpreadHome = spreadHome;
    } catch (err) {
      console.error('fetch error', err);
    }
  }
  // Write back updated games array to sheet (rebuild header + rows)
  // Read header first
  const gamesHeaderRows = await readRange('Games!A1:Z1');
  const header = gamesHeaderRows[0];
  const values = [header, ...games.map(g => header.map(h => g[h] ?? ''))];
  await updateRange('Games!A1:Z' + values.length, values);

  // Now compute pick results for any games that are final
  const picksRows = await readRange('Picks!A:Z');
  const picks = rowsToObjects(picksRows);
  let picksUpdated = false;
  for (const pick of picks) {
    const game = games.find(x => x.GameId === pick.GameId);
    if (!game) continue;
    if (game.Status !== 'final') continue;
    if (pick.Result && pick.Result !== 'undecided') continue;
    // Evaluate result using spread
    const homeScore = Number(game.HomeScore);
    const awayScore = Number(game.AwayScore);
    const spreadHome = Number(game.SpreadHome || 0); // home spread (positive means home favored by that amount)
    let margin;
    if (pick.ChosenSide === 'home') margin = homeScore - awayScore;
    else margin = awayScore - homeScore;
    // If pick was home, compare margin to spreadHome; if away, compare to -spreadHome
    const compareTo = (pick.ChosenSide === 'home') ? spreadHome : -spreadHome;
    let result = 'loss';
    if (margin > compareTo) result = 'win';
    else if (margin === compareTo) result = 'push';
    // Update pick object
    pick.Result = result;
    pick.ScoreUpdatedAt = new Date().toISOString();
    picksUpdated = true;
  }
  if (picksUpdated) {
    // Write back picks sheet (header + rows)
    const picksHeaderRows = await readRange('Picks!A1:Z1');
    const pheader = picksHeaderRows[0];
    const pvalues = [pheader, ...picks.map(p => pheader.map(h => p[h] ?? ''))];
    await updateRange('Picks!A1:Z' + pvalues.length, pvalues);
  }

  res.json({ success: true });
});

/* GET standings (compute from Picks sheet) */
app.get('/api/standings', async (req, res) => {
  const picksRows = await readRange('Picks!A:Z');
  const picks = rowsToObjects(picksRows);
  const players = ['Aric','Nick','Cisco'];
  const stats = {};
  for (const p of players) stats[p] = { wins:0, losses:0, pushes:0 };
  for (const pick of picks) {
    if (!['win','loss','push'].includes(pick.Result)) continue;
    if (!stats[pick.Player]) continue;
    if (pick.Result === 'win') stats[pick.Player].wins++;
    if (pick.Result === 'loss') stats[pick.Player].losses++;
    if (pick.Result === 'push') stats[pick.Player].pushes++;
  }
  res.json(stats);
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server listening on ${port}`));
