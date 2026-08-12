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
  'Live scores update every 5 minutes during active games.',
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

const GameIntel = ({ game, picks }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [injuries, setInjuries] = useState(null);
  const [loadingInjuries, setLoadingInjuries] = useState(false);
  const [travelDistance, setTravelDistance] = useState(null);
  const [loadingTravel, setLoadingTravel] = useState(false);
  const [matchupStats, setMatchupStats] = useState(null);
  const [loadingMatchupStats, setLoadingMatchupStats] = useState(false);

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

  return (
    <div className="game-intel" style={{ padding: '3px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '10px', height: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ fontSize: '0.75em', color: '#E8979F', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Game Intel</div>
      
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
                    <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1.2fr 1.2fr', gap: '4px', fontWeight: 'bold', color: '#E8979F', fontSize: '0.9em' }}>
                      <span>Stat</span>
                      <span>{game.away_team.split('(')[0].trim()}</span>
                      <span>{game.home_team.split('(')[0].trim()}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1.1fr 1.1fr', gap: '4px', color: '#ccc' }}>
                      <span title="Points scored per game">Scoring Offense</span>
                      <span style={offAwayStyle}>{away.scoringOffense != null ? `${away.scoringOffense} PPG` : '--'}</span>
                      <span style={offHomeStyle}>{home.scoringOffense != null ? `${home.scoringOffense} PPG` : '--'}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1.1fr 1.1fr', gap: '4px', color: '#ccc' }}>
                      <span title="Points allowed per game">Scoring Defense</span>
                      <span style={defAwayStyle}>{away.scoringDefense != null ? `${away.scoringDefense} PPG` : '--'}</span>
                      <span style={defHomeStyle}>{home.scoringDefense != null ? `${home.scoringDefense} PPG` : '--'}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1.1fr 1.1fr', gap: '4px', color: '#ccc' }}>
                      <span title="Yards gained per play on offense">Yards Per Play</span>
                      <span style={yppAwayStyle}>{away.yardsPerPlay != null ? away.yardsPerPlay : '--'}</span>
                      <span style={yppHomeStyle}>{home.yardsPerPlay != null ? home.yardsPerPlay : '--'}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1.1fr 1.1fr', gap: '4px', color: '#ccc' }}>
                      <span title="Yards allowed per play on defense">Yards/Play Allowed</span>
                      <span style={yppaAwayStyle}>{away.yardsPerPlayAllowed != null ? away.yardsPerPlayAllowed : '--'}</span>
                      <span style={yppaHomeStyle}>{home.yardsPerPlayAllowed != null ? home.yardsPerPlayAllowed : '--'}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1.1fr 1.1fr', gap: '4px', color: '#ccc' }}>
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
                    <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1.1fr 1.1fr', gap: '4px', fontWeight: 'bold', color: '#E8979F', fontSize: '0.9em' }}>
                      <span>Betting Stat</span>
                      <span>{game.away_team.split('(')[0].trim()}</span>
                      <span>{game.home_team.split('(')[0].trim()}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1.1fr 1.1fr', gap: '4px', color: '#ccc' }}>
                      <span title="How often each team covers the spread overall">ATS Overall</span>
                      <span>{away.ats.overall}</span>
                      <span>{home.ats.overall}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1.1fr 1.1fr', gap: '4px', color: '#ccc' }}>
                      <span title="How often each team covers the spread in home/away splits">ATS Home/Away</span>
                      <span>{away.ats.away} (Away)</span>
                      <span>{home.ats.home} (Home)</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1.1fr 1.1fr', gap: '4px', color: '#ccc' }}>
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
                    <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1.1fr 1.1fr', gap: '4px', color: '#ccc' }}>
                      <span title="How often each team's games go over or under the total line overall (Overs-Unders-Pushes)">O/U Overall</span>
                      <span>{away.ou.overall}</span>
                      <span>{home.ou.overall}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1.1fr 1.1fr', gap: '4px', color: '#ccc' }}>
                      <span title="How often each team's games go over or under the total line in home/away splits (Overs-Unders-Pushes)">O/U Home/Away</span>
                      {ouHomeAway.awayJsx}
                      {ouHomeAway.homeJsx}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1.1fr 1.1fr', gap: '4px', color: '#ccc' }}>
                      <span title="ATS performance over the last 5 games">ATS Streak (Last 5)</span>
                      <span style={{fontFamily: 'monospace' }}>{away.streak.ats}</span>
                      <span style={{fontFamily: 'monospace' }}>{home.streak.ats}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1.1fr 1.1fr', gap: '4px', color: '#ccc' }}>
                      <span title="O/U performance over the last 5 games">O/U Streak (Last 5)</span>
                      <span style={{ fontFamily: 'monospace' }}>{away.streak.ou}</span>
                      <span style={{ fontFamily: 'monospace' }}>{home.streak.ou}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
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
                            size={20} 
                            fill="none" 
                            strokeWidth={picks[game.id]?.isLock && picks[game.id]?.lockType === 'spread' ? 3 : 2} 
                          />
                        </button>
                      );
                    })()}
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
                              size={20} 
                              fill="none" 
                              strokeWidth={picks[game.id]?.isLock && picks[game.id]?.lockType === 'total' ? 3 : 2} 
                            />
                          </button>
                        );
                      })()}
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