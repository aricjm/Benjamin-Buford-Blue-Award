import { useEffect, useState } from 'react';
import logo from "./resources/images/benjamin_buford_blue_award_emblem_8.png";

// Import Sub-Components
import Sidebar from './components/Sidebar';
import StatsPage from './components/StatsPage';
import AdminPage from './components/AdminPage';
import PicksPage from './components/PicksPage';

// Import Custom Hook
import { useBetData } from './hooks/useBetData';

const DEFAULT_SEASON = new Date().getUTCFullYear().toString();

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
  // UI Specific State
  const [selectedSeason, setSelectedSeason] = useState(DEFAULT_SEASON);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [selectedConference, setSelectedConference] = useState('');
  const [statsTimeRange, setStatsTimeRange] = useState('All-Time');

  const [manualGame, setManualGame] = useState(emptyManualGame);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePage, setActivePage] = useState('picks');
  const [playerModalOpen, setPlayerModalOpen] = useState(true);
  const [showConfirmSave, setShowConfirmSave] = useState(false);
  const [showSaveResult, setShowSaveResult] = useState(false);
  const [saveResult, setSaveResult] = useState({ success: false, message: '' });
  const [savedPicksList, setSavedPicksList] = useState([]);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });
  const [selectedMeal, setSelectedMeal] = useState(null);

  // Consume the custom hook
  const {
    players, seasons, weeks, teams, games, picks,
    summary, seasonSummary, allTimeSummary,
    loading, message, playerStats, conferenceStats,
    setLoading, setMessage, loadStats, loadWeek, 
    handlePickChange, addManualGame, savePicks
  } = useBetData(selectedSeason, selectedWeek, selectedPlayer, selectedConference, statsTimeRange);

  const handlePageChange = (page) => {
    setActivePage(page);
    setMenuOpen(false);
  };

  // Utility to auto-select first season/week on metadata load
  useEffect(() => {
    if (seasons.length && !selectedSeason) setSelectedSeason(seasons[0]);
    if (weeks.length && selectedWeek === null) setSelectedWeek(weeks[0].week);
    if (players.length && !selectedPlayer) setSelectedPlayer(players[0].name);
  }, [seasons, weeks, players, selectedSeason, selectedWeek, selectedPlayer]);

  const conferenceList = Array.from(new Set(teams.map(t => t.conference))).sort();

  const isGameLocked = (game) => {
    return new Date(game.commence_time) < new Date();
  };

  const isGameLive = (game) => {
    return isGameLocked(game) && !game.completed;
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
  const isStatsPage = activePage === 'stats';

  // validate and open confirmation modal
  const handleSubmit = () => {
    if (selectedWeek === null || !selectedSeason) {
      setMessage('Choose a season and week first.');
      setAlertMessage('Choose a season and week first.');
      setShowAlertModal(true);
      return;
    }

    const mandatoryGamesToPick = mandatoryGames.filter(game => !isGameLocked(game));
    const mandatoryGamesAlreadyLockedWithoutPick = mandatoryGames.filter(game => isGameLocked(game) && !picks[game.id]);

    if (mandatoryGamesAlreadyLockedWithoutPick.length > 0) {
      setMessage('You cannot save picks for past mandatory games that were not selected. Please review your selections.');
      setAlertMessage('You cannot save picks for past mandatory games that were not selected. Please review your selections.');
      setShowAlertModal(true);
      return;
    }

    const missingMandatoryPicks = mandatoryGamesToPick.filter(game => !picks[game.id]);
    if (missingMandatoryPicks.length > 0) {
      setMessage('Please make a selection for all mandatory televised games.');
      setAlertMessage('Please make a selection for all mandatory televised games.');
      setShowAlertModal(true);
      return;
    }

    const playerPicks = Object.values(picks).filter((pick) => pick.selectionTeam);
    if (!playerPicks.length) {
      setMessage('Choose at least one game before saving picks.');
      setAlertMessage('Choose at least one game before saving picks.');
      setShowAlertModal(true);
      return;
    }

    // open confirmation modal
    setShowConfirmSave(true);
  };

  // perform the actual save after confirmation
  const performSave = async () => {
    setShowConfirmSave(false);
    const playerPicks = Object.values(picks).filter((pick) => pick.selectionTeam);
    
    try {
      const result = await savePicks(playerPicks);
      const data = result.data;
      if (result.ok) {
        setMessage('Picks saved!');
        setSaveResult({ success: true, message: 'Picks saved successfully.' });
        // build a friendly summary using current games data
        loadStats(selectedPlayer);
        const saved = (data.saved || []).map((p) => {
          const g = games.find((gg) => gg.id === p.game_id) || {};
          return {
            player: p.player,
            selection_team: p.selection_team,
            spread: p.spread,
            away_team: g.away_team,
            home_team: g.home_team
          };
        });
        setSavedPicksList(saved);
        setShowSaveResult(true);
      } else {
        setMessage(data.error || 'Failed to save picks.');
        setSaveResult({ success: false, message: data.error || 'Failed to save picks.' });
        setSavedPicksList([]);
        setShowSaveResult(true);
      }
    } catch (error) {
      setMessage('Unable to save picks.');
      setSaveResult({ success: false, message: 'Unable to save picks.' });
      setSavedPicksList([]);
      setShowSaveResult(true);
    }
  };

  const handleManualGameChange = (field, value) => {
    setManualGame((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddManualGame = async () => {
    if (!manualGame.home_team || !manualGame.away_team || !manualGame.commence_time || selectedWeek === null || !selectedSeason) {
      setAlertMessage('Home team, away team, commence time, season, and week are required.');
      setShowAlertModal(true);
      return;
    }

    try {
      const result = await addManualGame({
        ...manualGame,
        spread_home: manualGame.spread_home ? Number(manualGame.spread_home) : null,
        spread_away: manualGame.spread_away ? Number(manualGame.spread_away) : null,
        home_price: manualGame.home_price ? Number(manualGame.home_price) : null,
        away_price: manualGame.away_price ? Number(manualGame.away_price) : null,
      });

      if (result.success) {
        setManualGame(emptyManualGame);
        setMessage('Manual game added.');
      } else {
        setMessage(result.error || 'Failed to add manual game.');
      }
    } catch (error) {
      setMessage('Unable to add manual game.');
    }
  };

  return (
    <div className="app-shell">
      <header className="page-header">
        <div>
          <h1 className="image-title">
            <img src={logo} alt="Benjamin Buford Blue Award" />
          </h1>
        </div>
        <button
          className="menu-toggle"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Toggle navigation"
        >
          {menuOpen ? 'Close' : 'Menu'}
        </button>
      </header>

      {showAlertModal && (
        <>
          <div className="modal-backdrop" />
          <div className="player-modal">
            <div className="player-modal-content">
              <h2>Alert</h2>
              <p>{alertMessage}</p>
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button className="continue-button" onClick={() => setShowAlertModal(false)}>Okay</button>
              </div>
            </div>
          </div>
        </>
      )}
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

        {showConfirmSave && (
          <>
            <div className="modal-backdrop" />
            <div className="player-modal">
              <div className="player-modal-content">
                <h2>Confirm Save</h2>
                <p>Are you sure you want to save your picks for week {selectedWeek} as <strong>{selectedPlayer}</strong>?</p>
                <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                  <button className="continue-button" onClick={() => performSave()} disabled={loading}>Yes, save</button>
                  <button className="continue-button" onClick={() => setShowConfirmSave(false)} disabled={loading}>Cancel</button>
                </div>
              </div>
            </div>
          </>
        )}

        {showSaveResult && (
          <>
            <div className="modal-backdrop" />
            <div className="player-modal">
              <div className="player-modal-content">
                <h2>{saveResult.success ? 'Save Successful' : 'Save Failed'}</h2>
                <p>{saveResult.message}</p>
                {saveResult.success && savedPicksList.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <h4>Saved Picks</h4>
                    <ul>
                      {savedPicksList.map((p, idx) => (
                        <li key={idx}>
                          {p.away_team} @ {p.home_team} — <strong>{p.selection_team}</strong> {p.spread ? `(${p.spread})` : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                  <button className="continue-button" onClick={() => setShowSaveResult(false)}>Close</button>
                </div>
              </div>
            </div>
          </>
        )}

      <div className={`app-layout ${menuOpen ? 'menu-open' : ''} ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}> 
        <Sidebar 
          menuOpen={menuOpen}
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
          activePage={activePage}
          handlePageChange={handlePageChange}
        />

        <main className="main-content" style={{ paddingTop: '10px' }}>
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

          {isStatsPage && (
            <StatsPage 
              selectedPlayer={selectedPlayer}
              playerStats={playerStats}
              selectedConference={selectedConference}
              setSelectedConference={setSelectedConference}
              conferenceList={conferenceList}
              statsTimeRange={statsTimeRange}
              setStatsTimeRange={setStatsTimeRange}
              conferenceStats={conferenceStats}
            />
          )}

          {isAdminPage && (
            <AdminPage
              loading={loading}
              setLoading={setLoading}
              selectedWeek={selectedWeek}
              selectedSeason={selectedSeason}
              selectedPlayer={selectedPlayer}
              setMessage={setMessage}
              setAlertMessage={setAlertMessage}
              setShowAlertModal={setShowAlertModal}
              loadWeek={loadWeek}
              loadStats={loadStats}
            />
          )}
          {isPicksPage && (
            <PicksPage
              mandatoryGames={mandatoryGames}
              optionalGames={optionalGames}
              picks={picks}
              handlePickChange={handlePickChange}
              isGameLocked={isGameLocked}
              isGameLive={isGameLive}
              handleSubmit={handleSubmit}
              loading={loading}
              selectedWeek={selectedWeek}
            />
          )}

          {isManualPage && (
            <section className="panel manual-panel">
              <h2>Add a Manual Game</h2>
              <div className="manual-grid">
                <label>
                  Home team
                  <select
                    value={manualGame.home_team}
                    onChange={(e) => handleManualGameChange('home_team', e.target.value)}
                  >
                    <option value="">-- Select Home Team --</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.school}>{t.school} {t.nickname}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Away team
                  <select
                    value={manualGame.away_team}
                    onChange={(e) => handleManualGameChange('away_team', e.target.value)}
                  >
                    <option value="">-- Select Away Team --</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.school}>{t.school} {t.nickname}</option>
                    ))}
                  </select>
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
                <button disabled={loading || selectedWeek === null} onClick={handleAddManualGame}>Add Manual Game</button>
              </div>
            </section>
          )}

          {isSummaryPage && (
            <>
              <section className="panel summary-panel">
                <h2>Week {selectedWeek} Leaderboard</h2>
                {summary.length === 0 ? (
                  <p>No picks yet for this week.</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Player</th>
                        <th>Wins</th>
                        <th>Win %</th>
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
                          <td>{row.total > 0 ? ((row.wins / row.total) * 100).toFixed(1) + '%' : 'N/A'}</td>
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
                <h2>{selectedSeason} Season Leaderboard</h2>
                {seasonSummary.length === 0 ? (
                  <p>No picks for this season yet.</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Player</th>
                        <th>Wins</th>
                        <th>Win %</th>
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
                          <td>{row.total > 0 ? ((row.wins / row.total) * 100).toFixed(1) + '%' : 'N/A'}</td>
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
                <h2>All-Time Leaderboard</h2>
                {allTimeSummary.length === 0 ? (
                  <p>No picks recorded yet.</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Player</th>
                        <th>Wins</th>
                        <th>Win %</th>
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
                          <td>{row.total > 0 ? ((row.wins / row.total) * 100).toFixed(1) + '%' : 'N/A'}</td>
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

        </main>
      </div>
    </div>
  );
}

export default App;
