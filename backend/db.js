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

  db.prepare(
    `CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY,
      school TEXT NOT NULL UNIQUE,
      nickname TEXT,
      conference TEXT,
      logo TEXT
    )`
  ).run();

  addColumnIfMissing('teams', 'logo', 'TEXT');

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

function seedTeams() {
  const toLogo = (school) => {
    // Convention: "Miami (FL)" -> miami-fl.png, "Texas A&M" -> texas-am.png
    const name = school.toLowerCase()
      .replace(/\(fl\)/g, 'fl')
      .replace(/\(oh\)/g, 'oh')
      .replace(/[^a-z0-9 ]/g, '') // remove special chars like & or '
      .trim()
      .replace(/\s+/g, '-');      // replace spaces with hyphens
    return `/logos/${name}.png`;
  };
  const teams = [
    { school: 'Boston College', nickname: 'Eagles', conference: 'ACC', logo: toLogo('Boston College') },
    { school: 'California', nickname: 'Golden Bears', conference: 'ACC', logo: toLogo('California') },
    { school: 'Clemson', nickname: 'Tigers', conference: 'ACC', logo: toLogo('Clemson') },
    { school: 'Duke', nickname: 'Blue Devils', conference: 'ACC', logo: toLogo('Duke') },
    { school: 'Florida State', nickname: 'Seminoles', conference: 'ACC', logo: toLogo('Florida State') },
    { school: 'Georgia Tech', nickname: 'Yellow Jackets', conference: 'ACC', logo: toLogo('Georgia Tech') },
    { school: 'Louisville', nickname: 'Cardinals', conference: 'ACC', logo: toLogo('Louisville') },
    { school: 'Miami (FL)', nickname: 'Hurricanes', conference: 'ACC', logo: toLogo('Miami FL') },
    { school: 'NC State', nickname: 'Wolfpack', conference: 'ACC', logo: toLogo('NC State') },
    { school: 'North Carolina', nickname: 'Tar Heels', conference: 'ACC', logo: toLogo('North Carolina') },
    { school: 'Pittsburgh', nickname: 'Panthers', conference: 'ACC', logo: toLogo('Pittsburgh') },
    { school: 'SMU', nickname: 'Mustangs', conference: 'ACC', logo: toLogo('SMU') },
    { school: 'Stanford', nickname: 'Cardinal', conference: 'ACC', logo: toLogo('Stanford') },
    { school: 'Syracuse', nickname: 'Orange', conference: 'ACC', logo: toLogo('Syracuse') },
    { school: 'Virginia', nickname: 'Cavaliers', conference: 'ACC', logo: toLogo('Virginia') },
    { school: 'Virginia Tech', nickname: 'Hokies', conference: 'ACC', logo: toLogo('Virginia Tech') },
    { school: 'Wake Forest', nickname: 'Demon Deacons', conference: 'ACC', logo: toLogo('Wake Forest') },
    { school: 'Army', nickname: 'Black Knights', conference: 'American', logo: toLogo('Army') },
    { school: 'Charlotte', nickname: '49ers', conference: 'American', logo: toLogo('Charlotte') },
    { school: 'East Carolina', nickname: 'Pirates', conference: 'American', logo: toLogo('East Carolina') },
    { school: 'Florida Atlantic', nickname: 'Owls', conference: 'American', logo: toLogo('Florida Atlantic') },
    { school: 'Memphis', nickname: 'Tigers', conference: 'American', logo: toLogo('Memphis') },
    { school: 'Navy', nickname: 'Midshipmen', conference: 'American', logo: toLogo('Navy') },
    { school: 'North Texas', nickname: 'Mean Green', conference: 'American', logo: toLogo('North Texas') },
    { school: 'Rice', nickname: 'Owls', conference: 'American', logo: toLogo('Rice') },
    { school: 'South Florida', nickname: 'Bulls', conference: 'American', logo: toLogo('South Florida') },
    { school: 'Temple', nickname: 'Owls', conference: 'American', logo: toLogo('Temple') },
    { school: 'Tulane', nickname: 'Green Wave', conference: 'American', logo: toLogo('Tulane') },
    { school: 'Tulsa', nickname: 'Golden Hurricane', conference: 'American', logo: toLogo('Tulsa') },
    { school: 'UAB', nickname: 'Blazers', conference: 'American', logo: toLogo('UAB') },
    { school: 'UTSA', nickname: 'Roadrunners', conference: 'American', logo: toLogo('UTSA') },
    { school: 'Arizona', nickname: 'Wildcats', conference: 'Big 12', logo: toLogo('Arizona') },
    { school: 'Arizona State', nickname: 'Sun Devils', conference: 'Big 12', logo: toLogo('Arizona State') },
    { school: 'Baylor', nickname: 'Bears', conference: 'Big 12', logo: toLogo('Baylor') },
    { school: 'BYU', nickname: 'Cougars', conference: 'Big 12', logo: toLogo('BYU') },
    { school: 'Cincinnati', nickname: 'Bearcats', conference: 'Big 12', logo: toLogo('Cincinnati') },
    { school: 'Colorado', nickname: 'Buffaloes', conference: 'Big 12', logo: toLogo('Colorado') },
    { school: 'Houston', nickname: 'Cougars', conference: 'Big 12', logo: toLogo('Houston') },
    { school: 'Iowa State', nickname: 'Cyclones', conference: 'Big 12', logo: toLogo('Iowa State') },
    { school: 'Kansas', nickname: 'Jayhawks', conference: 'Big 12', logo: toLogo('Kansas') },
    { school: 'Kansas State', nickname: 'Wildcats', conference: 'Big 12', logo: toLogo('Kansas State') },
    { school: 'Oklahoma State', nickname: 'Cowboys', conference: 'Big 12', logo: toLogo('Oklahoma State') },
    { school: 'TCU', nickname: 'Horned Frogs', conference: 'Big 12', logo: toLogo('TCU') },
    { school: 'Texas Tech', nickname: 'Red Raiders', conference: 'Big 12', logo: toLogo('Texas Tech') },
    { school: 'UCF', nickname: 'Knights', conference: 'Big 12', logo: toLogo('UCF') },
    { school: 'Utah', nickname: 'Utes', conference: 'Big 12', logo: toLogo('Utah') },
    { school: 'West Virginia', nickname: 'Mountaineers', conference: 'Big 12', logo: toLogo('West Virginia') },
    { school: 'Illinois', nickname: 'Fighting Illini', conference: 'Big Ten', logo: toLogo('Illinois') },
    { school: 'Indiana', nickname: 'Hoosiers', conference: 'Big Ten', logo: toLogo('Indiana') },
    { school: 'Iowa', nickname: 'Hawkeyes', conference: 'Big Ten', logo: toLogo('Iowa') },
    { school: 'Maryland', nickname: 'Terrapins', conference: 'Big Ten', logo: toLogo('Maryland') },
    { school: 'Michigan', nickname: 'Wolverines', conference: 'Big Ten', logo: toLogo('Michigan') },
    { school: 'Michigan State', nickname: 'Spartans', conference: 'Big Ten', logo: toLogo('Michigan State') },
    { school: 'Minnesota', nickname: 'Golden Gophers', conference: 'Big Ten', logo: toLogo('Minnesota') },
    { school: 'Nebraska', nickname: 'Cornhuskers', conference: 'Big Ten', logo: toLogo('Nebraska') },
    { school: 'Northwestern', nickname: 'Wildcats', conference: 'Big Ten', logo: toLogo('Northwestern') },
    { school: 'Ohio State', nickname: 'Buckeyes', conference: 'Big Ten', logo: toLogo('Ohio State') },
    { school: 'Oregon', nickname: 'Ducks', conference: 'Big Ten', logo: toLogo('Oregon') },
    { school: 'Penn State', nickname: 'Nittany Lions', conference: 'Big Ten', logo: toLogo('Penn State') },
    { school: 'Purdue', nickname: 'Boilermakers', conference: 'Big Ten', logo: toLogo('Purdue') },
    { school: 'Rutgers', nickname: 'Scarlet Knights', conference: 'Big Ten', logo: toLogo('Rutgers') },
    { school: 'UCLA', nickname: 'Bruins', conference: 'Big Ten', logo: toLogo('UCLA') },
    { school: 'USC', nickname: 'Trojans', conference: 'Big Ten', logo: toLogo('USC') },
    { school: 'Washington', nickname: 'Huskies', conference: 'Big Ten', logo: toLogo('Washington') },
    { school: 'Wisconsin', nickname: 'Badgers', conference: 'Big Ten', logo: toLogo('Wisconsin') },
    { school: 'Delaware', nickname: "Fightin' Blue Hens", conference: 'CUSA', logo: toLogo('Delaware') },
    { school: 'FIU', nickname: 'Panthers', conference: 'CUSA', logo: toLogo('FIU') },
    { school: 'Jacksonville State', nickname: 'Gamecocks', conference: 'CUSA', logo: toLogo('Jacksonville State') },
    { school: 'Kennesaw State', nickname: 'Owls', conference: 'CUSA', logo: toLogo('Kennesaw State') },
    { school: 'Liberty', nickname: 'Flames', conference: 'CUSA', logo: toLogo('Liberty') },
    { school: 'Louisiana Tech', nickname: 'Bulldogs', conference: 'CUSA', logo: toLogo('Louisiana Tech') },
    { school: 'Middle Tennessee', nickname: 'Blue Raiders', conference: 'CUSA', logo: toLogo('Middle Tennessee') },
    { school: 'Missouri State', nickname: 'Bears', conference: 'CUSA', logo: toLogo('Missouri State') },
    { school: 'New Mexico State', nickname: 'Aggies', conference: 'CUSA', logo: toLogo('New Mexico State') },
    { school: 'Sam Houston', nickname: 'Bearkats', conference: 'CUSA', logo: toLogo('Sam Houston') },
    { school: 'Western Kentucky', nickname: 'Hilltoppers', conference: 'CUSA', logo: toLogo('Western Kentucky') },
    { school: 'Akron', nickname: 'Zips', conference: 'MAC', logo: toLogo('Akron') },
    { school: 'Ball State', nickname: 'Cardinals', conference: 'MAC', logo: toLogo('Ball State') },
    { school: 'Bowling Green', nickname: 'Falcons', conference: 'MAC', logo: toLogo('Bowling Green') },
    { school: 'Buffalo', nickname: 'Bulls', conference: 'MAC', logo: toLogo('Buffalo') },
    { school: 'Central Michigan', nickname: 'Chippewas', conference: 'MAC', logo: toLogo('Central Michigan') },
    { school: 'Eastern Michigan', nickname: 'Eagles', conference: 'MAC', logo: toLogo('Eastern Michigan') },
    { school: 'Kent State', nickname: 'Golden Flashes', conference: 'MAC', logo: toLogo('Kent State') },
    { school: 'Miami (OH)', nickname: 'RedHawks', conference: 'MAC', logo: toLogo('Miami OH') },
    { school: 'Northern Illinois', nickname: 'Huskies', conference: 'MAC', logo: toLogo('Northern Illinois') },
    { school: 'Ohio', nickname: 'Bobcats', conference: 'MAC', logo: toLogo('Ohio') },
    { school: 'Sacramento State', nickname: 'Hornets', conference: 'MAC', logo: toLogo('Sacramento State') },
    { school: 'Toledo', nickname: 'Rockets', conference: 'MAC', logo: toLogo('Toledo') },
    { school: 'UMass', nickname: 'Minutemen', conference: 'MAC', logo: toLogo('UMass') },
    { school: 'Western Michigan', nickname: 'Broncos', conference: 'MAC', logo: toLogo('Western Michigan') },
    { school: 'Air Force', nickname: 'Falcons', conference: 'Mountain West', logo: toLogo('Air Force') },
    { school: 'Boise State', nickname: 'Broncos', conference: 'Mountain West', logo: toLogo('Boise State') },
    { school: 'Colorado State', nickname: 'Rams', conference: 'Mountain West', logo: toLogo('Colorado State') },
    { school: 'Fresno State', nickname: 'Bulldogs', conference: 'Mountain West', logo: toLogo('Fresno State') },
    { school: 'Hawai\u02BBi', nickname: 'Rainbow Warriors', conference: 'Mountain West', logo: toLogo('Hawaii') },
    { school: 'Nevada', nickname: 'Wolf Pack', conference: 'Mountain West', logo: toLogo('Nevada') },
    { school: 'New Mexico', nickname: 'Lobos', conference: 'Mountain West', logo: toLogo('New Mexico') },
    { school: 'San Diego State', nickname: 'Aztecs', conference: 'Mountain West', logo: toLogo('San Diego State') },
    { school: 'San Jose State', nickname: 'Spartans', conference: 'Mountain West', logo: toLogo('San Jose State') },
    { school: 'UNLV', nickname: 'Rebels', conference: 'Mountain West', logo: toLogo('UNLV') },
    { school: 'Utah State', nickname: 'Aggies', conference: 'Mountain West', logo: toLogo('Utah State') },
    { school: 'Wyoming', nickname: 'Cowboys', conference: 'Mountain West', logo: toLogo('Wyoming') },
    { school: 'Alabama', nickname: 'Crimson Tide', conference: 'SEC', logo: toLogo('Alabama') },
    { school: 'Arkansas', nickname: 'Razorbacks', conference: 'SEC', logo: toLogo('Arkansas') },
    { school: 'Auburn', nickname: 'Tigers', conference: 'SEC', logo: toLogo('Auburn') },
    { school: 'Florida', nickname: 'Gators', conference: 'SEC', logo: toLogo('Florida') },
    { school: 'Georgia', nickname: 'Bulldogs', conference: 'SEC', logo: toLogo('Georgia') },
    { school: 'Kentucky', nickname: 'Wildcats', conference: 'SEC', logo: toLogo('Kentucky') },
    { school: 'LSU', nickname: 'Tigers', conference: 'SEC', logo: toLogo('LSU') },
    { school: 'Mississippi State', nickname: 'Bulldogs', conference: 'SEC', logo: toLogo('Mississippi State') },
    { school: 'Missouri', nickname: 'Tigers', conference: 'SEC', logo: toLogo('Missouri') },
    { school: 'Oklahoma', nickname: 'Sooners', conference: 'SEC', logo: toLogo('Oklahoma') },
    { school: 'Ole Miss', nickname: 'Rebels', conference: 'SEC', logo: toLogo('Ole Miss') },
    { school: 'South Carolina', nickname: 'Gamecocks', conference: 'SEC', logo: toLogo('South Carolina') },
    { school: 'Tennessee', nickname: 'Volunteers', conference: 'SEC', logo: toLogo('Tennessee') },
    { school: 'Texas', nickname: 'Longhorns', conference: 'SEC', logo: toLogo('Texas') },
    { school: 'Texas A&M', nickname: 'Aggies', conference: 'SEC', logo: toLogo('Texas AM') },
    { school: 'Vanderbilt', nickname: 'Commodores', conference: 'SEC', logo: toLogo('Vanderbilt') },
    { school: 'Appalachian State', nickname: 'Mountaineers', conference: 'Sun Belt', logo: toLogo('Appalachian State') },
    { school: 'Arkansas State', nickname: 'Red Wolves', conference: 'Sun Belt', logo: toLogo('Arkansas State') },
    { school: 'Coastal Carolina', nickname: 'Chanticleers', conference: 'Sun Belt', logo: toLogo('Coastal Carolina') },
    { school: 'Georgia Southern', nickname: 'Eagles', conference: 'Sun Belt', logo: toLogo('Georgia Southern') },
    { school: 'Georgia State', nickname: 'Panthers', conference: 'Sun Belt', logo: toLogo('Georgia State') },
    { school: 'James Madison', nickname: 'Dukes', conference: 'Sun Belt', logo: toLogo('James Madison') },
    { school: 'Louisiana', nickname: "Ragin' Cajuns", conference: 'Sun Belt', logo: toLogo('Louisiana') },
    { school: 'Marshall', nickname: 'Thundering Herd', conference: 'Sun Belt', logo: toLogo('Marshall') },
    { school: 'Old Dominion', nickname: 'Monarchs', conference: 'Sun Belt', logo: toLogo('Old Dominion') },
    { school: 'South Alabama', nickname: 'Jaguars', conference: 'Sun Belt', logo: toLogo('South Alabama') },
    { school: 'Southern Miss', nickname: 'Golden Eagles', conference: 'Sun Belt', logo: toLogo('Southern Miss') },
    { school: 'Texas State', nickname: 'Bobcats', conference: 'Sun Belt', logo: toLogo('Texas State') },
    { school: 'Troy', nickname: 'Trojans', conference: 'Sun Belt', logo: toLogo('Troy') },
    { school: 'ULM', nickname: 'Warhawks', conference: 'Sun Belt', logo: toLogo('ULM') },
    { school: 'Notre Dame', nickname: 'Fighting Irish', conference: 'Independent', logo: toLogo('Notre Dame') },
    { school: 'UConn', nickname: 'Huskies', conference: 'Independent', logo: toLogo('UConn') }
  ];

  const insert = db.prepare(`
    INSERT INTO teams (school, nickname, conference, logo) 
    VALUES (?, ?, ?, ?)
    ON CONFLICT(school) DO UPDATE SET
      logo = excluded.logo,
      nickname = excluded.nickname,
      conference = excluded.conference
  `);

  const transaction = db.transaction((data) => {
    for (const team of data) {
      insert.run(team.school, team.nickname, team.conference, team.logo);
    }
  });
  transaction(teams);
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

function getTeams() {
  return db.prepare('SELECT id, school, nickname, conference, logo FROM teams ORDER BY school ASC').all();
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
      .prepare(`
        SELECT g.*, ht.logo as home_logo, at.logo as away_logo 
        FROM games g
        LEFT JOIN teams ht ON g.home_team LIKE ht.school || '%'
        LEFT JOIN teams at ON g.away_team LIKE at.school || '%'
        WHERE g.week = ? AND g.season = ? 
        ORDER BY g.commence_time ASC, g.id ASC
      `)
      .all(week, season);
  }

  // Fallback for missing season param
  return [];
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

function getPlayerStats(player) {
  // Conference most betted for
  const favConf = db.prepare(`
    SELECT t.conference, COUNT(*) as count
    FROM picks p
    JOIN teams t ON p.selection_team = t.school
    WHERE p.player = ?
    GROUP BY t.conference
    ORDER BY count DESC
    LIMIT 1
  `).get(player);

  // Conference with most wins
  const bestConf = db.prepare(`
    SELECT t.conference, COUNT(*) as count
    FROM picks p
    JOIN teams t ON p.selection_team = t.school
    WHERE p.player = ? AND p.result = 'win'
    GROUP BY t.conference
    ORDER BY count DESC
    LIMIT 1
  `).get(player);

  // Conference with most losses
  const worstConf = db.prepare(`
    SELECT t.conference, COUNT(*) as count
    FROM picks p
    JOIN teams t ON p.selection_team = t.school
    WHERE p.player = ? AND p.result = 'loss'
    GROUP BY t.conference
    ORDER BY count DESC
    LIMIT 1
  `).get(player);

  // Week-over-week trend (Last 10 weeks of activity)
  const trend = db.prepare(`
    SELECT g.season, p.week, 
           SUM(CASE WHEN p.result = 'win' THEN 1 ELSE 0 END) as wins,
           SUM(CASE WHEN p.result = 'loss' THEN 1 ELSE 0 END) as losses
    FROM picks p
    JOIN games g ON p.game_id = g.id
    WHERE p.player = ?
    GROUP BY g.season, p.week
    ORDER BY g.season DESC, p.week DESC
    LIMIT 10
  `).all(player).reverse();

  // School that wins the most for you
  const topWinSchool = db.prepare(`
    SELECT p.selection_team as school, t.logo, COUNT(*) as count
    FROM picks p
    LEFT JOIN teams t ON p.selection_team = t.school
    WHERE p.player = ? AND p.result = 'win'
    GROUP BY p.selection_team
    ORDER BY count DESC
    LIMIT 1
  `).get(player);

  // School that loses the most for you
  const topLossSchool = db.prepare(`
    SELECT p.selection_team as school, t.logo, COUNT(*) as count
    FROM picks p
    LEFT JOIN teams t ON p.selection_team = t.school
    WHERE p.player = ? AND p.result = 'loss'
    GROUP BY p.selection_team
    ORDER BY count DESC
    LIMIT 1
  `).get(player);

  // Overall record
  const record = db.prepare(`
    SELECT 
      SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) as losses,
      SUM(CASE WHEN result = 'push' THEN 1 ELSE 0 END) as pushes,
      SUM(CASE WHEN result = 'pending' THEN 1 ELSE 0 END) as pending,
      COUNT(*) as total
    FROM picks
    WHERE player = ?
  `).get(player);

  // School most betted for
  const mostBetsFor = db.prepare(`
    SELECT p.selection_team as school, t.logo, COUNT(*) as count
    FROM picks p
    LEFT JOIN teams t ON p.selection_team = t.school
    WHERE p.player = ?
    GROUP BY p.selection_team
    ORDER BY count DESC
    LIMIT 1
  `).get(player);

  // School most betted against
  const mostBetsAgainst = db.prepare(`
    SELECT 
      CASE WHEN p.selection_side = 'home' THEN g.away_team ELSE g.home_team END as school,
      t.logo,
      COUNT(*) as count
    FROM picks p
    JOIN games g ON p.game_id = g.id
    LEFT JOIN teams t ON t.school = (CASE WHEN p.selection_side = 'home' THEN g.away_team ELSE g.home_team END)
    WHERE p.player = ?
    GROUP BY school
    ORDER BY count DESC
    LIMIT 1
  `).get(player);

  // Current and Longest Streaks
  const recentResults = db.prepare(`
    SELECT p.result
    FROM picks p
    JOIN games g ON p.game_id = g.id
    WHERE p.player = ? AND p.result IN ('win', 'loss', 'push')
    ORDER BY g.commence_time ASC, g.id ASC -- Order chronologically for longest streak calculation
  `).all(player);

  // Calculate current streaks (from most recent pick backwards)
  let currentWinStreak = 0;
  let currentLossStreak = 0;
  let winStreakActive = true;
  let lossStreakActive = true;
  const reversedResults = [...recentResults].reverse(); // For current streak, iterate backwards
  for (const r of reversedResults) {
    if (winStreakActive) {
      if (r.result === 'win') currentWinStreak++;
      else if (r.result === 'loss') winStreakActive = false;
    }
    if (lossStreakActive) {
      if (r.result === 'loss') currentLossStreak++;
      else if (r.result === 'win') lossStreakActive = false;
    }
    if (!winStreakActive && !lossStreakActive) break; // Both current streaks broken
  }

  // Calculate longest ever streaks (from oldest pick forwards)
  let longestWinStreak = 0;
  let longestLossStreak = 0;
  let tempWinStreak = 0;
  let tempLossStreak = 0;

  for (const r of recentResults) { // Already chronological
    if (r.result === 'win') {
      tempWinStreak++;
      tempLossStreak = 0; // Reset loss streak on a win
      if (tempWinStreak > longestWinStreak) longestWinStreak = tempWinStreak;
    } else if (r.result === 'loss') {
      tempLossStreak++;
      tempWinStreak = 0; // Reset win streak on a loss
      if (tempLossStreak > longestLossStreak) longestLossStreak = tempLossStreak;
    }
  }

  return { favConf, bestConf, worstConf, topWinSchool, topLossSchool, record, trend, mostBetsFor, mostBetsAgainst, currentWinStreak, currentLossStreak, longestWinStreak, longestLossStreak };
}

function getConferenceStats(player, conference, timeRange, week, season) {
  let timeFilter = '';
  const params = [player, conference];

  if (timeRange === 'Week') {
    timeFilter = 'AND p.week = ? AND g.season = ?';
    params.push(week, season);
  } else if (timeRange === 'Season') {
    timeFilter = 'AND g.season = ?';
    params.push(season);
  }

  const bestTeam = db.prepare(`
    SELECT p.selection_team as school, t.logo, COUNT(*) as wins
    FROM picks p
    JOIN games g ON p.game_id = g.id
    JOIN teams t ON p.selection_team = t.school
    WHERE p.player = ? AND t.conference = ? AND p.result = 'win' ${timeFilter}
    GROUP BY p.selection_team, t.logo
    ORDER BY wins DESC
    LIMIT 1
  `).get(...params);

  const worstTeam = db.prepare(`
    SELECT p.selection_team as school, t.logo, COUNT(*) as losses
    FROM picks p
    JOIN games g ON p.game_id = g.id
    JOIN teams t ON p.selection_team = t.school
    WHERE p.player = ? AND t.conference = ? AND p.result = 'loss' ${timeFilter}
    GROUP BY p.selection_team, t.logo
    ORDER BY losses DESC
    LIMIT 1
  `).get(...params);

  const mostBetsFor = db.prepare(`
    SELECT p.selection_team as school, t.logo, COUNT(*) as count
    FROM picks p
    JOIN games g ON p.game_id = g.id
    JOIN teams t ON p.selection_team = t.school
    WHERE p.player = ? AND t.conference = ? ${timeFilter}
    GROUP BY p.selection_team, t.logo
    ORDER BY count DESC
    LIMIT 1
  `).get(...params);

  const mostBetsAgainst = db.prepare(`
    SELECT 
      CASE WHEN p.selection_side = 'home' THEN g.away_team ELSE g.home_team END as school,
      t.logo,
      COUNT(*) as count
    FROM picks p
    JOIN games g ON p.game_id = g.id
    JOIN teams t ON (CASE WHEN p.selection_side = 'home' THEN g.away_team ELSE g.home_team END) = t.school
    WHERE p.player = ? AND t.conference = ? ${timeFilter}
    GROUP BY school
    ORDER BY count DESC
    LIMIT 1
  `).get(...params);

  const schoolRecordsParams = [player];
  if (timeRange === 'Week') schoolRecordsParams.push(week, season);
  else if (timeRange === 'Season') schoolRecordsParams.push(season);
  schoolRecordsParams.push(conference);

  const schoolRecords = db.prepare(`
    SELECT 
      t.school,
      t.logo,
      SUM(CASE WHEN g.id IS NOT NULL AND p.result = 'win' THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN g.id IS NOT NULL AND p.result = 'loss' THEN 1 ELSE 0 END) as losses,
      SUM(CASE WHEN g.id IS NOT NULL AND p.result = 'push' THEN 1 ELSE 0 END) as pushes,
      COUNT(g.id) as total
    FROM teams t
    LEFT JOIN picks p ON t.school = p.selection_team AND p.player = ?
    LEFT JOIN games g ON p.game_id = g.id ${timeFilter}
    WHERE t.conference = ?
    GROUP BY t.school
    ORDER BY wins DESC, total DESC
  `).all(...schoolRecordsParams);

  return { bestTeam, worstTeam, mostBetsFor, mostBetsAgainst, schoolRecords };
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
  seedTeams,
  seedWeeks,
  getPlayers,
  getTeams,
  getSeasons,
  getWeeks,
  getWeekGames,
  getPicksByWeek,
  saveGamesForWeek,
  saveGamesForSeason,
  saveManualGame,
  updateScoresFromSeason,
  deletePicksForPlayerWeek,
  getConferenceStats,
  getPlayerStats,
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
