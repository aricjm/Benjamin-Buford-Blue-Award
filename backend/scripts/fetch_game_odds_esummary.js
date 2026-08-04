require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.POSTGRES_URL, ssl: { rejectUnauthorized: false } });
const BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/college-football';

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function extractOddsFromCompetition(competition) {
  const odds = competition.odds?.find((o) => o.provider?.name === 'ESPN BET') || competition.odds?.[0] || null;
  if (!odds) return null;

  let spread_home = null;
  let spread_away = null;

  if (typeof odds.spread === 'number') {
    spread_home = odds.spread;
    spread_away = -odds.spread;
  } else if (odds.details) {
    const parts = odds.details.split(' ');
    const maybe = parts.find((p) => /-?\d+(\.\d+)?/.test(p));
    const spreadValue = maybe ? parseFloat(maybe) : NaN;
    if (!isNaN(spreadValue)) {
      // If favorite information available, use it
      const fav = odds.favorite;
      if (fav && fav.homeAway === 'home') {
        spread_home = -spreadValue;
      } else if (fav && fav.homeAway === 'away') {
        spread_home = spreadValue;
      } else {
        // fallback: assume spread is home-team number
        spread_home = spreadValue;
      }
      spread_away = -spread_home;
    }
  }

  const over_under = odds.overUnder ?? null;
  const home_price = odds.homeMoneyLine ?? null;
  const away_price = odds.awayMoneyLine ?? null;

  return { spread_home, spread_away, over_under, home_price, away_price };
}

async function run() {
  console.log('Starting ESPN summary backfill for games missing odds (season >= 2022)...');

  const { rows: games } = await pool.query(`
    SELECT id, api_game_id, season, commence_time
    FROM games
    WHERE (season >= '2022') AND api_game_id IS NOT NULL AND (spread_home IS NULL OR over_under IS NULL)
    ORDER BY season, commence_time
  `);

  console.log(`Found ${games.length} games to check`);
  let updatedCount = 0;
  const failed = [];

  for (let i = 0; i < games.length; i++) {
    const g = games[i];
    const url = `${BASE_URL}/summary?event=${encodeURIComponent(g.api_game_id)}`;
    let attempts = 0;
    let success = false;
    while (attempts < 3 && !success) {
      attempts += 1;
      try {
        const { data } = await axios.get(url, { timeout: 15000 });
        const comp = data?.competitions?.[0];
        if (comp) {
          const odds = extractOddsFromCompetition(comp);
          if (odds && (odds.spread_home !== null || odds.over_under !== null)) {
            const res = await pool.query(`
              UPDATE games SET spread_home = COALESCE(spread_home, $1), spread_away = COALESCE(spread_away, $2), over_under = COALESCE(over_under, $3), home_price = COALESCE(home_price, $4), away_price = COALESCE(away_price, $5), updated_at = $6
              WHERE id = $7
            `, [odds.spread_home, odds.spread_away, odds.over_under, odds.home_price, odds.away_price, new Date().toISOString(), g.id]);

            if (res.rowCount > 0) updatedCount += 1;
            success = true;
            process.stdout.write('.');
          } else {
            // no odds in summary
            success = true; // nothing to do, treat as success so we don't retry
            process.stdout.write('s');
          }
        } else {
          // malformed response
          await sleep(500 * attempts);
        }
      } catch (err) {
        if (attempts >= 3) {
          failed.push({ id: g.id, api_game_id: g.api_game_id, err: err.message });
          process.stdout.write('F');
        } else {
          await sleep(500 * attempts);
        }
      }
    }

    // throttle: 300ms between requests to avoid rate limits
    await sleep(300);
    if ((i + 1) % 80 === 0) process.stdout.write(` ${i + 1}\n`);
  }

  console.log('\nDone.');
  console.log(`Updated ${updatedCount} games with odds from ESPN summary.`);
  if (failed.length) {
    console.log(`Failed to fetch ${failed.length} games; sample:`);
    console.log(failed.slice(0, 10));
  }

  await pool.end();
}

run().catch((err) => {
  console.error('Backfill run failed:', err);
  process.exit(1);
});
