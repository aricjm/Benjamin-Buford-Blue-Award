const cron = require('node-cron');
const api = require('./api');

let dailyTask = null;
let liveScoresTask = null;
let oddsTask = null;
let rankingsTask = null;

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
  if (oddsTask) {
    oddsTask.stop();
  }
  if (rankingsTask) {
    rankingsTask.stop();
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

  // Odds and lines sync every 4 hours (00:00, 04:00, 08:00, 12:00, 16:00, 20:00 in America/New_York)
  oddsTask = cron.schedule('0 */4 * * *', async () => {
    try {
      console.log('[scheduler] syncing odds and lines');
      const games = await api.fetchSeasonGames();
      const savedCount = await db.saveGamesForSeason(games);
      console.log(`[scheduler] synced ${savedCount} games with updated odds/lines`);
    } catch (error) {
      console.error('[scheduler] odds sync failed', error.message);
    }
  }, {
    timezone: 'America/New_York'
  });

  // Weekly rankings sync every Sunday at 2:30 PM EST (14:30 America/New_York)
  const rankingsTask = cron.schedule('30 14 * * 0', async () => {
    try {
      console.log('[scheduler] syncing Top 25 rankings');
      const seasons = await db.getSeasons();
      const currentSeason = (seasons && seasons.length) ? seasons[0] : new Date().getFullYear().toString();
      const ranks = await api.fetchRankings(currentSeason);
      const savedCount = await db.saveRankings(ranks, currentSeason);
      console.log(`[scheduler] synced ${savedCount} Top 25 rankings for season ${currentSeason}`);
    } catch (error) {
      console.error('[scheduler] rankings sync failed', error.message);
    }
  }, {
    timezone: 'America/New_York'
  });

  console.log('Scheduler started: daily updates, 4-hour odds sync, 5-minute live score sync, and Sunday 2:30pm EST rankings sync are enabled.');
}

function stop() {
  if (dailyTask) {
    dailyTask.stop();
  }
  if (liveScoresTask) {
    liveScoresTask.stop();
  }
  if (oddsTask) {
    oddsTask.stop();
  }
  if (rankingsTask) {
    rankingsTask.stop();
  }
}

module.exports = { start, stop };