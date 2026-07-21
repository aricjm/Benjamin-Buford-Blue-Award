require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

async function main() {
  // 1. Insert Week 0 into weeks table
  await pool.query(`
    INSERT INTO weeks (week, season, label, starts_on, ends_on)
    VALUES (0, '2023', '2023 Week 0', '2023-08-25T00:00:00Z', '2023-08-27T23:59:59Z')
    ON CONFLICT (season, week) DO UPDATE SET
      starts_on = EXCLUDED.starts_on,
      ends_on = EXCLUDED.ends_on,
      label = EXCLUDED.label
  `);
  console.log('Inserted/updated Week 0 in weeks table.');

  // 2. Update games played between Aug 25 and Aug 27, 2023 to be week 0
  const { rowCount } = await pool.query(`
    UPDATE games
    SET week = 0
    WHERE season = '2023'
      AND commence_time >= '2023-08-25T00:00:00Z'
      AND commence_time <= '2023-08-27T23:59:59Z'
  `);
  console.log(`Updated ${rowCount} games to week 0.`);

  // 3. Let's verify the games that are now week 0
  const { rows: week0Games } = await pool.query(`
    SELECT id, home_team, away_team, commence_time, score_home, score_away, completed, spread_home, over_under
    FROM games
    WHERE season = '2023' AND week = 0
    ORDER BY commence_time
  `);
  console.log('\nWeek 0 Games:');
  console.table(week0Games);

  await pool.end();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
