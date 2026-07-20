/**
 * backfill_missing_teams.js
 *
 * Scans all games in the DB, finds any home_team / away_team not in the teams
 * table (or with incomplete data), fetches their data from the ESPN core API
 * (logo, conference, color, venue), downloads their logo into
 * frontend/public/logos/, and upserts them into the teams table.
 *
 * Usage:
 *   node backend/scripts/backfill_missing_teams.js
 *   node backend/scripts/backfill_missing_teams.js --force   (re-process all game teams)
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

const LOGOS_DIR = path.join(__dirname, '../../frontend/public/logos');
const ESPN_SITE_TEAMS = 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams';
const ESPN_CORE_TEAMS = 'https://sports.core.api.espn.com/v2/sports/football/leagues/college-football/teams';
const FORCE = process.argv.includes('--force');

// Slug logic matching db.js / download_logos.js
function toSlug(school) {
  return school
    .toLowerCase()
    .replace(/\(fl\)/g, 'fl')
    .replace(/\(oh\)/g, 'oh')
    .replace(/[^a-z0-9 ]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function toLogoPath(school) {
  return `/logos/${toSlug(school)}.png`;
}

function toLogoFilename(school) {
  return `${toSlug(school)}.png`;
}

async function get(url) {
  const res = await axios.get(url, { timeout: 15000 });
  return res.data;
}

async function downloadLogo(url, destPath) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
    fs.writeFileSync(destPath, response.data);
    return true;
  } catch (err) {
    console.warn(`  Could not download logo: ${err.message}`);
    return false;
  }
}

// Fetch all ESPN teams from the site API (paginated) to build a name->id map
async function buildEspnIdMap() {
  const map = new Map(); // displayName.toLowerCase() -> espnId
  let page = 1;
  const limit = 100;

  while (true) {
    let data;
    try {
      data = await get(`${ESPN_SITE_TEAMS}?limit=${limit}&page=${page}`);
    } catch (err) {
      console.warn(`ESPN teams page ${page} failed: ${err.message}`);
      break;
    }

    const items = data.sports?.[0]?.leagues?.[0]?.teams ?? [];
    if (items.length === 0) break;

    for (const item of items) {
      const t = item.team;
      if (t.displayName) map.set(t.displayName.toLowerCase(), t.id);
      if (t.shortDisplayName) map.set(t.shortDisplayName.toLowerCase(), t.id);
    }

    // Stop when we get fewer items than the limit (last page)
    if (items.length < limit) break;
    page++;
  }

  console.log(`  Fetched ${page} pages, ${map.size} name entries.`);
  return map;
}

function findEspnId(name, idMap) {
  const key = name.toLowerCase();

  // 1. Exact match
  if (idMap.has(key)) return idMap.get(key);

  // 2. Strip last word (nickname) and try school-only match
  const words = key.split(' ');
  if (words.length > 1) {
    const schoolOnly = words.slice(0, -1).join(' ');
    if (idMap.has(schoolOnly)) return idMap.get(schoolOnly);
  }

  // 3. One-word suffix match (e.g. "ohio state" matches "ohio state buckeyes")
  for (const [k, v] of idMap.entries()) {
    if (k.startsWith(key + ' ') || key.startsWith(k + ' ')) {
      const longer = k.length > key.length ? k : key;
      const shorter = k.length <= key.length ? k : key;
      const suffix = longer.slice(shorter.length + 1);
      if (!suffix.includes(' ')) return v;
    }
  }

  return null;
}

// Fetch full team data from ESPN core API using the team's ESPN ID
async function fetchCoreTeamData(espnId) {
  const data = await get(`${ESPN_CORE_TEAMS}/${espnId}?lang=en&region=us`);

  const color = data.color ? `#${data.color}` : null;
  const logoUrl = data.logos?.[0]?.href ?? null;

  // Venue
  const venue = data.venue;
  const stadiumName = venue?.fullName ?? null;
  const stadiumCity = venue?.address?.city ?? null;
  const stadiumState = venue?.address?.state ?? null;

  // Conference: follow the $ref URL
  let conference = null;
  const groupsRef = data.groups?.$ref;
  if (groupsRef) {
    try {
      const groupData = await get(groupsRef);
      conference = groupData.shortName ?? groupData.name ?? null;
    } catch {
      // ignore conference fetch errors
    }
  }

  return { color, logoUrl, stadiumName, stadiumCity, stadiumState, conference };
}

async function upsertTeam(client, school, data, logoLocalPath) {
  await client.query(`
    INSERT INTO teams (school, conference, logo, school_primary_color, stadium_name, stadium_city, stadium_state)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (school) DO UPDATE SET
      conference           = COALESCE(EXCLUDED.conference,           teams.conference),
      logo                 = COALESCE(EXCLUDED.logo,                 teams.logo),
      school_primary_color = COALESCE(EXCLUDED.school_primary_color, teams.school_primary_color),
      stadium_name         = COALESCE(EXCLUDED.stadium_name,         teams.stadium_name),
      stadium_city         = COALESCE(EXCLUDED.stadium_city,         teams.stadium_city),
      stadium_state        = COALESCE(EXCLUDED.stadium_state,        teams.stadium_state)
  `, [
    school,
    data.conference,
    logoLocalPath,
    data.color,
    data.stadiumName,
    data.stadiumCity,
    data.stadiumState,
  ]);
}

async function main() {
  if (!fs.existsSync(LOGOS_DIR)) {
    fs.mkdirSync(LOGOS_DIR, { recursive: true });
  }

  const client = await pool.connect();
  try {
    // 1. Get all team names from games
    const { rows: gameRows } = await client.query(`
      SELECT DISTINCT home_team AS team FROM games WHERE home_team IS NOT NULL
      UNION
      SELECT DISTINCT away_team AS team FROM games WHERE away_team IS NOT NULL
      ORDER BY team
    `);
    const gameTeams = gameRows.map(r => r.team);
    console.log(`Found ${gameTeams.length} distinct team names across all games.`);

    // 2. Determine which teams need processing
    let toProcess;
    if (FORCE) {
      toProcess = gameTeams;
      console.log('--force: re-processing all game teams.');
    } else {
      // Only process teams missing from the table OR missing key fields
      const { rows: existingRows } = await client.query(`
        SELECT school FROM teams
        WHERE conference IS NOT NULL AND stadium_name IS NOT NULL
      `);
      const completeSet = new Set(existingRows.map(r => r.school.toLowerCase()));
      toProcess = gameTeams.filter(t => !completeSet.has(t.toLowerCase()));
    }

    if (toProcess.length === 0) {
      console.log('All teams already have complete data. Use --force to re-process.');
      return;
    }
    console.log(`\n${toProcess.length} teams to process:`);
    toProcess.forEach(t => console.log(`  - ${t}`));

    // 3. Build ESPN name -> ID map
    console.log('\nFetching ESPN team index...');
    const idMap = await buildEspnIdMap();
    console.log(`Indexed ${idMap.size} ESPN team name entries.`);

    // 4. Process each team
    const notFound = [];
    for (const schoolName of toProcess) {
      console.log(`\nProcessing: ${schoolName}`);

      const espnId = findEspnId(schoolName, idMap);
      if (!espnId) {
        console.warn(`  No ESPN match found — inserting placeholder`);
        notFound.push(schoolName);
        await upsertTeam(client, schoolName, {
          conference: null, color: null,
          stadiumName: null, stadiumCity: null, stadiumState: null
        }, toLogoPath(schoolName));
        continue;
      }

      let coreData;
      try {
        coreData = await fetchCoreTeamData(espnId);
      } catch (err) {
        console.warn(`  ESPN core API error: ${err.message}`);
        notFound.push(schoolName);
        continue;
      }

      console.log(`  ESPN ID: ${espnId} | conf: ${coreData.conference} | color: ${coreData.color} | stadium: ${coreData.stadiumName}`);

      // Download logo
      const logoFilename = toLogoFilename(schoolName);
      const logoDestPath = path.join(LOGOS_DIR, logoFilename);
      let logoLocalPath = toLogoPath(schoolName);

      if (coreData.logoUrl) {
        if (fs.existsSync(logoDestPath)) {
          console.log(`  Logo already exists: ${logoFilename}`);
        } else {
          console.log(`  Downloading logo from ${coreData.logoUrl}`);
          const ok = await downloadLogo(coreData.logoUrl, logoDestPath);
          if (!ok) logoLocalPath = null;
        }
      } else {
        console.warn(`  No logo URL from ESPN`);
        logoLocalPath = null;
      }

      await upsertTeam(client, schoolName, coreData, logoLocalPath);
      console.log(`  Upserted`);
    }

    console.log('\n--- Done ---');
    if (notFound.length > 0) {
      console.log(`\nTeams with no ESPN match (placeholders inserted):`);
      notFound.forEach(t => console.log(`  - ${t}`));
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
