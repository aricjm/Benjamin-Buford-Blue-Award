require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

async function main() {
  const client = await pool.connect();
  try {
    console.log("Checking for any remaining pending picks for Aric...");

    const { rows: pendingPicks } = await client.query(
      `SELECT p.id, p.week, p.player, p.game_id, p.selection_team, p.spread, p.selection_total, p.total_line,
              g.season, g.home_team, g.away_team
       FROM picks p
       JOIN games g ON p.game_id = g.id
       WHERE p.player = 'Aric' 
         AND p.result = 'pending'`
    );

    if (pendingPicks.length === 0) {
      console.log("\nNo pending picks found for Aric.");
    } else {
      console.log(`\nFound ${pendingPicks.length} pending picks for Aric:`);
      const formattedPicks = pendingPicks.map(p => {
        const pickType = p.selection_team 
            ? `Spread: ${p.selection_team} ${p.spread > 0 ? '+' : ''}${p.spread}`
            : `Total: ${p.selection_total.toUpperCase()} ${p.total_line}`;
        return {
            season: p.season,
            week: p.week,
            game: `${p.away_team} @ ${p.home_team}`,
            pick: pickType,
        }
      });
      console.table(formattedPicks);
    }

  } catch (e) {
    console.error("An error occurred while checking for pending picks:", e);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});