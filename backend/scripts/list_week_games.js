require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

const week = parseInt(process.argv[2]);
const season = process.argv[3] || '2023';

pool.query(
  'SELECT home_team, away_team, score_home, score_away FROM games WHERE season = $1 AND week = $2 ORDER BY home_team',
  [season, week]
).then(r => {
  r.rows.forEach(g => console.log(`${g.away_team} @ ${g.home_team} (${g.score_away}-${g.score_home})`));
  pool.end();
});
