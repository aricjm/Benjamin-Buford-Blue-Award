import { useEffect, useState } from 'react';

const DEFAULT_SEASON = new Date().getUTCFullYear().toString();

const formatSpread = (game, team) => {
  if (team === game.home_team) {
    return game.spread_home === null ? 'PK' : `${game.spread_home}`;
  }
  return game.spread_away === null ? 'PK' : `${game.spread_away}`;
};

const formatResultLabel = (result) => {
  if (result === 'win') return 'Win';
  if (result === 'loss') return 'Loss';
  if (result === 'push') return 'Push';
  return 'Pending';
};

const emptyManualGame = {
  home_team: '',
  away_team: '',
  commence_time: '',
  site: 'Manual',
  spread_home: '',
  spread_away: '',
  home_price: '',
  away_price: '',
  is_televised: false,
  is_mandatory: false
};

function App() {
  const [players, setPlayers] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [weeks, setWeeks] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState('You');
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [games, setGames] = useState([]);
  const [picks, setPicks] = useState({});
  const [summary, setSummary] = useState([]);
  const [seasonSummary, setSeasonSummary] = useState([]);
  const [allTimeSummary, setAllTimeSummary] = useState([]);
  const [manualGame, setManualGame] = useState(emptyManualGame);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePage, setActivePage] = useState('picks');
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [playerModalOpen, setPlayerModalOpen] = useState(true);
  const [adminGames, setAdminGames] = useState([]);
  const [adminPicks, setAdminPicks] = useState([]);
  const [editingGameId, setEditingGameId] = useState(null);
  const [editingGameData, setEditingGameData] = useState({});
  const [editingPickId, setEditingPickId] = useState(null);
  const [editingPickData, setEditingPickData] = useState({});

  const handlePageChange = (page) => {
    setActivePage(page);
    setMenuOpen(false);
  };

  useEffect(() => {
    async function loadMeta() {
      setLoading(true);
      try {
        const [playersRes, seasonsRes] = await Promise.all([
          fetch('/api/players'),
          fetch('/api/seasons')
        ]);
        const playersJson = await playersRes.json();
        const seasonsJson = await seasonsRes.json();
        setPlayers(playersJson);
        setSeasons(seasonsJson);
        const initialSeason = seasonsJson.length ? seasonsJson[0] : DEFAULT_SEASON;
        setSelectedSeason(initialSeason);
        if (playersJson.length) {
          setSelectedPlayer(playersJson[0].name);
          setPlayerModalOpen(true);
        }
      } catch (error) {
        setMessage('Unable to load players or seasons.');
      } finally {
        setLoading(false);
      }
    }

    loadMeta();
  }, []);

  useEffect(() => {
    if (!selectedSeason) return;
    async function loadSeasonData() {
      setLoading(true);
      setMessage('Loading season data...');
      try {
        const weeksRes = await fetch(`/api/weeks?season=${selectedSeason}`);
        const weeksJson = await weeksRes.json();
        setWeeks(weeksJson);
        if (weeksJson.length) {
          setSelectedWeek(weeksJson[0].week);
        } else {
          setSelectedWeek(null);
          setGames([]);
          setSummary([]);
        }
        const seasonSummaryRes = await fetch(`/api/season/${selectedSeason}/summary`);
        setSeasonSummary(await seasonSummaryRes.json());
        const allTimeRes = await fetch('/api/summary/alltime');
        setAllTimeSummary(await allTimeRes.json());
      } catch (error) {
        setMessage('Unable to load season or summary data.');
      } finally {
        setLoading(false);
      }
    }

    loadSeasonData();
  }, [selectedSeason]);

  useEffect(() => {
    if (!selectedWeek || !selectedSeason) return;
    setPicks({});
    loadWeek(selectedWeek, selectedSeason);
  }, [selectedWeek, selectedSeason]);

  const loadWeek = async (week, season) => {
    setLoading(true);
    setMessage('Loading week data...');
    try {
      const res = await fetch(`/api/week/${week}/games?season=${season}`);
      const data = await res.json();
      setGames(data.games || []);
      setSummary(data.summary || []);
      setMessage('');
    } catch (error) {
      setMessage('Unable to load week data.');
    } finally {
      setLoading(false);
    }
  };

  const weekOptions = weeks.reduce((acc, week) => {
    if (!acc.some((item) => item.week === week.week)) {
      acc.push({
        ...week,
        displayLabel: `Week ${week.week}`
      });
    }
    return acc;
  }, []);

  const mandatoryGames = games.filter((game) => game.is_televised);
  const optionalGames = games.filter((game) => !game.is_televised);

  const isSummaryPage = activePage === 'summary';
  const isManualPage = activePage === 'manual';
  const isPicksPage = activePage === 'picks';
  const isButtonsPage = activePage === 'buttons';
  const isAdminPage = activePage === 'admin';

  const handlePickChange = (game, team) => {
    setPicks((prev) => {
      const key = game.id;
      if (!team) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return {
        ...prev,
        [key]: {
          gameId: game.id,
          selectionTeam: team,
          selectionSide: team === game.home_team ? 'home' : 'away',
          spread: team === game.home_team ? game.spread_home : game.spread_away,
          isMandatory: game.is_mandatory
        }
      };
    });
  };

  const handleSubmit = async () => {
    if (!selectedWeek || !selectedSeason) {
      setMessage('Choose a season and week first.');
      return;
    }
    const mandatoryPickIds = mandatoryGames.map((game) => game.id);
    const missing = mandatoryPickIds.filter((id) => !picks[id]);
    if (missing.length) {
      setMessage('Please make a selection for all 5 mandatory televised games first.');
      return;
    }

    const playerPicks = Object.values(picks).filter((pick) => pick.selectionTeam);
    if (!playerPicks.length) {
      setMessage('Choose at least one game before saving picks.');
      return;
    }

    setLoading(true);
    setMessage('Saving picks...');
    try {
      const response = await fetch(`/api/week/${selectedWeek}/picks?season=${selectedSeason}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player: selectedPlayer, picks: playerPicks })
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Picks saved!');
        setSummary(data.summary || []);
      } else {
        setMessage(data.error || 'Failed to save picks.');
      }
    } catch (error) {
      setMessage('Unable to save picks.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualGameChange = (field, value) => {
    setManualGame((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddManualGame = async () => {
    if (!manualGame.home_team || !manualGame.away_team || !manualGame.commence_time || !selectedWeek || !selectedSeason) {
      setMessage('Home team, away team, commence time, season, and week are required.');
      return;
    }

    setLoading(true);
    setMessage('Adding manual game...');
    try {
      const response = await fetch(`/api/week/${selectedWeek}/games?season=${selectedSeason}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...manualGame,
          spread_home: manualGame.spread_home ? Number(manualGame.spread_home) : null,
          spread_away: manualGame.spread_away ? Number(manualGame.spread_away) : null,
          home_price: manualGame.home_price ? Number(manualGame.home_price) : null,
          away_price: manualGame.away_price ? Number(manualGame.away_price) : null,
          is_televised: manualGame.is_televised,
          is_mandatory: manualGame.is_mandatory
        })
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Manual game added.');
        setManualGame(emptyManualGame);
        if (data.games) {
          setGames(data.games);
        } else {
          loadWeek(selectedWeek, selectedSeason);
        }
      } else {
        setMessage(data.error || 'Failed to add manual game.');
      }
    } catch (error) {
      setMessage('Unable to add manual game.');
    } finally {
      setLoading(false);
    }
  };

  const loadAdminData = async () => {
    if (!selectedWeek || !selectedSeason) return;
    setLoading(true);
    try {
      const [gamesRes, picksRes] = await Promise.all([
        fetch(`/api/week/${selectedWeek}/games?season=${selectedSeason}`),
        fetch(`/api/week/${selectedWeek}/picks?season=${selectedSeason}`)
      ]);
      const gamesData = await gamesRes.json();
      const picksData = await picksRes.json();
      setAdminGames(gamesData.games || []);
      setAdminPicks(picksData || []);
    } catch (error) {
      setMessage('Unable to load admin data.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGameLine = async (gameId) => {
    if (!editingGameData.spread_home && editingGameData.spread_home !== 0 && !editingGameData.spread_away && editingGameData.spread_away !== 0) {
      setMessage('At least one spread must be provided.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/game/${gameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spread_home: editingGameData.spread_home ? Number(editingGameData.spread_home) : null,
          spread_away: editingGameData.spread_away ? Number(editingGameData.spread_away) : null,
          home_price: editingGameData.home_price ? Number(editingGameData.home_price) : null,
          away_price: editingGameData.away_price ? Number(editingGameData.away_price) : null
        })
      });
      if (response.ok) {
        setMessage('Game line updated.');
        setEditingGameId(null);
        setEditingGameData({});
        await loadAdminData();
      } else {
        setMessage('Failed to update game line.');
      }
    } catch (error) {
      setMessage('Unable to update game line.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePick = async (pickId) => {
    if (!editingPickData.selection_team) {
      setMessage('Selection team is required.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/pick/${pickId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selection_team: editingPickData.selection_team,
          selection_side: editingPickData.selection_side,
          spread: editingPickData.spread ? Number(editingPickData.spread) : null
        })
      });
      if (response.ok) {
        setMessage('Pick updated.');
        setEditingPickId(null);
        setEditingPickData({});
        await loadAdminData();
      } else {
        setMessage('Failed to update pick.');
      }
    } catch (error) {
      setMessage('Unable to update pick.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <header className="page-header">
        <div>
          <h1>Benjamin Buford Blue Award</h1>
          <p>Weekly picks, outcomes, and mandatory televised games for Aric, Nick, and Cisco.</p>
        </div>

        <button
          className="menu-toggle"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Toggle navigation"
        >
          {menuOpen ? 'Close' : 'Menu'}
        </button>
      </header>

      {menuOpen && <div className="backdrop" onClick={() => setMenuOpen(false)} />}

      {playerModalOpen && players.length > 0 && (
        <>
          <div className="modal-backdrop" />
          <div className="player-modal">
            <div className="player-modal-content">
              <h2>Choose your player</h2>
              <label>
                Player
                <select
                  value={selectedPlayer}
                  onChange={(e) => setSelectedPlayer(e.target.value)}
                >
                  {players.map((player) => (
                    <option key={player.id} value={player.name}>{player.name}</option>
                  ))}
                </select>
              </label>
              <button
                className="continue-button"
                onClick={() => setPlayerModalOpen(false)}
              >
                Continue
              </button>
            </div>
          </div>
        </>
      )}

      <div className={`app-layout ${menuOpen ? 'menu-open' : ''}`}>
        <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
          <nav>
            <button
              className={activePage === 'picks' ? 'active' : ''}
              onClick={() => handlePageChange('picks')}
            >
              Picks
            </button>
            <button
              className={activePage === 'manual' ? 'active' : ''}
              onClick={() => handlePageChange('manual')}
            >
              Add Manual Game
            </button>
            <button
              className={activePage === 'summary' ? 'active' : ''}
              onClick={() => handlePageChange('summary')}
            >
              Summaries
            </button>
            <button
              className={activePage === 'admin' ? 'active' : ''}
              onClick={() => handlePageChange('admin')}
            >
              Admin
            </button>
            <button
              className={activePage === 'buttons' ? 'active' : ''}
              onClick={() => handlePageChange('buttons')}
            >
              Buttons
            </button>
          </nav>
        </aside>

        <main className="main-content">
          <section className="controls">
            <label>
              Season:
              <select value={selectedSeason} onChange={(e) => setSelectedSeason(e.target.value)}>
                {seasons.map((season) => (
                  <option key={season} value={season}>{season}</option>
                ))}
              </select>
            </label>

            <label>
              Pick as:
              <select value={selectedPlayer} onChange={(e) => setSelectedPlayer(e.target.value)}>
                {players.map((player) => (
                  <option key={player.id} value={player.name}>{player.name}</option>
                ))}
              </select>
            </label>

            <label>
              Week:
              <select
                value={selectedWeek ?? ''}
                onChange={(e) => setSelectedWeek(Number(e.target.value))}
                disabled={!weekOptions.length}
              >
                {weekOptions.map((week) => (
                  <option key={`${week.season}-${week.week}`} value={week.week}>{week.displayLabel}</option>
                ))}
              </select>
            </label>
          </section>

          {message && <div className="message">{message}</div>}
          {loading && <div className="loading">Loading...</div>}

          {isPicksPage && (
            <>
              <section className="layout-grid">
                <article className="panel">
                  <h2>Mandatory Games</h2>
                  {mandatoryGames.length === 0 && <p>No televised games found yet for this week.</p>}
                  {mandatoryGames.map((game) => (
                    <div key={game.id} className="game-card">
                      <div className="game-header">
                        <strong>{game.away_team}</strong> @ <strong>{game.home_team}</strong>
                        <span>{new Date(game.commence_time).toLocaleString()}</span>
                      </div>
                      <div className="game-switch">
                        <button
                          type="button"
                          className={`game-switch-option ${picks[game.id]?.selectionTeam === game.away_team ? 'active' : ''}`}
                          onClick={() => handlePickChange(game, game.away_team)}
                        >
                          {game.away_team}
                          <span className="switch-option-label">{formatSpread(game, game.away_team)}</span>
                        </button>
                        <button
                          type="button"
                          className={`game-switch-option ${!picks[game.id] ? 'active' : ''}`}
                          onClick={() => handlePickChange(game, null)}
                        >
                          Neither
                        </button>
                        <button
                          type="button"
                          className={`game-switch-option ${picks[game.id]?.selectionTeam === game.home_team ? 'active' : ''}`}
                          onClick={() => handlePickChange(game, game.home_team)}
                        >
                          {game.home_team}
                          <span className="switch-option-label">{formatSpread(game, game.home_team)}</span>
                        </button>
                        <span
                          className="game-switch-slider"
                          style={{ transform: picks[game.id]?.selectionTeam === game.home_team ? 'translateX(200%)' : picks[game.id]?.selectionTeam === game.away_team ? 'translateX(0)' : 'translateX(100%)' }}
                        />
                      </div>
                      {game.completed ? (
                        <div className="game-result">
                          Score: {game.away_team} {game.score_away} — {game.home_team} {game.score_home}
                        </div>
                      ) : (
                        <div className="game-result">Status: Upcoming</div>
                      )}
                    </div>
                  ))}
                </article>

                <article className="panel">
                  <h2>Optional Games</h2>
                  {optionalGames.length === 0 && <p>No extra games available this week.</p>}
                  {optionalGames.map((game) => (
                    <div key={game.id} className="game-card">
                      <div className="game-header">
                        <strong>{game.away_team}</strong> @ <strong>{game.home_team}</strong>
                        <span>{new Date(game.commence_time).toLocaleString()}</span>
                      </div>
                      <div className="game-switch">
                        <button
                          type="button"
                          className={`game-switch-option ${picks[game.id]?.selectionTeam === game.away_team ? 'active' : ''}`}
                          onClick={() => handlePickChange(game, game.away_team)}
                        >
                          {game.away_team}
                          <span className="switch-option-label">{formatSpread(game, game.away_team)}</span>
                        </button>
                        <button
                          type="button"
                          className={`game-switch-option ${!picks[game.id] ? 'active' : ''}`}
                          onClick={() => handlePickChange(game, null)}
                        >
                          Neither
                        </button>
                        <button
                          type="button"
                          className={`game-switch-option ${picks[game.id]?.selectionTeam === game.home_team ? 'active' : ''}`}
                          onClick={() => handlePickChange(game, game.home_team)}
                        >
                          {game.home_team}
                          <span className="switch-option-label">{formatSpread(game, game.home_team)}</span>
                        </button>
                        <span
                          className="game-switch-slider"
                          style={{ transform: picks[game.id]?.selectionTeam === game.home_team ? 'translateX(200%)' : picks[game.id]?.selectionTeam === game.away_team ? 'translateX(0)' : 'translateX(100%)' }}
                        />
                      </div>
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
                <button disabled={loading || !selectedWeek} onClick={handleSubmit}>Save Picks</button>
              </div>
            </>
          )}

          {isManualPage && (
            <section className="panel manual-panel">
              <h2>Add a Manual Game</h2>
              <div className="manual-grid">
                <label>
                  Home team
                  <input
                    value={manualGame.home_team}
                    onChange={(e) => handleManualGameChange('home_team', e.target.value)}
                    placeholder="Home team"
                  />
                </label>
                <label>
                  Away team
                  <input
                    value={manualGame.away_team}
                    onChange={(e) => handleManualGameChange('away_team', e.target.value)}
                    placeholder="Away team"
                  />
                </label>
                <label>
                  Commence time
                  <input
                    type="datetime-local"
                    value={manualGame.commence_time}
                    onChange={(e) => handleManualGameChange('commence_time', e.target.value)}
                  />
                </label>
                <label>
                  Spread home
                  <input
                    value={manualGame.spread_home}
                    onChange={(e) => handleManualGameChange('spread_home', e.target.value)}
                    placeholder="e.g. -3.5"
                  />
                </label>
                <label>
                  Spread away
                  <input
                    value={manualGame.spread_away}
                    onChange={(e) => handleManualGameChange('spread_away', e.target.value)}
                    placeholder="e.g. 3.5"
                  />
                </label>
                <label>
                  Home price
                  <input
                    value={manualGame.home_price}
                    onChange={(e) => handleManualGameChange('home_price', e.target.value)}
                    placeholder="e.g. -110"
                  />
                </label>
                <label>
                  Away price
                  <input
                    value={manualGame.away_price}
                    onChange={(e) => handleManualGameChange('away_price', e.target.value)}
                    placeholder="e.g. -110"
                  />
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={manualGame.is_televised}
                    onChange={(e) => handleManualGameChange('is_televised', e.target.checked)}
                  />
                  Televised
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={manualGame.is_mandatory}
                    onChange={(e) => handleManualGameChange('is_mandatory', e.target.checked)}
                  />
                  Mandatory
                </label>
              </div>
              <div className="actions manual-actions">
                <button disabled={loading || !selectedWeek} onClick={handleAddManualGame}>Add Manual Game</button>
              </div>
            </section>
          )}

          {isSummaryPage && (
            <>
              <section className="panel summary-panel">
                <h2>Weekly Summary</h2>
                {summary.length === 0 ? (
                  <p>No picks yet for this week.</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Player</th>
                        <th>Wins</th>
                        <th>Losses</th>
                        <th>Pushes</th>
                        <th>Pending</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.map((row) => (
                        <tr key={row.player}>
                          <td>{row.player}</td>
                          <td>{row.wins}</td>
                          <td>{row.losses}</td>
                          <td>{row.pushes}</td>
                          <td>{row.pending}</td>
                          <td>{row.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>

              <section className="panel summary-panel">
                <h2>Season Summary ({selectedSeason})</h2>
                {seasonSummary.length === 0 ? (
                  <p>No picks for this season yet.</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Player</th>
                        <th>Wins</th>
                        <th>Losses</th>
                        <th>Pushes</th>
                        <th>Pending</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {seasonSummary.map((row) => (
                        <tr key={row.player}>
                          <td>{row.player}</td>
                          <td>{row.wins}</td>
                          <td>{row.losses}</td>
                          <td>{row.pushes}</td>
                          <td>{row.pending}</td>
                          <td>{row.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>

              <section className="panel summary-panel">
                <h2>All-Time Summary</h2>
                {allTimeSummary.length === 0 ? (
                  <p>No picks recorded yet.</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Player</th>
                        <th>Wins</th>
                        <th>Losses</th>
                        <th>Pushes</th>
                        <th>Pending</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allTimeSummary.map((row) => (
                        <tr key={row.player}>
                          <td>{row.player}</td>
                          <td>{row.wins}</td>
                          <td>{row.losses}</td>
                          <td>{row.pushes}</td>
                          <td>{row.pending}</td>
                          <td>{row.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>
            </>
          )}

          {isButtonsPage && (
            <section className="panel buttons-panel">
              <h2>UI Controls Preview</h2>
              <p>Example buttons, radio groups, toggles, and dropdowns with dummy data.</p>

              <div className="demo-grid">
                <div className="control-card">
                  <h3>Buttons</h3>
                  <div className="button-row">
                    <button className="sample-button">Primary</button>
                    <button className="sample-button secondary">Secondary</button>
                    <button className="sample-button danger">Danger</button>
                    <button className="sample-button ghost">Ghost</button>
                  </div>
                </div>

                <div className="control-card">
                  <h3>Radio buttons</h3>
                  <label><input type="radio" name="demo-radio" defaultChecked /> Option A</label>
                  <label><input type="radio" name="demo-radio" /> Option B</label>
                  <label><input type="radio" name="demo-radio" /> Option C</label>
                </div>

                <div className="control-card">
                  <h3>Toggle switches</h3>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider" />
                    <span>Enable notifications</span>
                  </label>
                  <label className="toggle-switch">
                    <input type="checkbox" />
                    <span className="slider" />
                    <span>Use dark mode</span>
                  </label>
                </div>

                <div className="control-card">
                  <h3>Dropdowns</h3>
                  <label>
                    Simple select
                    <select>
                      <option>Option 1</option>
                      <option>Option 2</option>
                      <option>Option 3</option>
                    </select>
                  </label>
                  <label>
                    Large select
                    <select className="large-select">
                      <option>Choose a team</option>
                      <option>Team A</option>
                      <option>Team B</option>
                      <option>Team C</option>
                    </select>
                  </label>
                </div>

                <div className="control-card">
                  <h3>Checkboxes</h3>
                  <label><input type="checkbox" defaultChecked /> Auto sync</label>
                  <label><input type="checkbox" /> Show scores</label>
                </div>

                <div className="control-card">
                  <h3>Compact controls</h3>
                  <div className="button-row compact">
                    <button className="sample-button">Save</button>
                    <button className="sample-button secondary">Cancel</button>
                    <button className="sample-button danger">Delete</button>
                  </div>
                </div>

                <div className="control-card">
                  <h3>Pizza / Pasta switch</h3>
                  <div className="meal-switch">
                    <button
                      type="button"
                      className={`meal-switch-option ${selectedMeal === 'Pizza' ? 'active' : ''}`}
                      onClick={() => setSelectedMeal('Pizza')}
                    >
                      Pizza
                    </button>
                    <button
                      type="button"
                      className={`meal-switch-option ${selectedMeal === null ? 'active' : ''}`}
                      onClick={() => setSelectedMeal(null)}
                    >
                      Neither
                    </button>
                    <button
                      type="button"
                      className={`meal-switch-option ${selectedMeal === 'Pasta' ? 'active' : ''}`}
                      onClick={() => setSelectedMeal('Pasta')}
                    >
                      Pasta
                    </button>
                    <span
                      className="meal-switch-slider"
                      style={{ transform: selectedMeal === 'Pasta' ? 'translateX(200%)' : selectedMeal === 'Pizza' ? 'translateX(0)' : 'translateX(100%)' }}
                    />
                  </div>
                  <p className="switch-label">Selected: {selectedMeal || 'Neither'}</p>
                </div>
              </div>
            </section>
          )}

          {isAdminPage && (
            <>
              <section className="panel admin-panel">
                <h2>Admin: Update Game Lines</h2>
                <button onClick={loadAdminData} disabled={loading || !selectedWeek}>
                  Load Games
                </button>
                {adminGames.length === 0 ? (
                  <p>No games loaded. Click "Load Games" to fetch games for this week.</p>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Match</th>
                        <th>Away Spread</th>
                        <th>Home Spread</th>
                        <th>Away Price</th>
                        <th>Home Price</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminGames.map((game) => (
                        <tr key={game.id}>
                          <td>
                            <strong>{game.away_team}</strong> @ <strong>{game.home_team}</strong>
                          </td>
                          <td>
                            {editingGameId === game.id ? (
                              <input
                                type="number"
                                step="0.5"
                                value={editingGameData.spread_away || ''}
                                onChange={(e) =>
                                  setEditingGameData((prev) => ({ ...prev, spread_away: e.target.value }))
                                }
                              />
                            ) : (
                              game.spread_away || 'N/A'
                            )}
                          </td>
                          <td>
                            {editingGameId === game.id ? (
                              <input
                                type="number"
                                step="0.5"
                                value={editingGameData.spread_home || ''}
                                onChange={(e) =>
                                  setEditingGameData((prev) => ({ ...prev, spread_home: e.target.value }))
                                }
                              />
                            ) : (
                              game.spread_home || 'N/A'
                            )}
                          </td>
                          <td>
                            {editingGameId === game.id ? (
                              <input
                                type="number"
                                step="1"
                                value={editingGameData.away_price || ''}
                                onChange={(e) =>
                                  setEditingGameData((prev) => ({ ...prev, away_price: e.target.value }))
                                }
                              />
                            ) : (
                              game.away_price || 'N/A'
                            )}
                          </td>
                          <td>
                            {editingGameId === game.id ? (
                              <input
                                type="number"
                                step="1"
                                value={editingGameData.home_price || ''}
                                onChange={(e) =>
                                  setEditingGameData((prev) => ({ ...prev, home_price: e.target.value }))
                                }
                              />
                            ) : (
                              game.home_price || 'N/A'
                            )}
                          </td>
                          <td>
                            {editingGameId === game.id ? (
                              <>
                                <button
                                  className="admin-action-btn"
                                  onClick={() => handleUpdateGameLine(game.id)}
                                  disabled={loading}
                                >
                                  Save
                                </button>
                                <button
                                  className="admin-action-btn secondary"
                                  onClick={() => {
                                    setEditingGameId(null);
                                    setEditingGameData({});
                                  }}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button
                                className="admin-action-btn"
                                onClick={() => {
                                  setEditingGameId(game.id);
                                  setEditingGameData({
                                    spread_away: game.spread_away,
                                    spread_home: game.spread_home,
                                    away_price: game.away_price,
                                    home_price: game.home_price
                                  });
                                }}
                              >
                                Edit
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>

              <section className="panel admin-panel">
                <h2>Admin: Edit Player Picks</h2>
                {adminPicks.length === 0 ? (
                  <p>No picks found for this week.</p>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Player</th>
                        <th>Match</th>
                        <th>Selection</th>
                        <th>Spread</th>
                        <th>Result</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminPicks.map((pick) => (
                        <tr key={pick.id}>
                          <td>{pick.player}</td>
                          <td>
                            {pick.away_team} @ {pick.home_team}
                          </td>
                          <td>
                            {editingPickId === pick.id ? (
                              <select
                                value={editingPickData.selection_team || ''}
                                onChange={(e) => {
                                  const team = e.target.value;
                                  const side = team === pick.home_team ? 'home' : 'away';
                                  const spread = side === 'home' ? pick.spread_home : pick.spread_away;
                                  setEditingPickData({
                                    selection_team: team,
                                    selection_side: side,
                                    spread
                                  });
                                }}
                              >
                                <option value="">-- Select Team --</option>
                                <option value={pick.away_team}>{pick.away_team}</option>
                                <option value={pick.home_team}>{pick.home_team}</option>
                              </select>
                            ) : (
                              pick.selection_team
                            )}
                          </td>
                          <td>{editingPickId === pick.id ? editingPickData.spread : pick.spread}</td>
                          <td>{formatResultLabel(pick.result)}</td>
                          <td>
                            {editingPickId === pick.id ? (
                              <>
                                <button
                                  className="admin-action-btn"
                                  onClick={() => handleUpdatePick(pick.id)}
                                  disabled={loading}
                                >
                                  Save
                                </button>
                                <button
                                  className="admin-action-btn secondary"
                                  onClick={() => {
                                    setEditingPickId(null);
                                    setEditingPickData({});
                                  }}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button
                                className="admin-action-btn"
                                onClick={() => {
                                  setEditingPickId(pick.id);
                                  setEditingPickData({
                                    selection_team: pick.selection_team,
                                    selection_side: pick.selection_side,
                                    spread: pick.spread
                                  });
                                }}
                              >
                                Edit
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
