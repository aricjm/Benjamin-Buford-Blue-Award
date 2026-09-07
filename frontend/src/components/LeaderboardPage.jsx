import React, { useState, useEffect } from 'react';
import { Trophy, ChevronDown, ChevronRight } from 'lucide-react';

const winPct = (w, l) => {
  const wins = Number(w);
  const losses = Number(l);
  const decided = wins + losses;
  return decided > 0 ? ((wins / decided) * 100).toFixed(2) + '%' : 'N/A';
};

// Compute pick results dynamically using real-time/cached final scores
const resolvePickResult = (pick, game) => {
  if (!game) return pick.result || 'pending';
  
  // Game scores (either recorded or real-time)
  const homeScore = game.score_home != null ? Number(game.score_home) : null;
  const awayScore = game.score_away != null ? Number(game.score_away) : null;
  const isCompleted = !!game.completed;

  if (homeScore === null || awayScore === null || !isCompleted) {
    return pick.result || 'pending';
  }

  // 1. Spread pick
  if (pick.selection_team) {
    const isHome = pick.selection_team === game.home_team;
    const spread = pick.spread != null ? Number(pick.spread) : (isHome ? Number(game.spread_home ?? 0) : Number(game.spread_away ?? 0));
    const userScore = isHome ? (homeScore + spread) : (awayScore + spread);
    const oppScore = isHome ? awayScore : homeScore;

    if (userScore > oppScore) return 'win';
    if (userScore < oppScore) return 'loss';
    return 'push';
  }

  // 2. Over/Under pick
  if (pick.selection_total) {
    const line = Number(pick.total_line ?? game.over_under ?? 0);
    const totalScore = homeScore + awayScore;

    if (totalScore > line) return pick.selection_total === 'over' ? 'win' : 'loss';
    if (totalScore < line) return pick.selection_total === 'under' ? 'win' : 'loss';
    return 'push';
  }

  return pick.result || 'pending';
};

// Rebuild summary table from picks + games without needing DB writes
const computeSummaryFromPicks = (picks, games, basePlayers = []) => {
  const gameMap = new Map((games || []).map(g => [g.id, g]));
  const summary = {};

  (basePlayers || []).forEach(p => {
    const name = p.name || p.player || p;
    if (name) {
      summary[name] = {
        player: name,
        wins: 0, losses: 0, pushes: 0, pending: 0, total: 0,
        lockWins: 0, lockLosses: 0, lockPushes: 0, lockPending: 0, lockTotal: 0
      };
    }
  });

  (picks || []).forEach(p => {
    if (!summary[p.player]) {
      summary[p.player] = {
        player: p.player,
        wins: 0, losses: 0, pushes: 0, pending: 0, total: 0,
        lockWins: 0, lockLosses: 0, lockPushes: 0, lockPending: 0, lockTotal: 0
      };
    }

    const cur = summary[p.player];
    const game = gameMap.get(p.game_id);
    const res = resolvePickResult(p, game);
    const isLock = p.is_lock === 1 || p.is_lock === true;

    cur.total += 1;
    if (res === 'win') cur.wins += 1;
    else if (res === 'loss') cur.losses += 1;
    else if (res === 'push') cur.pushes += 1;
    else cur.pending += 1;

    if (isLock) {
      cur.lockTotal += 1;
      if (res === 'win') cur.lockWins += 1;
      else if (res === 'loss') cur.lockLosses += 1;
      else if (res === 'push') cur.lockPushes += 1;
      else cur.lockPending += 1;
    }
  });

  return Object.values(summary);
};

const sortLeaderboard = (data) => {
  return [...data].sort((a, b) => {
    const aWins = Number(a.wins);
    const bWins = Number(b.wins);
    const aLosses = Number(a.losses);
    const bLosses = Number(b.losses);
    const aDecided = aWins + aLosses;
    const bDecided = bWins + bLosses;
    
    const aPct = aDecided > 0 ? aWins / aDecided : 0;
    const bPct = bDecided > 0 ? bWins / bDecided : 0;
    
    if (bPct !== aPct) {
      return bPct - aPct;
    }
    if (bWins !== aWins) {
      return bWins - aWins;
    }
    const aTotal = Number(a.total);
    const bTotal = Number(b.total);
    return bTotal - aTotal;
  });
};

const getRankIcon = (index) => {
  if (index === 0) return <Trophy size={16} color="#FFD700" style={{ marginRight: '6px', flexShrink: 0 }} />;
  if (index === 1) return <Trophy size={16} color="#C0C0C0" style={{ marginRight: '6px', flexShrink: 0 }} />;
  if (index === 2) return <Trophy size={16} color="#CD7F32" style={{ marginRight: '6px', flexShrink: 0 }} />;
  return null;
};

const LeaderboardPage = ({ 
  summary, 
  seasonSummary, 
  allTimeSummary, 
  selectedWeek, 
  selectedSeason,
  seasons = [],
  weeks = []
}) => {
  // Accordion states (all closed on page load)
  const [allTimeOpen, setAllTimeOpen] = useState(false);
  const [seasonOpen, setSeasonOpen] = useState(false);
  const [weekOpen, setWeekOpen] = useState(false);

  // Local state for Week Leaderboard
  const [weekSeason, setWeekSeason] = useState(selectedSeason);
  const [weekWeek, setWeekWeek] = useState(selectedWeek);
  const [weekWeeksList, setWeekWeeksList] = useState(weeks || []);
  const [weekData, setWeekData] = useState(summary || []);
  const [loadingWeek, setLoadingWeek] = useState(false);

  // Local state for Season Leaderboard
  const [seasonSeason, setSeasonSeason] = useState(selectedSeason);
  const [seasonData, setSeasonData] = useState(seasonSummary || []);
  const [loadingSeason, setLoadingSeason] = useState(false);

  // Local state for All-Time Leaderboard
  const [allTimeData, setAllTimeData] = useState(allTimeSummary || []);
  const [loadingAllTime, setLoadingAllTime] = useState(false);

  // Sync with props when they change
  useEffect(() => {
    setWeekSeason(selectedSeason);
    setSeasonSeason(selectedSeason);
  }, [selectedSeason]);

  useEffect(() => {
    setWeekWeek(selectedWeek);
  }, [selectedWeek]);

  useEffect(() => {
    setWeekWeeksList(weeks || []);
  }, [weeks]);

  useEffect(() => {
    setWeekData(summary || []);
  }, [summary]);

  useEffect(() => {
    setSeasonData(seasonSummary || []);
  }, [seasonSummary]);

  useEffect(() => {
    setAllTimeData(allTimeSummary || []);
  }, [allTimeSummary]);

  // Fetch weeks when weekSeason changes
  useEffect(() => {
    if (!weekSeason) return;
    if (weekSeason === selectedSeason) {
      setWeekWeeksList(weeks || []);
      return;
    }
    let active = true;
    const fetchWeeks = async () => {
      try {
        const res = await fetch(`/api/weeks?season=${weekSeason}`);
        const data = await res.json();
        if (active) {
          setWeekWeeksList(data);
          if (data.length > 0) {
            const hasSameWeek = data.some(w => w.week === weekWeek);
            if (!hasSameWeek) {
              setWeekWeek(data[0].week);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch weeks', err);
      }
    };
    fetchWeeks();
    return () => { active = false; };
  }, [weekSeason, selectedSeason, weeks]);

  // Fetch week summary and live/cached week games + picks when weekWeek or weekSeason changes
  useEffect(() => {
    if (weekWeek === null || !weekSeason) return;
    let active = true;
    const fetchWeekSummary = async () => {
      setLoadingWeek(true);
      try {
        // Fetch week summary, week games, and week picks in parallel
        const [sumRes, gamesRes, picksRes] = await Promise.all([
          fetch(`/api/week/${weekWeek}/summary?season=${weekSeason}`),
          fetch(`/api/week/${weekWeek}/games?season=${weekSeason}`),
          fetch(`/api/week/${weekWeek}/picks?season=${weekSeason}`)
        ]);

        const [sumData, gamesData, picksData] = await Promise.all([
          sumRes.ok ? sumRes.json() : [],
          gamesRes.ok ? gamesRes.json() : { games: [] },
          picksRes.ok ? picksRes.json() : []
        ]);

        if (!active) return;

        const gamesList = gamesData.games || (Array.isArray(gamesData) ? gamesData : []);
        const rawPicks = Array.isArray(picksData) ? picksData : [];

        // Fetch real-time ESPN scoreboard to catch newly finished games without waiting for DB sync
        let scoreboardEvents = [];
        try {
          const espnRes = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?groups=80&limit=300');
          if (espnRes.ok) {
            const espnJson = await espnRes.json();
            scoreboardEvents = espnJson.events || [];
          }
        } catch (e) {
          // fallback to cached game scores
        }

        // Merge scoreboard events into gamesList
        const liveMap = new Map();
        scoreboardEvents.forEach(ev => {
          const comp = ev.competitions?.[0] || {};
          const home = comp.competitors?.find(c => c.homeAway === 'home');
          const away = comp.competitors?.find(c => c.homeAway === 'away');
          const isFinal = !!ev.status?.type?.completed || ev.status?.type?.state === 'post' || ev.status?.type?.description === 'Final';
          liveMap.set(String(ev.id), {
            score_home: home?.score != null ? parseInt(home.score) : null,
            score_away: away?.score != null ? parseInt(away.score) : null,
            completed: isFinal
          });
        });

        const mergedGames = gamesList.map(g => {
          const live = liveMap.get(String(g.api_game_id));
          if (live) {
            return {
              ...g,
              score_home: live.score_home != null ? live.score_home : g.score_home,
              score_away: live.score_away != null ? live.score_away : g.score_away,
              completed: live.completed || g.completed
            };
          }
          return g;
        });

        if (rawPicks.length > 0) {
          // Recompute locally using freshly merged/cached game scores
          const computed = computeSummaryFromPicks(rawPicks, mergedGames, sumData);
          setWeekData(computed);
        } else {
          setWeekData(sumData || []);
        }
      } catch (err) {
        console.error('Failed to fetch week summary', err);
      } finally {
        if (active) setLoadingWeek(false);
      }
    };
    fetchWeekSummary();
    return () => { active = false; };
  }, [weekWeek, weekSeason, selectedWeek, selectedSeason, summary]);

  // Fetch and resolve Season & All-Time summaries with live/cached final game scores
  useEffect(() => {
    let active = true;
    const fetchSeasonAndAllTime = async () => {
      setLoadingSeason(true);
      setLoadingAllTime(true);
      try {
        // Fetch season summary, all-time summary, current week games & picks
        const [seasonSumRes, allTimeRes, weekGamesRes, weekPicksRes] = await Promise.all([
          fetch(`/api/season/${seasonSeason}/summary`),
          fetch('/api/summary/alltime'),
          fetch(`/api/week/${selectedWeek || 1}/games?season=${seasonSeason}`),
          fetch(`/api/week/${selectedWeek || 1}/picks?season=${seasonSeason}`)
        ]);

        const [seasonSumData, allTimeDataRes, weekGamesData, weekPicksData] = await Promise.all([
          seasonSumRes.ok ? seasonSumRes.json() : [],
          allTimeRes.ok ? allTimeRes.json() : [],
          weekGamesRes.ok ? weekGamesRes.json() : { games: [] },
          weekPicksRes.ok ? weekPicksRes.json() : []
        ]);

        if (!active) return;

        const gamesList = weekGamesData.games || (Array.isArray(weekGamesData) ? weekGamesData : []);
        const rawPicks = Array.isArray(weekPicksData) ? weekPicksData : [];

        // Check real-time scoreboard for newly finalized games
        let scoreboardEvents = [];
        try {
          const espnRes = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?groups=80&limit=300');
          if (espnRes.ok) {
            const espnJson = await espnRes.json();
            scoreboardEvents = espnJson.events || [];
          }
        } catch (e) {
          // ignore network error
        }

        const liveMap = new Map();
        scoreboardEvents.forEach(ev => {
          const comp = ev.competitions?.[0] || {};
          const home = comp.competitors?.find(c => c.homeAway === 'home');
          const away = comp.competitors?.find(c => c.homeAway === 'away');
          const isFinal = !!ev.status?.type?.completed || ev.status?.type?.state === 'post' || ev.status?.type?.description === 'Final';
          liveMap.set(String(ev.id), {
            score_home: home?.score != null ? parseInt(home.score) : null,
            score_away: away?.score != null ? parseInt(away.score) : null,
            completed: isFinal
          });
        });

        const mergedGames = gamesList.map(g => {
          const live = liveMap.get(String(g.api_game_id));
          if (live) {
            return {
              ...g,
              score_home: live.score_home != null ? live.score_home : g.score_home,
              score_away: live.score_away != null ? live.score_away : g.score_away,
              completed: live.completed || g.completed
            };
          }
          return g;
        });

        // Find games that became completed in live scoreboard but were not recorded as completed in DB picks
        const newlyCompletedDeltas = {};
        const gameMap = new Map(mergedGames.map(g => [g.id, g]));

        rawPicks.forEach(p => {
          const game = gameMap.get(p.game_id);
          // If the pick is currently pending in DB or has no resolved outcome, but the game is completed
          if (p && (!p.result || p.result === 'pending') && game && game.completed) {
            const res = resolvePickResult(p, game);
            if (res === 'win' || res === 'loss' || res === 'push') {
              if (!newlyCompletedDeltas[p.player]) {
                newlyCompletedDeltas[p.player] = { wins: 0, losses: 0, pushes: 0, lockWins: 0, lockLosses: 0, lockPushes: 0, pendingDecided: 0, lockPendingDecided: 0 };
              }
              const d = newlyCompletedDeltas[p.player];
              const isLock = p.is_lock === 1 || p.is_lock === true;

              d.pendingDecided += 1;
              if (res === 'win') d.wins += 1;
              else if (res === 'loss') d.losses += 1;
              else if (res === 'push') d.pushes += 1;

              if (isLock) {
                d.lockPendingDecided += 1;
                if (res === 'win') d.lockWins += 1;
                else if (res === 'loss') d.lockLosses += 1;
                else if (res === 'push') d.lockPushes += 1;
              }
            }
          }
        });

        const applyDeltas = (baseSummaryList) => {
          return (baseSummaryList || []).map(row => {
            const d = newlyCompletedDeltas[row.player];
            if (!d) return row;
            return {
              ...row,
              wins: Number(row.wins || 0) + d.wins,
              losses: Number(row.losses || 0) + d.losses,
              pushes: Number(row.pushes || 0) + d.pushes,
              pending: Math.max(0, Number(row.pending || 0) - d.pendingDecided),
              lockWins: Number(row.lockWins || 0) + d.lockWins,
              lockLosses: Number(row.lockLosses || 0) + d.lockLosses,
              lockPushes: Number(row.lockPushes || 0) + d.lockPushes,
              lockPending: Math.max(0, Number(row.lockPending || 0) - d.lockPendingDecided)
            };
          });
        };

        setSeasonData(applyDeltas(seasonSumData));
        setAllTimeData(applyDeltas(allTimeDataRes));
      } catch (err) {
        console.error('Failed to fetch season or all-time summary', err);
      } finally {
        if (active) {
          setLoadingSeason(false);
          setLoadingAllTime(false);
        }
      }
    };
    fetchSeasonAndAllTime();
    return () => { active = false; };
  }, [seasonSeason, selectedSeason, selectedWeek]);

  return (
    <>
      {/* 1. All-Time Leaderboard (Top) */}
      <section className="panel summary-panel" style={{ padding: '16px' }}>
        <div 
          onClick={() => setAllTimeOpen(!allTimeOpen)}
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.4rem' }}>All-Time Leaderboard</h2>
          {allTimeOpen ? <ChevronDown size={20} color="#888" /> : <ChevronRight size={20} color="#888" />}
        </div>

        {allTimeOpen && (
          <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
            {loadingAllTime ? (
              <p style={{ color: '#888' }}>Loading all-time leaderboard...</p>
            ) : allTimeData.length === 0 ? (
              <p>No picks recorded yet.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Player</th>
                      <th>Wins</th>
                      <th>Win %</th>
                      <th>Losses</th>
                      <th>Pushes</th>
                      {allTimeData.some(r => Number(r.pending) > 0) && <th>Pending</th>}
                      <th>Total</th>
                      <th>Lock Record</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortLeaderboard(allTimeData).map((row, index) => (
                      <tr key={row.player}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            {getRankIcon(index)}
                            <span>{row.player}</span>
                          </div>
                        </td>
                        <td>{row.wins}</td>
                        <td>{winPct(row.wins, row.losses)}</td>
                        <td>{row.losses}</td>
                        <td>{row.pushes}</td>
                        {allTimeData.some(r => Number(r.pending) > 0) && <td>{row.pending}</td>}
                        <td>{row.total}</td>
                        <td style={{ fontWeight: 'bold', color: '#f1c40f' }}>
                          {row.lockWins ?? 0}-{row.lockLosses ?? 0}-{row.lockPushes ?? 0} ({winPct(row.lockWins ?? 0, row.lockLosses ?? 0)})
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 2. Season Leaderboard (Middle) */}
      <section className="panel summary-panel" style={{ padding: '16px' }}>
        <div 
          onClick={() => setSeasonOpen(!seasonOpen)}
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.4rem' }}>{seasonSeason} Season Leaderboard</h2>
          {seasonOpen ? <ChevronDown size={20} color="#888" /> : <ChevronRight size={20} color="#888" />}
        </div>

        {seasonOpen && (
          <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.9rem', color: '#888' }}>Select Season:</span>
              <select 
                value={seasonSeason} 
                onChange={(e) => setSeasonSeason(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#1e1e2e', color: '#fff', fontSize: '14px' }}
              >
                {seasons.map(s => (
                  <option key={s} value={s} style={{ backgroundColor: '#1e1e2e', color: '#fff' }}>{s}</option>
                ))}
              </select>
            </div>

            {loadingSeason ? (
              <p style={{ color: '#888' }}>Loading season leaderboard...</p>
            ) : seasonData.length === 0 ? (
              <p>No picks for this season yet.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Player</th>
                      <th>Wins</th>
                      <th>Win %</th>
                      <th>Losses</th>
                      <th>Pushes</th>
                      {seasonData.some(r => Number(r.pending) > 0) && <th>Pending</th>}
                      <th>Total</th>
                      <th>Lock Record</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortLeaderboard(seasonData).map((row, index) => (
                      <tr key={row.player}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            {getRankIcon(index)}
                            <span>{row.player}</span>
                          </div>
                        </td>
                        <td>{row.wins}</td>
                        <td>{winPct(row.wins, row.losses)}</td>
                        <td>{row.losses}</td>
                        <td>{row.pushes}</td>
                        {seasonData.some(r => Number(r.pending) > 0) && <td>{row.pending}</td>}
                        <td>{row.total}</td>
                        <td style={{ fontWeight: 'bold', color: '#f1c40f' }}>
                          {row.lockWins ?? 0}-{row.lockLosses ?? 0}-{row.lockPushes ?? 0} ({winPct(row.lockWins ?? 0, row.lockLosses ?? 0)})
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 3. Week Leaderboard (Bottom) */}
      <section className="panel summary-panel" style={{ padding: '16px' }}>
        <div 
          onClick={() => setWeekOpen(!weekOpen)}
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Week {weekWeek} Leaderboard</h2>
          {weekOpen ? <ChevronDown size={20} color="#888" /> : <ChevronRight size={20} color="#888" />}
        </div>

        {weekOpen && (
          <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.9rem', color: '#888' }}>Select Season & Week:</span>
              <select 
                value={weekSeason} 
                onChange={(e) => setWeekSeason(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#1e1e2e', color: '#fff', fontSize: '14px' }}
              >
                {seasons.map(s => (
                  <option key={s} value={s} style={{ backgroundColor: '#1e1e2e', color: '#fff' }}>{s}</option>
                ))}
              </select>
              <select 
                value={weekWeek !== null ? weekWeek : ''} 
                onChange={(e) => setWeekWeek(Number(e.target.value))}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#1e1e2e', color: '#fff', fontSize: '14px' }}
              >
                {weekWeeksList.map(w => (
                  <option key={w.week} value={w.week} style={{ backgroundColor: '#1e1e2e', color: '#fff' }}>Week {w.week}</option>
                ))}
              </select>
            </div>

            {loadingWeek ? (
              <p style={{ color: '#888' }}>Loading week leaderboard...</p>
            ) : weekData.length === 0 ? (
              <p>No picks yet for this week.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Player</th>
                      <th>Wins</th>
                      <th>Win %</th>
                      <th>Losses</th>
                      <th>Pushes</th>
                      {weekData.some(r => Number(r.pending) > 0) && <th>Pending</th>}
                      <th>Total</th>
                      <th>Lock Record</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortLeaderboard(weekData).map((row, index) => (
                      <tr key={row.player}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            {getRankIcon(index)}
                            <span>{row.player}</span>
                          </div>
                        </td>
                        <td>{row.wins}</td>
                        <td>{winPct(row.wins, row.losses)}</td>
                        <td>{row.losses}</td>
                        <td>{row.pushes}</td>
                        {weekData.some(r => Number(r.pending) > 0) && <td>{row.pending}</td>}
                        <td>{row.total}</td>
                        <td style={{ fontWeight: 'bold', color: '#f1c40f' }}>
                          {row.lockWins ?? 0}-{row.lockLosses ?? 0}-{row.lockPushes ?? 0} ({winPct(row.lockWins ?? 0, row.lockLosses ?? 0)})
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>
    </>
  );
};

export default LeaderboardPage;
