const cron = require('node-cron');
const api = require('./api');

let dailyTask = null;
let liveScoresTask = null;

function start(db) {
  if (process.env.DISABLE_CRON === 'true') {
    console.log('Cron sync is disabled.');
    return;
  }

  if (dailyTask) {
    dailyTask.stop();
  }
  if (liveScoresTask) {
    liveScoresTask.stop();
  }

  // Daily sync at midnight
  dailyTask = cron.schedule('0 0 * * *', async () => {
    try {
      console.log('[scheduler] syncing season games, scores, spreads, and over/unders');
      const games = await api.fetchSeasonGames();
      const savedCount = await db.saveGamesForSeason(games);
      const scoreUpdates = await api.fetchSeasonScores();
      const updatedCount = await db.updateScoresFromSeason(scoreUpdates);
      console.log(`[scheduler] synced ${savedCount} games (with spreads/totals), updated ${updatedCount} scores`);
    } catch (error) {
      console.error('[scheduler] sync failed', error.message);
    }
  });

  // Live score sync every 5 minutes for games in progress
  liveScoresTask = cron.schedule('*/5 * * * *', async () => {
    try {
      const activeWeeks = await db.getInProgressWeeks();
      if (activeWeeks.length === 0) {
        return;
      }

      console.log(`[scheduler] found ${activeWeeks.length} active week(s) with games in progress. Syncing live scores...`);
      for (const { season, week } of activeWeeks) {
        const scoreUpdates = await api.fetchWeekScores(week, season);
        const updatedCount = await db.updateScoresFromSeason(scoreUpdates);
        console.log(`[scheduler] updated ${updatedCount} scores for ${season} Week ${week}`);
      }
      // Attempt to flush pending picks as part of scheduled maintenance
      try { const flusher = require('./flush_pending_picks'); await flusher.flushOnce(db); } catch(e) { console.error('Pending flush error', e.message); }
    } catch (error) {
      console.error('[scheduler] live score sync failed', error.message);
    }
  });

  // Odds and lines sync every 4 hours
  const oddsTask = cron.schedule('0 */4 * * *', async () => {
    try {
      console.log('[scheduler] syncing odds and lines');
      const games = await api.fetchSeasonGames();
      const savedCount = await db.saveGamesForSeason(games);
      console.log(`[scheduler] synced ${savedCount} games with updated odds/lines`);
    } catch (error) {
      console.error('[scheduler] odds sync failed', error.message);
    }
  });

  console.log('Scheduler started: daily updates, 4-hour odds sync, and 5-minute live score sync are enabled.');
}

function stop() {
  if (dailyTask) {
    dailyTask.stop();
  }
  if (liveScoresTask) {
    liveScoresTask.stop();
  }
}

module.exports = { start, stop };