const DEFAULT_SEASON = '2026';

function buildSeasonWeeks() {
  const weekRanges = [
    { week: 1, starts_on: '08-24T00:00:00Z', ends_on: '08-30T23:59:59Z' },
    { week: 2, starts_on: '08-31T00:00:00Z', ends_on: '09-06T23:59:59Z' },
    { week: 3, starts_on: '09-07T00:00:00Z', ends_on: '09-13T23:59:59Z' },
    { week: 4, starts_on: '09-14T00:00:00Z', ends_on: '09-20T23:59:59Z' },
    { week: 5, starts_on: '09-21T00:00:00Z', ends_on: '09-27T23:59:59Z' },
    { week: 6, starts_on: '09-28T00:00:00Z', ends_on: '10-04T23:59:59Z' },
    { week: 7, starts_on: '10-05T00:00:00Z', ends_on: '10-11T23:59:59Z' },
    { week: 8, starts_on: '10-12T00:00:00Z', ends_on: '10-18T23:59:59Z' },
    { week: 9, starts_on: '10-19T00:00:00Z', ends_on: '10-25T23:59:59Z' },
    { week: 10, starts_on: '10-26T00:00:00Z', ends_on: '11-01T23:59:59Z' },
    { week: 11, starts_on: '11-02T00:00:00Z', ends_on: '11-08T23:59:59Z' },
    { week: 12, starts_on: '11-09T00:00:00Z', ends_on: '11-15T23:59:59Z' },
    { week: 13, starts_on: '11-16T00:00:00Z', ends_on: '11-22T23:59:59Z' },
    { week: 14, starts_on: '11-23T00:00:00Z', ends_on: '11-29T23:59:59Z' },
    { week: 15, starts_on: '11-30T00:00:00Z', ends_on: '12-06T23:59:59Z' },
    { week: 16, starts_on: '12-07T00:00:00Z', ends_on: '12-13T23:59:59Z' },
    { week: 17, starts_on: '12-14T00:00:00Z', ends_on: '12-20T23:59:59Z' }
  ];
  const seasons = ['2022', '2023', '2024', '2025', '2026'];
  return seasons.flatMap((season) =>
    weekRanges.map((item) => ({
      week: item.week,
      season,
      label: `${season} Week ${item.week}`,
      starts_on: `${season}-${item.starts_on}`,
      ends_on: `${season}-${item.ends_on}`
    }))
  );
}

function getWeekNumberFromDate(dateIso) {
  if (!dateIso) {
    return null;
  }
  const date = new Date(dateIso);
  if (Number.isNaN(date.valueOf())) {
    return null;
  }
  const weeks = buildSeasonWeeks();
  for (const item of weeks) {
    const start = new Date(item.starts_on);
    const end = new Date(item.ends_on);
    if (date >= start && date <= end) {
      return item.week;
    }
  }
  return null;
}

function getSeasonFromDate(dateIso) {
  if (!dateIso) {
    return DEFAULT_SEASON;
  }
  const date = new Date(dateIso);
  if (Number.isNaN(date.valueOf())) {
    return DEFAULT_SEASON;
  }
  const season = date.getUTCFullYear().toString();
  const validSeasons = new Set(buildSeasonWeeks().map((item) => item.season));
  return validSeasons.has(season) ? season : DEFAULT_SEASON;
}

function determinePickResult(game, pick) {
  if (!pick || !pick.selection_team) {
    return null;
  }
  if (!game || game.score_home === null || game.score_away === null || !game.completed) {
    return 'pending';
  }

  const homeScore = Number(game.score_home);
  const awayScore = Number(game.score_away);
  const spread = Number(game.spread_home ?? 0);
  const adjustedHome = homeScore + spread;

  let winner = 'push';
  if (adjustedHome > awayScore) winner = 'home';
  else if (adjustedHome < awayScore) winner = 'away';

  if (winner === 'push') {
    return 'push';
  }

  const selectedSide = pick.selection_team === game.home_team ? 'home' : pick.selection_team === game.away_team ? 'away' : null;
  if (!selectedSide) {
    return null;
  }

  return selectedSide === winner ? 'win' : 'loss';
}

function determineTotalResult(game, pick) {
  if (!pick || !pick.selection_total) {
    return null;
  }
  if (!game.completed || game.score_home === null || game.score_away === null) {
    return 'pending';
  }

  const totalScore = Number(game.score_home) + Number(game.score_away);
  const line = Number(pick.total_line ?? game.over_under ?? 0);

  if (totalScore > line) return pick.selection_total === 'over' ? 'win' : 'loss';
  if (totalScore < line) return pick.selection_total === 'under' ? 'win' : 'loss';
  return 'push';
}

function determineFavorableLine(game, pick) {
  if (!game || !game.commence_time) return null;
  const isStarted = new Date(game.commence_time) <= new Date();
  if (!isStarted) return null;

  // 1. Spread Pick
  if (pick.selection_team) {
    if (pick.spread === null || pick.spread === undefined) return null;
    const isHome = pick.selection_team === game.home_team;
    const closingSpread = isHome ? game.spread_home : game.spread_away;
    if (closingSpread === null || closingSpread === undefined) return null;

    const userSpread = Number(pick.spread);
    const finalSpread = Number(closingSpread);

    if (userSpread === finalSpread) return null; // No movement / got at closing line
    // Having more points / a larger number is better for spread:
    // e.g. Got -7.5 vs -8.5 closing (-7.5 > -8.5) => true
    // e.g. Got +8 vs +9 closing (+8 < +9) => false (could have had +9)
    // e.g. Got -7 vs -6 closing (-7 < -6) => false
    // e.g. Got +9.5 vs +8.5 closing (+9.5 > +8.5) => true
    return userSpread > finalSpread;
  }

  // 2. Total Pick
  if (pick.selection_total) {
    if (pick.total_line === null || pick.total_line === undefined) return null;
    const closingOU = game.over_under;
    if (closingOU === null || closingOU === undefined) return null;

    const userTotal = Number(pick.total_line);
    const finalTotal = Number(closingOU);

    if (userTotal === finalTotal) return null; // No movement / got at closing line

    if (pick.selection_total === 'over') {
      // For OVER: A lower total is better
      // e.g. Got over 50 vs 49 closing => got 50 when could have had 49 => false (50 > 49 => false)
      // e.g. Got over 48 vs 50 closing => got 48 when moved to 50 => true (48 < 50 => true)
      return userTotal < finalTotal;
    }

    if (pick.selection_total === 'under') {
      // For UNDER: A higher total is better
      // e.g. Got under 35 vs 34 closing => got 35 when moved to 34 => true (35 > 34 => true)
      // e.g. Got under 34 vs 35 closing => got 34 when moved to 35 => false (34 < 35 => false)
      return userTotal > finalTotal;
    }
  }

  return null;
}

module.exports = {
  buildSeasonWeeks,
  getWeekNumberFromDate,
  getSeasonFromDate,
  determinePickResult,
  determineTotalResult,
  determineFavorableLine
};
