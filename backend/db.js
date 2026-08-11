const path = require('path');
const { Pool } = require('pg');
const Database = require('better-sqlite3');
const NodeCache = require('node-cache');
const {
  buildSeasonWeeks,
  getWeekNumberFromDate,
  determinePickResult,
  determineTotalResult,
  getSeasonFromDate
} = require('./utils');

const dialect = process.env.POSTGRES_URL ? 'postgres' : 'sqlite';
const dbFile = process.env.DB_FILE || path.join(__dirname, 'data', 'bets.db');
const idColumn = dialect === 'postgres' ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';

function convertSqlPlaceholders(sql, params = []) {
  let convertedSql = sql;
  const expandedParams = [];

  convertedSql = convertedSql.replace(/= ANY\(\$([0-9]+)\)/g, (match, idx) => {
    const param = params[Number(idx) - 1];
    if (!Array.isArray(param) || param.length === 0) {
      return '= (?)';
    }
    return `IN (${param.map(() => '?').join(', ')})`;
  });

  convertedSql = convertedSql.replace(/\$([0-9]+)/g, (match, idx) => {
    const param = params[Number(idx) - 1];
    if (Array.isArray(param)) {
      return param.map(() => '?').join(', ');
    }
    return '?';
  });

  for (const param of params) {
    if (Array.isArray(param)) {
      expandedParams.push(...param);
    } else {
      expandedParams.push(param);
    }
  }

  return [convertedSql, expandedParams];
}

function nowMinus30Days() {
  return dialect === 'postgres'
    ? "NOW() - INTERVAL '30 days'"
    : "datetime('now', '-30 days')";
}

const pool = dialect === 'postgres'
  ? new Pool({
      connectionString: process.env.POSTGRES_URL,
      ssl: { rejectUnauthorized: false }
    })
  : (() => {
      const sqliteDb = new Database(dbFile);
      return {
        async connect() {
          return { release: () => {} };
        },
        async query(sql, params = []) {
          const [convertedSql, convertedParams] = convertSqlPlaceholders(sql, params);
          const stmt = sqliteDb.prepare(convertedSql);
          const isSelect = /^\s*SELECT/i.test(convertedSql) || /\bRETURNING\b/i.test(convertedSql);
          if (isSelect) {
            return { rows: stmt.all(convertedParams) };
          }
          const info = stmt.run(convertedParams);
          return { rows: [], lastInsertRowid: info.lastInsertRowid, changes: info.changes };
        },
        async end() {
          sqliteDb.close();
        }
      };
    })();

// Initialize cache with standard TTL of 1 hour
const cache = new NodeCache({ stdTTL: 3600 });

async function ensureConnected() {
  try {
    console.log('Attempting to connect to the database...');
    console.log(`Using connection string: ${process.env.POSTGRES_URL}`);
    const client = await pool.connect();
    client.release();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error.message);
    throw error;
  }
}

async function addColumnIfMissing(table, column, definition, defaultValue) {
  let columnExists = false;

  if (dialect === 'postgres') {
    const { rows } = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = $1 AND column_name = $2
    `, [table, column]);
    columnExists = rows.length > 0;
  } else {
    const { rows } = await pool.query(`PRAGMA table_info(${table})`);
    columnExists = rows.some(row => row.name === column);
  }

  if (!columnExists) {
    await pool.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    if (defaultValue !== undefined) {
      await pool.query(`UPDATE ${table} SET ${column} = $1 WHERE ${column} IS NULL`, [defaultValue]);
    }
  }
}

async function init() {
  await ensureConnected();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS players (
      id ${idColumn},
      name TEXT NOT NULL UNIQUE
    )
  `);

  await addColumnIfMissing('players', 'full_name', 'TEXT');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS teams (
      id ${idColumn},
      school TEXT NOT NULL UNIQUE,
      nickname TEXT,
      conference TEXT,
      logo TEXT,
      school_primary_color TEXT,
      stadium_name TEXT,
      stadium_city TEXT,
      stadium_state TEXT
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS weeks (
      id ${idColumn},
      week INTEGER,
      season TEXT,
      label TEXT,
      starts_on TEXT,
      ends_on TEXT,
      UNIQUE(season, week)
    )
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_weeks_unique ON weeks(season, week)`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS games (
      id ${idColumn},
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
    )
  `);

  await addColumnIfMissing('games', 'season', 'TEXT', '2026');
  await addColumnIfMissing('games', 'tv_network', 'TEXT');
  await addColumnIfMissing('teams', 'stadium_name', 'TEXT');
  await addColumnIfMissing('teams', 'stadium_city', 'TEXT');
  await addColumnIfMissing('teams', 'stadium_state', 'TEXT');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS picks (
      id ${idColumn},
      week INTEGER,
      player TEXT,
      game_id INTEGER,
      selection_team TEXT,
      selection_side TEXT,
      spread REAL,
      is_mandatory INTEGER DEFAULT 0,
      result TEXT,
      picked_at TEXT,
      updated_at TEXT,
      is_lock INTEGER DEFAULT 0,
      selection_total TEXT,
      total_line REAL,
      result_total TEXT
    )
  `);

  await addColumnIfMissing('picks', 'selection_total', 'TEXT');
  await addColumnIfMissing('picks', 'total_line', 'REAL');
  await addColumnIfMissing('picks', 'result_total', 'TEXT');
  await addColumnIfMissing('picks', 'is_lock', 'INTEGER', 0);

  // Drop the old unique index if it exists
  await pool.query(`DROP INDEX IF EXISTS idx_picks_unique`);

  // Create partial unique indexes to allow separate rows for spread and total picks
  await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_picks_spread_unique ON picks(week, player, game_id) WHERE selection_team IS NOT NULL`);
  await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_picks_total_unique ON picks(week, player, game_id) WHERE selection_total IS NOT NULL`);

  // Performance Indexes
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_picks_player_game ON picks(player, game_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_games_season_week ON games(season, week)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_games_commence_time ON games(commence_time)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_teams_conference ON teams(conference)`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS team_mappings (
      id ${idColumn},
      api_name TEXT NOT NULL UNIQUE,
      team_id INTEGER NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS rivalries (
      id ${idColumn},
      team1 TEXT NOT NULL,
      team2 TEXT NOT NULL,
      trophy_name TEXT,
      UNIQUE(team1, team2)
    )
  `);
}

function buildBulkInsertQuery(table, columns, rows, conflictTarget, updateColumns = []) {
  if (!rows.length) {
    return { query: '', values: [] };
  }

  const values = [];
  const valuePlaceholders = rows.map((row, rowIndex) => {
    const placeholders = columns.map((column, colIndex) => {
      values.push(row[column]);
      return `$${rowIndex * columns.length + colIndex + 1}`;
    });
    return `(${placeholders.join(', ')})`;
  }).join(', ');

  let query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${valuePlaceholders}`;

  if (conflictTarget) {
    query += ` ON CONFLICT (${conflictTarget})`;
    if (updateColumns.length > 0) {
      const updates = updateColumns.map((column) => `${column} = EXCLUDED.${column}`).join(', ');
      query += ` DO UPDATE SET ${updates}`;
    } else {
      query += ' DO NOTHING';
    }
  }

  return { query, values };
}

async function seedPlayers() {
  const defaultPlayers = [
    { name: 'Aric', full_name: 'Aric Myers' },
    { name: 'Nick', full_name: 'Nicholas Wood' },
    { name: 'Cisco', full_name: 'Andrew Cisco' }
  ];

  const { query, values } = buildBulkInsertQuery(
    'players',
    ['name', 'full_name'],
    defaultPlayers,
    'name',
    ['full_name']
  );

  if (query) {
    await pool.query(query, values);
  }

  return defaultPlayers.length;
}

// async function seedTeams() {
//   const toLogo = (school) => {
//     const name = school.toLowerCase()
//       .replace(/\(fl\)/g, 'fl')
//       .replace(/\(oh\)/g, 'oh')
//       .replace(/[^a-z0-9 ]/g, '')
//       .trim()
//       .replace(/\s+/g, '-');
//     return `/logos/${name}.png`;
//   };
//   const teams = [
//     { school: 'Boston College', nickname: 'Eagles', conference: 'ACC', logo: toLogo('Boston College'), school_primary_color: '#98002E', stadium_name: 'Alumni Stadium', stadium_city: 'Chestnut Hill', stadium_state: 'Massachusetts' },
//     { school: 'California', nickname: 'Golden Bears', conference: 'ACC', logo: toLogo('California'), school_primary_color: '#FDB515', stadium_name: 'California Memorial Stadium', stadium_city: 'Berkeley', stadium_state: 'California' },
//     { school: 'Clemson', nickname: 'Tigers', conference: 'ACC', logo: toLogo('Clemson'), school_primary_color: '#522D80', stadium_name: 'Memorial Stadium', stadium_city: 'Clemson', stadium_state: 'South Carolina' },
//     { school: 'Duke', nickname: 'Blue Devils', conference: 'ACC', logo: toLogo('Duke'), school_primary_color: '#FFFFFF', stadium_name: 'Wallace Wade Stadium', stadium_city: 'Durham', stadium_state: 'North Carolina' },
//     { school: 'Florida State', nickname: 'Seminoles', conference: 'ACC', logo: toLogo('Florida State'), school_primary_color: '#782F40', stadium_name: 'Doak Campbell Stadium', stadium_city: 'Tallahassee', stadium_state: 'Florida' },
//     { school: 'Georgia Tech', nickname: 'Yellow Jackets', conference: 'ACC', logo: toLogo('Georgia Tech'), school_primary_color: '#B3A369', stadium_name: 'Bobby Dodd Stadium', stadium_city: 'Atlanta', stadium_state: 'Georgia' },
//     { school: 'Louisville', nickname: 'Cardinals', conference: 'ACC', logo: toLogo('Louisville'), school_primary_color: '#AD0000', stadium_name: 'L&N Federal Credit Union Stadium', stadium_city: 'Louisville', stadium_state: 'Kentucky' },
//     { school: 'Miami (FL)', nickname: 'Hurricanes', conference: 'ACC', logo: toLogo('Miami FL'), school_primary_color: '#005030', stadium_name: 'Hard Rock Stadium', stadium_city: 'Miami Gardens', stadium_state: 'Florida' },
//     { school: 'NC State', nickname: 'Wolfpack', conference: 'ACC', logo: toLogo('NC State'), school_primary_color: '#CC0000', stadium_name: 'Carter–Finley Stadium', stadium_city: 'Raleigh', stadium_state: 'North Carolina' },
//     { school: 'North Carolina', nickname: 'Tar Heels', conference: 'ACC', logo: toLogo('North Carolina'), school_primary_color: '#7BAFD4', stadium_name: 'Kenan Memorial Stadium', stadium_city: 'Chapel Hill', stadium_state: 'North Carolina' },
//     { school: 'Pittsburgh', nickname: 'Panthers', conference: 'ACC', logo: toLogo('Pittsburgh'), school_primary_color: '#003594', stadium_name: 'Acrisure Stadium', stadium_city: 'Pittsburgh', stadium_state: 'Pennsylvania' },
//     { school: 'SMU', nickname: 'Mustangs', conference: 'ACC', logo: toLogo('SMU'), school_primary_color: '#0033A0', stadium_name: 'Gerald J. Ford Stadium', stadium_city: 'Dallas', stadium_state: 'Texas' },
//     { school: 'Stanford', nickname: 'Cardinal', conference: 'ACC', logo: toLogo('Stanford'), school_primary_color: '#8C1515', stadium_name: 'Stanford Stadium', stadium_city: 'Stanford', stadium_state: 'California' },
//     { school: 'Syracuse', nickname: 'Orange', conference: 'ACC', logo: toLogo('Syracuse'), school_primary_color: '#F7641E', stadium_name: 'JMA Wireless Dome', stadium_city: 'Syracuse', stadium_state: 'New York' },
//     { school: 'Virginia', nickname: 'Cavaliers', conference: 'ACC', logo: toLogo('Virginia'), school_primary_color: '#232D4B', stadium_name: 'Scott Stadium', stadium_city: 'Charlottesville', stadium_state: 'Virginia' },
//     { school: 'Virginia Tech', nickname: 'Hokies', conference: 'ACC', logo: toLogo('Virginia Tech'), school_primary_color: '#630031', stadium_name: 'Lane Stadium', stadium_city: 'Blacksburg', stadium_state: 'Virginia' },
//     { school: 'Wake Forest', nickname: 'Demon Deacons', conference: 'ACC', logo: toLogo('Wake Forest'), school_primary_color: '#9E7E38', stadium_name: 'Allegacy Federal Credit Union Stadium', stadium_city: 'Winston-Salem', stadium_state: 'North Carolina' },
//     { school: 'Army', nickname: 'Black Knights', conference: 'American', logo: toLogo('Army'), school_primary_color: '#000000', stadium_name: 'Michie Stadium', stadium_city: 'West Point', stadium_state: 'New York' },
//     { school: 'Charlotte', nickname: '49ers', conference: 'American', logo: toLogo('Charlotte'), school_primary_color: '#FFFFFF', stadium_name: 'Jerry Richardson Stadium', stadium_city: 'Charlotte', stadium_state: 'North Carolina' },
//     { school: 'East Carolina', nickname: 'Pirates', conference: 'American', logo: toLogo('East Carolina'), school_primary_color: '#592A8A', stadium_name: 'Dowdy–Ficklen Stadium', stadium_city: 'Greenville', stadium_state: 'North Carolina' },
//     { school: 'Florida Atlantic', nickname: 'Owls', conference: 'American', logo: toLogo('Florida Atlantic'), school_primary_color: '#003366', stadium_name: 'FAU Stadium', stadium_city: 'Boca Raton', stadium_state: 'Florida' },
//     { school: 'Memphis', nickname: 'Tigers', conference: 'American', logo: toLogo('Memphis'), school_primary_color: '#003087', stadium_name: 'Simmons Bank Liberty Stadium', stadium_city: 'Memphis', stadium_state: 'Tennessee' },
//     { school: 'Navy', nickname: 'Midshipmen', conference: 'American', logo: toLogo('Navy'), school_primary_color: '#000080', stadium_name: 'Navy–Marine Corps Memorial Stadium', stadium_city: 'Annapolis', stadium_state: 'Maryland' },
//     { school: 'North Texas', nickname: 'Mean Green', conference: 'American', logo: toLogo('North Texas'), school_primary_color: '#FFFFFF', stadium_name: 'DATCU Stadium', stadium_city: 'Denton', stadium_state: 'Texas' },
//     { school: 'Rice', nickname: 'Owls', conference: 'American', logo: toLogo('Rice'), school_primary_color: '#C1C6C8', stadium_name: 'Rice Stadium', stadium_city: 'Houston', stadium_state: 'Texas' },
//     { school: 'South Florida', nickname: 'Bulls', conference: 'American', logo: toLogo('South Florida'), school_primary_color: '#006747', stadium_name: 'Raymond James Stadium', stadium_city: 'Tampa', stadium_state: 'Florida' },
//     { school: 'Temple', nickname: 'Owls', conference: 'American', logo: toLogo('Temple'), school_primary_color: '#FFFFFF', stadium_name: 'Lincoln Financial Field', stadium_city: 'Philadelphia', stadium_state: 'Pennsylvania' },
//     { school: 'Tulane', nickname: 'Green Wave', conference: 'American', logo: toLogo('Tulane'), school_primary_color: '#006747', stadium_name: 'Yulman Stadium', stadium_city: 'New Orleans', stadium_state: 'Louisiana' },
//     { school: 'Tulsa', nickname: 'Golden Hurricane', conference: 'American', logo: toLogo('Tulsa'), school_primary_color: '#C8A84B', stadium_name: 'H. A. Chapman Stadium', stadium_city: 'Tulsa', stadium_state: 'Oklahoma' },
//     { school: 'UAB', nickname: 'Blazers', conference: 'American', logo: toLogo('UAB'), school_primary_color: '#006341', stadium_name: 'Protective Stadium', stadium_city: 'Birmingham', stadium_state: 'Alabama' },
//     { school: 'UTSA', nickname: 'Roadrunners', conference: 'American', logo: toLogo('UTSA'), school_primary_color: '#F47920', stadium_name: 'Alamodome', stadium_city: 'San Antonio', stadium_state: 'Texas' },
//     { school: 'Arizona', nickname: 'Wildcats', conference: 'Big 12', logo: toLogo('Arizona'), school_primary_color: '#CC0033', stadium_name: 'Arizona Stadium', stadium_city: 'Tucson', stadium_state: 'Arizona' },
//     { school: 'Arizona State', nickname: 'Sun Devils', conference: 'Big 12', logo: toLogo('Arizona State'), school_primary_color: '#8C1D40', stadium_name: 'Mountain America Stadium', stadium_city: 'Tempe', stadium_state: 'Arizona' },
//     { school: 'Baylor', nickname: 'Bears', conference: 'Big 12', logo: toLogo('Baylor'), school_primary_color: '#FFB81C', stadium_name: 'McLane Stadium', stadium_city: 'Waco', stadium_state: 'Texas' },
//     { school: 'BYU', nickname: 'Cougars', conference: 'Big 12', logo: toLogo('BYU'), school_primary_color: '#FFFFFF', stadium_name: 'LaVell Edwards Stadium', stadium_city: 'Provo', stadium_state: 'Utah' },
//     { school: 'Cincinnati', nickname: 'Bearcats', conference: 'Big 12', logo: toLogo('Cincinnati'), school_primary_color: '#000000', stadium_name: 'Nippert Stadium', stadium_city: 'Cincinnati', stadium_state: 'Ohio' },
//     { school: 'Colorado', nickname: 'Buffaloes', conference: 'Big 12', logo: toLogo('Colorado'), school_primary_color: '#CFB87C', stadium_name: 'Folsom Field', stadium_city: 'Boulder', stadium_state: 'Colorado' },
//     { school: 'Houston', nickname: 'Cougars', conference: 'Big 12', logo: toLogo('Houston'), school_primary_color: '#C8102E', stadium_name: 'TDECU Stadium', stadium_city: 'Houston', stadium_state: 'Texas' },
//     { school: 'Iowa State', nickname: 'Cyclones', conference: 'Big 12', logo: toLogo('Iowa State'), school_primary_color: '#C8102E', stadium_name: 'Jack Trice Stadium', stadium_city: 'Ames', stadium_state: 'Iowa' },
//     { school: 'Kansas', nickname: 'Jayhawks', conference: 'Big 12', logo: toLogo('Kansas'), school_primary_color: '#0051BA', stadium_name: 'David Booth Kansas Memorial Stadium', stadium_city: 'Lawrence', stadium_state: 'Kansas' },
//     { school: 'Kansas State', nickname: 'Wildcats', conference: 'Big 12', logo: toLogo('Kansas State'), school_primary_color: '#FFFFFF', stadium_name: 'Bill Snyder Family Stadium', stadium_city: 'Manhattan', stadium_state: 'Kansas' },
//     { school: 'Oklahoma State', nickname: 'Cowboys', conference: 'Big 12', logo: toLogo('Oklahoma State'), school_primary_color: '#FF6600', stadium_name: 'Boone Pickens Stadium', stadium_city: 'Stillwater', stadium_state: 'Oklahoma' },
//     { school: 'TCU', nickname: 'Horned Frogs', conference: 'Big 12', logo: toLogo('TCU'), school_primary_color: '#C0A077', stadium_name: 'Amon G. Carter Stadium', stadium_city: 'Fort Worth', stadium_state: 'Texas' },
//     { school: 'Texas Tech', nickname: 'Red Raiders', conference: 'Big 12', logo: toLogo('Texas Tech'), school_primary_color: '#CC0000', stadium_name: 'Jones AT&T Stadium', stadium_city: 'Lubbock', stadium_state: 'Texas' },
//     { school: 'UCF', nickname: 'Knights', conference: 'Big 12', logo: toLogo('UCF'), school_primary_color: '#BA9B37', stadium_name: 'FBC Mortgage Stadium', stadium_city: 'Orlando', stadium_state: 'Florida' },
//     { school: 'Utah', nickname: 'Utes', conference: 'Big 12', logo: toLogo('Utah'), school_primary_color: '#808080', stadium_name: 'Rice–Eccles Stadium', stadium_city: 'Salt Lake City', stadium_state: 'Utah' },
//     { school: 'West Virginia', nickname: 'Mountaineers', conference: 'Big 12', logo: toLogo('West Virginia'), school_primary_color: '#002855', stadium_name: 'Milan Puskar Stadium', stadium_city: 'Morgantown', stadium_state: 'West Virginia' },
//     { school: 'Illinois', nickname: 'Fighting Illini', conference: 'Big Ten', logo: toLogo('Illinois'), school_primary_color: '#13294B', stadium_name: 'Memorial Stadium', stadium_city: 'Champaign', stadium_state: 'Illinois' },
//     { school: 'Indiana', nickname: 'Hoosiers', conference: 'Big Ten', logo: toLogo('Indiana'), school_primary_color: '#FFFFFF', stadium_name: 'Memorial Stadium', stadium_city: 'Bloomington', stadium_state: 'Indiana' },
//     { school: 'Iowa', nickname: 'Hawkeyes', conference: 'Big Ten', logo: toLogo('Iowa'), school_primary_color: '#FFCD00', stadium_name: 'Kinnick Stadium', stadium_city: 'Iowa City', stadium_state: 'Iowa' },
//     { school: 'Maryland', nickname: 'Terrapins', conference: 'Big Ten', logo: toLogo('Maryland'), school_primary_color: '#E31937', stadium_name: 'SECU Stadium', stadium_city: 'College Park', stadium_state: 'Maryland' },
//     { school: 'Michigan', nickname: 'Wolverines', conference: 'Big Ten', logo: toLogo('Michigan'), school_primary_color: '#00274C', stadium_name: 'Michigan Stadium', stadium_city: 'Ann Arbor', stadium_state: 'Michigan' },
//     { school: 'Michigan State', nickname: 'Spartans', conference: 'Big Ten', logo: toLogo('Michigan State'), school_primary_color: '#A2AAAD', stadium_name: 'Spartan Stadium', stadium_city: 'East Lansing', stadium_state: 'Michigan' },
//     { school: 'Minnesota', nickname: 'Golden Gophers', conference: 'Big Ten', logo: toLogo('Minnesota'), school_primary_color: '#7A0019', stadium_name: 'Huntington Bank Stadium', stadium_city: 'Minneapolis', stadium_state: 'Minnesota' },
//     { school: 'Nebraska', nickname: 'Cornhuskers', conference: 'Big Ten', logo: toLogo('Nebraska'), school_primary_color: '#E4173E', stadium_name: 'Memorial Stadium', stadium_city: 'Lincoln', stadium_state: 'Nebraska' },
//     { school: 'Northwestern', nickname: 'Wildcats', conference: 'Big Ten', logo: toLogo('Northwestern'), school_primary_color: '#4E2A84', stadium_name: 'Martin Stadium', stadium_city: 'Evanston', stadium_state: 'Illinois' },
//     { school: 'Ohio State', nickname: 'Buckeyes', conference: 'Big Ten', logo: toLogo('Ohio State'), school_primary_color: '#666666', stadium_name: 'Ohio Stadium', stadium_city: 'Columbus', stadium_state: 'Ohio' },
//     { school: 'Oregon', nickname: 'Ducks', conference: 'Big Ten', logo: toLogo('Oregon'), school_primary_color: '#FEE123', stadium_name: 'Autzen Stadium', stadium_city: 'Eugene', stadium_state: 'Oregon' },
//     { school: 'Penn State', nickname: 'Nittany Lions', conference: 'Big Ten', logo: toLogo('Penn State'), school_primary_color: '#FFFFFF', stadium_name: 'Beaver Stadium', stadium_city: 'University Park', stadium_state: 'Pennsylvania' },
//     { school: 'Purdue', nickname: 'Boilermakers', conference: 'Big Ten', logo: toLogo('Purdue'), school_primary_color: '#CEB888', stadium_name: 'Ross–Ade Stadium', stadium_city: 'West Lafayette', stadium_state: 'Indiana' },
//     { school: 'Rutgers', nickname: 'Scarlet Knights', conference: 'Big Ten', logo: toLogo('Rutgers'), school_primary_color: '#CC0033', stadium_name: 'SHI Stadium', stadium_city: 'Piscataway', stadium_state: 'New Jersey' },
//     { school: 'UCLA', nickname: 'Bruins', conference: 'Big Ten', logo: toLogo('UCLA'), school_primary_color: '#FFD100', stadium_name: 'Rose Bowl', stadium_city: 'Pasadena', stadium_state: 'California' },
//     { school: 'USC', nickname: 'Trojans', conference: 'Big Ten', logo: toLogo('USC'), school_primary_color: '#990000', stadium_name: 'Los Angeles Memorial Coliseum', stadium_city: 'Los Angeles', stadium_state: 'California' },
//     { school: 'Washington', nickname: 'Huskies', conference: 'Big Ten', logo: toLogo('Washington'), school_primary_color: '#4B2E83', stadium_name: 'Husky Stadium', stadium_city: 'Seattle', stadium_state: 'Washington' },
//     { school: 'Wisconsin', nickname: 'Badgers', conference: 'Big Ten', logo: toLogo('Wisconsin'), school_primary_color: '#C5050C', stadium_name: 'Camp Randall Stadium', stadium_city: 'Madison', stadium_state: 'Wisconsin' },
//     { school: 'Delaware', nickname: "Fightin' Blue Hens", conference: 'CUSA', logo: toLogo('Delaware'), school_primary_color: '#004C97', stadium_name: 'Delaware Stadium', stadium_city: 'Newark', stadium_state: 'Delaware' },
//     { school: 'FIU', nickname: 'Panthers', conference: 'CUSA', logo: toLogo('FIU'), school_primary_color: '#081E3F', stadium_name: 'Pitbull Stadium', stadium_city: 'Miami', stadium_state: 'Florida' },
//     { school: 'Jacksonville State', nickname: 'Gamecocks', conference: 'CUSA', logo: toLogo('Jacksonville State'), school_primary_color: '#CC0000', stadium_name: 'Burgess–Snow Field', stadium_city: 'Jacksonville', stadium_state: 'Alabama' },
//     { school: 'Kennesaw State', nickname: 'Owls', conference: 'CUSA', logo: toLogo('Kennesaw State'), school_primary_color: '#000000', stadium_name: 'Fifth Third Stadium', stadium_city: 'Kennesaw', stadium_state: 'Georgia' },
//     { school: 'Liberty', nickname: 'Flames', conference: 'CUSA', logo: toLogo('Liberty'), school_primary_color: '#002D62', stadium_name: 'Williams Stadium', stadium_city: 'Lynchburg', stadium_state: 'Virginia' },
//     { school: 'Louisiana Tech', nickname: 'Bulldogs', conference: 'CUSA', logo: toLogo('Louisiana Tech'), school_primary_color: '#E31837', stadium_name: 'Joe Aillet Stadium', stadium_city: 'Ruston', stadium_state: 'Louisiana' },
//     { school: 'Middle Tennessee', nickname: 'Blue Raiders', conference: 'CUSA', logo: toLogo('Middle Tennessee'), school_primary_color: '#0066CC', stadium_name: 'Johnny “Red” Floyd Stadium', stadium_city: 'Murfeesboro', stadium_state: 'Tennessee' },
//     { school: 'Missouri State', nickname: 'Bears', conference: 'CUSA', logo: toLogo('Missouri State'), school_primary_color: '#5E0009', stadium_name: 'Robert W. Plaster Stadium', stadium_city: 'Springfield', stadium_state: 'Missouri' },
//     { school: 'New Mexico State', nickname: 'Aggies', conference: 'CUSA', logo: toLogo('New Mexico State'), school_primary_color: '#891216', stadium_name: 'Aggie Memorial Stadium', stadium_city: 'Las Cruces', stadium_state: 'New Mexico' },
//     { school: 'Sam Houston', nickname: 'Bearkats', conference: 'CUSA', logo: toLogo('Sam Houston'), school_primary_color: '#231F20', stadium_name: 'Bowers Stadium', stadium_city: 'Huntsville', stadium_state: 'Texas' },
//     { school: 'Western Kentucky', nickname: 'Hilltoppers', conference: 'CUSA', logo: toLogo('Western Kentucky'), school_primary_color: '#CC0000', stadium_name: 'Houchens Industries–L. T. Smith Stadium', stadium_city: 'Bowling Green', stadium_state: 'Kentucky' },
//     { school: 'Akron', nickname: 'Zips', conference: 'MAC', logo: toLogo('Akron'), school_primary_color: '#041E42', stadium_name: 'InfoCision Stadium', stadium_city: 'Akron', stadium_state: 'Ohio' },
//     { school: 'Ball State', nickname: 'Cardinals', conference: 'MAC', logo: toLogo('Ball State'), school_primary_color: '#BA0C2F', stadium_name: 'Scheumann Stadium', stadium_city: 'Muncie', stadium_state: 'Indiana' },
//     { school: 'Bowling Green', nickname: 'Falcons', conference: 'MAC', logo: toLogo('Bowling Green'), school_primary_color: '#FE5000', stadium_name: 'Doyt Perry Stadium', stadium_city: 'Bowling Green', stadium_state: 'Ohio' },
//     { school: 'Buffalo', nickname: 'Bulls', conference: 'MAC', logo: toLogo('Buffalo'), school_primary_color: '#F6BE00', stadium_name: 'UB Stadium', stadium_city: 'Amherst', stadium_state: 'New York' },
//     { school: 'Central Michigan', nickname: 'Chippewas', conference: 'MAC', logo: toLogo('Central Michigan'), school_primary_color: '#6A0032', stadium_name: 'Kelly/Shorts Stadium', stadium_city: 'Mount Pleasant', stadium_state: 'Michigan' },
//     { school: 'Eastern Michigan', nickname: 'Eagles', conference: 'MAC', logo: toLogo('Eastern Michigan'), school_primary_color: '#006633', stadium_name: 'Rynearson Stadium', stadium_city: 'Ypsilanti', stadium_state: 'Michigan' },
//     { school: 'Kent State', nickname: 'Golden Flashes', conference: 'MAC', logo: toLogo('Kent State'), school_primary_color: '#002664', stadium_name: 'Dix Stadium', stadium_city: 'Kent', stadium_state: 'Ohio' },
//     { school: 'Miami (OH)', nickname: 'RedHawks', conference: 'MAC', logo: toLogo('Miami OH'), school_primary_color: '#B61E2E', stadium_name: 'Yager Stadium', stadium_city: 'Oxford', stadium_state: 'Ohio' },
//     { school: 'Northern Illinois', nickname: 'Huskies', conference: 'MAC', logo: toLogo('Northern Illinois'), school_primary_color: '#BA0C2F', stadium_name: 'Huskie Stadium', stadium_city: 'DeKalb', stadium_state: 'Illinois' },
//     { school: 'Ohio', nickname: 'Bobcats', conference: 'MAC', logo: toLogo('Ohio'), school_primary_color: '#2E4E31', stadium_name: 'Peden Stadium', stadium_city: 'Athens', stadium_state: 'Ohio' },
//     { school: 'Sacramento State', nickname: 'Hornets', conference: 'MAC', logo: toLogo('Sacramento State'), school_primary_color: '#004E38', stadium_name: 'Hornet Stadium', stadium_city: 'Sacramento', stadium_state: 'California' },
//     { school: 'Toledo', nickname: 'Rockets', conference: 'MAC', logo: toLogo('Toledo'), school_primary_color: '#0039A6', stadium_name: 'Glass Bowl', stadium_city: 'Toledo', stadium_state: 'Ohio' },
//     { school: 'UMass', nickname: 'Minutemen', conference: 'MAC', logo: toLogo('UMass'), school_primary_color: '#881124', stadium_name: 'Warren McGuirk Alumni Stadium', stadium_city: 'Amherst', stadium_state: 'Massachusetts' },
//     { school: 'Western Michigan', nickname: 'Broncos', conference: 'MAC', logo: toLogo('Western Michigan'), school_primary_color: '#4B331A', stadium_name: 'Waldo Stadium', stadium_city: 'Kalamazoo', stadium_state: 'Michigan' },
//     { school: 'Air Force', nickname: 'Falcons', conference: 'Mountain West', logo: toLogo('Air Force'), school_primary_color: '#8A8D8F', stadium_name: 'Falcon Stadium', stadium_city: 'Colorado Springs', stadium_state: 'Colorado' },
//     { school: 'Boise State', nickname: 'Broncos', conference: 'Mountain West', logo: toLogo('Boise State'), school_primary_color: '#0033A0', stadium_name: 'Albertsons Stadium', stadium_city: 'Boise', stadium_state: 'Idaho' },
//     { school: 'Colorado State', nickname: 'Rams', conference: 'Mountain West', logo: toLogo('Colorado State'), school_primary_color: '#1E4D2B', stadium_name: 'Canvas Stadium', stadium_city: 'Fort Collins', stadium_state: 'Colorado' },
//     { school: 'Fresno State', nickname: 'Bulldogs', conference: 'Mountain West', logo: toLogo('Fresno State'), school_primary_color: '#C41230', stadium_name: 'Valley Children’s Stadium', stadium_city: 'Fresno', stadium_state: 'California' },
//     { school: 'Hawaiʻi', nickname: 'Rainbow Warriors', conference: 'Mountain West', logo: toLogo('Hawaii'), school_primary_color: '#024731', stadium_name: 'Clarence T. C. Ching Athletics Complex', stadium_city: 'Honolulu', stadium_state: 'Hawaii' },
//     { school: 'Nevada', nickname: 'Wolf Pack', conference: 'Mountain West', logo: toLogo('Nevada'), school_primary_color: '#807B6F', stadium_name: 'Mackay Stadium', stadium_city: 'Reno', stadium_state: 'Nevada' },
//     { school: 'New Mexico', nickname: 'Lobos', conference: 'Mountain West', logo: toLogo('New Mexico'), school_primary_color: '#BA0C2F', stadium_name: 'University Stadium', stadium_city: 'Albuquerque', stadium_state: 'New Mexico' },
//     { school: 'San Diego State', nickname: 'Aztecs', conference: 'Mountain West', logo: toLogo('San Diego State'), school_primary_color: '#000000', stadium_name: 'Snapdragon Stadium', stadium_city: 'San Diego', stadium_state: 'California' },
//     { school: 'San Jose State', nickname: 'Spartans', conference: 'Mountain West', logo: toLogo('San Jose State'), school_primary_color: '#0055A2', stadium_name: 'CEFCU Stadium', stadium_city: 'San Jose', stadium_state: 'California' },
//     { school: 'UNLV', nickname: 'Rebels', conference: 'Mountain West', logo: toLogo('UNLV'), school_primary_color: '#CF0A2C', stadium_name: 'Allegiant Stadium', stadium_city: 'Paradise', stadium_state: 'Nevada' },
//     { school: 'Utah State', nickname: 'Aggies', conference: 'Mountain West', logo: toLogo('Utah State'), school_primary_color: '#8B8D8F', stadium_name: 'Maverik Stadium', stadium_city: 'Logan', stadium_state: 'Utah' },
//     { school: 'Wyoming', nickname: 'Cowboys', conference: 'Mountain West', logo: toLogo('Wyoming'), school_primary_color: '#492F24', stadium_name: 'War Memorial Stadium', stadium_city: 'Laramie', stadium_state: 'Wyoming' },
//     { school: 'Alabama', nickname: 'Crimson Tide', conference: 'SEC', logo: toLogo('Alabama'), school_primary_color: '#828A8F', stadium_name: 'Bryant–Denny Stadium', stadium_city: 'Tuscaloosa', stadium_state: 'Alabama' },
//     { school: 'Arkansas', nickname: 'Razorbacks', conference: 'SEC', logo: toLogo('Arkansas'), school_primary_color: '#9D2235', stadium_name: 'Donald W. Reynolds Razorback Stadium', stadium_city: 'Fayetteville', stadium_state: 'Arkansas' },
//     { school: 'Auburn', nickname: 'Tigers', conference: 'SEC', logo: toLogo('Auburn'), school_primary_color: '#0C2340', stadium_name: 'Jordan–Hare Stadium', stadium_city: 'Auburn', stadium_state: 'Alabama' },
//     { school: 'Florida', nickname: 'Gators', conference: 'SEC', logo: toLogo('Florida'), school_primary_color: '#0021A5', stadium_name: 'Ben Hill Griffin Stadium', stadium_city: 'Gainesville', stadium_state: 'Florida' },
//     { school: 'Georgia', nickname: 'Bulldogs', conference: 'SEC', logo: toLogo('Georgia'), school_primary_color: '#BA0C2F', stadium_name: 'Sanford Stadium', stadium_city: 'Athens', stadium_state: 'Georgia' },
//     { school: 'Kentucky', nickname: 'Wildcats', conference: 'SEC', logo: toLogo('Kentucky'), school_primary_color: '#0033A0', stadium_name: 'Kroger Field', stadium_city: 'Lexington', stadium_state: 'Kentucky' },
//     { school: 'LSU', nickname: 'Tigers', conference: 'SEC', logo: toLogo('LSU'), school_primary_color: '#461D7C', stadium_name: 'Tiger Stadium', stadium_city: 'Baton Rouge', stadium_state: 'Louisiana' },
//     { school: 'Mississippi State', nickname: 'Bulldogs', conference: 'SEC', logo: toLogo('Mississippi State'), school_primary_color: '#660000', stadium_name: 'Davis Wade Stadium', stadium_city: 'Starkville', stadium_state: 'Mississippi' },
//     { school: 'Missouri', nickname: 'Tigers', conference: 'SEC', logo: toLogo('Missouri'), school_primary_color: '#000000', stadium_name: 'Faurot Field', stadium_city: 'Columbia', stadium_state: 'Missouri' },
//     { school: 'Oklahoma', nickname: 'Sooners', conference: 'SEC', logo: toLogo('Oklahoma'), school_primary_color: '#F0E68C', stadium_name: 'Gaylord Family Oklahoma Memorial Stadium', stadium_city: 'Norman', stadium_state: 'Oklahoma' },
//     { school: 'Ole Miss', nickname: 'Rebels', conference: 'SEC', logo: toLogo('Ole Miss'), school_primary_color: '#CE1126', stadium_name: 'Vaught–Hemingway Stadium', stadium_city: 'University', stadium_state: 'Mississippi' },
//     { school: 'South Carolina', nickname: 'Gamecocks', conference: 'SEC', logo: toLogo('South Carolina'), school_primary_color: '#73000A', stadium_name: 'Williams–Brice Stadium', stadium_city: 'Columbia', stadium_state: 'South Carolina' },
//     { school: 'Tennessee', nickname: 'Volunteers', conference: 'SEC', logo: toLogo('Tennessee'), school_primary_color: '#58595B', stadium_name: 'Neyland Stadium', stadium_city: 'Knoxville', stadium_state: 'Tennessee' },
//     { school: 'Texas', nickname: 'Longhorns', conference: 'SEC', logo: toLogo('Texas'), school_primary_color: '#333F48', stadium_name: 'Darrell K Royal–Texas Memorial Stadium', stadium_city: 'Austin', stadium_state: 'Texas' },
//     { school: 'Texas A&M', nickname: 'Aggies', conference: 'SEC', logo: toLogo('Texas A&M'), school_primary_color: '#FFFFFF', stadium_name: 'Kyle Field', stadium_city: 'College Station', stadium_state: 'Texas' },
//     { school: 'Vanderbilt', nickname: 'Commodores', conference: 'SEC', logo: toLogo('Vanderbilt'), school_primary_color: '#000000', stadium_name: 'FirstBank Stadium', stadium_city: 'Nashville', stadium_state: 'Tennessee' },
//     { school: 'Appalachian State', nickname: 'Mountaineers', conference: 'Sun Belt', logo: toLogo('Appalachian State'), school_primary_color: '#222222', stadium_name: 'Kidd Brewer Stadium', stadium_city: 'Boone', stadium_state: 'North Carolina' },
//     { school: 'Arkansas State', nickname: 'Red Wolves', conference: 'Sun Belt', logo: toLogo('Arkansas State'), school_primary_color: '#CC092F', stadium_name: 'Centennial Bank Stadium', stadium_city: 'Jonesboro', stadium_state: 'Arkansas' },
//     { school: 'Coastal Carolina', nickname: 'Chanticleers', conference: 'Sun Belt', logo: toLogo('Coastal Carolina'), school_primary_color: '#006F71', stadium_name: 'Brooks Stadium', stadium_city: 'Conway', stadium_state: 'South Carolina' },
//     { school: 'Georgia Southern', nickname: 'Eagles', conference: 'Sun Belt', logo: toLogo('Georgia Southern'), school_primary_color: '#011E41', stadium_name: 'Allen E. Paulson Stadium', stadium_city: 'Statesboro', stadium_state: 'Georgia' },
//     { school: 'Georgia State', nickname: 'Panthers', conference: 'Sun Belt', logo: toLogo('Georgia State'), school_primary_color: '#0039A6', stadium_name: 'Center Parc Stadium', stadium_city: 'Atlanta', stadium_state: 'Georgia' },
//     { school: 'James Madison', nickname: 'Dukes', conference: 'Sun Belt', logo: toLogo('James Madison'), school_primary_color: '#450084', stadium_name: 'Bridgeforth Stadium', stadium_city: 'Harrisonburg', stadium_state: 'Virginia' },
//     { school: 'Louisiana', nickname: "Ragin' Cajuns", conference: 'Sun Belt', logo: toLogo('Louisiana'), school_primary_color: '#CE181E', stadium_name: 'Cajun Field', stadium_city: 'Lafayette', stadium_state: 'Louisiana' },
//     { school: 'Marshall', nickname: 'Thundering Herd', conference: 'Sun Belt', logo: toLogo('Marshall'), school_primary_color: '#00B140', stadium_name: 'Joan C. Edwards Stadium', stadium_city: 'Huntington', stadium_state: 'West Virginia' },
//     { school: 'Old Dominion', nickname: 'Monarchs', conference: 'Sun Belt', logo: toLogo('Old Dominion'), school_primary_color: '#003057', stadium_name: 'Kornblau Field at S. B. Ballard Stadium', stadium_city: 'Norfolk', stadium_state: 'Virginia' },
//     { school: 'South Alabama', nickname: 'Jaguars', conference: 'Sun Belt', logo: toLogo('South Alabama'), school_primary_color: '#00205B', stadium_name: 'Hancock Whitney Stadium', stadium_city: 'Mobile', stadium_state: 'Alabama' },
//     { school: 'Southern Miss', nickname: 'Golden Eagles', conference: 'Sun Belt', logo: toLogo('Southern Miss'), school_primary_color: '#FFAB00', stadium_name: 'M. M. Roberts Stadium', stadium_city: 'Hattiesburg', stadium_state: 'Mississippi' },
//     { school: 'Texas State', nickname: 'Bobcats', conference: 'Sun Belt', logo: toLogo('Texas State'), school_primary_color: '#501214', stadium_name: 'UFCU Stadium', stadium_city: 'San Marcos', stadium_state: 'Texas' },
//     { school: 'Troy', nickname: 'Trojans', conference: 'Sun Belt', logo: toLogo('Troy'), school_primary_color: '#8A2432', stadium_name: 'Veterans Memorial Stadium', stadium_city: 'Troy', stadium_state: 'Alabama' },
//     { school: 'ULM', nickname: 'Warhawks', conference: 'Sun Belt', logo: toLogo('ULM'), school_primary_color: '#840D2F', stadium_name: 'Malone Stadium', stadium_city: 'Monroe', stadium_state: 'Louisiana' },
//     { school: 'Notre Dame', nickname: 'Fighting Irish', conference: 'Independent', logo: toLogo('Notre Dame'), school_primary_color: '#0C2340', stadium_name: 'Notre Dame Stadium', stadium_city: 'Notre Dame', stadium_state: 'Indiana' },
//     { school: 'UConn', nickname: 'Huskies', conference: 'Independent', logo: toLogo('UConn'), school_primary_color: '#000E2F', stadium_name: 'Pratt & Whitney Stadium at Rentschler Field', stadium_city: 'East Hartford', stadium_state: 'Connecticut' },
//     { school: 'Colgate', nickname: 'Raiders', conference: 'Patriot', logo: toLogo('Colgate'), school_primary_color: '#FFFFFF', stadium_name: 'Andy Kerr Stadium', stadium_city: 'Hamilton', stadium_state: 'New York' },
//     { school: 'UC Davis', nickname: 'Aggies', conference: 'Big Sky', logo: toLogo('UC Davis'), school_primary_color: '#FFBF00', stadium_name: 'UC Davis Health Stadium', stadium_city: 'Davis', stadium_state: 'California' }
//   ];

//   for (const team of teams) {
//     await pool.query(`
//       INSERT INTO teams (school, nickname, conference, logo, school_primary_color, stadium_name, stadium_city, stadium_state) 
//       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
//       ON CONFLICT(school) DO UPDATE SET
//         logo = EXCLUDED.logo,
//         nickname = EXCLUDED.nickname,
//         conference = EXCLUDED.conference,
//         school_primary_color = COALESCE(EXCLUDED.school_primary_color, teams.school_primary_color),
//         stadium_name = EXCLUDED.stadium_name,
//         stadium_city = EXCLUDED.stadium_city,
//         stadium_state = EXCLUDED.stadium_state
//     `, [team.school, team.nickname, team.conference, team.logo, team.school_primary_color, team.stadium_name, team.stadium_city, team.stadium_state]);
//   }
// }

async function seedTeams() {
  // Teams are already seeded
}

async function seedWeeks() {
  const weeks = buildSeasonWeeks();

  const { query, values } = buildBulkInsertQuery(
    'weeks',
    ['week', 'season', 'label', 'starts_on', 'ends_on'],
    weeks,
    'season, week'
  );

  if (query) {
    await pool.query(query, values);
  }

  return weeks.length;
}

async function seedRivalries() {
  const rivalries = [
    { team1: 'Michigan', team2: 'Ohio State', trophy_name: 'The Game' },
    { team1: 'Alabama', team2: 'Auburn', trophy_name: 'Iron Bowl' },
    { team1: 'Oklahoma', team2: 'Texas', trophy_name: 'Red River Rivalry' },
    { team1: 'Army', team2: 'Navy', trophy_name: "America's Game" },
    { team1: 'Notre Dame', team2: 'USC', trophy_name: 'Jeweled Shillelagh' },
    { team1: 'Florida', team2: 'Florida State', trophy_name: 'Sunshine Showdown' },
    { team1: 'Georgia', team2: 'Florida', trophy_name: "World's Largest Outdoor Cocktail Party" },
    { team1: 'Clemson', team2: 'South Carolina', trophy_name: 'Palmetto Bowl' },
    { team1: 'Oregon', team2: 'Oregon State', trophy_name: 'Civil War (officially no longer branded that way)' },
    { team1: 'UCLA', team2: 'USC', trophy_name: 'Victory Bell' },
    { team1: 'Texas', team2: 'Texas A&M', trophy_name: 'Lone Star Showdown' },
    { team1: 'Auburn', team2: 'Georgia', trophy_name: "Deep South's Oldest Rivalry" },
    { team1: 'Michigan', team2: 'Michigan State', trophy_name: 'Paul Bunyan Trophy' },
    { team1: 'Ole Miss', team2: 'Mississippi State', trophy_name: 'Egg Bowl' },
    { team1: 'Minnesota', team2: 'Wisconsin', trophy_name: "Paul Bunyan's Axe" },
    { team1: 'California', team2: 'Stanford', trophy_name: 'Big Game' },
    { team1: 'Tennessee', team2: 'Alabama', trophy_name: 'Third Saturday in October' },
    { team1: 'Oklahoma', team2: 'Oklahoma State', trophy_name: 'Bedlam' },
    { team1: 'Washington', team2: 'Washington State', trophy_name: 'Apple Cup' },
    { team1: 'Pittsburgh', team2: 'West Virginia', trophy_name: 'Backyard Brawl' },
    { team1: 'Virginia', team2: 'Virginia Tech', trophy_name: 'Commonwealth Clash' },
    { team1: 'Iowa', team2: 'Iowa State', trophy_name: 'Cy-Hawk Trophy' },
    { team1: 'LSU', team2: 'Alabama', trophy_name: 'SEC Heavyweight Rivalry' },
    { team1: 'North Carolina', team2: 'Duke', trophy_name: 'Victory Bell' },
    { team1: 'Penn State', team2: 'Pittsburgh', trophy_name: 'Keystone Classic' },
    { team1: 'Nebraska', team2: 'Oklahoma', trophy_name: 'Historic Big Eight Rivalry' },
    { team1: 'Kentucky', team2: 'Louisville', trophy_name: "Governor's Cup" },
    { team1: 'NC State', team2: 'North Carolina', trophy_name: 'Rivalry of the Triangle' },
    { team1: 'Arizona', team2: 'Arizona State', trophy_name: 'Territorial Cup' },
    { team1: 'Utah', team2: 'BYU', trophy_name: 'Holy War' },
    { team1: 'Miami (FL)', team2: 'Florida State', trophy_name: 'State Supremacy' },
    { team1: 'Missouri', team2: 'Kansas', trophy_name: 'Border War' },
    { team1: 'LSU', team2: 'Ole Miss', trophy_name: 'Magnolia Bowl' },
    { team1: 'Purdue', team2: 'Indiana', trophy_name: 'Old Oaken Bucket' },
    { team1: 'Illinois', team2: 'Northwestern', trophy_name: 'Land of Lincoln Trophy' },
    { team1: 'Iowa', team2: 'Nebraska', trophy_name: 'Heroes Game' },
    { team1: 'Baylor', team2: 'TCU', trophy_name: 'Revivalry' },
    { team1: 'Cincinnati', team2: 'Miami (OH)', trophy_name: 'Victory Bell' },
    { team1: 'Colorado', team2: 'Colorado State', trophy_name: 'Rocky Mountain Showdown' },
    { team1: 'Georgia Tech', team2: 'Georgia', trophy_name: 'Clean, Old-Fashioned Hate' },
    { team1: 'Arkansas', team2: 'LSU', trophy_name: 'Battle for the Golden Boot' },
    { team1: 'Arkansas', team2: 'Texas', trophy_name: 'Southwest Classic' },
    { team1: 'Houston', team2: 'Rice', trophy_name: 'Bayou Bucket' },
    { team1: 'SMU', team2: 'TCU', trophy_name: 'Battle for the Iron Skillet' },
    { team1: 'Air Force', team2: 'Army', trophy_name: "Commander-in-Chief's Trophy" },
    { team1: 'Air Force', team2: 'Navy', trophy_name: "Commander-in-Chief's Trophy" },
    { team1: 'Boise State', team2: 'Fresno State', trophy_name: 'Mountain West Rivalry' },
    { team1: 'Virginia Tech', team2: 'West Virginia', trophy_name: 'Black Diamond Trophy' },
    { team1: 'Tennessee', team2: 'Vanderbilt', trophy_name: 'In-State SEC Rivalry' },
    { team1: 'Wake Forest', team2: 'NC State', trophy_name: 'Tobacco Road Rivalry' }
  ];

  const { query, values } = buildBulkInsertQuery(
    'rivalries',
    ['team1', 'team2', 'trophy_name'],
    rivalries,
    'team1, team2',
    ['trophy_name']
  );

  if (query) {
    await pool.query(query, values);
  }
}

async function ensureWeekRow(season, week) {
  await pool.query(
    `INSERT INTO weeks (week, season, label, starts_on, ends_on)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (season, week) DO NOTHING`,
    [
      week,
      season,
      `${season} Week ${week}`,
      `${season}-08-01T00:00:00Z`,
      `${season}-12-31T23:59:59Z`
    ]
  );
}

// Clears all is_lock flags for a player/week/season, then sets the chosen pick as lock
async function setHistoricalLock(player, week, season, gameId, lockType) {
  await pool.query(
    `UPDATE picks SET is_lock = 0, updated_at = $1
     WHERE player = $2 AND week = $3 AND game_id IN (
       SELECT p.game_id FROM picks p JOIN games g ON p.game_id = g.id
       WHERE p.player = $2 AND p.week = $3 AND g.season = $4
     )`,
    [new Date().toISOString(), player, week, season]
  );
  const column = lockType === 'spread' ? 'selection_team' : 'selection_total';
  await pool.query(
    `UPDATE picks SET is_lock = 1, updated_at = $1
     WHERE player = $2 AND week = $3 AND game_id = $4 AND ${column} IS NOT NULL`,
    [new Date().toISOString(), player, week, gameId]
  );
}

async function getPlayers() {
  const cacheKey = 'players';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const { rows } = await pool.query('SELECT id, name, full_name FROM players ORDER BY id');
  cache.set(cacheKey, rows);
  return rows;
}

async function getTeams() {
  const cacheKey = 'teams';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const { rows } = await pool.query('SELECT id, school, nickname, conference, logo, school_primary_color, stadium_name, stadium_city, stadium_state FROM teams ORDER BY school ASC');
  cache.set(cacheKey, rows);
  return rows;
}

async function getSeasons() {
  const cacheKey = 'seasons';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const { rows } = await pool.query('SELECT DISTINCT season FROM weeks ORDER BY season DESC');
  const seasons = rows.map((row) => row.season);
  cache.set(cacheKey, seasons);
  return seasons;
}

async function getWeeks(season) {
  const cacheKey = `weeks_${season || 'all'}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  if (season) {
    const { rows } = await pool.query('SELECT id, week, season, label, starts_on, ends_on FROM weeks WHERE season = $1 ORDER BY week', [season]);
    cache.set(cacheKey, rows);
    return rows;
  }
  const { rows } = await pool.query('SELECT id, week, season, label, starts_on, ends_on FROM weeks ORDER BY season DESC, week');
  cache.set(cacheKey, rows);
  return rows;
}

async function getWeekGames(week, season) {
  if (season) {
    const cacheKey = `week_games_${season}_${week}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const { rows } = await pool.query(`
      SELECT 
        g.*, 
        ht.logo as home_logo, at.logo as away_logo,
        ht.school_primary_color as home_color, at.school_primary_color as away_color,
        ht.stadium_name as home_stadium_name,
        ht.stadium_city as home_stadium_city,
        ht.stadium_state as home_stadium_state,
        ht.nickname as home_nickname, at.nickname as away_nickname,
        ht.conference as home_conference, at.conference as away_conference,
        r.trophy_name as rivalry_trophy,
        CASE WHEN EXISTS (
          SELECT 1 FROM games prev_g 
          WHERE (prev_g.home_team = g.home_team OR prev_g.away_team = g.home_team) 
            AND prev_g.season = g.season 
            AND prev_g.week = g.week - 1
        ) THEN 'No' ELSE 'Yes' END as home_cobw,
        CASE WHEN EXISTS (
          SELECT 1 FROM games prev_g 
          WHERE (prev_g.home_team = g.away_team OR prev_g.away_team = g.away_team) 
            AND prev_g.season = g.season 
            AND prev_g.week = g.week - 1
        ) THEN 'No' ELSE 'Yes' END as away_cobw
      FROM games g
      LEFT JOIN teams ht ON g.home_team LIKE ht.school || '%'
      LEFT JOIN teams at ON g.away_team LIKE at.school || '%'
      LEFT JOIN rivalries r ON 
        (g.home_team LIKE r.team1 || '%' AND g.away_team LIKE r.team2 || '%') OR 
        (g.home_team LIKE r.team2 || '%' AND g.away_team LIKE r.team1 || '%')
      WHERE g.week = $1 AND g.season = $2 
      GROUP BY g.id
      ORDER BY g.id ASC, g.commence_time ASC
    `, [week, season]);
    
    // Sort by commence_time
    rows.sort((a, b) => new Date(a.commence_time) - new Date(b.commence_time));
    cache.set(cacheKey, rows, 1800); // Cache for 30 minutes
    return rows;
  }
  return [];
}

async function getPicksByWeek(week, season) {
  const cacheKey = `week_picks_${season || 'all'}_${week}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  if (season) {
    const { rows } = await pool.query(`
      SELECT p.*, g.home_team, g.away_team, g.commence_time, g.is_mandatory, g.spread_home, g.spread_away
      FROM picks p
      JOIN games g ON p.game_id = g.id
      WHERE p.week = $1 AND g.season = $2 
      ORDER BY p.player, p.updated_at DESC
    `, [week, season]);
    cache.set(cacheKey, rows, 1800); // Cache for 30 minutes
    return rows;
  }
  const { rows } = await pool.query(`
    SELECT p.*, g.home_team, g.away_team, g.commence_time, g.is_mandatory, g.spread_home, g.spread_away
    FROM picks p
    JOIN games g ON p.game_id = g.id
    WHERE p.week = $1 
    ORDER BY p.player, p.updated_at DESC
  `, [week]);
  cache.set(cacheKey, rows, 1800); // Cache for 30 minutes
  return rows;
}

async function getGameByApiId(apiGameId) {
  const { rows } = await pool.query('SELECT * FROM games WHERE api_game_id = $1', [apiGameId]);
  return rows[0] || null;
}

async function getGameById(id) {
  const { rows } = await pool.query('SELECT * FROM games WHERE id = $1', [id]);
  return rows[0] || null;
}

function shouldPreserveWeekZero(game, existing) {
  const candidates = [game?.id, game?.api_game_id, existing?.id, existing?.api_game_id];
  return candidates.some(value => {
    const numericValue = Number(value);
    return Number.isInteger(numericValue) && numericValue >= 51 && numericValue <= 58;
  });
}

function resolveGameWeek(game, existing) {
  if (shouldPreserveWeekZero(game, existing)) {
    return 0;
  }

  if (game.week !== undefined && game.week !== null) {
    return game.week;
  }

  return existing?.week ?? null;
}

async function upsertGame(game) {
  const existing = game.api_game_id ? await getGameByApiId(game.api_game_id) : null;
  const normalizedWeek = resolveGameWeek(game, existing);

  if (existing) {
    await pool.query(`
      UPDATE games SET
        week = $1,
        season = $2,
        commence_time = $3,
        home_team = $4,
        away_team = $5,
        site = $6,
        is_televised = $7,
        is_mandatory = $8,
        spread_home = $9,
        spread_away = $10,
        home_price = $11,
        away_price = $12,
        score_home = $13,
        score_away = $14,
        completed = $15,
        updated_at = $16,
        tv_network = $18,
        over_under = $19
      WHERE api_game_id = $17
    `, [normalizedWeek, game.season, game.commence_time, game.home_team, game.away_team, game.site,
        game.is_televised ? 1 : 0, game.is_mandatory ? 1 : 0, game.spread_home, game.spread_away,
        game.home_price, game.away_price, game.score_home, game.score_away, game.completed ? 1 : 0,
        new Date().toISOString(), game.api_game_id, game.tv_network ?? null, game.over_under ?? null]);
    return existing.id;
  }

  const { rows } = await pool.query(`
    INSERT INTO games (
      api_game_id, week, season, commence_time, home_team, away_team, site,
      is_televised, is_mandatory, spread_home, spread_away, home_price, away_price,
      score_home, score_away, completed, updated_at, tv_network, over_under
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
    ) RETURNING id
  `, [game.api_game_id, normalizedWeek, game.season, game.commence_time, game.home_team, game.away_team, game.site,
      game.is_televised ? 1 : 0, game.is_mandatory ? 1 : 0, game.spread_home, game.spread_away,
      game.home_price, game.away_price, game.score_home, game.score_away, game.completed ? 1 : 0,
      new Date().toISOString(), game.tv_network ?? null, game.over_under ?? null]);
  return rows[0].id;
}

async function saveGamesForWeek(week, games, season) {
  for (const game of games) {
    game.week = week;
    game.season = season;
  }

  const result = await saveGamesForSeason(games);
  
  // Invalidate cache
  cache.del(`week_games_${season}_${week}`);
  cache.del(`week_games_all_${week}`);
  
  return result;
}

async function saveGamesForSeason(games) {
  let saved = 0;
  
  // Fetch all existing games for diffing
  const { rows: existingGames } = await pool.query('SELECT api_game_id, spread_home, spread_away, over_under, commence_time FROM games');
  const existingMap = new Map(existingGames.map(g => [g.api_game_id, g]));

  const updates = [];
  const inserts = [];

  for (const game of games) {
    if (!game.season) {
      game.season = getSeasonFromDate(game.commence_time);
    }
    
    const existing = existingMap.get(game.api_game_id);
    
    // Diffing: Only upsert if it's a new game, or if spread, over_under, or commence_time changed
    if (!existing) {
      inserts.push(game);
    } else if (
        existing.spread_home !== game.spread_home || 
        existing.spread_away !== game.spread_away || 
        existing.over_under !== game.over_under ||
        new Date(existing.commence_time).getTime() !== new Date(game.commence_time).getTime()) {
      updates.push(game);
    }
  }

  if (inserts.length > 0) {
    const { query, values } = buildBulkInsertQuery(
      'games',
      [
        'api_game_id', 'week', 'season', 'commence_time', 'home_team', 'away_team', 'site',
        'is_televised', 'is_mandatory', 'spread_home', 'spread_away', 'home_price', 'away_price',
        'score_home', 'score_away', 'completed', 'updated_at', 'tv_network', 'over_under'
      ],
      inserts,
      'api_game_id'
    );

    if (query) {
      await pool.query(query, values);
    }
    saved += inserts.length;
  }

  if (updates.length > 0) {
    const values = [];
    let query = 'UPDATE games SET \n';
    
    const setClauses = {
      commence_time: [],
      spread_home: [],
      spread_away: [],
      over_under: [],
      updated_at: []
    };

    updates.forEach((game, index) => {
      const offset = index * 5;
      values.push(game.api_game_id, game.commence_time, game.spread_home, game.spread_away, game.over_under);
      
      setClauses.commence_time.push(`WHEN api_game_id = $${offset + 1} THEN $${offset + 2}`);
      setClauses.spread_home.push(`WHEN api_game_id = $${offset + 1} THEN $${offset + 3}`);
      setClauses.spread_away.push(`WHEN api_game_id = $${offset + 1} THEN $${offset + 4}`);
      setClauses.over_under.push(`WHEN api_game_id = $${offset + 1} THEN $${offset + 5}`);
      setClauses.updated_at.push(`WHEN api_game_id = $${offset + 1} THEN '${new Date().toISOString()}'`);
    });

    query += `commence_time = CASE ${setClauses.commence_time.join(' ')} ELSE commence_time END,\n`;
    query += `spread_home = CASE ${setClauses.spread_home.join(' ')} ELSE spread_home END,\n`;
    query += `spread_away = CASE ${setClauses.spread_away.join(' ')} ELSE spread_away END,\n`;
    query += `over_under = CASE ${setClauses.over_under.join(' ')} ELSE over_under END,\n`;
    query += `updated_at = CASE ${setClauses.updated_at.join(' ')} ELSE updated_at END\n`;
    
    query += `WHERE api_game_id IN (${updates.map((_, i) => `$${i * 5 + 1}`).join(', ')})`;

    await pool.query(query, values);
    saved += updates.length;
  }

  if (saved > 0) {
    // Invalidate cache for all weeks in the season
    // We don't know exactly which weeks were updated, so we clear the whole season
    const seasons = [...new Set(games.map(g => g.season).filter(Boolean))];
    for (const s of seasons) {
      // We can't easily iterate all weeks, so we rely on the TTL or clear specific known keys if needed.
      // For now, we'll just let the TTL handle it, or we could clear the entire cache if we wanted to be safe.
      // A better approach would be to track which weeks were updated and clear those specific keys.
      // Since we don't have a way to clear by prefix in node-cache, we'll just clear the whole cache for simplicity and safety.
      cache.flushAll();
    }
  }

  return saved;
}

async function saveManualGame(week, season, gameData) {
  const manualId = gameData.api_game_id || `manual-${season}-${week}-${Date.now()}`;
  const result = await upsertGame({
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

  // Invalidate cache
  cache.del(`week_games_${season}_${week}`);
  cache.del(`week_games_all_${week}`);

  return result;
}

async function updateScoresFromSeason(scoreGames) {
  let updated = 0;
  
  // Fetch existing games to diff scores
  const { rows: existingGames } = await pool.query('SELECT id, api_game_id, score_home, score_away, completed FROM games');
  const existingMap = new Map(existingGames.map(g => [g.api_game_id, g]));

  const updates = [];

  for (const game of scoreGames) {
    const existing = existingMap.get(game.api_game_id);
    if (!existing) continue;

    // Only update the database if the game is completed
    if (!game.completed) continue;

    const isCompleted = game.completed ? 1 : 0;

    // Diffing: Only update if scores or completed status changed
    if (existing.score_home !== game.score_home || 
        existing.score_away !== game.score_away || 
        existing.completed !== isCompleted) {
      updates.push({ ...game, isCompleted, id: existing.id });
    }
  }

  if (updates.length > 0) {
    const values = [];
    let query = 'UPDATE games SET \n';
    
    const setClauses = {
      score_home: [],
      score_away: [],
      completed: [],
      updated_at: []
    };

    updates.forEach((game, index) => {
      const offset = index * 4;
      values.push(game.api_game_id, game.score_home, game.score_away, game.isCompleted);
      
      setClauses.score_home.push(`WHEN api_game_id = $${offset + 1} THEN $${offset + 2}`);
      setClauses.score_away.push(`WHEN api_game_id = $${offset + 1} THEN $${offset + 3}`);
      setClauses.completed.push(`WHEN api_game_id = $${offset + 1} THEN $${offset + 4}`);
      setClauses.updated_at.push(`WHEN api_game_id = $${offset + 1} THEN '${new Date().toISOString()}'`);
    });

    query += `score_home = CASE ${setClauses.score_home.join(' ')} ELSE score_home END,\n`;
    query += `score_away = CASE ${setClauses.score_away.join(' ')} ELSE score_away END,\n`;
    query += `completed = CASE ${setClauses.completed.join(' ')} ELSE completed END,\n`;
    query += `updated_at = CASE ${setClauses.updated_at.join(' ')} ELSE updated_at END\n`;
    
    query += `WHERE api_game_id IN (${updates.map((_, i) => `$${i * 4 + 1}`).join(', ')})`;

    await pool.query(query, values);
    updated += updates.length;

    // Update pick results for all updated games
    for (const game of updates) {
      await updatePickResults(game.id);
    }
    
    // Invalidate cache
    cache.flushAll();
  }

  return updated;
}

async function deletePicksForPlayerWeek(player, week, season) {
  const result = await pool.query(`
    DELETE FROM picks 
    WHERE player = $1 
    AND week = $2 
    AND game_id IN (SELECT id FROM games WHERE season = $3)
  `, [player, week, season]);

  // Invalidate cache
  cache.del(`week_picks_${season}_${week}`);
  cache.del(`week_picks_all_${week}`);
  cache.del(`week_summary_${season}_${week}`);
  cache.del(`season_summary_${season}`);
  cache.del('summary_alltime');

  return result;
}

async function updatePickResults(gameId) {
  const game = await getGameById(gameId);
  if (!game) return;
  const { rows: picks } = await pool.query('SELECT * FROM picks WHERE game_id = $1', [gameId]);
  for (const pick of picks) {
    const result = determinePickResult(game, pick);
    await pool.query('UPDATE picks SET result = $1, updated_at = $2 WHERE id = $3', [result, new Date().toISOString(), pick.id]);
  }
}

async function savePick(week, player, pick) {
  const game = await getGameById(pick.gameId);
  if (!game) {
    throw new Error(`Game ${pick.gameId} not found`);
  }

  const savedPicks = [];

  // 1. Save Spread Pick if present
  if (pick.selectionTeam) {
    const result = determinePickResult(game, {
      selection_team: pick.selectionTeam,
      selection_side: pick.selectionSide,
      spread: pick.spread
    });

    const isSpreadLock = pick.isLock && pick.lockType === 'spread';

    const { rows } = await pool.query(`
      INSERT INTO picks (
        week, player, game_id, selection_team, selection_side, spread,
        is_mandatory, result, picked_at, updated_at, is_lock
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      )
      ON CONFLICT (week, player, game_id) WHERE selection_team IS NOT NULL DO UPDATE SET
        selection_team = EXCLUDED.selection_team,
        selection_side = EXCLUDED.selection_side,
        spread = EXCLUDED.spread,
        is_mandatory = EXCLUDED.is_mandatory,
        result = EXCLUDED.result,
        updated_at = EXCLUDED.updated_at,
        is_lock = EXCLUDED.is_lock
      RETURNING *
    `, [
      week, player, pick.gameId, pick.selectionTeam, pick.selectionSide, pick.spread,
      pick.isMandatory ? 1 : 0, result, new Date().toISOString(), new Date().toISOString(),
      isSpreadLock ? 1 : 0
    ]);
    savedPicks.push(rows[0]);
  }

  // 2. Save Total Pick if present
  if (pick.selectionTotal) {
    const result_total = determineTotalResult(game, {
      selection_total: pick.selectionTotal,
      total_line: pick.totalLine
    });

    const isTotalLock = pick.isLock && pick.lockType === 'total';

    const { rows } = await pool.query(`
      INSERT INTO picks (
        week, player, game_id, selection_total, total_line, result,
        is_mandatory, picked_at, updated_at, is_lock
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
      )
      ON CONFLICT (week, player, game_id) WHERE selection_total IS NOT NULL DO UPDATE SET
        selection_total = EXCLUDED.selection_total,
        total_line = EXCLUDED.total_line,
        result = EXCLUDED.result,
        is_mandatory = EXCLUDED.is_mandatory,
        updated_at = EXCLUDED.updated_at,
        is_lock = EXCLUDED.is_lock
      RETURNING *
    `, [
      week, player, pick.gameId, pick.selectionTotal, pick.totalLine, result_total,
      pick.isMandatory ? 1 : 0, new Date().toISOString(), new Date().toISOString(),
      isTotalLock ? 1 : 0
    ]);
    savedPicks.push(rows[0]);
  }

  // Invalidate cache
  cache.del(`week_picks_${game.season}_${week}`);
  cache.del(`week_picks_all_${week}`);
  cache.del(`week_summary_${game.season}_${week}`);
  cache.del(`season_summary_${game.season}`);
  cache.del('summary_alltime');

  return savedPicks[0] || null;
}

async function getWeekSummary(week, season) {
  const cacheKey = `week_summary_${season}_${week}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const summary = {};
  const players = await getPlayers();
  for (const player of players) {
    summary[player.name] = { 
      player: player.name, 
      wins: 0, losses: 0, pushes: 0, pending: 0, total: 0,
      lockWins: 0, lockLosses: 0, lockPushes: 0, lockPending: 0, lockTotal: 0
    };
  }

  const { rows } = season
    ? await pool.query(`
        SELECT player, result, is_lock, COUNT(*) AS count
        FROM picks p JOIN games g ON p.game_id = g.id WHERE p.week = $1 AND g.season = $2 AND p.result IS NOT NULL
        GROUP BY player, result, is_lock
      `, [week, season])
    : await pool.query(`
        SELECT player, result, is_lock, COUNT(*) AS count
        FROM picks p JOIN games g ON p.game_id = g.id WHERE p.week = $1 AND p.result IS NOT NULL
        GROUP BY player, result, is_lock
      `, [week]);

  for (const row of rows) {
    const current = summary[row.player];
    if (current) {
      const count = Number(row.count);
      current.total += count;
      if (row.result === 'win') current.wins += count;
      else if (row.result === 'loss') current.losses += count;
      else if (row.result === 'push') current.pushes += count;
      else current.pending += count;

      if (row.is_lock === 1) {
        current.lockTotal += count;
        if (row.result === 'win') current.lockWins += count;
        else if (row.result === 'loss') current.lockLosses += count;
        else if (row.result === 'push') current.lockPushes += count;
        else current.lockPending += count;
      }
    }
  }
  const result = Object.values(summary);
  cache.set(cacheKey, result, 86400); // Cache for 1 day
  return result;
}

async function getSeasonSummary(season) {
  const cacheKey = `season_summary_${season}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const summary = {};
  const players = await getPlayers();
  for (const player of players) {
    summary[player.name] = { 
      player: player.name, 
      wins: 0, losses: 0, pushes: 0, pending: 0, total: 0,
      lockWins: 0, lockLosses: 0, lockPushes: 0, lockPending: 0, lockTotal: 0
    };
  }
  const { rows } = await pool.query(`
    SELECT player, result, is_lock, COUNT(*) AS count
    FROM picks p JOIN games g ON p.game_id = g.id WHERE g.season = $1 AND p.result IS NOT NULL
    GROUP BY player, result, is_lock
  `, [season]);
  for (const row of rows) {
    const current = summary[row.player];
    if (current) {
      const count = Number(row.count);
      current.total += count;
      if (row.result === 'win') current.wins += count;
      else if (row.result === 'loss') current.losses += count;
      else if (row.result === 'push') current.pushes += count;
      else current.pending += count;

      if (row.is_lock === 1) {
        current.lockTotal += count;
        if (row.result === 'win') current.lockWins += count;
        else if (row.result === 'loss') current.lockLosses += count;
        else if (row.result === 'push') current.lockPushes += count;
        else current.lockPending += count;
      }
    }
  }
  const result = Object.values(summary);
  cache.set(cacheKey, result, 86400); // Cache for 1 day
  return result;
}

async function getAllTimeSummary() {
  const cacheKey = 'all_time_summary';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const summary = {};
  const players = await getPlayers();
  for (const player of players) {
    summary[player.name] = { 
      player: player.name, 
      wins: 0, losses: 0, pushes: 0, pending: 0, total: 0,
      lockWins: 0, lockLosses: 0, lockPushes: 0, lockPending: 0, lockTotal: 0
    };
  }

  if (players.length === 0) {
    return [];
  }

  const { rows } = await pool.query(`
    SELECT player, result, is_lock, COUNT(*) AS count
    FROM picks
    WHERE result IS NOT NULL AND result != ''
    GROUP BY player, result, is_lock
  `);
  for (const row of rows) {
    const current = summary[row.player];
    if (current) {
      const count = Number(row.count);
      current.total += count;
      if (row.result === 'win') current.wins += count;
      else if (row.result === 'loss') current.losses += count;
      else if (row.result === 'push') current.pushes += count;
      else if (row.result === 'pending') current.pending += count;

      if (row.is_lock === 1) {
        current.lockTotal += count;
        if (row.result === 'win') current.lockWins += count;
        else if (row.result === 'loss') current.lockLosses += count;
        else if (row.result === 'push') current.lockPushes += count;
        else if (row.result === 'pending') current.lockPending += count;
      }
    }
  }
  const result = Object.values(summary);
  cache.set(cacheKey, result, 86400); // Cache for 1 day
  return result;
}

async function seedTestData() {
  const season = '2025'; 
  const weekNum = 0;

  await pool.query(`
    INSERT INTO weeks (week, season, label, starts_on, ends_on)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (season, week) DO UPDATE SET label = EXCLUDED.label
  `, [weekNum, season, 'Week 0 (Test Data)', new Date(Date.now() - 86400000 * 7).toISOString(), new Date(Date.now() + 86400000 * 7).toISOString()]);
}

async function getPlayerStats(player, timeRange, week, season) {
  const params = [player];
  let timeFilter = '';

  if (timeRange === 'Week') {
    timeFilter = 'AND g.week = $2 AND g.season = $3';
    params.push(week, season);
  } else if (timeRange === 'Season') {
    timeFilter = 'AND g.season = $2';
    params.push(season);
  } else if (timeRange === 'Last Season') {
    timeFilter = 'AND g.season = $2';
    params.push(String(Number(season) - 1));
  } else if (/^\d{4}$/.test(timeRange)) {
    timeFilter = 'AND g.season = $2';
    params.push(timeRange);
  } else if (timeRange === 'Last 5 Weeks') {
    timeFilter = 'AND g.season = $3 AND g.week BETWEEN $2 - 4 AND $2';
    params.push(week, season);
  } else if (timeRange === 'Last 10 Weeks') {
    timeFilter = 'AND g.season = $3 AND g.week BETWEEN $2 - 9 AND $2';
    params.push(week, season);
  } else if (timeRange === 'Last 30 Days') {
    timeFilter = "AND g.commence_time >= NOW() - INTERVAL '30 days'";
  }

  // 1. Push basic math to SQL (wins, losses, pushes, pending, locks)
  const { rows: [recordRow] } = await pool.query(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN p.result = 'win' THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN p.result = 'loss' THEN 1 ELSE 0 END) as losses,
      SUM(CASE WHEN p.result = 'push' THEN 1 ELSE 0 END) as pushes,
      SUM(CASE WHEN p.result = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN p.is_lock = 1 THEN 1 ELSE 0 END) as lock_total,
      SUM(CASE WHEN p.is_lock = 1 AND p.result = 'win' THEN 1 ELSE 0 END) as lock_wins,
      SUM(CASE WHEN p.is_lock = 1 AND p.result = 'loss' THEN 1 ELSE 0 END) as lock_losses,
      SUM(CASE WHEN p.is_lock = 1 AND p.result = 'push' THEN 1 ELSE 0 END) as lock_pushes,
      SUM(CASE WHEN p.is_lock = 1 AND p.result = 'pending' THEN 1 ELSE 0 END) as lock_pending
    FROM picks p
    JOIN games g ON p.game_id = g.id
    WHERE p.player = $1 ${timeFilter}
  `, params);

  const record = {
    wins: Number(recordRow.wins || 0),
    losses: Number(recordRow.losses || 0),
    pushes: Number(recordRow.pushes || 0),
    pending: Number(recordRow.pending || 0),
    total: Number(recordRow.total || 0)
  };

  const lockRecord = {
    wins: Number(recordRow.lock_wins || 0),
    losses: Number(recordRow.lock_losses || 0),
    pushes: Number(recordRow.lock_pushes || 0),
    pending: Number(recordRow.lock_pending || 0),
    total: Number(recordRow.lock_total || 0)
  };

  // 2. Fetch only the necessary data for streaks and complex conference/team logic
  const { rows } = await pool.query(`
    SELECT
      p.result,
      p.result AS total_result,
      p.selection_team,
      p.selection_side,
      p.selection_total,
      g.season,
      g.week,
      g.home_team,
      g.away_team,
      t.school AS team_school,
      t.logo AS team_logo,
      t.conference AS team_conference
    FROM picks p
    JOIN games g ON p.game_id = g.id
    LEFT JOIN teams t ON p.selection_team = t.school
    WHERE p.player = $1 ${timeFilter}
    ORDER BY g.commence_time ASC, g.id ASC
  `, params);

  const countsByConf = {
    fav: new Map(),
    win: new Map(),
    loss: new Map(),
  };
  const teamCounts = {
    wins: new Map(),
    losses: new Map(),
    betsFor: new Map(),
    betsAgainst: new Map(),
  };
  const teamMeta = {
    logos: new Map(),
    conferences: new Map(),
  };

  const recentResults = [];
  const recentTotalResults = [];
  const trendMap = new Map();

  for (const row of rows) {
    const {
      result,
      total_result,
      selection_team,
      selection_side,
      selection_total,
      season: rowSeason,
      week: rowWeek,
      home_team,
      away_team,
      team_school,
      team_logo,
      team_conference,
    } = row;

    if (selection_team) {
      if (team_conference) {
        countsByConf.fav.set(team_conference, (countsByConf.fav.get(team_conference) || 0) + 1);
      }
      if (result === 'win' && team_conference) {
        countsByConf.win.set(team_conference, (countsByConf.win.get(team_conference) || 0) + 1);
      }
      if (result === 'loss' && team_conference) {
        countsByConf.loss.set(team_conference, (countsByConf.loss.get(team_conference) || 0) + 1);
      }
      if (team_school) {
        teamMeta.logos.set(team_school, team_logo || teamMeta.logos.get(team_school));
        if (team_conference) {
          teamMeta.conferences.set(team_school, team_conference);
        }
      }
      if (result === 'win') {
        teamCounts.wins.set(selection_team, (teamCounts.wins.get(selection_team) || 0) + 1);
      }
      if (result === 'loss') {
        teamCounts.losses.set(selection_team, (teamCounts.losses.get(selection_team) || 0) + 1);
      }
      teamCounts.betsFor.set(selection_team, (teamCounts.betsFor.get(selection_team) || 0) + 1);
    }

    if (selection_side) {
      const againstTeam = selection_side === 'home' ? away_team : home_team;
      if (againstTeam) {
        teamCounts.betsAgainst.set(againstTeam, (teamCounts.betsAgainst.get(againstTeam) || 0) + 1);
      }
    }

    const weekKey = `${rowSeason}_${rowWeek}`;
    if (!trendMap.has(weekKey)) {
      trendMap.set(weekKey, { season: rowSeason, week: rowWeek, wins: 0, losses: 0 });
    }
    const trendEntry = trendMap.get(weekKey);
    if (result === 'win') trendEntry.wins += 1;
    else if (result === 'loss') trendEntry.losses += 1;

    if (['win', 'loss', 'push'].includes(result)) {
      recentResults.push(result);
    }
    if (selection_total != null && ['win', 'loss', 'push'].includes(total_result)) {
      recentTotalResults.push(total_result);
    }
  }

  const trend = Array.from(trendMap.values()).sort((a, b) => {
    if (Number(a.season) !== Number(b.season)) return Number(a.season) - Number(b.season);
    return a.week - b.week;
  }).slice(-10);

  const pickTop = (map) => {
    let top = null;
    let maxCount = -1;
    for (const [key, count] of map.entries()) {
      if (count > maxCount) {
        top = key;
        maxCount = count;
      }
    }
    if (!top) return null;
    return { school: top, logo: teamMeta.logos.get(top) || null, count: maxCount, conference: teamMeta.conferences.get(top) || null };
  };

  const pickBestConf = (map) => {
    const entries = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    return entries.length ? { conference: entries[0][0], count: entries[0][1] } : null;
  };

  const computeConfPct = () => {
    const confStats = new Map();

    for (const row of rows) {
      if (row.result !== 'win' && row.result !== 'loss') continue;
      const conference = row.team_conference;
      if (!conference) continue;
      const stats = confStats.get(conference) || { wins: 0, losses: 0 };
      if (row.result === 'win') stats.wins += 1;
      else stats.losses += 1;
      confStats.set(conference, stats);
    }

    let best = null;
    let bestPct = -1;
    let worst = null;
    let worstPct = 101;

    for (const [conference, stats] of confStats.entries()) {
      const total = stats.wins + stats.losses;
      if (total < 5) continue;
      const win_pct = Number(((stats.wins / total) * 100).toFixed(2));
      if (win_pct > bestPct) {
        bestPct = win_pct;
        best = { conference, wins: stats.wins, losses: stats.losses, win_pct };
      }
      if (win_pct < worstPct) {
        worstPct = win_pct;
        worst = { conference, wins: stats.wins, losses: stats.losses, win_pct };
      }
    }
    return { best, worst };
  };

  const { best: bestConfByPct, worst: worstConfByPct } = computeConfPct();

  const currentStreaks = (results) => {
    let currentWin = 0;
    let currentLoss = 0;
    let winActive = true;
    let lossActive = true;

    for (let i = results.length - 1; i >= 0; i--) {
      const result = results[i];
      if (winActive) {
        if (result === 'win') currentWin += 1;
        else if (result === 'loss') winActive = false;
      }
      if (lossActive) {
        if (result === 'loss') currentLoss += 1;
        else if (result === 'win') lossActive = false;
      }
      if (!winActive && !lossActive) break;
    }

    return { currentWin, currentLoss };
  };

  const bestWorstStreaks = (results) => {
    let longestWin = 0;
    let longestLoss = 0;
    let tempWin = 0;
    let tempLoss = 0;

    for (const result of results) {
      if (result === 'win') {
        tempWin += 1;
        tempLoss = 0;
        longestWin = Math.max(longestWin, tempWin);
      } else if (result === 'loss') {
        tempLoss += 1;
        tempWin = 0;
        longestLoss = Math.max(longestLoss, tempLoss);
      } else {
        tempWin = 0;
        tempLoss = 0;
      }
    }

    return { longestWin, longestLoss };
  };

  const currentStreak = currentStreaks(recentResults);
  const longestStreak = bestWorstStreaks(recentResults);
  const currentTotalStreak = currentStreaks(recentTotalResults);
  const longestTotalStreak = bestWorstStreaks(recentTotalResults);

  return {
    favConf: pickBestConf(countsByConf.fav),
    bestConf: pickBestConf(countsByConf.win),
    worstConf: pickBestConf(countsByConf.loss),
    bestConfByPct,
    worstConfByPct,
    topWinSchool: pickTop(teamCounts.wins),
    topLossSchool: pickTop(teamCounts.losses),
    record,
    lockRecord,
    trend,
    mostBetsFor: pickTop(teamCounts.betsFor),
    mostBetsAgainst: pickTop(teamCounts.betsAgainst),
    currentWinStreak: Number(currentStreak.currentWin || 0),
    currentLossStreak: Number(currentStreak.currentLoss || 0),
    longestWinStreak: Number(longestStreak.longestWin || 0),
    longestLossStreak: Number(longestStreak.longestLoss || 0),
    currentTotalWinStreak: Number(currentTotalStreak.currentWin || 0),
    currentTotalLossStreak: Number(currentTotalStreak.currentLoss || 0),
    longestTotalWinStreak: Number(longestTotalStreak.longestWin || 0),
    longestTotalLossStreak: Number(longestTotalStreak.longestLoss || 0),
    last10Form: recentResults.slice(-10).map((r) => (r === 'win' ? 'W' : r === 'loss' ? 'L' : 'P')).join('-'),
  };
}
async function getConferenceStats(player, conference, timeRange, week, season) {
  let timeFilter = '';
  const params = [player, conference];

  if (timeRange === 'Week') {
    timeFilter = 'AND g.week = $3 AND g.season = $4';
    params.push(week, season);
  } else if (timeRange === 'Season') {
    timeFilter = 'AND g.season = $3';
    params.push(season);
  } else if (timeRange === 'Last Season') {
    timeFilter = 'AND g.season = $3';
    params.push(String(Number(season) - 1));
  } else if (/^\d{4}$/.test(timeRange)) {
    timeFilter = 'AND g.season = $3';
    params.push(timeRange);
  } else if (timeRange === 'Last 5 Weeks') {
    timeFilter = 'AND g.season = $4 AND g.week BETWEEN $3 - 4 AND $3';
    params.push(week, season);
  } else if (timeRange === 'Last 10 Weeks') {
    timeFilter = 'AND g.season = $4 AND g.week BETWEEN $3 - 9 AND $3';
    params.push(week, season);
  } else if (timeRange === 'Last 30 Days') {
    timeFilter = "AND g.commence_time >= NOW() - INTERVAL '30 days'";
  }

  const { rows: [bestTeam] } = await pool.query(`
    SELECT p.selection_team as school, t.logo, COUNT(*) as wins
    FROM picks p
    JOIN games g ON p.game_id = g.id
    JOIN teams t ON p.selection_team = t.school
    WHERE p.player = $1 AND t.conference = $2 AND p.result = 'win' ${timeFilter}
    GROUP BY p.selection_team, t.logo
    ORDER BY wins DESC LIMIT 1
  `, params);

  const { rows: [worstTeam] } = await pool.query(`
    SELECT p.selection_team as school, t.logo, COUNT(*) as losses
    FROM picks p
    JOIN games g ON p.game_id = g.id
    JOIN teams t ON p.selection_team = t.school
    WHERE p.player = $1 AND t.conference = $2 AND p.result = 'loss' ${timeFilter}
    GROUP BY p.selection_team, t.logo
    ORDER BY losses DESC LIMIT 1
  `, params);

  const { rows: [mostBetsFor] } = await pool.query(`
    SELECT p.selection_team as school, t.logo, COUNT(*) as count
    FROM picks p
    JOIN games g ON p.game_id = g.id
    JOIN teams t ON p.selection_team = t.school
    WHERE p.player = $1 AND t.conference = $2 ${timeFilter}
    GROUP BY p.selection_team, t.logo
    ORDER BY count DESC LIMIT 1
  `, params);

  const { rows: [mostBetsAgainst] } = await pool.query(`
    SELECT 
      CASE WHEN p.selection_side = 'home' THEN g.away_team ELSE g.home_team END as school,
      t.logo,
      COUNT(*) as count
    FROM picks p
    JOIN games g ON p.game_id = g.id
    JOIN teams t ON t.school = (CASE WHEN p.selection_side = 'home' THEN g.away_team ELSE g.home_team END)
    WHERE p.player = $1 AND t.conference = $2 ${timeFilter}
    GROUP BY CASE WHEN p.selection_side = 'home' THEN g.away_team ELSE g.home_team END, t.logo
    ORDER BY count DESC LIMIT 1
  `, params);

  const { rows: schoolRecords } = await pool.query(`
    SELECT 
      t.school,
      t.logo,
      -- Direct record (betting FOR the team)
      COALESCE(SUM(CASE WHEN p.selection_team = t.school AND p.result = 'win' THEN 1 ELSE 0 END), 0) as wins,
      COALESCE(SUM(CASE WHEN p.selection_team = t.school AND p.result = 'loss' THEN 1 ELSE 0 END), 0) as losses,
      COALESCE(SUM(CASE WHEN p.selection_team = t.school AND p.result = 'push' THEN 1 ELSE 0 END), 0) as pushes,
      COALESCE(SUM(CASE WHEN p.selection_team = t.school THEN 1 ELSE 0 END), 0) as total,
      
      -- Faded record (betting AGAINST the team)
      COALESCE(SUM(CASE WHEN p.selection_team != t.school AND p.result = 'win' THEN 1 ELSE 0 END), 0) as fade_wins,
      COALESCE(SUM(CASE WHEN p.selection_team != t.school AND p.result = 'loss' THEN 1 ELSE 0 END), 0) as fade_losses,
      COALESCE(SUM(CASE WHEN p.selection_team != t.school AND p.result = 'push' THEN 1 ELSE 0 END), 0) as fade_pushes,
      COALESCE(SUM(CASE WHEN p.selection_team != t.school THEN 1 ELSE 0 END), 0) as fade_total,

      -- Average Spread Taken
      ROUND(CAST(COALESCE(AVG(p.spread), 0) AS FLOAT), 1) as avg_spread,

      -- Net Units Won (flat 1-unit bet with -110 vig)
      ROUND(
        CAST(
          COALESCE(SUM(CASE WHEN p.result = 'win' THEN 1.0 ELSE 0 END), 0) - 
          COALESCE(SUM(CASE WHEN p.result = 'loss' THEN 1.1 ELSE 0 END), 0)
         AS FLOAT),
        2
      ) as net_units,

      -- Involved record (betting FOR or AGAINST the team)
      COALESCE(SUM(CASE WHEN p.result = 'win' THEN 1 ELSE 0 END), 0) as inv_wins,
      COALESCE(SUM(CASE WHEN p.result = 'loss' THEN 1 ELSE 0 END), 0) as inv_losses,
      COALESCE(SUM(CASE WHEN p.result = 'push' THEN 1 ELSE 0 END), 0) as inv_pushes,
      COALESCE(COALESCE(COUNT(p.id), 0), 0) as inv_total
    FROM teams t
    LEFT JOIN games g ON (g.home_team = t.school OR g.away_team = t.school) ${timeFilter}
    LEFT JOIN picks p ON p.game_id = g.id AND p.player = $1 AND p.selection_team IS NOT NULL
    WHERE t.conference = $2
    GROUP BY t.school, t.logo
    ORDER BY wins DESC, total DESC
  `, params);

  const { rows: [sosResult] } = await pool.query(`
    SELECT AVG(ABS(p.spread)) as "avgSpread"
    FROM picks p
    JOIN games g ON p.game_id = g.id
    JOIN teams t ON p.selection_team = t.school
    WHERE p.player = $1 AND t.conference = $2 ${timeFilter}
  `, params);

  const strengthOfSchedule = parseFloat(sosResult?.avgSpread || 0);

  return { bestTeam, worstTeam, mostBetsFor, mostBetsAgainst, schoolRecords, strengthOfSchedule };
}

async function getAllyNemesisByConference(player, conference) {
  const confFilter = conference ? 'AND t.conference = $2' : '';
  const params = conference ? [player, conference] : [player];

  const { rows: [ally] } = await pool.query(`
    SELECT p.selection_team as school, t.logo, t.conference, COUNT(*) as count
    FROM picks p
    JOIN teams t ON p.selection_team = t.school
    WHERE p.player = $1 AND p.result = 'win' AND p.selection_team IS NOT NULL ${confFilter}
    GROUP BY p.selection_team, t.logo, t.conference
    ORDER BY count DESC
    LIMIT 1
  `, params);

  const { rows: [nemesis] } = await pool.query(`
    SELECT p.selection_team as school, t.logo, t.conference, COUNT(*) as count
    FROM picks p
    JOIN teams t ON p.selection_team = t.school
    WHERE p.player = $1 AND p.result = 'loss' AND p.selection_team IS NOT NULL ${confFilter}
    GROUP BY p.selection_team, t.logo, t.conference
    ORDER BY count DESC
    LIMIT 1
  `, params);

  return { ally, nemesis };
}

async function getPlayerConferenceStats(player) {
  const { rows } = await pool.query(`
    SELECT t.conference,
           COUNT(*) as total_picks,
           SUM(CASE WHEN p.result = 'win' THEN 1 ELSE 0 END) as wins,
           SUM(CASE WHEN p.result = 'loss' THEN 1 ELSE 0 END) as losses,
           SUM(CASE WHEN p.result = 'push' THEN 1 ELSE 0 END) as pushes,
           ROUND(
             CAST(SUM(CASE WHEN p.result = 'win' THEN 1 ELSE 0 END) AS FLOAT) /
             NULLIF(SUM(CASE WHEN p.result IN ('win','loss') THEN 1 ELSE 0 END), 0) * 100,
             2
           ) as win_pct
    FROM picks p
    JOIN teams t ON p.selection_team = t.school
    WHERE p.player = $1 AND p.selection_team IS NOT NULL
    GROUP BY t.conference
    ORDER BY total_picks DESC
  `, [player]);
  return rows;
}

async function getPlayerTeamStats(player, conference) {
  const confFilter = conference ? 'AND t.conference = $2' : '';
  const params = conference ? [player, conference] : [player];
  const { rows } = await pool.query(`
    SELECT p.selection_team as school,
           t.logo,
           t.conference,
           COUNT(*) as total_picks,
           SUM(CASE WHEN p.result = 'win' THEN 1 ELSE 0 END) as wins,
           SUM(CASE WHEN p.result = 'loss' THEN 1 ELSE 0 END) as losses,
           SUM(CASE WHEN p.result = 'push' THEN 1 ELSE 0 END) as pushes
    FROM picks p
    JOIN teams t ON p.selection_team = t.school
    WHERE p.player = $1 AND p.selection_team IS NOT NULL ${confFilter}
    GROUP BY p.selection_team, t.logo, t.conference
    ORDER BY total_picks DESC
    LIMIT 15
  `, params);
  return rows;
}

async function getPlayerFadedTeamStats(player, conference) {
  const confFilter = conference ? 'AND t.conference = $2' : '';
  const params = conference ? [player, conference] : [player];
  const { rows } = await pool.query(`
    SELECT sub.school,
           t.logo,
           t.conference,
           COUNT(*) as total_picks,
           SUM(CASE WHEN sub.result = 'win' THEN 1 ELSE 0 END) as wins,
           SUM(CASE WHEN sub.result = 'loss' THEN 1 ELSE 0 END) as losses,
           SUM(CASE WHEN sub.result = 'push' THEN 1 ELSE 0 END) as pushes
    FROM (
      SELECT 
        CASE WHEN p.selection_side = 'home' THEN g.away_team ELSE g.home_team END as school,
        p.result
      FROM picks p
      JOIN games g ON p.game_id = g.id
      WHERE p.player = $1 AND p.selection_side IS NOT NULL
    ) sub
    LEFT JOIN teams t ON t.school = sub.school
    WHERE 1=1 ${confFilter}
    GROUP BY sub.school, t.logo, t.conference
    ORDER BY total_picks DESC
    LIMIT 15
  `, params);
  return rows;
}

async function getPlayerTrend(player, timeRange, week, season, conference) {
  let timeFilter = '';
  const params = [player];

  if (timeRange === 'Week') {
    timeFilter = 'AND g.week = $2 AND g.season = $3';
    params.push(week, season);
  } else if (timeRange === 'Season') {
    timeFilter = 'AND g.season = $2';
    params.push(season);
  } else if (timeRange === 'Last Season') {
    timeFilter = 'AND g.season = $2';
    params.push(String(Number(season) - 1));
  } else if (/^\d{4}$/.test(timeRange)) {
    timeFilter = 'AND g.season = $2';
    params.push(timeRange);
  } else if (timeRange === 'Last 5 Weeks') {
    timeFilter = 'AND g.season = $3 AND g.week BETWEEN $2 - 4 AND $2';
    params.push(week, season);
  } else if (timeRange === 'Last 10 Weeks') {
    timeFilter = 'AND g.season = $3 AND g.week BETWEEN $2 - 9 AND $2';
    params.push(week, season);
  } else if (timeRange === 'Last 30 Days') {
    timeFilter = "AND g.commence_time >= NOW() - INTERVAL '30 days'";
  }

  let confFilter = '';
  if (conference) {
    confFilter = `AND t.conference = $${params.length + 1}`;
    params.push(conference);
  }

  const query = `
    SELECT g.season, g.week, 
           COALESCE(SUM(CASE WHEN p.result = 'win' THEN 1 ELSE 0 END), 0) as wins,
           COALESCE(SUM(CASE WHEN p.result = 'loss' THEN 1 ELSE 0 END), 0) as losses
    FROM picks p 
    JOIN games g ON p.game_id = g.id 
    LEFT JOIN teams t ON p.selection_team = t.school
    WHERE p.player = $1 AND p.result IS NOT NULL ${timeFilter} ${confFilter}
    GROUP BY g.season, g.week
    ORDER BY g.season DESC, g.week DESC
  `;

  const { rows } = await pool.query(query, params);
  return (!timeRange || timeRange === 'All-Time') ? rows.reverse() : rows.sort((a, b) => {
    if (a.season !== b.season) return a.season - b.season;
    return a.week - b.week;
  });
}

async function getTeamResearchStats(teamName, timeRange, week, season) {
  let timeFilter = '';
  const params = [teamName];

  if (timeRange === 'Week') {
    timeFilter = 'AND week = $2 AND season = $3';
    params.push(week, season);
  } else if (timeRange === 'Season') {
    timeFilter = 'AND season = $2';
    params.push(season);
  } else if (timeRange === 'Last Season') {
    timeFilter = 'AND season = $2';
    params.push(String(Number(season) - 1));
  } else if (/^\d{4}$/.test(timeRange)) {
    timeFilter = 'AND season = $2';
    params.push(timeRange);
  } else if (timeRange === 'Last 5 Weeks') {
    timeFilter = 'AND season = $3 AND week BETWEEN $2 - 4 AND $2';
    params.push(week, season);
  } else if (timeRange === 'Last 10 Weeks') {
    timeFilter = 'AND season = $3 AND week BETWEEN $2 - 9 AND $2';
    params.push(week, season);
  } else if (timeRange === 'Last 30 Days') {
    timeFilter = "AND commence_time >= NOW() - INTERVAL '30 days'";
  }

  const { rows: games } = await pool.query(`
    SELECT * FROM games
    WHERE (home_team = $1 OR away_team = $1) AND completed = 1 ${timeFilter}
    ORDER BY season DESC, week DESC, commence_time DESC
  `, params);

  const stats = {
    su: { wins: 0, losses: 0, pushes: 0, total: 0 },
    suHome: { wins: 0, losses: 0, pushes: 0, total: 0 },
    suAway: { wins: 0, losses: 0, pushes: 0, total: 0 },
    suFav: { wins: 0, losses: 0, pushes: 0, total: 0 },
    suDog: { wins: 0, losses: 0, pushes: 0, total: 0 },
    suHomeFav: { wins: 0, losses: 0, pushes: 0, total: 0 },
    suHomeDog: { wins: 0, losses: 0, pushes: 0, total: 0 },
    suAwayFav: { wins: 0, losses: 0, pushes: 0, total: 0 },
    suAwayDog: { wins: 0, losses: 0, pushes: 0, total: 0 },
    
    ats: { wins: 0, losses: 0, pushes: 0, total: 0 },
    atsHome: { wins: 0, losses: 0, pushes: 0, total: 0 },
    atsAway: { wins: 0, losses: 0, pushes: 0, total: 0 },
    atsFav: { wins: 0, losses: 0, pushes: 0, total: 0 },
    atsDog: { wins: 0, losses: 0, pushes: 0, total: 0 },
    atsHomeFav: { wins: 0, losses: 0, pushes: 0, total: 0 },
    atsHomeDog: { wins: 0, losses: 0, pushes: 0, total: 0 },
    atsAwayFav: { wins: 0, losses: 0, pushes: 0, total: 0 },
    atsAwayDog: { wins: 0, losses: 0, pushes: 0, total: 0 },

    ou: { overs: 0, unders: 0, pushes: 0, total: 0 },
    ouHome: { overs: 0, unders: 0, pushes: 0, total: 0 },
    ouAway: { overs: 0, unders: 0, pushes: 0, total: 0 },

    recent: []
  };

  for (const g of games) {
    const isHome = g.home_team === teamName;
    const opponent = isHome ? g.away_team : g.home_team;
    const teamScore = isHome ? g.score_home : g.score_away;
    const oppScore = isHome ? g.score_away : g.score_home;
    const teamSpread = isHome ? g.spread_home : g.spread_away;

    if (teamScore === null || oppScore === null) continue;

    // SU
    let suResult = 'push';
    if (teamScore > oppScore) suResult = 'win';
    else if (teamScore < oppScore) suResult = 'loss';

    // Favorite / Dog
    const isFav = teamSpread !== null && teamSpread < 0;
    const isDog = teamSpread !== null && teamSpread > 0;

    // ATS
    let atsResult = 'push';
    if (teamSpread !== null) {
      const coveredScore = teamScore + teamSpread;
      if (coveredScore > oppScore) atsResult = 'win';
      else if (coveredScore < oppScore) atsResult = 'loss';
    }

    // O/U
    let ouResult = 'push';
    const totalScore = teamScore + oppScore;
    if (g.over_under !== null) {
      if (totalScore > g.over_under) ouResult = 'over';
      else if (totalScore < g.over_under) ouResult = 'under';
    }

    // Aggregate SU
    stats.su.total++;
    stats.su[suResult === 'win' ? 'wins' : suResult === 'loss' ? 'losses' : 'pushes']++;
    if (isHome) {
      stats.suHome.total++;
      stats.suHome[suResult === 'win' ? 'wins' : suResult === 'loss' ? 'losses' : 'pushes']++;
      if (isFav) {
        stats.suHomeFav.total++;
        stats.suHomeFav[suResult === 'win' ? 'wins' : suResult === 'loss' ? 'losses' : 'pushes']++;
      } else if (isDog) {
        stats.suHomeDog.total++;
        stats.suHomeDog[suResult === 'win' ? 'wins' : suResult === 'loss' ? 'losses' : 'pushes']++;
      }
    } else {
      stats.suAway.total++;
      stats.suAway[suResult === 'win' ? 'wins' : suResult === 'loss' ? 'losses' : 'pushes']++;
      if (isFav) {
        stats.suAwayFav.total++;
        stats.suAwayFav[suResult === 'win' ? 'wins' : suResult === 'loss' ? 'losses' : 'pushes']++;
      } else if (isDog) {
        stats.suAwayDog.total++;
        stats.suAwayDog[suResult === 'win' ? 'wins' : suResult === 'loss' ? 'losses' : 'pushes']++;
      }
    }
    if (isFav) {
      stats.suFav.total++;
      stats.suFav[suResult === 'win' ? 'wins' : suResult === 'loss' ? 'losses' : 'pushes']++;
    } else if (isDog) {
      stats.suDog.total++;
      stats.suDog[suResult === 'win' ? 'wins' : suResult === 'loss' ? 'losses' : 'pushes']++;
    }

    // Aggregate ATS
    if (teamSpread !== null) {
      stats.ats.total++;
      stats.ats[atsResult === 'win' ? 'wins' : atsResult === 'loss' ? 'losses' : 'pushes']++;
      if (isHome) {
        stats.atsHome.total++;
        stats.atsHome[atsResult === 'win' ? 'wins' : atsResult === 'loss' ? 'losses' : 'pushes']++;
        if (isFav) {
          stats.atsHomeFav.total++;
          stats.atsHomeFav[atsResult === 'win' ? 'wins' : atsResult === 'loss' ? 'losses' : 'pushes']++;
        } else if (isDog) {
          stats.atsHomeDog.total++;
          stats.atsHomeDog[atsResult === 'win' ? 'wins' : atsResult === 'loss' ? 'losses' : 'pushes']++;
        }
      } else {
        stats.atsAway.total++;
        stats.atsAway[atsResult === 'win' ? 'wins' : atsResult === 'loss' ? 'losses' : 'pushes']++;
        if (isFav) {
          stats.atsAwayFav.total++;
          stats.atsAwayFav[atsResult === 'win' ? 'wins' : atsResult === 'loss' ? 'losses' : 'pushes']++;
        } else if (isDog) {
          stats.atsAwayDog.total++;
          stats.atsAwayDog[atsResult === 'win' ? 'wins' : atsResult === 'loss' ? 'losses' : 'pushes']++;
        }
      }
      if (isFav) {
        stats.atsFav.total++;
        stats.atsFav[atsResult === 'win' ? 'wins' : atsResult === 'loss' ? 'losses' : 'pushes']++;
      } else if (isDog) {
        stats.atsDog.total++;
        stats.atsDog[atsResult === 'win' ? 'wins' : atsResult === 'loss' ? 'losses' : 'pushes']++;
      }
    }

    // Aggregate O/U
    if (g.over_under !== null) {
      stats.ou.total++;
      stats.ou[ouResult === 'over' ? 'overs' : ouResult === 'under' ? 'unders' : 'pushes']++;
      if (isHome) {
        stats.ouHome.total++;
        stats.ouHome[ouResult === 'over' ? 'overs' : ouResult === 'under' ? 'unders' : 'pushes']++;
      } else {
        stats.ouAway.total++;
        stats.ouAway[ouResult === 'over' ? 'overs' : ouResult === 'under' ? 'unders' : 'pushes']++;
      }
    }

    // Recent Games (limit to 100 to allow head-to-head filtering on frontend)
    if (stats.recent.length < 100) {
      stats.recent.push({
        season: g.season,
        week: g.week,
        commence_time: g.commence_time,
        isHome,
        opponent,
        teamScore,
        oppScore,
        spread: teamSpread,
        overUnder: g.over_under,
        suResult,
        atsResult,
        ouResult
      });
    }
  }

  return stats;
}

async function getConferenceResearchStats(conferenceName, timeRange, week, season) {
  // Find all teams in this conference
  const { rows: teams } = await pool.query(`
    SELECT school FROM teams WHERE conference = $1
  `, [conferenceName]);

  const schoolNames = teams.map(t => t.school);
  if (schoolNames.length === 0) {
    return null;
  }

  let timeFilter = '';
  const params = [schoolNames];

  if (timeRange === 'Week') {
    timeFilter = 'AND week = $2 AND season = $3';
    params.push(week, season);
  } else if (timeRange === 'Season') {
    timeFilter = 'AND season = $2';
    params.push(season);
  } else if (timeRange === 'Last Season') {
    timeFilter = 'AND season = $2';
    params.push(String(Number(season) - 1));
  } else if (/^\d{4}$/.test(timeRange)) {
    timeFilter = 'AND season = $2';
    params.push(timeRange);
  } else if (timeRange === 'Last 5 Weeks') {
    timeFilter = 'AND season = $3 AND week BETWEEN $2 - 4 AND $2';
    params.push(week, season);
  } else if (timeRange === 'Last 10 Weeks') {
    timeFilter = 'AND season = $3 AND week BETWEEN $2 - 9 AND $2';
    params.push(week, season);
  } else if (timeRange === 'Last 30 Days') {
    timeFilter = "AND commence_time >= NOW() - INTERVAL '30 days'";
  }

  // Query all completed games involving these teams
  const { rows: games } = await pool.query(`
    SELECT * FROM games
    WHERE (home_team = ANY($1) OR away_team = ANY($1)) AND completed = 1 ${timeFilter}
    ORDER BY season DESC, week DESC, commence_time DESC
  `, params);

  const stats = {
    su: { wins: 0, losses: 0, pushes: 0, total: 0 },
    suHome: { wins: 0, losses: 0, pushes: 0, total: 0 },
    suAway: { wins: 0, losses: 0, pushes: 0, total: 0 },
    suFav: { wins: 0, losses: 0, pushes: 0, total: 0 },
    suDog: { wins: 0, losses: 0, pushes: 0, total: 0 },
    suHomeFav: { wins: 0, losses: 0, pushes: 0, total: 0 },
    suHomeDog: { wins: 0, losses: 0, pushes: 0, total: 0 },
    suAwayFav: { wins: 0, losses: 0, pushes: 0, total: 0 },
    suAwayDog: { wins: 0, losses: 0, pushes: 0, total: 0 },
    
    ats: { wins: 0, losses: 0, pushes: 0, total: 0 },
    atsHome: { wins: 0, losses: 0, pushes: 0, total: 0 },
    atsAway: { wins: 0, losses: 0, pushes: 0, total: 0 },
    atsFav: { wins: 0, losses: 0, pushes: 0, total: 0 },
    atsDog: { wins: 0, losses: 0, pushes: 0, total: 0 },
    atsHomeFav: { wins: 0, losses: 0, pushes: 0, total: 0 },
    atsHomeDog: { wins: 0, losses: 0, pushes: 0, total: 0 },
    atsAwayFav: { wins: 0, losses: 0, pushes: 0, total: 0 },
    atsAwayDog: { wins: 0, losses: 0, pushes: 0, total: 0 },

    ou: { overs: 0, unders: 0, pushes: 0, total: 0 },
    ouHome: { overs: 0, unders: 0, pushes: 0, total: 0 },
    ouAway: { overs: 0, unders: 0, pushes: 0, total: 0 },

    recent: []
  };

  for (const g of games) {
    const homeInConf = schoolNames.includes(g.home_team);
    const awayInConf = schoolNames.includes(g.away_team);

    const perspectives = [];
    if (homeInConf) perspectives.push({ teamName: g.home_team, isHome: true });
    if (awayInConf) perspectives.push({ teamName: g.away_team, isHome: false });

    for (const p of perspectives) {
      const isHome = p.isHome;
      const teamName = p.teamName;
      const opponent = isHome ? g.away_team : g.home_team;
      const teamScore = isHome ? g.score_home : g.score_away;
      const oppScore = isHome ? g.score_away : g.score_home;
      const teamSpread = isHome ? g.spread_home : g.spread_away;

      if (teamScore === null || oppScore === null) continue;

      // SU
      let suResult = 'push';
      if (teamScore > oppScore) suResult = 'win';
      else if (teamScore < oppScore) suResult = 'loss';

      // Favorite / Dog
      const isFav = teamSpread !== null && teamSpread < 0;
      const isDog = teamSpread !== null && teamSpread > 0;

      // ATS
      let atsResult = 'push';
      if (teamSpread !== null) {
        const coveredScore = teamScore + teamSpread;
        if (coveredScore > oppScore) atsResult = 'win';
        else if (coveredScore < oppScore) atsResult = 'loss';
      }

      // O/U
      let ouResult = 'push';
      const totalScore = teamScore + oppScore;
      if (g.over_under !== null) {
        if (totalScore > g.over_under) ouResult = 'over';
        else if (totalScore < g.over_under) ouResult = 'under';
      }

      // Aggregate SU
      stats.su.total++;
      stats.su[suResult === 'win' ? 'wins' : suResult === 'loss' ? 'losses' : 'pushes']++;
      if (isHome) {
        stats.suHome.total++;
        stats.suHome[suResult === 'win' ? 'wins' : suResult === 'loss' ? 'losses' : 'pushes']++;
        if (isFav) {
          stats.suHomeFav.total++;
          stats.suHomeFav[suResult === 'win' ? 'wins' : suResult === 'loss' ? 'losses' : 'pushes']++;
        } else if (isDog) {
          stats.suHomeDog.total++;
          stats.suHomeDog[suResult === 'win' ? 'wins' : suResult === 'loss' ? 'losses' : 'pushes']++;
        }
      } else {
        stats.suAway.total++;
        stats.suAway[suResult === 'win' ? 'wins' : suResult === 'loss' ? 'losses' : 'pushes']++;
        if (isFav) {
          stats.suAwayFav.total++;
          stats.suAwayFav[suResult === 'win' ? 'wins' : suResult === 'loss' ? 'losses' : 'pushes']++;
        } else if (isDog) {
          stats.suAwayDog.total++;
          stats.suAwayDog[suResult === 'win' ? 'wins' : suResult === 'loss' ? 'losses' : 'pushes']++;
        }
      }
      if (isFav) {
        stats.suFav.total++;
        stats.suFav[suResult === 'win' ? 'wins' : suResult === 'loss' ? 'losses' : 'pushes']++;
      } else if (isDog) {
        stats.suDog.total++;
        stats.suDog[suResult === 'win' ? 'wins' : suResult === 'loss' ? 'losses' : 'pushes']++;
      }

      // Aggregate ATS
      if (teamSpread !== null) {
        stats.ats.total++;
        stats.ats[atsResult === 'win' ? 'wins' : atsResult === 'loss' ? 'losses' : 'pushes']++;
        if (isHome) {
          stats.atsHome.total++;
          stats.atsHome[atsResult === 'win' ? 'wins' : atsResult === 'loss' ? 'losses' : 'pushes']++;
          if (isFav) {
            stats.atsHomeFav.total++;
            stats.atsHomeFav[atsResult === 'win' ? 'wins' : atsResult === 'loss' ? 'losses' : 'pushes']++;
          } else if (isDog) {
            stats.atsHomeDog.total++;
            stats.atsHomeDog[atsResult === 'win' ? 'wins' : atsResult === 'loss' ? 'losses' : 'pushes']++;
          }
        } else {
          stats.atsAway.total++;
          stats.atsAway[atsResult === 'win' ? 'wins' : atsResult === 'loss' ? 'losses' : 'pushes']++;
          if (isFav) {
            stats.atsAwayFav.total++;
            stats.atsAwayFav[atsResult === 'win' ? 'wins' : atsResult === 'loss' ? 'losses' : 'pushes']++;
          } else if (isDog) {
            stats.atsAwayDog.total++;
            stats.atsAwayDog[atsResult === 'win' ? 'wins' : atsResult === 'loss' ? 'losses' : 'pushes']++;
          }
        }
        if (isFav) {
          stats.atsFav.total++;
          stats.atsFav[atsResult === 'win' ? 'wins' : atsResult === 'loss' ? 'losses' : 'pushes']++;
        } else if (isDog) {
          stats.atsDog.total++;
          stats.atsDog[atsResult === 'win' ? 'wins' : atsResult === 'loss' ? 'losses' : 'pushes']++;
        }
      }

      // Aggregate O/U
      if (g.over_under !== null) {
        stats.ou.total++;
        stats.ou[ouResult === 'over' ? 'overs' : ouResult === 'under' ? 'unders' : 'pushes']++;
        if (isHome) {
          stats.ouHome.total++;
          stats.ouHome[ouResult === 'over' ? 'overs' : ouResult === 'under' ? 'unders' : 'pushes']++;
        } else {
          stats.ouAway.total++;
          stats.ouAway[ouResult === 'over' ? 'overs' : ouResult === 'under' ? 'unders' : 'pushes']++;
        }
      }

      // Recent Games (limit to 10)
      if (stats.recent.length < 10) {
        stats.recent.push({
          season: g.season,
          week: g.week,
          commence_time: g.commence_time,
          teamName,
          isHome,
          opponent,
          teamScore,
          oppScore,
          spread: teamSpread,
          overUnder: g.over_under,
          suResult,
          atsResult,
          ouResult
        });
      }
    }
  }

  return stats;
}


async function getResearchRankings(entity, stat, location, role, minGames, conference, timeRange, week, season) {
  let timeFilter = '';
  const params = [];

  if (timeRange === 'Week') {
    timeFilter = 'AND season = $2 AND week = $1';
    params.push(week, season);
  } else if (timeRange === 'Season') {
    timeFilter = 'AND season = $1';
    params.push(season);
  } else if (timeRange === 'Last Season') {
    timeFilter = 'AND season = $1';
    params.push(String(Number(season) - 1));
  } else if (/^\d{4}$/.test(timeRange)) {
    timeFilter = 'AND season = $1';
    params.push(timeRange);
  } else if (timeRange === 'Last 5 Weeks') {
    timeFilter = 'AND season = $2 AND week BETWEEN $1 - 4 AND $1';
    params.push(week, season);
  } else if (timeRange === 'Last 10 Weeks') {
    timeFilter = 'AND season = $2 AND week BETWEEN $1 - 9 AND $1';
    params.push(week, season);
  } else if (timeRange === 'Last 30 Days') {
    timeFilter = "AND commence_time >= NOW() - INTERVAL '30 days'";
  }

  let locationFilter = '';
  if (location === 'home') {
    locationFilter = 'AND is_home = TRUE';
  } else if (location === 'away') {
    locationFilter = 'AND is_home = FALSE';
  }

  let roleFilter = '';
  if (role === 'favorite') {
    roleFilter = 'AND team_spread < 0';
  } else if (role === 'underdog') {
    roleFilter = 'AND team_spread > 0';
  }

  let confFilter = '';
  if (conference && entity === 'school') {
    params.push(conference);
    confFilter = `AND conference = $${params.length}`;
  }

  let statCondition = '';
  if (stat === 'ats') {
    statCondition = 'AND team_spread IS NOT NULL';
  }

  const winExpr = stat === 'su'
    ? 'CASE WHEN team_score > opp_score THEN 1 ELSE 0 END'
    : 'CASE WHEN team_spread IS NOT NULL AND team_score + team_spread > opp_score THEN 1 ELSE 0 END';

  const lossExpr = stat === 'su'
    ? 'CASE WHEN team_score < opp_score THEN 1 ELSE 0 END'
    : 'CASE WHEN team_spread IS NOT NULL AND team_score + team_spread < opp_score THEN 1 ELSE 0 END';

  const pushExpr = stat === 'su'
    ? 'CASE WHEN team_score = opp_score THEN 1 ELSE 0 END'
    : 'CASE WHEN team_spread IS NOT NULL AND team_score + team_spread = opp_score THEN 1 ELSE 0 END';

  const groupField = entity === 'school' ? 'team, conference' : 'conference';
  const selectField = entity === 'school' ? 'team AS name, conference' : 'conference AS name';

  const minGamesFilter = Number(minGames) || 1;

  const query = `
    WITH team_games AS (
      SELECT 
        g.id,
        g.season,
        g.week,
        g.commence_time,
        g.home_team AS team,
        g.away_team AS opponent,
        g.score_home AS team_score,
        g.score_away AS opp_score,
        g.spread_home AS team_spread,
        TRUE AS is_home,
        t.conference,
        t.logo
      FROM games g
      JOIN teams t ON g.home_team = t.school
      WHERE g.completed = 1

      UNION ALL

      SELECT 
        g.id,
        g.season,
        g.week,
        g.commence_time,
        g.away_team AS team,
        g.home_team AS opponent,
        g.score_away AS team_score,
        g.score_home AS opp_score,
        g.spread_away AS team_spread,
        FALSE AS is_home,
        t.conference,
        t.logo
      FROM games g
      JOIN teams t ON g.away_team = t.school
      WHERE g.completed = 1
    )
    SELECT 
      ${selectField},
      ${entity === 'school' ? 'MAX(logo) as logo,' : ''}
      COALESCE(SUM(${winExpr}), 0) as wins,
      COALESCE(SUM(${lossExpr}), 0) as losses,
      COALESCE(SUM(${pushExpr}), 0) as pushes,
      COUNT(*) as total,
      ROUND(
        CAST(COALESCE(SUM(${winExpr}), 0) AS FLOAT) / 
        NULLIF(COALESCE(SUM(${winExpr}), 0) + COALESCE(SUM(${lossExpr}), 0), 0) * 100,
        2
      ) as win_pct
    FROM team_games
    WHERE 1=1 ${timeFilter} ${locationFilter} ${roleFilter} ${statCondition} ${confFilter}
    GROUP BY ${groupField}
    HAVING COUNT(*) >= ${minGamesFilter}
    ORDER BY win_pct DESC, wins DESC, total DESC
  `;

  const { rows } = await pool.query(query, params);
  return rows;
}

async function updateGameLine(gameId, updates) {
  const { spread_home, spread_away, home_price, away_price } = updates;
  await pool.query(`
    UPDATE games SET 
      spread_home = $1, 
      spread_away = $2, 
      home_price = $3, 
      away_price = $4, 
      updated_at = $5 
    WHERE id = $6
  `, [spread_home, spread_away, home_price, away_price, new Date().toISOString(), gameId]);
  return await getGameById(gameId);
}

async function updatePick(pickId, updates) {
  const { selection_team, selection_side, spread } = updates;
  const { rows: [pick] } = await pool.query('SELECT * FROM picks WHERE id = $1', [pickId]);
  if (!pick) {
    throw new Error(`Pick ${pickId} not found`);
  }
  const game = await getGameById(pick.game_id);
  const result = determinePickResult(game, {
    selection_team,
    selection_side,
    spread: spread !== null ? spread : (selection_side === 'home' ? game.spread_home : game.spread_away)
  });

  await pool.query(`
    UPDATE picks SET 
      selection_team = $1, 
      selection_side = $2, 
      spread = $3, 
      result = $4, 
      updated_at = $5 
    WHERE id = $6
  `, [selection_team, selection_side, spread, result, new Date().toISOString(), pickId]);
  const { rows: [updatedPick] } = await pool.query('SELECT * FROM picks WHERE id = $1', [pickId]);
  return updatedPick;
}

async function updateTeamColor(teamId, color) {
  await pool.query('UPDATE teams SET school_primary_color = $1 WHERE id = $2', [color, teamId]);
}

async function getTeamMappings() {
  const { rows } = await pool.query('SELECT id, api_name, team_id FROM team_mappings ORDER BY id');
  return rows;
}

async function addTeamMapping(apiName, teamId) {
  const { rows } = await pool.query(`
    INSERT INTO team_mappings (api_name, team_id)
    VALUES ($1, $2)
    RETURNING id
  `, [apiName, teamId]);
  return rows[0];
}

async function deleteTeamMapping(id) {
  await pool.query('DELETE FROM team_mappings WHERE id = $1', [id]);
}

async function getSeasonAwards(season) {
  const cacheKey = `season_awards_${season}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  // Check if the season has any graded picks (at least one win/loss/push)
  const { rows: [gradedCheck] } = await pool.query(`
    SELECT COUNT(*) as count 
    FROM picks p JOIN games g ON p.game_id = g.id 
    WHERE g.season = $1 AND p.result IN ('win', 'loss', 'push')
  `, [season]);

  if (!gradedCheck || gradedCheck.count === 0) {
    return {
      champion: null,
      allTimeChamps: [],
      specialtyAwards: {}
    };
  }

  // 1. Golden Fade (Lowest win rate)
  const { rows: [goldenFade] } = await pool.query(`
    SELECT player, 
           SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins,
           SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) as losses,
           SUM(CASE WHEN result = 'push' THEN 1 ELSE 0 END) as pushes,
           ROUND(CAST(SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) AS FLOAT) / 
                 NULLIF(SUM(CASE WHEN result IN ('win', 'loss') THEN 1 ELSE 0 END), 0) * 100, 2) as win_pct
    FROM picks p JOIN games g ON p.game_id = g.id
    WHERE g.season = $1 AND p.result IN ('win', 'loss')
    GROUP BY player ORDER BY win_pct ASC LIMIT 1
  `, [season]);

  // 2. Locksmith (Highest lock win rate)
  const { rows: [locksmith] } = await pool.query(`
    SELECT player, 
           SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins,
           SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) as losses,
           ROUND(CAST(SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) AS FLOAT) / 
                 NULLIF(SUM(CASE WHEN result IN ('win', 'loss') THEN 1 ELSE 0 END), 0) * 100, 2) as win_pct
    FROM picks p JOIN games g ON p.game_id = g.id
    WHERE g.season = $1 AND p.is_lock = 1 AND p.result IN ('win', 'loss')
    GROUP BY player ORDER BY win_pct DESC LIMIT 1
  `, [season]);

  // 3. Down Under (Highest % of total picks on Under)
  const { rows: [downUnder] } = await pool.query(`
    SELECT player, 
           SUM(CASE WHEN p.selection_total = 'under' THEN 1 ELSE 0 END) as under_picks,
           COUNT(*) as total_picks,
           ROUND(CAST(SUM(CASE WHEN p.selection_total = 'under' THEN 1 ELSE 0 END) AS FLOAT) / 
                 COUNT(*) * 100, 2) as pct
    FROM picks p JOIN games g ON p.game_id = g.id
    WHERE g.season = $1
    GROUP BY player ORDER BY pct DESC LIMIT 1
  `, [season]);

  // 4. Road Warrior (Highest win % on away teams)
  const { rows: [roadWarrior] } = await pool.query(`
    SELECT player, 
           SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins,
           SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) as losses,
           ROUND(CAST(SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) AS FLOAT) / 
                 NULLIF(SUM(CASE WHEN result IN ('win', 'loss') THEN 1 ELSE 0 END), 0) * 100, 2) as win_pct
    FROM picks p JOIN games g ON p.game_id = g.id
    WHERE g.season = $1 AND p.selection_side = 'away' AND p.result IN ('win', 'loss')
    GROUP BY player ORDER BY win_pct DESC LIMIT 1
  `, [season]);

  // 5. Overlord (Highest % of total picks on Over)
  const { rows: [overlord] } = await pool.query(`
    SELECT player, 
           SUM(CASE WHEN p.selection_total = 'over' THEN 1 ELSE 0 END) as over_picks,
           COUNT(*) as total_picks,
           ROUND(CAST(SUM(CASE WHEN p.selection_total = 'over' THEN 1 ELSE 0 END) AS FLOAT) / 
                 COUNT(*) * 100, 2) as pct
    FROM picks p JOIN games g ON p.game_id = g.id
    WHERE g.season = $1
    GROUP BY player ORDER BY pct DESC LIMIT 1
  `, [season]);

  // 6. Underdog Whisperer (Highest win % on underdogs)
  const { rows: [underdogWhisperer] } = await pool.query(`
    SELECT player, 
           SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins,
           SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) as losses,
           ROUND(CAST(SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) AS FLOAT) / 
                 NULLIF(SUM(CASE WHEN result IN ('win', 'loss') THEN 1 ELSE 0 END), 0) * 100, 2) as win_pct
    FROM picks p JOIN games g ON p.game_id = g.id
    WHERE g.season = $1 AND p.selection_team IS NOT NULL AND COALESCE(p.spread, 0) > 0 AND p.result IN ('win', 'loss')
    GROUP BY player ORDER BY win_pct DESC LIMIT 1
  `, [season]);

  // 7. Home Field Advantage (Highest win % on home teams)
  const { rows: [homeField] } = await pool.query(`
    SELECT player, 
           SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins,
           SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) as losses,
           ROUND(CAST(SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) AS FLOAT) / 
                 NULLIF(SUM(CASE WHEN result IN ('win', 'loss') THEN 1 ELSE 0 END), 0) * 100, 2) as win_pct
    FROM picks p JOIN games g ON p.game_id = g.id
    WHERE g.season = $1 AND p.selection_side = 'home' AND p.result IN ('win', 'loss')
    GROUP BY player ORDER BY win_pct DESC LIMIT 1
  `, [season]);

  // 8. Chalk Eater (Highest win % on favorites)
  const { rows: [chalkEater] } = await pool.query(`
    SELECT player, 
           SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins,
           SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) as losses,
           ROUND(CAST(SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) AS FLOAT) / 
                 NULLIF(SUM(CASE WHEN result IN ('win', 'loss') THEN 1 ELSE 0 END), 0) * 100, 2) as win_pct
    FROM picks p JOIN games g ON p.game_id = g.id
    WHERE g.season = $1 AND p.selection_team IS NOT NULL AND COALESCE(p.spread, 0) < 0 AND p.result IN ('win', 'loss')
    GROUP BY player ORDER BY win_pct DESC LIMIT 1
  `, [season]);

  // 8b. Volume Shooter (Most total picks made)
  const { rows: [volumeShooter] } = await pool.query(`
    SELECT player, COUNT(*) as total_picks
    FROM picks p JOIN games g ON p.game_id = g.id
    WHERE g.season = $1
    GROUP BY player ORDER BY total_picks DESC LIMIT 1
  `, [season]);

  // 8c. Push Master (Most pushes)
  const { rows: [pushMaster] } = await pool.query(`
    SELECT player, SUM(CASE WHEN result = 'push' THEN 1 ELSE 0 END) as pushes
    FROM picks p JOIN games g ON p.game_id = g.id
    WHERE g.season = $1
    GROUP BY player ORDER BY pushes DESC LIMIT 1
  `, [season]);

  // 9. Champion of the selected season
  const { rows: [champion] } = await pool.query(`
    SELECT p.player, pl.full_name,
           SUM(CASE WHEN p.result = 'win' THEN 1 ELSE 0 END) as wins,
           SUM(CASE WHEN p.result = 'loss' THEN 1 ELSE 0 END) as losses,
           ROUND(CAST(SUM(CASE WHEN p.result = 'win' THEN 1 ELSE 0 END) AS FLOAT) / 
                 NULLIF(SUM(CASE WHEN p.result IN ('win', 'loss') THEN 1 ELSE 0 END), 0) * 100, 2) as win_pct
    FROM picks p 
    JOIN games g ON p.game_id = g.id
    LEFT JOIN players pl ON p.player = pl.name
    WHERE g.season = $1 AND p.result IN ('win', 'loss')
    GROUP BY p.player, pl.full_name ORDER BY win_pct DESC, wins DESC LIMIT 1
  `, [season]);

  // 10. All-time champions list for the base of the trophy
  const { rows: allTimeChamps } = await pool.query(`
    WITH season_standings AS (
      SELECT g.season, p.player, pl.full_name,
             SUM(CASE WHEN p.result = 'win' THEN 1 ELSE 0 END) as wins,
             SUM(CASE WHEN p.result = 'loss' THEN 1 ELSE 0 END) as losses,
             ROUND(CAST(SUM(CASE WHEN p.result = 'win' THEN 1 ELSE 0 END) AS FLOAT) / 
                   NULLIF(SUM(CASE WHEN p.result IN ('win', 'loss') THEN 1 ELSE 0 END), 0) * 100, 2) as win_pct,
             ROW_NUMBER() OVER (PARTITION BY g.season ORDER BY 
               ROUND(CAST(SUM(CASE WHEN p.result = 'win' THEN 1 ELSE 0 END) AS FLOAT) / 
                     NULLIF(SUM(CASE WHEN p.result IN ('win', 'loss') THEN 1 ELSE 0 END), 0) * 100, 2) DESC,
               SUM(CASE WHEN p.result = 'win' THEN 1 ELSE 0 END) DESC
             ) as rank
      FROM picks p 
      JOIN games g ON p.game_id = g.id
      LEFT JOIN players pl ON p.player = pl.name
      WHERE p.result IN ('win', 'loss')
      GROUP BY g.season, p.player, pl.full_name
    )
    SELECT season, player, full_name, wins, losses, win_pct
    FROM season_standings
    WHERE rank = 1
    ORDER BY season DESC
  `);

  const result = {
    champion,
    allTimeChamps,
    specialtyAwards: {
      goldenFade,
      locksmith,
      downUnder,
      roadWarrior,
      overlord,
      underdogWhisperer,
      homeField,
      chalkEater,
      volumeShooter,
      pushMaster
    }
  };
  cache.set(cacheKey, result, 31536000); // Cache for 1 year
  return result;
}

async function getPlayerAwards(player) {
  const cacheKey = `player_awards_${player}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const { rows } = await pool.query(`
    SELECT DISTINCT g.season 
    FROM picks p JOIN games g ON p.game_id = g.id 
    WHERE p.result IN ('win', 'loss', 'push')
    ORDER BY g.season ASC
  `);
  const seasons = rows.map(r => r.season);
  const championships = [];
  const specialtyAwards = [];

  for (const season of seasons) {
    const awards = await getSeasonAwards(season);
    if (awards.champion && awards.champion.player === player) {
      championships.push(season);
    }
    for (const [key, award] of Object.entries(awards.specialtyAwards)) {
      if (award && award.player === player) {
        specialtyAwards.push({
          season,
          awardKey: key,
          ...award
        });
      }
    }
  }
  const result = { championships, specialtyAwards };
  cache.set(cacheKey, result, 31536000); // Cache for 1 year
  return result;
}

async function getInProgressWeeks() {
  const timeFilter = dialect === 'postgres'
    ? "AND commence_time::timestamptz <= NOW() AND commence_time::timestamptz >= NOW() - INTERVAL '12 hours'"
    : "AND datetime(commence_time) <= datetime('now') AND datetime(commence_time) >= datetime('now', '-12 hours')";

  const { rows } = await pool.query(`
    SELECT DISTINCT season, week 
    FROM games 
    WHERE completed = 0 
      AND commence_time IS NOT NULL 
      ${timeFilter}
  `);
  return rows;
}

function getDialect() {
  return dialect;
}

module.exports = {
  init,
  getDialect,
  seedPlayers,
  seedTeams,
  seedWeeks,
  seedRivalries,
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
  getAllyNemesisByConference,
  getPlayerConferenceStats,
  getPlayerTeamStats,
  getPlayerTrend,
  getTeamResearchStats,
  getConferenceResearchStats,
  getResearchRankings,
  getPlayerFadedTeamStats,
  seedTestData,
  savePick,
  updateGameLine,
  updatePick,
  getGameById,
  getGameByApiId,
  getWeekSummary,
  getSeasonSummary,
  getAllTimeSummary,
  updateTeamColor,
  getTeamMappings,
  addTeamMapping,
  deleteTeamMapping,
  ensureWeekRow,
  setHistoricalLock,
  getSeasonAwards,
  getPlayerAwards,
  getInProgressWeeks
};