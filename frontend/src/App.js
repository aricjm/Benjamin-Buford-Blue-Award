import React, { useEffect, useState } from 'react';
import API from './api';
import WeekPicker from './components/WeekPicker';
import GamesTable from './components/GamesTable';
import AdminPanel from './components/AdminPanel';

function App(){
  const [weeks, setWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState('');
  const [games, setGames] = useState([]);
  const [picks, setPicks] = useState([]);
  const [player, setPlayer] = useState('Aric');
  const [selectedPicks, setSelectedPicks] = useState({});

  useEffect(()=> {
    API.get('/api/weeks').then(r => setWeeks(r.data)).catch(()=>setWeeks([]));
  },[]);

  async function loadWeek(weekId){
    if (!weekId) return;
    setSelectedWeek(weekId);
    const r = await API.get(`/api/week/${weekId}`);
    setGames(r.data.games || []);
    setPicks(r.data.picks || []);
    setSelectedPicks({});
  }

  function togglePick(game, side, isTelevised){
    const newPicks = {...selectedPicks};
    if (newPicks[game.GameId] && newPicks[game.GameId].side === side) {
      delete newPicks[game.GameId];
    } else {
      newPicks[game.GameId] = {
        side,
        isTelevised,
        chosenTeam: side === 'home' ? game.HomeTeam : game.AwayTeam,
        chosenSpread: side === 'home' ? Number(game.SpreadHome || 0) : -Number(game.SpreadHome || 0)
      };
    }
    setSelectedPicks(newPicks);
  }

  async function submitPicks(){
    const picksArray = Object.entries(selectedPicks).map(([gameId, v]) => ({
      gameId,
      chosenTeam: v.chosenTeam,
      chosenSide: v.side,
      chosenSpread: v.chosenSpread,
      isTelevised: v.isTelevised
    }));
    try {
      await API.post(`/api/week/${selectedWeek}/picks`, { player, picks: picksArray });
      alert('Picks submitted');
      // reload picks
      const r = await API.get(`/api/week/${selectedWeek}`);
      setPicks(r.data.picks || []);
      setSelectedPicks({});
    } catch (err) {
      alert(err.response?.data?.error || 'submit failed');
    }
  }

  const televisedSelectedCount = Object.values(selectedPicks).filter(p => p.isTelevised).length;

  return (
    <div>
      <div className="header">
        <h2>BBBAward Picks</h2>
        <div>
          <label><b>Who are you?</b></label>
          <select value={player} onChange={e=>setPlayer(e.target.value)}>
            <option>Aric</option><option>Nick</option><option>Cisco</option>
          </select>
        </div>
      </div>

      <WeekPicker weeks={weeks} onSelect={loadWeek} />

      {games.length > 0 && (
        <>
          <h3>Games</h3>
          <p><b>Televised picks selected:</b> {televisedSelectedCount} / 5</p>
          <GamesTable games={games} selectedPicks={selectedPicks} togglePick={togglePick} />
          <div style={{marginTop:10}}>
            <button onClick={submitPicks} disabled={televisedSelectedCount !== 5}>Submit Picks</button>
            {televisedSelectedCount !== 5 && <div style={{color:'red'}}>You must select exactly 5 televised games before submitting.</div>}
          </div>

          <h3 style={{marginTop:20}}>Existing picks for this week</h3>
          <table>
            <thead><tr><th>Player</th><th>Game</th><th>Pick</th><th>Result</th></tr></thead>
            <tbody>
              {picks.map(p => (
                <tr key={p.PickId}>
                  <td>{p.Player}</td>
                  <td>{p.GameId}</td>
                  <td>{p.ChosenTeam} ({p.ChosenSide})</td>
                  <td>{p.Result}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <AdminPanel games={games} onRefresh={() => loadWeek(selectedWeek)} />
        </>
      )}
    </div>
  );
}

export default App;
