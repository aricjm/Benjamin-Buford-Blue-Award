require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.POSTGRES_URL, ssl: { rejectUnauthorized: false } });

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function extractOddsFromItems(items, homeTeamName, awayTeamName) {
  // Find odds from a preferred provider, or take the first available.
  // Preferred: ESPN BET, DraftKings, FanDuel, Caesars, MGM, consensus
  const preferredProviders = ['ESPN BET', 'DraftKings', 'FanDuel', 'Caesars Sportsbook', 'MGM', 'consensus'];
  let odds = null;
  for (const providerName of preferredProviders) {
    odds = items.find((o) => o.provider?.name?.toUpperCase().includes(providerName.toUpperCase()));
    if (odds) break;
  }
  if (!odds && items.length > 0) {
    odds = items[0];
  }
  if (!odds) return null;

  let spread_home = null;
  let spread_away = null;

  if (typeof odds.spread === 'number') {
    // In the core API, odds.spread is the spread for the favorite.
    // Let's check who is the favorite.
    const details = odds.details || '';
    const spreadValue = Math.abs(odds.spread);
    
    // Let's parse details to see who is the favorite.
    // Details is usually like "TENN -5.5" or "FLA -48.5" or "UGA -12.5"
    const favAbbr = details.split(' ')[0];
    
    // We can also check awayTeamOdds.favorite or homeTeamOdds.favorite
    const homeFav = odds.homeTeamOdds?.favorite === true;
    const awayFav = odds.awayTeamOdds?.favorite === true;

    if (homeFav) {
      spread_home = -spreadValue;
      spread_away = spreadValue;
    } else if (awayFav) {
      spread_home = spreadValue;
      spread_away = -spreadValue;
    } else if (favAbbr) {
      // Fallback to abbreviation matching
      // We can check if the abbreviation matches home or away team
      // Let's assume if details starts with home team abbreviation or name, home is favorite
      // But since we don't have team abbreviations easily, let's check if the details string contains a part of the team name
      const homeWords = homeTeamName.split(' ');
      const awayWords = awayTeamName.split(' ');
      const isHomeFav = homeWords.some(w => w.length > 2 && favAbbr.toUpperCase().includes(w.toUpperCase())) || 
                        (favAbbr.length >= 2 && homeTeamName.toUpperCase().includes(favAbbr.toUpperCase()));
      const isAwayFav = awayWords.some(w => w.length > 2 && favAbbr.toUpperCase().includes(w.toUpperCase())) || 
                        (favAbbr.length >= 2 && awayTeamName.toUpperCase().includes(favAbbr.toUpperCase()));
      
      if (isHomeFav && !isAwayFav) {
        spread_home = -spreadValue;
        spread_away = spreadValue;
      } else if (isAwayFav && !isHomeFav) {
        spread_home = spreadValue;
        spread_away = -spreadValue;
      } else {
        // If we can't determine, assume odds.spread is home spread
        spread_home = odds.spread;
        spread_away = -odds.spread;
      }
    } else {
      spread_home = odds.spread;
      spread_away = -odds.spread;
    }
  } else if (odds.details) {
    const parts = odds.details.split(' ');
    const maybe = parts.find((p) => /-?\\d+(\\.\\d+)?/.test(p));
    const spreadValue = maybe ? parseFloat(maybe) : NaN;
    if (!isNaN(spreadValue)) {
      const favAbbr = parts[0];
      const homeWords = homeTeamName.split(' ');
      const awayWords = awayTeamName.split(' ');
      const isHomeFav = homeWords.some(w => w.length > 2 && favAbbr.toUpperCase().includes(w.toUpperCase())) || 
                        (favAbbr.length >= 2 && homeTeamName.toUpperCase().includes(favAbbr.toUpperCase()));
      const isAwayFav = awayWords.some(w => w.length > 2 && favAbbr.toUpperCase().includes(w.toUpperCase())) || 
                        (favAbbr.length >= 2 && awayTeamName.toUpperCase().includes(favAbbr.toUpperCase()));

      const absSpread = Math.abs(spreadValue);
      if (isHomeFav && !isAwayFav) {
        spread_home = -absSpread;
        spread_away = absSpread;
      } else if (isAwayFav && !isHomeFav) {
        spread_home = absSpread;
        spread_away = -absSpread;
      } else {
        spread_home = spreadValue;
        spread_away = -spreadValue;
      }
    }
  }

  const over_under = odds.overUnder ?? null;
  const home_price = odds.homeTeamOdds?.moneyLine ?? null;
  const away_price = odds.awayTeamOdds?.moneyLine ?? null;

  return { spread_home, spread_away, over_under, home_price, away_price };
}

async function run() {
  console.log('Starting ESPN core API odds backfill for games missing odds (season >= 2022)...');

  const { rows: games } = await pool.query(`
    SELECT id, api_game_id, season, commence_time, home_team, away_team
    FROM games
    WHERE (season >= '2022') AND api_game_id IS NOT NULL AND (spread_home IS NULL OR over_under IS NULL)
    ORDER BY season, commence_time
  `);

  console.log(`Found ${games.length} games to check`);
  let updatedCount = 0;
  const failed = [];

  for (let i = 0; i < games.length; i++) {
    const g = games[i];
    const url = `http://sports.core.api.espn.com/v2/sports/football/leagues/college-football/events/${g.api_game_id}/competitions/${g.api_game_id}/odds?lang=en&region=us`;
    let attempts = 0;
    let success = false;
    while (attempts < 3 && !success) {
      attempts += 1;
      try {
        const { data } = await axios.get(url, { timeout: 15000 });
        if (data && data.items && data.items.length > 0) {
          const odds = extractOddsFromItems(data.items, g.home_team, g.away_team);
          if (odds && (odds.spread_home !== null || odds.over_under !== null)) {
            const res = await pool.query(`
              UPDATE games SET 
                spread_home = COALESCE(spread_home, $1), 
                spread_away = COALESCE(spread_away, $2), 
                over_under = COALESCE(over_under, $3), 
                home_price = COALESCE(home_price, $4), 
                away_price = COALESCE(away_price, $5), 
                updated_at = $6
              WHERE id = $7
            `, [odds.spread_home, odds.spread_away, odds.over_under, odds.home_price, odds.away_price, new Date().toISOString(), g.id]);

            if (res.rowCount > 0) updatedCount += 1;
            success = true;
            process.stdout.write('.');
          } else {
            success = true;
            process.stdout.write('s');
          }
        } else {
          success = true;
          process.stdout.write('e');
        }
      } catch (err) {
        if (err.response && err.response.status === 404) {
          // 404 is expected for some games that don't have odds in the core API
          success = true;
          process.stdout.write('n');
        } else if (attempts >= 3) {
          failed.push({ id: g.id, api_game_id: g.api_game_id, err: err.message });
          process.stdout.write('F');
        } else {
          await sleep(500 * attempts);
        }
      }
    }

    // throttle: 100ms between requests to avoid rate limits
    await sleep(100);
    if ((i + 1) % 80 === 0) process.stdout.write(` ${i + 1}\n`);
  }

  console.log('\nDone.');
  console.log(`Updated ${updatedCount} games with odds from ESPN core API.`);
  if (failed.length) {
    console.log(`Failed to fetch ${failed.length} games; sample:`);
    console.log(failed.slice(0, 10));
  }

  await pool.end();
}

run().catch((err) => {
  console.error('Backfill run failed:', err);
  process.exit(1);
});
