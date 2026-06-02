import React, { useState } from 'react';
import API from '../api';

export default function AdminPanel({ games, onRefresh }) {
  const [gameId, setGameId] = useState('');
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [status, setStatus] = useState('final');
  const [message, setMessage] = useState('');

  async function submitOverride() {
    try {
      const payload = { gameId, homeScore: Number(homeScore), awayScore: Number(awayScore), status };
      const r = await API.post('/api/admin/game/override', payload);
      setMessage('Override saved');
      setTimeout(()=>setMessage(''), 3000);
      onRefresh && onRefresh();
    } catch (err) {
      setMessage('Error saving override');
    }
  }

  return (
    <div className="admin">
      <h4>Admin: Override game score / mark final</h4>
      <div>
        <label>Game</label>
        <select value={gameId} onChange={e=>setGameId(e.target.value)}>
          <option value="">Select game</option>
          {games.map(g => <option key={g.GameId} value={g.GameId}>{g.DateTimeUTC} — {g.HomeTeam} vs {g.AwayTeam}</option>)}
        </select>
      </div>
      <div>
        <label>Home Score</label>
        <input value={homeScore} onChange={e=>setHomeScore(e.target.value)} type="number" />
      </div>
      <div>
        <label>Away Score</label>
        <input value={awayScore} onChange={e=>setAwayScore(e.target.value)} type="number" />
      </div>
      <div>
        <label>Status</label>
        <select value={status} onChange={e=>setStatus(e.target.value)}>
          <option value="final">final</option>
          <option value="live">live</option>
          <option value="scheduled">scheduled</option>
        </select>
      </div>
      <div style={{marginTop:8}}>
        <button onClick={submitOverride} disabled={!gameId}>Save override</button>
        <span className="small" style={{marginLeft:12}}>{message}</span>
      </div>
    </div>
  );
}
