const { Pool } = require('pg');
const {
  buildSeasonWeeks,
  getWeekNumberFromDate,
  determinePickResult,
  getSeasonFromDate
} = require('./utils');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

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
  const { rows } = await pool.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = $1 AND column_name = $2
  `, [table, column]);

  if (rows.length === 0) {
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
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS teams (
      id SERIAL PRIMARY KEY,
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
      id SERIAL PRIMARY KEY,
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
      id SERIAL PRIMARY KEY,
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
  await addColumnIfMissing('teams', 'stadium_name', 'TEXT');
  await addColumnIfMissing('teams', 'stadium_city', 'TEXT');
  await addColumnIfMissing('teams', 'stadium_state', 'TEXT');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS picks (
      id SERIAL PRIMARY KEY,
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
    )
  `);

  await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_picks_unique ON picks(week, player, game_id)`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS team_mappings (
      id SERIAL PRIMARY KEY,
      api_name TEXT NOT NULL UNIQUE,
      team_id INTEGER NOT NULL
    )
  `);
}

async function seedPlayers() {
  const defaultPlayers = ['Aric', 'Nick', 'Cisco'];
  for (const name of defaultPlayers) {
    await pool.query('INSERT INTO players (name) VALUES ($1) ON CONFLICT DO NOTHING', [name]);
  }
  return defaultPlayers.length;
}

async function seedTeams() {
  const toLogo = (school) => {
    const name = school.toLowerCase()
      .replace(/\(fl\)/g, 'fl')
      .replace(/\(oh\)/g, 'oh')
      .replace(/[^a-z0-9 ]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    return `/logos/${name}.png`;
  };
  const teams = [
    { school: 'Boston College', nickname: 'Eagles', conference: 'ACC', logo: toLogo('Boston College'), school_primary_color: '#98002E', stadium_name: 'Alumni Stadium', stadium_city: 'Chestnut Hill', stadium_state: 'Massachusetts' },
    { school: 'California', nickname: 'Golden Bears', conference: 'ACC', logo: toLogo('California'), school_primary_color: '#003262', stadium_name: 'California Memorial Stadium', stadium_city: 'Berkeley', stadium_state: 'California' },
    { school: 'Clemson', nickname: 'Tigers', conference: 'ACC', logo: toLogo('Clemson'), school_primary_color: '#F56600', stadium_name: 'Memorial Stadium', stadium_city: 'Clemson', stadium_state: 'South Carolina' },
    { school: 'Duke', nickname: 'Blue Devils', conference: 'ACC', logo: toLogo('Duke'), school_primary_color: '#003087', stadium_name: 'Wallace Wade Stadium', stadium_city: 'Durham', stadium_state: 'North Carolina' },
    { school: 'Florida State', nickname: 'Seminoles', conference: 'ACC', logo: toLogo('Florida State'), school_primary_color: '#782F40', stadium_name: 'Doak Campbell Stadium', stadium_city: 'Tallahassee', stadium_state: 'Florida' },
    { school: 'Georgia Tech', nickname: 'Yellow Jackets', conference: 'ACC', logo: toLogo('Georgia Tech'), school_primary_color: '#B3A369', stadium_name: 'Bobby Dodd Stadium', stadium_city: 'Atlanta', stadium_state: 'Georgia' },
    { school: 'Louisville', nickname: 'Cardinals', conference: 'ACC', logo: toLogo('Louisville'), school_primary_color: '#AD0000', stadium_name: 'L&N Federal Credit Union Stadium', stadium_city: 'Louisville', stadium_state: 'Kentucky' },
    { school: 'Miami (FL)', nickname: 'Hurricanes', conference: 'ACC', logo: toLogo('Miami FL'), school_primary_color: '#005030', stadium_name: 'Hard Rock Stadium', stadium_city: 'Miami Gardens', stadium_state: 'Florida' },
    { school: 'NC State', nickname: 'Wolfpack', conference: 'ACC', logo: toLogo('NC State'), school_primary_color: '#CC0000', stadium_name: 'Carter–Finley Stadium', stadium_city: 'Raleigh', stadium_state: 'North Carolina' },
    { school: 'North Carolina', nickname: 'Tar Heels', conference: 'ACC', logo: toLogo('North Carolina'), school_primary_color: '#7BAFD4', stadium_name: 'Kenan Memorial Stadium', stadium_city: 'Chapel Hill', stadium_state: 'North Carolina' },
    { school: 'Pittsburgh', nickname: 'Panthers', conference: 'ACC', logo: toLogo('Pittsburgh'), school_primary_color: '#003594', stadium_name: 'Acrisure Stadium', stadium_city: 'Pittsburgh', stadium_state: 'Pennsylvania' },
    { school: 'SMU', nickname: 'Mustangs', conference: 'ACC', logo: toLogo('SMU'), school_primary_color: '#CC0000', stadium_name: 'Gerald J. Ford Stadium', stadium_city: 'Dallas', stadium_state: 'Texas' },
    { school: 'Stanford', nickname: 'Cardinal', conference: 'ACC', logo: toLogo('Stanford'), school_primary_color: '#8C1515', stadium_name: 'Stanford Stadium', stadium_city: 'Stanford', stadium_state: 'California' },
    { school: 'Syracuse', nickname: 'Orange', conference: 'ACC', logo: toLogo('Syracuse'), school_primary_color: '#F7641E', stadium_name: 'JMA Wireless Dome', stadium_city: 'Syracuse', stadium_state: 'New York' },
    { school: 'Virginia', nickname: 'Cavaliers', conference: 'ACC', logo: toLogo('Virginia'), school_primary_color: '#232D4B', stadium_name: 'Scott Stadium', stadium_city: 'Charlottesville', stadium_state: 'Virginia' },
    { school: 'Virginia Tech', nickname: 'Hokies', conference: 'ACC', logo: toLogo('Virginia Tech'), school_primary_color: '#630031', stadium_name: 'Lane Stadium', stadium_city: 'Blacksburg', stadium_state: 'Virginia' },
    { school: 'Wake Forest', nickname: 'Demon Deacons', conference: 'ACC', logo: toLogo('Wake Forest'), school_primary_color: '#9E7E38', stadium_name: 'Allegacy Federal Credit Union Stadium', stadium_city: 'Winston-Salem', stadium_state: 'North Carolina' },
    { school: 'Army', nickname: 'Black Knights', conference: 'American', logo: toLogo('Army'), school_primary_color: '#000000', stadium_name: 'Michie Stadium', stadium_city: 'West Point', stadium_state: 'New York' },
    { school: 'Charlotte', nickname: '49ers', conference: 'American', logo: toLogo('Charlotte'), school_primary_color: '#00703C', stadium_name: 'Jerry Richardson Stadium', stadium_city: 'Charlotte', stadium_state: 'North Carolina' },
    { school: 'East Carolina', nickname: 'Pirates', conference: 'American', logo: toLogo('East Carolina'), school_primary_color: '#592A8A', stadium_name: 'Dowdy–Ficklen Stadium', stadium_city: 'Greenville', stadium_state: 'North Carolina' },
    { school: 'Florida Atlantic', nickname: 'Owls', conference: 'American', logo: toLogo('Florida Atlantic'), school_primary_color: '#003366', stadium_name: 'FAU Stadium', stadium_city: 'Boca Raton', stadium_state: 'Florida' },
    { school: 'Memphis', nickname: 'Tigers', conference: 'American', logo: toLogo('Memphis'), school_primary_color: '#003087', stadium_name: 'Simmons Bank Liberty Stadium', stadium_city: 'Memphis', stadium_state: 'Tennessee' },
    { school: 'Navy', nickname: 'Midshipmen', conference: 'American', logo: toLogo('Navy'), school_primary_color: '#000080', stadium_name: 'Navy–Marine Corps Memorial Stadium', stadium_city: 'Annapolis', stadium_state: 'Maryland' },
    { school: 'North Texas', nickname: 'Mean Green', conference: 'American', logo: toLogo('North Texas'), school_primary_color: '#00853E', stadium_name: 'DATCU Stadium', stadium_city: 'Denton', stadium_state: 'Texas' },
    { school: 'Rice', nickname: 'Owls', conference: 'American', logo: toLogo('Rice'), school_primary_color: '#00205B', stadium_name: 'Rice Stadium', stadium_city: 'Houston', stadium_state: 'Texas' },
    { school: 'South Florida', nickname: 'Bulls', conference: 'American', logo: toLogo('South Florida'), school_primary_color: '#006747', stadium_name: 'Raymond James Stadium', stadium_city: 'Tampa', stadium_state: 'Florida' },
    { school: 'Temple', nickname: 'Owls', conference: 'American', logo: toLogo('Temple'), school_primary_color: '#9D2235', stadium_name: 'Lincoln Financial Field', stadium_city: 'Philadelphia', stadium_state: 'Pennsylvania' },
    { school: 'Tulane', nickname: 'Green Wave', conference: 'American', logo: toLogo('Tulane'), school_primary_color: '#006747', stadium_name: 'Yulman Stadium', stadium_city: 'New Orleans', stadium_state: 'Louisiana' },
    { school: 'Tulsa', nickname: 'Golden Hurricane', conference: 'American', logo: toLogo('Tulsa'), school_primary_color: '#002D62', stadium_name: 'H. A. Chapman Stadium', stadium_city: 'Tulsa', stadium_state: 'Oklahoma' },
    { school: 'UAB', nickname: 'Blazers', conference: 'American', logo: toLogo('UAB'), school_primary_color: '#006341', stadium_name: 'Protective Stadium', stadium_city: 'Birmingham', stadium_state: 'Alabama' },
    { school: 'UTSA', nickname: 'Roadrunners', conference: 'American', logo: toLogo('UTSA'), school_primary_color: '#002244', stadium_name: 'Alamodome', stadium_city: 'San Antonio', stadium_state: 'Texas' },
    { school: 'Arizona', nickname: 'Wildcats', conference: 'Big 12', logo: toLogo('Arizona'), school_primary_color: '#CC0033', stadium_name: 'Arizona Stadium', stadium_city: 'Tucson', stadium_state: 'Arizona' },
    { school: 'Arizona State', nickname: 'Sun Devils', conference: 'Big 12', logo: toLogo('Arizona State'), school_primary_color: '#8C1D40', stadium_name: 'Mountain America Stadium', stadium_city: 'Tempe', stadium_state: 'Arizona' },
    { school: 'Baylor', nickname: 'Bears', conference: 'Big 12', logo: toLogo('Baylor'), school_primary_color: '#003015', stadium_name: 'McLane Stadium', stadium_city: 'Waco', stadium_state: 'Texas' },
    { school: 'BYU', nickname: 'Cougars', conference: 'Big 12', logo: toLogo('BYU'), school_primary_color: '#002E5D', stadium_name: 'LaVell Edwards Stadium', stadium_city: 'Provo', stadium_state: 'Utah' },
    { school: 'Cincinnati', nickname: 'Bearcats', conference: 'Big 12', logo: toLogo('Cincinnati'), school_primary_color: '#E00122', stadium_name: 'Nippert Stadium', stadium_city: 'Cincinnati', stadium_state: 'Ohio' },
    { school: 'Colorado', nickname: 'Buffaloes', conference: 'Big 12', logo: toLogo('Colorado'), school_primary_color: '#CFB87C', stadium_name: 'Folsom Field', stadium_city: 'Boulder', stadium_state: 'Colorado' },
    { school: 'Houston', nickname: 'Cougars', conference: 'Big 12', logo: toLogo('Houston'), school_primary_color: '#C8102E', stadium_name: 'TDECU Stadium', stadium_city: 'Houston', stadium_state: 'Texas' },
    { school: 'Iowa State', nickname: 'Cyclones', conference: 'Big 12', logo: toLogo('Iowa State'), school_primary_color: '#C8102E', stadium_name: 'Jack Trice Stadium', stadium_city: 'Ames', stadium_state: 'Iowa' },
    { school: 'Kansas', nickname: 'Jayhawks', conference: 'Big 12', logo: toLogo('Kansas'), school_primary_color: '#0051BA', stadium_name: 'David Booth Kansas Memorial Stadium', stadium_city: 'Lawrence', stadium_state: 'Kansas' },
    { school: 'Kansas State', nickname: 'Wildcats', conference: 'Big 12', logo: toLogo('Kansas State'), school_primary_color: '#512888', stadium_name: 'Bill Snyder Family Stadium', stadium_city: 'Manhattan', stadium_state: 'Kansas' },
    { school: 'Oklahoma State', nickname: 'Cowboys', conference: 'Big 12', logo: toLogo('Oklahoma State'), school_primary_color: '#FF6600', stadium_name: 'Boone Pickens Stadium', stadium_city: 'Stillwater', stadium_state: 'Oklahoma' },
    { school: 'TCU', nickname: 'Horned Frogs', conference: 'Big 12', logo: toLogo('TCU'), school_primary_color: '#4D1979', stadium_name: 'Amon G. Carter Stadium', stadium_city: 'Fort Worth', stadium_state: 'Texas' },
    { school: 'Texas Tech', nickname: 'Red Raiders', conference: 'Big 12', logo: toLogo('Texas Tech'), school_primary_color: '#CC0000', stadium_name: 'Jones AT&T Stadium', stadium_city: 'Lubbock', stadium_state: 'Texas' },
    { school: 'UCF', nickname: 'Knights', conference: 'Big 12', logo: toLogo('UCF'), school_primary_color: '#BA9B37', stadium_name: 'FBC Mortgage Stadium', stadium_city: 'Orlando', stadium_state: 'Florida' },
    { school: 'Utah', nickname: 'Utes', conference: 'Big 12', logo: toLogo('Utah'), school_primary_color: '#CC0000', stadium_name: 'Rice–Eccles Stadium', stadium_city: 'Salt Lake City', stadium_state: 'Utah' },
    { school: 'West Virginia', nickname: 'Mountaineers', conference: 'Big 12', logo: toLogo('West Virginia'), school_primary_color: '#002855', stadium_name: 'Milan Puskar Stadium', stadium_city: 'Morgantown', stadium_state: 'West Virginia' },
    { school: 'Illinois', nickname: 'Fighting Illini', conference: 'Big Ten', logo: toLogo('Illinois'), school_primary_color: '#13294B', stadium_name: 'Memorial Stadium', stadium_city: 'Champaign', stadium_state: 'Illinois' },
    { school: 'Indiana', nickname: 'Hoosiers', conference: 'Big Ten', logo: toLogo('Indiana'), school_primary_color: '#990000', stadium_name: 'Memorial Stadium', stadium_city: 'Bloomington', stadium_state: 'Indiana' },
    { school: 'Iowa', nickname: 'Hawkeyes', conference: 'Big Ten', logo: toLogo('Iowa'), school_primary_color: '#000000', stadium_name: 'Kinnick Stadium', stadium_city: 'Iowa City', stadium_state: 'Iowa' },
    { school: 'Maryland', nickname: 'Terrapins', conference: 'Big Ten', logo: toLogo('Maryland'), school_primary_color: '#E31937', stadium_name: 'SECU Stadium', stadium_city: 'College Park', stadium_state: 'Maryland' },
    { school: 'Michigan', nickname: 'Wolverines', conference: 'Big Ten', logo: toLogo('Michigan'), school_primary_color: '#00274C', stadium_name: 'Michigan Stadium', stadium_city: 'Ann Arbor', stadium_state: 'Michigan' },
    { school: 'Michigan State', nickname: 'Spartans', conference: 'Big Ten', logo: toLogo('Michigan State'), school_primary_color: '#18453B', stadium_name: 'Spartan Stadium', stadium_city: 'East Lansing', stadium_state: 'Michigan' },
    { school: 'Minnesota', nickname: 'Golden Gophers', conference: 'Big Ten', logo: toLogo('Minnesota'), school_primary_color: '#7A0019', stadium_name: 'Huntington Bank Stadium', stadium_city: 'Minneapolis', stadium_state: 'Minnesota' },
    { school: 'Nebraska', nickname: 'Cornhuskers', conference: 'Big Ten', logo: toLogo('Nebraska'), school_primary_color: '#E4173E', stadium_name: 'Memorial Stadium', stadium_city: 'Lincoln', stadium_state: 'Nebraska' },
    { school: 'Northwestern', nickname: 'Wildcats', conference: 'Big Ten', logo: toLogo('Northwestern'), school_primary_color: '#4E2A84', stadium_name: 'Martin Stadium', stadium_city: 'Evanston', stadium_state: 'Illinois' },
    { school: 'Ohio State', nickname: 'Buckeyes', conference: 'Big Ten', logo: toLogo('Ohio State'), school_primary_color: '#BB0000', stadium_name: 'Ohio Stadium', stadium_city: 'Columbus', stadium_state: 'Ohio' },
    { school: 'Oregon', nickname: 'Ducks', conference: 'Big Ten', logo: toLogo('Oregon'), school_primary_color: '#154733', stadium_name: 'Autzen Stadium', stadium_city: 'Eugene', stadium_state: 'Oregon' },
    { school: 'Penn State', nickname: 'Nittany Lions', conference: 'Big Ten', logo: toLogo('Penn State'), school_primary_color: '#041E42', stadium_name: 'Beaver Stadium', stadium_city: 'University Park', stadium_state: 'Pennsylvania' },
    { school: 'Purdue', nickname: 'Boilermakers', conference: 'Big Ten', logo: toLogo('Purdue'), school_primary_color: '#CEB888', stadium_name: 'Ross–Ade Stadium', stadium_city: 'West Lafayette', stadium_state: 'Indiana' },
    { school: 'Rutgers', nickname: 'Scarlet Knights', conference: 'Big Ten', logo: toLogo('Rutgers'), school_primary_color: '#CC0033', stadium_name: 'SHI Stadium', stadium_city: 'Piscataway', stadium_state: 'New Jersey' },
    { school: 'UCLA', nickname: 'Bruins', conference: 'Big Ten', logo: toLogo('UCLA'), school_primary_color: '#2D68C4', stadium_name: 'Rose Bowl', stadium_city: 'Pasadena', stadium_state: 'California' },
    { school: 'USC', nickname: 'Trojans', conference: 'Big Ten', logo: toLogo('USC'), school_primary_color: '#990000', stadium_name: 'Los Angeles Memorial Coliseum', stadium_city: 'Los Angeles', stadium_state: 'California' },
    { school: 'Washington', nickname: 'Huskies', conference: 'Big Ten', logo: toLogo('Washington'), school_primary_color: '#4B2E83', stadium_name: 'Husky Stadium', stadium_city: 'Seattle', stadium_state: 'Washington' },
    { school: 'Wisconsin', nickname: 'Badgers', conference: 'Big Ten', logo: toLogo('Wisconsin'), school_primary_color: '#C5050C', stadium_name: 'Camp Randall Stadium', stadium_city: 'Madison', stadium_state: 'Wisconsin' },
    { school: 'Delaware', nickname: "Fightin' Blue Hens", conference: 'CUSA', logo: toLogo('Delaware'), school_primary_color: '#004C97', stadium_name: 'Delaware Stadium', stadium_city: 'Newark', stadium_state: 'Delaware' },
    { school: 'FIU', nickname: 'Panthers', conference: 'CUSA', logo: toLogo('FIU'), school_primary_color: '#081E3F', stadium_name: 'Pitbull Stadium', stadium_city: 'Miami', stadium_state: 'Florida' },
    { school: 'Jacksonville State', nickname: 'Gamecocks', conference: 'CUSA', logo: toLogo('Jacksonville State'), school_primary_color: '#CC0000', stadium_name: 'Burgess–Snow Field', stadium_city: 'Jacksonville', stadium_state: 'Alabama' },
    { school: 'Kennesaw State', nickname: 'Owls', conference: 'CUSA', logo: toLogo('Kennesaw State'), school_primary_color: '#000000', stadium_name: 'Fifth Third Stadium', stadium_city: 'Kennesaw', stadium_state: 'Georgia' },
    { school: 'Liberty', nickname: 'Flames', conference: 'CUSA', logo: toLogo('Liberty'), school_primary_color: '#002D62', stadium_name: 'Williams Stadium', stadium_city: 'Lynchburg', stadium_state: 'Virginia' },
    { school: 'Louisiana Tech', nickname: 'Bulldogs', conference: 'CUSA', logo: toLogo('Louisiana Tech'), school_primary_color: '#002F8B', stadium_name: 'Joe Aillet Stadium', stadium_city: 'Ruston', stadium_state: 'Louisiana' },
    { school: 'Middle Tennessee', nickname: 'Blue Raiders', conference: 'CUSA', logo: toLogo('Middle Tennessee'), school_primary_color: '#0066CC', stadium_name: 'Johnny “Red” Floyd Stadium', stadium_city: 'Murfeesboro', stadium_state: 'Tennessee' },
    { school: 'Missouri State', nickname: 'Bears', conference: 'CUSA', logo: toLogo('Missouri State'), school_primary_color: '#5E0009', stadium_name: 'Robert W. Plaster Stadium', stadium_city: 'Springfield', stadium_state: 'Missouri' },
    { school: 'New Mexico State', nickname: 'Aggies', conference: 'CUSA', logo: toLogo('New Mexico State'), school_primary_color: '#891216', stadium_name: 'Aggie Memorial Stadium', stadium_city: 'Las Cruces', stadium_state: 'New Mexico' },
    { school: 'Sam Houston', nickname: 'Bearkats', conference: 'CUSA', logo: toLogo('Sam Houston'), school_primary_color: '#F05522', stadium_name: 'Bowers Stadium', stadium_city: 'Huntsville', stadium_state: 'Texas' },
    { school: 'Western Kentucky', nickname: 'Hilltoppers', conference: 'CUSA', logo: toLogo('Western Kentucky'), school_primary_color: '#CC0000', stadium_name: 'Houchens Industries–L. T. Smith Stadium', stadium_city: 'Bowling Green', stadium_state: 'Kentucky' },
    { school: 'Akron', nickname: 'Zips', conference: 'MAC', logo: toLogo('Akron'), school_primary_color: '#041E42', stadium_name: 'InfoCision Stadium', stadium_city: 'Akron', stadium_state: 'Ohio' },
    { school: 'Ball State', nickname: 'Cardinals', conference: 'MAC', logo: toLogo('Ball State'), school_primary_color: '#BA0C2F', stadium_name: 'Scheumann Stadium', stadium_city: 'Muncie', stadium_state: 'Indiana' },
    { school: 'Bowling Green', nickname: 'Falcons', conference: 'MAC', logo: toLogo('Bowling Green'), school_primary_color: '#FE5000', stadium_name: 'Doyt Perry Stadium', stadium_city: 'Bowling Green', stadium_state: 'Ohio' },
    { school: 'Buffalo', nickname: 'Bulls', conference: 'MAC', logo: toLogo('Buffalo'), school_primary_color: '#005BBB', stadium_name: 'UB Stadium', stadium_city: 'Amherst', stadium_state: 'New York' },
    { school: 'Central Michigan', nickname: 'Chippewas', conference: 'MAC', logo: toLogo('Central Michigan'), school_primary_color: '#6A0032', stadium_name: 'Kelly/Shorts Stadium', stadium_city: 'Mount Pleasant', stadium_state: 'Michigan' },
    { school: 'Eastern Michigan', nickname: 'Eagles', conference: 'MAC', logo: toLogo('Eastern Michigan'), school_primary_color: '#006633', stadium_name: 'Rynearson Stadium', stadium_city: 'Ypsilanti', stadium_state: 'Michigan' },
    { school: 'Kent State', nickname: 'Golden Flashes', conference: 'MAC', logo: toLogo('Kent State'), school_primary_color: '#002664', stadium_name: 'Dix Stadium', stadium_city: 'Kent', stadium_state: 'Ohio' },
    { school: 'Miami (OH)', nickname: 'RedHawks', conference: 'MAC', logo: toLogo('Miami OH'), school_primary_color: '#B61E2E', stadium_name: 'Yager Stadium', stadium_city: 'Oxford', stadium_state: 'Ohio' },
    { school: 'Northern Illinois', nickname: 'Huskies', conference: 'MAC', logo: toLogo('Northern Illinois'), school_primary_color: '#BA0C2F', stadium_name: 'Huskie Stadium', stadium_city: 'DeKalb', stadium_state: 'Illinois' },
    { school: 'Ohio', nickname: 'Bobcats', conference: 'MAC', logo: toLogo('Ohio'), school_primary_color: '#2E4E31', stadium_name: 'Peden Stadium', stadium_city: 'Athens', stadium_state: 'Ohio' },
    { school: 'Sacramento State', nickname: 'Hornets', conference: 'MAC', logo: toLogo('Sacramento State'), school_primary_color: '#004E38', stadium_name: 'Hornet Stadium', stadium_city: 'Sacramento', stadium_state: 'California' },
    { school: 'Toledo', nickname: 'Rockets', conference: 'MAC', logo: toLogo('Toledo'), school_primary_color: '#0039A6', stadium_name: 'Glass Bowl', stadium_city: 'Toledo', stadium_state: 'Ohio' },
    { school: 'UMass', nickname: 'Minutemen', conference: 'MAC', logo: toLogo('UMass'), school_primary_color: '#881124', stadium_name: 'Warren McGuirk Alumni Stadium', stadium_city: 'Amherst', stadium_state: 'Massachusetts' },
    { school: 'Western Michigan', nickname: 'Broncos', conference: 'MAC', logo: toLogo('Western Michigan'), school_primary_color: '#4B331A', stadium_name: 'Waldo Stadium', stadium_city: 'Kalamazoo', stadium_state: 'Michigan' },
    { school: 'Air Force', nickname: 'Falcons', conference: 'Mountain West', logo: toLogo('Air Force'), school_primary_color: '#003087', stadium_name: 'Falcon Stadium', stadium_city: 'Colorado Springs', stadium_state: 'Colorado' },
    { school: 'Boise State', nickname: 'Broncos', conference: 'Mountain West', logo: toLogo('Boise State'), school_primary_color: '#0033A0', stadium_name: 'Albertsons Stadium', stadium_city: 'Boise', stadium_state: 'Idaho' },
    { school: 'Colorado State', nickname: 'Rams', conference: 'Mountain West', logo: toLogo('Colorado State'), school_primary_color: '#1E4D2B', stadium_name: 'Canvas Stadium', stadium_city: 'Fort Collins', stadium_state: 'Colorado' },
    { school: 'Fresno State', nickname: 'Bulldogs', conference: 'Mountain West', logo: toLogo('Fresno State'), school_primary_color: '#C41230', stadium_name: 'Valley Children’s Stadium', stadium_city: 'Fresno', stadium_state: 'California' },
    { school: 'Hawaiʻi', nickname: 'Rainbow Warriors', conference: 'Mountain West', logo: toLogo('Hawaii'), school_primary_color: '#024731', stadium_name: 'Clarence T. C. Ching Athletics Complex', stadium_city: 'Honolulu', stadium_state: 'Hawaii' },
    { school: 'Nevada', nickname: 'Wolf Pack', conference: 'Mountain West', logo: toLogo('Nevada'), school_primary_color: '#003366', stadium_name: 'Mackay Stadium', stadium_city: 'Reno', stadium_state: 'Nevada' },
    { school: 'New Mexico', nickname: 'Lobos', conference: 'Mountain West', logo: toLogo('New Mexico'), school_primary_color: '#BA0C2F', stadium_name: 'University Stadium', stadium_city: 'Albuquerque', stadium_state: 'New Mexico' },
    { school: 'San Diego State', nickname: 'Aztecs', conference: 'Mountain West', logo: toLogo('San Diego State'), school_primary_color: '#A6192E', stadium_name: 'Snapdragon Stadium', stadium_city: 'San Diego', stadium_state: 'California' },
    { school: 'San Jose State', nickname: 'Spartans', conference: 'Mountain West', logo: toLogo('San Jose State'), school_primary_color: '#0055A2', stadium_name: 'CEFCU Stadium', stadium_city: 'San Jose', stadium_state: 'California' },
    { school: 'UNLV', nickname: 'Rebels', conference: 'Mountain West', logo: toLogo('UNLV'), school_primary_color: '#CF0A2C', stadium_name: 'Allegiant Stadium', stadium_city: 'Paradise', stadium_state: 'Nevada' },
    { school: 'Utah State', nickname: 'Aggies', conference: 'Mountain West', logo: toLogo('Utah State'), school_primary_color: '#00263A', stadium_name: 'Maverik Stadium', stadium_city: 'Logan', stadium_state: 'Utah' },
    { school: 'Wyoming', nickname: 'Cowboys', conference: 'Mountain West', logo: toLogo('Wyoming'), school_primary_color: '#492F24', stadium_name: 'War Memorial Stadium', stadium_city: 'Laramie', stadium_state: 'Wyoming' },
    { school: 'Alabama', nickname: 'Crimson Tide', conference: 'SEC', logo: toLogo('Alabama'), school_primary_color: '#9E1B32', stadium_name: 'Bryant–Denny Stadium', stadium_city: 'Tuscaloosa', stadium_state: 'Alabama' },
    { school: 'Arkansas', nickname: 'Razorbacks', conference: 'SEC', logo: toLogo('Arkansas'), school_primary_color: '#9D2235', stadium_name: 'Donald W. Reynolds Razorback Stadium', stadium_city: 'Fayetteville', stadium_state: 'Arkansas' },
    { school: 'Auburn', nickname: 'Tigers', conference: 'SEC', logo: toLogo('Auburn'), school_primary_color: '#0C2340', stadium_name: 'Jordan–Hare Stadium', stadium_city: 'Auburn', stadium_state: 'Alabama' },
    { school: 'Florida', nickname: 'Gators', conference: 'SEC', logo: toLogo('Florida'), school_primary_color: '#0021A5', stadium_name: 'Ben Hill Griffin Stadium', stadium_city: 'Gainesville', stadium_state: 'Florida' },
    { school: 'Georgia', nickname: 'Bulldogs', conference: 'SEC', logo: toLogo('Georgia'), school_primary_color: '#BA0C2F', stadium_name: 'Sanford Stadium', stadium_city: 'Athens', stadium_state: 'Georgia' },
    { school: 'Kentucky', nickname: 'Wildcats', conference: 'SEC', logo: toLogo('Kentucky'), school_primary_color: '#0033A0', stadium_name: 'Kroger Field', stadium_city: 'Lexington', stadium_state: 'Kentucky' },
    { school: 'LSU', nickname: 'Tigers', conference: 'SEC', logo: toLogo('LSU'), school_primary_color: '#461D7C', stadium_name: 'Tiger Stadium', stadium_city: 'Baton Rouge', stadium_state: 'Louisiana' },
    { school: 'Mississippi State', nickname: 'Bulldogs', conference: 'SEC', logo: toLogo('Mississippi State'), school_primary_color: '#660000', stadium_name: 'Davis Wade Stadium', stadium_city: 'Starkville', stadium_state: 'Mississippi' },
    { school: 'Missouri', nickname: 'Tigers', conference: 'SEC', logo: toLogo('Missouri'), school_primary_color: '#000000', stadium_name: 'Faurot Field', stadium_city: 'Columbia', stadium_state: 'Missouri' },
    { school: 'Oklahoma', nickname: 'Sooners', conference: 'SEC', logo: toLogo('Oklahoma'), school_primary_color: '#841617', stadium_name: 'Gaylord Family Oklahoma Memorial Stadium', stadium_city: 'Norman', stadium_state: 'Oklahoma' },
    { school: 'Ole Miss', nickname: 'Rebels', conference: 'SEC', logo: toLogo('Ole Miss'), school_primary_color: '#CE1126', stadium_name: 'Vaught–Hemingway Stadium', stadium_city: 'University', stadium_state: 'Mississippi' },
    { school: 'South Carolina', nickname: 'Gamecocks', conference: 'SEC', logo: toLogo('South Carolina'), school_primary_color: '#73000A', stadium_name: 'Williams–Brice Stadium', stadium_city: 'Columbia', stadium_state: 'South Carolina' },
    { school: 'Tennessee', nickname: 'Volunteers', conference: 'SEC', logo: toLogo('Tennessee'), school_primary_color: '#FF8200', stadium_name: 'Neyland Stadium', stadium_city: 'Knoxville', stadium_state: 'Tennessee' },
    { school: 'Texas', nickname: 'Longhorns', conference: 'SEC', logo: toLogo('Texas'), school_primary_color: '#BF5700', stadium_name: 'Darrell K Royal–Texas Memorial Stadium', stadium_city: 'Austin', stadium_state: 'Texas' },
    { school: 'Texas A&M', nickname: 'Aggies', conference: 'SEC', logo: toLogo('Texas A&M'), school_primary_color: '#500000', stadium_name: 'Kyle Field', stadium_city: 'College Station', stadium_state: 'Texas' },
    { school: 'Vanderbilt', nickname: 'Commodores', conference: 'SEC', logo: toLogo('Vanderbilt'), school_primary_color: '#000000', stadium_name: 'FirstBank Stadium', stadium_city: 'Nashville', stadium_state: 'Tennessee' },
    { school: 'Appalachian State', nickname: 'Mountaineers', conference: 'Sun Belt', logo: toLogo('Appalachian State'), school_primary_color: '#222222', stadium_name: 'Kidd Brewer Stadium', stadium_city: 'Boone', stadium_state: 'North Carolina' },
    { school: 'Arkansas State', nickname: 'Red Wolves', conference: 'Sun Belt', logo: toLogo('Arkansas State'), school_primary_color: '#CC092F', stadium_name: 'Centennial Bank Stadium', stadium_city: 'Jonesboro', stadium_state: 'Arkansas' },
    { school: 'Coastal Carolina', nickname: 'Chanticleers', conference: 'Sun Belt', logo: toLogo('Coastal Carolina'), school_primary_color: '#006F71', stadium_name: 'Brooks Stadium', stadium_city: 'Conway', stadium_state: 'South Carolina' },
    { school: 'Georgia Southern', nickname: 'Eagles', conference: 'Sun Belt', logo: toLogo('Georgia Southern'), school_primary_color: '#011E41', stadium_name: 'Allen E. Paulson Stadium', stadium_city: 'Statesboro', stadium_state: 'Georgia' },
    { school: 'Georgia State', nickname: 'Panthers', conference: 'Sun Belt', logo: toLogo('Georgia State'), school_primary_color: '#0039A6', stadium_name: 'Center Parc Stadium', stadium_city: 'Atlanta', stadium_state: 'Georgia' },
    { school: 'James Madison', nickname: 'Dukes', conference: 'Sun Belt', logo: toLogo('James Madison'), school_primary_color: '#450084', stadium_name: 'Bridgeforth Stadium', stadium_city: 'Harrisonburg', stadium_state: 'Virginia' },
    { school: 'Louisiana', nickname: "Ragin' Cajuns", conference: 'Sun Belt', logo: toLogo('Louisiana'), school_primary_color: '#CE181E', stadium_name: 'Cajun Field', stadium_city: 'Lafayette', stadium_state: 'Louisiana' },
    { school: 'Marshall', nickname: 'Thundering Herd', conference: 'Sun Belt', logo: toLogo('Marshall'), school_primary_color: '#00B140', stadium_name: 'Joan C. Edwards Stadium', stadium_city: 'Huntington', stadium_state: 'West Virginia' },
    { school: 'Old Dominion', nickname: 'Monarchs', conference: 'Sun Belt', logo: toLogo('Old Dominion'), school_primary_color: '#003057', stadium_name: 'Kornblau Field at S. B. Ballard Stadium', stadium_city: 'Norfolk', stadium_state: 'Virginia' },
    { school: 'South Alabama', nickname: 'Jaguars', conference: 'Sun Belt', logo: toLogo('South Alabama'), school_primary_color: '#00205B', stadium_name: 'Hancock Whitney Stadium', stadium_city: 'Mobile', stadium_state: 'Alabama' },
    { school: 'Southern Miss', nickname: 'Golden Eagles', conference: 'Sun Belt', logo: toLogo('Southern Miss'), school_primary_color: '#FFAB00', stadium_name: 'M. M. Roberts Stadium', stadium_city: 'Hattiesburg', stadium_state: 'Mississippi' },
    { school: 'Texas State', nickname: 'Bobcats', conference: 'Sun Belt', logo: toLogo('Texas State'), school_primary_color: '#501214', stadium_name: 'UFCU Stadium', stadium_city: 'San Marcos', stadium_state: 'Texas' },
    { school: 'Troy', nickname: 'Trojans', conference: 'Sun Belt', logo: toLogo('Troy'), school_primary_color: '#8A2432', stadium_name: 'Veterans Memorial Stadium', stadium_city: 'Troy', stadium_state: 'Alabama' },
    { school: 'ULM', nickname: 'Warhawks', conference: 'Sun Belt', logo: toLogo('ULM'), school_primary_color: '#840D2F', stadium_name: 'Malone Stadium', stadium_city: 'Monroe', stadium_state: 'Louisiana' },
    { school: 'Notre Dame', nickname: 'Fighting Irish', conference: 'Independent', logo: toLogo('Notre Dame'), school_primary_color: '#0C2340', stadium_name: 'Notre Dame Stadium', stadium_city: 'Notre Dame', stadium_state: 'Indiana' },
    { school: 'UConn', nickname: 'Huskies', conference: 'Independent', logo: toLogo('UConn'), school_primary_color: '#000E2F', stadium_name: 'Pratt & Whitney Stadium at Rentschler Field', stadium_city: 'East Hartford', stadium_state: 'Connecticut' }
  ];

  for (const team of teams) {
    await pool.query(`
      INSERT INTO teams (school, nickname, conference, logo, school_primary_color, stadium_name, stadium_city, stadium_state) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT(school) DO UPDATE SET
        logo = EXCLUDED.logo,
        nickname = EXCLUDED.nickname,
        conference = EXCLUDED.conference,
        school_primary_color = COALESCE(EXCLUDED.school_primary_color, teams.school_primary_color),
        stadium_name = EXCLUDED.stadium_name,
        stadium_city = EXCLUDED.stadium_city,
        stadium_state = EXCLUDED.stadium_state
    `, [team.school, team.nickname, team.conference, team.logo, team.school_primary_color, team.stadium_name, team.stadium_city, team.stadium_state]);
  }
}

async function seedWeeks() {
  const weeks = buildSeasonWeeks();
  for (const item of weeks) {
    await pool.query(`
      INSERT INTO weeks (week, season, label, starts_on, ends_on) 
      VALUES ($1, $2, $3, $4, $5) 
      ON CONFLICT (season, week) DO NOTHING
    `, [item.week, item.season, item.label, item.starts_on, item.ends_on]);
  }
  return weeks.length;
}

async function getPlayers() {
  const { rows } = await pool.query('SELECT id, name FROM players ORDER BY id');
  return rows;
}

async function getTeams() {
  const { rows } = await pool.query('SELECT id, school, nickname, conference, logo, school_primary_color, stadium_name, stadium_city, stadium_state FROM teams ORDER BY school ASC');
  return rows;
}

async function getSeasons() {
  const { rows } = await pool.query('SELECT DISTINCT season FROM weeks ORDER BY season DESC');
  return rows.map((row) => row.season);
}

async function getWeeks(season) {
  if (season) {
    const { rows } = await pool.query('SELECT id, week, season, label, starts_on, ends_on FROM weeks WHERE season = $1 ORDER BY week', [season]);
    return rows;
  }
  const { rows } = await pool.query('SELECT id, week, season, label, starts_on, ends_on FROM weeks ORDER BY season DESC, week');
  return rows;
}

async function getWeekGames(week, season) {
  if (season) {
    const { rows } = await pool.query(`
      SELECT 
        g.*, 
        ht.logo as home_logo, at.logo as away_logo,
        ht.school_primary_color as home_color, at.school_primary_color as away_color,
        ht.stadium_name as home_stadium_name,
        ht.stadium_city as home_stadium_city,
        ht.stadium_state as home_stadium_state,
        ht.nickname as home_nickname, at.nickname as away_nickname
      FROM games g
      LEFT JOIN teams ht ON g.home_team LIKE ht.school || '%'
      LEFT JOIN teams at ON g.away_team LIKE at.school || '%'
      WHERE g.week = $1 AND g.season = $2 
      ORDER BY g.commence_time ASC, g.id ASC
    `, [week, season]);
    return rows;
  }
  return [];
}

async function getPicksByWeek(week, season) {
  if (season) {
    const { rows } = await pool.query(`
      SELECT p.*, g.home_team, g.away_team, g.commence_time, g.is_mandatory, g.spread_home, g.spread_away
      FROM picks p
      JOIN games g ON p.game_id = g.id
      WHERE p.week = $1 AND g.season = $2 
      ORDER BY p.player, p.updated_at DESC
    `, [week, season]);
    return rows;
  }
  const { rows } = await pool.query(`
    SELECT p.*, g.home_team, g.away_team, g.commence_time, g.is_mandatory, g.spread_home, g.spread_away
    FROM picks p
    JOIN games g ON p.game_id = g.id
    WHERE p.week = $1 
    ORDER BY p.player, p.updated_at DESC
  `, [week]);
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

async function upsertGame(game) {
  const existing = game.api_game_id ? await getGameByApiId(game.api_game_id) : null;
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
        updated_at = $16
      WHERE api_game_id = $17
    `, [game.week, game.season, game.commence_time, game.home_team, game.away_team, game.site,
        game.is_televised ? 1 : 0, game.is_mandatory ? 1 : 0, game.spread_home, game.spread_away,
        game.home_price, game.away_price, game.score_home, game.score_away, game.completed ? 1 : 0,
        new Date().toISOString(), game.api_game_id]);
    return existing.id;
  }

  const { rows } = await pool.query(`
    INSERT INTO games (
      api_game_id, week, season, commence_time, home_team, away_team, site,
      is_televised, is_mandatory, spread_home, spread_away, home_price, away_price,
      score_home, score_away, completed, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
    ) RETURNING id
  `, [game.api_game_id, game.week, game.season, game.commence_time, game.home_team, game.away_team, game.site,
      game.is_televised ? 1 : 0, game.is_mandatory ? 1 : 0, game.spread_home, game.spread_away,
      game.home_price, game.away_price, game.score_home, game.score_away, game.completed ? 1 : 0,
      new Date().toISOString()]);
  return rows[0].id;
}

async function saveGamesForWeek(week, games, season) {
  let saved = 0;
  for (const game of games) {
    game.week = week;
    game.season = season;
    await upsertGame(game);
    saved += 1;
  }
  return saved;
}

async function saveGamesForSeason(games) {
  let saved = 0;
  for (const game of games) {
    if (!game.season) {
      game.season = getSeasonFromDate(game.commence_time);
    }
    await upsertGame(game);
    saved += 1;
  }
  return saved;
}

async function saveManualGame(week, season, gameData) {
  const manualId = gameData.api_game_id || `manual-${season}-${week}-${Date.now()}`;
  return await upsertGame({
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

async function updateScoresFromSeason(scoreGames) {
  let updated = 0;
  for (const game of scoreGames) {
    const existing = await getGameByApiId(game.api_game_id);
    if (!existing) continue;
    await pool.query(`
      UPDATE games SET 
        score_home = $1, 
        score_away = $2, 
        completed = $3, 
        updated_at = $4 
      WHERE api_game_id = $5
    `, [game.score_home, game.score_away, game.completed ? 1 : 0, new Date().toISOString(), game.api_game_id]);
    updated += 1;
    await updatePickResults(existing.id);
  }
  return updated;
}

async function deletePicksForPlayerWeek(player, week, season) {
  return await pool.query(`
    DELETE FROM picks 
    WHERE player = $1 
    AND week = $2 
    AND game_id IN (SELECT id FROM games WHERE season = $3)
  `, [player, week, season]);
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
  const result = determinePickResult(game, {
    selection_team: pick.selectionTeam,
    selection_side: pick.selectionSide,
    spread: pick.spread
  });

  await pool.query(`
    INSERT INTO picks (
      week, player, game_id, selection_team, selection_side, spread,
      is_mandatory, result, picked_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
    )
    ON CONFLICT(week, player, game_id) DO UPDATE SET
      selection_team = EXCLUDED.selection_team,
      selection_side = EXCLUDED.selection_side,
      spread = EXCLUDED.spread,
      is_mandatory = EXCLUDED.is_mandatory,
      result = EXCLUDED.result,
      updated_at = EXCLUDED.updated_at
  `, [week, player, pick.gameId, pick.selectionTeam, pick.selectionSide, pick.spread,
      pick.isMandatory ? 1 : 0, result, new Date().toISOString(), new Date().toISOString()]);

  const { rows } = await pool.query('SELECT * FROM picks WHERE week = $1 AND player = $2 AND game_id = $3', [week, player, pick.gameId]);
  return rows[0];
}

async function getWeekSummary(week, season) {
  const summary = {};
  const players = await getPlayers();
  for (const player of players) {
    summary[player.name] = { player: player.name, wins: 0, losses: 0, pushes: 0, pending: 0, total: 0 };
  }

  const { rows } = season
    ? await pool.query('SELECT player, result, COUNT(*) AS count FROM picks p JOIN games g ON p.game_id = g.id WHERE p.week = $1 AND g.season = $2 GROUP BY player, result', [week, season])
    : await pool.query('SELECT player, result, COUNT(*) AS count FROM picks p JOIN games g ON p.game_id = g.id WHERE p.week = $1 GROUP BY player, result', [week]);

  for (const row of rows) {
    const current = summary[row.player];
    if (current) {
      current.total += Number(row.count);
      if (row.result === 'win') current.wins += Number(row.count);
      else if (row.result === 'loss') current.losses += Number(row.count);
      else if (row.result === 'push') current.pushes += Number(row.count);
      else current.pending += Number(row.count);
    }
  }
  return Object.values(summary);
}

async function getSeasonSummary(season) {
  const summary = {};
  const players = await getPlayers();
  for (const player of players) {
    summary[player.name] = { player: player.name, wins: 0, losses: 0, pushes: 0, pending: 0, total: 0 };
  }
  const { rows } = await pool.query(`
    SELECT p.player, p.result, COUNT(*) AS count
    FROM picks p
    JOIN games g ON p.game_id = g.id
    WHERE g.season = $1
    GROUP BY p.player, p.result
  `, [season]);
  for (const row of rows) {
    const current = summary[row.player];
    if (current) {
      current.total += Number(row.count);
      if (row.result === 'win') current.wins += Number(row.count);
      else if (row.result === 'loss') current.losses += Number(row.count);
      else if (row.result === 'push') current.pushes += Number(row.count);
      else current.pending += Number(row.count);
    }
  }
  return Object.values(summary);
}

async function getAllTimeSummary() {
  const summary = {};
  const players = await getPlayers();
  for (const player of players) {
    summary[player.name] = { player: player.name, wins: 0, losses: 0, pushes: 0, pending: 0, total: 0 };
  }
  const { rows } = await pool.query('SELECT player, result, COUNT(*) AS count FROM picks GROUP BY player, result');
  for (const row of rows) {
    const current = summary[row.player];
    if (current) {
      current.total += Number(row.count);
      if (row.result === 'win') current.wins += Number(row.count);
      else if (row.result === 'loss') current.losses += Number(row.count);
      else if (row.result === 'push') current.pushes += Number(row.count);
      else current.pending += Number(row.count);
    }
  }
  return Object.values(summary);
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

async function getPlayerStats(player) {
  const { rows: [favConf] } = await pool.query(`
    SELECT t.conference, COUNT(*) as count
    FROM picks p
    JOIN teams t ON p.selection_team = t.school
    WHERE p.player = $1
    GROUP BY t.conference
    ORDER BY count DESC
    LIMIT 1
  `, [player]);

  const { rows: [bestConf] } = await pool.query(`
    SELECT t.conference, COUNT(*) as count
    FROM picks p
    JOIN teams t ON p.selection_team = t.school
    WHERE p.player = $1 AND p.result = 'win'
    GROUP BY t.conference
    ORDER BY count DESC
    LIMIT 1
  `, [player]);

  const { rows: [worstConf] } = await pool.query(`
    SELECT t.conference, COUNT(*) as count
    FROM picks p
    JOIN teams t ON p.selection_team = t.school
    WHERE p.player = $1 AND p.result = 'loss'
    GROUP BY t.conference
    ORDER BY count DESC
    LIMIT 1
  `, [player]);

  const { rows: trendRows } = await pool.query(`
    SELECT g.season, p.week, 
           SUM(CASE WHEN p.result = 'win' THEN 1 ELSE 0 END) as wins,
           SUM(CASE WHEN p.result = 'loss' THEN 1 ELSE 0 END) as losses
    FROM picks p
    JOIN games g ON p.game_id = g.id
    WHERE p.player = $1
    GROUP BY g.season, p.week
    ORDER BY g.season DESC, p.week DESC
    LIMIT 10
  `, [player]);
  const trend = trendRows.reverse();

  const { rows: [topWinSchool] } = await pool.query(`
    SELECT p.selection_team as school, t.logo, COUNT(*) as count
    FROM picks p
    LEFT JOIN teams t ON p.selection_team = t.school
    WHERE p.player = $1 AND p.result = 'win'
    GROUP BY p.selection_team, t.logo
    ORDER BY count DESC
    LIMIT 1
  `, [player]);

  const { rows: [topLossSchool] } = await pool.query(`
    SELECT p.selection_team as school, t.logo, COUNT(*) as count
    FROM picks p
    LEFT JOIN teams t ON p.selection_team = t.school
    WHERE p.player = $1 AND p.result = 'loss'
    GROUP BY p.selection_team, t.logo
    ORDER BY count DESC
    LIMIT 1
  `, [player]);

  const { rows: [record] } = await pool.query(`
    SELECT 
      COALESCE(SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END), 0) as wins,
      COALESCE(SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END), 0) as losses,
      COALESCE(SUM(CASE WHEN result = 'push' THEN 1 ELSE 0 END), 0) as pushes,
      COALESCE(SUM(CASE WHEN result = 'pending' THEN 1 ELSE 0 END), 0) as pending,
      COUNT(*) as total
    FROM picks
    WHERE player = $1
  `, [player]);

  const safeRecord = record || { wins: 0, losses: 0, pushes: 0, pending: 0, total: 0 };

  const { rows: [mostBetsFor] } = await pool.query(`
    SELECT p.selection_team as school, t.logo, COUNT(*) as count
    FROM picks p
    LEFT JOIN teams t ON p.selection_team = t.school
    WHERE p.player = $1
    GROUP BY p.selection_team, t.logo
    ORDER BY count DESC
    LIMIT 1
  `, [player]);

  const { rows: [mostBetsAgainst] } = await pool.query(`
    SELECT 
      CASE WHEN p.selection_side = 'home' THEN g.away_team ELSE g.home_team END as school,
      t.logo,
      COUNT(*) as count
    FROM picks p
    JOIN games g ON p.game_id = g.id
    LEFT JOIN teams t ON t.school = (CASE WHEN p.selection_side = 'home' THEN g.away_team ELSE g.home_team END)
    WHERE p.player = $1
    GROUP BY school, t.logo, p.selection_side, g.away_team, g.home_team
    ORDER BY count DESC
    LIMIT 1
  `, [player]);

  const { rows: recentResults } = await pool.query(`
    SELECT p.result
    FROM picks p
    JOIN games g ON p.game_id = g.id
    WHERE p.player = $1 AND p.result IN ('win', 'loss', 'push')
    ORDER BY g.commence_time ASC, g.id ASC
  `, [player]);

  let currentWinStreak = 0;
  let currentLossStreak = 0;
  let winStreakActive = true;
  let lossStreakActive = true;
  const reversedResults = [...recentResults].reverse();
  for (const r of reversedResults) {
    if (winStreakActive) {
      if (r.result === 'win') currentWinStreak++;
      else if (r.result === 'loss') winStreakActive = false;
    }
    if (lossStreakActive) {
      if (r.result === 'loss') currentLossStreak++;
      else if (r.result === 'win') lossStreakActive = false;
    }
    if (!winStreakActive && !lossStreakActive) break;
  }

  let longestWinStreak = 0;
  let longestLossStreak = 0;
  let tempWinStreak = 0;
  let tempLossStreak = 0;

  for (const r of recentResults) {
    if (r.result === 'win') {
      tempWinStreak++;
      tempLossStreak = 0;
      if (tempWinStreak > longestWinStreak) longestWinStreak = tempWinStreak;
    } else if (r.result === 'loss') {
      tempLossStreak++;
      tempWinStreak = 0;
      if (tempLossStreak > longestLossStreak) longestLossStreak = tempLossStreak;
    }
  }

  const last10Form = recentResults
    .slice(-10)
    .map((r) => {
      if (r.result === 'win') return 'W';
      if (r.result === 'loss') return 'L';
      if (r.result === 'push') return 'P';
      return '';
    })
    .join('-');

  return { favConf, bestConf, worstConf, topWinSchool, topLossSchool, record: safeRecord, trend, mostBetsFor, mostBetsAgainst, currentWinStreak, currentLossStreak, longestWinStreak, longestLossStreak, last10Form };
}

async function getConferenceStats(player, conference, timeRange, week, season) {
  let timeFilter = '';
  const params = [player, conference];

  if (timeRange === 'Week') {
    timeFilter = 'AND p.week = $3 AND g.season = $4';
    params.push(week, season);
  } else if (timeRange === 'Season') {
    timeFilter = 'AND g.season = $3';
    params.push(season);
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
    GROUP BY school, t.logo
    ORDER BY count DESC LIMIT 1
  `, params);

  const { rows: schoolRecords } = await pool.query(`
    SELECT 
      t.school,
      t.logo,
      SUM(CASE WHEN g.id IS NOT NULL AND p.result = 'win' THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN g.id IS NOT NULL AND p.result = 'loss' THEN 1 ELSE 0 END) as losses,
      SUM(CASE WHEN g.id IS NOT NULL AND p.result = 'push' THEN 1 ELSE 0 END) as pushes,
      COUNT(p.id) as total
    FROM teams t
    LEFT JOIN picks p ON t.school = p.selection_team AND p.player = $1
    LEFT JOIN games g ON p.game_id = g.id AND t.conference = $2 ${timeFilter}
    WHERE t.conference = $2
    GROUP BY t.school, t.logo
    ORDER BY wins DESC, total DESC
  `, [player, conference, conference, ...params.slice(2)]);

  const { rows: [sosResult] } = await pool.query(`
    SELECT AVG(ABS(p.spread)) as avgSpread
    FROM picks p
    JOIN games g ON p.game_id = g.id
    JOIN teams t ON p.selection_team = t.school
    WHERE p.player = $1 AND t.conference = $2 ${timeFilter}
  `, params);

  const strengthOfSchedule = sosResult?.avgSpread || 0;

  return { bestTeam, worstTeam, mostBetsFor, mostBetsAgainst, schoolRecords, strengthOfSchedule };
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
  getAllTimeSummary,
  updateTeamColor,
  getTeamMappings,
  addTeamMapping,
  deleteTeamMapping
};