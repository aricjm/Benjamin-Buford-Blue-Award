require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

async function main() {
  // 1. Update the game with id 8465 (which was Yale vs Princeton in Week 10) to be Yale vs Brown (36-17)
  await pool.query(
    `UPDATE games
     SET away_team = 'Brown Bears', score_home = 36, score_away = 17, commence_time = '2023-11-04T12:30:00Z'
     WHERE id = 8465`
  );
  console.log('Updated game 8465 to Yale vs Brown.');

  // 2. Insert Yale vs Princeton in Week 11 (Nov 11, 2023) with score 36-28
  const r = await pool.query(
    `INSERT INTO games (home_team, away_team, score_home, score_away, week, season, completed, commence_time)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    ['Princeton Tigers', 'Yale Bulldogs', 28, 36, 11, '2023', 1, '2023-11-11T12:00:00Z']
  );
  console.log('Inserted Yale vs Princeton in Week 11:', r.rows);

  await pool.end();
}

main().catch(console.error);
