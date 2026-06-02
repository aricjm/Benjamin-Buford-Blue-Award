import React from 'react';

export default function GamesTable({ games, selectedPicks, togglePick }) {
  return (
    <table>
      <thead>
        <tr><th>Time</th><th>Home</th><th>Away</th><th>Spread (Home)</th><th>Televised</th><th>Your Pick</th></tr>
      </thead>
      <tbody>
        {games.map(g => {
          const sel = selectedPicks[g.GameId];
          const isTele = String(g.IsTelevised).toLowerCase() === 'true' || g.IsTelevised === 'TRUE';
          return (
            <tr key={g.GameId}>
              <td>{g.DateTimeUTC}</td>
              <td>{g.HomeTeam}</td>
              <td>{g.AwayTeam}</td>
              <td>{g.SpreadHome}</td>
              <td>{isTele ? 'Yes' : 'No'}</td>
              <td>
                <button className={sel?.side === 'home' ? 'selected' : ''} onClick={() => togglePick(g, 'home', isTele)}>Home</button>
                <button className={sel?.side === 'away' ? 'selected' : ''} onClick={() => togglePick(g, 'away', isTele)}>Away</button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
