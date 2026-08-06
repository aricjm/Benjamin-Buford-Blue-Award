from pathlib import Path

path = Path('backend/db.js')
text = path.read_text(encoding='utf-8')
start_marker = 'async function getPlayerStats(player, timeRange, week, season) {'
end_marker = 'async function getConferenceStats(player, conference, timeRange, week, season) {'

start = text.find(start_marker)
end = text.find(end_marker)
if start == -1 or end == -1:
    raise SystemExit('Could not find function markers in backend/db.js')

new_block = '''async function getPlayerStats(player, timeRange, week, season) {
  const params = [player];
  let timeFilter = '';

  if (timeRange === 'Week') {
    timeFilter = 'AND g.week = $2 AND g.season = $3';
    params.push(week, season);
  } else if (timeRange === 'Season') {
    timeFilter = 'AND g.season = $2';
    params.push(season);
  } else if (timeRange === 'Last Season') {
    timeFilter = 'AND g.season = $2';
    params.push(String(Number(season) - 1));
  } else if (/^\\d{4}$/.test(timeRange)) {
    timeFilter = 'AND g.season = $2';
    params.push(timeRange);
  } else if (timeRange === 'Last 5 Weeks') {
    timeFilter = 'AND g.season = $3 AND g.week BETWEEN $2 - 4 AND $2';
    params.push(week, season);
  } else if (timeRange === 'Last 10 Weeks') {
    timeFilter = 'AND g.season = $3 AND g.week BETWEEN $2 - 9 AND $2';
    params.push(week, season);
  } else if (timeRange === 'Last 30 Days') {
    timeFilter = "AND g.commence_time >= NOW() - INTERVAL '30 days'";
  }

  const { rows } = await pool.query(`
    SELECT
      p.result,
      p.selection_team,
      p.selection_side,
      p.selection_total,
      p.is_lock,
      g.season,
      g.week,
      g.commence_time,
      g.home_team,
      g.away_team,
      t.school AS team_school,
      t.logo AS team_logo,
      t.conference AS team_conference
    FROM picks p
    JOIN games g ON p.game_id = g.id
    LEFT JOIN teams t ON p.selection_team = t.school
    WHERE p.player = $1 ${timeFilter}
    ORDER BY g.commence_time ASC, g.id ASC
  `, params);

  const countsByConf = {
    fav: new Map(),
    win: new Map(),
    loss: new Map(),
  };
  const teamCounts = {
    wins: new Map(),
    losses: new Map(),
    betsFor: new Map(),
    betsAgainst: new Map(),
  };
  const teamMeta = {
    logos: new Map(),
    conferences: new Map(),
  };

  const recentResults = [];
  const recentTotalResults = [];
  const trendMap = new Map();

  const record = { wins: 0, losses: 0, pushes: 0, pending: 0, total: 0 };
  const lockRecord = { wins: 0, losses: 0, pushes: 0, pending: 0, total: 0 };

  for (const row of rows) {
    const {
      result,
      selection_team,
      selection_side,
      selection_total,
      is_lock,
      season: rowSeason,
      week: rowWeek,
      home_team,
      away_team,
      team_school,
      team_logo,
      team_conference,
    } = row;

    if (selection_team) {
      if (team_conference) {
        countsByConf.fav.set(team_conference, (countsByConf.fav.get(team_conference) || 0) + 1);
      }
      if (result === 'win' && team_conference) {
        countsByConf.win.set(team_conference, (countsByConf.win.get(team_conference) || 0) + 1);
      }
      if (result === 'loss' && team_conference) {
        countsByConf.loss.set(team_conference, (countsByConf.loss.get(team_conference) || 0) + 1);
      }
      if (team_school) {
        teamMeta.logos.set(team_school, team_logo || teamMeta.logos.get(team_school));
        if (team_conference) {
          teamMeta.conferences.set(team_school, team_conference);
        }
      }
      if (result === 'win') {
        teamCounts.wins.set(selection_team, (teamCounts.wins.get(selection_team) || 0) + 1);
      }
      if (result === 'loss') {
        teamCounts.losses.set(selection_team, (teamCounts.losses.get(selection_team) || 0) + 1);
      }
      teamCounts.betsFor.set(selection_team, (teamCounts.betsFor.get(selection_team) || 0) + 1);
    }

    if (selection_side) {
      const againstTeam = selection_side === 'home' ? away_team : home_team;
      if (againstTeam) {
        teamCounts.betsAgainst.set(againstTeam, (teamCounts.betsAgainst.get(againstTeam) || 0) + 1);
      }
    }

    if (result) {
      if (result === 'win') record.wins += 1;
      else if (result === 'loss') record.losses += 1;
      else if (result === 'push') record.pushes += 1;
      else if (result === 'pending') record.pending += 1;
      record.total += 1;
    }

    if (is_lock) {
      if (result === 'win') lockRecord.wins += 1;
      else if (result === 'loss') lockRecord.losses += 1;
      else if (result === 'push') lockRecord.pushes += 1;
      else if (result === 'pending') lockRecord.pending += 1;
      lockRecord.total += 1;
    }

    const weekKey = `${rowSeason}_${rowWeek}`;
    if (!trendMap.has(weekKey)) {
      trendMap.set(weekKey, { season: rowSeason, week: rowWeek, wins: 0, losses: 0 });
    }
    const trendEntry = trendMap.get(weekKey);
    if (result === 'win') trendEntry.wins += 1;
    else if (result === 'loss') trendEntry.losses += 1;

    if (['win', 'loss', 'push'].includes(result)) {
      recentResults.push(result);
    }
    if (selection_total != null && ['win', 'loss', 'push'].includes(result)) {
      recentTotalResults.push(result);
    }
  }

  const trend = Array.from(trendMap.values()).sort((a, b) => {
    if (Number(a.season) !== Number(b.season)) return Number(a.season) - Number(b.season);
    return a.week - b.week;
  }).slice(-10);

  const pickTop = (map) => {
    let top = null;
    let maxCount = -1;
    for (const [key, count] of map.entries()) {
      if (count > maxCount) {
        bestConv = key;
        maxCount = count;
      }
    }
    if (!top) return null;
    return { school: top, logo: teamMeta.logos.get(top) || null, count: maxCount, conference: teamMeta.conferences.get(top) || null };
  };

  const pickBestConf = (map) => {
    const entries = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    return entries.length ? { conference: entries[0][0], count: entries[0][1] } : null;
  };

  const computeConfPct = () => {
    const confStats = new Map();

    for (const row of rows) {
      if (row.result !== 'win' && row.result !== 'loss') continue;
      const conference = row.team_conference;
      if (!conference) continue;
      const stats = confStats.get(conference) || { wins: 0, losses: 0 };
      if (row.result === 'win') stats.wins += 1;
      else stats.losses += 1;
      confStats.set(conference, stats);
    }

    let best = null;
    let bestPct = -1;
    let worst = null;
    let worstPct = 101;

    for (const [conference, stats] of confStats.entries()) {
      const total = stats.wins + stats.losses;
      if (total < 5) continue;
      const win_pct = Number(((stats.wins / total) * 100).toFixed(2));
      if (win_pct > bestPct) {
        bestPct = win_pct;
        best = { conference, wins: stats.wins, losses: stats.losses, win_pct };
      }
      if (win_pct < worstPct) {
        worstPct = win_pct;
        worst = { conference, wins: stats.wins, losses: stats.losses, win_pct };
      }
    }
    return { best, worst };
  };

  const { best: bestConfByPct, worst: worstConfByPct } = computeConfPct();

  const currentStreaks = (results) => {
    let currentWin = 0;
    let currentLoss = 0;
    let winActive = true;
    let lossActive = true;

    for (let i = results.length - 1; i >= 0; i--) {
      const result = results[i];
      if (winActive) {
        if (result === 'win') currentWin += 1;
        else if (result === 'loss') winActive = false;
      }
      if (lossActive) {
        if (result === 'loss') currentLoss += 1;
        else if (result === 'win') lossActive = false;
      }
      if (!winActive && !lossActive) break;
    }

    return { currentWin, currentLoss };
  };

  const bestWorstStreaks = (results) => {
    let longestWin = 0;
    let longestLoss = 0;
    let tempWin = 0;
    let tempLoss = 0;

    for (const result of results) {
      if (result === 'win') {
        tempWin += 1;
        tempLoss = 0;
        longestWin = Math.max(longestWin, tempWin);
      } else if (result === 'loss') {
        tempLoss += 1;
        tempWin = 0;
        longestLoss = Math.max(longestLoss, tempLoss);
      } else {
        tempWin = 0;
        tempLoss = 0;
      }
    }

    return { longestWin, longestLoss };
  };

  const { currentWinStreak, currentLossStreak } = currentStreaks(recentResults);
  const { longestWinStreak, longestLossStreak } = bestWorstStreaks(recentResults);
  const { currentWinStreak: currentTotalWinStreak, currentLossStreak: currentTotalLossStreak } = currentStreaks(recentTotalResults);
  const { longestWinStreak: longestTotalWinStreak, longestLossStreak: longestTotalLossStreak } = bestWorstStreaks(recentTotalResults);

  return {
    favConf: pickBestConf(countsByConf.fav),
    bestConf: pickBestConf(countsByConf.win),
    worstConf: pickBestConf(countsByConf.loss),
    bestConfByPct,
    worstConfByPct,
    topWinSchool: pickTop(teamCounts.wins),
    topLossSchool: pickTop(teamCounts.losses),
    record,
    lockRecord,
    trend,
    mostBetsFor: pickTop(teamCounts.betsFor),
    mostBetsAgainst: pickTop(teamCounts.betsAgainst),
    currentWinStreak,
    currentLossStreak,
    longestWinStreak,
    longestLossStreak,
    currentTotalWinStreak,
    currentTotalLossStreak,
    longestTotalWinStreak,
    longestTotalLossStreak,
    last10Form: recentResults.slice(-10).map((r) => (r === 'win' ? 'W' : r === 'loss' ? 'L' : 'P')).join('-'),
  };
}
'''

path.write_text(text[:start] + new_block + text[end:], encoding='utf-8')
print('Replaced getPlayerStats successfully')
