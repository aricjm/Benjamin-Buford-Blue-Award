import React, { useState, useEffect } from 'react';

const formatResultLabel = (result) => {
  if (result === 'win') return 'Win';
  if (result === 'loss') return 'Loss';
  if (result === 'push') return 'Push';
  return 'Pending';
};

const AdminPage = ({
  loading, // From App.jsx
  setLoading, // From App.jsx
  selectedWeek, // From App.jsx
  selectedSeason, // From App.jsx
  selectedPlayer, // From App.jsx (needed for loadWeek/loadStats after sync)
  setMessage, // From App.jsx
  setAlertMessage, // From App.jsx
  setShowAlertModal, // From App.jsx
  loadWeek, // From App.jsx (to refresh main games after sync)
  loadStats, // From App.jsx (to refresh player stats after sync)
}) => {
  const [adminGames, setAdminGames] = useState([]);
  const [adminPicks, setAdminPicks] = useState([]);
  const [editingGameId, setEditingGameId] = useState(null);
  const [editingGameData, setEditingGameData] = useState({});
  const [editingPickId, setEditingPickId] = useState(null);
  const [editingPickData, setEditingPickData] = useState({});
  const [lastSynced, setLastSynced] = useState(() => {
    const saved = localStorage.getItem('lastSyncTime');
    return saved ? new Date(saved) : null;
  });

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

  useEffect(() => {
    loadAdminData();
  }, [selectedWeek, selectedSeason]); // Reload admin data when week/season changes

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
        if (selectedWeek !== null && selectedSeason) {
          await loadWeek(selectedWeek, selectedSeason, selectedPlayer); // Refresh main games
          await loadAdminData(); // Refresh admin data
          loadStats(selectedPlayer); // Refresh player stats
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
  );
};

export default AdminPage;