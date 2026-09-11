require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});
const { determinePickResult, determineTotalResult } = require('../utils');

async function main() {
  const { rows: picks } = await pool.query(`
    SELECT p.*, g.home_team, g.away_team, g.spread_home, g.spread_away, g.score_home, g.score_away, g.completed, g.over_under
    FROM picks p
    JOIN games g ON p.game_id = g.id
    WHERE g.completed = 1
  `);

  let updated = 0;
  for (const p of picks) {
    const expected = p.selection_team ? determinePickResult(p, p) : determineTotalResult(p, p);
    if (expected && expected !== 'pending' && expected !== p.result) {
      console.log(`Fixing pick #${p.id} (${p.player} - Week ${p.week}): ${p.selection_team || p.selection_total} was '${p.result}', now '${expected}'`);
      await pool.query('UPDATE picks SET result = $1, updated_at = NOW() WHERE id = $2', [expected, p.id]);
      updated++;
    }
  }

  console.log(`Successfully updated ${updated} picks in PostgreSQL database.`);
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
