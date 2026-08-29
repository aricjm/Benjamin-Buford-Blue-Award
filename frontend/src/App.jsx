import { useEffect, useState, Suspense, lazy } from 'react';
import { Lock, AlertTriangle } from 'lucide-react';
import logo from "./resources/images/benjamin_buford_blue_award_cutout.png";

// Import Sub-Components
import Sidebar from './components/Sidebar';
import LoadingAnimation from './components/LoadingAnimation';

// Lazy Load Heavy Pages
const StatsPage = lazy(() => import('./components/StatsPage'));
const ResearchPage = lazy(() => import('./components/ResearchPage'));
const AdminPage = lazy(() => import('./components/AdminPage'));
const PicksPage = lazy(() => import('./components/PicksPage'));
const LeaderboardPage = lazy(() => import('./components/LeaderboardPage'));
const AwardsPage = lazy(() => import('./components/AwardsPage'));
const BBBMLPPage = lazy(() => import('./components/BBBMLPPage'));
const OddsHistoryPage = lazy(() => import('./components/OddsHistoryPage'));
const LiveScoresPage = lazy(() => import('./components/LiveScoresPage'));
const RankingsHistoryPage = lazy(() => import('./components/RankingsHistoryPage'));

// Import Custom Hooks
import { useBetData } from './hooks/useBetData';
import useIsMobile from './hooks/useIsMobile';

const DEFAULT_SEASON = new Date().getUTCFullYear().toString();

function App() {
  // UI Specific State
  const [selectedSeason, setSelectedSeason] = useState(DEFAULT_SEASON);
  const [selectedPlayer, setSelectedPlayer] = useState(() => {
    const saved = localStorage.getItem('selectedPlayer');
    return saved || 'Aric';
  });
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [selectedConference, setSelectedConference] = useState('');
  const [statsTimeRange, setStatsTimeRange] = useState('All-Time');

  const [menuOpen, setMenuOpen] = useState(false);
  const [activePage, setActivePage] = useState('picks');
  const [playerModalOpen, setPlayerModalOpen] = useState(true);
  const [showConfirmSave, setShowConfirmSave] = useState(false);
  const [showSaveResult, setShowSaveResult] = useState(false);
  const [saveResult, setSaveResult] = useState({ success: false, message: '' });
  const [savedPicksList, setSavedPicksList] = useState([]);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [hasLiveGames, setHasLiveGames] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });

  // Consume the custom hooks
  const isMobile = useIsMobile();
  const {
    players, seasons, weeks, teams, games, picks, loadedPicks, otherPlayersLocks,
    summary, seasonSummary, allTimeSummary,
    loading, message, playerStats, conferenceStats, allPlayerStats,
    setLoading, setMessage, loadStats, loadWeek, 
    handlePickChange, handleTotalChange, handleSpreadAdjust, handleTotalAdjust, handleLockToggle, addManualGame, savePicks
  } = useBetData(selectedSeason, selectedWeek, selectedPlayer, selectedConference, statsTimeRange);

  const handlePageChange = (page) => {
    setActivePage(page);
    setMenuOpen(false);
  };

  // Utility to auto-select first season/week on metadata load
  useEffect(() => {
    if (seasons.length && !selectedSeason) setSelectedSeason(seasons[0]);
    if (players.length && !selectedPlayer) setSelectedPlayer('Aric');
    
    if (weeks.length && selectedWeek === null) {
      const now = new Date();
      // Find the week where the current date falls between starts_on and ends_on
      const currentActiveWeek = weeks.find(w => {
        if (!w.starts_on || !w.ends_on) return false;
        const start = new Date(w.starts_on);
        const end = new Date(w.ends_on);
        return now >= start && now <= end;
      });
      
      if (currentActiveWeek) {
        setSelectedWeek(currentActiveWeek.week);
      } else {
        // Fallback to the first week if no active week is found
        setSelectedWeek(weeks[0].week);
      }
    }
  }, [seasons, weeks, players, selectedSeason, selectedWeek, selectedPlayer]);

  // Auto-adjust selectedWeek when the weeks list changes (e.g., when switching seasons)
  useEffect(() => {
    if (weeks.length > 0) {
      const hasCurrentWeek = weeks.some((w) => w.week === selectedWeek);
      if (!hasCurrentWeek) {
        setSelectedWeek(weeks[0].week);
      }
    }
  }, [weeks, selectedWeek]);

  // Check periodically if any college football games are currently live
  useEffect(() => {
    const checkLiveGames = async () => {
      try {
        const res = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?groups=80&limit=300');
        const data = await res.json();
        const liveCount = (data.events || []).filter(e => e.status?.type?.state === 'in').length;
        setHasLiveGames(liveCount > 0);
      } catch (err) {
        console.error('Failed to check live game status', err);
      }
    };

    checkLiveGames();
    const interval = setInterval(checkLiveGames, 30000);
    return () => clearInterval(interval);
  }, []);

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

  // Combine mandatory and optional games into one list and deduplicate by ID
  const pickGames = games
    .filter((g, idx, arr) => idx === arr.findIndex(t => t.id === g.id))
    .sort((a, b) => new Date(a.commence_time) - new Date(b.commence_time));

  const isSummaryPage = activePage === 'summary';
  const isPicksPage = activePage === 'picks';
  const isAdminPage = activePage === 'admin';
  const isStatsPage = activePage === 'stats';
  const isResearchPage = activePage === 'research';
  const isAwardsPage = activePage === 'awards';
  const isBBBMLPPage = activePage === 'bbbmlp';
  const isOddsHistoryPage = activePage === 'odds-history';
  const isLiveScoresPage = activePage === 'live-scores';
  const isRankingsHistoryPage = activePage === 'rankings-history';

  // validate and open confirmation modal
  const handleSubmit = () => {
    if (selectedWeek === null || !selectedSeason) {
      setMessage('Choose a season and week first.');
      setAlertMessage('Choose a season and week first.');
      setShowAlertModal(true);
      return;
    }

    const playerPicks = Object.values(picks).filter((pick) => pick.selectionTeam || pick.selectionTotal);
    if (!playerPicks.length) {
      setMessage('Choose at least one game before saving picks.');
      return;
    }

    setShowConfirmSave(true);
  };

  // perform the actual save after confirmation
  const performSave = async () => {
    setShowConfirmSave(false);
    setMessage('');
    const playerPicks = Object.values(picks).filter((pick) => pick.selectionTeam || pick.selectionTotal);
    
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
      } else if (data && data.queued) {
        // queued on server — persist same UI feedback but indicate pending
        setMessage('Picks queued for delivery (offline mode).');
        setSaveResult({ success: false, message: 'Picks queued for delivery.' });
        setSavedPicksList([]);
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

  const playerPicks = Object.values(picks).filter((pick) => pick.selectionTeam || pick.selectionTotal);
  const hasLock = playerPicks.some(p => p.isLock);

  const buildPickItems = (pick) => {
    const game = pickGames.find(g => g.id === pick.gameId);
    if (!game) return [];
    const gameLabel = `${game.away_team} @ ${game.home_team}`;
    const items = [];

    if (pick.selectionTeam) {
      const spread = pick.spread ?? (pick.selectionSide === 'home' ? game.spread_home : game.spread_away);
      const spreadText = spread === 0 ? 'PK' : (spread > 0 ? `+${spread}` : spread);
      const isSpreadLock = pick.isLock && pick.lockType === 'spread';
      items.push({
        key: `${pick.gameId}-spread`,
        game: gameLabel,
        details: `${pick.selectionTeam} ${spreadText}`,
        isLock: isSpreadLock,
        type: 'spread'
      });
    }

    if (pick.selectionTotal) {
      const isTotalLock = pick.isLock && pick.lockType === 'total';
      items.push({
        key: `${pick.gameId}-total`,
        game: gameLabel,
        details: `${pick.selectionTotal.toUpperCase()} ${pick.totalLine}`,
        isLock: isTotalLock,
        type: 'total'
      });
    }

    return items;
  };

  const isSpreadSaved = (pick, originalPick) => {
    if (!originalPick) return false;
    return pick.selectionTeam === originalPick.selectionTeam &&
      (pick.isLock && pick.lockType === 'spread') === (originalPick.isLock && originalPick.lockType === 'spread');
  };

  const isTotalSaved = (pick, originalPick) => {
    if (!originalPick) return false;
    return pick.selectionTotal === originalPick.selectionTotal &&
      pick.totalLine === originalPick.totalLine &&
      (pick.isLock && pick.lockType === 'total') === (originalPick.isLock && originalPick.lockType === 'total');
  };

  const alphabeticalPickSorter = (a, b) => a.game.localeCompare(b.game);
  const alreadySaved = [];
  const newPicks = [];
  const removedPicks = [];

  playerPicks.forEach((pick) => {
    const items = buildPickItems(pick);
    const originalPick = loadedPicks[pick.gameId];
    items.forEach((item) => {
      if (item.type === 'spread' && isSpreadSaved(pick, originalPick)) {
        alreadySaved.push(item);
      } else if (item.type === 'total' && isTotalSaved(pick, originalPick)) {
        alreadySaved.push(item);
      } else {
        newPicks.push(item);
      }
    });
  });

  // Check for removed picks
  Object.values(loadedPicks).forEach((originalPick) => {
    const currentPick = picks[originalPick.gameId];
    const game = pickGames.find(g => g.id === originalPick.gameId);
    if (!game) return;
    const gameLabel = `${game.away_team} @ ${game.home_team}`;

    if (originalPick.selectionTeam && (!currentPick || !currentPick.selectionTeam)) {
      const spread = originalPick.spread ?? (originalPick.selectionSide === 'home' ? game.spread_home : game.spread_away);
      const spreadText = spread === 0 ? 'PK' : (spread > 0 ? `+${spread}` : spread);
      const isSpreadLock = originalPick.isLock && originalPick.lockType === 'spread';
      removedPicks.push({
        key: `${originalPick.gameId}-spread-removed`,
        game: gameLabel,
        details: `${originalPick.selectionTeam} ${spreadText}`,
        isLock: isSpreadLock,
        type: 'spread'
      });
    }

    if (originalPick.selectionTotal && (!currentPick || !currentPick.selectionTotal)) {
      const isTotalLock = originalPick.isLock && originalPick.lockType === 'total';
      removedPicks.push({
        key: `${originalPick.gameId}-total-removed`,
        game: gameLabel,
        details: `${originalPick.selectionTotal.toUpperCase()} ${originalPick.totalLine}`,
        isLock: isTotalLock,
        type: 'total'
      });
    }
  });

  const picksToConfirm = {
    alreadySaved: alreadySaved.sort(alphabeticalPickSorter),
    newPicks: newPicks.sort(alphabeticalPickSorter),
    removedPicks: removedPicks.sort(alphabeticalPickSorter)
  };

  const selectableBets = [];
  playerPicks.forEach((pick) => {
    const game = pickGames.find(g => g.id === pick.gameId);
    if (!game) return;

    if (pick.selectionTeam) {
      const spread = pick.spread ?? (pick.selectionSide === 'home' ? game.spread_home : game.spread_away);
      const spreadText = spread === 0 ? 'PK' : (spread > 0 ? `+${spread}` : spread);
      
      const oppositeTeam = pick.selectionTeam === game.home_team ? game.away_team : game.home_team;
      const isConflicted = otherPlayersLocks.some(l => l.gameId === game.id && l.selectionTeam === oppositeTeam);

      if (!isConflicted) {
        selectableBets.push({
          gameId: pick.gameId,
          type: 'spread',
          label: `${pick.selectionTeam} ${spreadText}`,
          gameLabel: `${game.away_team} @ ${game.home_team}`,
          isLock: pick.isLock && pick.lockType === 'spread',
          gameObj: game
        });
      }
    }

    if (pick.selectionTotal) {
      const oppositeTotal = pick.selectionTotal === 'over' ? 'under' : 'over';
      const isConflicted = otherPlayersLocks.some(l => l.gameId === game.id && l.selectionTotal === oppositeTotal);

      if (!isConflicted) {
        selectableBets.push({
          gameId: pick.gameId,
          type: 'total',
          label: `${pick.selectionTotal.toUpperCase()} ${pick.totalLine}`,
          gameLabel: `${game.away_team} @ ${game.home_team}`,
          isLock: pick.isLock && pick.lockType === 'total',
          gameObj: game
        });
      }
    }
  });

  return (
    <div className="app-shell">
      {loading && <LoadingAnimation />}

      <header className="page-header">
        <div>
          <h1 className="image-title">
            {isMobile ? 'BBB Award' : <img src={logo} alt="Benjamin Buford Blue Award" />}
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
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', margin: '20px 0' }}>
                {players.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => {
                      setSelectedPlayer(player.name);
                      localStorage.setItem('selectedPlayer', player.name);
                    }}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: selectedPlayer === player.name ? '2px solid #4d7cff' : '1px solid rgba(255,255,255,0.2)',
                      backgroundColor: selectedPlayer === player.name ? 'rgba(77,124,255,0.2)' : 'rgba(255,255,255,0.05)',
                      color: selectedPlayer === player.name ? '#4d7cff' : '#fff',
                      fontWeight: selectedPlayer === player.name ? 'bold' : 'normal',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      flex: 1
                    }}
                  >
                    {player.name}
                  </button>
                ))}
              </div>
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
                <p>Are you sure you want to save your picks for Week {selectedWeek} as <strong>{selectedPlayer}</strong>?</p>
                
                {hasLock ? (
                  (picksToConfirm.alreadySaved.length > 0 || picksToConfirm.newPicks.length > 0 || picksToConfirm.removedPicks.length > 0) && (
                    <div style={{ marginTop: 12, textAlign: 'left', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                      <h4 style={{ marginTop: 0, marginBottom: '8px' }}>
                        Your Picks ({picksToConfirm.alreadySaved.length + picksToConfirm.newPicks.length}):
                      </h4>
                      {picksToConfirm.newPicks.length > 0 && (
                        <div>
                          <h5 style={{ margin: '0 0 8px 0', color: '#8bc34a' }}>New picks ({picksToConfirm.newPicks.length}):</h5>
                          <ul style={{ margin: 0, paddingLeft: '20px' }}>
                            {picksToConfirm.newPicks.map((p) => (
                              <li key={`new-${p.key}`} style={{ marginBottom: '6px' }}>
                                <div>{p.game}</div>
                                <strong style={{ color: '#2196f3', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  {p.details}{p.isLock && <Lock size={13} style={{ color: '#f1c40f' }} />}
                                </strong>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {picksToConfirm.alreadySaved.length > 0 && picksToConfirm.newPicks.length > 0 && <br />}
                      {picksToConfirm.alreadySaved.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                          <h5 style={{ margin: '0 0 8px 0', color: '#8bc34a' }}>Previously saved picks ({picksToConfirm.alreadySaved.length}):</h5>
                          <ul style={{ margin: 0, paddingLeft: '20px' }}>
                            {picksToConfirm.alreadySaved.map((p) => (
                              <li key={`saved-${p.key}`} style={{ marginBottom: '6px' }}>
                                <div>{p.game}</div>
                                <strong style={{ color: '#2196f3', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  {p.details}{p.isLock && <Lock size={13} style={{ color: '#f1c40f' }} />}
                                </strong>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {picksToConfirm.removedPicks.length > 0 && (
                        <div style={{ marginTop: 16 }}>
                          <h5 style={{ margin: '0 0 8px 0', color: '#f44336' }}>Removed picks ({picksToConfirm.removedPicks.length}):</h5>
                          <ul style={{ margin: 0, paddingLeft: '20px' }}>
                            {picksToConfirm.removedPicks.map((p) => (
                              <li key={`removed-${p.key}`} style={{ marginBottom: '6px' }}>
                                <div>{p.game}</div>
                                <strong style={{ color: '#f44336', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  {p.details}{p.isLock && <Lock size={13} style={{ color: '#f1c40f' }} />}
                                </strong>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  <div style={{ marginTop: 12, textAlign: 'left', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ color: '#ffcc00', fontWeight: 'bold', marginBottom: '12px', border: '1px solid #ffcc00', padding: '8px', borderRadius: '6px', backgroundColor: 'rgba(255, 204, 0, 0.1)', fontSize: '0.9em' }}>
                      <AlertTriangle size={18} /> {selectableBets.length === 0 ? "You have no valid picks available to lock. Please make a pick that hasn't been locked by another player." : "You must select one Lock for this week before saving. Please select one of your picks below:"}
                    </div>
                    <div style={{ maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
                      {selectableBets.length === 0 ? (
                        <div style={{ color: '#aaa', fontStyle: 'italic', padding: '8px' }}>
                          No valid picks available to lock. Please make a pick that hasn't been locked by another player.
                        </div>
                      ) : (
                        selectableBets.map((bet) => (
                          <label 
                            key={`${bet.gameId}-${bet.type}`} 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '10px', 
                              padding: '8px', 
                              borderRadius: '6px', 
                              cursor: 'pointer',
                              background: bet.isLock ? 'rgba(241, 196, 15, 0.15)' : 'transparent',
                              border: bet.isLock ? '1px solid #f1c40f' : '1px solid transparent',
                              marginBottom: '6px',
                              userSelect: 'none'
                            }}
                          >
                            <input 
                              type="radio" 
                              name="lock-selection" 
                              checked={bet.isLock}
                              onChange={() => handleLockToggle(bet.gameObj, bet.type)}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '0.8em', color: '#aaa' }}>{bet.gameLabel}</div>
                              <strong style={{ color: bet.isLock ? '#f1c40f' : '#2196f3', fontSize: '0.95em', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                {bet.label} {bet.isLock && <Lock size={13} />}
                              </strong>
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                  {(!hasLock && selectableBets.length === 0) ? null : (
                    <button className="continue-button" onClick={() => performSave()} disabled={loading || !hasLock}>Yes, save</button>
                  )}
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
              {saveResult.success && picksToConfirm.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <h4>Saved Picks</h4>
                    <ul>
                      {savedPicksList.map((p, idx) => (
                        <li key={idx}>
                          {p.away_team} @ {p.home_team} — <strong>{p.selection_team}</strong> {p.spread !== null ? (
                            p.spread === 0 ? '(PK)' : `(${p.spread > 0 ? '+' : ''}${p.spread})`
                          ) : ''}
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
          setMenuOpen={setMenuOpen}
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
          activePage={activePage}
          handlePageChange={handlePageChange}
          selectedPlayer={selectedPlayer}
          hasLiveGames={hasLiveGames}
        />

        <main className="main-content" style={{ paddingTop: '10px' }}>
          {!isAwardsPage && !isResearchPage && !isStatsPage && !isSummaryPage && !isAdminPage && !isBBBMLPPage && !isOddsHistoryPage && !isRankingsHistoryPage && (
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
          )}          

          <Suspense fallback={<LoadingAnimation />}>
            {isStatsPage && (
              <StatsPage 
                players={players}
                seasons={seasons}
                selectedPlayer={selectedPlayer}
                setSelectedPlayer={setSelectedPlayer}
                playerStats={playerStats}
                selectedConference={selectedConference}
                setSelectedConference={setSelectedConference}
                conferenceList={conferenceList}
                statsTimeRange={statsTimeRange}
                setStatsTimeRange={setStatsTimeRange}
                conferenceStats={conferenceStats}
                allPlayerStats={allPlayerStats}
                selectedWeek={selectedWeek}
                selectedSeason={selectedSeason}
              />
            )}

            {isResearchPage && (
              <ResearchPage 
                teams={teams}
                conferenceList={conferenceList}
                seasons={seasons}
                selectedWeek={selectedWeek}
                selectedSeason={selectedSeason}
              />
            )}

            {isAdminPage && selectedPlayer === 'Aric' && (
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
                players={players}
                seasons={seasons}
                weeks={weeks}
              />
            )}
            {isPicksPage && (
              <PicksPage 
                pickGames={pickGames}
                picks={picks}
                otherPlayersLocks={otherPlayersLocks}
                handlePickChange={handlePickChange}
                handleTotalChange={handleTotalChange}
                handleSpreadAdjust={handleSpreadAdjust}
                handleTotalAdjust={handleTotalAdjust}
                handleLockToggle={handleLockToggle}
                isGameLocked={isGameLocked}
                isGameLive={isGameLive}
                handleSubmit={handleSubmit}
                loading={loading}
                selectedWeek={selectedWeek}
                message={message}
                messageSuccess={message === 'Picks saved!'}
                teams={teams}
              />
            )}

            {isSummaryPage && (
              <LeaderboardPage 
                summary={summary}
                seasonSummary={seasonSummary}
                allTimeSummary={allTimeSummary}
                selectedWeek={selectedWeek}
                selectedSeason={selectedSeason}
                seasons={seasons}
                weeks={weeks}
              />
            )}

            {isAwardsPage && (
              <AwardsPage seasons={seasons} selectedPlayer={selectedPlayer} />
            )}

            {isBBBMLPPage && (
              <BBBMLPPage seasons={seasons} players={players} />
            )}

            {isOddsHistoryPage && (
              <OddsHistoryPage 
                seasons={seasons}
                weeks={weeks}
                selectedSeason={selectedSeason}
                selectedWeek={selectedWeek}
                setSelectedSeason={setSelectedSeason}
                setSelectedWeek={setSelectedWeek}
              />
            )}

            {isLiveScoresPage && (
              <LiveScoresPage 
                pickGames={pickGames}
                picks={picks}
                teams={teams}
              />
            )}

            {isRankingsHistoryPage && (
              <RankingsHistoryPage 
                seasons={seasons}
                weeks={weeks}
                selectedSeason={selectedSeason}
                selectedWeek={selectedWeek}
              />
            )}
          </Suspense>

        </main>
      </div>
    </div>
  );
}

export default App;
