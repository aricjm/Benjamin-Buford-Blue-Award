require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const season = '2024';
  const startsOn = '2024-08-23T00:00:00Z';
  const endsOn = '2024-08-27T23:59:59Z';

  await pool.query(`
    INSERT INTO weeks (week, season, label, starts_on, ends_on)
    VALUES (0, $1, $2, $3, $4)
    ON CONFLICT (season, week) DO UPDATE SET
      starts_on = EXCLUDED.starts_on,
      ends_on = EXCLUDED.ends_on,
      label = EXCLUDED.label
  `, [season, `${season} Week 0`, startsOn, endsOn]);
  console.log('Inserted/updated Week 0 in weeks table.');

  const { rowCount } = await pool.query(`
    UPDATE games
    SET week = 0
    WHERE season = $1
      AND commence_time >= $2
      AND commence_time <= $3
  `, [season, startsOn, endsOn]);
  console.log(`Updated ${rowCount} games to week 0.`);

  const { rows: week0Games } = await pool.query(`
    SELECT id, home_team, away_team, commence_time, score_home, score_away, completed, spread_home, over_under
    FROM games
    WHERE season = $1 AND week = 0
    ORDER BY commence_time
  `, [season]);
  console.log('\nWeek 0 Games:');
  console.table(week0Games);

  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
