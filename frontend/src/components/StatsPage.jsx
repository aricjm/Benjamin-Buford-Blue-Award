import React, { useState, useEffect } from 'react';
import { Trophy, Flame, TrendingUp, TrendingDown, Users, BarChart2, ArrowLeftRight } from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────

const winPct = (w, l) => (w + l > 0 ? ((w / (w + l)) * 100).toFixed(1) + '%' : 'N/A');

const StatCard = ({ label, value, sub, color, icon }) => (
  <div className="control-card" style={{ position: 'relative' }}>
    {icon && <div style={{ position: 'absolute', top: 12, right: 12, opacity: 0.15 }}>{icon}</div>}
    <h3>{label}</h3>
    <p style={{ fontSize: '2em', fontWeight: 'bold', margin: '6px 0', color: color || '#fff' }}>{value}</p>
    {sub && <p className="switch-label">{sub}</p>}
  </div>
);

const SchoolCard = ({ label, school, color, sub }) => (
  <div className="control-card">
    <h3>{label}</h3>
    <p style={{ fontSize: '1.1em', fontWeight: 'bold', margin: '10px 0', color: color || '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
      {school?.logo && <img src={school.logo} alt="" style={{ height: '24px', width: '24px', objectFit: 'contain' }} />}
      {school?.school || school?.conference || 'None'}
    </p>
    <p className="switch-label">{sub}</p>
  </div>
);

// ─── Stat Leaders Section ────────────────────────────────────────────────────

const StatLeaders = ({ allPlayerStats }) => {
  if (!Array.isArray(allPlayerStats) || allPlayerStats.length === 0) return null;

  const withStats = allPlayerStats.filter(s => s.record);

  const leaders = [
    {
      label: 'Longest Active Spread Win Streak',
      icon: <Flame size={28} />,
      color: '#4caf50',
      entries: [...withStats]
        .filter(s => s.currentWinStreak > 0)
        .sort((a, b) => b.currentWinStreak - a.currentWinStreak)
        .map(s => ({ player: s.player, value: s.currentWinStreak, sub: 'consecutive wins' })),
    },
    {
      label: 'Longest Active Spread Loss Streak',
      icon: <TrendingDown size={28} />,
      color: '#f44336',
      entries: [...withStats]
        .filter(s => s.currentLossStreak > 0)
        .sort((a, b) => b.currentLossStreak - a.currentLossStreak)
        .map(s => ({ player: s.player, value: s.currentLossStreak, sub: 'consecutive losses' })),
    },
    {
      label: 'All-Time Spread Win Streak Record',
      icon: <Trophy size={28} />,
      color: '#ffcc00',
      entries: [...withStats]
        .sort((a, b) => b.longestWinStreak - a.longestWinStreak)
        .map(s => ({ player: s.player, value: s.longestWinStreak, sub: 'wins in a row' })),
    },
    {
      label: 'All-Time Spread Loss Streak Record',
      icon: <TrendingDown size={28} />,
      color: '#ff9800',
      entries: [...withStats]
        .sort((a, b) => b.longestLossStreak - a.longestLossStreak)
        .map(s => ({ player: s.player, value: s.longestLossStreak, sub: 'losses in a row' })),
    },
    {
      label: 'Longest Active O/U Win Streak',
      icon: <Flame size={28} />,
      color: '#4caf50',
      entries: [...withStats]
        .filter(s => s.currentTotalWinStreak > 0)
        .sort((a, b) => b.currentTotalWinStreak - a.currentTotalWinStreak)
        .map(s => ({ player: s.player, value: s.currentTotalWinStreak, sub: 'consecutive wins' })),
    },
    {
      label: 'Longest Active O/U Loss Streak',
      icon: <TrendingDown size={28} />,
      color: '#f44336',
      entries: [...withStats]
        .filter(s => s.currentTotalLossStreak > 0)
        .sort((a, b) => b.currentTotalLossStreak - a.currentTotalLossStreak)
        .map(s => ({ player: s.player, value: s.currentTotalLossStreak, sub: 'consecutive losses' })),
    },
    {
      label: 'All-Time O/U Win Streak Record',
      icon: <Trophy size={28} />,
      color: '#ffcc00',
      entries: [...withStats]
        .sort((a, b) => b.longestTotalWinStreak - a.longestTotalWinStreak)
        .map(s => ({ player: s.player, value: s.longestTotalWinStreak, sub: 'wins in a row' })),
    },
    {
      label: 'All-Time O/U Loss Streak Record',
      icon: <TrendingDown size={28} />,
      color: '#ff9800',
      entries: [...withStats]
        .sort((a, b) => b.longestTotalLossStreak - a.longestTotalLossStreak)
        .map(s => ({ player: s.player, value: s.longestTotalLossStreak, sub: 'losses in a row' })),
    },
    {
      label: 'Best Win %',
      icon: <TrendingUp size={28} />,
      color: '#4caf50',
      entries: [...withStats]
        .filter(s => s.record.wins + s.record.losses > 0)
        .sort((a, b) => (b.record.wins / (b.record.wins + b.record.losses)) - (a.record.wins / (a.record.wins + a.record.losses)))
        .map(s => ({ player: s.player, value: winPct(s.record.wins, s.record.losses), sub: `${s.record.wins}W - ${s.record.losses}L` })),
    },
    {
      label: 'Most All-Time Wins',
      icon: <BarChart2 size={28} />,
      color: '#2196f3',
      entries: [...withStats]
        .sort((a, b) => b.record.wins - a.record.wins)
        .map(s => ({ player: s.player, value: s.record.wins, sub: `${s.record.losses} losses` })),
    },
  ];

  return (
    <div style={{ marginBottom: '32px' }}>
      <div className="manual-grid">
        {leaders.map((leader) => (
          <div key={leader.label} className="control-card" style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: 12, right: 12, opacity: 0.12, color: leader.color }}>{leader.icon}</div>
            <h3 style={{ marginBottom: '10px' }}>{leader.label}</h3>
            {leader.entries.length === 0 ? (
              <p className="switch-label">No data</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {leader.entries.map((e, i) => (
                  <div key={e.player} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.75em', color: '#555', width: '16px', textAlign: 'right' }}>{i + 1}.</span>
                    <span style={{ fontWeight: i === 0 ? 'bold' : 'normal', color: i === 0 ? leader.color : '#ccc', flex: 1 }}>{e.player}</span>
                    <span style={{ fontWeight: 'bold', color: i === 0 ? leader.color : '#aaa' }}>{e.value}</span>
                    {i === 0 && <span style={{ fontSize: '0.7em', color: '#666' }}>{e.sub}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Single Player Stats Panel ───────────────────────────────────────────────

const PlayerStatsPanel = ({ playerName, playerStats, selectedConference, setSelectedConference, conferenceList, statsTimeRange, setStatsTimeRange, conferenceStats }) => {
  if (!playerStats || !playerStats.record) {
    return <div style={{ color: '#888', padding: '20px' }}>Loading stats for {playerName}...</div>;
  }

  return (
    <div>
      <div className="manual-grid" style={{ marginTop: '16px' }}>
        <StatCard label="Record" color="#fff"
          value={`${playerStats.record.wins}-${playerStats.record.losses}-${playerStats.record.pushes}`}
          sub={`Win %: ${winPct(playerStats.record.wins, playerStats.record.losses)}`}
          icon={<BarChart2 size={40} />}
        />
        <StatCard
          label={playerStats.currentWinStreak > 0 ? 'Active Spread Win Streak' : playerStats.currentLossStreak > 0 ? 'Active Spread Loss Streak' : 'Current Spread Streak'}
          value={playerStats.currentWinStreak > 0 ? playerStats.currentWinStreak : playerStats.currentLossStreak || 0}
          color={playerStats.currentWinStreak > 0 ? '#4caf50' : playerStats.currentLossStreak > 0 ? '#f44336' : '#888'}
          sub={playerStats.currentWinStreak > 0 ? 'Consecutive wins' : playerStats.currentLossStreak > 0 ? 'Consecutive losses' : 'No active streak'}
          icon={<Flame size={40} />}
        />
        <StatCard label="Longest Spread Win Streak" value={playerStats.longestWinStreak || 0} color="#ffcc00" sub="All-time best" icon={<Trophy size={40} />} />
        <StatCard label="Longest Spread Loss Streak" value={playerStats.longestLossStreak || 0} color="#f44336" sub="All-time low" icon={<TrendingDown size={40} />} />
        
        <StatCard
          label={playerStats.currentTotalWinStreak > 0 ? 'Active O/U Win Streak' : playerStats.currentTotalLossStreak > 0 ? 'Active O/U Loss Streak' : 'Current O/U Streak'}
          value={playerStats.currentTotalWinStreak > 0 ? playerStats.currentTotalWinStreak : playerStats.currentTotalLossStreak || 0}
          color={playerStats.currentTotalWinStreak > 0 ? '#4caf50' : playerStats.currentTotalLossStreak > 0 ? '#f44336' : '#888'}
          sub={playerStats.currentTotalWinStreak > 0 ? 'Consecutive wins' : playerStats.currentTotalLossStreak > 0 ? 'Consecutive losses' : 'No active streak'}
          icon={<Flame size={40} />}
        />
        <StatCard label="Longest O/U Win Streak" value={playerStats.longestTotalWinStreak || 0} color="#ffcc00" sub="All-time best" icon={<Trophy size={40} />} />
        <StatCard label="Longest O/U Loss Streak" value={playerStats.longestTotalLossStreak || 0} color="#f44336" sub="All-time low" icon={<TrendingDown size={40} />} />
        <StatCard label="Favorite Conference" value={playerStats.favConf?.conference || 'None'} sub={`${playerStats.favConf?.count || 0} picks made`} />
        <StatCard label="Best Conference" value={playerStats.bestConf?.conference || 'None'} color="#4caf50" sub={`${playerStats.bestConf?.count || 0} wins here`} />
        <StatCard label="Worst Conference" value={playerStats.worstConf?.conference || 'None'} color="#ff9800" sub={`${playerStats.worstConf?.count || 0} losses here`} />
        <SchoolCard label="Reliable Ally" school={playerStats.topWinSchool} color="#4caf50" sub={`Most wins generated (${playerStats.topWinSchool?.count || 0})`} />
        <SchoolCard label="Arch-Nemesis" school={playerStats.topLossSchool} color="#f44336" sub={`Most losses caused (${playerStats.topLossSchool?.count || 0})`} />
        <SchoolCard label="Most Bets For" school={playerStats.mostBetsFor} sub={`${playerStats.mostBetsFor?.count || 0} total picks`} />
        <SchoolCard label="Most Bets Against" school={playerStats.mostBetsAgainst} sub={`${playerStats.mostBetsAgainst?.count || 0} total fades`} />
        {playerStats.last10Form && (
          <div className="control-card">
            <h3>Last 10 Form</h3>
            <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap' }}>
              {playerStats.last10Form.split('').map((c, i) => (
                <span key={i} style={{
                  width: '24px', height: '24px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75em', fontWeight: 'bold',
                  backgroundColor: c === 'W' ? '#4caf50' : c === 'L' ? '#f44336' : '#888',
                  color: '#fff'
                }}>{c}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Conference Deep-Dive */}
      <div style={{ marginTop: '32px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
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

        {conferenceStats && !conferenceStats.error && conferenceStats.schoolRecords && (
          <>
            <div className="manual-grid" style={{ marginTop: '20px' }}>
              <SchoolCard label="Best Team" school={conferenceStats.bestTeam} color="#4caf50" sub={`${conferenceStats.bestTeam?.wins || 0} wins for you`} />
              <SchoolCard label="Worst Team" school={conferenceStats.worstTeam} color="#f44336" sub={`${conferenceStats.worstTeam?.losses || 0} losses for you`} />
              <SchoolCard label="Most Bets For" school={conferenceStats.mostBetsFor} sub={`${conferenceStats.mostBetsFor?.count || 0} picks`} />
              <SchoolCard label="Most Bets Against" school={conferenceStats.mostBetsAgainst} sub={`${conferenceStats.mostBetsAgainst?.count || 0} fades`} />
              <StatCard label="Strength of Schedule" value={Number(conferenceStats.strengthOfSchedule || 0).toFixed(1)} sub="Avg. absolute spread" />
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

      {/* Weekly Trend */}
      {playerStats.trend && playerStats.trend.length > 0 && (
        <div style={{ marginTop: '32px', padding: '20px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
          <h3>Weekly Performance Trend</h3>
          <div style={{ position: 'relative', height: '180px', marginTop: '10px' }}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none"
              style={{ position: 'absolute', top: '20px', left: '10px', width: 'calc(100% - 20px)', height: '120px', pointerEvents: 'none', zIndex: 10 }}>
              <polyline fill="none" stroke="#2196f3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
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
                      <div style={{ width: '15px', height: `${(w.wins / max) * 100}%`, backgroundColor: '#4caf50', opacity: 0.8, borderRadius: '3px 3px 0 0' }} title={`${w.wins} Wins`} />
                      <div style={{ width: '15px', height: `${(w.losses / max) * 100}%`, backgroundColor: '#f44336', opacity: 0.8, borderRadius: '3px 3px 0 0' }} title={`${w.losses} Losses`} />
                    </div>
                    <span style={{ fontSize: '0.75em', color: '#888', textAlign: 'center' }}>W{w.week}<br />{w.season.slice(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px', fontSize: '0.8em' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '10px', height: '10px', backgroundColor: '#4caf50' }} /> Wins</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '10px', height: '10px', backgroundColor: '#f44336' }} /> Losses</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '12px', height: '2px', backgroundColor: '#2196f3' }} /> Win %</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Compare Panel ───────────────────────────────────────────────────────────

const CompareRow = ({ label, a, b, higherIsBetter = true }) => {
  const aNum = parseFloat(a);
  const bNum = parseFloat(b);
  const aWins = !isNaN(aNum) && !isNaN(bNum) && (higherIsBetter ? aNum > bNum : aNum < bNum);
  const bWins = !isNaN(aNum) && !isNaN(bNum) && (higherIsBetter ? bNum > aNum : bNum < aNum);
  return (
    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <td style={{ textAlign: 'right', padding: '8px 12px', fontWeight: aWins ? 'bold' : 'normal', color: aWins ? '#4caf50' : '#ccc' }}>{a}</td>
      <td style={{ textAlign: 'center', padding: '8px 12px', color: '#555', fontSize: '0.85em' }}>{label}</td>
      <td style={{ textAlign: 'left', padding: '8px 12px', fontWeight: bWins ? 'bold' : 'normal', color: bWins ? '#4caf50' : '#ccc' }}>{b}</td>
    </tr>
  );
};

const ComparePanel = ({ players, allPlayerStats }) => {
  const [playerA, setPlayerA] = useState(players[0]?.name || '');
  const [playerB, setPlayerB] = useState(players[1]?.name || players[0]?.name || '');

  const statsA = Array.isArray(allPlayerStats) ? allPlayerStats.find(s => s.player === playerA) : undefined;
  const statsB = Array.isArray(allPlayerStats) ? allPlayerStats.find(s => s.player === playerB) : undefined;

  const selectStyle = {
    padding: '8px 12px', borderRadius: '6px',
    border: '1px solid rgba(255,255,255,0.15)',
    backgroundColor: '#1a1a2e', color: '#fff',
    fontSize: '1em', fontWeight: 'bold',
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
        <select value={playerA} onChange={e => setPlayerA(e.target.value)} style={{ ...selectStyle, color: '#4d7cff' }}>
          {players.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
        </select>
        <ArrowLeftRight size={20} color="#555" />
        <select value={playerB} onChange={e => setPlayerB(e.target.value)} style={{ ...selectStyle, color: '#fc6363' }}>
          {players.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
        </select>
      </div>

      {statsA && statsB ? (
        <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <th style={{ textAlign: 'right', padding: '12px', color: '#4d7cff', fontSize: '1.1em' }}>{playerA}</th>
                <th style={{ textAlign: 'center', padding: '12px', color: '#555', fontSize: '0.8em', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stat</th>
                <th style={{ textAlign: 'left', padding: '12px', color: '#fc6363', fontSize: '1.1em' }}>{playerB}</th>
              </tr>
            </thead>
            <tbody>
              <CompareRow label="Record" a={`${statsA.record?.wins || 0}-${statsA.record?.losses || 0}`} b={`${statsB.record?.wins || 0}-${statsB.record?.losses || 0}`} />
              <CompareRow label="Win %" a={winPct(statsA.record?.wins || 0, statsA.record?.losses || 0)} b={winPct(statsB.record?.wins || 0, statsB.record?.losses || 0)} />
              <CompareRow label="Total Picks" a={(statsA.record?.wins || 0) + (statsA.record?.losses || 0) + (statsA.record?.pushes || 0)} b={(statsB.record?.wins || 0) + (statsB.record?.losses || 0) + (statsB.record?.pushes || 0)} />
              <CompareRow label="Active Spread Win Streak" a={statsA.currentWinStreak || 0} b={statsB.currentWinStreak || 0} />
              <CompareRow label="Active Spread Loss Streak" a={statsA.currentLossStreak || 0} b={statsB.currentLossStreak || 0} higherIsBetter={false} />
              <CompareRow label="Best Spread Win Streak Ever" a={statsA.longestWinStreak || 0} b={statsB.longestWinStreak || 0} />
              <CompareRow label="Worst Spread Loss Streak Ever" a={statsA.longestLossStreak || 0} b={statsB.longestLossStreak || 0} higherIsBetter={false} />
              <CompareRow label="Active O/U Win Streak" a={statsA.currentTotalWinStreak || 0} b={statsB.currentTotalWinStreak || 0} />
              <CompareRow label="Active O/U Loss Streak" a={statsA.currentTotalLossStreak || 0} b={statsB.currentTotalLossStreak || 0} higherIsBetter={false} />
              <CompareRow label="Best O/U Win Streak Ever" a={statsA.longestTotalWinStreak || 0} b={statsB.longestTotalWinStreak || 0} />
              <CompareRow label="Worst O/U Loss Streak Ever" a={statsA.longestTotalLossStreak || 0} b={statsB.longestTotalLossStreak || 0} higherIsBetter={false} />
              <CompareRow label="Favorite Conference" a={statsA.favConf?.conference || '—'} b={statsB.favConf?.conference || '—'} />
              <CompareRow label="Best Conference" a={statsA.bestConf?.conference || '—'} b={statsB.bestConf?.conference || '—'} />
              <CompareRow label="Worst Conference" a={statsA.worstConf?.conference || '—'} b={statsB.worstConf?.conference || '—'} />
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ color: '#888', padding: '20px' }}>Loading comparison data...</div>
      )}
    </div>
  );
};

// ─── Main StatsPage ──────────────────────────────────────────────────────────

const StatsPage = ({
  players,
  selectedPlayer,
  setSelectedPlayer,
  playerStats,
  selectedConference,
  setSelectedConference,
  conferenceList,
  statsTimeRange,
  setStatsTimeRange,
  conferenceStats,
  allPlayerStats,
}) => {
  const [activeTab, setActiveTab] = useState('leaders');

  const tabStyle = (tab) => ({
    padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
    fontWeight: activeTab === tab ? 'bold' : 'normal',
    backgroundColor: activeTab === tab ? 'rgba(77,124,255,0.2)' : 'transparent',
    color: activeTab === tab ? '#4d7cff' : '#888',
    fontSize: '0.9em', transition: 'all 0.15s',
    display: 'flex', alignItems: 'center', gap: '6px',
  });

  return (
    <section className="panel stats-panel">
      <h2 style={{ marginBottom: '20px' }}>Stats</h2>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px', marginBottom: '24px' }}>
        <button style={tabStyle('leaders')} onClick={() => setActiveTab('leaders')}>
          <Trophy size={14} /> Stat Leaders
        </button>
        {players.map(p => (
          <button key={p.id} style={tabStyle(p.name)} onClick={() => { setActiveTab(p.name); setSelectedPlayer(p.name); }}>
            <Users size={14} /> {p.name}
          </button>
        ))}
        <button style={tabStyle('compare')} onClick={() => setActiveTab('compare')}>
          <ArrowLeftRight size={14} /> Compare
        </button>
      </div>

      {activeTab === 'leaders' && <StatLeaders allPlayerStats={allPlayerStats} />}

      {players.some(p => p.name === activeTab) && (
        <PlayerStatsPanel
          playerName={selectedPlayer}
          playerStats={playerStats}
          selectedConference={selectedConference}
          setSelectedConference={setSelectedConference}
          conferenceList={conferenceList}
          statsTimeRange={statsTimeRange}
          setStatsTimeRange={setStatsTimeRange}
          conferenceStats={conferenceStats}
        />
      )}

      {activeTab === 'compare' && (
        <ComparePanel players={players} allPlayerStats={allPlayerStats} />
      )}
    </section>
  );
};

export default StatsPage;