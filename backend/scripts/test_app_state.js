require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

async function main() {
  const { rows } = await pool.query(
    `SELECT id, home_team, away_team, score_home, score_away, completed
     FROM games
     WHERE week = 4 AND season = '2023'
       AND (home_team = $1 OR away_team = $1)`,
    ['Appalachian State Mountaineers']
  );
  console.log(rows);
  await pool.end();
}
main().catch(console.error);
