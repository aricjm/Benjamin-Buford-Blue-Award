const { getWeekNumberFromDate, getSeasonFromDate } = require('./utils');
const axios = require('axios');

const BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/college-football';
const DEFAULT_SEASON = new Date().getUTCFullYear().toString();

async function fetchJson(url) {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    throw new Error(`ESPN API error: ${error.message}`);
  }
}

function mapGame(event) {
  const competition = event.competitions[0];
  const homeCompetitor = competition.competitors.find(c => c.homeAway === 'home');
  const awayCompetitor = competition.competitors.find(c => c.homeAway === 'away');

  // Find odds from a preferred provider, or take the first available.
  const odds = competition.odds?.find(o => o.provider.name === 'ESPN BET') || competition.odds?.[0] || {};

  let spread_home = null;
  let spread_away = null;

  // The `spread` from the API is for the favorite. A negative value means the home team is the favorite.
  if (typeof odds.spread === 'number') {
    spread_home = odds.spread;
    spread_away = -odds.spread;
  } else if (odds.details) {
    // Fallback for older format if `spread` is not available
    const spreadValue = parseFloat(odds.details.split(' ')[1]);
    if (!isNaN(spreadValue)) {
      spread_home = odds.favorite?.homeAway === 'home' ? -spreadValue : spreadValue;
      spread_away = -spread_home;
    }
  }


  return {
    api_game_id: event.id,
    week: event.week.number,
    season: event.season.year.toString(),
    commence_time: event.date,
    home_team: homeCompetitor.team.displayName,
    away_team: awayCompetitor.team.displayName,
    site: competition.venue?.fullName || 'N/A',
    is_televised: competition.broadcasts?.length > 0 ? 1 : 0,
    tv_network: competition.broadcasts?.[0]?.names?.[0] ?? competition.broadcasts?.[0]?.market?.shortName ?? null,
    is_mandatory: 0,
    spread_home,
    spread_away,
    over_under: odds.overUnder ?? null,
    home_price: odds.homeMoneyLine ?? null,
    away_price: odds.awayMoneyLine ?? null,
    score_home: homeCompetitor.score ? parseInt(homeCompetitor.score) : null,
    score_away: awayCompetitor.score ? parseInt(awayCompetitor.score) : null,
    completed: event.status.type.completed
  };
}

function mapScore(event) {
  const competition = event.competitions[0];
  const homeCompetitor = competition.competitors.find(c => c.homeAway === 'home');
  const awayCompetitor = competition.competitors.find(c => c.homeAway === 'away');

  return {
    api_game_id: event.id,
    score_home: homeCompetitor.score ? parseInt(homeCompetitor.score) : null,
    score_away: awayCompetitor.score ? parseInt(awayCompetitor.score) : null,
    completed: event.status.type.completed
  };
}

function shuffle(array) {
  const copied = array.slice();
  for (let i = copied.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }
  return copied;
}

async function fetchSeasonGames(season = DEFAULT_SEASON) {
  const url = `${BASE_URL}/scoreboard?groups=80&limit=300`;
  const data = await fetchJson(url);
  return data.events.map(mapGame);
}

async function fetchWeekGames(week, season = DEFAULT_SEASON) {
  const url = `${BASE_URL}/scoreboard?week=${week}&season=${season}&groups=80&limit=300`;
  const data = await fetchJson(url);
  const weekGames = data.events.map(mapGame);

  const selectedCount = Math.min(5, weekGames.length);
  const indices = shuffle([...Array(weekGames.length).keys()]).slice(0, selectedCount);
  const televisedSet = new Set(indices);
  return weekGames.map((game, index) => ({
    ...game,
    is_televised: televisedSet.has(index) ? 1 : 0,
    is_mandatory: televisedSet.has(index) ? 1 : 0
  }));
}

async function fetchSeasonScores(season = DEFAULT_SEASON) {
  const url = `${BASE_URL}/scoreboard?groups=80&limit=300`;
  const data = await fetchJson(url);
  return data.events.map(mapScore);
}

async function fetchInjuries() {
  const url = `${BASE_URL}/injuries`;
  const data = await fetchJson(url);

  const allInjuries = [];
  if (data.injuries && Array.isArray(data.injuries)) {
    for (const team of data.injuries) {
      if (team.injuries && Array.isArray(team.injuries)) {
        for (const injury of team.injuries) {
          allInjuries.push({
            team_id: team.id,
            team_name: team.displayName,
            player_name: injury.athlete?.displayName || 'Unknown',
            position: injury.athlete?.position?.abbreviation || 'N/A',
            status: injury.status,
            date: injury.date,
            short_comment: injury.shortComment,
            long_comment: injury.longComment
          });
        }
      }
    }
  }
  return allInjuries;
}

async function fetchWeekScores(week, season = DEFAULT_SEASON) {
  const url = `${BASE_URL}/scoreboard?week=${week}&season=${season}&groups=80&limit=300`;
  const data = await fetchJson(url);
  return data.events.map(mapScore);
}

async function fetchRankings(season = DEFAULT_SEASON, week = null, pollType = '1') {
  let url = `${BASE_URL}/rankings`;
  const params = [];
  if (season) params.push(`seasons=${season}`);
  if (week !== null && week !== undefined) params.push(`weeks=${week}`);
  if (params.length > 0) {
    url += `?${params.join('&')}`;
  }

  const data = await fetchJson(url);
  const targetPoll = (data.rankings || []).find(r => String(r.id) === String(pollType)) || (data.rankings || [])[0];
  if (!targetPoll) return [];

  return (targetPoll.ranks || []).map(r => ({
    poll_id: targetPoll.id,
    poll_name: targetPoll.name,
    poll_headline: targetPoll.headline,
    season: String(season),
    week: week !== null && week !== undefined ? Number(week) : null,
    rank: r.current,
    previous_rank: r.previous || null,
    points: r.points || null,
    first_place_votes: r.firstPlaceVotes || 0,
    trend: r.trend || null,
    record_summary: r.recordSummary || '',
    team_id: r.team?.id,
    team_name: r.team?.displayName || r.team?.name || 'Unknown',
    team_location: r.team?.location || '',
    team_nickname: r.team?.nickname || r.team?.name || '',
    team_abbreviation: r.team?.abbreviation || '',
    team_logo: r.team?.logo || r.team?.logos?.[0]?.href || '',
    conference: r.team?.groups?.shortName || r.team?.groups?.name || ''
  }));
}

const EXPERT_ACCOUNTS = [
  { handle: '_Collin1', name: 'Collin Wilson', focus: 'Action Network Senior CFB Writer' },
  { handle: 'Stuckey2', name: 'Stuckey', focus: 'Action Network Senior CFB Analyst' },
  { handle: 'ActionColleges', name: 'Action CFB', focus: 'Action Network College Sports' },
  { handle: 'ActionNetworkHQ', name: 'Action Network', focus: 'Sports Betting Insights & News' },
  { handle: 'Shaggy_Bets', name: 'Shaggy Bets', focus: 'CFB Spread & Totals Specialist' },
  { handle: 'Steponaduck', name: 'Step On A Duck', focus: 'College Football Betting & Trends' },
  { handle: 'ChrisTheBear', name: 'Chris Fallica ("The Bear")', focus: 'FOX Sports Betting Analyst' },
  { handle: 'CFBWinningEdge', name: 'CFB Winning Edge', focus: 'CFB Analytics & Roster Insights' },
  { handle: 'PickDawgz', name: 'Pick Dawgz', focus: 'Free College Football Picks & Analysis' },
  { handle: 'VegasInsider', name: 'VegasInsider', focus: 'Vegas Odds, Lines & Expert Picks' },
];

async function fetchExpertTweets(accountHandle = null) {
  const handlesToFetch = accountHandle
    ? EXPERT_ACCOUNTS.filter(a => a.handle.toLowerCase() === accountHandle.toLowerCase())
    : EXPERT_ACCOUNTS;

  const allTweets = [];

  for (const account of handlesToFetch) {
    try {
      const res = await axios.get(`https://syndication.twitter.com/srv/timeline-profile/screen-name/${account.handle}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        timeout: 6000
      });

      const match = res.data.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]+?)<\/script>/);
      if (match) {
        const json = JSON.parse(match[1]);
        const entries = json.props?.pageProps?.timeline?.entries || [];

        for (const entry of entries) {
          const tweet = entry?.content?.tweet || entry?.content?.item?.content?.tweet;
          if (tweet && tweet.text) {
            allTweets.push({
              id: tweet.id_str,
              text: tweet.text,
              created_at: tweet.created_at,
              user: {
                name: tweet.user?.name || account.name,
                screen_name: tweet.user?.screen_name || account.handle,
                profile_image_url_https: tweet.user?.profile_image_url_https || `https://unavatar.io/x/${account.handle}`,
                verified: tweet.user?.is_blue_verified || false
              },
              focus: account.focus,
              favorite_count: tweet.favorite_count || 0,
              conversation_count: tweet.conversation_count || 0,
              permalink: tweet.permalink || `https://twitter.com/${account.handle}/status/${tweet.id_str}`,
              media: tweet.mediaDetails || []
            });
          }
        }
      }
    } catch (err) {
      console.error(`Error fetching tweets for ${account.handle}:`, err.message);
    }
  }

  // Sort unified feed by newest created_at timestamp
  allTweets.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return allTweets;
}

module.exports = {
  fetchSeasonGames,
  fetchWeekGames,
  fetchSeasonScores,
  fetchWeekScores,
  fetchInjuries,
  fetchRankings,
  fetchExpertTweets,
  EXPERT_ACCOUNTS
};
