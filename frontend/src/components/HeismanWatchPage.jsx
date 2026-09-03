import React, { useState, useEffect } from 'react';
import { Trophy, Award, TrendingUp, Sparkles, RefreshCw, Calendar, Flame, Shield, Activity, Target } from 'lucide-react';
import useIsMobile from '../hooks/useIsMobile';

const DEFAULT_CANDIDATE = {
  id: '4870607',
  name: 'Jackson Arnold',
  jersey: '11',
  position: 'Quarterback',
  team: 'UNLV Rebels',
  teamShort: 'UNLV',
  teamId: '2439',
  teamLogo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2439.png',
  teamColor: '#b10202',
  headshot: 'https://a.espncdn.com/i/headshots/college-football/players/full/4870607.png',
  height: `6' 1"`,
  weight: '220 lbs',
  classYear: 'Senior',
  hometown: 'Denton, TX',
  heismanRank: '#1 Contender'
};

const HeismanWatchPage = ({ selectedSeason = '2026' }) => {
  const [candidates, setCandidates] = useState(() => {
    try {
      const saved = localStorage.getItem('tracked_heisman_candidates');
      const parsed = saved ? JSON.parse(saved) : [];
      if (!parsed.some(p => p.id === DEFAULT_CANDIDATE.id)) {
        parsed.unshift({
          id: DEFAULT_CANDIDATE.id,
          name: DEFAULT_CANDIDATE.name,
          jersey: DEFAULT_CANDIDATE.jersey,
          position: DEFAULT_CANDIDATE.position,
          teamName: DEFAULT_CANDIDATE.team,
          teamId: DEFAULT_CANDIDATE.teamId,
          teamLogo: DEFAULT_CANDIDATE.teamLogo
        });
      }
      return parsed;
    } catch (e) {
      return [{
        id: DEFAULT_CANDIDATE.id,
        name: DEFAULT_CANDIDATE.name,
        jersey: DEFAULT_CANDIDATE.jersey,
        position: DEFAULT_CANDIDATE.position,
        teamName: DEFAULT_CANDIDATE.team,
        teamId: DEFAULT_CANDIDATE.teamId,
        teamLogo: DEFAULT_CANDIDATE.teamLogo
      }];
    }
  });

  const [activeCandidateId, setActiveCandidateId] = useState(DEFAULT_CANDIDATE.id);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'passing', 'rushing'
  const [gameLogs, setGameLogs] = useState([]);
  const [seasonTotals, setSeasonTotals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isMobile = useIsMobile();

  const activeCandidate = candidates.find(c => c.id === activeCandidateId) || candidates[0] || DEFAULT_CANDIDATE;

  useEffect(() => {
    localStorage.setItem('tracked_heisman_candidates', JSON.stringify(candidates));
  }, [candidates]);

  const fetchAthleteStats = async () => {
    if (!activeCandidate) return;
    setLoading(true);
    try {
      const teamId = activeCandidate.teamId || '2439';
      const athleteId = activeCandidate.id || '4870607';

      // 1. Fetch team schedule
      const schedRes = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/${teamId}/schedule?season=${selectedSeason}`);
      const schedData = await schedRes.json();
      const events = schedData.events || [];

      // 2. Fetch box scores for completed / live games to compile live game-by-game logs
      const logs = [];
      let totalComp = 0;
      let totalAtt = 0;
      let totalPassYds = 0;
      let totalPassTD = 0;
      let totalInt = 0;
      let totalCarries = 0;
      let totalRushYds = 0;
      let totalRushTD = 0;
      let totalRec = 0;
      let totalRecYds = 0;
      let totalRecTD = 0;

      for (const ev of events) {
        const comp = ev.competitions?.[0];
        const status = comp?.status?.type;
        const opponentComp = comp?.competitors?.find(c => c.team?.id !== teamId);
        const playerTeamComp = comp?.competitors?.find(c => c.team?.id === teamId);
        const isHome = playerTeamComp?.homeAway === 'home';

        let gameStats = null;

        if (status?.completed || status?.state === 'in') {
          try {
            const summaryRes = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/college-football/summary?event=${ev.id}`);
            if (summaryRes.ok) {
              const summaryData = await summaryRes.json();
              const teamPlayers = summaryData.boxscore?.players?.find(p => p.team?.id === teamId);
              
              const passCat = teamPlayers?.statistics?.find(s => s.name === 'passing');
              const rushCat = teamPlayers?.statistics?.find(s => s.name === 'rushing');
              const recCat = teamPlayers?.statistics?.find(s => s.name === 'receiving');

              const passAthlete = passCat?.athletes?.find(a => a.athlete?.id === athleteId || a.athlete?.displayName === activeCandidate.name);
              const rushAthlete = rushCat?.athletes?.find(a => a.athlete?.id === athleteId || a.athlete?.displayName === activeCandidate.name);
              const recAthlete = recCat?.athletes?.find(a => a.athlete?.id === athleteId || a.athlete?.displayName === activeCandidate.name);

              if (passAthlete || rushAthlete || recAthlete) {
                const cAtt = passAthlete?.stats?.[0]?.split('/') || ['0', '0'];
                const compCount = parseInt(cAtt[0], 10) || 0;
                const attCount = parseInt(cAtt[1], 10) || 0;
                const pYards = parseInt(passAthlete?.stats?.[1], 10) || 0;
                const pTD = parseInt(passAthlete?.stats?.[3], 10) || 0;
                const pInt = parseInt(passAthlete?.stats?.[4], 10) || 0;

                const rCar = parseInt(rushAthlete?.stats?.[0], 10) || 0;
                const rYards = parseInt(rushAthlete?.stats?.[1], 10) || 0;
                const rTD = parseInt(rushAthlete?.stats?.[3], 10) || 0;

                const recCount = parseInt(recAthlete?.stats?.[0], 10) || 0;
                const recYds = parseInt(recAthlete?.stats?.[1], 10) || 0;
                const recTD = parseInt(recAthlete?.stats?.[3], 10) || 0;

                totalComp += compCount;
                totalAtt += attCount;
                totalPassYds += pYards;
                totalPassTD += pTD;
                totalInt += pInt;
                totalCarries += rCar;
                totalRushYds += rYards;
                totalRushTD += rTD;
                totalRec += recCount;
                totalRecYds += recYds;
                totalRecTD += recTD;

                gameStats = {
                  played: true,
                  comp: compCount,
                  att: attCount,
                  passYds: pYards,
                  passTD: pTD,
                  int: pInt,
                  carries: rCar,
                  rushYds: rYards,
                  rushTD: rTD,
                  rec: recCount,
                  recYds,
                  recTD
                };
              }
            }
          } catch (err) {
            console.error(`Failed to load boxscore for game ${ev.id}`, err);
          }
        }

        logs.push({
          gameId: ev.id,
          date: ev.date,
          name: ev.name,
          opponent: opponentComp?.team?.displayName || 'Opponent',
          opponentLogo: opponentComp?.team?.logo || opponentComp?.team?.logos?.[0]?.href,
          opponentRank: opponentComp?.curatedRank?.current <= 25 ? opponentComp.curatedRank.current : null,
          isHome,
          isCompleted: !!status?.completed,
          isLive: status?.state === 'in',
          statusText: status?.shortDetail || status?.description,
          stats: gameStats
        });
      }

      setGameLogs(logs);

      const gamesPlayed = logs.filter(l => l.stats?.played).length;
      setSeasonTotals({
        gamesPlayed,
        comp: totalComp,
        att: totalAtt,
        compPct: totalAtt > 0 ? ((totalComp / totalAtt) * 100).toFixed(1) : '0.0',
        passYds: totalPassYds,
        passTD: totalPassTD,
        int: totalInt,
        carries: totalCarries,
        rushYds: totalRushYds,
        rushTD: totalRushTD,
        totalYds: totalPassYds + totalRushYds + totalRecYds,
        totalTD: totalPassTD + totalRushTD + totalRecTD
      });

    } catch (err) {
      console.error('Failed to load candidate stats', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAthleteStats();
  }, [activeCandidateId, selectedSeason]);

  const handleRemoveCandidate = (id, e) => {
    e.stopPropagation();
    if (id === DEFAULT_CANDIDATE.id) return; // Keep Jackson Arnold as primary
    const next = candidates.filter(c => c.id !== id);
    setCandidates(next);
    if (activeCandidateId === id) {
      setActiveCandidateId(DEFAULT_CANDIDATE.id);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '12px' : '20px' }}>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: '12px',
        marginBottom: '24px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        paddingBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f1c40f',
            color: '#1a1a2e',
            borderRadius: '8px',
            padding: '6px 12px',
            fontWeight: 'bold',
            fontSize: '0.9em',
            gap: '6px',
            boxShadow: '0 0 14px rgba(241, 196, 15, 0.4)'
          }}>
            <Trophy size={18} /> HEISMAN CANDIDATE
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: isMobile ? '1.4rem' : '1.9rem', fontWeight: 'bold' }}>
              Heisman Trophy Watch
            </h1>
            <span style={{ fontSize: '0.85em', color: 'rgba(255, 255, 255, 0.55)' }}>
              Tracking the top Heisman Trophy candidate: season stats, splits & game-by-game game log
            </span>
          </div>
        </div>

        <button
          onClick={fetchAthleteStats}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(241, 196, 15, 0.15)',
            border: '1px solid rgba(241, 196, 15, 0.35)',
            color: '#f1c40f',
            padding: '7px 14px',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '0.85em',
            fontWeight: 'bold'
          }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Refreshing Stats...' : 'Refresh Stats'}
        </button>
      </div>

      {/* Tracked Candidates Switcher */}
      {candidates.length > 1 && (
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
          {candidates.map(c => (
            <div
              key={c.id}
              onClick={() => setActiveCandidateId(c.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '5px 12px',
                borderRadius: '20px',
                cursor: 'pointer',
                backgroundColor: activeCandidateId === c.id ? 'rgba(241, 196, 15, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                border: activeCandidateId === c.id ? '1px solid #f1c40f' : '1px solid rgba(255, 255, 255, 0.1)',
                color: activeCandidateId === c.id ? '#fff' : '#aaa',
                fontSize: '0.85em',
                fontWeight: activeCandidateId === c.id ? 'bold' : 'normal'
              }}
            >
              {c.teamLogo && <img src={c.teamLogo} alt="" style={{ height: '16px', width: '16px', objectFit: 'contain' }} />}
              <span>{c.name}</span>
              {c.jersey && <span style={{ opacity: 0.6 }}>#{c.jersey}</span>}
              {c.id !== DEFAULT_CANDIDATE.id && (
                <button
                  type="button"
                  onClick={(e) => handleRemoveCandidate(c.id, e)}
                  title="Remove candidate"
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
              )}
            </div>
          ))}
        </div>
      )}

      {/* Featured Candidate Hero Banner */}
      <div style={{
        backgroundColor: '#1a1f2c',
        borderRadius: '16px',
        border: '1px solid rgba(241, 196, 15, 0.3)',
        padding: isMobile ? '16px' : '24px',
        marginBottom: '24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'center' : 'flex-start',
          gap: '24px',
          position: 'relative',
          zIndex: 1
        }}>
          {/* Headshot / Jersey Container */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              backgroundColor: activeCandidate.teamColor || '#1f1f1f',
              border: '3px solid #f1c40f',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(241, 196, 15, 0.3)'
            }}>
              <img
                src={activeCandidate.headshot || activeCandidate.teamLogo || DEFAULT_CANDIDATE.headshot}
                alt={activeCandidate.name}
                onError={(e) => { e.target.onerror = null; e.target.src = activeCandidate.teamLogo || DEFAULT_CANDIDATE.teamLogo; }}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            {activeCandidate.jersey && (
              <span style={{
                position: 'absolute',
                bottom: '-4px',
                right: '4px',
                backgroundColor: '#f1c40f',
                color: '#1a1a2e',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '0.75em',
                fontWeight: 'bold'
              }}>
                #{activeCandidate.jersey}
              </span>
            )}
          </div>

          {/* Player Info */}
          <div style={{ flex: 1, textAlign: isMobile ? 'center' : 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: isMobile ? 'center' : 'flex-start', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 'bold', color: '#fff' }}>
                {activeCandidate.name}
              </h2>
              <span style={{
                backgroundColor: 'rgba(241, 196, 15, 0.2)',
                color: '#f1c40f',
                border: '1px solid rgba(241, 196, 15, 0.4)',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '0.78em',
                fontWeight: 'bold'
              }}>
                {activeCandidate.heismanRank || 'Candidate'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: isMobile ? 'center' : 'flex-start', marginTop: '6px', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9em' }}>
              {activeCandidate.teamLogo && <img src={activeCandidate.teamLogo} alt="" style={{ height: '20px', width: '20px', objectFit: 'contain' }} />}
              <span style={{ fontWeight: '600', color: '#fff' }}>{activeCandidate.teamName || activeCandidate.team}</span>
              {activeCandidate.position && (
                <>
                  <span>•</span>
                  <span>{activeCandidate.position}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Season Stat Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(6, 1fr)',
          gap: '12px',
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75em', color: '#888', textTransform: 'uppercase' }}>Passing YDS</span>
            <div style={{ fontSize: '1.3em', fontWeight: 'bold', color: '#fff', marginTop: '2px' }}>
              {seasonTotals?.passYds ?? 0}
            </div>
          </div>

          <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75em', color: '#888', textTransform: 'uppercase' }}>Pass TD / INT</span>
            <div style={{ fontSize: '1.3em', fontWeight: 'bold', color: '#4caf50', marginTop: '2px' }}>
              {seasonTotals?.passTD ?? 0} <span style={{ color: '#888', fontSize: '0.8em' }}>/</span> <span style={{ color: '#e74c3c' }}>{seasonTotals?.int ?? 0}</span>
            </div>
          </div>

          <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75em', color: '#888', textTransform: 'uppercase' }}>Comp / Att</span>
            <div style={{ fontSize: '1.3em', fontWeight: 'bold', color: '#fff', marginTop: '2px' }}>
              {seasonTotals?.comp ?? 0}/{seasonTotals?.att ?? 0} <span style={{ fontSize: '0.75em', color: '#4d7cff' }}>({seasonTotals?.compPct ?? '0.0'}%)</span>
            </div>
          </div>

          <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75em', color: '#888', textTransform: 'uppercase' }}>Rushing YDS</span>
            <div style={{ fontSize: '1.3em', fontWeight: 'bold', color: '#fff', marginTop: '2px' }}>
              {seasonTotals?.rushYds ?? 0}
            </div>
          </div>

          <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75em', color: '#888', textTransform: 'uppercase' }}>Rush TDs</span>
            <div style={{ fontSize: '1.3em', fontWeight: 'bold', color: '#f1c40f', marginTop: '2px' }}>
              {seasonTotals?.rushTD ?? 0}
            </div>
          </div>

          <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75em', color: '#888', textTransform: 'uppercase' }}>Total Touchdowns</span>
            <div style={{ fontSize: '1.3em', fontWeight: 'bold', color: '#f1c40f', marginTop: '2px' }}>
              {seasonTotals?.totalTD ?? 0}
            </div>
          </div>
        </div>
      </div>

      {/* Game By Game Log Table Section */}
      <div style={{
        backgroundColor: '#1a1f2c',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '18px',
        boxShadow: '0 4px 18px rgba(0, 0, 0, 0.25)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '12px',
          marginBottom: '16px'
        }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} style={{ color: '#f1c40f' }} /> {selectedSeason} Game-by-Game Log
          </h3>
          <span style={{ fontSize: '0.8em', color: '#888' }}>
            Updated with ESPN Box Scores
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88em' }}>
            <thead>
              <tr style={{
                backgroundColor: 'rgba(0, 0, 0, 0.35)',
                color: 'rgba(255, 255, 255, 0.7)',
                textAlign: 'center',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <th style={{ padding: '10px 12px', textAlign: 'left' }}>Date</th>
                <th style={{ padding: '10px 12px', textAlign: 'left' }}>Opponent</th>
                <th style={{ padding: '10px 12px' }}>Status</th>
                <th style={{ padding: '10px 12px' }}>C/ATT</th>
                <th style={{ padding: '10px 12px' }}>Pass YDS</th>
                <th style={{ padding: '10px 12px' }}>Pass TD</th>
                <th style={{ padding: '10px 12px' }}>INT</th>
                <th style={{ padding: '10px 12px' }}>Rush CAR</th>
                <th style={{ padding: '10px 12px' }}>Rush YDS</th>
                <th style={{ padding: '10px 12px' }}>Rush TD</th>
                <th style={{ padding: '10px 12px', color: '#f1c40f', fontWeight: 'bold' }}>Total TD</th>
              </tr>
            </thead>
            <tbody>
              {gameLogs.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ padding: '24px', textAlign: 'center', color: '#888' }}>
                    {loading ? 'Loading game logs...' : 'No game logs available for this season.'}
                  </td>
                </tr>
              ) : (
                gameLogs.map((log, idx) => {
                  const hasStats = log.stats && log.stats.played;
                  const dateFormatted = log.date ? new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—';
                  const totalTD = hasStats ? (log.stats.passTD + log.stats.rushTD) : 0;

                  return (
                    <tr
                      key={log.gameId || idx}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        backgroundColor: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.01)' : 'transparent',
                        textAlign: 'center'
                      }}
                    >
                      <td style={{ padding: '12px', textAlign: 'left', fontWeight: '500', color: '#fff' }}>
                        <div>{dateFormatted}</div>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#fff' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#888', fontSize: '0.85em' }}>{log.isHome ? 'vs' : '@'}</span>
                          {log.opponentLogo && <img src={log.opponentLogo} alt="" style={{ height: '18px', width: '18px', objectFit: 'contain' }} />}
                          <span>{log.opponent}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          backgroundColor: log.isLive ? 'rgba(207, 10, 44, 0.25)' : log.isCompleted ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                          color: log.isLive ? '#ff4d4d' : log.isCompleted ? '#4caf50' : '#888',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.8em',
                          fontWeight: 'bold'
                        }}>
                          {log.isLive ? 'LIVE' : log.isCompleted ? 'FINAL' : 'Upcoming'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: '#ddd' }}>
                        {hasStats ? `${log.stats.comp}/${log.stats.att}` : '—'}
                      </td>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: hasStats ? '#fff' : '#888' }}>
                        {hasStats ? log.stats.passYds : '—'}
                      </td>
                      <td style={{ padding: '12px', color: hasStats && log.stats.passTD > 0 ? '#4caf50' : '#888', fontWeight: 'bold' }}>
                        {hasStats ? log.stats.passTD : '—'}
                      </td>
                      <td style={{ padding: '12px', color: hasStats && log.stats.int > 0 ? '#e74c3c' : '#888' }}>
                        {hasStats ? log.stats.int : '—'}
                      </td>
                      <td style={{ padding: '12px', color: '#ddd' }}>
                        {hasStats ? log.stats.carries : '—'}
                      </td>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: hasStats ? '#fff' : '#888' }}>
                        {hasStats ? log.stats.rushYds : '—'}
                      </td>
                      <td style={{ padding: '12px', color: hasStats && log.stats.rushTD > 0 ? '#4caf50' : '#888', fontWeight: 'bold' }}>
                        {hasStats ? log.stats.rushTD : '—'}
                      </td>
                      <td style={{ padding: '12px', color: '#f1c40f', fontWeight: 'bold', fontSize: '1.05em' }}>
                        {hasStats ? totalTD : '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HeismanWatchPage;
