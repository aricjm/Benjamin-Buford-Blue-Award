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
  teams = [], // From App.jsx
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
  const [mappings, setMappings] = useState([]);
  const [mappingInput, setMappingInput] = useState({ api_name: '', team_id: '' });

  const loadMappings = async () => {
    try {
      const res = await fetch('/api/mappings');
      const data = await res.json();
      setMappings(data || []);
    } catch (err) {
      setMessage('Failed to load team mappings.');
    }
  };

  const handleCreateMapping = async () => {
    if (!mappingInput.api_name || !mappingInput.team_id) {
      setAlertMessage('Both API Team Name and School Selection are required.');
      setShowAlertModal(true);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_name: mappingInput.api_name, team_id: Number(mappingInput.team_id) })
      });
      if (res.ok) {
        setMappingInput({ api_name: '', team_id: '' });
        setMessage('Team mapping created.');
        loadMappings();
      } else {
        const d = await res.json();
        setMessage(d.error || 'Failed to create mapping.');
      }
    } catch (e) {
      setMessage('Error creating mapping.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMapping = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/mapping/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage('Mapping deleted.');
        loadMappings();
      }
    } catch (e) {
      setMessage('Error deleting mapping.');
    } finally {
      setLoading(false);
    }
  };

  const loadAdminData = async () => {
    if (selectedWeek === null || !selectedSeason) return;
    setLoading(true);
    try {
      const [gamesRes, picksRes, mappingsRes] = await Promise.all([
        fetch(`/api/week/${selectedWeek}/games?season=${selectedSeason}`),
        fetch(`/api/week/${selectedWeek}/picks?season=${selectedSeason}`),
        fetch('/api/mappings')
      ]);
      const gamesData = await gamesRes.json();
      const picksData = await picksRes.json();
      const mappingsData = await mappingsRes.json();
      setAdminGames(gamesData.games || []);
      setAdminPicks(picksData || []);
      setMappings(mappingsData || []);
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
                      game.spread_away === null ? 'N/A' : (
                        game.spread_away === 0 ? 'PK' : (
                          game.spread_away > 0 ? `+${game.spread_away}` : game.spread_away
                        )
                      )
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
                      game.spread_home === null ? 'N/A' : (
                        game.spread_home === 0 ? 'PK' : (
                          game.spread_home > 0 ? `+${game.spread_home}` : game.spread_home
                        )
                      )
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
                  <td>
                    {editingPickId === pick.id ? (
                      editingPickData.spread === 0 ? 'PK' : (
                        editingPickData.spread > 0 ? `+${editingPickData.spread}` : editingPickData.spread
                      )
                    ) : (
                      pick.spread === 0 ? 'PK' : (
                        pick.spread > 0 ? `+${pick.spread}` : pick.spread
                      )
                    )}
                  </td>
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

      <section className="panel admin-panel">
        <h2>Admin: Manage Team Mappings</h2>
        <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '15px' }}>
          Mapping an "API Team Name" (e.g. "USF Bulls") to a "Database School" (e.g. "South Florida") fixes broken logos and duplicate entries.
        </p>
        <div className="manual-grid" style={{ marginBottom: '20px' }}>
          <label>
            API Team Name
            <input 
              type="text" 
              placeholder="e.g. UMass Minutemen" 
              value={mappingInput.api_name}
              onChange={e => setMappingInput({...mappingInput, api_name: e.target.value})}
            />
          </label>
          <label>
            Maps to School
            <select 
              value={mappingInput.team_id}
              onChange={e => setMappingInput({...mappingInput, team_id: e.target.value})}
            >
              <option value="">-- Select Team --</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.school}</option>
              ))}
            </select>
          </label>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button 
              onClick={handleCreateMapping} 
              disabled={loading}
              style={{ margin: 0, width: '100%' }}
            >
              Add Mapping
            </button>
          </div>
        </div>

        {mappings.length > 0 && (
          <table className="admin-table">
            <thead>
              <tr>
                <th>API Name</th>
                <th>Database School</th>
                <th style={{ width: '100px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mappings.map(m => (
                <tr key={m.id}>
                  <td>{m.api_name}</td>
                  <td>{m.school}</td>
                  <td>
                    <button className="admin-action-btn secondary" onClick={() => handleDeleteMapping(m.id)} disabled={loading}>Delete</button>
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