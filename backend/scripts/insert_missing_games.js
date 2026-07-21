require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const axios = require('axios');
const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

const MISSING_GAMES = [
  { id: '401539997', week: 6 }, // North Carolina Central @ Elon
  { id: '401540265', week: 12 } // Montana State @ Montana
];

function mapSummaryGame(event, week, season) {
  const competition = event.competitions[0];
  const homeCompetitor = competition.competitors.find((c) => c.homeAway === 'home');
  const awayCompetitor = competition.competitors.find((c) => c.homeAway === 'away');

  if (!homeCompetitor || !awayCompetitor) return null;

  return {
    api_game_id: event.id,
    week: week,
    season: season.toString(),
    commence_time: competition.date,
    home_team: homeCompetitor.team.displayName,
    away_team: awayCompetitor.team.displayName,
    site: competition.venue?.fullName || 'N/A',
    is_televised: competition.broadcasts?.length > 0 ? 1 : 0,
    tv_network: competition.broadcasts?.[0]?.names?.[0] ?? competition.broadcasts?.[0]?.market?.shortName ?? null,
    is_mandatory: 0,
    spread_home: null,
    spread_away: null,
    over_under: null,
    home_price: null,
    away_price: null,
    score_home: homeCompetitor.score != null ? parseInt(homeCompetitor.score) : null,
    score_away: awayCompetitor.score != null ? parseInt(awayCompetitor.score) : null,
    completed: competition.status?.type?.completed ? 1 : 0
  };
}

async function main() {
  for (const item of MISSING_GAMES) {
    console.log(`Fetching game summary for ID: ${item.id}...`);
    const url = `https://site.api.espn.com/apis/site/v2/sports/football/college-football/summary?event=${item.id}`;
    try {
      const { data } = await axios.get(url);
      const event = data.header;
      if (!event) {
        console.error(`No header found for game ${item.id}`);
        continue;
      }
      
      const mapped = mapSummaryGame(event, item.week, 2023);
      if (!mapped) {
        console.error(`Failed to map game ${item.id}`);
        continue;
      }

      console.log(`Mapped game: ${mapped.away_team} @ ${mapped.home_team} (Week ${mapped.week})`);

      await pool.query(
        `INSERT INTO games (
          api_game_id, week, season, commence_time,
          home_team, away_team, site,
          is_televised, tv_network, is_mandatory,
          spread_home, spread_away, over_under,
          home_price, away_price,
          score_home, score_away, completed, updated_at
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7,
          $8, $9, $10,
          $11, $12, $13,
          $14, $15,
          $16, $17, $18, $19
        )
        ON CONFLICT (api_game_id) DO UPDATE SET
          week          = EXCLUDED.week,
          season        = EXCLUDED.season,
          commence_time = EXCLUDED.commence_time,
          home_team     = EXCLUDED.home_team,
          away_team     = EXCLUDED.away_team,
          site          = EXCLUDED.site,
          is_televised  = EXCLUDED.is_televised,
          tv_network    = EXCLUDED.tv_network,
          spread_home   = EXCLUDED.spread_home,
          spread_away   = EXCLUDED.spread_away,
          over_under    = EXCLUDED.over_under,
          home_price    = EXCLUDED.home_price,
          away_price    = EXCLUDED.away_price,
          score_home    = EXCLUDED.score_home,
          score_away    = EXCLUDED.score_away,
          completed     = EXCLUDED.completed,
          updated_at    = EXCLUDED.updated_at`,
        [
          mapped.api_game_id, mapped.week, mapped.season, mapped.commence_time,
          mapped.home_team, mapped.away_team, mapped.site,
          mapped.is_televised, mapped.tv_network, mapped.is_mandatory,
          mapped.spread_home, mapped.spread_away, mapped.over_under,
          mapped.home_price, mapped.away_price,
          mapped.score_home, mapped.score_away, mapped.completed,
          new Date().toISOString()
        ]
      );
      console.log(`Successfully inserted/updated game ${item.id} in DB.`);
    } catch (err) {
      console.error(`Error processing game ${item.id}: ${err.message}`);
    }
  }
  await pool.end();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
