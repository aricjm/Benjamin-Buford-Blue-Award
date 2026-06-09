const db = require('./db');

(async () => {
  try {
    await db.init();
    await db.seedPlayers();
    await db.seedWeeks();
    console.log('Database initialized.');
  } catch (error) {
    console.error('Failed to initialize database:', error.message);
    process.exit(1);
  }
})();
