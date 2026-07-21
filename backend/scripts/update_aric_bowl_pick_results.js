require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

function determineSpreadResult(game, pick) {
  if (game.score_home === null || game.score_away === null || !game.completed) {
    return 'pending';
  }

  const homeScore = Number(game.score_home);
  const awayScore = Number(game.score_away);
  const isHome = pick.selection_team === game.home_team;
  
  const selectionScore = isHome ? homeScore + pick.spread : awayScore + pick.spread;
  const opponentScore = isHome ? awayScore : homeScore;

  if (selectionScore > opponentScore) return 'win';
  if (selectionScore < opponentScore) return 'loss';
  return 'push';
}

function determineTotalResult(game, pick) {
  if (game.score_home === null || game.score_away === null || !game.completed) {
    return 'pending';
  }

  const totalScore = Number(game.score_home) + Number(game.score_away);
  if (totalScore > pick.total_line) return pick.selection_total === 'over' ? 'win' : 'loss';
  if (totalScore < pick.total_line) return pick.selection_total === 'under' ? 'win' : 'loss';
  return 'push';
}

async function main() {
  const client = await pool.connect();
  try {
    console.log("Fetching Aric's pending 2023 bowl game picks...");

    const { rows: pendingPicks } = await client.query(
      `SELECT p.id, p.week, p.player, p.game_id, p.selection_team, p.selection_side, 
              p.spread, p.selection_total, p.total_line,
              g.home_team, g.away_team, g.score_home, g.score_away, g.completed
       FROM picks p
       JOIN games g ON p.game_id = g.id
       WHERE p.player = 'Aric' 
         AND g.season = '2023' 
         AND p.week = 16 AND p.result = 'pending'`
    );

    if (pendingPicks.length === 0) {
      console.log("No pending bowl picks found for Aric to update.");
      return;
    }

    console.log(`Found ${pendingPicks.length} pending bowl picks. Calculating and updating results...`);
    let updatedCount = 0;

    for (const pick of pendingPicks) {
      if (pick.selection_team) { // It's a spread pick
        const newResult = determineSpreadResult(pick, pick);
        await client.query(
          `UPDATE picks SET result = $1, updated_at = NOW() WHERE id = $2`,
          [newResult, pick.id]
        );
        console.log(`  Updated spread pick ${pick.id} (${pick.selection_team} ${pick.spread > 0 ? '+' : ''}${pick.spread}): ${newResult.toUpperCase()}`);
        updatedCount++;
      } else if (pick.selection_total) { // It's a total pick
        const newResult = determineTotalResult(pick, pick);
        await client.query(
          `UPDATE picks SET result = $1, updated_at = NOW() WHERE id = $2`,
          [newResult, pick.id]
        );
        console.log(`  Updated total pick ${pick.id} (${pick.selection_total.toUpperCase()} ${pick.total_line}): ${newResult.toUpperCase()}`);
        updatedCount++;
      }
    }

    console.log(`\nSuccessfully updated ${updatedCount} pick results.`);

  } catch (e) {
    console.error("An error occurred while updating pick results:", e);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});