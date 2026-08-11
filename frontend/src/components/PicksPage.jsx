import React, { useState, useEffect } from 'react';
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, CloudFog, Wind, Droplets, Thermometer, CloudHail, Lock, Copy, Save, Info, AlertTriangle } from 'lucide-react';
import useIsMobile from '../hooks/useIsMobile';

const RULES = [
  'Pick the spread and/or over/under for any game each week.',
  'You may pick both the spread and the over/under for the same game — they count as separate picks.',
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>Each week you may designate one pick as your <Lock size={12} style={{ color: '#f1c40f', flexShrink: 0 }} /> Lock — your best bet of the week.</span>,
  'Only one Lock is allowed per week. Lock record is tracked separately on the leaderboard.',
  'Picks must be submitted before the game kicks off.',
];

const SITE_DETAILS = [
  'Live scores update every 15 minutes during active games.',
  'Game odds and lines update every 4 hours.',
  'Weather forecasts update daily and show conditions at kickoff.',
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
  return { color: spread < 0 ? '#4caf50' : '#fc6363', fontWeight: 'bold' };
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

const GameIntel = ({ game, picks }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [injuries, setInjuries] = useState(null);
  const [loadingInjuries, setLoadingInjuries] = useState(false);

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

  useEffect(() => {
    const fetchWeather = async () => {
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
  }, [game.id, game.commence_time, game.home_stadium_city, game.home_stadium_state, game.home_team]);

  return (
    <div className="game-intel" style={{ padding: '3px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '10px', height: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ fontSize: '0.75em', color: '#888', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Game Intel</div>
      
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
          <div style={{ fontSize: '0.7em', color: '#555', fontWeight: 'bold' }}>COBW</div>
          <div style={{ fontSize: '0.85em' }}>{game.away_team}: {game.away_cobw || 'No'}</div>
          <div style={{ fontSize: '0.85em' }}>{game.home_team}: {game.home_cobw || 'No'}</div>
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
            <div style={{ maxHeight: '80px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {injuries.map((inj, idx) => (
                <div key={idx} style={{ fontSize: '0.75em', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '2px' }}>
                  <span style={{ fontWeight: 'bold', color: '#fff' }}>{inj.player_name}</span> ({inj.status})
                  <div style={{ fontSize: '0.9em', color: '#aaa' }}>{inj.team_name} - {inj.short_comment || inj.long_comment || 'No details'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div>
          <div style={{ fontSize: '0.7em', color: '#555', fontWeight: 'bold' }}>Stadium</div>
          <div style={{ fontSize: '0.85em' }}>{game.home_stadium_name || '--'}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.7em', color: '#555', fontWeight: 'bold' }}>Location</div>
          <div style={{ fontSize: '0.85em' }}>{game.home_stadium_city && game.home_stadium_state ? `${game.home_stadium_city}, ${game.home_stadium_state}` : '--'}</div>
        </div>
      </div>
      <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', alignItems: 'start' }}>
        <div>
        <div style={{ fontSize: '0.7em', color: '#555', fontWeight: 'bold', marginBottom: '4px' }}>Weather at Kickoff</div>
        {loading ? (
          <div style={{ fontSize: '0.85em', color: '#aaa' }}>Fetching forecast...</div>
        ) : weather?.success ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ flexShrink: 0 }}>{getWeatherIcon(weather.code)}</div>
            <div>
              <div style={{ fontSize: '1.1em', fontWeight: 'bold', color: '#fff' }}>
                {weather.temp}°F &nbsp;
                <span style={{ fontSize: '0.75em', fontWeight: 'normal', color: '#aaa' }}>{getWeatherLabel(weather.code)}</span>
                {weather.isMock && <span style={{ fontSize: '0.65em', color: '#555', marginLeft: '6px' }}>(preview)</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78em', color: '#888', marginTop: '3px' }}>
                <Wind size={12} strokeWidth={1.5} />
                <span>{weather.wind} mph</span>
                <span style={{ color: '#444' }}>·</span>
                <Droplets size={12} strokeWidth={1.5} />
                <span>{weather.precip}% precip</span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '0.85em', color: '#666' }}>
            {weather?.reason || 'Forecast unavailable'}
          </div>
        )}
        </div>
        {game.tv_network && (
          <div>
            <div style={{ fontSize: '0.7em', color: '#555', fontWeight: 'bold', marginBottom: '4px' }}>TV</div>
            <div style={{ fontSize: '1em', fontWeight: 'bold', color: '#fff' }}>{game.tv_network}</div>
          </div>
        )}
      </div>
    </div>
  );
};

const PicksPage = ({
  pickGames,
  picks,
  games,
  handlePickChange,
  handleTotalChange,
  handleLockToggle,
  isGameLocked,
  isGameLive,
  handleSubmit,
  loading,
  selectedWeek,
  message,
  messageSuccess = false,
  teams = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConference, setSelectedConference] = useState('');
  const [showOnlyMyPicks, setShowOnlyMyPicks] = useState(false);
  const [copyButtonText, setCopyButtonText] = useState('Copy Picks');
  const [liveScores, setLiveScores] = useState({});
  const isMobile = useIsMobile();

  // Poll ESPN for live scores every 30 seconds if there are live games
  useEffect(() => {
    const liveGames = pickGames.filter(g => isGameLive(g));
    if (liveGames.length === 0) return;

    const fetchLiveScores = async () => {
      try {
        const res = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard');
        const data = await res.json();
        
        const newLiveScores = {};
        data.events.forEach(event => {
          const comp = event.competitions[0];
          const home = comp.competitors.find(c => c.homeAway === 'home');
          const away = comp.competitors.find(c => c.homeAway === 'away');
          
          newLiveScores[event.id] = {
            score_home: home.score ? parseInt(home.score) : 0,
            score_away: away.score ? parseInt(away.score) : 0,
            clock: event.status.displayClock,
            period: event.status.period,
            status: event.status.type.description,
            possession: comp.situation?.possession,
            downDistance: comp.situation?.downDistanceText
          };
        });
        
        setLiveScores(newLiveScores);
      } catch (err) {
        console.error('Failed to fetch live scores from ESPN', err);
      }
    };

    fetchLiveScores();
    const interval = setInterval(fetchLiveScores, 30000);
    return () => clearInterval(interval);
  }, [pickGames, isGameLive]);

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
    const matchesMyPicks = !showOnlyMyPicks || (
      picks[game.id] && (picks[game.id].selectionTeam || picks[game.id].selectionTotal)
    );
    return matchesSearch && matchesConference && matchesMyPicks;
  });

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


  return (
    <>
      <section className="layout-grid">
        <article className="panel" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ margin: 0 }}>Pick Games</h2>
              <RulesTooltip />
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
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                color: '#fff', 
                fontSize: '0.9em', 
                cursor: 'pointer',
                userSelect: 'none',
                marginLeft: isMobile ? '0' : '8px',
                marginTop: isMobile ? '4px' : '0'
              }}>
                <input
                  type="checkbox"
                  checked={showOnlyMyPicks}
                  onChange={(e) => setShowOnlyMyPicks(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                My Picks
              </label>
            </div>
          </div>
          {pickGames.length === 0 && <p>No games found for this week.</p>}
          {(searchTerm || selectedConference) && filteredGames.length === 0 && <p style={{ color: '#888' }}>No games matching your filters</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {filteredGames.map((game) => {
              const isAwayActive = picks[game.id]?.selectionTeam === game.away_team;
              const isHomeActive = picks[game.id]?.selectionTeam === game.home_team;
              const isRivalry = !!game.rivalry_trophy;

              

              return (
                <div key={game.id} className={`game-card ${isGameLocked(game) ? 'locked' : ''} ${isGameLive(game) ? 'live' : ''}`}
                   style={{ 
                     display: 'grid', 
                     gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
                     gap: '20px', 
                     padding: '20px', 
                     alignItems: 'start',
                     ...(isRivalry ? { backgroundColor: '#0b0b2b', borderColor: '#1F1F75' } : {})
                   }}>
                
                {/* Left Column: Toggle and Game Info */}
                <div className="pick-interface">
                  {isRivalry && (
                    <div style={{ textAlign: 'center', marginBottom: '10px', color: '#FFD700', fontWeight: 'bold', fontSize: '0.9em', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {game.rivalry_trophy}
                    </div>
                  )}
                  <div className="game-header" style={{ alignItems: 'center', marginBottom: '15px', flexWrap: 'nowrap', width: '100%', maxWidth: '540px', gap: 0 }}>
                    <div style={{ flex: 1, textAlign: 'center', padding: '0 10px' }}>
                      <strong>{game.away_team}</strong>
                    </div>
                    <div style={{ flex: 1, textAlign: 'center', padding: '0 10px' }}>
                      <strong>{game.home_team}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', gap: isMobile ? '4px' : '10px' }}>
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
                    {(isAwayActive || isHomeActive) && (
                      <button
                        type="button"
                        onClick={() => handleLockToggle(game, 'spread')}
                        disabled={isGameLocked(game)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: isGameLocked(game) ? 'not-allowed' : 'pointer',
                          padding: '4px 8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: picks[game.id]?.isLock && picks[game.id]?.lockType === 'spread' ? '#f1c40f' : 'rgba(255,255,255,0.2)',
                          transition: 'color 0.2s'
                        }}
                        title={picks[game.id]?.isLock && picks[game.id]?.lockType === 'spread' ? "Unlock Spread" : "Lock Spread"}
                      >
                        <Lock 
                          size={20} 
                          fill="none" 
                          strokeWidth={picks[game.id]?.isLock && picks[game.id]?.lockType === 'spread' ? 3 : 2} 
                        />
                      </button>
                    )}
                  </div>

                  {(game.over_under != null || picks[game.id]?.totalLine != null) && (
                    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', gap: isMobile ? '4px' : '10px', marginTop: '10px' }}>
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
                          <span style={{ fontSize: '1.5em', color: '#1F1F75', fontWeight: 'bold' }}>{game.over_under ?? picks[game.id]?.totalLine}</span>
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
                              ? '#4caf50' 
                              : picks[game.id]?.selectionTotal === 'under'
                                ? '#f44336' 
                                : '#E8979F'
                          }}
                        />
                      </div>
                      {(picks[game.id]?.selectionTotal === 'under' || picks[game.id]?.selectionTotal === 'over') && (
                        <button
                          type="button"
                          onClick={() => handleLockToggle(game, 'total')}
                          disabled={isGameLocked(game)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: isGameLocked(game) ? 'not-allowed' : 'pointer',
                            padding: '4px 8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: picks[game.id]?.isLock && picks[game.id]?.lockType === 'total' ? '#f1c40f' : 'rgba(255,255,255,0.2)',
                            transition: 'color 0.2s'
                          }}
                          title={picks[game.id]?.isLock && picks[game.id]?.lockType === 'total' ? "Unlock Total" : "Lock Total"}
                        >
                          <Lock 
                            size={20} 
                            fill="none" 
                            strokeWidth={picks[game.id]?.isLock && picks[game.id]?.lockType === 'total' ? 3 : 2} 
                          />
                        </button>
                      )}
                    </div>
                  )}

                  <div style={{ marginTop: '12px', fontSize: '0.85em', color: '#888' }}>
                    <span>{new Date(game.commence_time).toLocaleString()}</span>
                    {!isGameLocked(game) && <CountdownTimer commenceTime={game.commence_time} />}
                    {isGameLive(game) && <span className="game-status-live" style={{ marginLeft: '10px' }}>LIVE</span>}
                    {!isGameLive(game) && isGameLocked(game) && !game.completed && (
                      <span className="game-status-locked" style={{ marginLeft: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Lock size={12} /> LOCKED
                      </span>
                    )}
                  </div>

                  {/* Live Scoreboard */}
                  {isGameLive(game) && liveScores[game.api_game_id] && (
                    <div className="scoreboard-box" style={{
                      marginTop: '15px',
                      padding: '12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(77, 124, 255, 0.1)',
                      border: '1px solid rgba(77, 124, 255, 0.3)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8em', color: '#4d7cff', borderBottom: '1px solid rgba(77, 124, 255, 0.2)', paddingBottom: '4px', marginBottom: '2px' }}>
                        <span style={{ fontWeight: 'bold', letterSpacing: '0.05em' }}>
                          {liveScores[game.api_game_id].status === 'Halftime' ? 'HALFTIME' : `Q${liveScores[game.api_game_id].period} - ${liveScores[game.api_game_id].clock}`}
                        </span>
                        {liveScores[game.api_game_id].downDistance && (
                          <span style={{ color: '#fff' }}>{liveScores[game.api_game_id].downDistance}</span>
                        )}
                      </div>
                      
                      {/* Away Team Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {game.away_logo && <img src={game.away_logo} alt="" style={{ height: '20px', width: '20px', objectFit: 'contain' }} />}
                          <span style={{ 
                            fontWeight: liveScores[game.api_game_id].score_away > liveScores[game.api_game_id].score_home ? 'bold' : 'normal',
                            color: liveScores[game.api_game_id].score_away > liveScores[game.api_game_id].score_home ? '#fff' : '#aaa'
                          }}>
                            {game.away_team}
                          </span>
                        </div>
                        <span style={{ 
                          fontSize: '1.2em', 
                          fontWeight: 'bold',
                          color: liveScores[game.api_game_id].score_away > liveScores[game.api_game_id].score_home ? '#4caf50' : '#fff'
                        }}>
                          {liveScores[game.api_game_id].score_away}
                        </span>
                      </div>

                      {/* Home Team Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {game.home_logo && <img src={game.home_logo} alt="" style={{ height: '20px', width: '20px', objectFit: 'contain' }} />}
                          <span style={{ 
                            fontWeight: liveScores[game.api_game_id].score_home > liveScores[game.api_game_id].score_away ? 'bold' : 'normal',
                            color: liveScores[game.api_game_id].score_home > liveScores[game.api_game_id].score_away ? '#fff' : '#aaa'
                          }}>
                            {game.home_team}
                          </span>
                        </div>
                        <span style={{ 
                          fontSize: '1.2em', 
                          fontWeight: 'bold',
                          color: liveScores[game.api_game_id].score_home > liveScores[game.api_game_id].score_away ? '#4caf50' : '#fff'
                        }}>
                          {liveScores[game.api_game_id].score_home}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Final Scoreboard */}
                  {!!game.completed && (
                    <div className="scoreboard-box" style={{
                      marginTop: '15px',
                      padding: '12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(0, 0, 0, 0.25)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8em', color: '#888', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px', marginBottom: '2px' }}>
                        <span style={{ fontWeight: 'bold', letterSpacing: '0.05em' }}>FINAL</span>
                        {game.score_home !== null && game.score_away !== null && (
                          <span>Total: {game.score_home + game.score_away}</span>
                        )}
                      </div>
                      
                      {/* Away Team Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {game.away_logo && <img src={game.away_logo} alt="" style={{ height: '20px', width: '20px', objectFit: 'contain' }} />}
                          <span style={{ 
                            fontWeight: game.score_away > game.score_home ? 'bold' : 'normal',
                            color: game.score_away > game.score_home ? '#fff' : '#aaa'
                          }}>
                            {game.away_team}
                          </span>
                        </div>
                        <span style={{ 
                          fontSize: '1.2em', 
                          fontWeight: 'bold',
                          color: game.score_away > game.score_home ? '#4caf50' : '#fff'
                        }}>
                          {game.score_away}
                        </span>
                      </div>

                      {/* Home Team Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {game.home_logo && <img src={game.home_logo} alt="" style={{ height: '20px', width: '20px', objectFit: 'contain' }} />}
                          <span style={{ 
                            fontWeight: game.score_home > game.score_away ? 'bold' : 'normal',
                            color: game.score_home > game.score_away ? '#fff' : '#aaa'
                          }}>
                            {game.home_team}
                          </span>
                        </div>
                        <span style={{ 
                          fontSize: '1.2em', 
                          fontWeight: 'bold',
                          color: game.score_home > game.score_away ? '#4caf50' : '#fff'
                        }}>
                          {game.score_home}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Statistics */}
                <GameIntel game={game} picks={picks} />
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