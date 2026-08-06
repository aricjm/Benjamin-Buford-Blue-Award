// Removes manual mock games for season 2026 week 0
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

const pool = new Pool({ connectionString: process.env.POSTGRES_URL, ssl: { rejectUnauthorized: false } });

async function main() {
  try {
    const res = await pool.query("DELETE FROM games WHERE api_game_id LIKE 'manual-%' AND season = $1 AND week = $2 RETURNING id, api_game_id", ['2026', 0]);
    console.log('Deleted rows:', res.rowCount);
    if (res.rowCount > 0) console.log(res.rows);
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Error removing manual games:', err);
    process.exit(1);
  }
}

if (require.main === module) main();
