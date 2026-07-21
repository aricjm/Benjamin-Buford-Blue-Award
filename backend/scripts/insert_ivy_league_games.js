require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

async function main() {
  // Insert Harvard vs Columbia, Week 10, 2023
  const r1 = await pool.query(
    `INSERT INTO games (home_team, away_team, score_home, score_away, week, season, completed, commence_time)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    ['Harvard Crimson', 'Columbia Lions', 34, 14, 10, '2023', 1, '2023-11-04T12:00:00Z']
  );
  console.log('Harvard vs Columbia inserted:', r1.rows);

  // Insert Yale vs Princeton, Week 10, 2023
  const r2 = await pool.query(
    `INSERT INTO games (home_team, away_team, score_home, score_away, week, season, completed, commence_time)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    ['Yale Bulldogs', 'Princeton Tigers', 35, 17, 10, '2023', 1, '2023-11-04T15:00:00Z']
  );
  console.log('Yale vs Princeton inserted:', r2.rows);

  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
