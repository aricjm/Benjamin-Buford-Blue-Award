import React, { useState, useEffect } from 'react';
import { Trophy, ChevronDown, ChevronRight } from 'lucide-react';

const winPct = (w, t) => { const wins = Number(w); const total = Number(t); return total > 0 ? ((wins / total) * 100).toFixed(2) + '%' : 'N/A'; };

const sortLeaderboard = (data) => {
  return [...data].sort((a, b) => {
    const aWins = Number(a.wins);
    const bWins = Number(b.wins);
    const aTotal = Number(a.total);
    const bTotal = Number(b.total);
    
    const aPct = aTotal > 0 ? aWins / aTotal : 0;
    const bPct = bTotal > 0 ? bWins / bTotal : 0;
    
    if (bPct !== aPct) {
      return bPct - aPct;
    }
    if (bWins !== aWins) {
      return bWins - aWins;
    }
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

  // Fetch week summary when weekWeek or weekSeason changes
  useEffect(() => {
    if (weekWeek === null || !weekSeason) return;
    if (weekWeek === selectedWeek && weekSeason === selectedSeason) {
      setWeekData(summary || []);
      return;
    }
    let active = true;
    const fetchWeekSummary = async () => {
      setLoadingWeek(true);
      try {
        const res = await fetch(`/api/week/${weekWeek}/summary?season=${weekSeason}`);
        const data = await res.json();
        if (active) {
          setWeekData(data);
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

  // Fetch season summary when seasonSeason changes
  useEffect(() => {
    if (!seasonSeason) return;
    if (seasonSeason === selectedSeason) {
      setSeasonData(seasonSummary || []);
      return;
    }
    let active = true;
    const fetchSeasonSummary = async () => {
      setLoadingSeason(true);
      try {
        const res = await fetch(`/api/season/${seasonSeason}/summary`);
        const data = await res.json();
        if (active) {
          setSeasonData(data);
        }
      } catch (err) {
        console.error('Failed to fetch season summary', err);
      } finally {
        if (active) setLoadingSeason(false);
      }
    };
    fetchSeasonSummary();
    return () => { active = false; };
  }, [seasonSeason, selectedSeason, seasonSummary]);

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
            {allTimeSummary.length === 0 ? (
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
                      {allTimeSummary.some(r => Number(r.pending) > 0) && <th>Pending</th>}
                      <th>Total</th>
                      <th>Lock Record</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortLeaderboard(allTimeSummary).map((row, index) => (
                      <tr key={row.player}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            {getRankIcon(index)}
                            <span>{row.player}</span>
                          </div>
                        </td>
                        <td>{row.wins}</td>
                        <td>{winPct(row.wins, row.total)}</td>
                        <td>{row.losses}</td>
                        <td>{row.pushes}</td>
                        {allTimeSummary.some(r => Number(r.pending) > 0) && <td>{row.pending}</td>}
                        <td>{row.total}</td>
                        <td style={{ fontWeight: 'bold', color: '#f1c40f' }}>
                          {row.lockWins ?? 0}-{row.lockLosses ?? 0}-{row.lockPushes ?? 0} ({winPct(row.lockWins ?? 0, row.lockTotal ?? 0)})
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
                        <td>{winPct(row.wins, row.total)}</td>
                        <td>{row.losses}</td>
                        <td>{row.pushes}</td>
                        {seasonData.some(r => Number(r.pending) > 0) && <td>{row.pending}</td>}
                        <td>{row.total}</td>
                        <td style={{ fontWeight: 'bold', color: '#f1c40f' }}>
                          {row.lockWins ?? 0}-{row.lockLosses ?? 0}-{row.lockPushes ?? 0} ({winPct(row.lockWins ?? 0, row.lockTotal ?? 0)})
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
                        <td>{winPct(row.wins, row.total)}</td>
                        <td>{row.losses}</td>
                        <td>{row.pushes}</td>
                        {weekData.some(r => Number(r.pending) > 0) && <td>{row.pending}</td>}
                        <td>{row.total}</td>
                        <td style={{ fontWeight: 'bold', color: '#f1c40f' }}>
                          {row.lockWins ?? 0}-{row.lockLosses ?? 0}-{row.lockPushes ?? 0} ({winPct(row.lockWins ?? 0, row.lockTotal ?? 0)})
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
