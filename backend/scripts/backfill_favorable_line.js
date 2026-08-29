require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../db');
const { determineFavorableLine } = require('../utils');
const pool = db.pool;

async function backfillFavorableLines() {
  try {
    console.log('Ensuring favorable_line column exists...');
    await db.init();

    console.log('Fetching started games with picks...');
    const { rows: picks } = await pool.query(`
      SELECT p.*, g.commence_time, g.home_team, g.away_team, g.spread_home, g.spread_away, g.over_under
      FROM picks p
      JOIN games g ON p.game_id = g.id
      WHERE g.commence_time::timestamptz <= NOW()
    `);

    console.log(`Checking ${picks.length} picks...`);
    let updated = 0;

    for (const p of picks) {
      const game = {
        home_team: p.home_team,
        away_team: p.away_team,
        spread_home: p.spread_home,
        spread_away: p.spread_away,
        over_under: p.over_under,
        commence_time: p.commence_time
      };
      const favorable = determineFavorableLine(game, p);
      if (favorable !== p.favorable_line) {
        await pool.query('UPDATE picks SET favorable_line = $1 WHERE id = $2', [favorable, p.id]);
        updated++;
      }
    }

    console.log(`Updated favorable_line for ${updated} picks.`);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

backfillFavorableLines();
