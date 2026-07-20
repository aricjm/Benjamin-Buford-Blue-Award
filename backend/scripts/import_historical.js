/**
 * Historical Game Import Script
 * Imports all weeks and games (with results) for seasons 2022-2025 from ESPN API.
 *
 * ESPN's scoreboard endpoint ignores the `season` query param and always returns
 * the current season. The correct approach is to use `dates=YYYYMMDD` with the
 * start date of each week, which ESPN does respect for historical data.
 * We first fetch the ESPN calendar for each season to get the exact week date ranges.
 *
 * Usage: node backend/scripts/import_historical.js
 *        node backend/scripts/import_historical.js --seasons 2022,2023
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const axios = require('axios');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

const BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/college-football';

// One known date per season to anchor the calendar fetch
const SEASON_ANCHOR_DATES = {
  2022: '20220901',
  2023: '20230901',
  2024: '20240901',
  2025: '20250901',
};

// Parse CLI args
const args = process.argv.slice(2);
let targetSeasons = [2022, 2023, 2024, 2025];

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--seasons' && args[i + 1]) {
    targetSeasons = args[i + 1].split(',').map(Number);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toDateStr(isoDate) {
  // Convert ISO date to YYYYMMDD for ESPN dates param
  return isoDate.replace(/[-T:Z]/g, '').slice(0, 8);
}

function mapGame(event, week, season) {
  const competition = event.competitions[0];
  const homeCompetitor = competition.competitors.find((c) => c.homeAway === 'home');
  const awayCompetitor = competition.competitors.find((c) => c.homeAway === 'away');

  if (!homeCompetitor || !awayCompetitor) return null;

  const odds = competition.odds?.find((o) => o.provider?.name === 'ESPN BET') || competition.odds?.[0] || {};

  let spread_home = null;
  let spread_away = null;

  if (typeof odds.spread === 'number') {
    spread_home = odds.spread;
    spread_away = -odds.spread;
  } else if (odds.details) {
    const spreadValue = parseFloat(odds.details.split(' ')[1]);
    if (!isNaN(spreadValue)) {
      spread_home = odds.favorite?.homeAway === 'home' ? -spreadValue : spreadValue;
      spread_away = -spread_home;
    }
  }

  return {
    api_game_id: event.id,
    week: event.week?.number ?? week,
    season: (event.season?.year ?? season).toString(),
    commence_time: event.date,
    home_team: homeCompetitor.team.displayName,
    away_team: awayCompetitor.team.displayName,
    site: competition.venue?.fullName || 'N/A',
    is_televised: competition.broadcasts?.length > 0 ? 1 : 0,
    tv_network: competition.broadcasts?.[0]?.names?.[0] ?? competition.broadcasts?.[0]?.market?.shortName ?? null,
    is_mandatory: 0,
    spread_home,
    spread_away,
    over_under: odds.overUnder ?? null,
    home_price: odds.homeMoneyLine ?? null,
    away_price: odds.awayMoneyLine ?? null,
    score_home: homeCompetitor.score != null ? parseInt(homeCompetitor.score) : null,
    score_away: awayCompetitor.score != null ? parseInt(awayCompetitor.score) : null,
    completed: event.status.type.completed ? 1 : 0
  };
}

// Fetch the ESPN calendar for a season to get week date ranges
async function fetchSeasonCalendar(season) {
  const anchor = SEASON_ANCHOR_DATES[season];
  const url = `${BASE_URL}/scoreboard?dates=${anchor}&limit=1`;
  const { data } = await axios.get(url, { timeout: 15000 });
  const cal = data.leagues?.[0]?.calendar;
  const regularSeason = cal?.find((c) => c.value === '2'); // seasontype 2 = regular season
  if (!regularSeason?.entries?.length) throw new Error(`No calendar found for season ${season}`);
  return regularSeason.entries.map((e) => ({
    week: parseInt(e.value),
    label: e.label,
    startDate: e.startDate,
    endDate: e.endDate
  }));
}

// Fetch all games for a week's date range using the dates=YYYYMMDD-YYYYMMDD param
async function fetchGamesByDateRange(startDate, endDate, season, week) {
  const start = toDateStr(startDate);
  const end = toDateStr(endDate);
  const url = `${BASE_URL}/scoreboard?dates=${start}-${end}&limit=300`;
  try {
    const { data } = await axios.get(url, { timeout: 15000 });
    return (data.events || [])
      .filter((e) => e.season?.year === season) // only keep games from the right season
      .map((e) => mapGame(e, week, season))
      .filter(Boolean);
  } catch (err) {
    console.error(`  ERROR fetching ${start}-${end}: ${err.message}`);
    return null;
  }
}

async function ensureWeekRow(season, week, startDate, endDate) {
  await pool.query(
    `INSERT INTO weeks (week, season, label, starts_on, ends_on)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (season, week) DO UPDATE SET
       starts_on = EXCLUDED.starts_on,
       ends_on   = EXCLUDED.ends_on`,
    [week, season.toString(), `${season} Week ${week}`, startDate, endDate]
  );
}

async function upsertGame(game) {
  await pool.query(
    `INSERT INTO games (
      api_game_id, week, season, commence_time,
      home_team, away_team, site,
      is_televised, tv_network, is_mandatory,
      spread_home, spread_away, over_under,
      home_price, away_price,
      score_home, score_away, completed
    ) VALUES (
      $1, $2, $3, $4,
      $5, $6, $7,
      $8, $9, $10,
      $11, $12, $13,
      $14, $15,
      $16, $17, $18
    )
    ON CONFLICT (api_game_id) DO UPDATE SET
      week          = EXCLUDED.week,
      season        = EXCLUDED.season,
      commence_time = EXCLUDED.commence_time,
      home_team     = EXCLUDED.home_team,
      away_team     = EXCLUDED.away_team,
      site          = EXCLUDED.site,
      is_televised  = EXCLUDED.is_televised,
      tv_network    = EXCLUDED.tv_network,
      spread_home   = EXCLUDED.spread_home,
      spread_away   = EXCLUDED.spread_away,
      over_under    = EXCLUDED.over_under,
      home_price    = EXCLUDED.home_price,
      away_price    = EXCLUDED.away_price,
      score_home    = EXCLUDED.score_home,
      score_away    = EXCLUDED.score_away,
      completed     = EXCLUDED.completed`,
    [
      game.api_game_id, game.week, game.season, game.commence_time,
      game.home_team, game.away_team, game.site,
      game.is_televised, game.tv_network, game.is_mandatory,
      game.spread_home, game.spread_away, game.over_under,
      game.home_price, game.away_price,
      game.score_home, game.score_away, game.completed
    ]
  );
}

async function run() {
  console.log(`\nHistorical Import: seasons=${targetSeasons.join(',')}\n`);

  let totalGames = 0;
  let totalWeeks = 0;
  const failedWeeks = [];

  for (const season of targetSeasons) {
    console.log(`\n=== Season ${season} ===`);

    let weekEntries;
    try {
      process.stdout.write(`  Fetching calendar... `);
      weekEntries = await fetchSeasonCalendar(season);
      console.log(`${weekEntries.length} weeks found`);
    } catch (err) {
      console.error(`  FAILED to fetch calendar: ${err.message}`);
      continue;
    }

    await sleep(400);

    for (const entry of weekEntries) {
      const { week, startDate, endDate } = entry;
      const startStr = toDateStr(startDate);
      const endStr = toDateStr(endDate);
      process.stdout.write(`  Week ${String(week).padStart(2)} (${startStr}-${endStr}): fetching... `);

      const games = await fetchGamesByDateRange(startDate, endDate, season, week);

      if (games === null) {
        failedWeeks.push(`${season} W${week}`);
        process.stdout.write('FAILED\n');
        await sleep(1000);
        continue;
      }

      if (games.length === 0) {
        process.stdout.write('no games\n');
        await sleep(300);
        continue;
      }

      await ensureWeekRow(season, week, startDate, endDate);
      for (const game of games) {
        await upsertGame(game);
      }

      totalGames += games.length;
      totalWeeks++;
      process.stdout.write(`saved ${games.length} games\n`);

      await sleep(400);
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`Imported ${totalGames} games across ${totalWeeks} weeks.`);
  if (failedWeeks.length > 0) {
    console.log(`Failed weeks (retry manually): ${failedWeeks.join(', ')}`);
  }

  await pool.end();
}

run().catch((err) => {
  console.error('Fatal error:', err);
  pool.end();
  process.exit(1);
});
