require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.POSTGRES_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  console.log('Starting backfill of game odds from picks...');

  // 1. Backfill spreads
  const { rows: spreadPicks } = await pool.query(`
    SELECT game_id, selection_team, selection_side, spread
    FROM picks
    WHERE spread IS NOT NULL
  `);

  let spreadCount = 0;
  for (const p of spreadPicks) {
    const isHome = p.selection_side === 'home';
    const spreadHome = isHome ? p.spread : -p.spread;
    const spreadAway = isHome ? -p.spread : p.spread;

    const { rowCount } = await pool.query(`
      UPDATE games
      SET spread_home = $1, spread_away = $2
      WHERE id = $3 AND (spread_home IS NULL OR spread_away IS NULL)
    `, [spreadHome, spreadAway, p.game_id]);
    
    if (rowCount > 0) spreadCount++;
  }
  console.log(`Backfilled spreads for ${spreadCount} games.`);

  // 2. Backfill over/unders
  const { rows: totalPicks } = await pool.query(`
    SELECT game_id, total_line
    FROM picks
    WHERE total_line IS NOT NULL
  `);

  let totalCount = 0;
  for (const p of totalPicks) {
    const { rowCount } = await pool.query(`
      UPDATE games
      SET over_under = $1
      WHERE id = $2 AND over_under IS NULL
    `, [p.total_line, p.game_id]);

    if (rowCount > 0) totalCount++;
  }
  console.log(`Backfilled over/unders for ${totalCount} games.`);

  await pool.end();
}

run().catch(console.error);
