require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

async function check() {
  try {
    // Check for pending picks for Aric
    const pending = await pool.query(`
      SELECT COUNT(*) as count 
      FROM picks 
      WHERE player = 'Aric' AND result = 'pending'
    `);
    console.log('Pending picks for Aric:', pending.rows[0].count);

    // Check for 2022 Week 1 picks for Aric
    const week1_2022 = await pool.query(`
      SELECT COUNT(*) as count 
      FROM picks p 
      JOIN games g ON p.game_id = g.id 
      WHERE p.player = 'Aric' AND g.season = '2022' AND g.week = 1
    `);
    console.log('2022 Week 1 picks for Aric:', week1_2022.rows[0].count);

    // Check what seasons/weeks Aric DOES have
    const all_aric = await pool.query(`
      SELECT g.season, g.week, COUNT(*) as count 
      FROM picks p 
      JOIN games g ON p.game_id = g.id 
      WHERE p.player = 'Aric' AND g.season = '2022'
      GROUP BY g.season, g.week 
      ORDER BY g.season, g.week
    `);
    console.log('Aric 2022 picks by week:', all_aric.rows);
  } finally {
    pool.end();
  }
}
check();
