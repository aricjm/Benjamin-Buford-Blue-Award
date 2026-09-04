import React, { useState } from 'react';
import { ChevronDown, ChevronUp, RefreshCw, BarChart2, Trophy, ShieldAlert, Check } from 'lucide-react';

const BoxScore = ({ apiGameId, homeTeamName, awayTeamName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('touchdowns'); // 'touchdowns', 'team', 'passing', 'rushing', 'receiving', 'defensive'
  const [addedNotice, setAddedNotice] = useState(null);

  const addCandidate = (athlete, teamObj, type) => {
    if (!athlete) return;
    const athleteId = athlete.id || athlete.displayName;
    const athleteName = athlete.displayName || athlete.shortName || 'Unknown';
    const jersey = athlete.jersey || '';
    const position = athlete.position?.abbreviation || athlete.position?.name || '';
    const teamName = teamObj?.displayName || (homeTeamName || 'Unknown');
    const teamId = teamObj?.id || null;
    const teamLogo = teamObj?.logo || '';

    const payload = {
      id: String(athleteId),
      name: athleteName,
      jersey,
      position,
      teamName,
      teamId,
      teamLogo,
      addedAt: new Date().toISOString()
    };

    if (type === 'heisman') {
      try {
        const key = 'tracked_heisman_candidates';
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        if (!existing.some(p => p.id === String(athleteId))) {
          existing.push(payload);
          localStorage.setItem(key, JSON.stringify(existing));
        }
      } catch (e) {
        console.error(e);
      }
      setAddedNotice({ text: `Added ${athleteName} to Heisman Watch!`, id: athleteId, type: 'heisman' });
    } else if (type === 'liability') {
      try {
        const key = 'tracked_liabilities';
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        if (!existing.some(p => p.id === String(athleteId))) {
          existing.push(payload);
          localStorage.setItem(key, JSON.stringify(existing));
        }
      } catch (e) {
        console.error(e);
      }
      setAddedNotice({ text: `Added ${athleteName} to Liability Watch!`, id: athleteId, type: 'liability' });
    }

    setTimeout(() => {
      setAddedNotice(null);
    }, 2500);
  };

  const fetchBoxScore = async () => {
    if (!apiGameId) return;
    setLoading(true);
    setError(null);
    try {
      // Direct client-side fetch from ESPN summary API (no DB operations)
      const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/college-football/summary?event=${apiGameId}`);
      if (!res.ok) throw new Error('Failed to load box score');
      const json = await res.json();
      setData(json.boxscore || null);
    } catch (err) {
      console.error('Error fetching box score:', err);
      setError('Box score data unavailable at this time.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState && !data && !loading) {
      fetchBoxScore();
    }
  };

  const teams = data?.teams || [];
  const players = data?.players || [];

  // Team stats pairs
  const teamStatRows = [];
  if (teams.length >= 2) {
    const awayStats = teams[0]?.statistics || [];
    const homeStats = teams[1]?.statistics || [];
    
    // Map of label -> value
    const awayMap = new Map(awayStats.map(s => [s.label || s.name, s.displayValue]));
    const homeMap = new Map(homeStats.map(s => [s.label || s.name, s.displayValue]));

    const allLabels = Array.from(new Set([...awayStats.map(s => s.label || s.name), ...homeStats.map(s => s.label || s.name)]));
    allLabels.forEach(label => {
      teamStatRows.push({
        label,
        away: awayMap.get(label) || '—',
        home: homeMap.get(label) || '—'
      });
    });
  }

  return (
    <div style={{
      marginTop: '10px',
      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
      paddingTop: '8px'
    }}>
      {/* Toggle button */}
      <button
        type="button"
        onClick={handleToggle}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '6px',
          padding: '6px 10px',
          color: '#aaa',
          cursor: 'pointer',
          fontSize: '0.78em',
          fontWeight: '600',
          transition: 'all 0.15s ease'
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: isOpen ? '#4d7cff' : '#ccc' }}>
          <BarChart2 size={13} /> {isOpen ? 'Hide Box Score' : 'Show Box Score'}
        </span>
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {/* Expanded Box Score */}
      {isOpen && (
        <div style={{
          marginTop: '8px',
          backgroundColor: 'rgba(0, 0, 0, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '6px',
          padding: '8px',
          fontSize: '0.8em',
          maxWidth: '100%',
          width: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}>
          {/* Header controls inside boxscore */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '6px', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
            <div style={{ 
              display: 'flex', 
              gap: '4px', 
              overflowX: 'auto', 
              WebkitOverflowScrolling: 'touch', 
              maxWidth: 'calc(100% - 65px)', 
              minWidth: 0, 
              paddingBottom: '2px',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}>
              {[
                { key: 'touchdowns', label: 'Touchdowns' },
                { key: 'team', label: 'Team Stats' },
                { key: 'passing', label: 'Passing' },
                { key: 'rushing', label: 'Rushing' },
                { key: 'receiving', label: 'Receiving' },
                { key: 'defensive', label: 'Defense' }
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    padding: '3px 8px',
                    fontSize: '0.75em',
                    borderRadius: '4px',
                    border: activeTab === tab.key ? '1px solid #4d7cff' : '1px solid rgba(255, 255, 255, 0.08)',
                    backgroundColor: activeTab === tab.key ? 'rgba(77, 124, 255, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                    color: activeTab === tab.key ? '#fff' : '#888',
                    cursor: 'pointer',
                    fontWeight: activeTab === tab.key ? 'bold' : 'normal',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={fetchBoxScore}
              disabled={loading}
              title="Refresh box score stats"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#888',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75em',
                flexShrink: 0
              }}
            >
              <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
              {loading ? '...' : 'Refresh'}
            </button>
          </div>

          {loading && !data && (
            <div style={{ textAlign: 'center', padding: '16px', color: '#888' }}>
              <RefreshCw size={18} className="animate-spin" style={{ margin: '0 auto 6px auto', display: 'block' }} />
              Loading live game statistics...
            </div>
          )}

          {/* Notice Feedback Banner */}
          {addedNotice && (
            <div style={{
              backgroundColor: addedNotice.type === 'heisman' ? 'rgba(241, 196, 15, 0.2)' : 'rgba(231, 76, 60, 0.2)',
              border: `1px solid ${addedNotice.type === 'heisman' ? '#f1c40f' : '#e74c3c'}`,
              color: addedNotice.type === 'heisman' ? '#f1c40f' : '#fff',
              padding: '6px 10px',
              borderRadius: '6px',
              marginBottom: '10px',
              fontSize: '0.8em',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Check size={14} /> {addedNotice.text}
            </div>
          )}

          {/* 1. Team Stats Tab */}
          {!loading && activeTab === 'team' && (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', maxWidth: '100%', minWidth: 0 }}>
              {teamStatRows.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#666', padding: '12px' }}>Team stats not available yet.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82em' }}>
                  <thead>
                    <tr style={{ color: 'rgba(255, 255, 255, 0.5)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <th style={{ textAlign: 'left', padding: '4px 6px', width: '40%' }}>Stat</th>
                      <th style={{ textAlign: 'center', padding: '4px 6px', width: '30%' }}>
                        {teams[0]?.team?.shortDisplayName || teams[0]?.team?.abbreviation || awayTeamName || 'Away'}
                      </th>
                      <th style={{ textAlign: 'center', padding: '4px 6px', width: '30%' }}>
                        {teams[1]?.team?.shortDisplayName || teams[1]?.team?.abbreviation || homeTeamName || 'Home'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamStatRows.map((row, idx) => (
                      <tr key={idx} style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                        backgroundColor: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.01)' : 'transparent'
                      }}>
                        <td style={{ padding: '5px 6px', color: 'rgba(255, 255, 255, 0.7)' }}>{row.label}</td>
                        <td style={{ padding: '5px 6px', textAlign: 'center', color: '#fff', fontWeight: '500' }}>{row.away}</td>
                        <td style={{ padding: '5px 6px', textAlign: 'center', color: '#fff', fontWeight: '500' }}>{row.home}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* 2. Touchdowns Tab */}
          {!loading && activeTab === 'touchdowns' && (() => {
            const tdScorersByTeam = players.map(teamPlayerObj => {
              const rushingCat = teamPlayerObj.statistics?.find(s => s.name === 'rushing');
              const receivingCat = teamPlayerObj.statistics?.find(s => s.name === 'receiving');

              const rushTdIdx = rushingCat?.labels?.indexOf('TD') ?? 3;
              const recTdIdx = receivingCat?.labels?.indexOf('TD') ?? 3;

              const scorersMap = new Map();

              // Check rushing TDs
              if (rushingCat && rushTdIdx !== -1) {
                (rushingCat.athletes || []).forEach(a => {
                  const tdCount = parseInt(a.stats?.[rushTdIdx], 10) || 0;
                  if (tdCount > 0) {
                    const id = a.athlete?.id || a.athlete?.displayName;
                    scorersMap.set(id, {
                      athlete: a.athlete,
                      rushingTDs: tdCount,
                      receivingTDs: 0
                    });
                  }
                });
              }

              // Check receiving TDs
              if (receivingCat && recTdIdx !== -1) {
                (receivingCat.athletes || []).forEach(a => {
                  const tdCount = parseInt(a.stats?.[recTdIdx], 10) || 0;
                  if (tdCount > 0) {
                    const id = a.athlete?.id || a.athlete?.displayName;
                    const existing = scorersMap.get(id) || { athlete: a.athlete, rushingTDs: 0, receivingTDs: 0 };
                    existing.receivingTDs = tdCount;
                    scorersMap.set(id, existing);
                  }
                });
              }

              const scorers = Array.from(scorersMap.values()).map(s => ({
                ...s,
                totalTDs: s.rushingTDs + s.receivingTDs
              })).sort((a, b) => b.totalTDs - a.totalTDs);

              return {
                team: teamPlayerObj.team,
                scorers
              };
            });

            const hasAnyTDs = tdScorersByTeam.some(t => t.scorers.length > 0);

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {!hasAnyTDs ? (
                  <div style={{ textAlign: 'center', color: '#888', padding: '12px' }}>
                    No rushing or receiving touchdowns recorded in this game yet.
                  </div>
                ) : (
                  tdScorersByTeam.map(tObj => (
                    <div key={tObj.team?.id || tObj.team?.displayName}>
                      <div style={{
                        fontWeight: 'bold',
                        color: '#4d7cff',
                        marginBottom: '6px',
                        fontSize: '0.85em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        {tObj.team?.logo && (
                          <img src={tObj.team.logo} alt="" style={{ height: '14px', width: '14px', objectFit: 'contain' }} />
                        )}
                        {tObj.team?.displayName} ({tObj.scorers.reduce((sum, s) => sum + s.totalTDs, 0)} TDs)
                      </div>

                      {tObj.scorers.length === 0 ? (
                        <div style={{ color: '#666', fontSize: '0.8em', fontStyle: 'italic', paddingLeft: '4px' }}>
                          No touchdowns
                        </div>
                      ) : (
                        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', maxWidth: '100%', minWidth: 0 }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82em' }}>
                            <thead>
                              <tr style={{ color: 'rgba(255, 255, 255, 0.4)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                                <th style={{ textAlign: 'left', padding: '4px 6px', fontWeight: 'normal' }}>Player</th>
                                <th style={{ textAlign: 'center', padding: '4px 6px', fontWeight: 'normal' }}>Rush</th>
                                <th style={{ textAlign: 'center', padding: '4px 6px', fontWeight: 'normal' }}>Rec</th>
                                <th style={{ textAlign: 'right', padding: '4px 6px', fontWeight: 'bold' }}>Total</th>
                                <th style={{ textAlign: 'center', padding: '4px 6px' }}>Track</th>
                              </tr>
                            </thead>
                            <tbody>
                              {tObj.scorers.map(s => (
                                <tr key={s.athlete?.id || s.athlete?.displayName} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                                  <td style={{ padding: '5px 6px', color: '#fff', whiteSpace: 'nowrap' }}>
                                    <span style={{ fontWeight: '600' }}>{s.athlete?.shortName || s.athlete?.displayName || 'Unknown'}</span>
                                    {s.athlete?.jersey && <span style={{ color: '#888', marginLeft: '4px' }}>#{s.athlete.jersey}</span>}
                                    {s.athlete?.position?.abbreviation && (
                                      <span style={{ color: 'rgba(255,255,255,0.4)', marginLeft: '4px', fontSize: '0.85em' }}>
                                        ({s.athlete.position.abbreviation})
                                      </span>
                                    )}
                                  </td>
                                  <td style={{ textAlign: 'center', padding: '5px 6px', color: s.rushingTDs > 0 ? '#4caf50' : '#666', fontWeight: s.rushingTDs > 0 ? 'bold' : 'normal' }}>
                                    {s.rushingTDs || '—'}
                                  </td>
                                  <td style={{ textAlign: 'center', padding: '5px 6px', color: s.receivingTDs > 0 ? '#4caf50' : '#666', fontWeight: s.receivingTDs > 0 ? 'bold' : 'normal' }}>
                                    {s.receivingTDs || '—'}
                                  </td>
                                  <td style={{ textAlign: 'right', padding: '5px 6px', color: '#f1c40f', fontWeight: 'bold', fontSize: '1.05em' }}>
                                    {s.totalTDs}
                                  </td>
                                  <td style={{ padding: '5px 6px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                    <div style={{ display: 'inline-flex', gap: '3px' }}>
                                      <button
                                        type="button"
                                        onClick={() => addCandidate(s.athlete, tObj.team, 'heisman')}
                                        style={{
                                          padding: '2px 5px',
                                          fontSize: '0.7em',
                                          borderRadius: '4px',
                                          backgroundColor: 'rgba(241, 196, 15, 0.15)',
                                          border: '1px solid rgba(241, 196, 15, 0.35)',
                                          color: '#f1c40f',
                                          cursor: 'pointer',
                                          fontWeight: 'bold',
                                          whiteSpace: 'nowrap'
                                        }}
                                        title="Add to Heisman Watch"
                                      >
                                        +H
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => addCandidate(s.athlete, tObj.team, 'liability')}
                                        style={{
                                          padding: '2px 5px',
                                          fontSize: '0.7em',
                                          borderRadius: '4px',
                                          backgroundColor: 'rgba(231, 76, 60, 0.15)',
                                          border: '1px solid rgba(231, 76, 60, 0.35)',
                                          color: '#e74c3c',
                                          cursor: 'pointer',
                                          fontWeight: 'bold',
                                          whiteSpace: 'nowrap'
                                        }}
                                        title="Add to Liability Watch"
                                      >
                                        +L
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            );
          })()}

          {/* 3. Player Stats Tabs (Passing, Rushing, Receiving, Defense) */}
          {!loading && activeTab !== 'team' && activeTab !== 'touchdowns' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {players.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#666', padding: '12px' }}>Player stats not available yet.</div>
              ) : (
                players.map(teamPlayerObj => {
                  const statCategory = teamPlayerObj.statistics?.find(s => s.name === activeTab);
                  const labels = statCategory?.labels || [];
                  const athletes = statCategory?.athletes || [];

                  return (
                    <div key={teamPlayerObj.team?.id || teamPlayerObj.team?.displayName}>
                      <div style={{
                        fontWeight: 'bold',
                        color: '#4d7cff',
                        marginBottom: '4px',
                        fontSize: '0.85em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        {teamPlayerObj.team?.logo && (
                          <img src={teamPlayerObj.team.logo} alt="" style={{ height: '14px', width: '14px', objectFit: 'contain' }} />
                        )}
                        {teamPlayerObj.team?.displayName}
                      </div>

                      {athletes.length === 0 ? (
                        <div style={{ color: '#666', fontSize: '0.8em', fontStyle: 'italic' }}>No stats recorded</div>
                      ) : (
                        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', maxWidth: '100%', minWidth: 0 }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8em' }}>
                            <thead>
                              <tr style={{ color: 'rgba(255, 255, 255, 0.4)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                                <th style={{ textAlign: 'left', padding: '3px 6px', fontWeight: 'normal' }}>Athlete</th>
                                {labels.map((l, i) => (
                                  <th key={i} style={{ textAlign: 'right', padding: '3px 6px', fontWeight: 'normal' }}>{l}</th>
                                ))}
                                <th style={{ textAlign: 'center', padding: '3px 6px' }}>Track</th>
                              </tr>
                            </thead>
                            <tbody>
                              {athletes.map((a, aIdx) => (
                                <tr key={a.athlete?.id || aIdx} style={{
                                  borderBottom: '1px solid rgba(255, 255, 255, 0.03)'
                                }}>
                                  <td style={{ padding: '4px 6px', color: '#fff', whiteSpace: 'nowrap' }}>
                                    <span style={{ fontWeight: '600' }}>{a.athlete?.shortName || a.athlete?.displayName || 'Unknown'}</span>
                                    {a.athlete?.jersey && <span style={{ color: '#888', marginLeft: '4px' }}>#{a.athlete.jersey}</span>}
                                  </td>
                                  {(a.stats || []).map((st, stIdx) => (
                                    <td key={stIdx} style={{ textAlign: 'right', padding: '4px 6px', color: '#ccc', fontVariantNumeric: 'tabular-nums' }}>
                                      {st}
                                    </td>
                                  ))}
                                  <td style={{ padding: '4px 6px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                    <div style={{ display: 'inline-flex', gap: '3px' }}>
                                      <button
                                        type="button"
                                        onClick={() => addCandidate(a.athlete, teamPlayerObj.team, 'heisman')}
                                        style={{
                                          padding: '2px 5px',
                                          fontSize: '0.7em',
                                          borderRadius: '4px',
                                          backgroundColor: 'rgba(241, 196, 15, 0.15)',
                                          border: '1px solid rgba(241, 196, 15, 0.35)',
                                          color: '#f1c40f',
                                          cursor: 'pointer',
                                          fontWeight: 'bold',
                                          whiteSpace: 'nowrap'
                                        }}
                                        title="Add to Heisman Watch"
                                      >
                                        +H
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => addCandidate(a.athlete, teamPlayerObj.team, 'liability')}
                                        style={{
                                          padding: '2px 5px',
                                          fontSize: '0.7em',
                                          borderRadius: '4px',
                                          backgroundColor: 'rgba(231, 76, 60, 0.15)',
                                          border: '1px solid rgba(231, 76, 60, 0.35)',
                                          color: '#e74c3c',
                                          cursor: 'pointer',
                                          fontWeight: 'bold',
                                          whiteSpace: 'nowrap'
                                        }}
                                        title="Add to Liability Watch"
                                      >
                                        +L
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BoxScore;
