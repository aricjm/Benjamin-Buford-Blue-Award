require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

async function main() {
  const { rows } = await pool.query(
    "SELECT id, week, home_team, away_team, commence_time FROM games WHERE season = '2023' AND (home_team ILIKE '%Tennessee%' OR away_team ILIKE '%Tennessee%') ORDER BY week"
  );
  console.table(rows);
  await pool.end();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
