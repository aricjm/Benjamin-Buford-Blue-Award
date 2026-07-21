require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

async function main() {
  const { rows: dbTeams } = await pool.query("SELECT DISTINCT team FROM (SELECT home_team AS team FROM games UNION SELECT away_team AS team FROM games) AS t");
  const teamNames = dbTeams.map(r => r.team);
  
  const shorthand = 'Utah State';
  const matches = teamNames.filter(t => t.toLowerCase().includes(shorthand.toLowerCase()));
  console.log('Matches for Utah State:', matches);
  
  await pool.end();
}

main();
