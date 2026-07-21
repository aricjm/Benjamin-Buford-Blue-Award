require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.POSTGRES_URL });
const TEAM_MAPPINGS = require('./nicks_mappings');

async function main() {
  const line = "Tennessee - Florida u56";
  const cleanLine = line.replace(/[🏈🔒]/g, '').trim();
  const ouMatch = cleanLine.match(/^(.+?)(?:-|@)(.+?)\s*([ou])\s*([\d.]+)$/i);
  
  console.log('ouMatch:', ouMatch);
  if (ouMatch) {
    const team1 = ouMatch[1].trim();
    const team2 = ouMatch[2].trim();
    const selection = ouMatch[3].toLowerCase() === 'o' ? 'over' : 'under';
    const lineVal = parseFloat(ouMatch[4]);
    
    console.log('Parsed:', { team1, team2, selection, lineVal });
    
    const mappedTeam1 = TEAM_MAPPINGS[team1] || team1;
    const mappedTeam2 = TEAM_MAPPINGS[team2] || team2;
    
    console.log('Mapped:', { mappedTeam1, mappedTeam2 });
    
    const { rows } = await pool.query(
      `SELECT id, home_team, away_team, score_home, score_away, completed 
       FROM games 
       WHERE week = $1 AND season = '2023' 
         AND (
           (home_team = $2 AND away_team = $3) OR 
           (home_team = $3 AND away_team = $2)
         )
       LIMIT 1`,
      [3, mappedTeam1, mappedTeam2]
    );
    console.log('Query result:', rows);
  }
  await pool.end();
}

main();
