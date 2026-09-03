import React, { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw, Trash2, Calendar, AlertTriangle, ExternalLink } from 'lucide-react';
import useIsMobile from '../hooks/useIsMobile';

const LiabilityPage = ({ selectedSeason = '2026' }) => {
  const [liabilities, setLiabilities] = useState(() => {
    try {
      const saved = localStorage.getItem('tracked_liabilities');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [activePlayerId, setActivePlayerId] = useState(null);
  const [selectedPlayerObj, setSelectedPlayerObj] = useState(null);
  const [playerSchedule, setPlayerSchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    localStorage.setItem('tracked_liabilities', JSON.stringify(liabilities));
  }, [liabilities]);

  useEffect(() => {
    if (liabilities.length > 0 && !activePlayerId) {
      setActivePlayerId(liabilities[0].id);
    }
  }, [liabilities]);

  const loadPlayerData = async () => {
    if (!activePlayerId) return;
    const current = liabilities.find(p => p.id === activePlayerId);
    if (!current) return;
    setSelectedPlayerObj(current);

    if (!current.teamId) return;
    setLoading(true);
    try {
      const schedRes = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/${current.teamId}/schedule?season=${selectedSeason}`);
      const schedData = await schedRes.json();
      const events = schedData.events || [];

      const logs = [];
      for (const ev of events) {
        const comp = ev.competitions?.[0];
        const status = comp?.status?.type;
        const opponentComp = comp?.competitors?.find(c => c.team?.id !== current.teamId);
        const playerTeamComp = comp?.competitors?.find(c => c.team?.id === current.teamId);
        const isHome = playerTeamComp?.homeAway === 'home';

        let gameStats = null;
        if (status?.completed || status?.state === 'in') {
          try {
            const summaryRes = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/college-football/summary?event=${ev.id}`);
            if (summaryRes.ok) {
              const summary = await summaryRes.json();
              const teamPlayerObj = summary.boxscore?.players?.find(p => p.team?.id === current.teamId);

              // Gather passing, rushing, receiving, fumbles, defense
              const passCat = teamPlayerObj?.statistics?.find(s => s.name === 'passing');
              const rushCat = teamPlayerObj?.statistics?.find(s => s.name === 'rushing');
              const recCat = teamPlayerObj?.statistics?.find(s => s.name === 'receiving');
              const defCat = teamPlayerObj?.statistics?.find(s => s.name === 'defensive');
              const fumCat = teamPlayerObj?.statistics?.find(s => s.name === 'fumbles');

              const passA = passCat?.athletes?.find(a => a.athlete?.id === current.id || a.athlete?.displayName === current.name);
              const rushA = rushCat?.athletes?.find(a => a.athlete?.id === current.id || a.athlete?.displayName === current.name);
              const recA = recCat?.athletes?.find(a => a.athlete?.id === current.id || a.athlete?.displayName === current.name);
              const defA = defCat?.athletes?.find(a => a.athlete?.id === current.id || a.athlete?.displayName === current.name);
              const fumA = fumCat?.athletes?.find(a => a.athlete?.id === current.id || a.athlete?.displayName === current.name);

              if (passA || rushA || recA || defA || fumA) {
                gameStats = {
                  played: true,
                  passYds: passA?.stats?.[1] || 0,
                  passTD: passA?.stats?.[3] || 0,
                  passInt: passA?.stats?.[4] || 0,
                  rushYds: rushA?.stats?.[1] || 0,
                  rushTD: rushA?.stats?.[3] || 0,
                  recYds: recA?.stats?.[1] || 0,
                  recTD: recA?.stats?.[3] || 0,
                  fumblesLost: fumA?.stats?.[1] || 0,
                  tackles: defA?.stats?.[0] || 0,
                  sacks: defA?.stats?.[2] || 0
                };
              }
            }
          } catch (err) {
            console.error(err);
          }
        }

        logs.push({
          gameId: ev.id,
          date: ev.date,
          name: ev.name,
          opponent: opponentComp?.team?.displayName || 'Opponent',
          opponentLogo: opponentComp?.team?.logo || opponentComp?.team?.logos?.[0]?.href,
          isHome,
          isCompleted: !!status?.completed,
          isLive: status?.state === 'in',
          statusText: status?.shortDetail || status?.description,
          stats: gameStats
        });
      }
      setPlayerSchedule(logs);
    } catch (e) {
      console.error('Failed to load liability player data', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPlayerData();
  }, [activePlayerId, selectedSeason]);

  const handleRemove = (id, e) => {
    e.stopPropagation();
    const next = liabilities.filter(p => p.id !== id);
    setLiabilities(next);
    if (activePlayerId === id) {
      setActivePlayerId(next.length > 0 ? next[0].id : null);
    }
  };

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
            gap: '6px'
          }}>
            <ShieldAlert size={16} /> LIABILITY WATCH
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: isMobile ? '1.4rem' : '1.8rem', fontWeight: 'bold' }}>
              Liability Player Tracking
            </h1>
            <span style={{ fontSize: '0.8em', color: 'rgba(255, 255, 255, 0.5)' }}>
              Track custom liability players added directly from any game Box Score
            </span>
          </div>
        </div>

        {selectedPlayerObj && (
          <button
            onClick={() => { setRefreshing(true); loadPlayerData(); }}
            disabled={refreshing || loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(231, 76, 60, 0.15)',
              border: '1px solid rgba(231, 76, 60, 0.35)',
              color: '#e74c3c',
              padding: '7px 14px',
              borderRadius: '6px',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              fontSize: '0.85em',
              fontWeight: 'bold'
            }}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Updating...' : 'Refresh Stats'}
          </button>
        )}
      </div>

      {/* Empty State */}
      {liabilities.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          backgroundColor: '#1a1f2c',
          borderRadius: '12px',
          border: '1px dashed rgba(255, 255, 255, 0.15)'
        }}>
          <ShieldAlert size={48} style={{ color: '#e74c3c', marginBottom: '12px' }} />
          <h3 style={{ margin: '0 0 8px 0', color: '#fff' }}>No Liability Players Tracked Yet</h3>
          <p style={{ margin: 0, color: '#888', fontSize: '0.9em', maxWidth: '500px', marginInline: 'auto' }}>
            Open any live or final game Box Score on the Picks or Live Scores page and click <strong>+Liability</strong> on any player to track their game-by-game stats here.
          </p>
        </div>
      ) : (
        <>
          {/* Tracked Player Chips */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: '20px',
            backgroundColor: '#1f1f1f',
            padding: '12px 16px',
            borderRadius: '10px',
            border: '1px solid #333'
          }}>
            {liabilities.map(p => (
              <div
                key={p.id}
                onClick={() => setActivePlayerId(p.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  backgroundColor: activePlayerId === p.id ? 'rgba(231, 76, 60, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                  border: activePlayerId === p.id ? '1px solid #e74c3c' : '1px solid rgba(255, 255, 255, 0.1)',
                  color: activePlayerId === p.id ? '#fff' : '#aaa',
                  fontSize: '0.85em',
                  fontWeight: activePlayerId === p.id ? 'bold' : 'normal'
                }}
              >
                {p.teamLogo && <img src={p.teamLogo} alt="" style={{ height: '16px', width: '16px', objectFit: 'contain' }} />}
                <span>{p.name}</span>
                {p.jersey && <span style={{ opacity: 0.6 }}>#{p.jersey}</span>}
                <button
                  type="button"
                  onClick={(e) => handleRemove(p.id, e)}
                  title="Remove player"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#888',
                    cursor: 'pointer',
                    padding: '0 2px',
                    fontSize: '1em',
                    lineHeight: 1
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Active Player Card */}
          {selectedPlayerObj && (
            <div style={{
              backgroundColor: '#1a1f2c',
              borderRadius: '16px',
              border: '1px solid rgba(231, 76, 60, 0.3)',
              padding: isMobile ? '16px' : '24px',
              marginBottom: '24px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                <div style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(231, 76, 60, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.8rem',
                  fontWeight: 'bold',
                  color: '#e74c3c'
                }}>
                  {selectedPlayerObj.name[0]}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#fff', fontWeight: 'bold' }}>{selectedPlayerObj.name}</h2>
                    {selectedPlayerObj.jersey && <span style={{ backgroundColor: '#e74c3c', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75em', fontWeight: 'bold' }}>#{selectedPlayerObj.jersey}</span>}
                    {selectedPlayerObj.position && <span style={{ color: '#aaa', fontSize: '0.85em' }}>({selectedPlayerObj.position})</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', color: 'rgba(255, 255, 255, 0.65)', fontSize: '0.85em' }}>
                    {selectedPlayerObj.teamLogo && <img src={selectedPlayerObj.teamLogo} alt="" style={{ height: '16px', width: '16px', objectFit: 'contain' }} />}
                    <span>{selectedPlayerObj.teamName}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Player Game-by-Game Schedule Table */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#888' }}>
              <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 10px auto', display: 'block', color: '#e74c3c' }} />
              Loading player game logs...
            </div>
          )}

          {!loading && playerSchedule.length > 0 && (
            <div style={{
              backgroundColor: '#1a1f2c',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              overflow: 'hidden'
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88em' }}>
                  <thead>
                    <tr style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.35)',
                      color: 'rgba(255, 255, 255, 0.7)',
                      textAlign: 'left',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <th style={{ padding: '12px 14px' }}>Date</th>
                      <th style={{ padding: '12px 14px' }}>Opponent</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center' }}>Status</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center' }}>Pass YDS/TD/INT</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center' }}>Rush YDS/TD</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center' }}>Rec YDS/TD</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center' }}>Fumbles Lost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {playerSchedule.map((log, idx) => {
                      const hasPlayed = log.stats && log.stats.played;
                      const dateFormatted = new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

                      return (
                        <tr
                          key={log.gameId || idx}
                          style={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                            backgroundColor: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.01)' : 'transparent'
                          }}
                        >
                          <td style={{ padding: '12px 14px', color: 'rgba(255, 255, 255, 0.7)' }}>{dateFormatted}</td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ color: '#888', fontSize: '0.85em' }}>{log.isHome ? 'vs' : '@'}</span>
                              {log.opponentLogo && <img src={log.opponentLogo} alt="" style={{ height: '18px', width: '18px', objectFit: 'contain' }} />}
                              <span style={{ color: '#fff' }}>{log.opponent}</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                            {log.isLive ? (
                              <span style={{ backgroundColor: '#e74c3c', color: '#fff', fontSize: '0.75em', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px' }}>LIVE</span>
                            ) : log.isCompleted ? (
                              <span style={{ color: '#aaa', fontSize: '0.85em', fontWeight: 'bold' }}>FINAL</span>
                            ) : (
                              <span style={{ color: '#666', fontSize: '0.8em' }}>Upcoming</span>
                            )}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'center', color: hasPlayed ? '#fff' : '#666' }}>
                            {hasPlayed ? `${log.stats.passYds} yds / ${log.stats.passTD} TD / ${log.stats.passInt} INT` : '—'}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'center', color: hasPlayed ? '#fff' : '#666' }}>
                            {hasPlayed ? `${log.stats.rushYds} yds / ${log.stats.rushTD} TD` : '—'}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'center', color: hasPlayed ? '#fff' : '#666' }}>
                            {hasPlayed ? `${log.stats.recYds} yds / ${log.stats.recTD} TD` : '—'}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'center', color: hasPlayed && log.stats.fumblesLost > 0 ? '#e74c3c' : '#888' }}>
                            {hasPlayed ? log.stats.fumblesLost : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LiabilityPage;
