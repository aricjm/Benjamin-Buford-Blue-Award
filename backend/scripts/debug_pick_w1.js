require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.POSTGRES_URL });
const TEAM_MAPPINGS = require('./nicks_mappings');

async function main() {
  const week = 1;
  const mappedTeam1 = TEAM_MAPPINGS['Utah State'] || 'Utah State';
  const mappedTeam2 = TEAM_MAPPINGS['Iowa'] || 'Iowa';
  
  console.log('Mapped teams:', { mappedTeam1, mappedTeam2 });
  
  const { rows } = await pool.query(
    `SELECT id, home_team, away_team, score_home, score_away, completed 
     FROM games 
     WHERE week = $1 AND season = '2023' 
       AND (
         (home_team = $2 AND away_team = $3) OR 
         (home_team = $3 AND away_team = $2)
       )
     LIMIT 1`,
    [week, mappedTeam1, mappedTeam2]
  );
  console.log('Query result:', rows);
  await pool.end();
}

main();
