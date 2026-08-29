import React, { useState, useEffect } from 'react';
import { RefreshCw, Radio, Lock, Filter, Search, Award } from 'lucide-react';
import useIsMobile from '../hooks/useIsMobile';
import BoxScore from './BoxScore';

const LiveScoresPage = ({ pickGames = [], picks = {}, teams = [] }) => {
  const [liveEvents, setLiveEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedConference, setSelectedConference] = useState('');
  const [top25Only, setTop25Only] = useState(false);
  const [myPicksOnly, setMyPicksOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const isMobile = useIsMobile();

  // Mapping school -> conference
  const teamConferenceMap = teams.reduce((acc, t) => {
    if (t.school && t.conference) acc[t.school] = t.conference;
    return acc;
  }, {});

  const getConferenceForTeam = (teamName, confId) => {
    if (!teamName) return null;
    const match = teams.find(t => teamName.startsWith(t.school) || t.school.startsWith(teamName));
    if (match?.conference) return match.conference;
    return null;
  };

  const fetchScores = async () => {
    try {
      const res = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?groups=80&limit=300');
      const data = await res.json();
      
      const parsed = (data.events || []).map(event => {
        const comp = event.competitions?.[0] || {};
        const homeComp = comp.competitors?.find(c => c.homeAway === 'home');
        const awayComp = comp.competitors?.find(c => c.homeAway === 'away');

        const homeRank = homeComp?.curatedRank?.current <= 25 ? homeComp.curatedRank.current : null;
        const awayRank = awayComp?.curatedRank?.current <= 25 ? awayComp.curatedRank.current : null;
        const isTop25 = (homeRank !== null && homeRank <= 25) || (awayRank !== null && awayRank <= 25);

        const homeConf = getConferenceForTeam(homeComp?.team?.displayName) || homeComp?.team?.conference?.name || null;
        const awayConf = getConferenceForTeam(awayComp?.team?.displayName) || awayComp?.team?.conference?.name || null;

        // Check if user has a pick on this game
        // Match with pickGames by api_game_id or team names
        const matchingPickGame = pickGames.find(g => 
          String(g.api_game_id) === String(event.id) ||
          (g.home_team && homeComp?.team?.displayName && (g.home_team === homeComp.team.displayName || homeComp.team.displayName.includes(g.home_team) || g.home_team.includes(homeComp.team.displayName)))
        );

        const gamePick = matchingPickGame ? picks[matchingPickGame.id] : null;
        const hasPick = !!(gamePick && (gamePick.selected_team || gamePick.selected_total));

        return {
          id: event.id,
          name: event.name,
          date: event.date,
          statusState: event.status?.type?.state, // 'in', 'pre', 'post'
          statusDescription: event.status?.type?.description,
          detail: event.status?.type?.detail || event.status?.type?.shortDetail,
          clock: event.status?.displayClock,
          period: event.status?.period,
          isHalftime: event.status?.type?.description === 'Halftime' || event.status?.period === 2 && event.status?.displayClock === '0:00',
          homeTeam: {
            id: homeComp?.team?.id,
            name: homeComp?.team?.displayName,
            shortName: homeComp?.team?.shortDisplayName || homeComp?.team?.abbreviation,
            logo: homeComp?.team?.logo,
            score: homeComp?.score ? parseInt(homeComp.score) : 0,
            rank: homeRank,
            conference: homeConf,
            linescores: (homeComp?.linescores || []).map(l => ({ period: l.period, score: l.value ?? parseInt(l.displayValue) ?? 0 }))
          },
          awayTeam: {
            id: awayComp?.team?.id,
            name: awayComp?.team?.displayName,
            shortName: awayComp?.team?.shortDisplayName || awayComp?.team?.abbreviation,
            logo: awayComp?.team?.logo,
            score: awayComp?.score ? parseInt(awayComp.score) : 0,
            rank: awayRank,
            conference: awayConf,
            linescores: (awayComp?.linescores || []).map(l => ({ period: l.period, score: l.value ?? parseInt(l.displayValue) ?? 0 }))
          },
          broadcast: comp.broadcasts?.[0]?.names?.[0] || comp.broadcasts?.[0]?.market?.shortName || null,
          situation: {
            downDistance: comp.situation?.downDistanceText,
            possessionText: comp.situation?.possessionText,
            possession: comp.situation?.possession,
            lastPlay: comp.situation?.lastPlay?.text,
            isRedZone: comp.situation?.isRedZone
          },
          isTop25,
          hasPick,
          matchingPickGame,
          gamePick
        };
      });

      // Filter to games that are currently live (state === 'in')
      const liveOnly = parsed.filter(e => e.statusState === 'in');
      setLiveEvents(liveOnly);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch live scores', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchScores();
    const interval = setInterval(fetchScores, 30000);
    return () => clearInterval(interval);
  }, [pickGames, picks]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchScores();
  };

  // Collect available conferences from live games
  const availableConferences = Array.from(
    new Set(
      liveEvents.flatMap(e => [e.homeTeam.conference, e.awayTeam.conference]).filter(Boolean)
    )
  ).sort();

  // Apply UI filters
  const filteredEvents = liveEvents.filter(e => {
    if (top25Only && !e.isTop25) return false;
    if (myPicksOnly && !e.hasPick) return false;
    if (selectedConference) {
      const matchHome = e.homeTeam.conference === selectedConference;
      const matchAway = e.awayTeam.conference === selectedConference;
      if (!matchHome && !matchAway) return false;
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = e.name?.toLowerCase().includes(term);
      const matchHome = e.homeTeam.name?.toLowerCase().includes(term);
      const matchAway = e.awayTeam.name?.toLowerCase().includes(term);
      if (!matchName && !matchHome && !matchAway) return false;
    }
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
            backgroundColor: '#e74c3c',
            color: '#fff',
            borderRadius: '8px',
            padding: '6px 10px',
            fontWeight: 'bold',
            fontSize: '0.85em',
            gap: '6px',
            boxShadow: '0 0 12px rgba(231, 76, 60, 0.5)'
          }}>
            <Radio size={16} /> LIVE
          </div>
          <h1 style={{ margin: 0, fontSize: isMobile ? '1.4rem' : '1.8rem', fontWeight: 'bold' }}>
            Live Scores
          </h1>
          <span style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '0.85em',
            color: '#ccc'
          }}>
            {liveEvents.length} Active
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'space-between' : 'flex-end' }}>
          {lastUpdated && (
            <span style={{ fontSize: '0.75em', color: 'rgba(255, 255, 255, 0.5)' }}>
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(77, 124, 255, 0.2)',
              border: '1px solid rgba(77, 124, 255, 0.4)',
              color: '#fff',
              padding: '6px 14px',
              borderRadius: '6px',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              fontSize: '0.85em',
              fontWeight: 'bold'
            }}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh All'}
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '10px',
        padding: '14px',
        marginBottom: '24px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: isMobile ? '1 1 100%' : '1 1 225px' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
          <input
            type="text"
            placeholder="Search school or nickname..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '8px 12px 8px 32px',
              borderRadius: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#fff',
              fontSize: '0.9em'
            }}
          />
        </div>

        {/* Conference Dropdown */}
        <div style={{ flex: isMobile ? '1 1 100%' : '0 1 auto' }}>
          <select
            value={selectedConference}
            onChange={(e) => setSelectedConference(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: '#1a1a2e',
              color: '#fff',
              fontSize: '0.9em',
              width: isMobile ? '100%' : 'auto',
              boxSizing: 'border-box',
              cursor: 'pointer'
            }}
          >
            <option value="" style={{ backgroundColor: '#1a1a2e', color: '#fff' }}>All Conferences</option>
            {availableConferences.map(c => (
              <option key={c} value={c} style={{ backgroundColor: '#1a1a2e', color: '#fff' }}>{c}</option>
            ))}
          </select>
        </div>

        {/* Top 25 Toggle */}
        <label style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          cursor: 'pointer',
          fontSize: '0.85em',
          userSelect: 'none',
          backgroundColor: top25Only ? 'rgba(241, 196, 15, 0.2)' : 'rgba(255, 255, 255, 0.05)',
          border: `1px solid ${top25Only ? '#f1c40f' : 'rgba(255, 255, 255, 0.1)'}`,
          padding: '6px 12px',
          borderRadius: '6px',
          color: top25Only ? '#f1c40f' : '#ccc'
        }}>
          <input
            type="checkbox"
            checked={top25Only}
            onChange={(e) => setTop25Only(e.target.checked)}
            style={{ accentColor: '#f1c40f' }}
          />
          Top 25 Only
        </label>

        {/* My Picks Only Toggle */}
        <label style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          cursor: 'pointer',
          fontSize: '0.85em',
          userSelect: 'none',
          backgroundColor: myPicksOnly ? 'rgba(77, 124, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
          border: `1px solid ${myPicksOnly ? '#4d7cff' : 'rgba(255, 255, 255, 0.1)'}`,
          padding: '6px 12px',
          borderRadius: '6px',
          color: myPicksOnly ? '#4d7cff' : '#ccc'
        }}>
          <input
            type="checkbox"
            checked={myPicksOnly}
            onChange={(e) => setMyPicksOnly(e.target.checked)}
            style={{ accentColor: '#4d7cff' }}
          />
          My Picks Only
        </label>

        {(top25Only || myPicksOnly || selectedConference || searchTerm) && (
          <button
            onClick={() => {
              setTop25Only(false);
              setMyPicksOnly(false);
              setSelectedConference('');
              setSearchTerm('');
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#888',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '0.8em',
              marginLeft: 'auto'
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '50px 20px', color: '#888' }}>
          <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 12px auto', display: 'block' }} />
          Loading live games...
        </div>
      )}

      {/* No live games */}
      {!loading && liveEvents.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '12px',
          border: '1px dashed rgba(255, 255, 255, 0.1)'
        }}>
          <Radio size={48} style={{ color: '#666', marginBottom: '12px' }} />
          <h3 style={{ margin: '0 0 8px 0', color: '#ddd' }}>No Live Games Right Now</h3>
          <p style={{ margin: 0, color: '#888', fontSize: '0.9em' }}>
            Check back during game hours to track live action, scores, downs & field position.
          </p>
        </div>
      )}

      {/* Filtered empty state */}
      {!loading && liveEvents.length > 0 && filteredEvents.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '12px'
        }}>
          <Filter size={32} style={{ color: '#888', marginBottom: '10px' }} />
          <p style={{ margin: 0, color: '#aaa' }}>No live games match your active filters.</p>
        </div>
      )}

      {/* Live Game Cards Grid */}
      {!loading && filteredEvents.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(420px, 1fr))',
          gap: '16px'
        }}>
          {filteredEvents.map(event => {
            const maxPeriods = Math.max(
              4,
              event.period || 4,
              event.awayTeam.linescores?.length || 0,
              event.homeTeam.linescores?.length || 0
            );
            const periodHeaders = Array.from({ length: maxPeriods }, (_, i) => (i < 4 ? `Q${i + 1}` : `OT${i - 3}`));
            const awayLeading = event.awayTeam.score > event.homeTeam.score;
            const homeLeading = event.homeTeam.score > event.awayTeam.score;

            return (
              <div
                key={event.id}
                style={{
                  backgroundColor: '#1a1f2c',
                  border: event.hasPick ? '1px solid rgba(77, 124, 255, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
                  position: 'relative'
                }}
              >
                {/* Header status bar */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                  paddingBottom: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      backgroundColor: '#e74c3c',
                      color: '#fff',
                      fontSize: '0.7em',
                      fontWeight: 'bold',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      letterSpacing: '0.05em'
                    }}>
                      LIVE
                    </span>
                    <span style={{ color: '#4d7cff', fontWeight: 'bold', fontSize: '0.85em' }}>
                      {event.isHalftime ? 'HALFTIME' : `Q${event.period} - ${event.clock}`}
                    </span>
                    {event.broadcast && (
                      <span style={{
                        fontSize: '0.7em',
                        color: 'rgba(255, 255, 255, 0.5)',
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        padding: '1px 6px',
                        borderRadius: '4px'
                      }}>
                        {event.broadcast}
                      </span>
                    )}
                  </div>

                  {event.hasPick && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.72em',
                      color: '#4d7cff',
                      backgroundColor: 'rgba(77, 124, 255, 0.15)',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontWeight: 'bold'
                    }}>
                      Your Pick: {event.gamePick?.selected_team || event.gamePick?.selected_total || 'Picked'}
                    </span>
                  )}
                </div>

                {/* Situation info (Down, Distance, Field placement) */}
                {(event.situation?.downDistance || event.situation?.possessionText) && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'rgba(77, 124, 255, 0.08)',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    fontSize: '0.8em',
                    color: '#fff'
                  }}>
                    <span style={{ fontWeight: '600', color: '#4d7cff' }}>
                      {event.situation.downDistance || `Ball on ${event.situation.possessionText}`}
                    </span>
                    {event.situation.possessionText && event.situation.downDistance && (
                      <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9em' }}>
                        Field: {event.situation.possessionText}
                      </span>
                    )}
                  </div>
                )}

                {/* Last play */}
                {event.situation?.lastPlay && (
                  <div style={{
                    fontSize: '0.74em',
                    color: 'rgba(255, 255, 255, 0.7)',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    lineHeight: '1.3'
                  }}>
                    <span style={{ color: '#4d7cff', fontWeight: '600', marginRight: '4px' }}>Last Play:</span>
                    {event.situation.lastPlay}
                  </div>
                )}

                {/* Quarter Linescore Table */}
                <div style={{ overflowX: 'auto', marginTop: '4px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85em' }}>
                    <thead>
                      <tr style={{ color: 'rgba(255,255,255,0.5)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <th style={{ textAlign: 'left', padding: '4px 6px', fontWeight: 'normal' }}>Team</th>
                        {periodHeaders.map((h, idx) => (
                          <th
                            key={h}
                            style={{
                              textAlign: 'center',
                              padding: '4px 6px',
                              fontWeight: event.period === idx + 1 && !event.isHalftime ? 'bold' : 'normal',
                              color: event.period === idx + 1 && !event.isHalftime ? '#4d7cff' : 'inherit',
                              minWidth: '24px'
                            }}
                          >
                            {h}
                          </th>
                        ))}
                        <th style={{ textAlign: 'right', padding: '4px 6px', fontWeight: 'bold', minWidth: '32px' }}>T</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Away Row */}
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '6px 6px', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {event.awayTeam.logo && (
                              <img src={event.awayTeam.logo} alt="" style={{ height: '20px', width: '20px', objectFit: 'contain' }} />
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {event.awayTeam.rank && (
                                <span style={{ fontSize: '0.75em', color: '#f1c40f', fontWeight: 'bold' }}>
                                  #{event.awayTeam.rank}
                                </span>
                              )}
                              <span style={{
                                fontWeight: awayLeading ? 'bold' : 'normal',
                                color: awayLeading ? '#fff' : '#aaa'
                              }}>
                                {event.awayTeam.name}
                              </span>
                            </div>
                          </div>
                        </td>
                        {periodHeaders.map((_, idx) => {
                          const line = event.awayTeam.linescores?.find(l => l.period === idx + 1);
                          const val = line ? line.score : (idx + 1 <= (event.period || 1) ? '0' : '-');
                          return (
                            <td key={idx} style={{ textAlign: 'center', padding: '6px 6px', color: line ? '#ddd' : '#666' }}>
                              {val}
                            </td>
                          );
                        })}
                        <td style={{
                          textAlign: 'right',
                          padding: '6px 6px',
                          fontWeight: 'bold',
                          fontSize: '1.2em',
                          color: awayLeading ? '#4caf50' : '#fff'
                        }}>
                          {event.awayTeam.score}
                        </td>
                      </tr>

                      {/* Home Row */}
                      <tr>
                        <td style={{ padding: '6px 6px', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {event.homeTeam.logo && (
                              <img src={event.homeTeam.logo} alt="" style={{ height: '20px', width: '20px', objectFit: 'contain' }} />
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {event.homeTeam.rank && (
                                <span style={{ fontSize: '0.75em', color: '#f1c40f', fontWeight: 'bold' }}>
                                  #{event.homeTeam.rank}
                                </span>
                              )}
                              <span style={{
                                fontWeight: homeLeading ? 'bold' : 'normal',
                                color: homeLeading ? '#fff' : '#aaa'
                              }}>
                                {event.homeTeam.name}
                              </span>
                            </div>
                          </div>
                        </td>
                        {periodHeaders.map((_, idx) => {
                          const line = event.homeTeam.linescores?.find(l => l.period === idx + 1);
                          const val = line ? line.score : (idx + 1 <= (event.period || 1) ? '0' : '-');
                          return (
                            <td key={idx} style={{ textAlign: 'center', padding: '6px 6px', color: line ? '#ddd' : '#666' }}>
                              {val}
                            </td>
                          );
                        })}
                        <td style={{
                          textAlign: 'right',
                          padding: '6px 6px',
                          fontWeight: 'bold',
                          fontSize: '1.2em',
                          color: homeLeading ? '#4caf50' : '#fff'
                        }}>
                          {event.homeTeam.score}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Collapsible Box Score */}
                <BoxScore 
                  apiGameId={event.id}
                  homeTeamName={event.homeTeam.name}
                  awayTeamName={event.awayTeam.name}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LiveScoresPage;
