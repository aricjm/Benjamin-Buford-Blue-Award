import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Sparkles, RefreshCw, Trophy, Calendar, Filter, Award } from 'lucide-react';
import useIsMobile from '../hooks/useIsMobile';

const RankingsHistoryPage = ({
  seasons = [],
  weeks = [],
  selectedSeason: initialSeason,
  selectedWeek: initialWeek
}) => {
  const [selectedSeason, setSelectedSeason] = useState(initialSeason || new Date().getFullYear().toString());
  const [selectedWeek, setSelectedWeek] = useState(initialWeek !== null && initialWeek !== undefined ? initialWeek : '');
  const [rankings, setRankings] = useState([]);
  const [previousWeekRankings, setPreviousWeekRankings] = useState([]);
  const [availableWeeks, setAvailableWeeks] = useState([]);
  const [filterType, setFilterType] = useState('all'); // 'all', 'risers', 'fallers', 'new', 'unchanged'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isMobile = useIsMobile();

  // Load available weeks for the season
  useEffect(() => {
    if (weeks && weeks.length > 0) {
      const seasonWeeks = weeks.filter(w => !w.season || String(w.season) === String(selectedSeason));
      if (seasonWeeks.length > 0) {
        setAvailableWeeks(seasonWeeks);
      } else {
        setAvailableWeeks(weeks);
      }
    }
  }, [weeks, selectedSeason]);

  const loadRankings = async () => {
    setLoading(true);
    try {
      const weekParam = selectedWeek !== '' && selectedWeek !== null && selectedWeek !== undefined ? `&week=${selectedWeek}` : '';
      const res = await fetch(`/api/rankings?season=${selectedSeason}${weekParam}&pollId=1`);
      if (res.ok) {
        const data = await res.json();
        setRankings(data || []);

        // Also fetch previous week's rankings if week is specified to calculate movements
        if (selectedWeek !== '' && Number(selectedWeek) > 0) {
          const prevWeek = Number(selectedWeek) - 1;
          const prevRes = await fetch(`/api/rankings?season=${selectedSeason}&week=${prevWeek}&pollId=1`);
          if (prevRes.ok) {
            const prevData = await prevRes.json();
            setPreviousWeekRankings(prevData || []);
          }
        } else {
          setPreviousWeekRankings([]);
        }
      } else {
        // Fallback directly to ESPN API if backend table is empty
        const espnUrl = `https://site.api.espn.com/apis/site/v2/sports/football/college-football/rankings?seasons=${selectedSeason}${selectedWeek !== '' ? `&weeks=${selectedWeek}` : ''}`;
        const espnRes = await fetch(espnUrl);
        const espnData = await espnRes.json();
        const apPoll = (espnData.rankings || []).find(r => r.id === '1') || (espnData.rankings || [])[0];
        
        const mapped = (apPoll?.ranks || []).map(r => ({
          rank: r.current,
          previous_rank: r.previous || null,
          points: r.points || null,
          first_place_votes: r.firstPlaceVotes || 0,
          trend: r.trend || null,
          record_summary: r.recordSummary || '',
          team_name: r.team?.displayName || r.team?.name || 'Unknown',
          team_location: r.team?.location || '',
          team_nickname: r.team?.nickname || r.team?.name || '',
          team_logo: r.team?.logo || r.team?.logos?.[0]?.href || '',
          conference: r.team?.groups?.shortName || r.team?.groups?.name || ''
        }));
        setRankings(mapped);
      }
    } catch (err) {
      console.error('Failed to load rankings', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRankings();
  }, [selectedSeason, selectedWeek]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const weekParam = selectedWeek !== '' ? `&week=${selectedWeek}` : '';
      await fetch(`/api/cron/sync-rankings?season=${selectedSeason}${weekParam}`);
      await loadRankings();
    } catch (err) {
      console.error('Error refreshing rankings', err);
      setRefreshing(false);
    }
  };

  // Build movement metadata for each ranked team
  const enrichedRankings = rankings.map(item => {
    // 1. Check previous_rank field if present from API
    let prevRank = item.previous_rank;
    
    // 2. If previousWeekRankings has this team, use that
    if (previousWeekRankings.length > 0) {
      const prevMatch = previousWeekRankings.find(p => 
        p.team_name === item.team_name || 
        (p.team_location && item.team_location && p.team_location === item.team_location)
      );
      if (prevMatch) {
        prevRank = prevMatch.rank;
      }
    }

    let movement = 'unchanged';
    let rankDiff = 0;

    if (!prevRank || prevRank === 0 || prevRank > 25) {
      movement = 'new';
    } else if (item.rank < prevRank) {
      movement = 'up';
      rankDiff = prevRank - item.rank;
    } else if (item.rank > prevRank) {
      movement = 'down';
      rankDiff = item.rank - prevRank;
    } else {
      movement = 'unchanged';
    }

    return {
      ...item,
      prevRank,
      movement,
      rankDiff
    };
  });

  const risers = enrichedRankings.filter(r => r.movement === 'up');
  const fallers = enrichedRankings.filter(r => r.movement === 'down');
  const newTeams = enrichedRankings.filter(r => r.movement === 'new');

  const filteredRankings = enrichedRankings.filter(r => {
    if (filterType === 'risers') return r.movement === 'up';
    if (filterType === 'fallers') return r.movement === 'down';
    if (filterType === 'new') return r.movement === 'new';
    if (filterType === 'unchanged') return r.movement === 'unchanged';
    return true;
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '12px' : '20px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: '12px',
        marginBottom: '20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        paddingBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f1c40f',
            color: '#1a1a2e',
            borderRadius: '8px',
            padding: '6px 10px',
            fontWeight: 'bold',
            fontSize: '0.85em',
            gap: '6px'
          }}>
            <Award size={16} /> AP POLL
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: isMobile ? '1.4rem' : '1.8rem', fontWeight: 'bold' }}>
              Rankings History
            </h1>
            <span style={{ fontSize: '0.8em', color: 'rgba(255, 255, 255, 0.5)' }}>
              Top 25 College Football Rankings & Weekly Movers (Updated Sundays at 2:30 PM EST)
            </span>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(241, 196, 15, 0.15)',
            border: '1px solid rgba(241, 196, 15, 0.35)',
            color: '#f1c40f',
            padding: '7px 14px',
            borderRadius: '6px',
            cursor: refreshing ? 'not-allowed' : 'pointer',
            fontSize: '0.85em',
            fontWeight: 'bold'
          }}
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Syncing Poll...' : 'Sync Poll'}
        </button>
      </div>

      {/* Filter Controls Bar */}
      <div style={{
        backgroundColor: '#1f1f1f',
        borderRadius: '12px',
        padding: '12px 16px',
        marginBottom: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        border: '1px solid #333'
      }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ccc', fontSize: '0.9em' }}>
          Season:
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            style={{
              background: '#111',
              color: '#f5f5f5',
              border: '1px solid #333',
              borderRadius: '8px',
              padding: '8px 10px',
              cursor: 'pointer'
            }}
          >
            {seasons.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ccc', fontSize: '0.9em' }}>
          Week:
          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            style={{
              background: '#111',
              color: '#f5f5f5',
              border: '1px solid #333',
              borderRadius: '8px',
              padding: '8px 10px',
              cursor: 'pointer'
            }}
          >
            <option value="">Latest / Current Week</option>
            {availableWeeks.map((w) => (
              <option key={w.week ?? w} value={w.week ?? w}>
                Week {w.week ?? w}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Movement Summary Cards */}
      {!loading && enrichedRankings.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: '14px',
          marginBottom: '24px'
        }}>
          {/* Risers Card */}
          <div
            onClick={() => setFilterType(filterType === 'risers' ? 'all' : 'risers')}
            style={{
              backgroundColor: '#1a1f2c',
              border: `1px solid ${filterType === 'risers' ? '#4caf50' : 'rgba(76, 175, 80, 0.25)'}`,
              borderRadius: '10px',
              padding: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: filterType === 'risers' ? '0 0 10px rgba(76, 175, 80, 0.2)' : 'none'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#4caf50', fontWeight: 'bold', fontSize: '0.9em' }}>
                <TrendingUp size={16} /> Teams Moved Up
              </span>
              <span style={{ backgroundColor: 'rgba(76, 175, 80, 0.2)', color: '#4caf50', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold', fontSize: '0.85em' }}>
                {risers.length}
              </span>
            </div>
            <div style={{ fontSize: '0.78em', color: 'rgba(255, 255, 255, 0.6)' }}>
              {risers.length > 0 
                ? risers.map(r => `${r.team_location || r.team_name} (+${r.rankDiff})`).join(', ')
                : 'No teams moved up this week'}
            </div>
          </div>

          {/* Fallers Card */}
          <div
            onClick={() => setFilterType(filterType === 'fallers' ? 'all' : 'fallers')}
            style={{
              backgroundColor: '#1a1f2c',
              border: `1px solid ${filterType === 'fallers' ? '#e74c3c' : 'rgba(231, 76, 60, 0.25)'}`,
              borderRadius: '10px',
              padding: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: filterType === 'fallers' ? '0 0 10px rgba(231, 76, 60, 0.2)' : 'none'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#e74c3c', fontWeight: 'bold', fontSize: '0.9em' }}>
                <TrendingDown size={16} /> Teams Moved Down
              </span>
              <span style={{ backgroundColor: 'rgba(231, 76, 60, 0.2)', color: '#e74c3c', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold', fontSize: '0.85em' }}>
                {fallers.length}
              </span>
            </div>
            <div style={{ fontSize: '0.78em', color: 'rgba(255, 255, 255, 0.6)' }}>
              {fallers.length > 0 
                ? fallers.map(r => `${r.team_location || r.team_name} (-${r.rankDiff})`).join(', ')
                : 'No teams dropped rank this week'}
            </div>
          </div>

          {/* New to Rankings Card */}
          <div
            onClick={() => setFilterType(filterType === 'new' ? 'all' : 'new')}
            style={{
              backgroundColor: '#1a1f2c',
              border: `1px solid ${filterType === 'new' ? '#f1c40f' : 'rgba(241, 196, 15, 0.25)'}`,
              borderRadius: '10px',
              padding: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: filterType === 'new' ? '0 0 10px rgba(241, 196, 15, 0.2)' : 'none'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#f1c40f', fontWeight: 'bold', fontSize: '0.9em' }}>
                <Sparkles size={16} /> New in Top 25
              </span>
              <span style={{ backgroundColor: 'rgba(241, 196, 15, 0.2)', color: '#f1c40f', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold', fontSize: '0.85em' }}>
                {newTeams.length}
              </span>
            </div>
            <div style={{ fontSize: '0.78em', color: 'rgba(255, 255, 255, 0.6)' }}>
              {newTeams.length > 0 
                ? newTeams.map(r => `#${r.rank} ${r.team_location || r.team_name}`).join(', ')
                : 'No new teams entered the Top 25'}
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: 'All Top 25' },
          { key: 'risers', label: `Moved Up (${risers.length})` },
          { key: 'fallers', label: `Moved Down (${fallers.length})` },
          { key: 'new', label: `New (${newTeams.length})` }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilterType(tab.key)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: filterType === tab.key ? '1px solid #4d7cff' : '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: filterType === tab.key ? 'rgba(77, 124, 255, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              color: filterType === tab.key ? '#fff' : '#aaa',
              cursor: 'pointer',
              fontSize: '0.85em',
              fontWeight: filterType === tab.key ? 'bold' : 'normal'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
          <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 12px auto', display: 'block' }} />
          Loading Top 25 Rankings...
        </div>
      )}

      {/* Table */}
      {!loading && filteredRankings.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: '#1a1f2c', borderRadius: '8px', color: '#888' }}>
          No rankings found for this selection.
        </div>
      )}

      {!loading && filteredRankings.length > 0 && (
        <div style={{
          backgroundColor: '#1a1f2c',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
            <thead>
              <tr style={{
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                color: 'rgba(255, 255, 255, 0.7)',
                textAlign: 'left',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <th style={{ padding: '12px 14px', width: '50px', textAlign: 'center' }}>Rank</th>
                <th style={{ padding: '12px 14px', width: '70px', textAlign: 'center' }}>Change</th>
                <th style={{ padding: '12px 14px' }}>Team</th>
                <th style={{ padding: '12px 14px' }}>Conference</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Record</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Points</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Prev</th>
              </tr>
            </thead>
            <tbody>
              {filteredRankings.map((r, idx) => {
                const logo = r.team_logo || r.team_db_logo;

                return (
                  <tr
                    key={`${r.team_name}-${r.rank}`}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      backgroundColor: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.01)' : 'transparent',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    {/* Rank */}
                    <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 'bold', fontSize: '1.05em', color: r.rank <= 5 ? '#f1c40f' : (r.rank <= 10 ? '#4d7cff' : '#fff') }}>
                      #{r.rank}
                    </td>

                    {/* Change Indicator */}
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      {r.movement === 'up' && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: '#4caf50', fontWeight: 'bold', fontSize: '0.85em' }}>
                          <TrendingUp size={14} /> +{r.rankDiff}
                        </span>
                      )}
                      {r.movement === 'down' && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: '#e74c3c', fontWeight: 'bold', fontSize: '0.85em' }}>
                          <TrendingDown size={14} /> -{r.rankDiff}
                        </span>
                      )}
                      {r.movement === 'new' && (
                        <span style={{
                          backgroundColor: 'rgba(241, 196, 15, 0.2)',
                          color: '#f1c40f',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '0.75em',
                          fontWeight: 'bold',
                          letterSpacing: '0.05em'
                        }}>
                          NEW
                        </span>
                      )}
                      {r.movement === 'unchanged' && (
                        <span style={{ color: 'rgba(255, 255, 255, 0.3)', display: 'inline-flex', alignItems: 'center' }}>
                          <Minus size={14} />
                        </span>
                      )}
                    </td>

                    {/* Team */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {logo ? (
                          <img src={logo} alt="" style={{ height: '26px', width: '26px', objectFit: 'contain' }} />
                        ) : (
                          <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)' }} />
                        )}
                        <div>
                          <div style={{ fontWeight: 'bold', color: '#fff' }}>
                            {r.team_name}
                            {r.first_place_votes > 0 && (
                              <span style={{ fontSize: '0.75em', color: '#f1c40f', marginLeft: '6px', fontWeight: 'normal' }}>
                                ({r.first_place_votes})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Conference */}
                    <td style={{ padding: '12px 14px', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.85em' }}>
                      {r.conference || r.team_db_conference || '—'}
                    </td>

                    {/* Record */}
                    <td style={{ padding: '12px 14px', textAlign: 'center', color: '#ddd', fontSize: '0.85em' }}>
                      {r.record_summary || '0-0'}
                    </td>

                    {/* Points */}
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: 'rgba(255, 255, 255, 0.85)', fontWeight: '500' }}>
                      {r.points ? r.points.toLocaleString() : '—'}
                    </td>

                    {/* Prev Rank */}
                    <td style={{ padding: '12px 14px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.85em' }}>
                      {r.prevRank ? `#${r.prevRank}` : (r.previous_rank ? `#${r.previous_rank}` : 'NR')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RankingsHistoryPage;
