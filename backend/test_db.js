const db = require('./db');

(async () => {
  try {
    await db.init();
    console.log('Database initialized');
    
    // Test getPlayerStats
    try {
      const stats = await db.getPlayerStats('Aric');
      console.log('getPlayerStats result:', JSON.stringify(stats, null, 2));
    } catch (err) {
      console.error('getPlayerStats error:', err.message);
      console.error(err.stack);
    }
    
    // Test getWeekGames
    try {
      const games = await db.getWeekGames(1, '2026');
      console.log('getWeekGames result count:', games.length);
    } catch (err) {
      console.error('getWeekGames error:', err.message);
      console.error(err.stack);
    }
    
    // Test getWeekSummary
    try {
      const summary = await db.getWeekSummary(1, '2026');
      console.log('getWeekSummary result:', JSON.stringify(summary, null, 2));
    } catch (err) {
      console.error('getWeekSummary error:', err.message);
      console.error(err.stack);
    }
    
  } catch (error) {
    console.error('Failed:', error.message);
    console.error(error.stack);
  } finally {
    process.exit(0);
  }
})();