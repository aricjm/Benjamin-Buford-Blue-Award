import React, { useState, useEffect } from 'react';
import { Trophy, Flame, TrendingUp, TrendingDown, Users, BarChart2, ArrowLeftRight, Hash, Star, Crown } from 'lucide-react';
import useIsMobile from '../hooks/useIsMobile';

// ─── Helpers ────────────────────────────────────────────────────────────────

const winPct = (w, l) => { const wins = Number(w); const losses = Number(l); return wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(2) + '%' : 'N/A'; };

const StatCard = ({ label, value, sub, color, icon, onClick, active }) => (
  <div className="control-card" style={{
    position: 'relative',
    cursor: onClick ? 'pointer' : 'default',
    border: active ? '2px solid #2196f3' : '1px solid rgba(255,255,255,0.1)',
    backgroundColor: active ? 'rgba(33, 150, 243, 0.1)' : 'rgba(255,255,255,0.03)',
    transform: active ? 'scale(1.02)' : 'none',
    transition: 'all 0.2s ease'
  }} onClick={onClick}>
    {icon && <div style={{ position: 'absolute', top: 12, right: 12, opacity: 0.15 }}>{icon}</div>}
    <h3>{label}</h3>
    <p style={{ fontSize: '2em', fontWeight: 'bold', margin: '6px 0', color: color || '#fff' }}>{value}</p>
    {sub && <p className="switch-label">{sub}</p>}
  </div>
);

const SchoolCard = ({ label, school, color, sub, onClick, active }) => (
  <div className="control-card" style={{
    cursor: onClick ? 'pointer' : 'default',
    border: active ? '2px solid #2196f3' : '1px solid rgba(255,255,255,0.1)',
    backgroundColor: active ? 'rgba(33, 150, 243, 0.1)' : 'rgba(255,255,255,0.03)',
    transform: active ? 'scale(1.02)' : 'none',
    transition: 'all 0.2s ease'
  }} onClick={onClick}>
    <h3>{label}</h3>
    <p style={{ fontSize: '1.1em', fontWeight: 'bold', margin: '10px 0', color: color || '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
      {school?.logo && <img src={school.logo} alt="" style={{ height: '24px', width: '24px', objectFit: 'contain' }} />}
      {school?.school || school?.conference || 'None'}
    </p>
    <p className="switch-label">{sub}</p>
  </div>
);

// ─── Ally / Nemesis Card with conference filter ───────────────────────────────

const AllyNemesisCards = ({ playerName, defaultAlly, defaultNemesis, conferenceList, onSelectStat, activeStat, conf, setConf }) => {
  const [ally, setAlly] = useState(defaultAlly);
  const [nemesis, setNemesis] = useState(defaultNemesis);
  const [loading, setLoading] = useState(false);
  const isMobile = useIsMobile();

  // Reset to defaults when player changes
  useEffect(() => { setAlly(defaultAlly); setNemesis(defaultNemesis); }, [playerName, defaultAlly, defaultNemesis]);

  useEffect(() => {
    if (!playerName) return;
    setLoading(true);
    const url = conf
      ? `/api/stats/${playerName}/ally-nemesis?conference=${encodeURIComponent(conf)}`
      : `/api/stats/${playerName}/ally-nemesis`;
    fetch(url)
      .then(r => r.json())
      .then(data => { setAlly(data.ally); setNemesis(data.nemesis); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [playerName, conf]);

  const isFiltered = !!conf;

  return (
    <div className="control-card" style={{ gridColumn: 'span 2' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
        <h3 style={{ margin: 0 }}>Reliable Ally &amp; Arch-Nemesis</h3>
        <select
          value={conf}
          onChange={e => setConf(e.target.value)}
          style={{ fontSize: '0.85em', padding: '4px 8px', background: '#1e1e2e', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px' }}
        >
          <option value="">All Conferences</option>
          {conferenceList.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px', opacity: loading ? 0.5 : 1 }}>
        {/* Reliable Ally */}
        <div 
          style={{ 
            background: activeStat === 'Reliable Ally' ? 'rgba(76,175,80,0.18)' : 'rgba(76,175,80,0.08)', 
            borderRadius: '8px', 
            padding: '12px', 
            border: activeStat === 'Reliable Ally' ? '2px solid #2196f3' : '1px solid rgba(76,175,80,0.2)',
            cursor: 'pointer',
            transform: activeStat === 'Reliable Ally' ? 'scale(1.02)' : 'none',
            transition: 'all 0.2s ease'
          }}
          onClick={() => onSelectStat('Reliable Ally')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Star size={14} color="#4caf50" fill="#4caf50" />
            <span style={{ fontSize: '0.8em', color: '#4caf50', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Reliable Ally{isFiltered ? '' : ' — All-Time Best'}
            </span>
          </div>
          {ally ? (
            <>
              <p style={{ fontSize: '1.1em', fontWeight: 'bold', margin: '0 0 4px', color: '#4caf50', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {ally.logo && <img src={ally.logo} alt="" style={{ height: '28px', width: '28px', objectFit: 'contain' }} />}
                {ally.school}
              </p>
              <p className="switch-label" style={{ margin: 0 }}>{ally.count} wins generated{ally.conference ? ` · ${ally.conference}` : ''}</p>
            </>
          ) : <p className="switch-label">No data{isFiltered ? ' for this conference' : ''}</p>}
        </div>
        {/* Arch-Nemesis */}
        <div 
          style={{ 
            background: activeStat === 'Arch-Nemesis' ? 'rgba(244,67,54,0.18)' : 'rgba(244,67,54,0.08)', 
            borderRadius: '8px', 
            padding: '12px', 
            border: activeStat === 'Arch-Nemesis' ? '2px solid #2196f3' : '1px solid rgba(244,67,54,0.2)',
            cursor: 'pointer',
            transform: activeStat === 'Arch-Nemesis' ? 'scale(1.02)' : 'none',
            transition: 'all 0.2s ease'
          }}
          onClick={() => onSelectStat('Arch-Nemesis')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <TrendingDown size={14} color="#f44336" />
            <span style={{ fontSize: '0.8em', color: '#f44336', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Arch-Nemesis{isFiltered ? '' : ' — All-Time Worst'}
            </span>
          </div>
          {nemesis ? (
            <>
              <p style={{ fontSize: '1.1em', fontWeight: 'bold', margin: '0 0 4px', color: '#f44336', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {nemesis.logo && <img src={nemesis.logo} alt="" style={{ height: '28px', width: '28px', objectFit: 'contain' }} />}
                {nemesis.school}
              </p>
              <p className="switch-label" style={{ margin: 0 }}>{nemesis.count} losses caused{nemesis.conference ? ` · ${nemesis.conference}` : ''}</p>
            </>
          ) : <p className="switch-label">No data{isFiltered ? ' for this conference' : ''}</p>}
        </div>
      </div>
    </div>
  );
};

// ─── Stat Leaders Section ────────────────────────────────────────────────────

const StatLeaders = ({ allPlayerStats, timeRange }) => {
  const [selectedLeader, setSelectedLeader] = useState(null);
  const isMobile = useIsMobile();

  if (!Array.isArray(allPlayerStats) || allPlayerStats.length === 0) return null;

  const withStats = allPlayerStats.filter(s => s.record);

  const getPrefix = (range) => {
    if (!range || range === 'All-Time') return 'All-Time';
    if (range === 'Season') return 'Current Season';
    if (range === 'Last Season') return 'Last Season';
    if (/^\d{4}$/.test(range)) return `${range} Season`;
    if (range === 'Week') return 'Current Week';
    return range; // 'Last 5 Weeks', 'Last 10 Weeks', 'Last 30 Days'
  };

  const prefix = getPrefix(timeRange);

  const showActiveStats = !timeRange || [
    'All-Time',
    'Season',
    'Week',
    'Last 5 Weeks',
    'Last 10 Weeks',
    'Last 30 Days'
  ].includes(timeRange);

  const leaders = [
    {
      label: 'Longest Active Spread Win Streak',
      icon: <Flame size={28} />,
      color: '#4caf50',
      entries: [...withStats]
        .filter(s => s.currentWinStreak > 0)
        .sort((a, b) => b.currentWinStreak - a.currentWinStreak)
        .map(s => ({ player: s.player, value: s.currentWinStreak, sub: 'consecutive wins' })),
      isActiveStat: true,
    },
    {
      label: 'Longest Active Spread Loss Streak',
      icon: <TrendingDown size={28} />,
      color: '#f44336',
      entries: [...withStats]
        .filter(s => s.currentLossStreak > 0)
        .sort((a, b) => b.currentLossStreak - a.currentLossStreak)
        .map(s => ({ player: s.player, value: s.currentLossStreak, sub: 'consecutive losses' })),
      isActiveStat: true,
    },
    {
      label: `${prefix} Spread Win Streak Record`,
      icon: <Trophy size={28} />,
      color: '#ffcc00',
      entries: [...withStats]
        .sort((a, b) => b.longestWinStreak - a.longestWinStreak)
        .map(s => ({ player: s.player, value: s.longestWinStreak, sub: 'wins in a row' })),
    },
    {
      label: `${prefix} Spread Loss Streak Record`,
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
      isActiveStat: true,
    },
    {
      label: 'Longest Active O/U Loss Streak',
      icon: <TrendingDown size={28} />,
      color: '#f44336',
      entries: [...withStats]
        .filter(s => s.currentTotalLossStreak > 0)
        .sort((a, b) => b.currentTotalLossStreak - a.currentTotalLossStreak)
        .map(s => ({ player: s.player, value: s.currentTotalLossStreak, sub: 'consecutive losses' })),
      isActiveStat: true,
    },
    {
      label: `${prefix} O/U Win Streak Record`,
      icon: <Trophy size={28} />,
      color: '#ffcc00',
      entries: [...withStats]
        .sort((a, b) => b.longestTotalWinStreak - a.longestTotalWinStreak)
        .map(s => ({ player: s.player, value: s.longestTotalWinStreak, sub: 'wins in a row' })),
    },
    {
      label: `${prefix} O/U Loss Streak Record`,
      icon: <TrendingDown size={28} />,
      color: '#ff9800',
      entries: [...withStats]
        .sort((a, b) => b.longestTotalLossStreak - a.longestTotalLossStreak)
        .map(s => ({ player: s.player, value: s.longestTotalLossStreak, sub: 'losses in a row' })),
    },
    {
      label: `Best Win % (${prefix})`,
      icon: <TrendingUp size={28} />,
      color: '#4caf50',
      entries: [...withStats]
        .filter(s => s.record.wins + s.record.losses > 0)
        .sort((a, b) => (b.record.wins / (b.record.wins + b.record.losses)) - (a.record.wins / (a.record.wins + a.record.losses)))
        .map(s => ({ player: s.player, value: winPct(s.record.wins, s.record.losses), sub: `${s.record.wins}W - ${s.record.losses}L` })),
    },
    {
      label: `Best Lock Win % (${prefix})`,
      icon: <Star size={28} />,
      color: '#f1c40f',
      entries: [...withStats]
        .filter(s => s.lockRecord && (s.lockRecord.wins + s.lockRecord.losses > 0))
        .sort((a, b) => (b.lockRecord.wins / (b.lockRecord.wins + b.lockRecord.losses)) - (a.lockRecord.wins / (a.lockRecord.wins + a.lockRecord.losses)))
        .map(s => ({ player: s.player, value: winPct(s.lockRecord.wins, s.lockRecord.losses), sub: `${s.lockRecord.wins}W - ${s.lockRecord.losses}L` })),
    },
    {
      label: `Most Wins (${prefix})`,
      icon: <BarChart2 size={28} />,
      color: '#2196f3',
      entries: [...withStats]
        .sort((a, b) => b.record.wins - a.record.wins)
        .map(s => ({ player: s.player, value: s.record.wins, sub: `${s.record.losses} losses` })),
    },
    {
      label: `Most Lock Wins (${prefix})`,
      icon: <Crown size={28} />,
      color: '#f1c40f',
      entries: [...withStats]
        .filter(s => s.lockRecord)
        .sort((a, b) => b.lockRecord.wins - a.lockRecord.wins)
        .map(s => ({ player: s.player, value: s.lockRecord.wins, sub: `${s.lockRecord.losses} losses` })),
    },
  ];

  const filteredLeaders = leaders.filter(leader => {
    if (leader.isActiveStat) {
      return showActiveStats;
    }
    return true;
  });

  return (
    <div style={{ marginBottom: '32px' }}>
      <div className="manual-grid">
        {filteredLeaders.map((leader) => {
          const isActive = selectedLeader === leader.label;
          return (
            <div 
              key={leader.label} 
              className="control-card" 
              style={{ 
                position: 'relative',
                cursor: 'pointer',
                border: isActive ? `2px solid ${leader.color}` : '1px solid rgba(255,255,255,0.1)',
                backgroundColor: isActive ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
                transform: isActive ? 'scale(1.02)' : 'none',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setSelectedLeader(isActive ? null : leader.label)}
            >
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
          );
        })}
      </div>

      {selectedLeader && (() => {
        const activeLeader = filteredLeaders.find(l => l.label === selectedLeader);
        if (!activeLeader || activeLeader.entries.length === 0) return null;

        // Parse values to find max for scaling
        const parsedEntries = activeLeader.entries.map(e => ({
          ...e,
          numericValue: typeof e.value === 'string' && e.value.endsWith('%') ? parseFloat(e.value) : Number(e.value)
        }));
        const maxVal = Math.max(...parsedEntries.map(e => e.numericValue), 1);

        return (
          <div className="control-card" style={{ marginTop: '24px', padding: '24px', border: `1px solid ${activeLeader.color}`, backgroundColor: 'rgba(255,255,255,0.01)' }}>
            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: activeLeader.color }}>
              <BarChart2 size={20} /> Comparison: {activeLeader.label}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {parsedEntries.map((e, idx) => {
                const pct = (e.numericValue / maxVal) * 100;
                return (
                  <div key={e.player} style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: isMobile ? '6px' : '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: isMobile ? '100%' : 'auto' }}>
                      <span style={{ width: isMobile ? 'auto' : '80px', fontWeight: idx === 0 ? 'bold' : 'normal', color: idx === 0 ? activeLeader.color : '#ccc', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {e.player} {idx === 0 && <Crown size={14} fill={activeLeader.color} stroke={activeLeader.color} />}
                      </span>
                      {isMobile && <span style={{ fontSize: '0.8em', color: '#666' }}>{e.sub}</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <div style={{ flex: 1, height: '28px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${pct}%`,
                          height: '100%',
                          backgroundColor: activeLeader.color,
                          opacity: idx === 0 ? 1 : 0.6,
                          borderRadius: '6px',
                          transition: 'width 0.6s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          paddingRight: '12px',
                          boxSizing: 'border-box'
                        }}>
                          {pct > 15 && !isMobile && <span style={{ fontSize: '0.85em', fontWeight: 'bold', color: '#000' }}>{e.value}</span>}
                        </div>
                      </div>
                      {(pct <= 15 || isMobile) && <span style={{ fontWeight: 'bold', color: '#fff', minWidth: '45px', textAlign: 'right' }}>{e.value}</span>}
                    </div>
                    {!isMobile && <span style={{ fontSize: '0.8em', color: '#666', width: '120px' }}>{e.sub}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

// ─── Interactive Stat Chart Component ────────────────────────────────────────

const InteractiveStatChart = ({ selectedStat, playerName, playerStats, allPlayerStats, conf }) => {
  const [confData, setConfData] = useState([]);
  const [teamData, setTeamData] = useState([]);
  const [loading, setLoading] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!playerName || !selectedStat) return;
    
    const isConfStat = ['Favorite Conference', 'Best Conference', 'Worst Conference', 'Best Conference by Win %', 'Worst Conference by Win %'].includes(selectedStat);
    const isTeamStat = ['Reliable Ally', 'Arch-Nemesis', 'Most Bets For', 'Most Bets Against'].includes(selectedStat);

    if (isConfStat) {
      setLoading(true);
      fetch(`/api/stats/${playerName}/conferences`)
        .then(r => r.json())
        .then(data => setConfData(data))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else if (isTeamStat) {
      setLoading(true);
      const baseUrl = selectedStat === 'Most Bets Against'
        ? `/api/stats/${playerName}/faded-teams`
        : `/api/stats/${playerName}/teams`;
      const url = conf ? `${baseUrl}?conference=${encodeURIComponent(conf)}` : baseUrl;
      fetch(url)
        .then(r => r.json())
        .then(data => setTeamData(data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [playerName, selectedStat, conf]);

  if (!selectedStat) return null;

  // 1. Record Donut Chart
  if (selectedStat === 'Record') {
    const wins = Number(playerStats.record?.wins || 0);
    const losses = Number(playerStats.record?.losses || 0);
    const pushes = Number(playerStats.record?.pushes || 0);
    const pending = Number(playerStats.record?.pending || 0);
    const total = wins + losses + pushes + pending;

    if (total === 0) return <div className="control-card" style={{ marginTop: '20px' }}><p>No record data available.</p></div>;

    const winPctVal = ((wins / (wins + losses || 1)) * 100).toFixed(1);

    return (
      <div className="control-card" style={{ marginTop: '20px', padding: '24px' }}>
        <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart2 size={20} color="#2196f3" /> Record Breakdown: {playerName}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '40px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '140px', height: '140px' }}>
            <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              {/* Wins */}
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="#4caf50" strokeWidth="3.5"
                strokeDasharray={`${(wins / total) * 100} ${100 - (wins / total) * 100}`} strokeDashoffset="0" />
              {/* Losses */}
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f44336" strokeWidth="3.5"
                strokeDasharray={`${(losses / total) * 100} ${100 - (losses / total) * 100}`} strokeDashoffset={-((wins / total) * 100)} />
              {/* Pushes */}
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="#ff9800" strokeWidth="3.5"
                strokeDasharray={`${(pushes / total) * 100} ${100 - (pushes / total) * 100}`} strokeDashoffset={-(((wins + losses) / total) * 100)} />
              {/* Pending */}
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="#2196f3" strokeWidth="3.5"
                strokeDasharray={`${(pending / total) * 100} ${100 - (pending / total) * 100}`} strokeDashoffset={-(((wins + losses + pushes) / total) * 100)} />
            </svg>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.4em', fontWeight: 'bold', color: '#fff' }}>{winPctVal}%</span>
              <span style={{ fontSize: '0.7em', color: '#888' }}>Win Rate</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, minWidth: '200px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#4caf50' }} /> Wins</span>
              <span style={{ fontWeight: 'bold', color: '#fff' }}>{wins} <span style={{ fontSize: '0.85em', color: '#888', fontWeight: 'normal' }}>({((wins/total)*100).toFixed(1)}%)</span></span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#f44336' }} /> Losses</span>
              <span style={{ fontWeight: 'bold', color: '#fff' }}>{losses} <span style={{ fontSize: '0.85em', color: '#888', fontWeight: 'normal' }}>({((losses/total)*100).toFixed(1)}%)</span></span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#ff9800' }} /> Pushes</span>
              <span style={{ fontWeight: 'bold', color: '#fff' }}>{pushes} <span style={{ fontSize: '0.85em', color: '#888', fontWeight: 'normal' }}>({((pushes/total)*100).toFixed(1)}%)</span></span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#2196f3' }} /> Pending</span>
              <span style={{ fontWeight: 'bold', color: '#fff' }}>{pending} <span style={{ fontSize: '0.85em', color: '#888', fontWeight: 'normal' }}>({((pending/total)*100).toFixed(1)}%)</span></span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Player Comparison Bar Chart (Total Picks & Streaks)
  const isComparisonStat = ['Total Picks', 'Lock Record', 'Lock Win %', 'Active Spread Win Streak', 'Active Spread Loss Streak', 'Longest Spread Win Streak', 'Longest Spread Loss Streak', 'Active O/U Win Streak', 'Active O/U Loss Streak', 'Longest O/U Win Streak', 'Longest O/U Loss Streak'].includes(selectedStat);
  if (isComparisonStat) {
    const chartData = allPlayerStats.map(s => {
      let val = 0;
      let sub = '';
      if (selectedStat === 'Total Picks') {
        val = Number(s.record?.total || 0);
        sub = 'picks';
      } else if (selectedStat === 'Lock Record') {
        val = Number(s.lockRecord?.wins || 0);
        sub = `${s.lockRecord?.wins || 0}W - ${s.lockRecord?.losses || 0}L`;
      } else if (selectedStat === 'Lock Win %') {
        const wins = Number(s.lockRecord?.wins || 0);
        const losses = Number(s.lockRecord?.losses || 0);
        val = wins + losses > 0 ? Number(((wins / (wins + losses)) * 100).toFixed(2)) : 0;
        sub = `${wins}W - ${losses}L`;
      } else if (selectedStat.includes('Active Spread Win')) {
        val = Number(s.currentWinStreak || 0);
        sub = 'wins';
      } else if (selectedStat.includes('Active Spread Loss')) {
        val = Number(s.currentLossStreak || 0);
        sub = 'losses';
      } else if (selectedStat.includes('Longest Spread Win')) {
        val = Number(s.longestWinStreak || 0);
        sub = 'wins';
      } else if (selectedStat.includes('Longest Spread Loss')) {
        val = Number(s.longestLossStreak || 0);
        sub = 'losses';
      } else if (selectedStat.includes('Active O/U Win')) {
        val = Number(s.currentTotalWinStreak || 0);
        sub = 'wins';
      } else if (selectedStat.includes('Active O/U Loss')) {
        val = Number(s.currentTotalLossStreak || 0);
        sub = 'losses';
      } else if (selectedStat.includes('Longest O/U Win')) {
        val = Number(s.longestTotalWinStreak || 0);
        sub = 'wins';
      } else if (selectedStat.includes('Longest O/U Loss')) {
        val = Number(s.longestTotalLossStreak || 0);
        sub = 'losses';
      }
      return { player: s.player, value: val, sub };
    });

    const maxVal = Math.max(...chartData.map(d => d.value), 1);
    const isLossStreak = selectedStat.includes('Loss');
    const barColor = selectedStat.includes('Lock') ? '#f1c40f' : (isLossStreak ? '#f44336' : '#4caf50');
    const valueSuffix = selectedStat === 'Lock Win %' ? '%' : '';

    return (
      <div className="control-card" style={{ marginTop: '20px', padding: '24px' }}>
        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart2 size={20} color="#2196f3" /> Player Comparison: {selectedStat}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {chartData.map(d => {
            const pct = (d.value / maxVal) * 100;
            const isCurrentPlayer = d.player === playerName;
            return (
              <div key={d.player} style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: isMobile ? '6px' : '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: isMobile ? '100%' : 'auto' }}>
                  <span style={{ width: isMobile ? 'auto' : '80px', fontWeight: isCurrentPlayer ? 'bold' : 'normal', color: isCurrentPlayer ? '#2196f3' : '#ccc' }}>
                    {d.player} {isCurrentPlayer && '★'}
                  </span>
                  {isMobile && <span style={{ fontSize: '0.8em', color: '#666' }}>{d.sub}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <div style={{ flex: 1, height: '24px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`,
                      height: '100%',
                      backgroundColor: isCurrentPlayer ? '#2196f3' : barColor,
                      borderRadius: '4px',
                      transition: 'width 0.6s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      paddingRight: '8px',
                      boxSizing: 'border-box'
                    }}>
                      {pct > 10 && !isMobile && <span style={{ fontSize: '0.8em', fontWeight: 'bold', color: '#fff' }}>{d.value}{valueSuffix}</span>}
                    </div>
                  </div>
                  {(pct <= 10 || isMobile) && <span style={{ fontWeight: 'bold', color: '#fff', minWidth: '30px', textAlign: 'right' }}>{d.value}{valueSuffix}</span>}
                </div>
                {!isMobile && <span style={{ fontSize: '0.8em', color: '#666', width: '120px' }}>{d.sub}</span>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 3. Conference Bar Chart
  const isConfStat = ['Favorite Conference', 'Best Conference', 'Worst Conference', 'Best Conference by Win %', 'Worst Conference by Win %'].includes(selectedStat);
  if (isConfStat) {
    if (loading) return <div className="control-card" style={{ marginTop: '20px' }}><p>Loading conference stats...</p></div>;
    if (confData.length === 0) return <div className="control-card" style={{ marginTop: '20px' }}><p>No conference data available.</p></div>;

    // Sort based on stat clicked
    let sortedData = [...confData];
    let valueKey = 'total_picks';
    let valueLabel = 'Picks';
    let valueSuffix = '';

    if (selectedStat === 'Favorite Conference') {
      sortedData.sort((a, b) => b.total_picks - a.total_picks);
    } else if (selectedStat.includes('Best Conference') || selectedStat.includes('Win %')) {
      sortedData = sortedData.filter(c => Number(c.total_picks) >= 3); // min 3 picks for win% sorting
      sortedData.sort((a, b) => Number(b.win_pct) - Number(a.win_pct));
      valueKey = 'win_pct';
      valueLabel = 'Win %';
      valueSuffix = '%';
    } else if (selectedStat.includes('Worst Conference')) {
      sortedData = sortedData.filter(c => Number(c.total_picks) >= 3);
      sortedData.sort((a, b) => Number(a.win_pct) - Number(b.win_pct));
      valueKey = 'win_pct';
      valueLabel = 'Win %';
      valueSuffix = '%';
    }

    const maxVal = Math.max(...sortedData.map(d => Number(d[valueKey])), 1);

    return (
      <div className="control-card" style={{ marginTop: '20px', padding: '24px' }}>
        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart2 size={20} color="#2196f3" /> Conference Performance: {playerName}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {sortedData.slice(0, 8).map(d => {
            const val = Number(d[valueKey]);
            const pct = (val / maxVal) * 100;
            const isWinPct = valueKey === 'win_pct';
            const barColor = isWinPct ? (val >= 50 ? '#4caf50' : '#f44336') : '#2196f3';

            return (
              <div key={d.conference} style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: isMobile ? '6px' : '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: isMobile ? '100%' : 'auto' }}>
                  <span style={{ width: isMobile ? 'auto' : '120px', fontSize: '0.9em', color: '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d.conference}>
                    {d.conference}
                  </span>
                  {isMobile && <span style={{ fontSize: '0.75em', color: '#666' }}>{d.wins}W - {d.losses}L</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <div style={{ flex: 1, height: '20px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`,
                      height: '100%',
                      backgroundColor: barColor,
                      borderRadius: '4px',
                      transition: 'width 0.6s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      paddingRight: '8px',
                      boxSizing: 'border-box'
                    }}>
                      {pct > 15 && !isMobile && <span style={{ fontSize: '0.75em', fontWeight: 'bold', color: '#fff' }}>{val}{valueSuffix}</span>}
                    </div>
                  </div>
                  {(pct <= 15 || isMobile) && <span style={{ fontWeight: 'bold', color: '#fff', fontSize: '0.85em', minWidth: '45px', textAlign: 'right' }}>{val}{valueSuffix}</span>}
                </div>
                {!isMobile && (
                  <span style={{ fontSize: '0.75em', color: '#666', width: '80px', textAlign: 'right' }}>
                    {d.wins}W - {d.losses}L
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 4. Team Bar Chart
  const isTeamStat = ['Reliable Ally', 'Arch-Nemesis', 'Most Bets For', 'Most Bets Against'].includes(selectedStat);
  if (isTeamStat) {
    if (loading) return <div className="control-card" style={{ marginTop: '20px' }}><p>Loading team stats...</p></div>;
    if (teamData.length === 0) return <div className="control-card" style={{ marginTop: '20px' }}><p>No team data available.</p></div>;

    let sortedData = [...teamData];
    if (selectedStat === 'Reliable Ally') {
      sortedData.sort((a, b) => Number(b.wins) - Number(a.wins));
    } else if (selectedStat === 'Arch-Nemesis') {
      sortedData.sort((a, b) => Number(b.losses) - Number(a.losses));
    } else {
      sortedData.sort((a, b) => Number(b.total_picks) - Number(a.total_picks));
    }

    const maxPicks = Math.max(...sortedData.map(d => Number(d.total_picks)), 1);

    return (
      <div className="control-card" style={{ marginTop: '20px', padding: '24px' }}>
        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart2 size={20} color="#2196f3" /> Team Performance: {playerName}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {sortedData.slice(0, 8).map(d => {
            const total = Number(d.total_picks);
            const wins = Number(d.wins);
            const losses = Number(d.losses);
            const pushes = Number(d.pushes);

            const winPct = ((wins / total) * 100).toFixed(0);

            return (
              <div key={d.school} style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: isMobile ? '6px' : '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: isMobile ? '100%' : '160px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    {d.logo && <img src={d.logo} alt="" style={{ height: '20px', width: '20px', objectFit: 'contain', flexShrink: 0 }} />}
                    <span style={{ fontSize: '0.85em', color: '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {d.school}
                    </span>
                  </div>
                  {isMobile && <span style={{ fontSize: '0.8em', color: '#888' }}>{winPct}%</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <div style={{ flex: 1, height: '20px', display: 'flex', borderRadius: '4px', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                    {wins > 0 && (
                      <div style={{
                        width: `${(wins / maxPicks) * 100}%`,
                        backgroundColor: '#4caf50',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '0.7em',
                        fontWeight: 'bold'
                      }} title={`${wins} Wins`}>
                        {wins}W
                      </div>
                    )}
                    {losses > 0 && (
                      <div style={{
                        width: `${(losses / maxPicks) * 100}%`,
                        backgroundColor: '#f44336',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '0.7em',
                        fontWeight: 'bold'
                      }} title={`${losses} Losses`}>
                        {losses}L
                      </div>
                    )}
                    {pushes > 0 && (
                      <div style={{
                        width: `${(pushes / maxPicks) * 100}%`,
                        backgroundColor: '#ff9800',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '0.7em',
                        fontWeight: 'bold'
                      }} title={`${pushes} Pushes`}>
                        {pushes}P
                      </div>
                    )}
                  </div>
                  {!isMobile && (
                    <span style={{ fontSize: '0.8em', color: '#888', width: '40px', textAlign: 'right' }}>
                      {winPct}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
};

// ─── Single Player Stats Panel ───────────────────────────────────────────────

const PlayerStatsPanel = ({ playerName, playerStats, selectedConference, setSelectedConference, conferenceList, statsTimeRange, setStatsTimeRange, conferenceStats, allPlayerStats, seasons, selectedWeek, selectedSeason }) => {
  const [selectedStat, setSelectedStat] = useState('Record');
  const [allyNemesisConf, setAllyNemesisConf] = useState('');
  const [sortField, setSortField] = useState('wins');
  const [sortDirection, setSortDirection] = useState('desc');
  const [trend, setTrend] = useState([]);

  // Fetch trend dynamically based on selected time range and conference
  useEffect(() => {
    if (!playerName) return;
    fetch(`/api/stats/${playerName}/trend?range=${statsTimeRange}&week=${selectedWeek}&season=${selectedSeason}&conference=${selectedConference}`)
      .then(r => r.json())
      .then(data => setTrend(data))
      .catch(() => {});
  }, [playerName, statsTimeRange, selectedWeek, selectedSeason, selectedConference]);

  if (!playerStats || !playerStats.record) {
    return <div style={{ color: '#888', padding: '20px' }}>Loading stats for {playerName}...</div>;
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedRecords = conferenceStats?.schoolRecords ? [...conferenceStats.schoolRecords].sort((a, b) => {
    let valA, valB;
    if (sortField === 'school') {
      valA = a.school;
      valB = b.school;
    } else if (sortField === 'wins') {
      valA = Number(a.wins);
      valB = Number(b.wins);
    } else if (sortField === 'win_pct') {
      valA = Number(a.total) > 0 ? Number(a.wins) / Number(a.total) : 0;
      valB = Number(b.total) > 0 ? Number(b.wins) / Number(b.total) : 0;
    } else if (sortField === 'fade_wins') {
      valA = Number(a.fade_wins);
      valB = Number(b.fade_wins);
    } else if (sortField === 'fade_win_pct') {
      valA = Number(a.fade_total) > 0 ? Number(a.fade_wins) / Number(a.fade_total) : 0;
      valB = Number(b.fade_total) > 0 ? Number(b.fade_wins) / Number(b.fade_total) : 0;
    } else if (sortField === 'avg_spread') {
      valA = Number(a.avg_spread);
      valB = Number(b.avg_spread);
    } else if (sortField === 'net_units') {
      valA = Number(a.net_units);
      valB = Number(b.net_units);
    } else if (sortField === 'inv_wins') {
      valA = Number(a.inv_wins);
      valB = Number(b.inv_wins);
    } else if (sortField === 'inv_win_pct') {
      valA = Number(a.inv_total) > 0 ? Number(a.inv_wins) / Number(a.inv_total) : 0;
      valB = Number(b.inv_total) > 0 ? Number(b.inv_wins) / Number(b.inv_total) : 0;
    }

    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  }) : [];

  // Calculate trend bounds for dynamic scaling (more variance)
  const trendPcts = playerStats.trend ? playerStats.trend.map(w => {
    const total = w.wins + w.losses;
    return total > 0 ? (w.wins / total) : 0.5;
  }) : [];
  const minPct = Math.min(...trendPcts, 0.25);
  const maxPct = Math.max(...trendPcts, 0.75);
  const pctRange = maxPct - minPct || 0.1;

  return (
    <div>
      <div className="manual-grid" style={{ marginTop: '16px' }}>
        <StatCard label="Record" color="#fff"
          value={`${playerStats.record.wins}-${playerStats.record.losses}-${playerStats.record.pushes}`}
          sub={`Win %: ${winPct(playerStats.record.wins, playerStats.record.losses)}`}
          icon={<BarChart2 size={40} />}
          onClick={() => setSelectedStat('Record')}
          active={selectedStat === 'Record'}
        />
        <StatCard label="Total Picks" color="#fff"
          value={playerStats.record.total || 0}
          sub="Spread & O/U combined"
          icon={<Hash size={40} />}
          onClick={() => setSelectedStat('Total Picks')}
          active={selectedStat === 'Total Picks'}
        />
        <StatCard label="Lock Record" color="#f1c40f"
          value={`${playerStats.lockRecord?.wins || 0}-${playerStats.lockRecord?.losses || 0}-${playerStats.lockRecord?.pushes || 0}`}
          sub={`Win %: ${winPct(playerStats.lockRecord?.wins || 0, playerStats.lockRecord?.losses || 0)}`}
          icon={<Star size={40} />}
          onClick={() => setSelectedStat('Lock Record')}
          active={selectedStat === 'Lock Record'}
        />
        <StatCard label="Lock Win %" color="#f1c40f"
          value={winPct(playerStats.lockRecord?.wins || 0, playerStats.lockRecord?.losses || 0)}
          sub={`${playerStats.lockRecord?.wins || 0}W - ${playerStats.lockRecord?.losses || 0}L`}
          icon={<Crown size={40} />}
          onClick={() => setSelectedStat('Lock Win %')}
          active={selectedStat === 'Lock Win %'}
        />
        <StatCard
          label={playerStats.currentWinStreak > 0 ? 'Active Spread Win Streak' : playerStats.currentLossStreak > 0 ? 'Active Spread Loss Streak' : 'Current Spread Streak'}
          value={playerStats.currentWinStreak > 0 ? playerStats.currentWinStreak : playerStats.currentLossStreak || 0}
          color={playerStats.currentWinStreak > 0 ? '#4caf50' : playerStats.currentLossStreak > 0 ? '#f44336' : '#888'}
          sub={playerStats.currentWinStreak > 0 ? 'Consecutive wins' : playerStats.currentLossStreak > 0 ? 'Consecutive losses' : 'No active streak'}
          icon={<Flame size={40} />}
          onClick={() => setSelectedStat(playerStats.currentWinStreak > 0 ? 'Active Spread Win Streak' : playerStats.currentLossStreak > 0 ? 'Active Spread Loss Streak' : 'Active Spread Win Streak')}
          active={selectedStat === 'Active Spread Win Streak' || selectedStat === 'Active Spread Loss Streak'}
        />
        <StatCard label="Longest Spread Win Streak" value={playerStats.longestWinStreak || 0} color="#ffcc00" sub="All-time best" icon={<Trophy size={40} />}
          onClick={() => setSelectedStat('Longest Spread Win Streak')}
          active={selectedStat === 'Longest Spread Win Streak'}
        />
        <StatCard label="Longest Spread Loss Streak" value={playerStats.longestLossStreak || 0} color="#f44336" sub="All-time low" icon={<TrendingDown size={40} />}
          onClick={() => setSelectedStat('Longest Spread Loss Streak')}
          active={selectedStat === 'Longest Spread Loss Streak'}
        />
        
        <StatCard
          label={playerStats.currentTotalWinStreak > 0 ? 'Active O/U Win Streak' : playerStats.currentTotalLossStreak > 0 ? 'Active O/U Loss Streak' : 'Current O/U Streak'}
          value={playerStats.currentTotalWinStreak > 0 ? playerStats.currentTotalWinStreak : playerStats.currentTotalLossStreak || 0}
          color={playerStats.currentTotalWinStreak > 0 ? '#4caf50' : playerStats.currentTotalLossStreak > 0 ? '#f44336' : '#888'}
          sub={playerStats.currentTotalWinStreak > 0 ? 'Consecutive wins' : playerStats.currentTotalLossStreak > 0 ? 'Consecutive losses' : 'No active streak'}
          icon={<Flame size={40} />}
          onClick={() => setSelectedStat(playerStats.currentTotalWinStreak > 0 ? 'Active O/U Win Streak' : playerStats.currentTotalLossStreak > 0 ? 'Active O/U Loss Streak' : 'Active O/U Win Streak')}
          active={selectedStat === 'Active O/U Win Streak' || selectedStat === 'Active O/U Loss Streak'}
        />
        <StatCard label="Longest O/U Win Streak" value={playerStats.longestTotalWinStreak || 0} color="#ffcc00" sub="All-time best" icon={<Trophy size={40} />}
          onClick={() => setSelectedStat('Longest O/U Win Streak')}
          active={selectedStat === 'Longest O/U Win Streak'}
        />
        <StatCard label="Longest O/U Loss Streak" value={playerStats.longestTotalLossStreak || 0} color="#f44336" sub="All-time low" icon={<TrendingDown size={40} />}
          onClick={() => setSelectedStat('Longest O/U Loss Streak')}
          active={selectedStat === 'Longest O/U Loss Streak'}
        />
        <StatCard label="Favorite Conference" value={playerStats.favConf?.conference || 'None'} sub={`${playerStats.favConf?.count || 0} picks made`}
          onClick={() => setSelectedStat('Favorite Conference')}
          active={selectedStat === 'Favorite Conference'}
        />
        <StatCard label="Best Conference" value={playerStats.bestConf?.conference || 'None'} color="#4caf50" sub={`${playerStats.bestConf?.count || 0} wins here`}
          onClick={() => setSelectedStat('Best Conference')}
          active={selectedStat === 'Best Conference'}
        />
        <StatCard label="Worst Conference" value={playerStats.worstConf?.conference || 'None'} color="#ff9800" sub={`${playerStats.worstConf?.count || 0} losses here`}
          onClick={() => setSelectedStat('Worst Conference')}
          active={selectedStat === 'Worst Conference'}
        />
        <StatCard label="Best Conference by Win %" value={playerStats.bestConfByPct?.conference || 'None'} color="#4caf50"
          sub={playerStats.bestConfByPct ? `${playerStats.bestConfByPct.win_pct}% (${playerStats.bestConfByPct.wins}W-${playerStats.bestConfByPct.losses}L)` : 'Min. 5 picks'}
          onClick={() => setSelectedStat('Best Conference by Win %')}
          active={selectedStat === 'Best Conference by Win %'}
        />
        <StatCard label="Worst Conference by Win %" value={playerStats.worstConfByPct?.conference || 'None'} color="#f44336"
          sub={playerStats.worstConfByPct ? `${playerStats.worstConfByPct.win_pct}% (${playerStats.worstConfByPct.wins}W-${playerStats.worstConfByPct.losses}L)` : 'Min. 5 picks'}
          onClick={() => setSelectedStat('Worst Conference by Win %')}
          active={selectedStat === 'Worst Conference by Win %'}
        />
        <AllyNemesisCards
          playerName={playerName}
          defaultAlly={playerStats.topWinSchool}
          defaultNemesis={playerStats.topLossSchool}
          conferenceList={conferenceList}
          onSelectStat={setSelectedStat}
          activeStat={selectedStat}
          conf={allyNemesisConf}
          setConf={setAllyNemesisConf}
        />
        <SchoolCard label="Most Bets For" school={playerStats.mostBetsFor} sub={`${playerStats.mostBetsFor?.count || 0} total picks`}
          onClick={() => setSelectedStat('Most Bets For')}
          active={selectedStat === 'Most Bets For'}
        />
        <SchoolCard label="Most Bets Against" school={playerStats.mostBetsAgainst} sub={`${playerStats.mostBetsAgainst?.count || 0} total fades`}
          onClick={() => setSelectedStat('Most Bets Against')}
          active={selectedStat === 'Most Bets Against'}
        />
      </div>

      {/* Interactive Stat Chart */}
      <InteractiveStatChart
        selectedStat={selectedStat}
        playerName={playerName}
        playerStats={playerStats}
        allPlayerStats={allPlayerStats}
        conf={allyNemesisConf}
      />

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
                    <th 
                      style={{ textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => handleSort('school')}
                    >
                      School {sortField === 'school' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th 
                      title="Your record when betting directly on this team" 
                      style={{ cursor: 'pointer', userSelect: 'none', borderBottom: '1px dotted rgba(255,255,255,0.3)' }}
                      onClick={() => handleSort('wins')}
                    >
                      Direct Record {sortField === 'wins' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th 
                      title="Your win percentage when betting directly on this team" 
                      style={{ cursor: 'pointer', userSelect: 'none', borderBottom: '1px dotted rgba(255,255,255,0.3)' }}
                      onClick={() => handleSort('win_pct')}
                    >
                      Direct Win % {sortField === 'win_pct' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th 
                      title="Your record when betting against this team (betting on their opponent)" 
                      style={{ cursor: 'pointer', userSelect: 'none', borderBottom: '1px dotted rgba(255,255,255,0.3)' }}
                      onClick={() => handleSort('fade_wins')}
                    >
                      Faded Record {sortField === 'fade_wins' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th 
                      title="Your win percentage when betting against this team (betting on their opponent)" 
                      style={{ cursor: 'pointer', userSelect: 'none', borderBottom: '1px dotted rgba(255,255,255,0.3)' }}
                      onClick={() => handleSort('fade_win_pct')}
                    >
                      Faded Win % {sortField === 'fade_win_pct' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th 
                      title="Average spread line you locked in when betting on this team" 
                      style={{ cursor: 'pointer', userSelect: 'none', borderBottom: '1px dotted rgba(255,255,255,0.3)' }}
                      onClick={() => handleSort('avg_spread')}
                    >
                      Avg Spread {sortField === 'avg_spread' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th 
                      title="Net units won/lost on games involving this team (flat 1-unit bet with -110 vig)" 
                      style={{ cursor: 'pointer', userSelect: 'none', borderBottom: '1px dotted rgba(255,255,255,0.3)' }}
                      onClick={() => handleSort('net_units')}
                    >
                      Net Units {sortField === 'net_units' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th 
                      title="Your record in all games involving this team (betting either on them or on their opponent)" 
                      style={{ cursor: 'pointer', userSelect: 'none', borderBottom: '1px dotted rgba(255,255,255,0.3)' }}
                      onClick={() => handleSort('inv_wins')}
                    >
                      Involved Record {sortField === 'inv_wins' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th 
                      title="Your win percentage in all games involving this team (betting either on them or on their opponent)" 
                      style={{ cursor: 'pointer', userSelect: 'none', borderBottom: '1px dotted rgba(255,255,255,0.3)' }}
                      onClick={() => handleSort('inv_win_pct')}
                    >
                      Involved Win % {sortField === 'inv_win_pct' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRecords.map(r => (
                    <tr key={r.school}>
                      <td style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {r.logo && <img src={r.logo} alt="" style={{ height: '20px', width: '20px', objectFit: 'contain' }} />}
                        {r.school}
                      </td>
                      <td style={{ textAlign: 'center' }}>{r.wins} - {r.losses} - {r.pushes}</td>
                      <td style={{ textAlign: 'center' }}>{Number(r.total) > 0 ? ((Number(r.wins) / Number(r.total)) * 100).toFixed(2) : '0.00'}%</td>
                      <td style={{ textAlign: 'center' }}>{r.fade_wins} - {r.fade_losses} - {r.fade_pushes}</td>
                      <td style={{ textAlign: 'center' }}>{Number(r.fade_total) > 0 ? ((Number(r.fade_wins) / Number(r.fade_total)) * 100).toFixed(2) : '0.00'}%</td>
                      <td style={{ textAlign: 'center' }}>{Number(r.avg_spread) > 0 ? `+${r.avg_spread}` : r.avg_spread}</td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold', color: Number(r.net_units) > 0 ? '#4caf50' : Number(r.net_units) < 0 ? '#f44336' : '#ccc' }}>
                        {Number(r.net_units) > 0 ? `+${r.net_units}` : r.net_units}
                      </td>
                      <td style={{ textAlign: 'center' }}>{r.inv_wins} - {r.inv_losses} - {r.inv_pushes}</td>
                      <td style={{ textAlign: 'center' }}>{Number(r.inv_total) > 0 ? ((Number(r.inv_wins) / Number(r.inv_total)) * 100).toFixed(2) : '0.00'}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Weekly Trend */}
      {trend && trend.length > 0 && (() => {
        const trendData = trend;
        const pcts = trendData.map(w => {
          const wins = Number(w.wins);
          const losses = Number(w.losses);
          const total = wins + losses;
          return total > 0 ? (wins / total) : 0.5;
        });
        const minPct = Math.min(...pcts, 0.25);
        const maxPct = Math.max(...pcts, 0.75);
        const pctRange = maxPct - minPct || 0.1;

        const maxPicks = Math.max(...trendData.map(w => Number(w.wins) + Number(w.losses)), 1);
        const labelInterval = Math.ceil(trendData.length / 15);

        // SVG dimensions
        const svgWidth = 1000;
        const svgHeight = 220;
        const marginLeft = 60;
        const marginRight = 20;
        const marginTop = 20;
        const marginBottom = 40;
        const chartWidth = svgWidth - marginLeft - marginRight;
        const chartHeight = svgHeight - marginTop - marginBottom;

        return (
          <div style={{ marginTop: '32px', padding: '20px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
            <h3>Weekly Performance Trend</h3>
            <div style={{ width: '100%', overflowX: 'auto', marginTop: '20px' }}>
              <div style={{ minWidth: '600px', position: 'relative' }}>
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: 'auto' }}>
                  <defs>
                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2196f3" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#2196f3" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines & Y-Axis Labels */}
                  {[0, 0.33, 0.66, 1].map((ratio, idx) => {
                    const y = marginTop + (1 - ratio) * chartHeight;
                    const val = (minPct + ratio * pctRange) * 100;
                    return (
                      <g key={idx}>
                        <line x1={marginLeft} y1={y} x2={svgWidth - marginRight} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
                        <text x={marginLeft - 10} y={y + 4} fill="#888" fontSize="12" textAnchor="end">{val.toFixed(0)}%</text>
                      </g>
                    );
                  })}

                  {/* Bars (Wins & Losses) */}
                  {trendData.map((w, i) => {
                    const centerX = marginLeft + ((i + 0.5) / trendData.length) * chartWidth;
                    const barWidth = Math.min(16, (chartWidth / trendData.length) * 0.25);
                    
                    const winHeight = (Number(w.wins) / maxPicks) * chartHeight;
                    const lossHeight = (Number(w.losses) / maxPicks) * chartHeight;

                    const winY = marginTop + chartHeight - winHeight;
                    const lossY = marginTop + chartHeight - lossHeight;

                    return (
                      <g key={`bars-${i}`}>
                        {/* Wins Bar */}
                        <rect
                          x={centerX - barWidth - 2}
                          y={winY}
                          width={barWidth}
                          height={winHeight}
                          fill="#4caf50"
                          opacity="0.75"
                          rx="2"
                          title={`${w.wins} Wins`}
                        />
                        {/* Losses Bar */}
                        <rect
                          x={centerX + 2}
                          y={lossY}
                          width={barWidth}
                          height={lossHeight}
                          fill="#f44336"
                          opacity="0.75"
                          rx="2"
                          title={`${w.losses} Losses`}
                        />
                        {/* X-Axis Label */
                        i % labelInterval === 0 && (
                          <>
                            <text
                              x={centerX}
                              y={svgHeight - marginBottom + 20}
                              fill="#888"
                              fontSize="11"
                              textAnchor="middle"
                            >
                              W{w.week}
                            </text>
                            <text
                              x={centerX}
                              y={svgHeight - marginBottom + 34}
                              fill="#555"
                              fontSize="9"
                              textAnchor="middle"
                            >
                              '{w.season.slice(2)}
                            </text>
                          </>
                        )}
                      </g>
                    );
                  })}

                  {/* Area under the line */}
                  <path
                    fill="url(#trendGradient)"
                    stroke="none"
                    d={
                      `M ${marginLeft + (0.5 / trendData.length) * chartWidth},${marginTop + chartHeight} ` +
                      trendData.map((w, i) => {
                        const wins = Number(w.wins);
                        const losses = Number(w.losses);
                        const total = wins + losses;
                        const pct = total > 0 ? (wins / total) : 0.5;
                        const x = marginLeft + ((i + 0.5) / trendData.length) * chartWidth;
                        const y = marginTop + (1 - (pct - minPct) / pctRange) * chartHeight;
                        return `L ${x},${y}`;
                      }).join(' ') +
                      ` L ${marginLeft + ((trendData.length - 0.5) / trendData.length) * chartWidth},${marginTop + chartHeight} Z`
                    }
                  />

                  {/* Trend Line */}
                  <polyline
                    fill="none"
                    stroke="#2196f3"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={trendData.map((w, i) => {
                      const wins = Number(w.wins);
                      const losses = Number(w.losses);
                      const total = wins + losses;
                      const pct = total > 0 ? (wins / total) : 0.5;
                      const x = marginLeft + ((i + 0.5) / trendData.length) * chartWidth;
                      const y = marginTop + (1 - (pct - minPct) / pctRange) * chartHeight;
                      return `${x},${y}`;
                    }).join(' ')}
                  />

                  {/* Trend Circles */}
                  {trendData.map((w, i) => {
                    const wins = Number(w.wins);
                    const losses = Number(w.losses);
                    const total = wins + losses;
                    const pct = total > 0 ? (wins / total) : 0.5;
                    const x = marginLeft + ((i + 0.5) / trendData.length) * chartWidth;
                    const y = marginTop + (1 - (pct - minPct) / pctRange) * chartHeight;
                    return (
                      <g key={`circle-${i}`}>
                        <circle
                          cx={x}
                          cy={y}
                          r="5"
                          fill="#2196f3"
                          stroke="#1a1a2e"
                          strokeWidth="1.5"
                        />
                        <title>{`Week ${w.week}: ${(pct * 100).toFixed(1)}% (${wins}W - ${losses}L)`}</title>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px', fontSize: '0.8em' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '10px', height: '10px', backgroundColor: '#4caf50', borderRadius: '2px' }} /> Wins</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '10px', height: '10px', backgroundColor: '#f44336', borderRadius: '2px' }} /> Losses</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '12px', height: '3px', backgroundColor: '#2196f3', borderRadius: '1px' }} /> Win %</span>
            </div>
          </div>
        );
      })()}
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
  seasons,
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
  selectedWeek,
  selectedSeason,
}) => {
  const [activeTab, setActiveTab] = useState('leaders');
  const [leadersStats, setLeadersStats] = useState([]);
  const [loadingLeaders, setLoadingLeaders] = useState(false);

  useEffect(() => {
    setLoadingLeaders(true);
    fetch(`/api/stats/leaders?range=${statsTimeRange}&week=${selectedWeek}&season=${selectedSeason}`)
      .then(r => r.json())
      .then(data => setLeadersStats(data))
      .catch(() => {})
      .finally(() => setLoadingLeaders(false));
  }, [statsTimeRange, selectedWeek, selectedSeason]);

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
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px', marginBottom: '24px', alignItems: 'center' }}>
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

        {/* Time Range Dropdown aligned to the right */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.9em', color: '#888' }}>Time Range:</span>
          <select 
            value={statsTimeRange} 
            onChange={(e) => setStatsTimeRange(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.15)',
              backgroundColor: '#1a1a2e',
              color: '#fff',
              fontSize: '0.9em',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            <option value="All-Time">All-Time (2022+)</option>
            <option value="Season">Current Season ({selectedSeason})</option>
            <option value="Last Season">Last Season ({Number(selectedSeason) - 1})</option>
            {seasons.map(s => <option key={s} value={s}>{s} Season</option>)}
            <option value="Week">Current Week (W{selectedWeek})</option>
            <option value="Last 5 Weeks">Last 5 Weeks</option>
            <option value="Last 10 Weeks">Last 10 Weeks</option>
            <option value="Last 30 Days">Last 30 Days</option>
          </select>
        </div>
      </div>

      {activeTab === 'leaders' && (
        <div>
          {loadingLeaders ? (
            <div style={{ color: '#888', padding: '20px' }}>Loading leaders...</div>
          ) : (
            <StatLeaders allPlayerStats={leadersStats} timeRange={statsTimeRange} />
          )}
        </div>
      )}

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
          allPlayerStats={leadersStats}
          seasons={seasons}
          selectedWeek={selectedWeek}
          selectedSeason={selectedSeason}
        />
      )}

      {activeTab === 'compare' && (
        <ComparePanel players={players} allPlayerStats={leadersStats} />
      )}
    </section>
  );
};

export default StatsPage;