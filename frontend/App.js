import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App(){
  const [weeks, setWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [games, setGames] = useState([]);
  const [player, setPlayer] = useState('Aric');
  const [selectedPicks, setSelectedPicks] = useState({}); // gameId -> chosenSide

  useEffect(()=> {
    axios.get('/api/weeks').then(r => setWeeks(r.data));
  },[]);

  async function loadWeek(weekId){
    const r = await axios.get(`/api/week/${weekId}`);
    setSelectedWeek(weekId);
    setGames(r.data.games);
    // reset picks
    setSelectedPicks({});
  }

  function togglePick(game, side, isTelevised){
    // If televised, ensure we don't exceed 5 picks
    const newPicks = {...selectedPicks};
    if (newPicks[game.GameId] === side) delete newPicks[game.GameId];
    else newPicks[game.GameId] = { side, isTelevised, chosenTeam: side === 'home' ? game.HomeTeam : game.AwayTeam, chosenSpread: side === 'home' ? game.SpreadHome : -Number(game.SpreadHome || 0) };
    setSelectedPicks(newPicks);
  }

  async function submitPicks(){
    const picksArray = Object.entries(selectedPicks).map(([gameId, v]) => ({ gameId, chosenTeam: v.chosenTeam, chosenSide: v.side, chosenSpread: v.chosenSpread, isTelevised: v.isTelevised }));
    await axios.post(`/api/week/${selectedWeek}/picks`, { player, picks: picksArray });
    alert('Picks submitted');
  }

  const televisedSelectedCount = Object.values(selectedPicks).filter(p => p.isTelevised).length;

  return (
    <div style={{padding:20}}>
      <h2>CFB Bets — Aric, Nick, Cisco</h2>
      <div>
        <label><b>Who are you?</b></label>
        <select value={player} onChange={e=>setPlayer(e.target.value)}>
          <option>Aric</option><option>Nick</option><option>Cisco</option>
        </select>
      </div>

      <div style={{marginTop:10}}>
        <label><b>Week</b></label>
        <select onChange={e=>loadWeek(e.target.value)}>
          <option value="">Select week</option>
          {weeks.map(w => <option key={w.WeekId} value={w.WeekId}>{w.WeekName}</option>)}
        </select>
      </div>

      {games.length > 0 && (
        <>
          <h3>Games</h3>
          <p><b>Televised picks selected:</b> {televisedSelectedCount} / 5</p>
          <table border="1" cellPadding="6">
            <thead><tr><th>Time</th><th>Home</th><th>Away</th><th>Spread (Home)</th><th>Televised</th><th>Your Pick</th></tr></thead>
            <tbody>
              {games.map(g => (
                <tr key={g.GameId}>
                  <td>{g.DateTimeUTC}</td>
                  <td>{g.HomeTeam}</td>
                  <td>{g.AwayTeam}</td>
                  <td>{g.SpreadHome}</td>
                  <td>{g.IsTelevised}</td>
                  <td>
                    <button onClick={()=>togglePick(g,'home', g.IsTelevised === 'TRUE') } style={{background: selectedPicks[g.GameId]?.side === 'home' ? '#8f8' : ''}}>Home</button>
                    <button onClick={()=>togglePick(g,'away', g.IsTelevised === 'TRUE') } style={{background: selectedPicks[g.GameId]?.side === 'away' ? '#8f8' : ''}}>Away</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{marginTop:10}}>
            <button onClick={submitPicks} disabled={televisedSelectedCount !== 5}>Submit Picks</button>
            {televisedSelectedCount !== 5 && <div style={{color:'red'}}>You must select exactly 5 televised games before submitting.</div>}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
