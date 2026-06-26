import React, { useState, useEffect } from 'react';
import useIsMobile from '../hooks/useIsMobile';

const formatSpread = (game, team) => {
  const spread = team === game.home_team ? game.spread_home : game.spread_away;
  if (spread === null || spread === 0) return 'PK';
  return spread > 0 ? `+${spread}` : `${spread}`;
};

const getSpreadStyle = (game, team, isActive) => {
  if (isActive) return { color: '#fff' };
  const spread = team === game.home_team ? game.spread_home : game.spread_away;
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

const GameIntel = ({ game }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      const kickoff = new Date(game.commence_time);
      const now = new Date();
      // Open-Meteo forecast is available for ~14 days.
      const daysUntil = (kickoff - now) / (1000 * 60 * 60 * 24);

      if (daysUntil > 14 || daysUntil < -1) {
        setWeather({ unavailable: true, reason: daysUntil < 0 ? 'Game Finished' : 'Forecast N/A' });
        return;
      }

      setLoading(true);
      try {
        // 1. Geocode the home team to find location coordinates.
        // We clean the name slightly (e.g., "Miami (FL)" -> "Miami") for better search results.
        const searchTerm = game.home_team.split('(')[0].trim();
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(game.home_stadium_city || searchTerm)}&count=1&language=en&format=json`;
        const geoRes = await fetch(geoUrl);
        const geoData = await geoRes.json();

        if (!geoData.results?.length) {
          setWeather({ error: true });
          return;
        }

        const { latitude, longitude, name, admin1 } = geoData.results[0];
        const datePart = kickoff.toISOString().split('T')[0];

        // 2. Fetch hourly forecast for the kickoff date.
        // Using UTC timezone for both API and JS Date object to ensure alignment of the hourly index.
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,weather_code&temperature_unit=fahrenheit&timezone=UTC&start_date=${datePart}&end_date=${datePart}`;
        const weatherRes = await fetch(weatherUrl);
        const weatherData = await weatherRes.json();

        if (weatherData.hourly) {
          const hour = kickoff.getUTCHours();
          setWeather({
            temp: Math.round(weatherData.hourly.temperature_2m[hour]),
            code: weatherData.hourly.weather_code[hour],
            city: name,
            state: admin1,
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
  }, [game.id, game.home_team, game.commence_time, game.home_stadium_city]); // Add game.home_stadium_city to dependencies

  const getWeatherLabel = (code) => {
    if (code === 0) return 'Clear';
    if (code <= 3) return 'Partly Cloudy';
    if (code >= 51 && code <= 67) return 'Rain';
    if (code >= 71 && code <= 77) return 'Snow';
    if (code >= 80 && code <= 82) return 'Showers';
    if (code >= 95) return 'T-Storms';
    return 'Cloudy';
  };

  return (
    <div className="game-intel" style={{ padding: '3px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '10px', height: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ fontSize: '0.75em', color: '#888', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Game Intel</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div>
          <div style={{ fontSize: '0.7em', color: '#555', fontWeight: 'bold' }}>Win Streak</div>
          <div style={{ fontSize: '0.85em' }}>{game.away_team}: --</div>
          <div style={{ fontSize: '0.85em' }}>{game.home_team}: --</div>
        </div>
        <div>
          <div style={{ fontSize: '0.7em', color: '#555', fontWeight: 'bold' }}>Injuries</div>
          <div style={{ fontSize: '0.85em' }}>None reported</div>
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
      <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
        <div style={{ fontSize: '0.7em', color: '#555', fontWeight: 'bold' }}>Weather</div>
        <div style={{ fontSize: '0.85em', color: '#aaa' }}>
          {loading ? 'Fetching forecast...' : (
            weather?.success ? (
              <span>{weather.city}, {weather.state}: {weather.temp}°F, {getWeatherLabel(weather.code)}</span>
            ) : (
              weather?.reason || 'Weather forecast unavailable'
            )
          )}
        </div>
      </div>
    </div>
  );
};

const PicksPage = ({
  pickGames,
  picks,
  games,
  handlePickChange,
  isGameLocked,
  isGameLive,
  handleSubmit,
  loading,
  selectedWeek
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const isMobile = useIsMobile();

  const filteredGames = pickGames.filter((game) => {
    const term = searchTerm.toLowerCase();
    return (
      game.home_team.toLowerCase().includes(term) ||
      game.away_team.toLowerCase().includes(term) ||
      (game.home_nickname && game.home_nickname.toLowerCase().includes(term)) ||
      (game.away_nickname && game.away_nickname.toLowerCase().includes(term))
    );
  });

  return (
    <>
      <section className="layout-grid">
        <article className="panel" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
            <h2>Pick Games</h2>
            <div className="search-container">
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
                  width: '250px',
                  fontSize: '0.9em'
                }}
              />
            </div>
          </div>
          {pickGames.length === 0 && <p>No games found for this week.</p>}
          {searchTerm && filteredGames.length === 0 && <p style={{ color: '#888' }}>No games matching "{searchTerm}"</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {filteredGames.map((game) => {
              const isAwayActive = picks[game.id]?.selectionTeam === game.away_team;
              const isHomeActive = picks[game.id]?.selectionTeam === game.home_team;

              return (
                <div key={game.id} className={`game-card ${isGameLocked(game) ? 'locked' : ''} ${isGameLive(game) ? 'live' : ''}`}
                   style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px', padding: '20px', alignItems: 'start' }}>
                
                {/* Left Column: Toggle and Game Info */}
                <div className="pick-interface">
                  <div className="game-header" style={{ alignItems: 'center', marginBottom: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong>{game.away_team}</strong>
                    </div>
                    {/* <span style={{ fontSize: '0.9em', color: '#666' }}>@</span> */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong>{game.home_team}</strong>
                    </div>
                  </div>

                  <div className="game-switch">
                    <button
                      type="button"
                      className={`game-switch-option ${isAwayActive ? 'active' : ''}`}
                      onClick={() => handlePickChange(game, game.away_team)}
                      disabled={isGameLocked(game)}
                    >
                      {game.away_logo ? (
                        <img src={game.away_logo} alt={game.away_team} style={{ height: '41px', width: '41px', objectFit: 'contain' }} />
                      ) : (
                        game.away_team
                      )}
                      <span className="switch-option-label" style={getSpreadStyle(game, game.away_team, isAwayActive)}>
                        {formatSpread(game, game.away_team)}
                      </span>
                    </button>
                    <button
                      type="button"
                      className={`game-switch-option ${!picks[game.id] ? 'active' : ''}`}
                      onClick={() => handlePickChange(game, null)}
                      disabled={isGameLocked(game)}
                    > 
                      <span style={{ fontSize: '2.7em', color: '#394d81' }}>@</span>
                    </button>
                    <button
                      type="button"
                      className={`game-switch-option ${isHomeActive ? 'active' : ''}`}
                      onClick={() => handlePickChange(game, game.home_team)}
                      disabled={isGameLocked(game)}
                    >
                      {game.home_logo ? (
                        <img src={game.home_logo} alt={game.home_team} style={{ height: '41px', width: '41px', objectFit: 'contain' }} />
                      ) : (
                        game.home_team
                      )}
                      <span className="switch-option-label" style={getSpreadStyle(game, game.home_team, isHomeActive)}>
                        {formatSpread(game, game.home_team)}
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
                          : (isAwayActive ? (game.away_color || '#4d7cff') : '#333333')
                      }}
                    />
                  </div>

                  <div style={{ marginTop: '12px', fontSize: '0.85em', color: '#888' }}>
                    <span>{new Date(game.commence_time).toLocaleString()}</span>
                    {!isGameLocked(game) && <CountdownTimer commenceTime={game.commence_time} />}
                    {isGameLive(game) && <span className="game-status-live" style={{ marginLeft: '10px' }}>LIVE</span>}
                    {!isGameLive(game) && isGameLocked(game) && <span className="game-status-locked" style={{ marginLeft: '10px' }}>LOCKED</span>}
                  </div>

                  {!!game.completed && (
                    <div className="game-result" style={{ marginTop: '15px' }}>
                      Score: {game.away_team} {game.score_away} — {game.home_team} {game.score_home}
                    </div>
                  )}
                </div>

                {/* Right Column: Statistics */}
                <GameIntel game={game} />
              </div>
            )})}
          </div>
        </article>
      </section>

      <div className="actions">
        <button disabled={loading || selectedWeek === null} onClick={handleSubmit}>Save Picks</button>
      </div>
    </>
  );
};

export default PicksPage;