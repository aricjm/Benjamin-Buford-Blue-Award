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
  const seasons = ['2025', '2026'];
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
  if (!game || game.score_home === null || game.score_away === null || !game.completed) {
    return 'pending';
  }
  if (!pick || !pick.selection_team) {
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
    return 'pending';
  }

  return selectedSide === winner ? 'win' : 'loss';
}

module.exports = {
  buildSeasonWeeks,
  getWeekNumberFromDate,
  getSeasonFromDate,
  determinePickResult
};
