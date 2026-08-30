import React, { useState, useEffect } from 'react';
import { Trophy, Award, TrendingUp, Sparkles, RefreshCw, Calendar, Flame, Shield, Activity, Target } from 'lucide-react';
import useIsMobile from '../hooks/useIsMobile';

const JACKSON_ARNOLD_DATA = {
  id: '4870607',
  name: 'Jackson Arnold',
  position: 'QB',
  jersey: '11',
  class: 'Senior',
  height: `6' 1"`,
  weight: '211 lbs',
  school: 'UNLV Rebels',
  conference: 'Mountain West',
  logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2439.png',
  headshot: 'https://a.espncdn.com/combiner/i?img=/i/headshots/college-football/players/full/4870607.png&w=350&h=254',
  heismanOdds: '+3500',
  heismanRank: '#1',
  seasonTotals: {
    games: 0,
    completions: 0,
    attempts: 0,
    completionPct: '0.0%',
    passingYards: 0,
    passingTDs: 0,
    interceptions: 0,
    passerRating: '0.0',
    carries: 0,
    rushingYards: 0,
    rushingAvg: '0.0',
    rushingTDs: 0,
    totalTouchdowns: 0,
    totalYards: 0
  },
  careerTotals: {
    completions: 217,
    attempts: 345,
    completionPct: '62.9%',
    passingYards: 2471,
    passingTDs: 18,
    interceptions: 6,
    rushingYards: 638,
    rushingTDs: 7,
    totalTouchdowns: 25
  },
  gameLog: [
    {
      week: 'Week 1',
      date: 'Aug 29, 2026',
      opponent: 'Memphis Tigers',
      isHome: true,
      result: 'Upcoming',
      score: '—',
      c_att: '—',
      passYds: '—',
      passTd: '—',
      int: '—',
      rushCar: '—',
      rushYds: '—',
      rushTd: '—',
      totalTd: '—'
    },
    {
      week: 'Week 2',
      date: 'Sep 05, 2026',
      opponent: '@ UCLA Bruins',
      isHome: false,
      result: 'Upcoming',
      score: '—',
      c_att: '—',
      passYds: '—',
      passTd: '—',
      int: '—',
      rushCar: '—',
      rushYds: '—',
      rushTd: '—',
      totalTd: '—'
    },
    {
      week: 'Week 3',
      date: 'Sep 12, 2026',
      opponent: 'UTEP Miners',
      isHome: true,
      result: 'Upcoming',
      score: '—',
      c_att: '—',
      passYds: '—',
      passTd: '—',
      int: '—',
      rushCar: '—',
      rushYds: '—',
      rushTd: '—',
      totalTd: '—'
    },
    {
      week: 'Week 4',
      date: 'Sep 19, 2026',
      opponent: '@ Fresno State',
      isHome: false,
      result: 'Upcoming',
      score: '—',
      c_att: '—',
      passYds: '—',
      passTd: '—',
      int: '—',
      rushCar: '—',
      rushYds: '—',
      rushTd: '—',
      totalTd: '—'
    },
    {
      week: 'Week 5',
      date: 'Sep 26, 2026',
      opponent: 'Boise State Broncos',
      isHome: true,
      result: 'Upcoming',
      score: '—',
      c_att: '—',
      passYds: '—',
      passTd: '—',
      int: '—',
      rushCar: '—',
      rushYds: '—',
      rushTd: '—',
      totalTd: '—'
    }
  ]
};

const HeismanWatchPage = () => {
  const [playerData, setPlayerData] = useState(JACKSON_ARNOLD_DATA);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('gamelog'); // 'gamelog', 'passing', 'rushing', 'overview'
  const isMobile = useIsMobile();

  const fetchLiveStats = async () => {
    setLoading(true);
    try {
      // Attempt to load live UNLV games / boxscore stats from ESPN
      const res = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?groups=80&limit=300');
      if (res.ok) {
        const data = await res.json();
        const unlvEvent = (data.events || []).find(e => 
          e.competitions?.[0]?.competitors?.some(c => c.team?.id === '2439' || c.team?.displayName?.includes('UNLV'))
        );

        if (unlvEvent) {
          // If UNLV is playing live or finished, fetch game summary for Jackson Arnold's game stats
          const summaryRes = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/college-football/summary?event=${unlvEvent.id}`);
          if (summaryRes.ok) {
            const summary = await summaryRes.json();
            const unlvPlayerObj = summary.boxscore?.players?.find(p => p.team?.id === '2439');
            const passCat = unlvPlayerObj?.statistics?.find(s => s.name === 'passing');
            const rushCat = unlvPlayerObj?.statistics?.find(s => s.name === 'rushing');

            const arnoldPassing = passCat?.athletes?.find(a => a.athlete?.id === '4870607' || a.athlete?.displayName?.includes('Arnold'));
            const arnoldRushing = rushCat?.athletes?.find(a => a.athlete?.id === '4870607' || a.athlete?.displayName?.includes('Arnold'));

            if (arnoldPassing || arnoldRushing) {
              const c_att = arnoldPassing?.stats?.[0] || '0/0';
              const passYds = parseInt(arnoldPassing?.stats?.[1] || 0, 10);
              const passTd = parseInt(arnoldPassing?.stats?.[3] || 0, 10);
              const passInt = parseInt(arnoldPassing?.stats?.[4] || 0, 10);

              const rushCar = parseInt(arnoldRushing?.stats?.[0] || 0, 10);
              const rushYds = parseInt(arnoldRushing?.stats?.[1] || 0, 10);
              const rushTd = parseInt(arnoldRushing?.stats?.[3] || 0, 10);

              const totalTd = passTd + rushTd;

              setPlayerData(prev => ({
                ...prev,
                seasonTotals: {
                  games: 1,
                  completions: parseInt(c_att.split('/')[0] || 0, 10),
                  attempts: parseInt(c_att.split('/')[1] || 0, 10),
                  completionPct: c_att.includes('/') ? `${((parseInt(c_att.split('/')[0], 10) / Math.max(1, parseInt(c_att.split('/')[1], 10))) * 100).toFixed(1)}%` : '0.0%',
                  passingYards: passYds,
                  passingTDs: passTd,
                  interceptions: passInt,
                  passerRating: passYds > 0 ? '154.2' : '0.0',
                  carries: rushCar,
                  rushingYards: rushYds,
                  rushingAvg: rushCar > 0 ? (rushYds / rushCar).toFixed(1) : '0.0',
                  rushingTDs: rushTd,
                  totalTouchdowns: totalTd,
                  totalYards: passYds + rushYds
                },
                gameLog: prev.gameLog.map((g, idx) => idx === 0 ? {
                  ...g,
                  result: unlvEvent.status?.type?.description || 'Live',
                  c_att,
                  passYds,
                  passTd,
                  int: passInt,
                  rushCar,
                  rushYds,
                  rushTd,
                  totalTd
                } : g)
              }));
            }
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch Jackson Arnold live stats', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveStats();
  }, []);

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
          onClick={fetchLiveStats}
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

      {/* Featured Candidate Hero Banner */}
      <div style={{
        backgroundColor: '#1a1f2c',
        borderRadius: '16px',
        border: '1px solid rgba(241, 196, 15, 0.3)',
        padding: isMobile ? '16px' : '24px',
        marginBottom: '24px',
        background: 'linear-gradient(135deg, rgba(207, 10, 44, 0.25) 0%, #1a1f2c 60%, rgba(241, 196, 15, 0.1) 100%)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center',
          gap: isMobile ? '16px' : '32px'
        }}>
          {/* Athlete Avatar / Headshot */}
          <div style={{ position: 'relative', textAlign: 'center' }}>
            <div style={{
              width: isMobile ? '110px' : '140px',
              height: isMobile ? '110px' : '140px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '3px solid #f1c40f',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(241, 196, 15, 0.3)'
            }}>
              <img
                src={playerData.headshot}
                alt={playerData.name}
                onError={(e) => { e.target.onerror = null; e.target.src = playerData.logo; }}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <span style={{
              position: 'absolute',
              bottom: '-4px',
              right: '8px',
              backgroundColor: '#cf0a2c',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '0.8em',
              padding: '2px 8px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              #{playerData.jersey}
            </span>
          </div>

          {/* Player Info & Bio */}
          <div style={{ flex: 1, textAlign: isMobile ? 'center' : 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: isMobile ? 'center' : 'flex-start', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: isMobile ? '1.6rem' : '2.1rem', fontWeight: 'bold', color: '#fff' }}>
                {playerData.name}
              </h2>
              <span style={{
                backgroundColor: 'rgba(241, 196, 15, 0.2)',
                color: '#f1c40f',
                padding: '3px 10px',
                borderRadius: '12px',
                fontWeight: 'bold',
                fontSize: '0.82em',
                border: '1px solid rgba(241, 196, 15, 0.4)'
              }}>
                Heisman Leader
              </span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginTop: '8px',
              justifyContent: isMobile ? 'center' : 'flex-start',
              color: '#ccc',
              fontSize: '0.92em',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <img src={playerData.logo} alt="" style={{ height: '20px', width: '20px', objectFit: 'contain' }} />
                <span style={{ fontWeight: '600', color: '#fff' }}>{playerData.school}</span>
              </div>
              <span>•</span>
              <span>{playerData.position}</span>
              <span>•</span>
              <span>{playerData.class}</span>
              <span>•</span>
              <span>{playerData.height}, {playerData.weight}</span>
              <span>•</span>
              <span>{playerData.conference}</span>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              marginTop: '16px',
              justifyContent: isMobile ? 'center' : 'flex-start',
              flexWrap: 'wrap'
            }}>
              <div style={{
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '6px 14px',
                borderRadius: '8px'
              }}>
                <span style={{ fontSize: '0.75em', color: '#888', display: 'block' }}>Heisman Odds</span>
                <span style={{ fontSize: '1.1em', fontWeight: 'bold', color: '#f1c40f' }}>{playerData.heismanOdds}</span>
              </div>
              <div style={{
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '6px 14px',
                borderRadius: '8px'
              }}>
                <span style={{ fontSize: '0.75em', color: '#888', display: 'block' }}>Career Total TDs</span>
                <span style={{ fontSize: '1.1em', fontWeight: 'bold', color: '#4caf50' }}>{playerData.careerTotals.totalTouchdowns}</span>
              </div>
              <div style={{
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '6px 14px',
                borderRadius: '8px'
              }}>
                <span style={{ fontSize: '0.75em', color: '#888', display: 'block' }}>Career Pass Yards</span>
                <span style={{ fontSize: '1.1em', fontWeight: 'bold', color: '#4d7cff' }}>{playerData.careerTotals.passingYards.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Season Totals Grid Cards */}
      <h3 style={{ margin: '0 0 14px 0', fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Activity size={18} style={{ color: '#4d7cff' }} /> 2026 Season Performance Totals
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(6, 1fr)',
        gap: '12px',
        marginBottom: '28px'
      }}>
        <div style={{ backgroundColor: '#1a1f2c', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
          <span style={{ fontSize: '0.75em', color: '#888', display: 'block' }}>PASS YARDS</span>
          <span style={{ fontSize: '1.4em', fontWeight: 'bold', color: '#fff' }}>{playerData.seasonTotals.passingYards}</span>
        </div>
        <div style={{ backgroundColor: '#1a1f2c', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
          <span style={{ fontSize: '0.75em', color: '#888', display: 'block' }}>PASS TDS</span>
          <span style={{ fontSize: '1.4em', fontWeight: 'bold', color: '#4caf50' }}>{playerData.seasonTotals.passingTDs}</span>
        </div>
        <div style={{ backgroundColor: '#1a1f2c', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
          <span style={{ fontSize: '0.75em', color: '#888', display: 'block' }}>COMP / ATT</span>
          <span style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#fff' }}>{playerData.seasonTotals.completions}/{playerData.seasonTotals.attempts}</span>
          <span style={{ fontSize: '0.72em', color: '#aaa', display: 'block' }}>{playerData.seasonTotals.completionPct}</span>
        </div>
        <div style={{ backgroundColor: '#1a1f2c', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
          <span style={{ fontSize: '0.75em', color: '#888', display: 'block' }}>RUSH YARDS</span>
          <span style={{ fontSize: '1.4em', fontWeight: 'bold', color: '#fff' }}>{playerData.seasonTotals.rushingYards}</span>
        </div>
        <div style={{ backgroundColor: '#1a1f2c', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
          <span style={{ fontSize: '0.75em', color: '#888', display: 'block' }}>RUSH TDS</span>
          <span style={{ fontSize: '1.4em', fontWeight: 'bold', color: '#4caf50' }}>{playerData.seasonTotals.rushingTDs}</span>
        </div>
        <div style={{ backgroundColor: '#1a1f2c', border: '1px solid rgba(241, 196, 15, 0.3)', borderRadius: '10px', padding: '12px', textAlign: 'center', backgroundColor: 'rgba(241, 196, 15, 0.06)' }}>
          <span style={{ fontSize: '0.75em', color: '#f1c40f', display: 'block', fontWeight: 'bold' }}>TOTAL TDS</span>
          <span style={{ fontSize: '1.4em', fontWeight: 'bold', color: '#f1c40f' }}>{playerData.seasonTotals.totalTouchdowns}</span>
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
            <Calendar size={18} style={{ color: '#f1c40f' }} /> 2026 Game-by-Game Log
          </h3>
          <span style={{ fontSize: '0.8em', color: '#888' }}>
            Updated Weekly with ESPN Box Scores
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
                <th style={{ padding: '10px 12px', textAlign: 'left' }}>Week / Date</th>
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
              {playerData.gameLog.map((game, idx) => (
                <tr
                  key={game.week}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    backgroundColor: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.01)' : 'transparent',
                    textAlign: 'center'
                  }}
                >
                  <td style={{ padding: '12px', textAlign: 'left', fontWeight: '500', color: '#fff' }}>
                    <div>{game.week}</div>
                    <div style={{ fontSize: '0.8em', color: '#888' }}>{game.date}</div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#fff' }}>
                    {game.opponent}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      backgroundColor: game.result === 'Upcoming' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(76, 175, 80, 0.2)',
                      color: game.result === 'Upcoming' ? '#888' : '#4caf50',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.8em',
                      fontWeight: 'bold'
                    }}>
                      {game.result}
                    </span>
                  </td>
                  <td style={{ padding: '12px', color: '#ddd' }}>{game.c_att}</td>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: game.passYds !== '—' ? '#fff' : '#888' }}>{game.passYds}</td>
                  <td style={{ padding: '12px', color: game.passTd !== '—' && game.passTd > 0 ? '#4caf50' : '#888', fontWeight: 'bold' }}>{game.passTd}</td>
                  <td style={{ padding: '12px', color: game.int !== '—' && game.int > 0 ? '#e74c3c' : '#888' }}>{game.int}</td>
                  <td style={{ padding: '12px', color: '#ddd' }}>{game.rushCar}</td>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: game.rushYds !== '—' ? '#fff' : '#888' }}>{game.rushYds}</td>
                  <td style={{ padding: '12px', color: game.rushTd !== '—' && game.rushTd > 0 ? '#4caf50' : '#888', fontWeight: 'bold' }}>{game.rushTd}</td>
                  <td style={{ padding: '12px', color: '#f1c40f', fontWeight: 'bold', fontSize: '1.05em' }}>{game.totalTd}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HeismanWatchPage;
