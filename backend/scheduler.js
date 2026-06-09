const cron = require('node-cron');
const api = require('./api');

let task = null;

function start(db) {
  if (process.env.DISABLE_CRON === 'true') {
    console.log('Cron sync is disabled.');
    return;
  }

  if (task) {
    task.stop();
  }

  task = cron.schedule('0 0 * * *', async () => {
    try {
      console.log('[scheduler] syncing season games and scores');
      const games = await api.fetchSeasonGames();
      const savedCount = db.saveGamesForSeason(games);
      const scoreUpdates = await api.fetchSeasonScores();
      const updatedCount = db.updateScoresFromSeason(scoreUpdates);
      console.log(`[scheduler] saved ${savedCount} games, updated ${updatedCount} scores`);
    } catch (error) {
      console.error('[scheduler] sync failed', error.message);
    }
  });

  console.log('Scheduler started: daily updates are enabled.');
}

function stop() {
  if (task) {
    task.stop();
  }
}

module.exports = { start, stop };