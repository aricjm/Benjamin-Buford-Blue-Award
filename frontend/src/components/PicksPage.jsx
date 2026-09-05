import React, { useState, useEffect, useRef } from 'react';
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, CloudFog, Wind, Droplets, Thermometer, CloudHail, Lock, Copy, Save, Info, AlertTriangle, TrendingUp, RefreshCw, ChevronDown, ChevronUp, Tv, Check, X, Filter } from 'lucide-react';
import useIsMobile from '../hooks/useIsMobile';
import BoxScore from './BoxScore';

const RULES = [
  'Pick the spread and/or over/under for any game each week.',
  'You may pick both the spread and the over/under for the same game — they count as separate picks.',
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>Each week you may designate one pick as your <Lock size={12} style={{ color: '#f1c40f', flexShrink: 0 }} /> Lock — your best bet of the week.</span>,
  'Only one Lock is allowed per week. Lock record is tracked separately on the leaderboard.',
  'Picks must be submitted before the game kicks off.',
];

const SITE_DETAILS = [
  'Live scores update every 5 minutes during active games.',
  'Game odds and lines update every 4 hours.',
  'Weather forecasts update daily and show conditions at kickoff (14 days in advance).',
  'Injury reports are fetched live when requested.',
];

const RulesTooltip = () => {
  const [visible, setVisible] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        onClick={() => setVisible(v => !v)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center' }}
        aria-label="Rules"
      >
        <Info size={18} />
      </button>
      {visible && (
        <>
          <div onClick={() => setVisible(false)} style={{ position: 'fixed', inset: 0, zIndex: 999 }} />
          <div style={{
            position: 'absolute', top: '100%', left: 0, zIndex: 1000, marginTop: 8,
            background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8,
            padding: '12px 16px', width: 320, boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
          }}>
            <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#f1c40f' }}>How to Pick</p>
            <ul style={{ margin: 0, paddingLeft: 18, color: 'rgba(255,255,255,0.85)', fontSize: '0.85em', lineHeight: 1.6 }}>
              {RULES.map((rule, i) => <li key={i}>{rule}</li>)}
            </ul>
            <p style={{ margin: '16px 0 8px 0', fontWeight: 'bold', color: '#4d7cff' }}>Site Details</p>
            <ul style={{ margin: 0, paddingLeft: 18, color: 'rgba(255,255,255,0.85)', fontSize: '0.85em', lineHeight: 1.6 }}>
              {SITE_DETAILS.map((detail, i) => <li key={i}>{detail}</li>)}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

const OddsMovementTooltip = ({ games = [] }) => {
  const [visible, setVisible] = useState(false);

  const formatSpreadVal = (spread) => {
    if (spread === null || spread === undefined) return '--';
    const num = Number(spread);
    if (isNaN(num)) return '--';
    if (num === 0) return 'PK';
    return num > 0 ? `+${num}` : `${num}`;
  };

  // Find games where spread or over_under moved from the opening snapshot
  const movedGames = games.map((game) => {
    const openSpread = game.open_spread_home ?? game.spread_home;
    const currentSpread = game.spread_home;
    const openOU = game.open_over_under ?? game.over_under;
    const currentOU = game.over_under;

    const spreadDiff = (currentSpread !== null && currentSpread !== undefined && openSpread !== null && openSpread !== undefined)
      ? +(currentSpread - openSpread).toFixed(1)
      : 0;

    const ouDiff = (currentOU !== null && currentOU !== undefined && openOU !== null && openOU !== undefined)
      ? +(currentOU - openOU).toFixed(1)
      : 0;

    const hasSpreadMovement = spreadDiff !== 0;
    const hasOUMovement = ouDiff !== 0;

    if (!hasSpreadMovement && !hasOUMovement) return null;

    return {
      game,
      openSpread,
      currentSpread,
      spreadDiff,
      openOU,
      currentOU,
      ouDiff,
      hasSpreadMovement,
      hasOUMovement
    };
  }).filter(Boolean);

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        onClick={() => setVisible(v => !v)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          color: '#4d7cff',
          display: 'inline-flex',
          alignItems: 'center',
          transition: 'color 0.2s, transform 0.15s'
        }}
        title="View Line Movements"
        aria-label="View Line Movements"
      >
        <TrendingUp size={15} />
      </button>

      {visible && (
        <>
          <div onClick={() => setVisible(false)} style={{ position: 'fixed', inset: 0, zIndex: 999 }} />
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            zIndex: 1000,
            marginTop: 8,
            background: '#1a1a2e',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 8,
            padding: '12px 14px',
            width: '360px',
            maxWidth: '90vw',
            boxShadow: '0 8px 28px rgba(0,0,0,0.6)',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '6px' }}>
              <span style={{ fontWeight: 'bold', color: '#4d7cff', fontSize: '0.88em' }}>
                Line Movements ({movedGames.length})
              </span>
              <span style={{ fontSize: '0.75em', color: '#888' }}>
                Opening vs. Current
              </span>
            </div>

            {movedGames.length === 0 ? (
              <div style={{ fontSize: '0.8em', color: '#aaa', padding: '10px 0', textAlign: 'center' }}>
                No line movements recorded for this week's games.
              </div>
            ) : (
              <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {movedGames.map(({ game, openSpread, currentSpread, spreadDiff, openOU, currentOU, ouDiff, hasSpreadMovement, hasOUMovement }) => (
                  <div 
                    key={game.id} 
                    style={{ 
                      backgroundColor: 'rgba(255,255,255,0.03)', 
                      padding: '7px 9px', 
                      borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.06)'
                    }}
                  >
                    <div style={{ fontSize: '0.82em', fontWeight: 'bold', color: '#fff', marginBottom: '4px' }}>
                      {game.away_team} @ {game.home_team}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.78em' }}>
                      {hasSpreadMovement && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#aaa' }}>{game.home_team.split('(')[0].trim()} Spread:</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ color: '#888' }}>{formatSpreadVal(openSpread)}</span>
                            <span style={{ color: '#555' }}>→</span>
                            <span style={{ fontWeight: 'bold', color: '#fff' }}>{formatSpreadVal(currentSpread)}</span>
                            <span style={{
                              fontWeight: 'bold',
                              color: spreadDiff > 0 ? '#4d7cff' : '#00e676',
                              backgroundColor: spreadDiff > 0 ? 'rgba(77, 124, 255, 0.15)' : 'rgba(0, 230, 118, 0.15)',
                              padding: '1px 4px',
                              borderRadius: '3px',
                              fontSize: '0.9em'
                            }}>
                              {spreadDiff > 0 ? `+${spreadDiff}` : spreadDiff}
                            </span>
                          </div>
                        </div>
                      )}

                      {hasOUMovement && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#aaa' }}>Over / Under:</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ color: '#888' }}>{openOU ?? '--'}</span>
                            <span style={{ color: '#555' }}>→</span>
                            <span style={{ fontWeight: 'bold', color: '#ffb300' }}>{currentOU ?? '--'}</span>
                            <span style={{
                              fontWeight: 'bold',
                              color: ouDiff > 0 ? '#00e676' : '#ff5252',
                              backgroundColor: ouDiff > 0 ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 82, 82, 0.15)',
                              padding: '1px 4px',
                              borderRadius: '3px',
                              fontSize: '0.9em'
                            }}>
                              {ouDiff > 0 ? `+${ouDiff}` : ouDiff}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const getEffectiveSpread = (game, team, pick) => {
  if (pick && pick.selectionTeam && pick.spread !== null) {
    if (team === pick.selectionTeam) {
      return pick.spread;
    } else {
      return -pick.spread;
    }
  }
  return team === game.home_team ? game.spread_home : game.spread_away;
};

const formatSpread = (game, team, pick) => {
  const spread = getEffectiveSpread(game, team, pick);
  if (spread === null || spread === 0) return 'PK';
  return spread > 0 ? `+${spread}` : `${spread}`;
};

const getSpreadStyle = (game, team, isActive, pick) => {
  if (isActive) return { color: '#fff' };
  const spread = getEffectiveSpread(game, team, pick);
  if (spread === null || spread === 0) return {};
  return { color: spread < 0 ? '#1F1F75' : '#1F1F75', fontWeight: 'bold' };
};

const CountdownTimer = ({ commenceTime }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const start = new Date(commenceTime);
      const diff = start - now;

      if (diff <= 0) {
        setTimeLeft('Started');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      let parts = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0 || days > 0) parts.push(`${hours}h`);
      parts.push(`${minutes}m`);
      parts.push(`${seconds}s`);
      setTimeLeft(parts.join(' '));
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [commenceTime]);

  return <span className="countdown-timer" style={{ marginLeft: '10px', fontSize: '0.85em', color: '#ffcc00', fontWeight: 'bold' }}>({timeLeft})</span>;
};

const getWeatherIcon = (code, size = 28) => {
  const props = { size, strokeWidth: 1.5 };
  if (code === 0) return <Sun {...props} color="#FFD700" />;
  if (code <= 2) return <Sun {...props} color="#FFD700" style={{ opacity: 0.7 }} />;
  if (code === 3) return <Cloud {...props} color="#aaa" />;
  if (code === 45 || code === 48) return <CloudFog {...props} color="#aaa" />;
  if (code >= 51 && code <= 55) return <CloudDrizzle {...props} color="#7ec8e3" />;
  if (code >= 61 && code <= 65) return <CloudRain {...props} color="#7ec8e3" />;
  if (code >= 66 && code <= 67) return <CloudHail {...props} color="#b0d4e8" />;
  if (code >= 71 && code <= 77) return <CloudSnow {...props} color="#c8e6f5" />;
  if (code >= 80 && code <= 82) return <CloudRain {...props} color="#7ec8e3" />;
  if (code >= 85 && code <= 86) return <CloudSnow {...props} color="#c8e6f5" />;
  if (code >= 95) return <CloudLightning {...props} color="#FFD700" />;
  return <Cloud {...props} color="#aaa" />;
};

const getWeatherLabel = (code) => {
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Partly Cloudy';
  if (code === 45 || code === 48) return 'Foggy';
  if (code >= 51 && code <= 55) return 'Drizzle';
  if (code >= 61 && code <= 65) return 'Rain';
  if (code >= 66 && code <= 67) return 'Freezing Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Showers';
  if (code >= 85 && code <= 86) return 'Snow Showers';
  if (code >= 95) return 'Thunderstorms';
  return 'Cloudy';
};

function getHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // Radius of the Earth in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

const InjuryItem = ({ inj }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ fontSize: '0.75em', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px', paddingTop: '2px' }}>
      <div 
        onClick={() => setExpanded(!expanded)} 
        style={{ 
          cursor: 'pointer', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '4px',
          userSelect: 'none',
          color: '#fff'
        }}
      >
        <span style={{ fontSize: '0.8em', color: '#888', width: '10px', display: 'inline-block' }}>
          {expanded ? '▼' : '▶'}
        </span>
        <span style={{ fontWeight: 'bold' }}>{inj.player_name}</span> 
        <span style={{ color: '#aaa' }}> </span>
        <span style={{ color: '#aaa' }}>({inj.status}) </span>
        <span style={{ color: '#aaa' }}> </span>
        <span style={{ color: '#f1c40f' }}>{inj.position}</span>
        <span style={{ color: '#aaa' }}> </span>
        <span style={{ color: '#4d7cff' }}>{inj.team_name}</span>
        
        
      </div>
      {expanded && (
        <div style={{ fontSize: '0.9em', color: '#aaa', marginTop: '4px', paddingLeft: '14px', lineHeight: '1.3' }}>
          {inj.short_comment || inj.long_comment || 'No details'}
        </div>
      )}
    </div>
  );
};

const getBetterStyle = (val1, val2, higherIsBetter = true) => {
  if (val1 === null || val1 === undefined || val2 === null || val2 === undefined) return [{}, {}];
  if (val1 === val2) return [{}, {}];
  const isVal1Better = higherIsBetter ? val1 > val2 : val1 < val2;
  const betterStyle = { fontWeight: 'bold', color: '#fff' };
  const worseStyle = { color: '#888' };
  return isVal1Better ? [betterStyle, worseStyle] : [worseStyle, betterStyle];
};

const parseRecord = (recordStr) => {
  if (!recordStr) return null;
  const parts = recordStr.split('-').map(Number);
  if (parts.length < 2 || parts.some(isNaN)) return null;
  const wins = parts[0];
  const losses = parts[1];
  const total = wins + losses;
  return total > 0 ? wins / total : 0;
};

const parseTurnover = (toStr) => {
  if (!toStr) return 0;
  if (toStr.toUpperCase() === 'EVEN') return 0;
  const val = parseInt(toStr);
  return isNaN(val) ? 0 : val;
};

const countStreakWins = (streakStr) => {
  if (!streakStr) return 0;
  return (streakStr.match(/W/g) || []).length;
};

const formatSpreadValue = (spread) => {
  if (spread === null || spread === undefined) return '--';
  const num = Number(spread);
  if (isNaN(num)) return '--';
  if (num === 0) return 'PK';
  return num > 0 ? `+${num}` : `${num}`;
};

const formatOUHomeAway = (awayRecord, homeRecord) => {
  const parse = (str) => {
    if (!str) return null;
    const parts = str.split('-').map(Number);
    if (parts.length < 3 || parts.some(isNaN)) return null;
    const [overs, unders, pushes] = parts;
    const total = overs + unders;
    return { overs, unders, pushes, total, overPct: total > 0 ? overs / total : 0, underPct: total > 0 ? unders / total : 0 };
  };

  const away = parse(awayRecord);
  const home = parse(homeRecord);

  if (!away || !home) {
    return {
      awayJsx: <span>{awayRecord} (Away)</span>,
      homeJsx: <span>{homeRecord} (Home)</span>
    };
  }

  const bothOver = away.overPct > 0.51 && home.overPct > 0.51;
  const bothUnder = away.underPct > 0.51 && home.underPct > 0.51;

  const renderRecord = (rec, isAway) => {
    return (
      <span>
        <span style={{ color: bothOver ? '#4caf50' : 'inherit', fontWeight: bothOver ? 'bold' : 'inherit' }}>{rec.overs}</span>-
        <span style={{ color: bothUnder ? '#4caf50' : 'inherit', fontWeight: bothUnder ? 'bold' : 'inherit' }}>{rec.unders}</span>-
        <span>{rec.pushes}</span> {isAway ? '(Away)' : '(Home)'}
      </span>
    );
  };

  return {
    awayJsx: renderRecord(away, true),
    homeJsx: renderRecord(home, false)
  };
};

const runSavedModelOnGame = (model, game) => {
  const featureValue = (feature) => {
    const key = feature.label || feature.key;
    if ((key === 'Current Spread' || key === 'spread_home') && game.spread_home !== null && game.spread_home !== undefined) return -Number(game.spread_home);
    if (key === 'Home / Away' || key === 'home_away') return 3;
    if ((key === 'Moneyline' || key === 'moneyline') && game.home_price !== null && game.away_price !== null) return Number(game.home_price) < Number(game.away_price) ? 5 : -5;
    return null;
  };

  let margin = 0;
  if (model.type === 'quick' && model.quick) {
    const quick = model.quick;
    const direction = quick.better === 'home' ? 1 : -1;
    margin = direction * ((Number(quick.strength) - 5) * 1.8 + (Number(quick.form) - 5) * 0.8 + (Number(quick.offense) - 5) * 0.8 + (Number(quick.defense) - 5) * 0.8 + (Number(quick.qb) - 5) * 0.6) + Number(quick.environment || 0) + Number(quick.injuries || 0);
  } else {
    (model.features || []).forEach((feature) => {
      const value = featureValue(feature);
      if (value !== null) margin += value * Number(feature.weight || 0) / 100;
    });
  }

  (model.type === 'lab' ? model.rules || [] : []).forEach((rule) => {
    const value = featureValue(rule);
    if (value !== null && (rule.operator === '>' ? value > Number(rule.threshold) : value < Number(rule.threshold))) margin += Number(rule.adjustment || 0);
  });

  const spreadEdge = game.spread_home == null ? null : margin + Number(game.spread_home);
  return {
    winner: margin >= 0 ? game.home_team : game.away_team,
    confidence: Math.min(95, Math.max(50, Math.round(50 + Math.abs(margin) * 4))),
    projectedSpread: margin,
    currentSpread: game.spread_home,
    spreadEdge,
    recommendation: spreadEdge === null || Math.abs(spreadEdge) < 1 ? 'Pass' : `${spreadEdge > 0 ? game.home_team : game.away_team} spread`
  };
};

const GameIntel = ({ game, picks, selectedPlayer }) => {
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = useState(isMobile);

  useEffect(() => {
    setIsCollapsed(isMobile);
  }, [isMobile]);

  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [injuries, setInjuries] = useState(null);
  const [loadingInjuries, setLoadingInjuries] = useState(false);
  const [travelDistance, setTravelDistance] = useState(null);
  const [loadingTravel, setLoadingTravel] = useState(false);
  const [matchupStats, setMatchupStats] = useState(null);
  const [loadingMatchupStats, setLoadingMatchupStats] = useState(false);
  const [insights, setInsights] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submittingInsight, setSubmittingInsight] = useState(false);
  const [savedModels, setSavedModels] = useState([]);
  const [selectedModelId, setSelectedModelId] = useState('');
  const [modelPrediction, setModelPrediction] = useState(null);

  useEffect(() => {
    try {
      const models = JSON.parse(localStorage.getItem('bbba-models') || '[]');
      setSavedModels(Array.isArray(models) ? models.slice(0, 3) : []);
    } catch {
      setSavedModels([]);
    }
  }, []);

  const runSelectedModel = () => {
    const selectedModel = savedModels.find((model) => model.id === selectedModelId);
    if (selectedModel) setModelPrediction(runSavedModelOnGame(selectedModel, game));
  };

  useEffect(() => {
    const fetchInsights = async () => {
      if (!game.id) return;
      try {
        const res = await fetch(`/api/games/${game.id}/insights`);
        if (res.ok) {
          const data = await res.json();
          setInsights(data || []);
        }
      } catch (err) {
        console.error('Failed to load insights', err);
      }
    };
    fetchInsights();
  }, [game.id]);

  const handleAddInsight = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !game.id) return;
    const playerAuthor = selectedPlayer || localStorage.getItem('selectedPlayer') || 'Aric';
    setSubmittingInsight(true);
    try {
      const res = await fetch(`/api/games/${game.id}/insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player: playerAuthor,
          comment: newComment.trim()
        })
      });
      if (res.ok) {
        const data = await res.json();
        setInsights(data.insights || []);
        setNewComment('');
      }
    } catch (err) {
      console.error('Failed to submit insight', err);
    } finally {
      setSubmittingInsight(false);
    }
  };

  const fetchInjuries = async () => {
    setLoadingInjuries(true);
    try {
      const res = await fetch('/api/injuries');
      const data = await res.json();
      
      const matchTeam = (teamName, targetName) => {
        if (!teamName || !targetName) return false;
        const clean = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanTeam = clean(teamName);
        const cleanTarget = clean(targetName);
        return cleanTeam.includes(cleanTarget) || cleanTarget.includes(cleanTeam);
      };

      const filtered = data.filter(inj => 
        matchTeam(inj.team_name, game.home_team) || 
        matchTeam(inj.team_name, game.away_team)
      );
      setInjuries(filtered);
    } catch (err) {
      console.error('Failed to fetch injuries:', err);
      setInjuries([]);
    } finally {
      setLoadingInjuries(false);
    }
  };

  const fetchMatchupStats = async () => {
    setLoadingMatchupStats(true);
    try {
      const res = await fetch(`/api/matchup-stats?homeTeam=${encodeURIComponent(game.home_team)}&awayTeam=${encodeURIComponent(game.away_team)}&apiGameId=${game.api_game_id || ''}`);
      const data = await res.json();
      setMatchupStats(data);
    } catch (err) {
      console.error('Failed to fetch matchup stats:', err);
      setMatchupStats({ h2h: [], espnStats: null });
    } finally {
      setLoadingMatchupStats(false);
    }
  };

  useEffect(() => {
    const fetchWeather = async () => {
      // Calculate travel distance using away team's stadium city (run this first)
      if (game.away_stadium_city) {
        setLoadingTravel(true);
        try {
          const homeCity = game.home_stadium_city || game.home_team.split('(')[0].trim();
          const homeQuery = game.home_stadium_state ? `${homeCity}, ${game.home_stadium_state}` : homeCity;
          const awayCity = game.away_stadium_city;
          const awayQuery = game.away_stadium_state ? `${awayCity}, ${game.away_stadium_state}` : awayCity;

          const [homeGeoRes, awayGeoRes] = await Promise.all([
            fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(homeQuery)}&count=1&language=en&format=json`),
            fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(awayQuery)}&count=1&language=en&format=json`)
          ]);
          
          const [homeGeo, awayGeo] = await Promise.all([homeGeoRes.json(), awayGeoRes.json()]);
          
          if (homeGeo.results?.length && awayGeo.results?.length) {
            const dist = getHaversineDistance(
              homeGeo.results[0].latitude,
              homeGeo.results[0].longitude,
              awayGeo.results[0].latitude,
              awayGeo.results[0].longitude
            );
            setTravelDistance(dist);
          }
        } catch (err) {
          console.error('Travel distance error:', err);
        } finally {
          setLoadingTravel(false);
        }
      }

      const kickoff = new Date(game.commence_time);
      const now = new Date();
      const daysUntil = (kickoff - now) / (1000 * 60 * 60 * 24);

      if (daysUntil > 14 || daysUntil < -1) {
        // Mock weather for past/far-future games so the UI is visible during development
        const mockOptions = [
          { temp: 87, code: 0,  wind: 6,  precip: 5  },
          { temp: 74, code: 2,  wind: 11, precip: 20 },
          { temp: 91, code: 1,  wind: 4,  precip: 0  },
          { temp: 68, code: 61, wind: 14, precip: 75 },
          { temp: 82, code: 3,  wind: 9,  precip: 30 },
          { temp: 95, code: 0,  wind: 3,  precip: 0  },
          { temp: 71, code: 80, wind: 18, precip: 60 },
          { temp: 78, code: 51, wind: 7,  precip: 40 },
        ];
        const mock = mockOptions[game.id % mockOptions.length];
        setWeather({
          ...mock,
          city: game.home_stadium_city || 'Unknown City',
          state: game.home_stadium_state || '',
          success: true,
          isMock: true,
        });
        return;
      }

      setLoading(true);
      try {
        // Geocode the stadium city for coordinates
        const searchCity = game.home_stadium_city || game.home_team.split('(')[0].trim();
        const searchQuery = game.home_stadium_state
          ? `${searchCity}, ${game.home_stadium_state}`
          : searchCity;
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=1&language=en&format=json`;
        const geoRes = await fetch(geoUrl);
        const geoData = await geoRes.json();

        if (!geoData.results?.length) {
          setWeather({ error: true });
          return;
        }

        const { latitude, longitude, name, admin1 } = geoData.results[0];
        const datePart = kickoff.toISOString().split('T')[0];

        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,weather_code,wind_speed_10m,precipitation_probability&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=UTC&start_date=${datePart}&end_date=${datePart}`;
        const weatherRes = await fetch(weatherUrl);
        const weatherData = await weatherRes.json();

        if (weatherData.hourly) {
          const hour = kickoff.getUTCHours();
          setWeather({
            temp: Math.round(weatherData.hourly.temperature_2m[hour]),
            code: weatherData.hourly.weather_code[hour],
            wind: Math.round(weatherData.hourly.wind_speed_10m[hour]),
            precip: weatherData.hourly.precipitation_probability[hour],
            city: game.home_stadium_city || name,
            state: game.home_stadium_state || admin1,
            success: true
          });
        }
      } catch (err) {
        console.error('Weather error:', err);
        setWeather({ error: true });
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [game.id, game.commence_time, game.home_stadium_city, game.home_stadium_state, game.home_team, game.away_stadium_city, game.away_stadium_state]);

  const openSpreadHome = game.open_spread_home ?? game.spread_home;
  const currentSpreadHome = game.spread_home;
  const openOverUnder = game.open_over_under ?? game.over_under;
  const currentOverUnder = game.over_under;

  const spreadDiff = (currentSpreadHome !== null && currentSpreadHome !== undefined && openSpreadHome !== null && openSpreadHome !== undefined)
    ? +(currentSpreadHome - openSpreadHome).toFixed(1)
    : 0;

  const ouDiff = (currentOverUnder !== null && currentOverUnder !== undefined && openOverUnder !== null && openOverUnder !== undefined)
    ? +(currentOverUnder - openOverUnder).toFixed(1)
    : 0;

  const formatSpreadValue = (spread) => {
    if (spread === null || spread === undefined) return '--';
    const num = Number(spread);
    if (isNaN(num)) return '--';
    if (num === 0) return 'PK';
    return num > 0 ? `+${num}` : `${num}`;
  };

  // User pick line vs current line evaluation
  const userPick = picks?.[game.id];
  const userSelectionTeam = userPick?.selectionTeam;
  const userSelectionTotal = userPick?.selectionTotal;

  // Spread deal calculation
  let spreadDealStatus = null; // { isDeal, isWorse, isSame, pickedLine, currentLine }
  if (userSelectionTeam) {
    const isHome = userSelectionTeam === game.home_team;
    const currentLine = isHome ? game.spread_home : game.spread_away;
    const pickedLine = userPick.spread ?? (isHome ? game.spread_home : game.spread_away);
    if (pickedLine !== null && pickedLine !== undefined && currentLine !== null && currentLine !== undefined) {
      spreadDealStatus = {
        isDeal: pickedLine > currentLine,
        isWorse: pickedLine < currentLine,
        isSame: pickedLine === currentLine,
        pickedLine,
        currentLine
      };
    }
  }

  // Total deal calculation
  let totalDealStatus = null; // { isDeal, isWorse, isSame, pickedTotal, currentTotal }
  if (userSelectionTotal) {
    const pickedTotal = userPick.totalLine ?? game.over_under;
    const currentTotal = game.over_under;
    if (pickedTotal !== null && pickedTotal !== undefined && currentTotal !== null && currentTotal !== undefined) {
      let isDeal = false;
      let isWorse = false;
      if (userSelectionTotal === 'over') {
        isDeal = pickedTotal < currentTotal;
        isWorse = pickedTotal > currentTotal;
      } else if (userSelectionTotal === 'under') {
        isDeal = pickedTotal > currentTotal;
        isWorse = pickedTotal < currentTotal;
      }
      totalDealStatus = {
        isDeal,
        isWorse,
        isSame: pickedTotal === currentTotal,
        pickedTotal,
        currentTotal
      };
    }
  }

  return (
    <div className="game-intel" style={{ padding: '4px 6px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '10px', height: (isMobile && isCollapsed) ? 'auto' : '100%', display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
      <div 
        onClick={() => {
          if (isMobile) setIsCollapsed(prev => !prev);
        }}
        style={{ 
          fontSize: '0.75em', 
          color: '#fff', 
          fontWeight: 'bold', 
          textTransform: 'uppercase', 
          letterSpacing: '0.05em',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: isMobile ? 'pointer' : 'default',
          userSelect: 'none',
          padding: isMobile ? '4px 2px' : '0',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          Game Intel
        </span>
        {isMobile && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(prev => !prev);
            }}
            aria-label={isCollapsed ? "Expand Game Intel" : "Collapse Game Intel"}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '4px',
              padding: '2px 8px',
              color: '#ccc',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.85em',
              fontWeight: 'normal',
              textTransform: 'none'
            }}
          >
            <span>{isCollapsed ? 'Show' : 'Hide'}</span>
            {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        )}
      </div>
      
      {(!isMobile || !isCollapsed) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '100%', overflowX: 'auto', boxSizing: 'border-box' }}>
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
        <div style={{ fontSize: '0.7em', color: '#555', fontWeight: 'bold', marginBottom: '5px' }}>Run Saved Model</div>
        {savedModels.length === 0 ? (
          <div style={{ color: '#888', fontSize: '0.78em' }}>No saved models available.</div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <select value={selectedModelId} onChange={(event) => { setSelectedModelId(event.target.value); setModelPrediction(null); }} style={{ flex: 1, minWidth: 0, background: '#171717', color: '#fff', border: '1px solid #444', borderRadius: '4px', padding: '5px', fontSize: '0.78em' }}>
                <option value="">Choose a saved model</option>
                {savedModels.map((model) => <option key={model.id} value={model.id}>{model.name}</option>)}
              </select>
              <button type="button" onClick={runSelectedModel} disabled={!selectedModelId} style={{ background: '#4d7cff', border: 0, borderRadius: '4px', color: '#fff', padding: '6px 9px', cursor: selectedModelId ? 'pointer' : 'not-allowed', fontSize: '0.75em' }}>Run Model</button>
            </div>
            {modelPrediction && (
              <div style={{ marginTop: '6px', padding: '7px', background: 'rgba(77,124,255,0.1)', border: '1px solid rgba(77,124,255,0.3)', borderRadius: '4px', fontSize: '0.78em' }}>
                <div style={{ color: '#fff', fontWeight: 'bold' }}>{modelPrediction.winner} ({modelPrediction.confidence}% confidence)</div>
                <div style={{ color: '#aaa', marginTop: '3px' }}>Projected: {modelPrediction.projectedSpread >= 0 ? game.home_team : game.away_team} {modelPrediction.projectedSpread >= 0 ? '-' : '+'}{Math.abs(modelPrediction.projectedSpread).toFixed(1)}</div>
                <div style={{ color: '#aaa', marginTop: '3px' }}>Current spread: {modelPrediction.currentSpread ?? 'N/A'} · Edge: {modelPrediction.spreadEdge === null ? 'N/A' : modelPrediction.spreadEdge.toFixed(1)}</div>
                <div style={{ color: '#69d391', fontWeight: 'bold', marginTop: '3px' }}>Recommended bet: {modelPrediction.recommendation}</div>
              </div>
            )}
          </>
        )}
      </div>
      {/* Odds Movement Section */}
      {(openSpreadHome !== null || openOverUnder !== null || currentSpreadHome !== null || currentOverUnder !== null) && (
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px', marginBottom: '2px' }}>
          <div style={{ fontSize: '0.7em', color: '#555', fontWeight: 'bold', marginBottom: '4px' }}>Odds Movement</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.82em' }}>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '5px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ fontSize: '0.72em', color: '#888' }}>Spread ({game.home_team.split('(')[0].trim()})</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', flexWrap: 'wrap' }}>
                <span style={{ color: '#aaa' }}>Open: <strong style={{ color: '#fff' }}>{formatSpreadValue(openSpreadHome)}</strong></span>
                <span style={{ color: '#555' }}>→</span>
                <span style={{ fontWeight: 'bold', color: '#4d7cff' }}>{formatSpreadValue(currentSpreadHome)}</span>
                {spreadDiff !== 0 && (
                  <span style={{ 
                    fontSize: '0.75em', 
                    fontWeight: 'bold', 
                    color: spreadDiff > 0 ? '#4d7cff' : '#00e676',
                    backgroundColor: spreadDiff > 0 ? 'rgba(77, 124, 255, 0.1)' : 'rgba(0, 230, 118, 0.1)',
                    padding: '1px 4px',
                    borderRadius: '3px'
                  }}>\n                    {spreadDiff > 0 ? `+${spreadDiff}` : spreadDiff}
                  </span>
                )}
              </div>

              {spreadDealStatus && (
                <div style={{ marginTop: '4px' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.73rem',
                    padding: '1px 5px',
                    borderRadius: '3px',
                    backgroundColor: spreadDealStatus.isDeal ? 'rgba(0, 230, 118, 0.12)' : spreadDealStatus.isWorse ? 'rgba(255, 82, 82, 0.12)' : 'rgba(255, 255, 255, 0.06)',
                    border: spreadDealStatus.isDeal ? '1px solid rgba(0, 230, 118, 0.3)' : spreadDealStatus.isWorse ? '1px solid rgba(255, 82, 82, 0.3)' : '1px solid rgba(255, 255, 255, 0.12)',
                    color: spreadDealStatus.isDeal ? '#00e676' : spreadDealStatus.isWorse ? '#ff5252' : '#aaa'
                  }}>
                    <strong style={{ textTransform: 'capitalize' }}>{spreadDealStatus.isDeal ? 'Deal!' : spreadDealStatus.isWorse ? 'Worse' : 'Same'}</strong>
                    <span style={{ color: '#ccc' }}>({formatSpreadValue(spreadDealStatus.pickedLine)} vs {formatSpreadValue(spreadDealStatus.currentLine)})</span>
                  </span>
                </div>
              )}
            </div>

            <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '5px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ fontSize: '0.72em', color: '#888' }}>Over / Under</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', flexWrap: 'wrap' }}>
                <span style={{ color: '#aaa' }}>Open: <strong style={{ color: '#fff' }}>{openOverUnder ?? '--'}</strong></span>
                <span style={{ color: '#555' }}>→</span>
                <span style={{ fontWeight: 'bold', color: '#ffb300' }}>{currentOverUnder ?? '--'}</span>
                {ouDiff !== 0 && (
                  <span style={{ 
                    fontSize: '0.75em', 
                    fontWeight: 'bold', 
                    color: ouDiff > 0 ? '#00e676' : '#ff5252',
                    backgroundColor: ouDiff > 0 ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 82, 82, 0.1)',
                    padding: '1px 4px',
                    borderRadius: '3px'
                  }}>
                    {ouDiff > 0 ? `+${ouDiff}` : ouDiff}
                  </span>
                )}
              </div>

              {totalDealStatus && (
                <div style={{ marginTop: '4px' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.73rem',
                    padding: '1px 5px',
                    borderRadius: '3px',
                    backgroundColor: totalDealStatus.isDeal ? 'rgba(0, 230, 118, 0.12)' : totalDealStatus.isWorse ? 'rgba(255, 82, 82, 0.12)' : 'rgba(255, 255, 255, 0.06)',
                    border: totalDealStatus.isDeal ? '1px solid rgba(0, 230, 118, 0.3)' : totalDealStatus.isWorse ? '1px solid rgba(255, 82, 82, 0.3)' : '1px solid rgba(255, 255, 255, 0.12)',
                    color: totalDealStatus.isDeal ? '#00e676' : totalDealStatus.isWorse ? '#ff5252' : '#aaa'
                  }}>
                    <strong style={{ textTransform: 'capitalize' }}>{totalDealStatus.isDeal ? 'Deal!' : totalDealStatus.isWorse ? 'Worse' : 'Same'}</strong>
                    <span style={{ color: '#ccc' }}>({totalDealStatus.pickedTotal} vs {totalDealStatus.currentTotal})</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {!!game.completed && picks[game.id] && (picks[game.id].selectionTeam || picks[game.id].selectionTotal) && (
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px', marginBottom: '4px' }}>
          <div style={{ fontSize: '0.7em', color: '#555', fontWeight: 'bold', marginBottom: '6px' }}>Your Pick Result</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {picks[game.id].selectionTeam && picks[game.id].result && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255,255,255,0.03)', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '0.75em', color: '#aaa', fontWeight: 'bold' }}>Spread:</span>
                <span style={{
                  fontSize: '0.75em',
                  fontWeight: 'bold',
                  color: picks[game.id].result === 'win' ? '#4caf50' : picks[game.id].result === 'loss' ? '#f44336' : '#888'
                }}>
                  {picks[game.id].result.toUpperCase()}
                </span>
              </div>
            )}
            {picks[game.id].selectionTotal && picks[game.id].result && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255,255,255,0.03)', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '0.75em', color: '#aaa', fontWeight: 'bold' }}>O/U:</span>
                <span style={{
                  fontSize: '0.75em',
                  fontWeight: 'bold',
                  color: picks[game.id].result === 'win' ? '#4caf50' : picks[game.id].result === 'loss' ? '#f44336' : '#888'
                }}>
                  {picks[game.id].result.toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div>
          <div style={{ fontSize: '0.7em', color: '#555', fontWeight: 'bold' }}>Rest & Travel</div>
          <div style={{ fontSize: '0.85em', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
            <div>
              <span style={{ color: '#aaa' }}>{game.away_team.split('(')[0].trim()}:</span>{' '}
              <span style={{ 
                fontWeight: 'bold', 
                color: game.away_days_rest >= 9 ? '#4caf50' : game.away_days_rest <= 5 ? '#fff' : '#fff' 
              }}>
                {game.away_days_rest != null 
                  ? `${game.away_days_rest}d${game.away_days_rest >= 9 ? ' (Bye)' : game.away_days_rest <= 5 ? ' (Short)' : ''}` 
                  : '1st Game'}
              </span>
            </div>
            <div>
              <span style={{ color: '#aaa' }}>{game.home_team.split('(')[0].trim()}:</span>{' '}
              <span style={{ 
                fontWeight: 'bold', 
                color: game.home_days_rest >= 9 ? '#4caf50' : game.home_days_rest <= 5 ? '#fff' : '#fff' 
              }}>
                {game.home_days_rest != null 
                  ? `${game.home_days_rest}d${game.home_days_rest >= 9 ? ' (Bye)' : game.home_days_rest <= 5 ? ' (Short)' : ''}` 
                  : '1st Game'}
              </span>
            </div>
            <div style={{ marginTop: '4px', fontSize: '0.9em' }}>
              <span style={{ color: '#aaa' }}>Travel:</span>{' '}
              <strong style={{ color: '#fff' }}>
                {loadingTravel ? 'Calculating...' : travelDistance != null ? `${travelDistance} miles` : '--'}
              </strong>
            </div>
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.7em', color: '#555', fontWeight: 'bold', marginBottom: '4px' }}>Injuries</div>
          {injuries === null ? (
            loadingInjuries ? (
              <div style={{ fontSize: '0.8em', color: '#aaa' }}>Fetching...</div>
            ) : (
              <button
                onClick={fetchInjuries}
                style={{
                  padding: '2px 6px',
                  fontSize: '0.75em',
                  borderRadius: '4px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                Fetch Injuries
              </button>
            )
          ) : injuries.length === 0 ? (
            <div style={{ fontSize: '0.8em', color: '#888' }}>None reported</div>
          ) : (
            <div style={{ maxHeight: '100px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {injuries.map((inj, idx) => (
                <InjuryItem key={idx} inj={inj} />
              ))}
            </div>
          )}
        </div>
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
        <div>
          <div style={{ fontSize: '0.7em', color: '#555', fontWeight: 'bold' }}>Stadium</div>
          <div style={{ fontSize: '0.85em' }}>{game.home_stadium_name || '--'}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.7em', color: '#555', fontWeight: 'bold' }}>Location</div>
          <div style={{ fontSize: '0.85em' }}>{game.home_stadium_city && game.home_stadium_state ? `${game.home_stadium_city}, ${game.home_stadium_state}` : '--'}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.7em', color: '#555', fontWeight: 'bold' }}>TV</div>
          <div style={{ fontSize: '0.85em', fontWeight: 'bold', color: '#fff' }}>{game.tv_network || '--'}</div>
        </div>
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
        <div style={{ fontSize: '0.7em', color: '#555', fontWeight: 'bold', marginBottom: '6px' }}>Weather at Kickoff</div>
        {loading ? (
          <div style={{ fontSize: '0.85em', color: '#aaa' }}>Fetching forecast...</div>
        ) : weather?.success ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexWrap: 'wrap' }}>
            {/* <div style={{ flexShrink: 0 }}>{getWeatherIcon(weather.code, 32)}</div> */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '1.0em', fontWeight: 'bold', color: '#fff' }}>
                {getWeatherIcon(weather.code, 20)} {weather.temp}°F &nbsp;
                <span style={{ fontSize: '0.75em', fontWeight: 'normal', color: '#aaa' }}>{getWeatherLabel(weather.code)}</span>
                {weather.isMock && <span style={{ fontSize: '0.65em', color: '#555', marginLeft: '6px' }}>(fake)</span>}
                <span style={{ color: '#444' }}>·</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85em', color: '#ccc' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Wind size={14} strokeWidth={1.5} />
                  <span>{weather.wind} mph</span>
                </div>
                <span style={{ color: '#444' }}>·</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Droplets size={14} strokeWidth={1.5} />
                  <span>{weather.precip}% precip</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '0.85em', color: '#666' }}>
            {weather?.reason || 'Forecast unavailable'}
          </div>
        )}
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
        <div style={{ fontSize: '0.7em', color: '#555', fontWeight: 'bold', marginBottom: '6px' }}>Matchup Statistics</div>
        {matchupStats === null ? (
          loadingMatchupStats ? (
            <div style={{ fontSize: '0.8em', color: '#aaa' }}>Fetching stats...</div>
          ) : (
            <button
              onClick={fetchMatchupStats}
              style={{
                padding: '2px 6px',
                fontSize: '0.75em',
                borderRadius: '4px',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            >
              Fetch Matchup Stats
            </button>
          )
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', fontSize: '0.8em' }}>
            {/* Recent Matchups */}
            <div>
              <div style={{ fontWeight: 'bold', color: '#aaa', fontSize: '0.9em', marginBottom: '4px' }}>Recent Matchups:</div>
              {matchupStats.h2h.length === 0 ? (
                <div style={{ color: '#666', fontStyle: 'italic' }}>No recent meetings</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {matchupStats.h2h.map((h, idx) => {
                    const isHomeWinner = h.score_home > h.score_away;
                    const winner = isHomeWinner ? h.home_team : h.away_team;
                    const loser = isHomeWinner ? h.away_team : h.home_team;
                    const winScore = isHomeWinner ? h.score_home : h.score_away;
                    const loseScore = isHomeWinner ? h.score_away : h.score_home;
                    const cleanName = (name) => name.split('(')[0].trim();
                    
                    let coverText = '';
                    if (h.spread_home !== null && h.spread_away !== null) {
                      const homeCovered = h.score_home + h.spread_home > h.score_away;
                      const awayCovered = h.score_away + h.spread_away > h.score_home;
                      if (homeCovered) coverText = `${cleanName(h.home_team)} Cover`;
                      else if (awayCovered) coverText = `${cleanName(h.away_team)} Cover`;
                      else coverText = 'Push';
                    }
                    
                    let ouText = '';
                    if (h.over_under !== null) {
                      const total = h.score_home + h.score_away;
                      if (total > h.over_under) ouText = `Over ${h.over_under}`;
                      else if (total < h.over_under) ouText = `Under ${h.over_under}`;
                      else ouText = `Push ${h.over_under}`;
                    }
                    
                    const year = new Date(h.commence_time).getFullYear();
                    return (
                      <div key={idx} style={{ color: '#ccc' }}>
                        {year}: <strong style={{ color: '#fff' }}>{cleanName(winner)} {winScore}-{loseScore}</strong> ({coverText}, {ouText})
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

              {/* ESPN Team Stats */}
              {matchupStats.espnStats ? (() => {
                const away = matchupStats.espnStats.away;
                const home = matchupStats.espnStats.home;
                
                const [offAwayStyle, offHomeStyle] = getBetterStyle(away.scoringOffense, home.scoringOffense, true);
                const [defAwayStyle, defHomeStyle] = getBetterStyle(away.scoringDefense, home.scoringDefense, false);
                const [yppAwayStyle, yppHomeStyle] = getBetterStyle(away.yardsPerPlay, home.yardsPerPlay, true);
                const [yppaAwayStyle, yppaHomeStyle] = getBetterStyle(away.yardsPerPlayAllowed, home.yardsPerPlayAllowed, false);
                const [toAwayStyle, toHomeStyle] = getBetterStyle(parseTurnover(away.turnoverMargin), parseTurnover(home.turnoverMargin), true);

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '4px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1.2fr 1.2fr', gap: '4px', fontWeight: 'bold', color: '#fff', fontSize: '1.0em' }}>
                      <span>Stats</span>
                      <span>{game.away_team.split('(')[0].trim()}</span>
                      <span>{game.home_team.split('(')[0].trim()}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1.1fr 1.1fr', gap: '4px', color: '#ccc' }}>
                      <span title="Points scored per game">Scoring Offense</span>
                      <span style={offAwayStyle}>{away.scoringOffense != null ? `${away.scoringOffense} PPG` : '--'}</span>
                      <span style={offHomeStyle}>{home.scoringOffense != null ? `${home.scoringOffense} PPG` : '--'}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1.1fr 1.1fr', gap: '4px', color: '#ccc' }}>
                      <span title="Points allowed per game">Scoring Defense</span>
                      <span style={defAwayStyle}>{away.scoringDefense != null ? `${away.scoringDefense} PPG` : '--'}</span>
                      <span style={defHomeStyle}>{home.scoringDefense != null ? `${home.scoringDefense} PPG` : '--'}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1.1fr 1.1fr', gap: '4px', color: '#ccc' }}>
                      <span title="Yards gained per play on offense">Yards Per Play</span>
                      <span style={yppAwayStyle}>{away.yardsPerPlay != null ? away.yardsPerPlay : '--'}</span>
                      <span style={yppHomeStyle}>{home.yardsPerPlay != null ? home.yardsPerPlay : '--'}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1.1fr 1.1fr', gap: '4px', color: '#ccc' }}>
                      <span title="Yards allowed per play on defense">Yards/Play Allowed</span>
                      <span style={yppaAwayStyle}>{away.yardsPerPlayAllowed != null ? away.yardsPerPlayAllowed : '--'}</span>
                      <span style={yppaHomeStyle}>{home.yardsPerPlayAllowed != null ? home.yardsPerPlayAllowed : '--'}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1.1fr 1.1fr', gap: '4px', color: '#ccc' }}>
                      <span title="Average turnovers gained vs. lost per game">Turnover Margin</span>
                      <span style={toAwayStyle}>{away.turnoverMargin || '--'}</span>
                      <span style={toHomeStyle}>{home.turnoverMargin || '--'}</span>
                    </div>
                  </div>
                );
              })() : (
                <div style={{ color: '#666', fontStyle: 'italic', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '4px' }}>
                  ESPN season stats unavailable for this matchup
                </div>
              )}

              {/* Historical Betting Stats */}
              {matchupStats.researchStats && (() => {
                const away = matchupStats.researchStats.away;
                const home = matchupStats.researchStats.home;

                const isHomeFav = game.spread_home !== null && game.spread_home < 0;
                const isHomeDog = game.spread_home !== null && game.spread_home > 0;
                const isAwayFav = game.spread_away !== null && game.spread_away < 0;
                const isAwayDog = game.spread_away !== null && game.spread_away > 0;

                const ouHomeAway = formatOUHomeAway(away.ou.away, home.ou.home);

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '4px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1.2fr 1.2fr', gap: '4px', fontWeight: 'bold', color: '#fff', fontSize: '1.0em' }}>
                      <span>Betting Stats</span>
                      <span>{game.away_team.split('(')[0].trim()}</span>
                      <span>{game.home_team.split('(')[0].trim()}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1.1fr 1.1fr', gap: '4px', color: '#ccc' }}>
                      <span title="How often each team covers the spread overall">ATS Overall</span>
                      <span>{away.ats.overall}</span>
                      <span>{home.ats.overall}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1.1fr 1.1fr', gap: '4px', color: '#ccc' }}>
                      <span title="How often each team covers the spread in home/away splits">ATS H/A</span>
                      <span>{away.ats.away} (Away)</span>
                      <span>{home.ats.home} (Home)</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1.1fr 1.1fr', gap: '4px', color: '#ccc' }}>
                      <span title="How often each team covers the spread as favorite/underdog">ATS Fav/Dog</span>
                      <span>
                        <span style={{ fontWeight: isAwayFav ? 'bold' : 'normal', color: isAwayFav ? '#fff' : 'inherit' }}>{away.ats.favorite}</span> /{' '}
                        <span style={{ fontWeight: isAwayDog ? 'bold' : 'normal', color: isAwayDog ? '#fff' : 'inherit' }}>{away.ats.underdog}</span>
                      </span>
                      <span>
                        <span style={{ fontWeight: isHomeFav ? 'bold' : 'normal', color: isHomeFav ? '#fff' : 'inherit' }}>{home.ats.favorite}</span> /{' '}
                        <span style={{ fontWeight: isHomeDog ? 'bold' : 'normal', color: isHomeDog ? '#fff' : 'inherit' }}>{home.ats.underdog}</span>
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1.1fr 1.1fr', gap: '4px', color: '#ccc' }}>
                      <span title="How often each team's games go over or under the total line overall (Overs-Unders-Pushes)">O/U Overall</span>
                      <span>{away.ou.overall}</span>
                      <span>{home.ou.overall}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1.1fr 1.1fr', gap: '4px', color: '#ccc' }}>
                      <span title="How often each team's games go over or under the total line in home/away splits (Overs-Unders-Pushes)">O/U H/A</span>
                      {ouHomeAway.awayJsx}
                      {ouHomeAway.homeJsx}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1.1fr 1.1fr', gap: '4px', color: '#ccc' }}>
                      <span title="ATS performance over the last 5 games">ATS Streak</span>
                      <span style={{fontFamily: 'monospace' }}>{away.streak.ats}</span>
                      <span style={{fontFamily: 'monospace' }}>{home.streak.ats}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1.1fr 1.1fr', gap: '4px', color: '#ccc' }}>
                      <span title="O/U performance over the last 5 games">O/U Streak</span>
                      <span style={{ fontFamily: 'monospace' }}>{away.streak.ou}</span>
                      <span style={{ fontFamily: 'monospace' }}>{home.streak.ou}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Expert Insights Comments Section */}
          <div style={{ marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.85em', fontWeight: 'bold', color: '#f1c40f', letterSpacing: '0.04em' }}>
                Expert Insights ({insights.length})
              </span>
            </div>

            {/* List of Insights */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
              {insights.length === 0 ? (
                <div style={{ fontSize: '0.78em', color: '#777', fontStyle: 'italic' }}>
                  No expert insights added for this game yet.
                </div>
              ) : (
                insights.map((insightText, idx) => (
                  <div key={idx} style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderLeft: '3px solid #f1c40f',
                    padding: '4px 8px',
                    borderRadius: '0 4px 4px 0',
                    fontSize: '0.8em',
                    color: '#ddd',
                    lineHeight: '1.35'
                  }}>
                    {insightText}
                  </div>
                ))
              )}
            </div>

            {/* Add Insight Form */}
            <form onSubmit={handleAddInsight} style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                placeholder="Add an expert comment/insight..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                style={{
                  flex: 1,
                  boxSizing: 'border-box',
                  padding: '5px 8px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#fff',
                  fontSize: '0.78em'
                }}
              />
              <button
                type="submit"
                disabled={submittingInsight || !newComment.trim()}
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(241, 196, 15, 0.2)',
                  border: '1px solid rgba(241, 196, 15, 0.4)',
                  color: '#f1c40f',
                  fontSize: '0.75em',
                  fontWeight: 'bold',
                  cursor: (submittingInsight || !newComment.trim()) ? 'not-allowed' : 'pointer'
                }}
              >
                {submittingInsight ? '...' : 'Post'}
              </button>
            </form>
          </div>
        </div>
        </div>
      )}
    </div>
  );
};

const PicksPage = ({
  pickGames,
  picks,
  otherPlayersLocks = [],
  games,
  handlePickChange,
  handleTotalChange,
  handleSpreadAdjust,
  handleTotalAdjust,
  handleLockToggle,
  isGameLocked,
  isGameLive,
  handleSubmit,
  loading,
  selectedWeek,
  selectedPlayer,
  message,
  messageSuccess = false,
  teams = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConference, setSelectedConference] = useState('');
  const [selectedChannels, setSelectedChannels] = useState([]);
  const [channelDropdownOpen, setChannelDropdownOpen] = useState(false);
  const channelDropdownRef = useRef(null);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const filterDropdownRef = useRef(null);
  const [hasInitializedLiveDefault, setHasInitializedLiveDefault] = useState(false);
  const [rankedTeams, setRankedTeams] = useState([]);
  const [copyButtonText, setCopyButtonText] = useState('Copy Picks');
  const [liveScores, setLiveScores] = useState({});
  const [scoresLastUpdated, setScoresLastUpdated] = useState(null);
  const [refreshingGameId, setRefreshingGameId] = useState(null);
  const isMobile = useIsMobile();

  const parseScoreboardEvents = (data) => {
    const newLiveScores = {};
    const rankedList = [];
    let anyLiveInScoreboard = false;

    (data.events || []).forEach(event => {
      const comp = event.competitions?.[0] || {};
      const home = comp.competitors?.find(c => c.homeAway === 'home');
      const away = comp.competitors?.find(c => c.homeAway === 'away');

      if (event.status?.type?.state === 'in') {
        anyLiveInScoreboard = true;
      }

      if (home?.curatedRank?.current <= 25) {
        rankedList.push({
          rank: home.curatedRank.current,
          displayName: (home.team?.displayName || '').toLowerCase().trim(),
          location: (home.team?.location || '').toLowerCase().trim(),
          nickname: (home.team?.name || home.team?.nickname || '').toLowerCase().trim(),
          abbrev: (home.team?.abbreviation || '').toLowerCase().trim()
        });
      }
      if (away?.curatedRank?.current <= 25) {
        rankedList.push({
          rank: away.curatedRank.current,
          displayName: (away.team?.displayName || '').toLowerCase().trim(),
          location: (away.team?.location || '').toLowerCase().trim(),
          nickname: (away.team?.name || away.team?.nickname || '').toLowerCase().trim(),
          abbrev: (away.team?.abbreviation || '').toLowerCase().trim()
        });
      }
      
      newLiveScores[event.id] = {
        score_home: home?.score ? parseInt(home.score) : 0,
        score_away: away?.score ? parseInt(away.score) : 0,
        linescores_home: (home?.linescores || []).map(l => ({ period: l.period, score: l.value ?? parseInt(l.displayValue) ?? 0 })),
        linescores_away: (away?.linescores || []).map(l => ({ period: l.period, score: l.value ?? parseInt(l.displayValue) ?? 0 })),
        clock: event.status?.displayClock,
        period: event.status?.period,
        status: event.status?.type?.description,
        completed: !!event.status?.type?.completed,
        state: event.status?.type?.state,
        possession: comp.situation?.possession,
        downDistance: comp.situation?.downDistanceText,
        possessionText: comp.situation?.possessionText,
        yardLine: comp.situation?.yardLine,
        lastPlayText: comp.situation?.lastPlay?.text
      };
    });
    if (rankedList.length > 0) {
      setRankedTeams(prev => {
        const merged = [...prev];
        rankedList.forEach(item => {
          if (!merged.some(m => m.displayName === item.displayName && m.rank === item.rank)) {
            merged.push(item);
          }
        });
        return merged;
      });
    }
    return { newLiveScores, anyLiveInScoreboard };
  };

  const refreshSingleGame = async (apiGameId) => {
    if (!apiGameId) return;
    setRefreshingGameId(apiGameId);
    try {
      const res = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?groups=80&limit=300');
      const data = await res.json();
      const { newLiveScores: updated } = parseScoreboardEvents(data);
      if (updated[apiGameId]) {
        setLiveScores(prev => ({
          ...prev,
          [apiGameId]: updated[apiGameId]
        }));
      } else {
        setLiveScores(prev => ({ ...prev, ...updated }));
      }
      setScoresLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to refresh game score from ESPN', err);
    } finally {
      setRefreshingGameId(null);
    }
  };

  // Poll ESPN for scoreboard, live scores and rankings every 30 seconds
  useEffect(() => {
    const fetchScoreboardAndRanks = async () => {
      try {
        const res = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?groups=80&limit=300');
        const data = await res.json();
        const { newLiveScores, anyLiveInScoreboard } = parseScoreboardEvents(data);
        setLiveScores(newLiveScores);
        setScoresLastUpdated(new Date());

        // On initial page load: auto-select Live Games if there are active live games
        if (!hasInitializedLiveDefault) {
          const liveWeekGames = pickGames.some(g => {
            const liveObj = newLiveScores[String(g.api_game_id)] || newLiveScores[g.api_game_id];
            if (liveObj) return liveObj.state === 'in';
            return isGameLive(g);
          });

          if (liveWeekGames || anyLiveInScoreboard) {
            setSelectedFilters(prev => prev.includes('live') ? prev : [...prev, 'live']);
          }
          setHasInitializedLiveDefault(true);
        }
      } catch (err) {
        console.error('Failed to fetch live scores from ESPN', err);
      }
    };

    fetchScoreboardAndRanks();
    const interval = setInterval(fetchScoreboardAndRanks, 30000);
    return () => clearInterval(interval);
  }, [pickGames, isGameLive, hasInitializedLiveDefault]);

  // Build a lookup: school name -> conference
  const teamConferenceMap = teams.reduce((acc, t) => {
    if (t.school && t.conference) acc[t.school] = t.conference;
    return acc;
  }, {});

  // Find the conference for a game team name by checking if any school name is a prefix
  const getConference = (teamName) => {
    if (!teamName) return null;
    const match = teams.find((t) => teamName.startsWith(t.school));
    return match?.conference || null;
  };

  // Only show conferences that have at least one team playing this week
  const weekConferences = [...new Set(
    pickGames.flatMap((game) => [
      getConference(game.home_team),
      getConference(game.away_team)
    ].filter(Boolean))
  )].sort();

  // Channels available for games playing this week
  const weekChannels = [...new Set(
    pickGames.map((game) => game.tv_network).filter(Boolean)
  )].sort((a, b) => a.localeCompare(b));

  // Close channel multiselect when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (channelDropdownRef.current && !channelDropdownRef.current.contains(e.target)) {
        setChannelDropdownOpen(false);
      }
    };
    if (channelDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [channelDropdownOpen]);

  const toggleChannelSelection = (ch) => {
    setSelectedChannels((prev) => 
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  // Lookup rank for a given team name with collision-safe matching
  const getTeamRank = (teamName) => {
    if (!teamName || rankedTeams.length === 0) return null;
    const clean = teamName.toLowerCase().replace(/\s*\((neutral|home|away)\)\s*/gi, '').trim();

    // 1. Direct exact match on full display name or school location
    for (const t of rankedTeams) {
      if (clean === t.displayName || clean === t.location) {
        return t.rank;
      }
    }

    // 2. Exact match on location + mascot (e.g. "indiana hoosiers", "ohio state buckeyes")
    for (const t of rankedTeams) {
      if (t.location && t.nickname) {
        const full = `${t.location} ${t.nickname}`;
        if (clean === full) {
          return t.rank;
        }
      }
    }

    // 3. Team name starts with school location and ends with mascot with NO intermediate words
    // Prevents "Indiana State Sycamores" from matching "Indiana Hoosiers"
    for (const t of rankedTeams) {
      if (t.location && t.nickname) {
        if (clean.startsWith(`${t.location} `) && clean.endsWith(` ${t.nickname}`)) {
          const middle = clean.slice(t.location.length, clean.length - t.nickname.length).trim();
          if (!middle) {
            return t.rank;
          }
        }
      }
    }

    return null;
  };

  const formatTeamDisplayName = (teamName) => {
    const rank = getTeamRank(teamName);
    return rank ? `#${rank} ${teamName}` : teamName;
  };

  // Determine if a game is completed (either from DB record or real-time ESPN scoreboard)
  const isGameFinished = (game) => {
    if (game.completed) return true;
    const liveScoreObj = liveScores[String(game.api_game_id)] || liveScores[game.api_game_id];
    if (liveScoreObj) {
      return !!liveScoreObj.completed || liveScoreObj.state === 'post' || liveScoreObj.status === 'Final' || liveScoreObj.status === 'STATUS_FINAL';
    }
    return false;
  };

  // Determine if a game is truly live in real time (using backend completed status & live ESPN state)
  const isGameCurrentlyLive = (game) => {
    if (isGameFinished(game)) return false;
    const liveScoreObj = liveScores[String(game.api_game_id)] || liveScores[game.api_game_id];
    if (liveScoreObj) {
      return liveScoreObj.state === 'in';
    }
    return isGameLive(game);
  };

  // Check if there are any live games this week
  const hasAnyLiveGames = pickGames.some((game) => isGameCurrentlyLive(game));

  // If live games finish, automatically remove 'live' from selectedFilters
  useEffect(() => {
    if (!hasAnyLiveGames && selectedFilters.includes('live')) {
      setSelectedFilters((prev) => prev.filter((f) => f !== 'live'));
    }
  }, [hasAnyLiveGames, selectedFilters]);

  // Close filter multiselect dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target)) {
        setFilterDropdownOpen(false);
      }
    };
    if (filterDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [filterDropdownOpen]);

  const toggleFilterSelection = (filterKey) => {
    setSelectedFilters((prev) =>
      prev.includes(filterKey) ? prev.filter((f) => f !== filterKey) : [...prev, filterKey]
    );
  };

  // Get current game scores (merging DB score with real-time ESPN scoreboard if available)
  const getGameScores = (game) => {
    const live = liveScores[String(game.api_game_id)] || liveScores[game.api_game_id];
    const score_home = (live && live.score_home !== undefined) ? live.score_home : game.score_home;
    const score_away = (live && live.score_away !== undefined) ? live.score_away : game.score_away;
    return { score_home, score_away };
  };

  const filteredGames = pickGames.filter((game) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term || (
      game.home_team.toLowerCase().includes(term) ||
      game.away_team.toLowerCase().includes(term) ||
      (game.home_nickname && game.home_nickname.toLowerCase().includes(term)) ||
      (game.away_nickname && game.away_nickname.toLowerCase().includes(term))
    );
    const matchesConference = !selectedConference || (
      getConference(game.home_team) === selectedConference ||
      getConference(game.away_team) === selectedConference
    );
    const matchesMyPicks = !selectedFilters.includes('myPicks') || (
      picks[game.id] && (picks[game.id].selectionTeam || picks[game.id].selectionTotal)
    );
    const matchesTop25 = !selectedFilters.includes('top25') || !!getTeamRank(game.home_team) || !!getTeamRank(game.away_team);
    const matchesLiveGames = !selectedFilters.includes('live') || isGameCurrentlyLive(game);
    const matchesFinalGames = !selectedFilters.includes('final') || isGameFinished(game);
    const matchesChannel = selectedChannels.length === 0 || (game.tv_network && selectedChannels.includes(game.tv_network));
    return matchesSearch && matchesConference && matchesChannel && matchesMyPicks && matchesLiveGames && matchesFinalGames && matchesTop25;
  });

  // Sort games so active and upcoming games appear first, and final/completed games move to the bottom
  const sortedFilteredGames = [...filteredGames].sort((a, b) => {
    const aFinished = isGameFinished(a) ? 1 : 0;
    const bFinished = isGameFinished(b) ? 1 : 0;
    if (aFinished !== bFinished) {
      return aFinished - bFinished;
    }
    return new Date(a.commence_time) - new Date(b.commence_time);
  });

  // Calculate user pick outcomes (win / loss / push) for completed games
  const getPickOutcomes = (game) => {
    const pick = picks?.[game.id];
    if (!pick || (!pick.selectionTeam && !pick.selectionTotal)) return [];
    const { score_home, score_away } = getGameScores(game);
    const outcomes = [];

    const getSchoolDisplay = (teamFullName) => {
      if (!teamFullName) return '';
      const clean = teamFullName.split('(')[0].trim();
      const matched = teams.find((t) => clean.startsWith(t.school));
      return matched ? matched.school : clean;
    };

    // Spread pick evaluation
    if (pick.selectionTeam) {
      let res = pick.result;
      const isHome = pick.selectionTeam === game.home_team;
      const spread = pick.spread ?? (isHome ? game.spread_home : game.spread_away);
      const spreadStr = formatSpreadValue(spread);

      if (!res || res === 'pending') {
        if (score_home !== null && score_away !== null) {
          if (spread !== null && spread !== undefined) {
            const userScore = isHome ? (Number(score_home) + Number(spread)) : (Number(score_away) + Number(spread));
            const oppScore = isHome ? Number(score_away) : Number(score_home);
            if (userScore > oppScore) res = 'win';
            else if (userScore < oppScore) res = 'loss';
            else res = 'push';
          }
        }
      }
      if (res && res !== 'pending') {
        const schoolName = getSchoolDisplay(pick.selectionTeam);
        const lineText = spreadStr ? ` ${spreadStr}` : '';
        outcomes.push({
          type: 'Spread',
          pickLabel: `${schoolName}${lineText}`,
          result: res,
          indicatorText: `${schoolName}${lineText} Spread: ${res.toUpperCase()}`
        });
      }
    }

    // Total pick evaluation
    if (pick.selectionTotal) {
      let res = pick.result_total;
      const line = Number(pick.totalLine ?? game.over_under);

      if (!res || res === 'pending') {
        if (score_home !== null && score_away !== null) {
          const total = Number(score_home) + Number(score_away);
          if (total > line) res = pick.selectionTotal === 'over' ? 'win' : 'loss';
          else if (total < line) res = pick.selectionTotal === 'under' ? 'win' : 'loss';
          else res = 'push';
        }
      }
      if (res && res !== 'pending') {
        const totalLabel = `${pick.selectionTotal.toUpperCase()} ${pick.totalLine ?? game.over_under}`;
        outcomes.push({
          type: 'O/U',
          pickLabel: totalLabel,
          result: res,
          indicatorText: `${totalLabel} O/U: ${res.toUpperCase()}`
        });
      }
    }

    return outcomes;
  };

  // Helper to get active pick indicators for live games (team & spread, over/under & line)
  const getLivePickIndicators = (game) => {
    const pick = picks?.[game.id];
    if (!pick || (!pick.selectionTeam && !pick.selectionTotal)) return [];
    const indicators = [];

    const getSchoolDisplay = (teamFullName) => {
      if (!teamFullName) return '';
      const clean = teamFullName.split('(')[0].trim();
      const matched = teams.find((t) => clean.startsWith(t.school));
      return matched ? matched.school : clean;
    };

    if (pick.selectionTeam) {
      const isHome = pick.selectionTeam === game.home_team;
      const spread = pick.spread ?? (isHome ? game.spread_home : game.spread_away);
      const spreadStr = formatSpreadValue(spread);
      const schoolName = getSchoolDisplay(pick.selectionTeam);
      const lineText = spreadStr ? ` ${spreadStr}` : '';
      indicators.push({
        type: 'Spread',
        text: `${schoolName}${lineText}`
      });
    }

    if (pick.selectionTotal) {
      const totalLine = pick.totalLine ?? game.over_under;
      const totalText = totalLine != null ? ` ${totalLine}` : '';
      indicators.push({
        type: 'Total',
        text: `${pick.selectionTotal.toUpperCase()}${totalText}`
      });
    }

    return indicators;
  };

  // Determine the most recent odds update time among all pickGames
  const latestOddsUpdateTime = pickGames.reduce((latest, game) => {
    if (!game.updated_at) return latest;
    const updateDate = new Date(game.updated_at);
    return !latest || updateDate > latest ? updateDate : latest;
  }, null);

  const handleCopyPicks = () => {
    const playerPicks = Object.values(picks).filter((pick) => pick.selectionTeam || pick.selectionTotal);

    if (playerPicks.length === 0) {
      setCopyButtonText('No Picks to Copy');
      setTimeout(() => setCopyButtonText('Copy Picks'), 2000);
      return;
    }

    const picksAsText = playerPicks.map(pick => {
      const game = pickGames.find(g => g.id === pick.gameId);
      if (!game) return null;

      const pickDetails = [];

      // Format spread pick
      if (pick.selectionTeam) {
        const spread = pick.spread ?? (pick.selection_side === 'home' ? game.spread_home : game.spread_away);
        const spreadText = spread === 0 ? 'PK' : (spread > 0 ? `+${spread}` : spread);
        pickDetails.push(`${pick.selectionTeam} ${spreadText}`);
      }

      // Format total pick
      if (pick.selectionTotal) {
        pickDetails.push(`${game.away_team} @ ${game.home_team} ${pick.selectionTotal.toUpperCase()} ${pick.totalLine}`);
      }

      return pickDetails.join('\n');
    }).filter(Boolean).join('\n');

    navigator.clipboard.writeText(picksAsText).then(() => {
      setCopyButtonText('Copied!');
      setTimeout(() => setCopyButtonText('Copy Picks'), 2000);
    });
  };

  const isSpreadLockConflicted = (gameId, selectionTeam) => {
    const game = pickGames.find(g => g.id === gameId);
    if (!game) return false;
    const oppositeTeam = selectionTeam === game.home_team ? game.away_team : game.home_team;
    return otherPlayersLocks.some(l => l.gameId === gameId && l.selectionTeam === oppositeTeam);
  };

  const isTotalLockConflicted = (gameId, selectionTotal) => {
    const oppositeTotal = selectionTotal === 'over' ? 'under' : 'over';
    return otherPlayersLocks.some(l => l.gameId === gameId && l.selectionTotal === oppositeTotal);
  };

  const getConflictingPlayer = (gameId, selectionTeam, selectionTotal) => {
    const game = pickGames.find(g => g.id === gameId);
    if (!game) return null;
    
    if (selectionTeam) {
      const oppositeTeam = selectionTeam === game.home_team ? game.away_team : game.home_team;
      const conflict = otherPlayersLocks.find(l => l.gameId === gameId && l.selectionTeam === oppositeTeam);
      return conflict ? conflict.player : null;
    }
    
    if (selectionTotal) {
      const oppositeTotal = selectionTotal === 'over' ? 'under' : 'over';
      const conflict = otherPlayersLocks.find(l => l.gameId === gameId && l.selectionTotal === oppositeTotal);
      return conflict ? conflict.player : null;
    }
    
    return null;
  };

  return (
    <>
      <section className="layout-grid">
        <article className="panel" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0 }}>Pick Games</h2>
                <RulesTooltip />
              </div>
              {latestOddsUpdateTime && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.6)', marginTop: '4px' }}>
                  <span>Odds last updated: {latestOddsUpdateTime.toLocaleString()}</span>
                  <OddsMovementTooltip games={pickGames} />
                </div>
              )}
            </div>
            <div className="search-container" style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '8px', alignItems: isMobile ? 'stretch' : 'center', width: isMobile ? '100%' : 'auto' }}>
              <input
                type="text"
                placeholder="Search school or nickname..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  width: isMobile ? '100%' : '225px',
                  fontSize: '0.9em',
                  boxSizing: 'border-box'
                }}
              />
              <select
                value={selectedConference}
                onChange={(e) => setSelectedConference(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: '#1a1a2e',
                  color: '#fff',
                  fontSize: '0.9em',
                  width: isMobile ? '100%' : 'auto',
                  boxSizing: 'border-box',
                  cursor: 'pointer'
                }}
              >
                <option value="" style={{ backgroundColor: '#1a1a2e', color: '#fff' }}>All Conferences</option>
                {weekConferences.map((conf) => (
                  <option key={conf} value={conf} style={{ backgroundColor: '#1a1a2e', color: '#fff' }}>{conf}</option>
                ))}
              </select>

              {/* Channels Multiselect Dropdown */}
              {weekChannels.length > 0 && (
                <div ref={channelDropdownRef} style={{ position: 'relative', width: isMobile ? '100%' : 'auto' }}>
                  <button
                    type="button"
                    onClick={() => setChannelDropdownOpen((prev) => !prev)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: selectedChannels.length > 0 ? '1px solid rgba(77, 124, 255, 0.5)' : '1px solid rgba(255,255,255,0.1)',
                      backgroundColor: selectedChannels.length > 0 ? 'rgba(77, 124, 255, 0.15)' : '#1a1a2e',
                      color: selectedChannels.length > 0 ? '#4d7cff' : '#fff',
                      fontSize: '0.9em',
                      width: isMobile ? '100%' : 'auto',
                      minWidth: isMobile ? '100%' : '150px',
                      cursor: 'pointer',
                      boxSizing: 'border-box'
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Tv size={15} />
                      {selectedChannels.length === 0
                        ? 'All Channels'
                        : selectedChannels.length === 1
                          ? selectedChannels[0]
                          : `${selectedChannels.length} Channels`}
                    </span>
                    <ChevronDown size={14} style={{ transform: channelDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
                  </button>

                  {channelDropdownOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        zIndex: 1000,
                        backgroundColor: '#161922',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        padding: '6px',
                        minWidth: '190px',
                        maxWidth: isMobile ? '100%' : '260px',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
                        maxHeight: '260px',
                        overflowY: 'auto'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 6px 6px 6px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.75em', fontWeight: 'bold', color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Select Channels
                        </span>
                        {selectedChannels.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedChannels([])}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#ff5252',
                              cursor: 'pointer',
                              fontSize: '0.75em',
                              padding: 0
                            }}
                          >
                            Clear All
                          </button>
                        )}
                      </div>
                      {weekChannels.map((ch) => {
                        const isSelected = selectedChannels.includes(ch);
                        return (
                          <div
                            key={ch}
                            onClick={() => toggleChannelSelection(ch)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '8px',
                              padding: '6px 8px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              backgroundColor: isSelected ? 'rgba(77, 124, 255, 0.18)' : 'transparent',
                              color: isSelected ? '#fff' : '#ccc',
                              fontSize: '0.85em',
                              userSelect: 'none',
                              transition: 'background-color 0.1s'
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <span style={{ fontWeight: isSelected ? '600' : 'normal' }}>{ch}</span>
                            <span
                              style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '3px',
                                border: isSelected ? '1px solid #4d7cff' : '1px solid rgba(255,255,255,0.25)',
                                backgroundColor: isSelected ? '#4d7cff' : 'transparent',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}
                            >
                              {isSelected && <Check size={12} color="#fff" strokeWidth={3} />}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              {/* Filters Multiselect Dropdown (Top 25, My Picks, Final Games, Live Games) */}
              <div ref={filterDropdownRef} style={{ position: 'relative', width: isMobile ? '100%' : 'auto' }}>
                <button
                  type="button"
                  onClick={() => setFilterDropdownOpen((prev) => !prev)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: selectedFilters.length > 0 ? '1px solid rgba(241, 196, 15, 0.5)' : '1px solid rgba(255,255,255,0.1)',
                    backgroundColor: selectedFilters.length > 0 ? 'rgba(241, 196, 15, 0.15)' : '#1a1a2e',
                    color: selectedFilters.length > 0 ? '#f1c40f' : '#fff',
                    fontSize: '0.9em',
                    width: isMobile ? '100%' : 'auto',
                    minWidth: isMobile ? '100%' : '140px',
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Filter size={15} />
                    {selectedFilters.length === 0
                      ? 'Filter Games'
                      : selectedFilters.length === 1
                        ? (selectedFilters[0] === 'top25'
                            ? 'Top 25'
                            : selectedFilters[0] === 'myPicks'
                              ? 'My Picks'
                              : selectedFilters[0] === 'final'
                                ? 'Final Games'
                                : 'Live Games')
                        : `${selectedFilters.length} Filters`}
                  </span>
                  <ChevronDown size={14} style={{ transform: filterDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
                </button>

                {filterDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      left: 0,
                      zIndex: 1000,
                      backgroundColor: '#161922',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      padding: '6px',
                      minWidth: '180px',
                      maxWidth: isMobile ? '100%' : '240px',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 6px 6px 6px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.75em', fontWeight: 'bold', color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Game Filters
                      </span>
                      {selectedFilters.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedFilters([])}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ff5252',
                            cursor: 'pointer',
                            fontSize: '0.75em',
                            padding: 0
                          }}
                        >
                          Clear All
                        </button>
                      )}
                    </div>

                    {[
                      { key: 'top25', label: 'Top 25', color: '#f1c40f' },
                      { key: 'myPicks', label: 'My Picks', color: '#4d7cff' },
                      { key: 'final', label: 'Final Games', color: '#4caf50' },
                      ...(hasAnyLiveGames ? [{ key: 'live', label: 'Live Games', color: '#e74c3c' }] : [])
                    ].map((item) => {
                      const isSelected = selectedFilters.includes(item.key);
                      return (
                        <div
                          key={item.key}
                          onClick={() => toggleFilterSelection(item.key)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '8px',
                            padding: '6px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                            color: isSelected ? (item.color || '#fff') : '#ccc',
                            fontSize: '0.85em',
                            userSelect: 'none',
                            transition: 'background-color 0.1s'
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <span style={{ fontWeight: isSelected ? '600' : 'normal' }}>{item.label}</span>
                          <span
                            style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '3px',
                              border: isSelected ? `1px solid ${item.color || '#4d7cff'}` : '1px solid rgba(255,255,255,0.25)',
                              backgroundColor: isSelected ? (item.color || '#4d7cff') : 'transparent',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            {isSelected && <Check size={12} color="#000" strokeWidth={3} />}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
          {pickGames.length === 0 && <p>No games found for this week.</p>}
          {(searchTerm || selectedConference || selectedChannels.length > 0 || selectedFilters.length > 0) && sortedFilteredGames.length === 0 && <p style={{ color: '#888' }}>No games matching your filters</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {sortedFilteredGames.map((game) => {
              const isAwayActive = picks[game.id]?.selectionTeam === game.away_team;
              const isHomeActive = picks[game.id]?.selectionTeam === game.home_team;
              const isRivalry = !!game.rivalry_trophy;
              const isFinished = isGameFinished(game);
              const isLive = isGameCurrentlyLive(game);

              // When the game is final, show ONLY the scoreboard across the card, plus date/time below
              if (isFinished) {
                const { score_home, score_away } = getGameScores(game);
                const isAwayWinner = score_away !== null && score_home !== null && score_away > score_home;
                const isHomeWinner = score_home !== null && score_away !== null && score_home > score_away;
                const pickOutcomes = getPickOutcomes(game);

                return (
                  <div key={game.id} className="game-card locked"
                     style={{ 
                       display: 'grid', 
                       gridTemplateColumns: 'minmax(0, 1fr)', 
                       gap: isMobile ? '8px' : '12px', 
                       padding: isMobile ? '12px' : '16px', 
                       alignItems: 'start',
                       maxWidth: '100%',
                       width: '100%',
                       boxSizing: 'border-box',
                       overflow: 'hidden',
                       ...(isRivalry ? { backgroundColor: '#0b0b2b', borderColor: '#1F1F75' } : {})
                     }}>
                    {isRivalry && (
                      <div style={{ textAlign: 'center', marginBottom: '4px', color: '#FFD700', fontWeight: 'bold', fontSize: '0.9em', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {game.rivalry_trophy}
                      </div>
                    )}

                    <div className="scoreboard-box" style={{
                      padding: '16px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(0, 0, 0, 0.35)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
                      maxWidth: '100%',
                      width: '100%',
                      minWidth: 0,
                      boxSizing: 'border-box',
                      overflow: 'hidden'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85em', color: '#888', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px', marginBottom: '2px', flexWrap: 'wrap', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            color: '#fff',
                            fontWeight: 'bold',
                            letterSpacing: '0.05em'
                          }}>
                            FINAL
                          </span>
                          {pickOutcomes.map((outcome, oIdx) => (
                            <span
                              key={oIdx}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '0.82em',
                                fontWeight: 'bold',
                                backgroundColor: outcome.result === 'win' 
                                  ? 'rgba(76, 175, 80, 0.25)' 
                                  : outcome.result === 'loss' 
                                    ? 'rgba(244, 67, 54, 0.25)' 
                                    : 'rgba(255, 152, 0, 0.25)',
                                color: outcome.result === 'win' 
                                  ? '#4caf50' 
                                  : outcome.result === 'loss' 
                                    ? '#f44336' 
                                    : '#ff9800',
                                border: `1px solid ${
                                  outcome.result === 'win' 
                                    ? 'rgba(76, 175, 80, 0.4)' 
                                    : outcome.result === 'loss' 
                                      ? 'rgba(244, 67, 54, 0.4)' 
                                      : 'rgba(255, 152, 0, 0.4)'
                                }`
                              }}
                            >
                              {outcome.indicatorText}
                            </span>
                          ))}
                        </div>
                        {score_home !== null && score_away !== null && (
                          <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontWeight: '500' }}>
                            Total Points: {score_home + score_away}
                          </span>
                        )}
                      </div>
                      
                      {/* Away Team Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {game.away_logo && <img src={game.away_logo} alt="" style={{ height: '24px', width: '24px', objectFit: 'contain' }} />}
                          <span style={{ 
                            fontSize: '1.05rem',
                            fontWeight: isAwayWinner ? 'bold' : 'normal',
                            color: isAwayWinner ? '#fff' : '#aaa'
                          }}>
                            {formatTeamDisplayName(game.away_team)}
                          </span>
                        </div>
                        <span style={{ 
                          fontSize: '1.4em', 
                          fontWeight: 'bold',
                          color: isAwayWinner ? '#4caf50' : '#fff'
                        }}>
                          {score_away ?? '—'}
                        </span>
                      </div>

                      {/* Home Team Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {game.home_logo && <img src={game.home_logo} alt="" style={{ height: '24px', width: '24px', objectFit: 'contain' }} />}
                          <span style={{ 
                            fontSize: '1.05rem',
                            fontWeight: isHomeWinner ? 'bold' : 'normal',
                            color: isHomeWinner ? '#fff' : '#aaa'
                          }}>
                            {formatTeamDisplayName(game.home_team)}
                          </span>
                        </div>
                        <span style={{ 
                          fontSize: '1.4em', 
                          fontWeight: 'bold',
                          color: isHomeWinner ? '#4caf50' : '#fff'
                        }}>
                          {score_home ?? '—'}
                        </span>
                      </div>

                      {/* Collapsible Box Score for Final Game */}
                      <BoxScore
                        apiGameId={game.api_game_id}
                        homeTeamName={game.home_team}
                        awayTeamName={game.away_team}
                      />
                    </div>

                    {/* Only keep game date and time below the scoreboard */}
                    <div style={{ fontSize: '0.85em', color: '#888', marginTop: '2px', paddingLeft: '4px' }}>
                      <span>{new Date(game.commence_time).toLocaleString()}</span>
                    </div>
                  </div>
                );
              }

              // When the game is live, show ONLY the scoreboard across the card, with pick indicator & date/time below
              if (isLive) {
                const live = liveScores[String(game.api_game_id)] || liveScores[game.api_game_id] || {};
                const livePickIndicators = getLivePickIndicators(game);
                const { score_home, score_away } = getGameScores(game);
                const isAwayLeading = score_away !== null && score_home !== null && score_away > score_home;
                const isHomeLeading = score_home !== null && score_away !== null && score_home > score_away;

                const maxPeriods = Math.max(
                  4,
                  live.period || 4,
                  live.linescores_away?.length || 0,
                  live.linescores_home?.length || 0
                );
                const periodHeaders = Array.from({ length: maxPeriods }, (_, i) => (i < 4 ? `Q${i + 1}` : `OT${i - 3}`));

                return (
                  <div key={game.id} className="game-card live"
                     style={{ 
                       display: 'grid', 
                       gridTemplateColumns: 'minmax(0, 1fr)', 
                       gap: isMobile ? '8px' : '12px', 
                       padding: isMobile ? '12px' : '16px', 
                       alignItems: 'start',
                       maxWidth: '100%',
                       width: '100%',
                       boxSizing: 'border-box',
                       overflow: 'hidden',
                       ...(isRivalry ? { backgroundColor: '#0b0b2b', borderColor: '#1F1F75' } : {})
                     }}>
                    {isRivalry && (
                      <div style={{ textAlign: 'center', marginBottom: '4px', color: '#FFD700', fontWeight: 'bold', fontSize: '0.9em', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {game.rivalry_trophy}
                      </div>
                    )}

                    <div className="scoreboard-box" style={{
                      padding: '16px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(77, 124, 255, 0.08)',
                      border: '1px solid rgba(77, 124, 255, 0.3)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
                      maxWidth: '100%',
                      width: '100%',
                      minWidth: 0,
                      boxSizing: 'border-box',
                      overflow: 'hidden'
                    }}>
                      {/* Top Header Bar: LIVE status, Pick Indicators, Refresh button */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85em', color: '#888', borderBottom: '1px solid rgba(77, 124, 255, 0.2)', paddingBottom: '8px', marginBottom: '2px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span className="game-status-live" style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            fontSize: '0.82em',
                            letterSpacing: '0.05em'
                          }}>
                            LIVE
                          </span>
                          <span style={{ fontWeight: 'bold', color: '#4d7cff', letterSpacing: '0.05em' }}>
                            {live.status === 'Halftime' ? 'HALFTIME' : (live.period ? `Q${live.period} - ${live.clock || ''}` : 'IN PROGRESS')}
                          </span>
                          {/* Pick Indicators */}
                          {livePickIndicators.map((ind, iIdx) => (
                            <span
                              key={iIdx}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '0.82em',
                                fontWeight: 'bold',
                                backgroundColor: 'rgba(77, 124, 255, 0.2)',
                                color: '#fff',
                                border: '1px solid rgba(77, 124, 255, 0.5)'
                              }}
                              title={`Your Pick (${ind.type})`}
                            >
                              <span style={{ color: '#4d7cff', fontWeight: 'bold', fontSize: '0.9em' }}>Pick:</span>
                              {ind.text}
                            </span>
                          ))}
                        </div>

                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                          {live.downDistance && (
                            <span style={{ color: '#fff', fontWeight: '500', fontSize: '0.85em' }}>{live.downDistance}</span>
                          )}
                          {!live.downDistance && live.possessionText && (
                            <span style={{ color: '#fff', fontWeight: '500', fontSize: '0.85em' }}>Ball on {live.possessionText}</span>
                          )}
                          <button
                            type="button"
                            onClick={() => refreshSingleGame(game.api_game_id)}
                            disabled={refreshingGameId === game.api_game_id}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '0.78em',
                              fontWeight: '600',
                              backgroundColor: 'rgba(77, 124, 255, 0.15)',
                              border: '1px solid rgba(77, 124, 255, 0.35)',
                              color: '#fff',
                              cursor: refreshingGameId === game.api_game_id ? 'not-allowed' : 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            title="Refresh live score, time, down & distance"
                          >
                            <RefreshCw size={12} className={refreshingGameId === game.api_game_id ? 'animate-spin' : ''} />
                            {refreshingGameId === game.api_game_id ? '...' : 'Refresh'}
                          </button>
                        </div>
                      </div>

                      {/* Last play indicator if present */}
                      {live.lastPlayText && (
                        <div style={{
                          fontSize: '0.78em',
                          color: 'rgba(255, 255, 255, 0.85)',
                          backgroundColor: 'rgba(0, 0, 0, 0.25)',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          lineHeight: '1.3'
                        }}>
                          <span style={{ color: '#4d7cff', fontWeight: '600', marginRight: '5px' }}>Last Play:</span>
                          {live.lastPlayText}
                        </div>
                      )}

                      {/* Period Linescores Table */}
                      {live.linescores_away && live.linescores_home && (live.linescores_away.length > 0 || live.linescores_home.length > 0) ? (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85em' }}>
                            <thead>
                              <tr style={{ color: 'rgba(255,255,255,0.6)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                <th style={{ textAlign: 'left', padding: '4px 6px', fontWeight: 'normal' }}>Team</th>
                                {periodHeaders.map((header, idx) => (
                                  <th key={header} style={{
                                    textAlign: 'center',
                                    padding: '4px 6px',
                                    fontWeight: (live.period === idx + 1 && live.status !== 'Halftime') ? 'bold' : 'normal',
                                    color: (live.period === idx + 1 && live.status !== 'Halftime') ? '#4d7cff' : 'inherit',
                                    minWidth: '24px'
                                  }}>
                                    {header}
                                  </th>
                                ))}
                                <th style={{ textAlign: 'right', padding: '4px 6px', fontWeight: 'bold', minWidth: '30px' }}>T</th>
                              </tr>
                            </thead>
                            <tbody>
                              {/* Away Team Row */}
                              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '6px 6px', verticalAlign: 'middle' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {game.away_logo && <img src={game.away_logo} alt="" style={{ height: '20px', width: '20px', objectFit: 'contain' }} />}
                                    <span style={{
                                      fontWeight: isAwayLeading ? 'bold' : 'normal',
                                      color: isAwayLeading ? '#fff' : '#ccc'
                                    }}>
                                      {formatTeamDisplayName(game.away_team)}
                                    </span>
                                  </div>
                                </td>
                                {periodHeaders.map((_, idx) => {
                                  const line = live.linescores_away?.find(l => l.period === idx + 1);
                                  const val = line ? line.score : (idx + 1 <= (live.period || 1) ? '0' : '-');
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
                                  color: isAwayLeading ? '#4caf50' : '#fff'
                                }}>
                                  {score_away ?? '—'}
                                </td>
                              </tr>

                              {/* Home Team Row */}
                              <tr>
                                <td style={{ padding: '6px 6px', verticalAlign: 'middle' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {game.home_logo && <img src={game.home_logo} alt="" style={{ height: '20px', width: '20px', objectFit: 'contain' }} />}
                                    <span style={{
                                      fontWeight: isHomeLeading ? 'bold' : 'normal',
                                      color: isHomeLeading ? '#fff' : '#ccc'
                                    }}>
                                      {formatTeamDisplayName(game.home_team)}
                                    </span>
                                  </div>
                                </td>
                                {periodHeaders.map((_, idx) => {
                                  const line = live.linescores_home?.find(l => l.period === idx + 1);
                                  const val = line ? line.score : (idx + 1 <= (live.period || 1) ? '0' : '-');
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
                                  color: isHomeLeading ? '#4caf50' : '#fff'
                                }}>
                                  {score_home ?? '—'}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        /* Fallback simpler team score rows if linescores aren't populated */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {game.away_logo && <img src={game.away_logo} alt="" style={{ height: '24px', width: '24px', objectFit: 'contain' }} />}
                              <span style={{ 
                                fontSize: '1.05rem',
                                fontWeight: isAwayLeading ? 'bold' : 'normal',
                                color: isAwayLeading ? '#fff' : '#aaa'
                              }}>
                                {formatTeamDisplayName(game.away_team)}
                              </span>
                            </div>
                            <span style={{ 
                              fontSize: '1.4em', 
                              fontWeight: 'bold',
                              color: isAwayLeading ? '#4caf50' : '#fff'
                            }}>
                              {score_away ?? '—'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {game.home_logo && <img src={game.home_logo} alt="" style={{ height: '24px', width: '24px', objectFit: 'contain' }} />}
                              <span style={{ 
                                fontSize: '1.05rem',
                                fontWeight: isHomeLeading ? 'bold' : 'normal',
                                color: isHomeLeading ? '#fff' : '#aaa'
                              }}>
                                {formatTeamDisplayName(game.home_team)}
                              </span>
                            </div>
                            <span style={{ 
                              fontSize: '1.4em', 
                              fontWeight: 'bold',
                              color: isHomeLeading ? '#4caf50' : '#fff'
                            }}>
                              {score_home ?? '—'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Collapsible Box Score for Live Game */}
                      <BoxScore
                        apiGameId={game.api_game_id}
                        homeTeamName={game.home_team}
                        awayTeamName={game.away_team}
                      />
                    </div>

                    {/* Only keep game date and time below the scoreboard */}
                    <div style={{ fontSize: '0.85em', color: '#888', marginTop: '2px', paddingLeft: '4px' }}>
                      <span>{new Date(game.commence_time).toLocaleString()}</span>
                    </div>
                  </div>
                );
              }

              return (
                <div key={game.id} className={`game-card ${isGameLocked(game) ? 'locked' : ''} ${isGameCurrentlyLive(game) ? 'live' : ''}`}
                   style={{ 
                     display: 'grid', 
                     gridTemplateColumns: isMobile ? 'minmax(0, 1fr)' : 'minmax(0, 1fr) minmax(0, 1fr)', 
                     gap: isMobile ? '12px' : '20px', 
                     padding: isMobile ? '12px' : '20px', 
                     alignItems: 'start',
                     maxWidth: '100%',
                     width: '100%',
                     boxSizing: 'border-box',
                     overflow: 'hidden',
                     ...(isRivalry ? { backgroundColor: '#0b0b2b', borderColor: '#1F1F75' } : {})
                   }}>
                
                {/* Left Column: Toggle and Game Info */}
                <div className="pick-interface" style={{ maxWidth: '100%', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
                  {isRivalry && (
                    <div style={{ textAlign: 'center', marginBottom: '10px', color: '#FFD700', fontWeight: 'bold', fontSize: '0.9em', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {game.rivalry_trophy}
                    </div>
                  )}
                  <div className="game-header" style={{ alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', width: '100%', maxWidth: '540px', gap: '4px', boxSizing: 'border-box' }}>
                    <div style={{ flex: 1, minWidth: '120px', textAlign: 'center', padding: '0 4px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <strong>{formatTeamDisplayName(game.away_team)}</strong>
                    </div>
                    <div style={{ flex: 1, minWidth: '120px', textAlign: 'center', padding: '0 4px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <strong>{formatTeamDisplayName(game.home_team)}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                    <div className="game-switch">
                      <button
                        type="button"
                        className={`game-switch-option ${isAwayActive ? 'active' : ''}`}
                        onClick={() => handlePickChange(game, game.away_team)}
                        disabled={isGameLocked(game)}
                      >
                        {game.away_logo ? (
                          <img src={game.away_logo} alt={game.away_team} style={{ height: '41px', width: '41px', objectFit: 'contain' }} />
                        ) : isMobile ? (
                          <img src="/logos/iowa.png" alt={game.away_team} style={{ height: '41px', width: '41px', objectFit: 'contain' }} />
                        ) : (
                          game.away_team
                        )}
                        <span className="switch-option-label" style={getSpreadStyle(game, game.away_team, isAwayActive, picks[game.id])}>
                          {isAwayActive && !isGameLocked(game) && (
                            <span onClick={e => e.stopPropagation()} style={{ display: 'inline-flex', flexDirection: 'column', gap: '1px', marginRight: '3px', verticalAlign: 'middle' }}>
                              <span role="button" tabIndex={0} onClick={() => handleSpreadAdjust(game, 0.5)} onKeyDown={e => e.key === 'Enter' && handleSpreadAdjust(game, 0.5)} style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '2px', color: 'inherit', cursor: 'pointer', fontSize: '0.6em', lineHeight: 1, padding: '1px 3px', userSelect: 'none' }}>▲</span>
                              <span role="button" tabIndex={0} onClick={() => handleSpreadAdjust(game, -0.5)} onKeyDown={e => e.key === 'Enter' && handleSpreadAdjust(game, -0.5)} style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '2px', color: 'inherit', cursor: 'pointer', fontSize: '0.6em', lineHeight: 1, padding: '1px 3px', userSelect: 'none' }}>▼</span>
                            </span>
                          )}
                          {formatSpread(game, game.away_team, picks[game.id])}
                        </span>
                      </button>
                      <button
                        type="button"
                        className={`game-switch-option ${!picks[game.id] ? 'active' : ''}`}
                        onClick={() => handlePickChange(game, null)}
                        disabled={isGameLocked(game)}
                      >
                        <span style={{ fontSize: '2.7em', color: '#1F1F75' }}>@</span>
                      </button>
                      <button
                        type="button"
                        className={`game-switch-option ${isHomeActive ? 'active' : ''}`}
                        onClick={() => handlePickChange(game, game.home_team)}
                        disabled={isGameLocked(game)}
                      >
                        {game.home_logo ? (
                          <img src={game.home_logo} alt={game.home_team} style={{ height: '41px', width: '41px', objectFit: 'contain' }} />
                        ) : isMobile ? (
                          <img src="/logos/iowa.png" alt={game.home_team} style={{ height: '41px', width: '41px', objectFit: 'contain' }} />
                        ) : (
                          game.home_team
                        )}
                        <span className="switch-option-label" style={getSpreadStyle(game, game.home_team, isHomeActive, picks[game.id])}>
                          {isHomeActive && !isGameLocked(game) && (
                            <span onClick={e => e.stopPropagation()} style={{ display: 'inline-flex', flexDirection: 'column', gap: '1px', marginRight: '3px', verticalAlign: 'middle' }}>
                              <span role="button" tabIndex={0} onClick={() => handleSpreadAdjust(game, 0.5)} onKeyDown={e => e.key === 'Enter' && handleSpreadAdjust(game, 0.5)} style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '2px', color: 'inherit', cursor: 'pointer', fontSize: '0.6em', lineHeight: 1, padding: '1px 3px', userSelect: 'none' }}>▲</span>
                              <span role="button" tabIndex={0} onClick={() => handleSpreadAdjust(game, -0.5)} onKeyDown={e => e.key === 'Enter' && handleSpreadAdjust(game, -0.5)} style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '2px', color: 'inherit', cursor: 'pointer', fontSize: '0.6em', lineHeight: 1, padding: '1px 3px', userSelect: 'none' }}>▼</span>
                            </span>
                          )}
                          {formatSpread(game, game.home_team, picks[game.id])}
                        </span>
                      </button>
                      <span
                        className="game-switch-slider"
                        style={{
                          transform: isHomeActive 
                            ? 'translateX(200%)' 
                            : isAwayActive 
                              ? 'translateX(0)' 
                              : 'translateX(100%)',
                          backgroundColor: isHomeActive 
                            ? (game.home_color || '#4d7cff') 
                            : (isAwayActive ? (game.away_color || '#4d7cff') : '#E8979F')
                        }}
                      />
                    </div>
                    {(isAwayActive || isHomeActive) && (() => {
                      const selectionTeam = isAwayActive ? game.away_team : game.home_team;
                      const isConflicted = isSpreadLockConflicted(game.id, selectionTeam);
                      const conflictPlayer = isConflicted ? getConflictingPlayer(game.id, selectionTeam, null) : null;
                      const isLocked = isGameLocked(game);
                      const isDisabled = isLocked || isConflicted;
                      
                      let title = picks[game.id]?.isLock && picks[game.id]?.lockType === 'spread' ? "Unlock Spread" : "Lock Spread";
                      if (isConflicted) title = `Cannot lock: ${conflictPlayer} already locked this pick`;

                      return (
                        <button
                          type="button"
                          onClick={() => handleLockToggle(game, 'spread')}
                          disabled={isDisabled}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                            padding: '4px 8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isConflicted ? '#f44336' : (picks[game.id]?.isLock && picks[game.id]?.lockType === 'spread' ? '#f1c40f' : 'rgba(255,255,255,0.2)'),
                            transition: 'color 0.2s',
                            opacity: isConflicted ? 0.5 : 1
                          }}
                          title={title}
                        >
                          <Lock 
                            size={30} 
                            fill="none" 
                            strokeWidth={picks[game.id]?.isLock && picks[game.id]?.lockType === 'spread' ? 3 : 2} 
                          />
                        </button>
                      );
                    })()}
                  </div>

                  {(game.over_under != null || picks[game.id]?.totalLine != null) && (
                    <>
                      <div style={{ width: '100%', height: '1px', backgroundColor: 'rgba(255,255,255,0.05)', margin: '10px 0' }} />
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <div className="game-switch" style={{ marginTop: 0 }}>
                          <button
                            type="button"
                            className={`game-switch-option ${picks[game.id]?.selectionTotal === 'under' ? 'active' : ''}`}
                            onClick={() => handleTotalChange(game, 'under')}
                            disabled={isGameLocked(game)}
                          >
                            <span style={{ fontWeight: 'bold', fontSize: '1.2em' }}>Under</span>
                          </button>
                        <button
                          type="button"
                          className={`game-switch-option ${!picks[game.id]?.selectionTotal ? 'active' : ''}`}
                          onClick={() => handleTotalChange(game, null)}
                          disabled={isGameLocked(game)}
                        >
                          <span style={{ fontSize: '1.5em', color: '#1F1F75', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {!isGameLocked(game) && (
                              <span onClick={e => e.stopPropagation()} style={{ display: 'inline-flex', flexDirection: 'column', gap: '1px' }}>
                                <span role="button" tabIndex={0} onClick={() => handleTotalAdjust(game, 0.5)} onKeyDown={e => e.key === 'Enter' && handleTotalAdjust(game, 0.5)} style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '2px', color: '#1F1F75', cursor: 'pointer', fontSize: '0.55em', lineHeight: 1, padding: '1px 3px', userSelect: 'none' }}>▲</span>
                                <span role="button" tabIndex={0} onClick={() => handleTotalAdjust(game, -0.5)} onKeyDown={e => e.key === 'Enter' && handleTotalAdjust(game, -0.5)} style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '2px', color: '#1F1F75', cursor: 'pointer', fontSize: '0.55em', lineHeight: 1, padding: '1px 3px', userSelect: 'none' }}>▼</span>
                              </span>
                            )}
                            {picks[game.id]?.totalLine ?? game.over_under}
                          </span>
                        </button>
                        <button
                          type="button"
                          className={`game-switch-option ${picks[game.id]?.selectionTotal === 'over' ? 'active' : ''}`}
                          onClick={() => handleTotalChange(game, 'over')}
                          disabled={isGameLocked(game)}
                        >
                          <span style={{ fontWeight: 'bold', fontSize: '1.2em' }}>Over</span>
                        </button>
                        <span
                          className="game-switch-slider"
                          style={{
                            transform: picks[game.id]?.selectionTotal === 'over'
                              ? 'translateX(200%)' 
                              : picks[game.id]?.selectionTotal === 'under'
                                ? 'translateX(0)' 
                                : 'translateX(100%)',
                            backgroundColor: picks[game.id]?.selectionTotal === 'over'
                              ? '#E8979F' 
                              : picks[game.id]?.selectionTotal === 'under'
                                ? '#E8979F' 
                                : '#E8979F'
                          }}
                        />
                      </div>
                      {(picks[game.id]?.selectionTotal === 'under' || picks[game.id]?.selectionTotal === 'over') && (() => {
                        const selectionTotal = picks[game.id].selectionTotal;
                        const isConflicted = isTotalLockConflicted(game.id, selectionTotal);
                        const conflictPlayer = isConflicted ? getConflictingPlayer(game.id, null, selectionTotal) : null;
                        const isLocked = isGameLocked(game);
                        const isDisabled = isLocked || isConflicted;
                        
                        let title = picks[game.id]?.isLock && picks[game.id]?.lockType === 'total' ? "Unlock Total" : "Lock Total";
                        if (isConflicted) title = `Cannot lock: ${conflictPlayer} already locked this pick`;

                        return (
                          <button
                            type="button"
                            onClick={() => handleLockToggle(game, 'total')}
                            disabled={isDisabled}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: isDisabled ? 'not-allowed' : 'pointer',
                              padding: '4px 8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: isConflicted ? '#f44336' : (picks[game.id]?.isLock && picks[game.id]?.lockType === 'total' ? '#f1c40f' : 'rgba(255,255,255,0.2)'),
                              transition: 'color 0.2s',
                              opacity: isConflicted ? 0.5 : 1
                            }}
                            title={title}
                          >
                            <Lock 
                              size={30} 
                              fill="none" 
                              strokeWidth={picks[game.id]?.isLock && picks[game.id]?.lockType === 'total' ? 3 : 2} 
                            />
                          </button>
                        );
                      })()}
                    </div>
                  </>
                  )}

                  <div style={{ marginTop: '12px', fontSize: '0.85em', color: '#888' }}>
                    <span>{new Date(game.commence_time).toLocaleString()}</span>
                    {!isGameLocked(game) && <CountdownTimer commenceTime={game.commence_time} />}
                    {isGameLocked(game) && (
                      <span className="game-status-locked" style={{ marginLeft: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Lock size={12} /> LOCKED
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Column: Game Intel */}
                <GameIntel game={game} picks={picks} selectedPlayer={selectedPlayer} />
              </div>
            )})}
          </div>
        </article>
      </section>

      <div className="actions">
        {message && !messageSuccess && (
          <div className="message" style={{ color: '#EF3037', fontWeight: 'bold', marginBottom: '16px', textAlign: 'center', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <AlertTriangle size={18} />
            {message}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', width: '100%', justifyContent: 'flex-end' }}>
          <button onClick={handleCopyPicks} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Copy size={16} />{copyButtonText}</button>
          <button disabled={loading || selectedWeek === null} onClick={handleSubmit} style={{ background: '#fff', color: '#000', border: '1px solid #ccc', display: 'flex', alignItems: 'center', gap: '6px' }}><Save size={16} />Save Picks</button>
        </div>
      </div>
    </>
  );
};

export default PicksPage;