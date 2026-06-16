const cron = require('node-cron');
const api = require('./api');

let task = null;

async function runSync(db) {
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
}

async function start(db) {
  if (process.env.DISABLE_CRON === 'true') {
    console.log('Cron sync is disabled.');
    return;
  }

  if (task) {
    task.stop();
  }

  // Schedule hourly updates (0 * * * *)
  task = cron.schedule('0 * * * *', () => runSync(db));

  console.log('Scheduler started: hourly updates are enabled.');
  
  // Trigger initial sync on server start
  await runSync(db);
}

function stop() {
  if (task) {
    task.stop();
  }
}

module.exports = { start, stop };