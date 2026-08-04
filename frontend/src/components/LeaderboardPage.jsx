import React from 'react';

const winPct = (w, t) => { const wins = Number(w); const total = Number(t); return total > 0 ? ((wins / total) * 100).toFixed(2) + '%' : 'N/A'; };

const LeaderboardPage = ({ 
  summary, 
  seasonSummary, 
  allTimeSummary, 
  selectedWeek, 
  selectedSeason 
}) => {
  return (
    <>
      <section className="panel summary-panel">
        <h2>Week {selectedWeek} Leaderboard</h2>
        {summary.length === 0 ? (
          <p>No picks yet for this week.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
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
                    <td>{winPct(row.wins, row.total)}</td>
                    <td>{row.losses}</td>
                    <td>{row.pushes}</td>
                    <td>{row.pending}</td>
                    <td>{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel summary-panel">
        <h2>{selectedSeason} Season Leaderboard</h2>
        {seasonSummary.length === 0 ? (
          <p>No picks for this season yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
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
                    <td>{winPct(row.wins, row.total)}</td>
                    <td>{row.losses}</td>
                    <td>{row.pushes}</td>
                    <td>{row.pending}</td>
                    <td>{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel summary-panel">
        <h2>All-Time Leaderboard</h2>
        {allTimeSummary.length === 0 ? (
          <p>No picks recorded yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
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
                    <td>{winPct(row.wins, row.total)}</td>
                    <td>{row.losses}</td>
                    <td>{row.pushes}</td>
                    <td>{row.pending}</td>
                    <td>{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
};

export default LeaderboardPage;