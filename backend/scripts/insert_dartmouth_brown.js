require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

async function main() {
  // Insert Dartmouth vs Brown in Week 12 (Nov 18, 2023) with score 38-13
  const r = await pool.query(
    `INSERT INTO games (home_team, away_team, score_home, score_away, week, season, completed, commence_time)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    ['Brown Bears', 'Dartmouth Big Green', 13, 38, 12, '2023', 1, '2023-11-18T12:00:00Z']
  );
  console.log('Inserted Dartmouth vs Brown in Week 12:', r.rows);

  await pool.end();
}

main().catch(console.error);
