const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const {
  buildSeasonWeeks,
  getWeekNumberFromDate,
  determinePickResult,
  getSeasonFromDate
} = require('./utils');

const dbFile = process.env.DB_FILE || path.join(__dirname, 'data', 'bets.db');
fs.mkdirSync(path.dirname(dbFile), { recursive: true });
const db = new Database(dbFile);

function tableHasColumn(table, column) {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all();
  return rows.some((row) => row.name === column);
}

function dedupeWeeksTable() {
  const duplicateIds = db
    .prepare(
      `SELECT id
       FROM weeks
       WHERE id NOT IN (
         SELECT MIN(id)
         FROM weeks
         GROUP BY season, week
       )`
    )
    .all()
    .map((row) => row.id);

  if (duplicateIds.length) {
    const deleteStmt = db.prepare('DELETE FROM weeks WHERE id = ?');
    for (const id of duplicateIds) {
      deleteStmt.run(id);
    }
  }
}

function migrateWeeksTable() {
  const hasWeeks = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='weeks'`).get();
  if (!hasWeeks) return;
  if (tableHasColumn('weeks', 'season')) return;

  db.prepare('ALTER TABLE weeks RENAME TO weeks_old').run();
  db.prepare(
    `CREATE TABLE weeks (
      id INTEGER PRIMARY KEY,
      week INTEGER,
      season TEXT,
      label TEXT,
      starts_on TEXT,
      ends_on TEXT
    )`
  ).run();
  db.prepare(
    `INSERT INTO weeks (week, season, label, starts_on, ends_on)
     SELECT week, '2026', label, starts_on, ends_on FROM weeks_old`
  ).run();
  db.prepare('DROP TABLE weeks_old').run();
}

function addColumnIfMissing(table, column, definition, defaultValue) {
  if (!tableHasColumn(table, column)) {
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
    if (defaultValue !== undefined) {
      db.prepare(`UPDATE ${table} SET ${column} = ? WHERE ${column} IS NULL`).run(defaultValue);
    }
  }
}

function init() {
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = OFF');

  db.prepare(
    `CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    )`
  ).run();

  migrateWeeksTable();

  db.prepare(
    `CREATE TABLE IF NOT EXISTS weeks (
      id INTEGER PRIMARY KEY,
      week INTEGER,
      season TEXT,
      label TEXT,
      starts_on TEXT,
      ends_on TEXT,
      UNIQUE(season, week)
    )`
  ).run();

  dedupeWeeksTable();
  db.prepare('CREATE UNIQUE INDEX IF NOT EXISTS idx_weeks_unique ON weeks(season, week)').run();

  db.prepare(
    `CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY,
      api_game_id TEXT UNIQUE,
      week INTEGER,
      season TEXT,
      commence_time TEXT,
      home_team TEXT,
      away_team TEXT,
      site TEXT,
      is_televised INTEGER DEFAULT 0,
      is_mandatory INTEGER DEFAULT 0,
      spread_home REAL,
      spread_away REAL,
      home_price REAL,
      away_price REAL,
      score_home INTEGER,
      score_away INTEGER,
      completed INTEGER DEFAULT 0,
      updated_at TEXT
      , FOREIGN KEY (week, season) REFERENCES weeks(week, season)
    )`
  ).run();

  addColumnIfMissing('games', 'season', 'TEXT', '2026');

  db.prepare(
    `CREATE TABLE IF NOT EXISTS picks (
      id INTEGER PRIMARY KEY,
      week INTEGER,
      player TEXT,
      game_id INTEGER,
      selection_team TEXT,
      selection_side TEXT,
      spread REAL,
      is_mandatory INTEGER DEFAULT 0,
      result TEXT DEFAULT 'pending',
      picked_at TEXT,
      updated_at TEXT
    )`
  ).run();

  db.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS idx_picks_unique ON picks(week, player, game_id)`).run();
  db.pragma('foreign_keys = ON');
}

function seedPlayers() {
  db.prepare('UPDATE players SET name = ? WHERE name = ?').run('Aric', 'You');
  const defaultPlayers = ['Aric', 'Nick', 'Cisco'];
  const insert = db.prepare('INSERT OR IGNORE INTO players (name) VALUES (?)');
  const count = defaultPlayers.reduce((acc, name) => {
    insert.run(name);
    return acc + 1;
  }, 0);
  return count;
}

function seedWeeks() {
  const weeks = buildSeasonWeeks();
  const insert = db.prepare(
    'INSERT OR IGNORE INTO weeks (week, season, label, starts_on, ends_on) VALUES (?, ?, ?, ?, ?)'
  );
  for (const item of weeks) {
    insert.run(item.week, item.season, item.label, item.starts_on, item.ends_on);
  }
  return weeks.length;
}

function getPlayers() {
  return db.prepare('SELECT id, name FROM players ORDER BY id').all();
}

function getSeasons() {
  return db.prepare('SELECT DISTINCT season FROM weeks ORDER BY season DESC').all().map((row) => row.season);
}

function getWeeks(season) {
  if (season) {
    return db
      .prepare(
        'SELECT id, week, season, label, starts_on, ends_on FROM weeks WHERE season = ? ORDER BY week'
      )
      .all(season);
  }
  return db.prepare('SELECT id, week, season, label, starts_on, ends_on FROM weeks ORDER BY season DESC, week').all();
}

function getWeekGames(week, season) {
  if (season) {
    return db
      .prepare('SELECT * FROM games WHERE week = ? AND season = ? ORDER BY commence_time ASC, id ASC')
      .all(week, season);
  }

  return db
    .prepare('SELECT * FROM games WHERE week = ? ORDER BY commence_time ASC, id ASC')
    .all(week);
}

function getPicksByWeek(week, season) {
  const baseQuery =
    `SELECT p.*, g.home_team, g.away_team, g.commence_time, g.is_mandatory, g.spread_home, g.spread_away
       FROM picks p
       JOIN games g ON p.game_id = g.id
       WHERE p.week = ?`;
  if (season) {
    return db
      .prepare(`${baseQuery} AND g.season = ? ORDER BY p.player, p.updated_at DESC`)
      .all(week, season);
  }
  return db.prepare(`${baseQuery} ORDER BY p.player, p.updated_at DESC`).all(week);
}

function getGameByApiId(apiGameId) {
  return db.prepare('SELECT * FROM games WHERE api_game_id = ?').get(apiGameId);
}

function getGameById(id) {
  return db.prepare('SELECT * FROM games WHERE id = ?').get(id);
}

function upsertGame(game) {
  const existing = game.api_game_id ? getGameByApiId(game.api_game_id) : null;
  if (existing) {
    db.prepare(
      `UPDATE games SET
         week = ?,
         season = ?,
         commence_time = ?,
         home_team = ?,
         away_team = ?,
         site = ?,
         is_televised = ?,
         is_mandatory = ?,
         spread_home = ?,
         spread_away = ?,
         home_price = ?,
         away_price = ?,
         score_home = ?,
         score_away = ?,
         completed = ?,
         updated_at = ?
       WHERE api_game_id = ?`
    ).run(
      game.week,
      game.season,
      game.commence_time,
      game.home_team,
      game.away_team,
      game.site,
      game.is_televised ? 1 : 0,
      game.is_mandatory ? 1 : 0,
      game.spread_home,
      game.spread_away,
      game.home_price,
      game.away_price,
      game.score_home,
      game.score_away,
      game.completed ? 1 : 0,
      new Date().toISOString(),
      game.api_game_id
    );
    return existing.id;
  }

  const info = db.prepare(
    `INSERT INTO games (
      api_game_id,
      week,
      season,
      commence_time,
      home_team,
      away_team,
      site,
      is_televised,
      is_mandatory,
      spread_home,
      spread_away,
      home_price,
      away_price,
      score_home,
      score_away,
      completed,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    game.api_game_id,
    game.week,
    game.season,
    game.commence_time,
    game.home_team,
    game.away_team,
    game.site,
    game.is_televised ? 1 : 0,
    game.is_mandatory ? 1 : 0,
    game.spread_home,
    game.spread_away,
    game.home_price,
    game.away_price,
    game.score_home,
    game.score_away,
    game.completed ? 1 : 0,
    new Date().toISOString()
  );
  return info.lastInsertRowid;
}

function saveGamesForWeek(week, games, season) {
  let saved = 0;
  for (const game of games) {
    game.week = week;
    game.season = season;
    upsertGame(game);
    saved += 1;
  }
  return saved;
}

function saveGamesForSeason(games) {
  let saved = 0;
  for (const game of games) {
    if (!game.season) {
      game.season = getSeasonFromDate(game.commence_time);
    }
    upsertGame(game);
    saved += 1;
  }
  return saved;
}

function saveManualGame(week, season, gameData) {
  const manualId = gameData.api_game_id || `manual-${season}-${week}-${Date.now()}`;
  return upsertGame({
    api_game_id: manualId,
    week,
    season,
    commence_time: gameData.commence_time,
    home_team: gameData.home_team,
    away_team: gameData.away_team,
    site: gameData.site || 'Manual',
    is_televised: gameData.is_televised ? 1 : 0,
    is_mandatory: gameData.is_mandatory ? 1 : 0,
    spread_home: gameData.spread_home ?? null,
    spread_away: gameData.spread_away ?? null,
    home_price: gameData.home_price ?? null,
    away_price: gameData.away_price ?? null,
    score_home: null,
    score_away: null,
    completed: false
  });
}

function updateScoresFromSeason(scoreGames) {
  let updated = 0;
  const updateStmt = db.prepare(
    `UPDATE games SET score_home = ?, score_away = ?, completed = ?, updated_at = ? WHERE api_game_id = ?`
  );
  for (const game of scoreGames) {
    const existing = getGameByApiId(game.api_game_id);
    if (!existing) continue;
    updateStmt.run(
      game.score_home,
      game.score_away,
      game.completed ? 1 : 0,
      new Date().toISOString(),
      game.api_game_id
    );
    updated += 1;
    updatePickResults(existing.id);
  }
  return updated;
}

function deletePicksForPlayerWeek(player, week, season) {
  const stmt = db.prepare(`
    DELETE FROM picks 
    WHERE player = ? 
    AND week = ? 
    AND game_id IN (SELECT id FROM games WHERE season = ?)
  `);
  return stmt.run(player, week, season);
}

function updatePickResults(gameId) {
  const game = getGameById(gameId);
  if (!game) return;
  const picks = db
    .prepare('SELECT * FROM picks WHERE game_id = ?')
    .all(gameId);
  const update = db.prepare(
    'UPDATE picks SET result = ?, updated_at = ? WHERE id = ?'
  );
  for (const pick of picks) {
    const result = determinePickResult(game, pick);
    update.run(result, new Date().toISOString(), pick.id);
  }
}

function savePick(week, player, pick) {
  const game = getGameById(pick.gameId);
  if (!game) {
    throw new Error(`Game ${pick.gameId} not found`);
  }
  const result = determinePickResult(game, {
    selection_team: pick.selectionTeam,
    selection_side: pick.selectionSide,
    spread: pick.spread
  });
  const row = db.prepare(
    `INSERT INTO picks (
      week,
      player,
      game_id,
      selection_team,
      selection_side,
      spread,
      is_mandatory,
      result,
      picked_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(week, player, game_id) DO UPDATE SET
      selection_team = excluded.selection_team,
      selection_side = excluded.selection_side,
      spread = excluded.spread,
      is_mandatory = excluded.is_mandatory,
      result = excluded.result,
      picked_at = excluded.picked_at,
      updated_at = excluded.updated_at
    `
  ).run(
    week,
    player,
    pick.gameId,
    pick.selectionTeam,
    pick.selectionSide,
    pick.spread,
    pick.isMandatory ? 1 : 0,
    result,
    new Date().toISOString(),
    new Date().toISOString()
  );
  return db.prepare('SELECT * FROM picks WHERE week = ? AND player = ? AND game_id = ?').get(week, player, pick.gameId);
}

function getWeekSummary(week, season) {
  const summary = {};
  const players = getPlayers();
  for (const player of players) {
    summary[player.name] = {
      player: player.name,
      wins: 0,
      losses: 0,
      pushes: 0,
      pending: 0,
      total: 0
    };
  }
  const baseQuery = 'SELECT player, result, COUNT(*) AS count FROM picks p JOIN games g ON p.game_id = g.id WHERE p.week = ?';
  const query = season
    ? `${baseQuery} AND g.season = ? GROUP BY player, result`
    : `${baseQuery} GROUP BY player, result`;
  const rows = season ? db.prepare(query).all(week, season) : db.prepare(query).all(week);

  for (const row of rows) {
    const current = summary[row.player] || {
      player: row.player,
      wins: 0,
      losses: 0,
      pushes: 0,
      pending: 0,
      total: 0
    };
    current.total += row.count;
    if (row.result === 'win') current.wins += row.count;
    else if (row.result === 'loss') current.losses += row.count;
    else if (row.result === 'push') current.pushes += row.count;
    else current.pending += row.count;
    summary[row.player] = current;
  }
  return Object.values(summary);
}

function getSeasonSummary(season) {
  const summary = {};
  const players = getPlayers();
  for (const player of players) {
    summary[player.name] = {
      player: player.name,
      wins: 0,
      losses: 0,
      pushes: 0,
      pending: 0,
      total: 0
    };
  }
  const rows = db
    .prepare(
      `SELECT p.player, p.result, COUNT(*) AS count
       FROM picks p
       JOIN games g ON p.game_id = g.id
       WHERE g.season = ?
       GROUP BY p.player, p.result`
    )
    .all(season);
  for (const row of rows) {
    const current = summary[row.player] || {
      player: row.player,
      wins: 0,
      losses: 0,
      pushes: 0,
      pending: 0,
      total: 0
    };
    current.total += row.count;
    if (row.result === 'win') current.wins += row.count;
    else if (row.result === 'loss') current.losses += row.count;
    else if (row.result === 'push') current.pushes += row.count;
    else current.pending += row.count;
    summary[row.player] = current;
  }
  return Object.values(summary);
}

function getAllTimeSummary() {
  const summary = {};
  const players = getPlayers();
  for (const player of players) {
    summary[player.name] = {
      player: player.name,
      wins: 0,
      losses: 0,
      pushes: 0,
      pending: 0,
      total: 0
    };
  }
  const rows = db
    .prepare('SELECT player, result, COUNT(*) AS count FROM picks GROUP BY player, result')
    .all();
  for (const row of rows) {
    const current = summary[row.player] || {
      player: row.player,
      wins: 0,
      losses: 0,
      pushes: 0,
      pending: 0,
      total: 0
    };
    current.total += row.count;
    if (row.result === 'win') current.wins += row.count;
    else if (row.result === 'loss') current.losses += row.count;
    else if (row.result === 'push') current.pushes += row.count;
    else current.pending += row.count;
    summary[row.player] = current;
  }
  return Object.values(summary);
}

function seedTestData() {
  // Hardcode season to match frontend and seedWeeks logic for consistency
  const season = '2025'; 
  const weekNum = 0;

  const transaction = db.transaction(() => {
    // Ensure Week 0 exists in weeks table
    db.prepare(`
      INSERT OR REPLACE INTO weeks (week, season, label, starts_on, ends_on)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      weekNum,
      season,
      'Week 0 (Test Data)',
      new Date(Date.now() - 86400000 * 7).toISOString(),
      new Date(Date.now() + 86400000 * 7).toISOString()
    );

    // 1. Live Game: Started 1.5 hours ago, not completed.
    const liveTime = new Date(Date.now() - 5400000).toISOString();
    db.prepare(`
      INSERT OR REPLACE INTO games (
        api_game_id, week, season, commence_time, home_team, away_team, site, 
        is_televised, is_mandatory, spread_home, spread_away, completed, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, -3.5, 3.5, 0, ?)
    `).run('test-game-live', weekNum, season, liveTime, 'Live State', 'Live Tech', 'Test Arena', new Date().toISOString());

    // 2. Finished Game: Started yesterday, completed.
    const finishedTime = new Date(Date.now() - 86400000).toISOString();
    db.prepare(`
      INSERT OR REPLACE INTO games (
        api_game_id, week, season, commence_time, home_team, away_team, site, 
        is_televised, is_mandatory, spread_home, spread_away, score_home, score_away, completed, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, -7, 7, 45, 17, 1, ?)
    `).run('test-game-finished', weekNum, season, finishedTime, 'Winner University', 'Loser College', 'Victory Field', new Date().toISOString());
  });

  transaction();
  console.log(`[db] Week 0 test data seeded for season ${season}.`);
}

function updateGameLine(gameId, updates) {
  const { spread_home, spread_away, home_price, away_price } = updates;
  const updateStmt = db.prepare(
    `UPDATE games SET spread_home = ?, spread_away = ?, home_price = ?, away_price = ?, updated_at = ? 
     WHERE id = ?`
  );
  updateStmt.run(spread_home, spread_away, home_price, away_price, new Date().toISOString(), gameId);
  return getGameById(gameId);
}

function updatePick(pickId, updates) {
  const { selection_team, selection_side, spread } = updates;
  const pick = db.prepare('SELECT * FROM picks WHERE id = ?').get(pickId);
  if (!pick) {
    throw new Error(`Pick ${pickId} not found`);
  }
  const game = getGameById(pick.game_id);
  const result = determinePickResult(game, {
    selection_team,
    selection_side,
    spread: spread !== null ? spread : (selection_side === 'home' ? game.spread_home : game.spread_away)
  });
  const updateStmt = db.prepare(
    `UPDATE picks SET selection_team = ?, selection_side = ?, spread = ?, result = ?, updated_at = ? WHERE id = ?`
  );
  updateStmt.run(selection_team, selection_side, spread, result, new Date().toISOString(), pickId);
  return db.prepare('SELECT * FROM picks WHERE id = ?').get(pickId);
}

module.exports = {
  init,
  seedPlayers,
  seedWeeks,
  getPlayers,
  getSeasons,
  getWeeks,
  getWeekGames,
  getPicksByWeek,
  saveGamesForWeek,
  saveGamesForSeason,
  saveManualGame,
  updateScoresFromSeason,
  deletePicksForPlayerWeek,
  seedTestData,
  savePick,
  updateGameLine,
  updatePick,
  getGameById,
  getGameByApiId,
  getWeekSummary,
  getSeasonSummary,
  getAllTimeSummary
};
