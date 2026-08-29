import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Activity, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Calendar,
  Clock
} from 'lucide-react';
import useIsMobile from '../hooks/useIsMobile';
import LoadingAnimation from './LoadingAnimation';

const formatSpread = (spread) => {
  if (spread === null || spread === undefined) return '-';
  const num = Number(spread);
  if (isNaN(num)) return '-';
  if (num === 0) return 'PK';
  return num > 0 ? `+${num}` : `${num}`;
};

const formatTotal = (total) => {
  if (total === null || total === undefined) return '-';
  return `${total}`;
};

const OddsHistoryPage = ({
  seasons = [],
  weeks = [],
  selectedSeason,
  selectedWeek,
  setSelectedSeason,
  setSelectedWeek
}) => {
  const isMobile = useIsMobile();
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMovementOnly, setFilterMovementOnly] = useState(false);
  const [expandedGameIds, setExpandedGameIds] = useState(new Set());

  // Fetch odds history for the selected week and season
  useEffect(() => {
    if (selectedWeek === null || !selectedSeason) return;

    let isMounted = true;
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/week/${selectedWeek}/odds-history?season=${selectedSeason}`);
        if (!res.ok) {
          throw new Error('Failed to fetch odds history');
        }
        const data = await res.json();
        if (isMounted) {
          setHistoryData(data.history || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, [selectedWeek, selectedSeason]);

  // Group raw history entries by game
  const gamesMap = useMemo(() => {
    const map = new Map();

    historyData.forEach((row) => {
      if (!map.has(row.game_id)) {
        map.set(row.game_id, {
          game_id: row.game_id,
          api_game_id: row.api_game_id,
          home_team: row.home_team,
          away_team: row.away_team,
          home_logo: row.home_logo,
          away_logo: row.away_logo,
          home_color: row.home_color,
          away_color: row.away_color,
          commence_time: row.commence_time,
          history: []
        });
      }

      map.get(row.game_id).history.push({
        id: row.id,
        spread_home: row.spread_home,
        spread_away: row.spread_away,
        over_under: row.over_under,
        home_price: row.home_price,
        away_price: row.away_price,
        recorded_at: row.recorded_at
      });
    });

    const list = Array.from(map.values()).map((g) => {
      // Sort history chronologically
      g.history.sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));

      const firstEntry = g.history[0] || {};
      const latestEntry = g.history[g.history.length - 1] || {};

      const openSpread = firstEntry.spread_home ?? null;
      const currentSpread = latestEntry.spread_home ?? null;
      const spreadDiff = (currentSpread !== null && openSpread !== null) 
        ? +(currentSpread - openSpread).toFixed(1) 
        : 0;

      const openTotal = firstEntry.over_under ?? null;
      const currentTotal = latestEntry.over_under ?? null;
      const totalDiff = (currentTotal !== null && openTotal !== null) 
        ? +(currentTotal - openTotal).toFixed(1) 
        : 0;

      const hasMovement = Math.abs(spreadDiff) > 0 || Math.abs(totalDiff) > 0;

      return {
        ...g,
        openSpread,
        currentSpread,
        spreadDiff,
        openTotal,
        currentTotal,
        totalDiff,
        hasMovement,
        updatesCount: g.history.length
      };
    });

    // Sort by commence time
    list.sort((a, b) => new Date(a.commence_time) - new Date(b.commence_time));
    return list;
  }, [historyData]);

  // Filtered games
  const filteredGames = useMemo(() => {
    return gamesMap.filter((g) => {
      const matchesSearch = 
        !searchTerm ||
        g.home_team.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.away_team.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesMovement = !filterMovementOnly || g.hasMovement;
      return matchesSearch && matchesMovement;
    });
  }, [gamesMap, searchTerm, filterMovementOnly]);

  const toggleExpand = (gameId) => {
    setExpandedGameIds((prev) => {
      const next = new Set(prev);
      if (next.has(gameId)) {
        next.delete(gameId);
      } else {
        next.add(gameId);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedGameIds(new Set(filteredGames.map((g) => g.game_id)));
  };

  const collapseAll = () => {
    setExpandedGameIds(new Set());
  };

  const formatChartTime = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' +
        d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  const renderMovementBadge = (diff, type = 'spread', homeTeam = '') => {
    if (diff === 0 || isNaN(diff)) {
      return (
        <span style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '3px', 
          fontSize: '0.8rem', 
          color: '#888',
          backgroundColor: 'rgba(255,255,255,0.06)',
          padding: '2px 7px',
          borderRadius: '4px'
        }}>
          <Minus size={13} /> No Change
        </span>
      );
    }

    if (type === 'spread') {
      // Negative spread diff means favorite is favored by more (spread moved down e.g. -3 to -4.5)
      // or dog is getting less
      const isMovedTowardHome = diff < 0;
      return (
        <span style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '3px', 
          fontSize: '0.8rem', 
          fontWeight: 'bold',
          color: diff > 0 ? '#4d7cff' : '#00e676',
          backgroundColor: diff > 0 ? 'rgba(77, 124, 255, 0.12)' : 'rgba(0, 230, 118, 0.12)',
          padding: '2px 7px',
          borderRadius: '4px'
        }}>
          {diff > 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {diff > 0 ? `+${diff}` : `${diff}`}
        </span>
      );
    }

    // Over/Under total
    return (
      <span style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '3px', 
        fontSize: '0.8rem', 
        fontWeight: 'bold',
        color: diff > 0 ? '#00e676' : '#ff5252',
        backgroundColor: diff > 0 ? 'rgba(0, 230, 118, 0.12)' : 'rgba(255, 82, 82, 0.12)',
        padding: '2px 7px',
        borderRadius: '4px'
      }}>
        {diff > 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
        {diff > 0 ? `+${diff}` : `${diff}`}
      </span>
    );
  };

  const weekOptions = weeks.reduce((acc, w) => {
    if (!acc.some((item) => item.week === w.week)) {
      acc.push({
        ...w,
        displayLabel: `Week ${w.week}`
      });
    }
    return acc;
  }, []);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Top Controls Banner */}
      <section className="controls" style={{ marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
          Season:
          <select 
            value={selectedSeason} 
            onChange={(e) => setSelectedSeason(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.15)',
              backgroundColor: '#1a1a2e',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            {seasons.map((season) => (
              <option key={season} value={season}>{season}</option>
            ))}
          </select>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
          Week:
          <select
            value={selectedWeek ?? ''}
            onChange={(e) => setSelectedWeek(Number(e.target.value))}
            disabled={!weekOptions.length}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.15)',
              backgroundColor: '#1a1a2e',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            {weekOptions.map((w) => (
              <option key={`${w.season}-${w.week}`} value={w.week}>{w.displayLabel}</option>
            ))}
          </select>
        </label>
      </section>

      {/* Main Header and Action Bar */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px', 
        flexWrap: 'wrap', 
        gap: '15px' 
      }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={24} color="#4d7cff" /> Odds Movement & History
          </h2>
          <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '4px' }}>
            Track opening vs current lines, line movement over time, and line history snapshots.
          </div>
        </div>

        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px', 
          flexWrap: 'wrap',
          width: isMobile ? '100%' : 'auto'
        }}>
          <div style={{ position: 'relative', width: isMobile ? '100%' : '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
            <input
              type="text"
              placeholder="Search team..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: '0.9rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <label style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '6px', 
            color: '#fff', 
            fontSize: '0.85rem', 
            cursor: 'pointer',
            backgroundColor: filterMovementOnly ? 'rgba(77, 124, 255, 0.15)' : 'rgba(255,255,255,0.05)',
            border: filterMovementOnly ? '1px solid #4d7cff' : '1px solid rgba(255,255,255,0.1)',
            padding: '7px 12px',
            borderRadius: '6px'
          }}>
            <input
              type="checkbox"
              checked={filterMovementOnly}
              onChange={(e) => setFilterMovementOnly(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            Movement Only
          </label>

          <button
            onClick={expandAll}
            style={{
              padding: '7px 12px',
              fontSize: '0.85rem',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            Expand All
          </button>

          <button
            onClick={collapseAll}
            style={{
              padding: '7px 12px',
              fontSize: '0.85rem',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <LoadingAnimation />
      ) : error ? (
        <div style={{ padding: '20px', backgroundColor: 'rgba(255, 0, 0, 0.1)', color: '#ff5252', borderRadius: '8px' }}>
          {error}
        </div>
      ) : filteredGames.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', color: '#888', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
          No games with odds history found for this selection.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {filteredGames.map((game) => {
            const isExpanded = expandedGameIds.has(game.game_id);

            // Chart data preparation
            const chartData = game.history.map((h, i) => {
              const label = formatChartTime(h.recorded_at);
              return {
                index: i + 1,
                timeLabel: label,
                recorded_at: h.recorded_at,
                spread_home: h.spread_home,
                over_under: h.over_under
              };
            });

            return (
              <div 
                key={game.game_id} 
                className="panel"
                style={{ 
                  borderRadius: '10px', 
                  border: '1px solid rgba(255,255,255,0.08)', 
                  backgroundColor: '#12121a',
                  overflow: 'hidden'
                }}
              >
                {/* Game Card Header Bar */}
                <div 
                  onClick={() => toggleExpand(game.game_id)}
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: isMobile ? '12px' : '15px 20px',
                    cursor: 'pointer',
                    backgroundColor: isExpanded ? 'rgba(255,255,255,0.03)' : 'transparent',
                    borderBottom: isExpanded ? '1px solid rgba(255,255,255,0.08)' : 'none',
                    transition: 'background-color 0.2s',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  {/* Teams info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 300px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {/* Away team */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {game.away_logo && (
                          <img src={game.away_logo} alt={game.away_team} style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                        )}
                        <span style={{ fontWeight: '600', fontSize: isMobile ? '0.95rem' : '1.05rem', color: '#fff' }}>
                          {game.away_team}
                        </span>
                      </div>

                      <span style={{ color: '#666', fontSize: '0.85rem' }}>@</span>

                      {/* Home team */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {game.home_logo && (
                          <img src={game.home_logo} alt={game.home_team} style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                        )}
                        <span style={{ fontWeight: '600', fontSize: isMobile ? '0.95rem' : '1.05rem', color: '#fff' }}>
                          {game.home_team}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#888' }}>
                      <Clock size={12} />
                      {new Date(game.commence_time).toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' })}
                    </div>
                  </div>

                  {/* Summary Comparison Columns */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: isMobile ? '12px' : '24px', 
                    flexWrap: 'wrap' 
                  }}>
                    {/* Spread Section */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <div style={{ fontSize: '0.72rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Spread (Home)
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <span style={{ fontSize: '0.82rem', color: '#aaa' }}>
                          Open: <strong style={{ color: '#fff' }}>{formatSpread(game.openSpread)}</strong>
                        </span>
                        <span style={{ color: '#555' }}>→</span>
                        <span style={{ fontSize: '0.88rem', fontWeight: 'bold', color: '#4d7cff' }}>
                          Current: {formatSpread(game.currentSpread)}
                        </span>
                        {renderMovementBadge(game.spreadDiff, 'spread')}
                      </div>
                    </div>

                    {/* Over / Under Total Section */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <div style={{ fontSize: '0.72rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Over / Under
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <span style={{ fontSize: '0.82rem', color: '#aaa' }}>
                          Open: <strong style={{ color: '#fff' }}>{formatTotal(game.openTotal)}</strong>
                        </span>
                        <span style={{ color: '#555' }}>→</span>
                        <span style={{ fontSize: '0.88rem', fontWeight: 'bold', color: '#ffb300' }}>
                          Current: {formatTotal(game.currentTotal)}
                        </span>
                        {renderMovementBadge(game.totalDiff, 'total')}
                      </div>
                    </div>

                    <div style={{ color: '#888', paddingLeft: '6px' }}>
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details: Chart and Timeline */}
                {isExpanded && (
                  <div style={{ padding: isMobile ? '15px 12px' : '20px' }}>
                    {/* Line Movement Visual Chart (if more than 1 snapshot) */}
                    {chartData.length > 1 && (
                      <div style={{ marginBottom: '24px' }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          marginBottom: '10px' 
                        }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#bbb' }}>
                            Odds Trajectory Over Time
                          </span>
                          <div style={{ display: 'flex', gap: '15px', fontSize: '0.78rem' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#4d7cff' }}>
                              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#4d7cff' }}></span>
                              Spread ({game.home_team})
                            </span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#ffb300' }}>
                              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ffb300' }}></span>
                              Over / Under
                            </span>
                          </div>
                        </div>

                        <div style={{ 
                          background: 'rgba(0,0,0,0.25)', 
                          border: '1px solid rgba(255,255,255,0.06)', 
                          borderRadius: '8px', 
                          padding: '15px 15px 5px 0', 
                          height: '240px' 
                        }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                              <XAxis 
                                dataKey="timeLabel" 
                                stroke="#777" 
                                fontSize={11}
                                tickMargin={8}
                                minTickGap={25}
                              />
                              <YAxis 
                                stroke="#777" 
                                fontSize={11}
                                domain={['auto', 'auto']}
                              />
                              <Tooltip 
                                contentStyle={{ 
                                  background: '#1a1a2e', 
                                  border: '1px solid rgba(255,255,255,0.2)', 
                                  borderRadius: '8px',
                                  fontSize: '0.85rem'
                                }}
                                labelStyle={{ color: '#aaa', marginBottom: '4px' }}
                                formatter={(value, name) => [
                                  name === 'spread_home' ? formatSpread(value) : formatTotal(value),
                                  name === 'spread_home' ? `Spread (${game.home_team})` : 'Over / Under'
                                ]}
                              />
                              <Line 
                                type="stepAfter" 
                                dataKey="spread_home" 
                                stroke="#4d7cff" 
                                strokeWidth={2.5}
                                dot={{ r: 4, fill: '#4d7cff' }}
                                activeDot={{ r: 6 }}
                              />
                              <Line 
                                type="stepAfter" 
                                dataKey="over_under" 
                                stroke="#ffb300" 
                                strokeWidth={2.5}
                                dot={{ r: 4, fill: '#ffb300' }}
                                activeDot={{ r: 6 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {/* Historical Snapshots Table */}
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#bbb', marginBottom: '8px' }}>
                        Line History Snapshots ({game.history.length})
                      </div>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ 
                          width: '100%', 
                          borderCollapse: 'collapse', 
                          fontSize: '0.85rem', 
                          textAlign: 'left' 
                        }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#888' }}>
                              <th style={{ padding: '8px 10px' }}>Recorded At</th>
                              <th style={{ padding: '8px 10px' }}>{game.home_team} (Home) Spread</th>
                              <th style={{ padding: '8px 10px' }}>{game.away_team} (Away) Spread</th>
                              <th style={{ padding: '8px 10px' }}>Over / Under Total</th>
                              <th style={{ padding: '8px 10px' }}>Moneyline (Home / Away)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {game.history.map((snap, idx) => (
                              <tr 
                                key={snap.id || idx} 
                                style={{ 
                                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                                  backgroundColor: idx === game.history.length - 1 ? 'rgba(77, 124, 255, 0.05)' : 'transparent'
                                }}
                              >
                                <td style={{ padding: '8px 10px', color: '#aaa', whiteSpace: 'nowrap' }}>
                                  {new Date(snap.recorded_at).toLocaleString()}
                                  {idx === 0 && <span style={{ marginLeft: '6px', fontSize: '0.7rem', color: '#00e676', backgroundColor: 'rgba(0,230,118,0.1)', padding: '1px 5px', borderRadius: '3px' }}>Open</span>}
                                  {idx === game.history.length - 1 && idx > 0 && <span style={{ marginLeft: '6px', fontSize: '0.7rem', color: '#4d7cff', backgroundColor: 'rgba(77,124,255,0.1)', padding: '1px 5px', borderRadius: '3px' }}>Latest</span>}
                                </td>
                                <td style={{ padding: '8px 10px', fontWeight: '600', color: '#fff' }}>
                                  {formatSpread(snap.spread_home)}
                                </td>
                                <td style={{ padding: '8px 10px', fontWeight: '600', color: '#fff' }}>
                                  {formatSpread(snap.spread_away)}
                                </td>
                                <td style={{ padding: '8px 10px', fontWeight: '600', color: '#ffb300' }}>
                                  {formatTotal(snap.over_under)}
                                </td>
                                <td style={{ padding: '8px 10px', color: '#aaa' }}>
                                  {snap.home_price ? `${snap.home_price > 0 ? `+${snap.home_price}` : snap.home_price}` : '-'} / {snap.away_price ? `${snap.away_price > 0 ? `+${snap.away_price}` : snap.away_price}` : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OddsHistoryPage;
