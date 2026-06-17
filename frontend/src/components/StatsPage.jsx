import React from 'react';

const StatsPage = ({ 
  selectedPlayer, 
  playerStats, 
  selectedConference, 
  setSelectedConference, 
  conferenceList, 
  statsTimeRange, 
  setStatsTimeRange, 
  conferenceStats 
}) => {
  if (!playerStats) return null;

  return (
    <section className="panel stats-panel">
      <h2>{selectedPlayer}'s All-Time Stats</h2>
      <div className="manual-grid" style={{ marginTop: '20px' }}>
        <div className="control-card">
          <h3>Record</h3>
          <p style={{ fontSize: '1.5em', fontWeight: 'bold', margin: '10px 0' }}>
            {playerStats.record.wins || 0} - {playerStats.record.losses || 0} - {playerStats.record.pushes || 0}
          </p>
          {playerStats.last10Form && (
            <p style={{ fontSize: '0.85em', color: '#aaa', margin: '5px 0' }}>Form: {playerStats.last10Form}</p>
          )}
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
          <p style={{ fontSize: '1.1em', fontWeight: 'bold', margin: '10px 0', color: '#4caf50', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {playerStats.topWinSchool?.logo && <img src={playerStats.topWinSchool.logo} alt="" style={{ height: '24px', width: '24px', objectFit: 'contain' }} />}
            {playerStats.topWinSchool?.school || 'None'}
          </p>
          <p className="switch-label">Most wins generated for you ({playerStats.topWinSchool?.count || 0})</p>
        </div>
        <div className="control-card">
          <h3>Arch-Nemesis</h3>
          <p style={{ fontSize: '1.1em', fontWeight: 'bold', margin: '10px 0', color: '#f44336', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {playerStats.topLossSchool?.logo && <img src={playerStats.topLossSchool.logo} alt="" style={{ height: '24px', width: '24px', objectFit: 'contain' }} />}
            {playerStats.topLossSchool?.school || 'None'}
          </p>
          <p className="switch-label">Most losses caused for you ({playerStats.topLossSchool?.count || 0})</p>
        </div>
        <div className="control-card">
          <h3>Most Bets For</h3>
          <p style={{ fontSize: '1.1em', fontWeight: 'bold', margin: '10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {playerStats.mostBetsFor?.logo && <img src={playerStats.mostBetsFor.logo} alt="" style={{ height: '24px', width: '24px', objectFit: 'contain' }} />}
            {playerStats.mostBetsFor?.school || 'None'}
          </p>
          <p className="switch-label">{playerStats.mostBetsFor?.count || 0} total picks</p>
        </div>
        <div className="control-card">
          <h3>Most Bets Against</h3>
          <p style={{ fontSize: '1.1em', fontWeight: 'bold', margin: '10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {playerStats.mostBetsAgainst?.logo && <img src={playerStats.mostBetsAgainst.logo} alt="" style={{ height: '24px', width: '24px', objectFit: 'contain' }} />}
            {playerStats.mostBetsAgainst?.school || 'None'}
          </p>
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
                <p style={{ fontWeight: 'bold', color: '#4caf50', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {conferenceStats.bestTeam?.logo && <img src={conferenceStats.bestTeam.logo} alt="" style={{ height: '24px', width: '24px', objectFit: 'contain' }} />}
                  {conferenceStats.bestTeam?.school || 'None'}
                </p>
                <p className="switch-label">{conferenceStats.bestTeam?.wins || 0} wins for you</p>
              </div>
              <div className="control-card">
                <h3>Worst Team</h3>
                <p style={{ fontWeight: 'bold', color: '#f44336', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {conferenceStats.worstTeam?.logo && <img src={conferenceStats.worstTeam.logo} alt="" style={{ height: '24px', width: '24px', objectFit: 'contain' }} />}
                  {conferenceStats.worstTeam?.school || 'None'}
                </p>
                <p className="switch-label">{conferenceStats.worstTeam?.losses || 0} losses for you</p>
              </div>
              <div className="control-card">
                <h3>Most Bets For</h3>
                <p style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {conferenceStats.mostBetsFor?.logo && <img src={conferenceStats.mostBetsFor.logo} alt="" style={{ height: '24px', width: '24px', objectFit: 'contain' }} />}
                  {conferenceStats.mostBetsFor?.school || 'None'}
                </p>
                <p className="switch-label">{conferenceStats.mostBetsFor?.count || 0} picks</p>
              </div>
              <div className="control-card">
                <h3>Most Bets Against</h3>
                <p style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {conferenceStats.mostBetsAgainst?.logo && <img src={conferenceStats.mostBetsAgainst.logo} alt="" style={{ height: '24px', width: '24px', objectFit: 'contain' }} />}
                  {conferenceStats.mostBetsAgainst?.school || 'None'}
                </p>
                <p className="switch-label">{conferenceStats.mostBetsAgainst?.count || 0} fades</p>
              </div>
              <div className="control-card">
                <h3>Strength of Schedule</h3>
                <p style={{ fontSize: '1.5em', fontWeight: 'bold', margin: '10px 0' }}>{conferenceStats.strengthOfSchedule.toFixed(1)}</p>
                <p className="switch-label">Avg. absolute spread</p>
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
                      <td style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {r.logo && <img src={r.logo} alt="" style={{ height: '20px', width: '20px', objectFit: 'contain' }} />}
                        {r.school}
                      </td>
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
  );
};

export default StatsPage;