require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../db');
const pool = db.pool;

async function backfill() {
  try {
    console.log('Ensuring odds_history table exists...');
    await db.init();

    console.log('Backfilling initial snapshot of odds from existing games...');
    const { rows: games } = await pool.query(`
      SELECT id, api_game_id, spread_home, spread_away, over_under, home_price, away_price, updated_at, commence_time
      FROM games
      WHERE spread_home IS NOT NULL OR over_under IS NOT NULL
    `);

    console.log(`Found ${games.length} games with odds to check...`);
    const { rows: existingRows } = await pool.query('SELECT DISTINCT game_id FROM odds_history');
    const existingSet = new Set(existingRows.map(r => r.game_id));

    const toInsert = games.filter(g => !existingSet.has(g.id));
    console.log(`${toInsert.length} games need initial odds snapshot...`);

    if (toInsert.length > 0) {
      // Chunk inserts in batches of 100
      const batchSize = 100;
      for (let i = 0; i < toInsert.length; i += batchSize) {
        const batch = toInsert.slice(i, i + batchSize);
        const values = [];
        const placeholders = [];
        batch.forEach((g, idx) => {
          const offset = idx * 8;
          const recordedAt = g.updated_at || g.commence_time || new Date().toISOString();
          values.push(g.id, g.api_game_id, g.spread_home, g.spread_away, g.over_under, g.home_price, g.away_price, recordedAt);
          placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8})`);
        });

        await pool.query(`
          INSERT INTO odds_history (
            game_id, api_game_id, spread_home, spread_away, over_under, home_price, away_price, recorded_at
          ) VALUES ${placeholders.join(', ')}
        `, values);
        console.log(`Inserted batch ${Math.min(i + batchSize, toInsert.length)} / ${toInsert.length}`);
      }
    }
    console.log(`Backfill completed successfully.`);
  } catch (err) {
    console.error('Backfill error:', err);
  } finally {
    process.exit(0);
  }
}

backfill();

