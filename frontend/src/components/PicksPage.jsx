import React, { useState, useEffect } from 'react';

const formatSpread = (game, team) => {
  if (team === game.home_team) {
    return game.spread_home === null ? 'PK' : `${game.spread_home}`;
  }
  return game.spread_away === null ? 'PK' : `${game.spread_away}`;
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

const PicksPage = ({
  mandatoryGames,
  optionalGames,
  picks,
  handlePickChange,
  isGameLocked,
  isGameLive,
  handleSubmit,
  loading,
  selectedWeek
}) => {
  return (
    <>
      <section className="layout-grid">
        <article className="panel">
          <h2>Mandatory Games</h2>
          {mandatoryGames.length === 0 && <p>No televised games found yet for this week.</p>}
          {mandatoryGames.map((game) => (
            <div key={game.id} className={`game-card ${isGameLocked(game) ? 'locked' : ''} ${isGameLive(game) ? 'live' : ''}`}>
              <div className="game-header" style={{ alignItems: 'center', marginBottom: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong>{game.away_team}</strong>
                </div>
                <span style={{ fontSize: '0.9em', color: '#666' }}>@</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong>{game.home_team}</strong>
                </div>
              </div>
              <div className="game-switch">
                <button
                  type="button"
                  className={`game-switch-option ${picks[game.id]?.selectionTeam === game.away_team ? 'active' : ''}`}
                  onClick={() => handlePickChange(game, game.away_team)}
                  disabled={isGameLocked(game)}
                >
                  {game.away_logo ? (
                    <img src={game.away_logo} alt={game.away_team} style={{ height: '41px', width: '41px', objectFit: 'contain' }} />
                  ) : (
                    game.away_team
                  )}
                  <span className="switch-option-label">{formatSpread(game, game.away_team)}</span>
                </button>
                <button
                  type="button"
                  className={`game-switch-option ${!picks[game.id] ? 'active' : ''}`}
                  onClick={() => handlePickChange(game, null)}
                  disabled={isGameLocked(game)}
                >
                </button>
                <button
                  type="button"
                  className={`game-switch-option ${picks[game.id]?.selectionTeam === game.home_team ? 'active' : ''}`}
                  onClick={() => handlePickChange(game, game.home_team)}
                  disabled={isGameLocked(game)}
                >
                  {game.home_logo ? (
                    <img src={game.home_logo} alt={game.home_team} style={{ height: '41px', width: '41px', objectFit: 'contain' }} />
                  ) : (
                    game.home_team
                  )}
                  <span className="switch-option-label">{formatSpread(game, game.home_team)}</span>
                </button>
                <span
                  className="game-switch-slider"
                  style={{ 
                    transform: picks[game.id]?.selectionTeam === game.home_team 
                      ? 'translateX(200%)' 
                      : picks[game.id]?.selectionTeam === game.away_team 
                        ? 'translateX(0)' 
                        : 'translateX(100%)',
                    backgroundColor: picks[game.id]?.selectionTeam === game.home_team 
                      ? (game.home_color || '#4d7cff') 
                      : (picks[game.id]?.selectionTeam === game.away_team ? (game.away_color || '#4d7cff') : '#333333')
                  }}
                />
              </div>
              <span>{new Date(game.commence_time).toLocaleString()}</span>
              {!isGameLocked(game) && <CountdownTimer commenceTime={game.commence_time} />}
              {isGameLive(game) && <span className="game-status-live">LIVE</span>}
              {!isGameLive(game) && isGameLocked(game) && <span className="game-status-locked">LOCKED</span>}
              {game.completed ? (
                <div className="game-result">
                  Score: {game.away_team} {game.score_away} — {game.home_team} {game.score_home}
                </div>
              ) : null}
            </div>
          ))}
        </article>

        <article className="panel">
          <h2>Optional Games</h2>
          {optionalGames.length === 0 && <p>No extra games available this week.</p>}
          {optionalGames.map((game) => (
            <div key={game.id} className={`game-card ${isGameLocked(game) ? 'locked' : ''} ${isGameLive(game) ? 'live' : ''}`}>
              <div className="game-header" style={{ alignItems: 'center', marginBottom: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong>{game.away_team}</strong>
                </div>
                <span style={{ fontSize: '0.9em', color: '#666' }}>@</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong>{game.home_team}</strong>
                </div>
              </div>
              <div className="game-switch">
                <button
                  type="button"
                  className={`game-switch-option ${picks[game.id]?.selectionTeam === game.away_team ? 'active' : ''}`}
                  onClick={() => handlePickChange(game, game.away_team)}
                  disabled={isGameLocked(game)}
                >
                  {game.away_logo ? (
                    <img src={game.away_logo} alt={game.away_team} style={{ height: '41px', width: '41px', objectFit: 'contain' }} />
                  ) : (
                    game.away_team
                  )}
                  <span className="switch-option-label">{formatSpread(game, game.away_team)}</span>
                </button>
                <button
                  type="button"
                  className={`game-switch-option ${!picks[game.id] ? 'active' : ''}`}
                  onClick={() => handlePickChange(game, null)}
                  disabled={isGameLocked(game)}
                >
                </button>
                <button
                  type="button"
                  className={`game-switch-option ${picks[game.id]?.selectionTeam === game.home_team ? 'active' : ''}`}
                  onClick={() => handlePickChange(game, game.home_team)}
                  disabled={isGameLocked(game)}
                >
                  {game.home_logo ? (
                    <img src={game.home_logo} alt={game.home_team} style={{ height: '41px', width: '41px', objectFit: 'contain' }} />
                  ) : (
                    game.home_team
                  )}
                  <span className="switch-option-label">{formatSpread(game, game.home_team)}</span>
                </button>
                <span
                  className="game-switch-slider"
                  style={{ 
                    transform: picks[game.id]?.selectionTeam === game.home_team 
                      ? 'translateX(200%)' 
                      : picks[game.id]?.selectionTeam === game.away_team 
                        ? 'translateX(0)' 
                        : 'translateX(100%)',
                    backgroundColor: picks[game.id]?.selectionTeam === game.home_team 
                      ? (game.home_color || '#4d7cff') 
                      : (picks[game.id]?.selectionTeam === game.away_team ? (game.away_color || '#4d7cff') : '#333333')
                  }}
                />
              </div>
              <span>{new Date(game.commence_time).toLocaleString()}</span>
              {!isGameLocked(game) && <CountdownTimer commenceTime={game.commence_time} />}
              {isGameLive(game) && <span className="game-status-live">LIVE</span>}
              {!isGameLive(game) && isGameLocked(game) && <span className="game-status-locked">LOCKED</span>}
              {game.completed ? (
                <div className="game-result">
                  Score: {game.away_team} {game.score_away} — {game.home_team} {game.score_home}
                </div>
              ) : null}
            </div>
          ))}
        </article>
      </section>

      <div className="actions">
        <button disabled={loading || selectedWeek === null} onClick={handleSubmit}>Save Picks</button>
      </div>
    </>
  );
};

export default PicksPage;