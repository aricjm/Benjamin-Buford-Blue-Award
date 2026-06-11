import { useEffect, useState } from 'react';
import logo from "./resources/images/benjamin_buford_blue_award_emblem_8.png";

// Import the new icon components
import ChevronLeftIcon from "./resources/icons/ChevronLeftIcon";
import ChevronRightIcon from "./resources/icons/ChevronRightIcon";
import FootballIcon from "./resources/icons/FootballIcon";
import StatsIcon from "./resources/icons/StatsIcon";
import LeaderboardIcon from "./resources/icons/LeaderboardIcon";
import AddIcon from "./resources/icons/AddIcon";
import AdminIcon from "./resources/icons/AdminIcon";
import ComponentsIcon from "./resources/icons/ComponentsIcon";
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
  const [teams, setTeams] = useState([]);
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
  const [showConfirmSave, setShowConfirmSave] = useState(false);
  const [showSaveResult, setShowSaveResult] = useState(false);
  const [saveResult, setSaveResult] = useState({ success: false, message: '' });
  const [savedPicksList, setSavedPicksList] = useState([]);
  const [adminGames, setAdminGames] = useState([]);
  const [adminPicks, setAdminPicks] = useState([]);
  const [editingGameId, setEditingGameId] = useState(null);
  const [editingGameData, setEditingGameData] = useState({});
  const [editingPickId, setEditingPickId] = useState(null);
  const [editingPickData, setEditingPickData] = useState({});
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });
  const [playerStats, setPlayerStats] = useState(null);
  const [selectedConference, setSelectedConference] = useState('');
  const [statsTimeRange, setStatsTimeRange] = useState('All-Time');
  const [conferenceStats, setConferenceStats] = useState(null);
  const [lastSynced, setLastSynced] = useState(() => {
    const saved = localStorage.getItem('lastSyncTime');
    return saved ? new Date(saved) : null;
  });

  const handlePageChange = (page) => {
    setActivePage(page);
    setMenuOpen(false);
  };

  useEffect(() => {
    async function loadMeta() {
      setLoading(true);
      try {
        // const [playersRes, seasonsRes] = await Promise.all([
        const [playersRes, seasonsRes, teamsRes] = await Promise.all([
          fetch('/api/players'),
          fetch('/api/seasons'),
          fetch('/api/teams')
        ]);
        const playersJson = await playersRes.json();
        const seasonsJson = await seasonsRes.json();
        const teamsJson = await teamsRes.json();
        setPlayers(playersJson);
        setSeasons(seasonsJson);
        setTeams(teamsJson);
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

  const loadStats = async (player) => {
    if (!player) return;
    try {
      const res = await fetch(`/api/stats/${player}`);
      const data = await res.json();
      setPlayerStats(data);
    } catch (error) {
      console.error('Failed to load stats', error);
    }
  };

  const loadConferenceStats = async () => {
    if (!selectedPlayer || !selectedConference) {
      setConferenceStats(null);
      return;
    }
    try {
      const res = await fetch(`/api/stats/${selectedPlayer}/conference?conference=${selectedConference}&range=${statsTimeRange}&week=${selectedWeek}&season=${selectedSeason}`);
      const data = await res.json();
      setConferenceStats(data);
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    if (!selectedPlayer) return;
    loadStats(selectedPlayer);
  }, [selectedPlayer]);

  useEffect(() => {
    if (selectedWeek === null || !selectedSeason) return;
    loadWeek(selectedWeek, selectedSeason, selectedPlayer);
  }, [selectedWeek, selectedSeason, selectedPlayer]);

  useEffect(() => {
    loadConferenceStats();
  }, [selectedWeek, selectedSeason, selectedPlayer, selectedConference, statsTimeRange]);

  const loadWeek = async (week, season, player) => {
    setLoading(true);
    setMessage('Loading week data...');
    try {
      const res = await fetch(`/api/week/${week}/games?season=${season}`);
      const data = await res.json();
      setGames(data.games || []);
      setSummary(data.summary || []);

      const picksObj = {};
      if (data.picks && player) {
        data.picks.forEach((p) => {
          if (p.player === player) {
            picksObj[p.game_id] = {
              gameId: p.game_id,
              selectionTeam: p.selection_team,
              selectionSide: p.selection_side,
              spread: p.spread,
              isMandatory: !!p.is_mandatory
            };
          }
        });
      }
      setPicks(picksObj);

      setMessage('');
    } catch (error) {
      setMessage('Unable to load week data.');
    } finally {
      setLoading(false);
    }
  };

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
    if (!manualGame.home_team || !manualGame.away_team || !manualGame.commence_time || selectedWeek === null || !selectedSeason) {
      setAlertMessage('Home team, away team, commence time, season, and week are required.');
      setShowAlertModal(true);
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
    if (selectedWeek === null || !selectedSeason) return;
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
      setAlertMessage('At least one spread must be provided.');
      setShowAlertModal(true);
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

  const handleSyncScores = async () => {
    setLoading(true);
    setMessage('Syncing scores and odds from API...');
    try {
      const response = await fetch('/api/sync-all', { method: 'POST' });
      const data = await response.json();
      if (response.ok) {
        const now = new Date();
        setLastSynced(now);
        localStorage.setItem('lastSyncTime', now.toISOString());
        setMessage(`Sync complete: ${data.savedCount} games and ${data.updatedCount} scores updated.`);
        if (selectedWeek && selectedSeason) {
          await loadWeek(selectedWeek, selectedSeason, selectedPlayer);
          if (activePage === 'admin') {
            await loadAdminData();
          }
          loadStats(selectedPlayer);
        }
      } else {
        setMessage(data.error || 'Failed to sync scores.');
      }
    } catch (error) {
      setMessage('Unable to sync scores.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePick = async (pickId) => {
    if (!editingPickData.selection_team) {
      setMessage('Selection team is required.');
      setAlertMessage('Selection team is required.');
      setShowAlertModal(true);
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
        <aside className={`sidebar ${menuOpen ? 'open' : ''} ${isSidebarCollapsed ? 'collapsed' : ''}`}>
          <button 
            onClick={() => {
              const next = !isSidebarCollapsed;
              setIsSidebarCollapsed(next);
              localStorage.setItem('sidebarCollapsed', next);
            }}
            style={{ 
              background: 'rgba(255,255,255,0.06)', 
              border: 'none', 
              color: '#f5f5f5', // Changed to white for better visibility against dark background
              cursor: 'pointer', 
              width: '100%', 
              fontSize: '1.2rem', 
              padding: '10px 0',
              borderRadius: '12px',
              marginBottom: '12px'
            }}
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isSidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </button>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <button
              className={activePage === 'picks' ? 'active' : ''}
              onClick={() => handlePageChange('picks')}
              style={{ padding: '8px 16px', fontSize: '0.9rem', textAlign: isSidebarCollapsed ? 'center' : 'left' }}
              title={isSidebarCollapsed ? "Picks" : ""}
            >
              {isSidebarCollapsed ? <FootballIcon /> : 'Picks'}
            </button>
            <button
              className={activePage === 'stats' ? 'active' : ''}
              onClick={() => handlePageChange('stats')}
              style={{ padding: '8px 16px', fontSize: '0.9rem', textAlign: isSidebarCollapsed ? 'center' : 'left' }}
              title={isSidebarCollapsed ? "My Stats" : ""}
            >
              {isSidebarCollapsed ? <StatsIcon /> : 'My Stats'}
            </button>
            <button
              className={activePage === 'summary' ? 'active' : ''}
              onClick={() => handlePageChange('summary')}
              style={{ padding: '8px 16px', fontSize: '0.9rem', textAlign: isSidebarCollapsed ? 'center' : 'left' }}
              title={isSidebarCollapsed ? "Leaderboards" : ""}
            >
              {isSidebarCollapsed ? <LeaderboardIcon /> : 'Leaderboards'}
            </button>
            <button
              className={activePage === 'manual' ? 'active' : ''}
              onClick={() => handlePageChange('manual')}
              style={{ padding: '8px 16px', fontSize: '0.9rem', textAlign: isSidebarCollapsed ? 'center' : 'left' }}
              title={isSidebarCollapsed ? "Add Manual Game" : ""}
            >
              {isSidebarCollapsed ? <AddIcon /> : 'Add Game Manually'}
            </button>
            <button
              className={activePage === 'admin' ? 'active' : ''}
              onClick={() => handlePageChange('admin')}
              style={{ padding: '8px 16px', fontSize: '0.9rem', textAlign: isSidebarCollapsed ? 'center' : 'left' }}
              title={isSidebarCollapsed ? "Admin" : ""}
            >
              {isSidebarCollapsed ? <AdminIcon /> : 'Admin'}
            </button>
            <button
              className={activePage === 'buttons' ? 'active' : ''}
              onClick={() => handlePageChange('buttons')}
              style={{ padding: '8px 16px', fontSize: '0.9rem', textAlign: isSidebarCollapsed ? 'center' : 'left' }}
              title={isSidebarCollapsed ? "Buttons" : ""}
            >
              {isSidebarCollapsed ? <ComponentsIcon /> : 'Buttons'}
            </button>
          </nav>
        </aside>

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

          {isStatsPage && playerStats && (
            <section className="panel stats-panel">
              <h2>{selectedPlayer}'s All-Time Stats</h2>
              <div className="manual-grid" style={{ marginTop: '20px' }}>
                <div className="control-card">
                  <h3>Record</h3>
                  <p style={{ fontSize: '1.5em', fontWeight: 'bold', margin: '10px 0' }}>
                    {playerStats.record.wins || 0} - {playerStats.record.losses || 0} - {playerStats.record.pushes || 0}
                  </p>
                  <p className="switch-label">
                    Win %: {playerStats.record.wins + playerStats.record.losses > 0 
                      ? ((playerStats.record.wins / (playerStats.record.wins + playerStats.record.losses)) * 100).toFixed(1) + '%' 
                      : 'N/A'}
                  </p>
                </div>
                <div className="control-card">
                  <h3>{playerStats.currentWinStreak > 0 ? 'Current Win Streak' : playerStats.currentLossStreak > 0 ? 'Current Loss Streak' : 'Current Streak'}</h3>
                  <p style={{ fontSize: '2.5em', fontWeight: 'bold', margin: '5px 0', color: playerStats.currentWinStreak > 0 ? '#4caf50' : playerStats.currentLossStreak > 0 ? '#f44336' : '#888' }}>
                    {playerStats.currentWinStreak > 0 ? playerStats.currentWinStreak : playerStats.currentLossStreak}
                  </p>
                  <p className="switch-label">
                    {playerStats.currentWinStreak > 0 ? 'Consecutive wins' : playerStats.currentLossStreak > 0 ? 'Consecutive losses' : 'No active streak'}
                  </p>
                </div>
                <div className="control-card">
                  <h3>Longest Win Streak</h3>
                  <p style={{ fontSize: '2.5em', fontWeight: 'bold', margin: '5px 0', color: '#ffcc00' }}>{playerStats.longestWinStreak || 0}</p>
                  <p className="switch-label">Your all-time best</p>
                </div>
                <div className="control-card">
                  <h3>Longest Loss Streak</h3>
                  <p style={{ fontSize: '2.5em', fontWeight: 'bold', margin: '5px 0', color: '#f44336' }}>{playerStats.longestLossStreak || 0}</p>
                  <p className="switch-label">Your all-time low</p>
                </div>
                <div className="control-card">
                  <h3>Favorite Conference</h3>
                  <p style={{ fontSize: '1.5em', fontWeight: 'bold', margin: '10px 0' }}>{playerStats.favConf?.conference || 'None'}</p>
                  <p className="switch-label">{playerStats.favConf?.count || 0} picks made</p>
                </div>
                <div className="control-card">
                  <h3>Best Conference</h3>
                  <p style={{ fontSize: '1.5em', fontWeight: 'bold', margin: '10px 0', color: '#4caf50' }}>{playerStats.bestConf?.conference || 'None'}</p>
                  <p className="switch-label">{playerStats.bestConf?.count || 0} wins here</p>
                </div>
                <div className="control-card">
                  <h3>Worst Conference</h3>
                  <p style={{ fontSize: '1.5em', fontWeight: 'bold', margin: '10px 0', color: '#ff9800' }}>{playerStats.worstConf?.conference || 'None'}</p>
                  <p className="switch-label">{playerStats.worstConf?.count || 0} losses here</p>
                </div>
                <div className="control-card">
                  <h3>Reliable Ally</h3>
                  <p style={{ fontSize: '1.1em', fontWeight: 'bold', margin: '10px 0', color: '#4caf50' }}>{playerStats.topWinSchool?.school || 'None'}</p>
                  <p className="switch-label">Most wins generated for you ({playerStats.topWinSchool?.count || 0})</p>
                </div>
                <div className="control-card">
                  <h3>Arch-Nemesis</h3>
                  <p style={{ fontSize: '1.1em', fontWeight: 'bold', margin: '10px 0', color: '#f44336' }}>{playerStats.topLossSchool?.school || 'None'}</p>
                  <p className="switch-label">Most losses caused for you ({playerStats.topLossSchool?.count || 0})</p>
                </div>
                <div className="control-card">
                  <h3>Most Bets For</h3>
                  <p style={{ fontSize: '1.1em', fontWeight: 'bold', margin: '10px 0' }}>{playerStats.mostBetsFor?.school || 'None'}</p>
                  <p className="switch-label">{playerStats.mostBetsFor?.count || 0} total picks</p>
                </div>
                <div className="control-card">
                  <h3>Most Bets Against</h3>
                  <p style={{ fontSize: '1.1em', fontWeight: 'bold', margin: '10px 0' }}>{playerStats.mostBetsAgainst?.school || 'None'}</p>
                  <p className="switch-label">{playerStats.mostBetsAgainst?.count || 0} total fades</p>
                </div>
              </div>
              <div style={{ marginTop: '40px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                <h3>Conference Deep-Dive</h3>
                <div className="controls" style={{ padding: 0, marginTop: '10px' }}>
                  <label>
                    Conference:
                    <select value={selectedConference} onChange={(e) => setSelectedConference(e.target.value)}>
                      <option value="">-- Select Conference --</option>
                      {conferenceList.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </label>
                  <label>
                    Time Range:
                    <select value={statsTimeRange} onChange={(e) => setStatsTimeRange(e.target.value)}>
                      <option value="All-Time">All-Time</option>
                      <option value="Season">Current Season</option>
                      <option value="Week">Current Week</option>
                    </select>
                  </label>
                </div>

                {conferenceStats && (
                  <>
                    <div className="manual-grid" style={{ marginTop: '20px' }}>
                      <div className="control-card">
                        <h3>Best Team</h3>
                        <p style={{ fontWeight: 'bold', color: '#4caf50' }}>{conferenceStats.bestTeam?.school || 'None'}</p>
                        <p className="switch-label">{conferenceStats.bestTeam?.wins || 0} wins for you</p>
                      </div>
                      <div className="control-card">
                        <h3>Worst Team</h3>
                        <p style={{ fontWeight: 'bold', color: '#f44336' }}>{conferenceStats.worstTeam?.school || 'None'}</p>
                        <p className="switch-label">{conferenceStats.worstTeam?.losses || 0} losses for you</p>
                      </div>
                      <div className="control-card">
                        <h3>Most Bets For</h3>
                        <p style={{ fontWeight: 'bold' }}>{conferenceStats.mostBetsFor?.school || 'None'}</p>
                        <p className="switch-label">{conferenceStats.mostBetsFor?.count || 0} picks</p>
                      </div>
                      <div className="control-card">
                        <h3>Most Bets Against</h3>
                        <p style={{ fontWeight: 'bold' }}>{conferenceStats.mostBetsAgainst?.school || 'None'}</p>
                        <p className="switch-label">{conferenceStats.mostBetsAgainst?.count || 0} fades</p>
                      </div>
                    </div>

                    <div className="panel" style={{ marginTop: '20px', background: 'rgba(0,0,0,0.2)' }}>
                      <h4>School Records in {selectedConference}</h4>
                      <table style={{ width: '100%', marginTop: '10px' }}>
                        <thead>
                          <tr>
                            <th style={{ textAlign: 'left' }}>School</th>
                            <th>Record</th>
                            <th>Win %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {conferenceStats.schoolRecords.map(r => (
                            <tr key={r.school}>
                              <td>{r.school}</td>
                              <td style={{ textAlign: 'center' }}>{r.wins} - {r.losses} - {r.pushes}</td>
                              <td style={{ textAlign: 'center' }}>{r.total > 0 ? ((r.wins / r.total) * 100).toFixed(1) : '0.0'}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>

              {playerStats.trend && playerStats.trend.length > 0 && (
                <div style={{ marginTop: '40px', padding: '20px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                  <h3>Weekly Performance Trend</h3>
                  <div style={{ position: 'relative', height: '180px', marginTop: '10px' }}>
                    <svg 
                      viewBox="0 0 100 100" 
                      preserveAspectRatio="none" 
                      style={{ position: 'absolute', top: '20px', left: '10px', width: 'calc(100% - 20px)', height: '120px', pointerEvents: 'none', zIndex: 10 }}
                    >
                      <polyline
                        fill="none"
                        stroke="#2196f3"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={playerStats.trend.map((w, i) => {
                          const total = w.wins + w.losses;
                          const pct = total > 0 ? (w.wins / total) : 0;
                          const x = ((i + 0.5) / playerStats.trend.length) * 100;
                          const y = 100 - (pct * 100);
                          return `${x},${y}`;
                        }).join(' ')}
                      />
                      {playerStats.trend.map((w, i) => {
                        const total = w.wins + w.losses;
                        const pct = total > 0 ? (w.wins / total) : 0;
                        const x = ((i + 0.5) / playerStats.trend.length) * 100;
                        const y = 100 - (pct * 100);
                        return <circle key={i} cx={x} cy={y} r="1.5" fill="#2196f3" />;
                      })}
                    </svg>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '100%', padding: '20px 10px' }}>
                      {playerStats.trend.map((w, i) => {
                        const max = Math.max(...playerStats.trend.map(x => x.wins + x.losses), 1);
                        return (
                          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '120px', width: '100%', justifyContent: 'center' }}>
                              <div style={{ width: '15px', height: `${(w.wins / max) * 100}%`, backgroundColor: '#4caf50', opacity: 0.8, borderRadius: '3px 3px 0 0' }} title={`${w.wins} Wins`}></div>
                              <div style={{ width: '15px', height: `${(w.losses / max) * 100}%`, backgroundColor: '#f44336', opacity: 0.8, borderRadius: '3px 3px 0 0' }} title={`${w.losses} Losses`}></div>
                            </div>
                            <span style={{ fontSize: '0.75em', color: '#888', textAlign: 'center' }}>W{w.week}<br/>{w.season.slice(2)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px', fontSize: '0.8em' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '10px', height: '10px', backgroundColor: '#4caf50' }}></div> Wins</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '10px', height: '10px', backgroundColor: '#f44336' }}></div> Losses</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '12px', height: '2px', backgroundColor: '#2196f3' }}></div> Win %</span>
                  </div>
                </div>
              )}

              
            </section>
          )}

          {isPicksPage && (
            <>
              <section className="layout-grid">
                <article className="panel">
                  <h2>Mandatory Games</h2>
                  {mandatoryGames.length === 0 && <p>No televised games found yet for this week.</p>}
                  {mandatoryGames.map((game) => (
                    <div key={game.id} className={`game-card ${isGameLocked(game) ? 'locked' : ''} ${isGameLive(game) ? 'live' : ''}`}>
                      <div className="game-header">
                        {/* <strong>{game.away_team}</strong> @ <strong>{game.home_team}</strong>
                        <span>{new Date(game.commence_time).toLocaleString()}</span>
                        {!isGameLocked(game) && <CountdownTimer commenceTime={game.commence_time} />} */}
                      </div>
                      <div className="game-switch">
                        <button
                          type="button"
                          className={`game-switch-option ${picks[game.id]?.selectionTeam === game.away_team ? 'active' : ''}`}
                          onClick={() => handlePickChange(game, game.away_team)}
                          disabled={isGameLocked(game)}
                        >
                          {game.away_team}
                          <span className="switch-option-label">{formatSpread(game, game.away_team)}</span>
                        </button>
                        <button
                          type="button"
                          className={`game-switch-option ${!picks[game.id] ? 'active' : ''}`}
                          onClick={() => handlePickChange(game, null)}
                          disabled={isGameLocked(game)}
                        >
                          Neither
                        </button>
                        <button
                          type="button"
                          className={`game-switch-option ${picks[game.id]?.selectionTeam === game.home_team ? 'active' : ''}`}
                          onClick={() => handlePickChange(game, game.home_team)}
                          disabled={isGameLocked(game)}
                        >
                          {game.home_team}
                          <span className="switch-option-label">{formatSpread(game, game.home_team)}</span>
                        </button>
                        <span
                          className="game-switch-slider"
                          style={{ transform: picks[game.id]?.selectionTeam === game.home_team ? 'translateX(200%)' : picks[game.id]?.selectionTeam === game.away_team ? 'translateX(0)' : 'translateX(100%)' }}
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
                      <div className="game-header">
                        {/* <strong>{game.away_team}</strong> @ <strong>{game.home_team}</strong> */}
                        {/* <span>{new Date(game.commence_time).toLocaleString()}</span> */}
                      </div>
                      <div className="game-switch">
                        <button
                          type="button"
                          className={`game-switch-option ${picks[game.id]?.selectionTeam === game.away_team ? 'active' : ''}`}
                          onClick={() => handlePickChange(game, game.away_team)}
                          disabled={isGameLocked(game)}
                        >
                          {game.away_team}
                          <span className="switch-option-label">{formatSpread(game, game.away_team)}</span>
                        </button>
                        <button
                          type="button"
                          className={`game-switch-option ${!picks[game.id] ? 'active' : ''}`}
                          onClick={() => handlePickChange(game, null)}
                          disabled={isGameLocked(game)}
                        >
                          Neither
                        </button>
                        <button
                          type="button"
                          className={`game-switch-option ${picks[game.id]?.selectionTeam === game.home_team ? 'active' : ''}`}
                          onClick={() => handlePickChange(game, game.home_team)}
                          disabled={isGameLocked(game)}
                        >
                          {game.home_team}
                          <span className="switch-option-label">{formatSpread(game, game.home_team)}</span>
                        </button>
                        <span
                          className="game-switch-slider"
                          style={{ transform: picks[game.id]?.selectionTeam === game.home_team ? 'translateX(200%)' : picks[game.id]?.selectionTeam === game.away_team ? 'translateX(0)' : 'translateX(100%)' }}
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

          {isAdminPage && (
            <>
              <section className="panel admin-panel">
                <h2>Admin: Update Game Lines</h2>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px' }}>
                  <button onClick={loadAdminData} disabled={loading || selectedWeek === null}>
                    Load Games
                  </button>
                  <button onClick={handleSyncScores} disabled={loading}>
                    Sync Scores & Odds
                  </button>
                  {lastSynced && (
                    <span style={{ fontSize: '0.9em', color: '#888', fontStyle: 'italic', marginLeft: '10px' }}>
                      Last Synced: {lastSynced.toLocaleString()}
                    </span>
                  )}
                </div>
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
