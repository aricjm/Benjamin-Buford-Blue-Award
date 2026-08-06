const fs = require('fs');
const path = require('path');

const PENDING_PATH = path.join(__dirname, 'pending-picks.jsonl');

async function flushOnce(db) {
  if (!fs.existsSync(PENDING_PATH)) return { processed: 0 };
  const lines = fs.readFileSync(PENDING_PATH, 'utf8').split('\n').filter(Boolean);
  if (lines.length === 0) return { processed: 0 };

  const remaining = [];
  let processed = 0;

  for (const line of lines) {
    let item;
    try { item = JSON.parse(line); } catch (e) { continue; }

    // Simple backoff: skip items with too many attempts (leave for manual review)
    if ((item.attempts || 0) >= 10) {
      remaining.push(item);
      continue;
    }

    try {
      // Clear existing picks for player/week/season then save each pick
      await db.deletePicksForPlayerWeek(item.player, item.week, item.season);
      for (const pick of item.picks) {
        await db.savePick(item.week, item.player, pick);
      }
      processed += 1;
    } catch (err) {
      // increment attempts and keep for retry
      item.attempts = (item.attempts || 0) + 1;
      item.lastError = err.message;
      remaining.push(item);
    }
  }

  // Write remaining back
  const out = remaining.map(r => JSON.stringify(r)).join('\n');
  fs.writeFileSync(PENDING_PATH, out ? out + '\n' : '', 'utf8');
  return { processed, remaining: remaining.length };
}

async function flushOne(db, id) {
  if (!fs.existsSync(PENDING_PATH)) return { processed: 0, error: 'no-file' };
  const lines = fs.readFileSync(PENDING_PATH, 'utf8').split('\n').filter(Boolean);
  const remaining = [];
  let processed = 0;
  let found = false;
  for (const line of lines) {
    let item;
    try { item = JSON.parse(line); } catch (e) { remaining.push(line); continue; }
    if (item.id !== id) { remaining.push(item); continue; }
    found = true;
    if ((item.attempts || 0) >= 10) {
      remaining.push(item);
      continue;
    }
    try {
      await db.deletePicksForPlayerWeek(item.player, item.week, item.season);
      for (const pick of item.picks) {
        await db.savePick(item.week, item.player, pick);
      }
      processed += 1;
    } catch (err) {
      item.attempts = (item.attempts || 0) + 1;
      item.lastError = err.message;
      remaining.push(item);
    }
  }
  fs.writeFileSync(PENDING_PATH, remaining.map(r => JSON.stringify(r)).join('\n') + (remaining.length ? '\n' : ''), 'utf8');
  if (!found) return { processed: 0, error: 'not-found' };
  return { processed, remaining: remaining.length };
}

async function flushOnePick(db, id, pickIndex) {
  if (!fs.existsSync(PENDING_PATH)) return { processed: 0, error: 'no-file' };
  const lines = fs.readFileSync(PENDING_PATH, 'utf8').split('\n').filter(Boolean);
  const remaining = [];
  let found = false;
  let processed = 0;

  for (const line of lines) {
    let item;
    try { item = JSON.parse(line); } catch (e) { remaining.push(line); continue; }
    if (item.id !== id) { remaining.push(item); continue; }
    found = true;
    const idx = Number(pickIndex);
    if (!Array.isArray(item.picks) || idx < 0 || idx >= item.picks.length) {
      remaining.push(item);
      continue;
    }

    const pick = item.picks[idx];
    try {
      // attempt to save single pick without deleting other picks
      await db.savePick(item.week, item.player, pick);
      // remove this pick from the queued item
      item.picks.splice(idx, 1);
      // if no more picks in item, do not re-add
      if (item.picks.length > 0) {
        remaining.push(item);
      }
      processed = 1;
    } catch (err) {
      item.attempts = (item.attempts || 0) + 1;
      item.lastError = err.message;
      remaining.push(item);
    }
  }

  fs.writeFileSync(PENDING_PATH, remaining.map(r => JSON.stringify(r)).join('\n') + (remaining.length ? '\n' : ''), 'utf8');
  if (!found) return { processed: 0, error: 'not-found' };
  return { processed, remaining: remaining.length };
}

// If run directly, load db and run once
if (require.main === module) {
  (async () => {
    try {
      const db = require('./db');
      await db.init();
      const result = await flushOnce(db);
      console.log('Flush result:', result);
      process.exit(0);
    } catch (err) {
      console.error('Flush failed', err);
      process.exit(1);
    }
  })();
}

module.exports = { flushOnce };
