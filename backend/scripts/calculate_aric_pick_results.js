/**
 * Calculate results for Aric's imported 2023 picks
 * Since these are historical games that are already finished,
 * we need to calculate the win/loss/push results
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { Pool } = require('pg');
const { determinePickResult, determineTotalResult } = require('../utils');

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

async function calculateResults() {
  // Get all of Aric's 2023 picks
  const { rows: picks } = await pool.query(
    `SELECT p.id, p.week, p.player, p.game_id, p.selection_team, p.selection_side, 
            p.spread, p.selection_total, p.total_line, p.result, p.result_total
     FROM picks p
     JOIN games g ON p.game_id = g.id
     WHERE p.player = $1 AND g.season = $2
     ORDER BY p.week, p.id`,
    ['Aric', '2023']
  );

  console.log(`Found ${picks.length} picks for Aric in 2023`);

  let updated = 0;
  let errors = 0;

  for (const pick of picks) {
    try {
      // Get the game data
      const { rows: games } = await pool.query(
        `SELECT id, home_team, away_team, score_home, score_away, completed, 
                spread_home, over_under
         FROM games WHERE id = $1`,
        [pick.game_id]
      );

      if (!games.length) {
        console.error(`Game ${pick.game_id} not found`);
        errors++;
        continue;
      }

      const game = games[0];

      // Calculate results for spread picks
      if (pick.selection_team) {
        const result = determinePickResult(game, {
          selection_team: pick.selection_team,
          selection_side: pick.selection_side,
          spread: pick.spread
        });

        if (result !== pick.result) {
          await pool.query(
            `UPDATE picks SET result = $1, updated_at = $2 WHERE id = $3`,
            [result, new Date().toISOString(), pick.id]
          );
          updated++;
          console.log(`W${pick.week} Aric: ${pick.selection_team} ${pick.selection_side} → ${result}`);
        }
      }

      // Calculate results for total picks
      if (pick.selection_total) {
        const result_total = determineTotalResult(game, {
          selection_total: pick.selection_total,
          total_line: pick.total_line
        });

        if (result_total !== pick.result_total) {
          await pool.query(
            `UPDATE picks SET result_total = $1, updated_at = $2 WHERE id = $3`,
            [result_total, new Date().toISOString(), pick.id]
          );
          updated++;
          console.log(`W${pick.week} Aric: ${pick.selection_total} ${pick.total_line} → ${result_total}`);
        }
      }
    } catch (err) {
      console.error(`Error processing pick ${pick.id}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n=== Results ===`);
  console.log(`Updated: ${updated}`);
  console.log(`Errors: ${errors}`);
}

async function main() {
  try {
    await calculateResults();
  } catch (err) {
    console.error('Fatal error:', err.message);
  } finally {
    await pool.end();
  }
}

main();
