import React, { useState, useEffect } from 'react';
import { Trophy, Flame, TrendingUp, TrendingDown, Users, BarChart2, ArrowLeftRight, Hash, Star, Library, Home, Compass, Layers } from 'lucide-react';

const winPct = (w, l) => {
  const wins = Number(w);
  const losses = Number(l);
  return wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(2) + '%' : 'N/A';
};

const winPctVal = (w, l) => {
  const wins = Number(w);
  const losses = Number(l);
  return wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0;
};

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

const ResearchChart = ({ selectedStat, teamName, stats }) => {
  if (!selectedStat || !stats) return null;

  let wins = 0, losses = 0, pushes = 0, label = '', color = '#2196f3';
  let isOU = false;

  if (selectedStat === 'SU Overall') {
    wins = stats.su.wins; losses = stats.su.losses; pushes = stats.su.pushes;
    label = 'Straight Up (SU) Overall';
  } else if (selectedStat === 'SU Home') {
    wins = stats.suHome.wins; losses = stats.suHome.losses; pushes = stats.suHome.pushes;
    label = 'SU Home Record';
  } else if (selectedStat === 'SU Away') {
    wins = stats.suAway.wins; losses = stats.suAway.losses; pushes = stats.suAway.pushes;
    label = 'SU Away Record';
  } else if (selectedStat === 'SU Favorite') {
    wins = stats.suFav.wins; losses = stats.suFav.losses; pushes = stats.suFav.pushes;
    label = 'SU Record as Favorite';
  } else if (selectedStat === 'SU Underdog') {
    wins = stats.suDog.wins; losses = stats.suDog.losses; pushes = stats.suDog.pushes;
    label = 'SU Record as Underdog';
  } else if (selectedStat === 'SU Home Favorite') {
    wins = stats.suHomeFav.wins; losses = stats.suHomeFav.losses; pushes = stats.suHomeFav.pushes;
    label = 'SU Home Favorite';
  } else if (selectedStat === 'SU Home Underdog') {
    wins = stats.suHomeDog.wins; losses = stats.suHomeDog.losses; pushes = stats.suHomeDog.pushes;
    label = 'SU Home Underdog';
  } else if (selectedStat === 'SU Away Favorite') {
    wins = stats.suAwayFav.wins; losses = stats.suAwayFav.losses; pushes = stats.suAwayFav.pushes;
    label = 'SU Away Favorite';
  } else if (selectedStat === 'SU Away Underdog') {
    wins = stats.suAwayDog.wins; losses = stats.suAwayDog.losses; pushes = stats.suAwayDog.pushes;
    label = 'SU Away Underdog';
  } else if (selectedStat === 'ATS Overall') {
    wins = stats.ats.wins; losses = stats.ats.losses; pushes = stats.ats.pushes;
    label = 'Against the Spread (ATS) Overall';
    color = '#ffcc00';
  } else if (selectedStat === 'ATS Home') {
    wins = stats.atsHome.wins; losses = stats.atsHome.losses; pushes = stats.atsHome.pushes;
    label = 'ATS Home Record';
    color = '#ffcc00';
  } else if (selectedStat === 'ATS Away') {
    wins = stats.atsAway.wins; losses = stats.atsAway.losses; pushes = stats.atsAway.pushes;
    label = 'ATS Away Record';
    color = '#ffcc00';
  } else if (selectedStat === 'ATS Favorite') {
    wins = stats.atsFav.wins; losses = stats.atsFav.losses; pushes = stats.atsFav.pushes;
    label = 'ATS Record as Favorite';
    color = '#ffcc00';
  } else if (selectedStat === 'ATS Underdog') {
    wins = stats.atsDog.wins; losses = stats.atsDog.losses; pushes = stats.atsDog.pushes;
    label = 'ATS Record as Underdog';
    color = '#ffcc00';
  } else if (selectedStat === 'ATS Home Favorite') {
    wins = stats.atsHomeFav.wins; losses = stats.atsHomeFav.losses; pushes = stats.atsHomeFav.pushes;
    label = 'ATS Home Favorite';
    color = '#ffcc00';
  } else if (selectedStat === 'ATS Home Underdog') {
    wins = stats.atsHomeDog.wins; losses = stats.atsHomeDog.losses; pushes = stats.atsHomeDog.pushes;
    label = 'ATS Home Underdog';
    color = '#ffcc00';
  } else if (selectedStat === 'ATS Away Favorite') {
    wins = stats.atsAwayFav.wins; losses = stats.atsAwayFav.losses; pushes = stats.atsAwayFav.pushes;
    label = 'ATS Away Favorite';
    color = '#ffcc00';
  } else if (selectedStat === 'ATS Away Underdog') {
    wins = stats.atsAwayDog.wins; losses = stats.atsAwayDog.losses; pushes = stats.atsAwayDog.pushes;
    label = 'ATS Away Underdog';
    color = '#ffcc00';
  } else if (selectedStat === 'OU Overall') {
    wins = stats.ou.overs; losses = stats.ou.unders; pushes = stats.ou.pushes;
    label = 'Over/Under Overall';
    isOU = true;
    color = '#ff9800';
  } else if (selectedStat === 'OU Home') {
    wins = stats.ouHome.overs; losses = stats.ouHome.unders; pushes = stats.ouHome.pushes;
    label = 'Over/Under Home';
    isOU = true;
    color = '#ff9800';
  } else if (selectedStat === 'OU Away') {
    wins = stats.ouAway.overs; losses = stats.ouAway.unders; pushes = stats.ouAway.pushes;
    label = 'Over/Under Away';
    isOU = true;
    color = '#ff9800';
  }

  const total = wins + losses + pushes;
  if (total === 0) {
    return (
      <div className="control-card" style={{ marginTop: '20px', padding: '24px', textAlign: 'center' }}>
        <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
          <BarChart2 size={20} color={color} /> {label}: {teamName}
        </h3>
        <p style={{ color: '#666', margin: '20px 0' }}>
          No games with spread/total line data found in the database for this filter.
        </p>
      </div>
    );
  }

  const winPctVal = ((wins / (wins + losses || 1)) * 100).toFixed(1);

  return (
    <div className="control-card" style={{ marginTop: '20px', padding: '24px' }}>
      <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <BarChart2 size={20} color={color} /> {label}: {teamName}
      </h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: '40px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '140px', height: '140px' }}>
          <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
            {/* Wins / Overs */}
            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#4caf50" strokeWidth="3.5"
              strokeDasharray={`${(wins / total) * 100} ${100 - (wins / total) * 100}`} strokeDashoffset="0" />
            {/* Losses / Unders */}
            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f44336" strokeWidth="3.5"
              strokeDasharray={`${(losses / total) * 100} ${100 - (losses / total) * 100}`} strokeDashoffset={-((wins / total) * 100)} />
            {/* Pushes */}
            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#ff9800" strokeWidth="3.5"
              strokeDasharray={`${(pushes / total) * 100} ${100 - (pushes / total) * 100}`} strokeDashoffset={-(((wins + losses) / total) * 100)} />
          </svg>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '1.4em', fontWeight: 'bold', color: '#fff' }}>{winPctVal}%</span>
            <span style={{ fontSize: '0.7em', color: '#888' }}>{isOU ? 'Over Rate' : 'Win Rate'}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, minWidth: '200px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#4caf50' }} /> {isOU ? 'Overs' : 'Wins'}</span>
            <span style={{ fontWeight: 'bold', color: '#fff' }}>{wins} <span style={{ fontSize: '0.85em', color: '#888', fontWeight: 'normal' }}>({((wins/total)*100).toFixed(1)}%)</span></span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#f44336' }} /> {isOU ? 'Unders' : 'Losses'}</span>
            <span style={{ fontWeight: 'bold', color: '#fff' }}>{losses} <span style={{ fontSize: '0.85em', color: '#888', fontWeight: 'normal' }}>({((losses/total)*100).toFixed(1)}%)</span></span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#ff9800' }} /> Pushes</span>
            <span style={{ fontWeight: 'bold', color: '#fff' }}>{pushes} <span style={{ fontSize: '0.85em', color: '#888', fontWeight: 'normal' }}>({((pushes/total)*100).toFixed(1)}%)</span></span>
          </div>
        </div>
      </div>
    </div>
  );
};

const CompareRow = ({ label, aVal, bVal, aText, bText, higherIsBetter = true }) => {
  const aWins = higherIsBetter ? aVal > bVal : aVal < bVal;
  const bWins = higherIsBetter ? bVal > aVal : bVal < aVal;
  return (
    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <td style={{ textAlign: 'right', padding: '12px', fontWeight: aWins ? 'bold' : 'normal', color: aWins ? '#4caf50' : '#ccc' }}>{aText}</td>
      <td style={{ textAlign: 'center', padding: '12px', color: '#888', fontSize: '0.85em', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</td>
      <td style={{ textAlign: 'left', padding: '12px', fontWeight: bWins ? 'bold' : 'normal', color: bWins ? '#4caf50' : '#ccc' }}>{bText}</td>
    </tr>
  );
};

const CompareTeamsPanel = ({ teams, conferenceList, timeRange, selectedWeek, selectedSeason }) => {
  const [confA, setConfA] = useState('');
  const [confB, setConfB] = useState('');
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [statsA, setStatsA] = useState(null);
  const [statsB, setStatsB] = useState(null);

  // Filter teams by conference
  const filteredTeamsA = confA ? teams.filter(t => t.conference === confA) : teams;
  const filteredTeamsB = confB ? teams.filter(t => t.conference === confB) : teams;

  const sortedTeamsA = [...filteredTeamsA].sort((a, b) => a.school.localeCompare(b.school));
  const sortedTeamsB = [...filteredTeamsB].sort((a, b) => a.school.localeCompare(b.school));

  // Auto-select first team when list changes
  useEffect(() => {
    if (sortedTeamsA.length) {
      setTeamA(sortedTeamsA[0].school);
    }
  }, [confA]);

  useEffect(() => {
    if (sortedTeamsB.length) {
      setTeamB(sortedTeamsB[0].school);
    }
  }, [confB]);

  useEffect(() => {
    if (!teamA) return;
    fetch(`/api/research/${encodeURIComponent(teamA)}?range=${timeRange}&week=${selectedWeek}&season=${selectedSeason}`)
      .then(r => r.json())
      .then(data => setStatsA(data))
      .catch(() => {});
  }, [teamA, timeRange, selectedWeek, selectedSeason]);

  useEffect(() => {
    if (!teamB) return;
    fetch(`/api/research/${encodeURIComponent(teamB)}?range=${timeRange}&week=${selectedWeek}&season=${selectedSeason}`)
      .then(r => r.json())
      .then(data => setStatsB(data))
      .catch(() => {});
  }, [teamB, timeRange, selectedWeek, selectedSeason]);

  const teamAObj = teams.find(t => t.school === teamA);
  const teamBObj = teams.find(t => t.school === teamB);

  // Find head-to-head games
  const h2hGames = statsA?.recent.filter(g => g.opponent === teamB) || [];

  return (
    <div>
      <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
        {/* Team A Selectors */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '140px' }}>
          <label style={{ fontSize: '0.85em', color: '#888' }}>Team A Conference:</label>
          <select value={confA} onChange={e => setConfA(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', background: '#1e1e2e', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}>
            <option value="">All Conferences</option>
            {conferenceList.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <label style={{ fontSize: '0.85em', color: '#888' }}>Team A:</label>
          <select value={teamA} onChange={e => setTeamA(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', background: '#1e1e2e', color: '#4d7cff', border: '1px solid rgba(255,255,255,0.15)', fontWeight: 'bold' }}>
            {sortedTeamsA.map(t => <option key={t.id} value={t.school}>{t.school}</option>)}
          </select>
        </div>

        <ArrowLeftRight size={24} color="#555" style={{ marginTop: '24px' }} />

        {/* Team B Selectors */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '140px' }}>
          <label style={{ fontSize: '0.85em', color: '#888' }}>Team B Conference:</label>
          <select value={confB} onChange={e => setConfB(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', background: '#1e1e2e', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}>
            <option value="">All Conferences</option>
            {conferenceList.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <label style={{ fontSize: '0.85em', color: '#888' }}>Team B:</label>
          <select value={teamB} onChange={e => setTeamB(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', background: '#1e1e2e', color: '#fc6363', border: '1px solid rgba(255,255,255,0.15)', fontWeight: 'bold' }}>
            {sortedTeamsB.map(t => <option key={t.id} value={t.school}>{t.school}</option>)}
          </select>
        </div>
      </div>

      {statsA && statsB ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="panel" style={{ background: 'rgba(0,0,0,0.15)', padding: '20px' }}>
            <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '400px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.08)' }}>
                  <th style={{ textAlign: 'right', padding: '12px', color: '#4d7cff', fontSize: '1.2em', width: '40%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                      {teamAObj?.logo && <img src={teamAObj.logo} alt="" style={{ height: '24px', width: '24px', objectFit: 'contain' }} />}
                      {teamA}
                    </div>
                  </th>
                  <th style={{ textAlign: 'center', padding: '12px', color: '#555', fontSize: '0.8em', textTransform: 'uppercase', letterSpacing: '0.05em', width: '20%' }}>Stat</th>
                  <th style={{ textAlign: 'left', padding: '12px', color: '#fc6363', fontSize: '1.2em', width: '40%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '8px' }}>
                      {teamBObj?.logo && <img src={teamBObj.logo} alt="" style={{ height: '24px', width: '24px', objectFit: 'contain' }} />}
                      {teamB}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* SU Records */}
                <CompareRow label="SU Overall" 
                  aVal={winPctVal(statsA.su.wins, statsA.su.losses)} bVal={winPctVal(statsB.su.wins, statsB.su.losses)}
                  aText={`${statsA.su.wins}-${statsA.su.losses}-${statsA.su.pushes} (${winPct(statsA.su.wins, statsA.su.losses)})`}
                  bText={`${statsB.su.wins}-${statsB.su.losses}-${statsB.su.pushes} (${winPct(statsB.su.wins, statsB.su.losses)})`} />
                <CompareRow label="SU Home" 
                  aVal={winPctVal(statsA.suHome.wins, statsA.suHome.losses)} bVal={winPctVal(statsB.suHome.wins, statsB.suHome.losses)}
                  aText={`${statsA.suHome.wins}-${statsA.suHome.losses}-${statsA.suHome.pushes} (${winPct(statsA.suHome.wins, statsA.suHome.losses)})`}
                  bText={`${statsB.suHome.wins}-${statsB.suHome.losses}-${statsB.suHome.pushes} (${winPct(statsB.suHome.wins, statsB.suHome.losses)})`} />
                <CompareRow label="SU Away" 
                  aVal={winPctVal(statsA.suAway.wins, statsA.suAway.losses)} bVal={winPctVal(statsB.suAway.wins, statsB.suAway.losses)}
                  aText={`${statsA.suAway.wins}-${statsA.suAway.losses}-${statsA.suAway.pushes} (${winPct(statsA.suAway.wins, statsA.suAway.losses)})`}
                  bText={`${statsB.suAway.wins}-${statsB.suAway.losses}-${statsB.suAway.pushes} (${winPct(statsB.suAway.wins, statsB.suAway.losses)})`} />
                <CompareRow label="SU as Favorite" 
                  aVal={winPctVal(statsA.suFav.wins, statsA.suFav.losses)} bVal={winPctVal(statsB.suFav.wins, statsB.suFav.losses)}
                  aText={`${statsA.suFav.wins}-${statsA.suFav.losses}-${statsA.suFav.pushes} (${winPct(statsA.suFav.wins, statsA.suFav.losses)})`}
                  bText={`${statsB.suFav.wins}-${statsB.suFav.losses}-${statsB.suFav.pushes} (${winPct(statsB.suFav.wins, statsB.suFav.losses)})`} />
                <CompareRow label="SU as Underdog" 
                  aVal={winPctVal(statsA.suDog.wins, statsA.suDog.losses)} bVal={winPctVal(statsB.suDog.wins, statsB.suDog.losses)}
                  aText={`${statsA.suDog.wins}-${statsA.suDog.losses}-${statsA.suDog.pushes} (${winPct(statsA.suDog.wins, statsA.suDog.losses)})`}
                  bText={`${statsB.suDog.wins}-${statsB.suDog.losses}-${statsB.suDog.pushes} (${winPct(statsB.suDog.wins, statsB.suDog.losses)})`} />
                <CompareRow label="SU Home Favorite" 
                  aVal={winPctVal(statsA.suHomeFav.wins, statsA.suHomeFav.losses)} bVal={winPctVal(statsB.suHomeFav.wins, statsB.suHomeFav.losses)}
                  aText={`${statsA.suHomeFav.wins}-${statsA.suHomeFav.losses}-${statsA.suHomeFav.pushes} (${winPct(statsA.suHomeFav.wins, statsA.suHomeFav.losses)})`}
                  bText={`${statsB.suHomeFav.wins}-${statsB.suHomeFav.losses}-${statsB.suHomeFav.pushes} (${winPct(statsB.suHomeFav.wins, statsB.suHomeFav.losses)})`} />
                <CompareRow label="SU Home Underdog" 
                  aVal={winPctVal(statsA.suHomeDog.wins, statsA.suHomeDog.losses)} bVal={winPctVal(statsB.suHomeDog.wins, statsB.suHomeDog.losses)}
                  aText={`${statsA.suHomeDog.wins}-${statsA.suHomeDog.losses}-${statsA.suHomeDog.pushes} (${winPct(statsA.suHomeDog.wins, statsA.suHomeDog.losses)})`}
                  bText={`${statsB.suHomeDog.wins}-${statsB.suHomeDog.losses}-${statsB.suHomeDog.pushes} (${winPct(statsB.suHomeDog.wins, statsB.suHomeDog.losses)})`} />
                <CompareRow label="SU Away Favorite" 
                  aVal={winPctVal(statsA.suAwayFav.wins, statsA.suAwayFav.losses)} bVal={winPctVal(statsB.suAwayFav.wins, statsB.suAwayFav.losses)}
                  aText={`${statsA.suAwayFav.wins}-${statsA.suAwayFav.losses}-${statsA.suAwayFav.pushes} (${winPct(statsA.suAwayFav.wins, statsA.suAwayFav.losses)})`}
                  bText={`${statsB.suAwayFav.wins}-${statsB.suAwayFav.losses}-${statsB.suAwayFav.pushes} (${winPct(statsB.suAwayFav.wins, statsB.suAwayFav.losses)})`} />
                <CompareRow label="SU Away Underdog" 
                  aVal={winPctVal(statsA.suAwayDog.wins, statsA.suAwayDog.losses)} bVal={winPctVal(statsB.suAwayDog.wins, statsB.suAwayDog.losses)}
                  aText={`${statsA.suAwayDog.wins}-${statsA.suAwayDog.losses}-${statsA.suAwayDog.pushes} (${winPct(statsA.suAwayDog.wins, statsA.suAwayDog.losses)})`}
                  bText={`${statsB.suAwayDog.wins}-${statsB.suAwayDog.losses}-${statsB.suAwayDog.pushes} (${winPct(statsB.suAwayDog.wins, statsB.suAwayDog.losses)})`} />

                {/* ATS Records */}
                <CompareRow label="ATS Overall" 
                  aVal={winPctVal(statsA.ats.wins, statsA.ats.losses)} bVal={winPctVal(statsB.ats.wins, statsB.ats.losses)}
                  aText={`${statsA.ats.wins}-${statsA.ats.losses}-${statsA.ats.pushes} (${winPct(statsA.ats.wins, statsA.ats.losses)})`}
                  bText={`${statsB.ats.wins}-${statsB.ats.losses}-${statsB.ats.pushes} (${winPct(statsB.ats.wins, statsB.ats.losses)})`} />
                <CompareRow label="ATS Home" 
                  aVal={winPctVal(statsA.atsHome.wins, statsA.atsHome.losses)} bVal={winPctVal(statsB.atsHome.wins, statsB.atsHome.losses)}
                  aText={`${statsA.atsHome.wins}-${statsA.atsHome.losses}-${statsA.atsHome.pushes} (${winPct(statsA.atsHome.wins, statsA.atsHome.losses)})`}
                  bText={`${statsB.atsHome.wins}-${statsB.atsHome.losses}-${statsB.atsHome.pushes} (${winPct(statsB.atsHome.wins, statsB.atsHome.losses)})`} />
                <CompareRow label="ATS Away" 
                  aVal={winPctVal(statsA.atsAway.wins, statsA.atsAway.losses)} bVal={winPctVal(statsB.atsAway.wins, statsB.atsAway.losses)}
                  aText={`${statsA.atsAway.wins}-${statsA.atsAway.losses}-${statsA.atsAway.pushes} (${winPct(statsA.atsAway.wins, statsA.atsAway.losses)})`}
                  bText={`${statsB.atsAway.wins}-${statsB.atsAway.losses}-${statsB.atsAway.pushes} (${winPct(statsB.atsAway.wins, statsB.atsAway.losses)})`} />
                <CompareRow label="ATS as Favorite" 
                  aVal={winPctVal(statsA.atsFav.wins, statsA.atsFav.losses)} bVal={winPctVal(statsB.atsFav.wins, statsB.atsFav.losses)}
                  aText={`${statsA.atsFav.wins}-${statsA.atsFav.losses}-${statsA.atsFav.pushes} (${winPct(statsA.atsFav.wins, statsA.atsFav.losses)})`}
                  bText={`${statsB.atsFav.wins}-${statsB.atsFav.losses}-${statsB.atsFav.pushes} (${winPct(statsB.atsFav.wins, statsB.atsFav.losses)})`} />
                <CompareRow label="ATS as Underdog" 
                  aVal={winPctVal(statsA.atsDog.wins, statsA.atsDog.losses)} bVal={winPctVal(statsB.atsDog.wins, statsB.atsDog.losses)}
                  aText={`${statsA.atsDog.wins}-${statsA.atsDog.losses}-${statsA.atsDog.pushes} (${winPct(statsA.atsDog.wins, statsA.atsDog.losses)})`}
                  bText={`${statsB.atsDog.wins}-${statsB.atsDog.losses}-${statsB.atsDog.pushes} (${winPct(statsB.atsDog.wins, statsB.atsDog.losses)})`} />
                <CompareRow label="ATS Home Favorite" 
                  aVal={winPctVal(statsA.atsHomeFav.wins, statsA.atsHomeFav.losses)} bVal={winPctVal(statsB.atsHomeFav.wins, statsB.atsHomeFav.losses)}
                  aText={`${statsA.atsHomeFav.wins}-${statsA.atsHomeFav.losses}-${statsA.atsHomeFav.pushes} (${winPct(statsA.atsHomeFav.wins, statsA.atsHomeFav.losses)})`}
                  bText={`${statsB.atsHomeFav.wins}-${statsB.atsHomeFav.losses}-${statsB.atsHomeFav.pushes} (${winPct(statsB.atsHomeFav.wins, statsB.atsHomeFav.losses)})`} />
                <CompareRow label="ATS Home Underdog" 
                  aVal={winPctVal(statsA.atsHomeDog.wins, statsA.atsHomeDog.losses)} bVal={winPctVal(statsB.atsHomeDog.wins, statsB.atsHomeDog.losses)}
                  aText={`${statsA.atsHomeDog.wins}-${statsA.atsHomeDog.losses}-${statsA.atsHomeDog.pushes} (${winPct(statsA.atsHomeDog.wins, statsA.atsHomeDog.losses)})`}
                  bText={`${statsB.atsHomeDog.wins}-${statsB.atsHomeDog.losses}-${statsB.atsHomeDog.pushes} (${winPct(statsB.atsHomeDog.wins, statsB.atsHomeDog.losses)})`} />
                <CompareRow label="ATS Away Favorite" 
                  aVal={winPctVal(statsA.atsAwayFav.wins, statsA.atsAwayFav.losses)} bVal={winPctVal(statsB.atsAwayFav.wins, statsB.atsAwayFav.losses)}
                  aText={`${statsA.atsAwayFav.wins}-${statsA.atsAwayFav.losses}-${statsA.atsAwayFav.pushes} (${winPct(statsA.atsAwayFav.wins, statsA.atsAwayFav.losses)})`}
                  bText={`${statsB.atsAwayFav.wins}-${statsB.atsAwayFav.losses}-${statsB.atsAwayFav.pushes} (${winPct(statsB.atsAwayFav.wins, statsB.atsAwayFav.losses)})`} />
                <CompareRow label="ATS Away Underdog" 
                  aVal={winPctVal(statsA.atsAwayDog.wins, statsA.atsAwayDog.losses)} bVal={winPctVal(statsB.atsAwayDog.wins, statsB.atsAwayDog.losses)}
                  aText={`${statsA.atsAwayDog.wins}-${statsA.atsAwayDog.losses}-${statsA.atsAwayDog.pushes} (${winPct(statsA.atsAwayDog.wins, statsA.atsAwayDog.losses)})`}
                  bText={`${statsB.atsAwayDog.wins}-${statsB.atsAwayDog.losses}-${statsB.atsAwayDog.pushes} (${winPct(statsB.atsAwayDog.wins, statsB.atsAwayDog.losses)})`} />

                {/* O/U Records */}
                <CompareRow label="O/U Overall" 
                  aVal={winPctVal(statsA.ou.overs, statsA.ou.unders)} bVal={winPctVal(statsB.ou.overs, statsB.ou.unders)}
                  aText={`${statsA.ou.overs}-${statsA.ou.unders}-${statsA.ou.pushes} (${winPct(statsA.ou.overs, statsA.ou.unders)})`}
                  bText={`${statsB.ou.overs}-${statsB.ou.unders}-${statsB.ou.pushes} (${winPct(statsB.ou.overs, statsB.ou.unders)})`} />
                <CompareRow label="O/U Home" 
                  aVal={winPctVal(statsA.ouHome.overs, statsA.ouHome.unders)} bVal={winPctVal(statsB.ouHome.overs, statsB.ouHome.unders)}
                  aText={`${statsA.ouHome.overs}-${statsA.ouHome.unders}-${statsA.ouHome.pushes} (${winPct(statsA.ouHome.overs, statsA.ouHome.unders)})`}
                  bText={`${statsB.ouHome.overs}-${statsB.ouHome.unders}-${statsB.ouHome.pushes} (${winPct(statsB.ouHome.overs, statsB.ouHome.unders)})`} />
                <CompareRow label="O/U Away" 
                  aVal={winPctVal(statsA.ouAway.overs, statsA.ouAway.unders)} bVal={winPctVal(statsB.ouAway.overs, statsB.ouAway.unders)}
                  aText={`${statsA.ouAway.overs}-${statsA.ouAway.unders}-${statsA.ouAway.pushes} (${winPct(statsA.ouAway.overs, statsA.ouAway.unders)})`}
                  bText={`${statsB.ouAway.overs}-${statsB.ouAway.unders}-${statsB.ouAway.pushes} (${winPct(statsB.ouAway.overs, statsB.ouAway.unders)})`} />
              </tbody>
            </table>
            </div>
          </div>

          {/* Head to Head Games */}
          <div className="panel" style={{ background: 'rgba(0,0,0,0.2)' }}>
            <h4>Head-to-Head History ({h2hGames.length} games)</h4>
            {h2hGames.length === 0 ? (
              <p style={{ color: '#666', margin: '10px 0 0' }}>No head-to-head games found in the database.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', marginTop: '10px', minWidth: '480px' }}>
                <thead>
                  <tr>
                    <th>Season/Week</th>
                    <th>Location</th>
                    <th>Score</th>
                    <th>Spread</th>
                    <th>ATS Result</th>
                    <th>O/U Line</th>
                    <th>O/U Result</th>
                  </tr>
                </thead>
                <tbody>
                  {h2hGames.map((g, idx) => {
                    const scoreStr = `${g.teamScore} - ${g.oppScore}`;
                    const isWin = g.suResult === 'win';
                    const isLoss = g.suResult === 'loss';
                    const isCover = g.atsResult === 'win';
                    const isAtsLoss = g.atsResult === 'loss';
                    const isOver = g.ouResult === 'over';
                    const isUnder = g.ouResult === 'under';

                    return (
                      <tr key={idx}>
                        <td style={{ textAlign: 'center' }}>{g.season} W{g.week}</td>
                        <td style={{ textAlign: 'center' }}>{g.isHome ? 'Home' : 'Away'}</td>
                        <td style={{ textAlign: 'center', fontWeight: 'bold', color: isWin ? '#4caf50' : isLoss ? '#f44336' : '#ccc' }}>
                          {isWin ? `${teamA} won` : `${teamB} won`} ({scoreStr})
                        </td>
                        <td style={{ textAlign: 'center' }}>{g.spread !== null ? (g.spread > 0 ? `+${g.spread}` : g.spread) : '—'}</td>
                        <td style={{ textAlign: 'center', fontWeight: 'bold', color: isCover ? '#4caf50' : isAtsLoss ? '#f44336' : '#ccc' }}>
                          {isCover ? `${teamA} covered` : `${teamB} covered`}
                        </td>
                        <td style={{ textAlign: 'center' }}>{g.overUnder !== null ? g.overUnder : '—'}</td>
                        <td style={{ textAlign: 'center', fontWeight: 'bold', color: isOver ? '#ff9800' : isUnder ? '#2196f3' : '#ccc' }}>
                          {g.ouResult.toUpperCase()} ({g.teamScore + g.oppScore})
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ color: '#888', padding: '20px' }}>Loading comparison data...</div>
      )}
    </div>
  );
};


const ConferencePanel = ({ conferenceList }) => {
  const [selectedConf, setSelectedConf] = useState(conferenceList[0] || '');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedStat, setSelectedStat] = useState('SU Overall');

  useEffect(() => {
    if (!selectedConf) return;
    setLoading(true);
    fetch(`/api/research/conference/${encodeURIComponent(selectedConf)}`)
      .then(r => r.json())
      .then(data => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedConf]);

  return (
    <div>
      <div className="controls" style={{ padding: 0, marginBottom: '24px' }}>
        <label>
          Select Conference:
          <select value={selectedConf} onChange={(e) => setSelectedConf(e.target.value)} style={{ minWidth: '160px', maxWidth: '100%' }}>
            {conferenceList.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>

      {loading && <div style={{ color: '#888', padding: '20px' }}>Loading conference research data...</div>}

      {!loading && stats && (
        <div>
          {/* SU Section */}
          <h3 style={{ marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px' }}>Straight Up (SU) Records</h3>
          <div className="manual-grid research-grid-3" style={{ marginBottom: '24px' }}>
            <StatCard label="SU Overall" value={`${stats.su.wins}-${stats.su.losses}-${stats.su.pushes}`}
              sub={`Win %: ${winPct(stats.su.wins, stats.su.losses)}`} icon={<BarChart2 size={40} />}
              onClick={() => setSelectedStat('SU Overall')} active={selectedStat === 'SU Overall'} />
            <StatCard label="SU Home" value={`${stats.suHome.wins}-${stats.suHome.losses}-${stats.suHome.pushes}`}
              sub={`Win %: ${winPct(stats.suHome.wins, stats.suHome.losses)}`} icon={<Home size={40} />}
              onClick={() => setSelectedStat('SU Home')} active={selectedStat === 'SU Home'} />
            <StatCard label="SU Away" value={`${stats.suAway.wins}-${stats.suAway.losses}-${stats.suAway.pushes}`}
              sub={`Win %: ${winPct(stats.suAway.wins, stats.suAway.losses)}`} icon={<Compass size={40} />}
              onClick={() => setSelectedStat('SU Away')} active={selectedStat === 'SU Away'} />
            <StatCard label="SU Favorite" value={`${stats.suFav.wins}-${stats.suFav.losses}-${stats.suFav.pushes}`}
              sub={`Win %: ${winPct(stats.suFav.wins, stats.suFav.losses)}`} icon={<Trophy size={40} />}
              onClick={() => setSelectedStat('SU Favorite')} active={selectedStat === 'SU Favorite'} />
            <StatCard label="SU Underdog" value={`${stats.suDog.wins}-${stats.suDog.losses}-${stats.suDog.pushes}`}
              sub={`Win %: ${winPct(stats.suDog.wins, stats.suDog.losses)}`} icon={<Flame size={40} />}
              onClick={() => setSelectedStat('SU Underdog')} active={selectedStat === 'SU Underdog'} />
            <StatCard label="SU Home Favorite" value={`${stats.suHomeFav.wins}-${stats.suHomeFav.losses}-${stats.suHomeFav.pushes}`}
              sub={`Win %: ${winPct(stats.suHomeFav.wins, stats.suHomeFav.losses)}`} icon={<Home size={40} />}
              onClick={() => setSelectedStat('SU Home Favorite')} active={selectedStat === 'SU Home Favorite'} />
            <StatCard label="SU Home Underdog" value={`${stats.suHomeDog.wins}-${stats.suHomeDog.losses}-${stats.suHomeDog.pushes}`}
              sub={`Win %: ${winPct(stats.suHomeDog.wins, stats.suHomeDog.losses)}`} icon={<Home size={40} />}
              onClick={() => setSelectedStat('SU Home Underdog')} active={selectedStat === 'SU Home Underdog'} />
            <StatCard label="SU Away Favorite" value={`${stats.suAwayFav.wins}-${stats.suAwayFav.losses}-${stats.suAwayFav.pushes}`}
              sub={`Win %: ${winPct(stats.suAwayFav.wins, stats.suAwayFav.losses)}`} icon={<Compass size={40} />}
              onClick={() => setSelectedStat('SU Away Favorite')} active={selectedStat === 'SU Away Favorite'} />
            <StatCard label="SU Away Underdog" value={`${stats.suAwayDog.wins}-${stats.suAwayDog.losses}-${stats.suAwayDog.pushes}`}
              sub={`Win %: ${winPct(stats.suAwayDog.wins, stats.suAwayDog.losses)}`} icon={<Compass size={40} />}
              onClick={() => setSelectedStat('SU Away Underdog')} active={selectedStat === 'SU Away Underdog'} />
          </div>

          {/* ATS Section */}
          <h3 style={{ marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px' }}>Against the Spread (ATS) Records</h3>
          <div className="manual-grid research-grid-3" style={{ marginBottom: '24px' }}>
            <StatCard label="ATS Overall" value={`${stats.ats.wins}-${stats.ats.losses}-${stats.ats.pushes}`}
              sub={`Cover %: ${winPct(stats.ats.wins, stats.ats.losses)}`} icon={<BarChart2 size={40} />} color="#ffcc00"
              onClick={() => setSelectedStat('ATS Overall')} active={selectedStat === 'ATS Overall'} />
            <StatCard label="ATS Home" value={`${stats.atsHome.wins}-${stats.atsHome.losses}-${stats.atsHome.pushes}`}
              sub={`Cover %: ${winPct(stats.atsHome.wins, stats.atsHome.losses)}`} icon={<Home size={40} />} color="#ffcc00"
              onClick={() => setSelectedStat('ATS Home')} active={selectedStat === 'ATS Home'} />
            <StatCard label="ATS Away" value={`${stats.atsAway.wins}-${stats.atsAway.losses}-${stats.atsAway.pushes}`}
              sub={`Cover %: ${winPct(stats.atsAway.wins, stats.atsAway.losses)}`} icon={<Compass size={40} />} color="#ffcc00"
              onClick={() => setSelectedStat('ATS Away')} active={selectedStat === 'ATS Away'} />
            <StatCard label="ATS Favorite" value={`${stats.atsFav.wins}-${stats.atsFav.losses}-${stats.atsFav.pushes}`}
              sub={`Cover %: ${winPct(stats.atsFav.wins, stats.atsFav.losses)}`} icon={<Trophy size={40} />} color="#ffcc00"
              onClick={() => setSelectedStat('ATS Favorite')} active={selectedStat === 'ATS Favorite'} />
            <StatCard label="ATS Underdog" value={`${stats.atsDog.wins}-${stats.atsDog.losses}-${stats.atsDog.pushes}`}
              sub={`Cover %: ${winPct(stats.atsDog.wins, stats.atsDog.losses)}`} icon={<Flame size={40} />} color="#ffcc00"
              onClick={() => setSelectedStat('ATS Underdog')} active={selectedStat === 'ATS Underdog'} />
            <StatCard label="ATS Home Favorite" value={`${stats.atsHomeFav.wins}-${stats.atsHomeFav.losses}-${stats.atsHomeFav.pushes}`}
              sub={`Cover %: ${winPct(stats.atsHomeFav.wins, stats.atsHomeFav.losses)}`} icon={<Home size={40} />} color="#ffcc00"
              onClick={() => setSelectedStat('ATS Home Favorite')} active={selectedStat === 'ATS Home Favorite'} />
            <StatCard label="ATS Home Underdog" value={`${stats.atsHomeDog.wins}-${stats.atsHomeDog.losses}-${stats.atsHomeDog.pushes}`}
              sub={`Cover %: ${winPct(stats.atsHomeDog.wins, stats.atsHomeDog.losses)}`} icon={<Home size={40} />} color="#ffcc00"
              onClick={() => setSelectedStat('ATS Home Underdog')} active={selectedStat === 'ATS Home Underdog'} />
            <StatCard label="ATS Away Favorite" value={`${stats.atsAwayFav.wins}-${stats.atsAwayFav.losses}-${stats.atsAwayFav.pushes}`}
              sub={`Cover %: ${winPct(stats.atsAwayFav.wins, stats.atsAwayFav.losses)}`} icon={<Compass size={40} />} color="#ffcc00"
              onClick={() => setSelectedStat('ATS Away Favorite')} active={selectedStat === 'ATS Away Favorite'} />
            <StatCard label="ATS Away Underdog" value={`${stats.atsAwayDog.wins}-${stats.atsAwayDog.losses}-${stats.atsAwayDog.pushes}`}
              sub={`Cover %: ${winPct(stats.atsAwayDog.wins, stats.atsAwayDog.losses)}`} icon={<Compass size={40} />} color="#ffcc00"
              onClick={() => setSelectedStat('ATS Away Underdog')} active={selectedStat === 'ATS Away Underdog'} />
          </div>

          {/* O/U Section */}
          <h3 style={{ marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px' }}>Over/Under Records</h3>
          <div className="manual-grid" style={{ marginBottom: '24px' }}>
            <StatCard label="O/U Overall" value={`${stats.ou.overs}-${stats.ou.unders}-${stats.ou.pushes}`}
              sub={`Over %: ${winPct(stats.ou.overs, stats.ou.unders)}`} icon={<BarChart2 size={40} />} color="#ff9800"
              onClick={() => setSelectedStat('OU Overall')} active={selectedStat === 'OU Overall'} />
            <StatCard label="O/U Home" value={`${stats.ouHome.overs}-${stats.ouHome.unders}-${stats.ouHome.pushes}`}
              sub={`Over %: ${winPct(stats.ouHome.overs, stats.ouHome.unders)}`} icon={<Home size={40} />} color="#ff9800"
              onClick={() => setSelectedStat('OU Home')} active={selectedStat === 'OU Home'} />
            <StatCard label="O/U Away" value={`${stats.ouAway.overs}-${stats.ouAway.unders}-${stats.ouAway.pushes}`}
              sub={`Over %: ${winPct(stats.ouAway.overs, stats.ouAway.unders)}`} icon={<Compass size={40} />} color="#ff9800"
              onClick={() => setSelectedStat('OU Away')} active={selectedStat === 'OU Away'} />
          </div>

          {/* Interactive Chart */}
          <ResearchChart selectedStat={selectedStat} teamName={selectedConf} stats={stats} />

          {/* Recent Games Table */}
          <div className="panel" style={{ marginTop: '32px', background: 'rgba(0,0,0,0.2)' }}>
            <h4>Recent Games involving ${selectedConf} teams</h4>
            <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', marginTop: '10px', minWidth: '560px' }}>
              <thead>
                <tr>
                  <th>Season/Week</th>
                  <th style={{ textAlign: 'left' }}>Team</th>
                  <th style={{ textAlign: 'left' }}>Opponent</th>
                  <th>Score</th>
                  <th>Spread</th>
                  <th>ATS Result</th>
                  <th>O/U Line</th>
                  <th>O/U Result</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent.map((g, idx) => {
                  const scoreStr = `${g.teamScore} - ${g.oppScore}`;
                  const isWin = g.suResult === 'win';
                  const isLoss = g.suResult === 'loss';
                  const isCover = g.atsResult === 'win';
                  const isAtsLoss = g.atsResult === 'loss';
                  const isOver = g.ouResult === 'over';
                  const isUnder = g.ouResult === 'under';

                  return (
                    <tr key={idx}>
                      <td style={{ textAlign: 'center' }}>{g.season} W{g.week}</td>
                      <td style={{ fontWeight: 'bold' }}>{g.teamName}</td>
                      <td style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#888', fontSize: '0.85em' }}>{g.isHome ? 'vs' : '@'}</span>
                        {g.opponent}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold', color: isWin ? '#4caf50' : isLoss ? '#f44336' : '#ccc' }}>
                        {g.suResult.toUpperCase()} {scoreStr}
                      </td>
                      <td style={{ textAlign: 'center' }}>{g.spread !== null ? (g.spread > 0 ? `+${g.spread}` : g.spread) : '-'}</td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold', color: isCover ? '#4caf50' : isAtsLoss ? '#f44336' : '#ccc' }}>
                        {g.atsResult.toUpperCase()}
                      </td>
                      <td style={{ textAlign: 'center' }}>{g.overUnder !== null ? g.overUnder : '-'}</td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold', color: isOver ? '#ff9800' : isUnder ? '#2196f3' : '#ccc' }}>
                        {g.ouResult.toUpperCase()} ({g.teamScore + g.oppScore})
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const RankingsPanel = ({ timeRange, selectedWeek, selectedSeason }) => {
  const [entity, setEntity] = useState('school');
  const [stat, setStat] = useState('su');
  const [location, setLocation] = useState('both');
  const [role, setRole] = useState('either');
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ entity, stat, location, role });
        if (timeRange) params.set('range', timeRange);
        if (selectedWeek) params.set('week', selectedWeek);
        if (selectedSeason) params.set('season', selectedSeason);
        const res = await fetch(`/api/research/rankings?${params}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setRankings(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRankings();
  }, [entity, stat, location, role, timeRange, selectedWeek, selectedSeason]);

  const toggleStyle = (active) => ({
    padding: '6px 14px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: active ? 'bold' : 'normal',
    backgroundColor: active ? 'rgba(77,124,255,0.25)' : 'rgba(255,255,255,0.06)',
    color: active ? '#4d7cff' : '#aaa',
  });

  const maxWinPct = rankings.length > 0 ? Math.max(...rankings.map(r => Number(r.win_pct) || 0)) : 100;

  return (
    <div>
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>Entity</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button style={toggleStyle(entity === 'school')} onClick={() => setEntity('school')}>School</button>
            <button style={toggleStyle(entity === 'conference')} onClick={() => setEntity('conference')}>Conference</button>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>Stat</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button style={toggleStyle(stat === 'su')} onClick={() => setStat('su')}>SU</button>
            <button style={toggleStyle(stat === 'ats')} onClick={() => setStat('ats')}>ATS</button>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>Location</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button style={toggleStyle(location === 'both')} onClick={() => setLocation('both')}>Both</button>
            <button style={toggleStyle(location === 'home')} onClick={() => setLocation('home')}>Home</button>
            <button style={toggleStyle(location === 'away')} onClick={() => setLocation('away')}>Away</button>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>Role</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button style={toggleStyle(role === 'either')} onClick={() => setRole('either')}>Either</button>
            <button style={toggleStyle(role === 'favorite')} onClick={() => setRole('favorite')}>Favorite</button>
            <button style={toggleStyle(role === 'underdog')} onClick={() => setRole('underdog')}>Underdog</button>
          </div>
        </div>
      </div>

      {loading && <div style={{ color: '#888', padding: '20px' }}>Loading rankings...</div>}
      {error && <div style={{ color: '#f44', padding: '20px' }}>Error: {error}</div>}

      {!loading && !error && rankings.length === 0 && (
        <div style={{ color: '#888', padding: '20px' }}>No data found for selected filters.</div>
      )}

      {!loading && !error && rankings.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.12)', color: '#888', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px', width: '40px' }}>#</th>
                <th style={{ padding: '8px 12px' }}>{entity === 'school' ? 'Team' : 'Conference'}</th>
                <th style={{ padding: '8px 12px', textAlign: 'center' }}>W-L-P</th>
                <th style={{ padding: '8px 12px', textAlign: 'center' }}>Games</th>
                <th style={{ padding: '8px 12px', minWidth: '160px' }}>Win %</th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((row, i) => (
                <tr key={row.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '10px 12px', color: i < 3 ? '#4d7cff' : '#666', fontWeight: i < 3 ? 'bold' : 'normal' }}>{i + 1}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {entity === 'school' && row.logo && (
                        <img src={row.logo} alt="" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                      )}
                      <span style={{ fontWeight: 500 }}>{row.name}</span>
                      {entity === 'school' && <span style={{ fontSize: '12px', color: '#666' }}>{row.conference}</span>}
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontFamily: 'monospace' }}>
                    {row.wins}-{row.losses}-{row.pushes}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: '#888' }}>{row.total}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${maxWinPct > 0 ? (Number(row.win_pct) / maxWinPct) * 100 : 0}%`, height: '100%', background: '#4d7cff', borderRadius: '4px' }} />
                      </div>
                      <span style={{ minWidth: '52px', textAlign: 'right', fontFamily: 'monospace', fontSize: '13px' }}>
                        {row.win_pct != null ? `${row.win_pct}%` : 'N/A'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const CompareConferencesPanel = ({ teams, conferenceList }) => {
  const [confA, setConfA] = useState(conferenceList[0] || '');
  const [confB, setConfB] = useState(conferenceList[1] || conferenceList[0] || '');
  const [statsA, setStatsA] = useState(null);
  const [statsB, setStatsB] = useState(null);

  useEffect(() => {
    if (!confA) return;
    fetch(`/api/research/conference/${encodeURIComponent(confA)}`)
      .then(r => r.json())
      .then(data => setStatsA(data))
      .catch(() => {});
  }, [confA]);

  useEffect(() => {
    if (!confB) return;
    fetch(`/api/research/conference/${encodeURIComponent(confB)}`)
      .then(r => r.json())
      .then(data => setStatsB(data))
      .catch(() => {});
  }, [confB]);

  // Find head-to-head games between the two conferences
  const confBTeams = teams.filter(t => t.conference === confB).map(t => t.school);
  const h2hGames = statsA?.recent.filter(g => confBTeams.includes(g.opponent)) || [];

  return (
    <div>
      <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
        {/* Conference A Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '140px' }}>
          <label style={{ fontSize: '0.85em', color: '#888' }}>Conference A:</label>
          <select value={confA} onChange={e => setConfA(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', background: '#1e1e2e', color: '#4d7cff', border: '1px solid rgba(255,255,255,0.15)', fontWeight: 'bold' }}>
            {conferenceList.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <ArrowLeftRight size={24} color="#555" style={{ marginTop: '24px' }} />

        {/* Conference B Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '140px' }}>
          <label style={{ fontSize: '0.85em', color: '#888' }}>Conference B:</label>
          <select value={confB} onChange={e => setConfB(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', background: '#1e1e2e', color: '#fc6363', border: '1px solid rgba(255,255,255,0.15)', fontWeight: 'bold' }}>
            {conferenceList.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {statsA && statsB ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="panel" style={{ background: 'rgba(0,0,0,0.15)', padding: '20px' }}>
            <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '400px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.08)' }}>
                  <th style={{ textAlign: 'right', padding: '12px', color: '#4d7cff', fontSize: '1.2em', width: '40%' }}>
                    {confA}
                  </th>
                  <th style={{ textAlign: 'center', padding: '12px', color: '#555', fontSize: '0.8em', textTransform: 'uppercase', letterSpacing: '0.05em', width: '20%' }}>Stat</th>
                  <th style={{ textAlign: 'left', padding: '12px', color: '#fc6363', fontSize: '1.2em', width: '40%' }}>
                    {confB}
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* SU Records */}
                <CompareRow label="SU Overall" 
                  aVal={winPctVal(statsA.su.wins, statsA.su.losses)} bVal={winPctVal(statsB.su.wins, statsB.su.losses)}
                  aText={`${statsA.su.wins}-${statsA.su.losses}-${statsA.su.pushes} (${winPct(statsA.su.wins, statsA.su.losses)})`}
                  bText={`${statsB.su.wins}-${statsB.su.losses}-${statsB.su.pushes} (${winPct(statsB.su.wins, statsB.su.losses)})`} />
                <CompareRow label="SU Home" 
                  aVal={winPctVal(statsA.suHome.wins, statsA.suHome.losses)} bVal={winPctVal(statsB.suHome.wins, statsB.suHome.losses)}
                  aText={`${statsA.suHome.wins}-${statsA.suHome.losses}-${statsA.suHome.pushes} (${winPct(statsA.suHome.wins, statsA.suHome.losses)})`}
                  bText={`${statsB.suHome.wins}-${statsB.suHome.losses}-${statsB.suHome.pushes} (${winPct(statsB.suHome.wins, statsB.suHome.losses)})`} />
                <CompareRow label="SU Away" 
                  aVal={winPctVal(statsA.suAway.wins, statsA.suAway.losses)} bVal={winPctVal(statsB.suAway.wins, statsB.suAway.losses)}
                  aText={`${statsA.suAway.wins}-${statsA.suAway.losses}-${statsA.suAway.pushes} (${winPct(statsA.suAway.wins, statsA.suAway.losses)})`}
                  bText={`${statsB.suAway.wins}-${statsB.suAway.losses}-${statsB.suAway.pushes} (${winPct(statsB.suAway.wins, statsB.suAway.losses)})`} />
                <CompareRow label="SU as Favorite" 
                  aVal={winPctVal(statsA.suFav.wins, statsA.suFav.losses)} bVal={winPctVal(statsB.suFav.wins, statsB.suFav.losses)}
                  aText={`${statsA.suFav.wins}-${statsA.suFav.losses}-${statsA.suFav.pushes} (${winPct(statsA.suFav.wins, statsA.suFav.losses)})`}
                  bText={`${statsB.suFav.wins}-${statsB.suFav.losses}-${statsB.suFav.pushes} (${winPct(statsB.suFav.wins, statsB.suFav.losses)})`} />
                <CompareRow label="SU as Underdog" 
                  aVal={winPctVal(statsA.suDog.wins, statsA.suDog.losses)} bVal={winPctVal(statsB.suDog.wins, statsB.suDog.losses)}
                  aText={`${statsA.suDog.wins}-${statsA.suDog.losses}-${statsA.suDog.pushes} (${winPct(statsA.suDog.wins, statsA.suDog.losses)})`}
                  bText={`${statsB.suDog.wins}-${statsB.suDog.losses}-${statsB.suDog.pushes} (${winPct(statsB.suDog.wins, statsB.suDog.losses)})`} />

                {/* ATS Records */}
                <CompareRow label="ATS Overall" 
                  aVal={winPctVal(statsA.ats.wins, statsA.ats.losses)} bVal={winPctVal(statsB.ats.wins, statsB.ats.losses)}
                  aText={`${statsA.ats.wins}-${statsA.ats.losses}-${statsA.ats.pushes} (${winPct(statsA.ats.wins, statsA.ats.losses)})`}
                  bText={`${statsB.ats.wins}-${statsB.ats.losses}-${statsB.ats.pushes} (${winPct(statsB.ats.wins, statsB.ats.losses)})`} />
                <CompareRow label="ATS Home" 
                  aVal={winPctVal(statsA.atsHome.wins, statsA.atsHome.losses)} bVal={winPctVal(statsB.atsHome.wins, statsB.atsHome.losses)}
                  aText={`${statsA.atsHome.wins}-${statsA.atsHome.losses}-${statsA.atsHome.pushes} (${winPct(statsA.atsHome.wins, statsA.atsHome.losses)})`}
                  bText={`${statsB.atsHome.wins}-${statsB.atsHome.losses}-${statsB.atsHome.pushes} (${winPct(statsB.atsHome.wins, statsB.atsHome.losses)})`} />
                <CompareRow label="ATS Away" 
                  aVal={winPctVal(statsA.atsAway.wins, statsA.atsAway.losses)} bVal={winPctVal(statsB.atsAway.wins, statsB.atsAway.losses)}
                  aText={`${statsA.atsAway.wins}-${statsA.atsAway.losses}-${statsA.atsAway.pushes} (${winPct(statsA.atsAway.wins, statsA.atsAway.losses)})`}
                  bText={`${statsB.atsAway.wins}-${statsB.atsAway.losses}-${statsB.atsAway.pushes} (${winPct(statsB.atsAway.wins, statsB.atsAway.losses)})`} />
                <CompareRow label="ATS as Favorite" 
                  aVal={winPctVal(statsA.atsFav.wins, statsA.atsFav.losses)} bVal={winPctVal(statsB.atsFav.wins, statsB.atsFav.losses)}
                  aText={`${statsA.atsFav.wins}-${statsA.atsFav.losses}-${statsA.atsFav.pushes} (${winPct(statsA.atsFav.wins, statsA.atsFav.losses)})`}
                  bText={`${statsB.atsFav.wins}-${statsB.atsFav.losses}-${statsB.atsFav.pushes} (${winPct(statsB.atsFav.wins, statsB.atsFav.losses)})`} />
                <CompareRow label="ATS as Underdog" 
                  aVal={winPctVal(statsA.atsDog.wins, statsA.atsDog.losses)} bVal={winPctVal(statsB.atsDog.wins, statsB.atsDog.losses)}
                  aText={`${statsA.atsDog.wins}-${statsA.atsDog.losses}-${statsA.atsDog.pushes} (${winPct(statsA.atsDog.wins, statsA.atsDog.losses)})`}
                  bText={`${statsB.atsDog.wins}-${statsB.atsDog.losses}-${statsB.atsDog.pushes} (${winPct(statsB.atsDog.wins, statsB.atsDog.losses)})`} />

                {/* O/U Records */}
                <CompareRow label="O/U Overall" 
                  aVal={winPctVal(statsA.ou.overs, statsA.ou.unders)} bVal={winPctVal(statsB.ou.overs, statsB.ou.unders)}
                  aText={`${statsA.ou.overs}-${statsA.ou.unders}-${statsA.ou.pushes} (${winPct(statsA.ou.overs, statsA.ou.unders)})`}
                  bText={`${statsB.ou.overs}-${statsB.ou.unders}-${statsB.ou.pushes} (${winPct(statsB.ou.overs, statsB.ou.unders)})`} />
                <CompareRow label="O/U Home" 
                  aVal={winPctVal(statsA.ouHome.overs, statsA.ouHome.unders)} bVal={winPctVal(statsB.ouHome.overs, statsB.ouHome.unders)}
                  aText={`${statsA.ouHome.overs}-${statsA.ouHome.unders}-${statsA.ouHome.pushes} (${winPct(statsA.ouHome.overs, statsA.ouHome.unders)})`}
                  bText={`${statsB.ouHome.overs}-${statsB.ouHome.unders}-${statsB.ouHome.pushes} (${winPct(statsB.ouHome.overs, statsB.ouHome.unders)})`} />
                <CompareRow label="O/U Away" 
                  aVal={winPctVal(statsA.ouAway.overs, statsA.ouAway.unders)} bVal={winPctVal(statsB.ouAway.overs, statsB.ouAway.unders)}
                  aText={`${statsA.ouAway.overs}-${statsA.ouAway.unders}-${statsA.ouAway.pushes} (${winPct(statsA.ouAway.overs, statsA.ouAway.unders)})`}
                  bText={`${statsB.ouAway.overs}-${statsB.ouAway.unders}-${statsB.ouAway.pushes} (${winPct(statsB.ouAway.overs, statsB.ouAway.unders)})`} />
              </tbody>
            </table>
            </div>
          </div>

          {/* Head to Head Games */}
          <div className="panel" style={{ background: 'rgba(0,0,0,0.2)' }}>
            <h4>Head-to-Head History (${h2hGames.length} games)</h4>
            {h2hGames.length === 0 ? (
              <p style={{ color: '#666', margin: '10px 0 0' }}>No head-to-head games found in the database.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', marginTop: '10px', minWidth: '520px' }}>
                <thead>
                  <tr>
                    <th>Season/Week</th>
                    <th>Team</th>
                    <th>Opponent</th>
                    <th>Score</th>
                    <th>Spread</th>
                    <th>ATS Result</th>
                    <th>O/U Line</th>
                    <th>O/U Result</th>
                  </tr>
                </thead>
                <tbody>
                  {h2hGames.map((g, idx) => {
                    const scoreStr = `${g.teamScore} - ${g.oppScore}`;
                    const isWin = g.suResult === 'win';
                    const isLoss = g.suResult === 'loss';
                    const isCover = g.atsResult === 'win';
                    const isAtsLoss = g.atsResult === 'loss';
                    const isOver = g.ouResult === 'over';
                    const isUnder = g.ouResult === 'under';

                    return (
                      <tr key={idx}>
                        <td style={{ textAlign: 'center' }}>{g.season} W{g.week}</td>
                        <td style={{ fontWeight: 'bold' }}>{g.teamName}</td>
                        <td style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#888', fontSize: '0.85em' }}>{g.isHome ? 'vs' : '@'}</span>
                          {g.opponent}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 'bold', color: isWin ? '#4caf50' : isLoss ? '#f44336' : '#ccc' }}>
                          {isWin ? `${g.teamName} won` : `${g.opponent} won`} ({scoreStr})
                        </td>
                        <td style={{ textAlign: 'center' }}>{g.spread !== null ? (g.spread > 0 ? `+${g.spread}` : g.spread) : '-'}</td>
                        <td style={{ textAlign: 'center', fontWeight: 'bold', color: isCover ? '#4caf50' : isAtsLoss ? '#f44336' : '#ccc' }}>
                          {isCover ? `${g.teamName} covered` : `${g.opponent} covered`}
                        </td>
                        <td style={{ textAlign: 'center' }}>{g.overUnder !== null ? g.overUnder : '-'}</td>
                        <td style={{ textAlign: 'center', fontWeight: 'bold', color: isOver ? '#ff9800' : isUnder ? '#2196f3' : '#ccc' }}>
                          {g.ouResult.toUpperCase()} ({g.teamScore + g.oppScore})
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ color: '#888', padding: '20px' }}>Loading comparison data...</div>
      )}
    </div>
  );
};



const ResearchPage = ({ teams, conferenceList, seasons, selectedWeek, selectedSeason }) => {
  const [activeTab, setActiveTab] = useState('single');
  const [selectedConference, setSelectedConference] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedStat, setSelectedStat] = useState('SU Overall');
  const [researchTimeRange, setResearchTimeRange] = useState('All-Time');

  // Filter teams by conference
  const filteredTeams = selectedConference ? teams.filter(t => t.conference === selectedConference) : teams;
  const sortedTeams = [...filteredTeams].sort((a, b) => a.school.localeCompare(b.school));

  // Auto-select first team when conference changes
  useEffect(() => {
    if (sortedTeams.length) {
      setSelectedTeam(sortedTeams[0].school);
    }
  }, [selectedConference]);

  useEffect(() => {
    if (sortedTeams.length && !selectedTeam) {
      setSelectedTeam(sortedTeams[0].school);
    }
  }, [sortedTeams, selectedTeam]);

  useEffect(() => {
    if (!selectedTeam || activeTab !== 'single') return;
    setLoading(true);
    fetch(`/api/research/${encodeURIComponent(selectedTeam)}?range=${researchTimeRange}&week=${selectedWeek}&season=${selectedSeason}`)
      .then(r => r.json())
      .then(data => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedTeam, activeTab, researchTimeRange, selectedWeek, selectedSeason]);

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <Library size={24} color="#2196f3" />
        <h2 style={{ margin: 0 }}>Team Research Library</h2>

        {/* Time Range Dropdown aligned to the right */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span style={{ fontSize: '0.9em', color: '#888' }}>Time Range:</span>
          <select 
            value={researchTimeRange} 
            onChange={(e) => setResearchTimeRange(e.target.value)}
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
            {seasons && seasons.map(s => <option key={s} value={s}>{s} Season</option>)}
            <option value="Week">Current Week (W{selectedWeek})</option>
            <option value="Last 5 Weeks">Last 5 Weeks</option>
            <option value="Last 10 Weeks">Last 10 Weeks</option>
            <option value="Last 30 Days">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px', marginBottom: '24px' }}>
        <button style={tabStyle('single')} onClick={() => setActiveTab('single')}>
          <Library size={14} /> Single Team
        </button>
        <button style={tabStyle('compare')} onClick={() => setActiveTab('compare')}>
          <ArrowLeftRight size={14} /> Compare Teams
        </button>
        <button style={tabStyle('conference')} onClick={() => setActiveTab('conference')}>
          <Layers size={14} /> Conference
        </button>
        <button style={tabStyle('compare-conf')} onClick={() => setActiveTab('compare-conf')}>
          <ArrowLeftRight size={14} /> Compare Conferences
        </button>
        <button style={tabStyle('rankings')} onClick={() => setActiveTab('rankings')}>
          <Hash size={14} /> Rankings
        </button>
      </div>

      {activeTab === 'single' && (
        <div>
          <div className="controls" style={{ padding: 0, marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <label>
              Conference:
              <select value={selectedConference} onChange={(e) => setSelectedConference(e.target.value)} style={{ minWidth: '160px', maxWidth: '100%' }}>
                <option value="">All Conferences</option>
                {conferenceList.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              Select Team:
              <select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)} style={{ minWidth: '160px', maxWidth: '100%' }}>
                {sortedTeams.map(t => (
                  <option key={t.id} value={t.school}>{t.school}</option>
                ))}
              </select>
            </label>
          </div>

          {loading && <div style={{ color: '#888', padding: '20px' }}>Loading research data...</div>}

          {!loading && stats && (
            <div>
              {/* SU Section */}
              <h3 style={{ marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px' }}>Straight Up (SU) Records</h3>
              <div className="manual-grid research-grid-3" style={{ marginBottom: '24px' }}>
                <StatCard label="SU Overall" value={`${stats.su.wins}-${stats.su.losses}-${stats.su.pushes}`}
                  sub={`Win %: ${winPct(stats.su.wins, stats.su.losses)}`} icon={<BarChart2 size={40} />}
                  onClick={() => setSelectedStat('SU Overall')} active={selectedStat === 'SU Overall'} />
                <StatCard label="SU Home" value={`${stats.suHome.wins}-${stats.suHome.losses}-${stats.suHome.pushes}`}
                  sub={`Win %: ${winPct(stats.suHome.wins, stats.suHome.losses)}`} icon={<Home size={40} />}
                  onClick={() => setSelectedStat('SU Home')} active={selectedStat === 'SU Home'} />
                <StatCard label="SU Away" value={`${stats.suAway.wins}-${stats.suAway.losses}-${stats.suAway.pushes}`}
                  sub={`Win %: ${winPct(stats.suAway.wins, stats.suAway.losses)}`} icon={<Compass size={40} />}
                  onClick={() => setSelectedStat('SU Away')} active={selectedStat === 'SU Away'} />
                <StatCard label="SU Favorite" value={`${stats.suFav.wins}-${stats.suFav.losses}-${stats.suFav.pushes}`}
                  sub={`Win %: ${winPct(stats.suFav.wins, stats.suFav.losses)}`} icon={<Trophy size={40} />}
                  onClick={() => setSelectedStat('SU Favorite')} active={selectedStat === 'SU Favorite'} />
                <StatCard label="SU Underdog" value={`${stats.suDog.wins}-${stats.suDog.losses}-${stats.suDog.pushes}`}
                  sub={`Win %: ${winPct(stats.suDog.wins, stats.suDog.losses)}`} icon={<Flame size={40} />}
                  onClick={() => setSelectedStat('SU Underdog')} active={selectedStat === 'SU Underdog'} />
                <StatCard label="SU Home Favorite" value={`${stats.suHomeFav.wins}-${stats.suHomeFav.losses}-${stats.suHomeFav.pushes}`}
                  sub={`Win %: ${winPct(stats.suHomeFav.wins, stats.suHomeFav.losses)}`} icon={<Home size={40} />}
                  onClick={() => setSelectedStat('SU Home Favorite')} active={selectedStat === 'SU Home Favorite'} />
                <StatCard label="SU Home Underdog" value={`${stats.suHomeDog.wins}-${stats.suHomeDog.losses}-${stats.suHomeDog.pushes}`}
                  sub={`Win %: ${winPct(stats.suHomeDog.wins, stats.suHomeDog.losses)}`} icon={<Home size={40} />}
                  onClick={() => setSelectedStat('SU Home Underdog')} active={selectedStat === 'SU Home Underdog'} />
                <StatCard label="SU Away Favorite" value={`${stats.suAwayFav.wins}-${stats.suAwayFav.losses}-${stats.suAwayFav.pushes}`}
                  sub={`Win %: ${winPct(stats.suAwayFav.wins, stats.suAwayFav.losses)}`} icon={<Compass size={40} />}
                  onClick={() => setSelectedStat('SU Away Favorite')} active={selectedStat === 'SU Away Favorite'} />
                <StatCard label="SU Away Underdog" value={`${stats.suAwayDog.wins}-${stats.suAwayDog.losses}-${stats.suAwayDog.pushes}`}
                  sub={`Win %: ${winPct(stats.suAwayDog.wins, stats.suAwayDog.losses)}`} icon={<Compass size={40} />}
                  onClick={() => setSelectedStat('SU Away Underdog')} active={selectedStat === 'SU Away Underdog'} />
              </div>

              {/* ATS Section */}
              <h3 style={{ marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px' }}>Against the Spread (ATS) Records</h3>
              <div className="manual-grid research-grid-3" style={{ marginBottom: '24px' }}>
                <StatCard label="ATS Overall" value={`${stats.ats.wins}-${stats.ats.losses}-${stats.ats.pushes}`}
                  sub={`Cover %: ${winPct(stats.ats.wins, stats.ats.losses)}`} icon={<BarChart2 size={40} />} color="#ffcc00"
                  onClick={() => setSelectedStat('ATS Overall')} active={selectedStat === 'ATS Overall'} />
                <StatCard label="ATS Home" value={`${stats.atsHome.wins}-${stats.atsHome.losses}-${stats.atsHome.pushes}`}
                  sub={`Cover %: ${winPct(stats.atsHome.wins, stats.atsHome.losses)}`} icon={<Home size={40} />} color="#ffcc00"
                  onClick={() => setSelectedStat('ATS Home')} active={selectedStat === 'ATS Home'} />
                <StatCard label="ATS Away" value={`${stats.atsAway.wins}-${stats.atsAway.losses}-${stats.atsAway.pushes}`}
                  sub={`Cover %: ${winPct(stats.atsAway.wins, stats.atsAway.losses)}`} icon={<Compass size={40} />} color="#ffcc00"
                  onClick={() => setSelectedStat('ATS Away')} active={selectedStat === 'ATS Away'} />
                <StatCard label="ATS Favorite" value={`${stats.atsFav.wins}-${stats.atsFav.losses}-${stats.atsFav.pushes}`}
                  sub={`Cover %: ${winPct(stats.atsFav.wins, stats.atsFav.losses)}`} icon={<Trophy size={40} />} color="#ffcc00"
                  onClick={() => setSelectedStat('ATS Favorite')} active={selectedStat === 'ATS Favorite'} />
                <StatCard label="ATS Underdog" value={`${stats.atsDog.wins}-${stats.atsDog.losses}-${stats.atsDog.pushes}`}
                  sub={`Cover %: ${winPct(stats.atsDog.wins, stats.atsDog.losses)}`} icon={<Flame size={40} />} color="#ffcc00"
                  onClick={() => setSelectedStat('ATS Underdog')} active={selectedStat === 'ATS Underdog'} />
                <StatCard label="ATS Home Favorite" value={`${stats.atsHomeFav.wins}-${stats.atsHomeFav.losses}-${stats.atsHomeFav.pushes}`}
                  sub={`Cover %: ${winPct(stats.atsHomeFav.wins, stats.atsHomeFav.losses)}`} icon={<Home size={40} />} color="#ffcc00"
                  onClick={() => setSelectedStat('ATS Home Favorite')} active={selectedStat === 'ATS Home Favorite'} />
                <StatCard label="ATS Home Underdog" value={`${stats.atsHomeDog.wins}-${stats.atsHomeDog.losses}-${stats.atsHomeDog.pushes}`}
                  sub={`Cover %: ${winPct(stats.atsHomeDog.wins, stats.atsHomeDog.losses)}`} icon={<Home size={40} />} color="#ffcc00"
                  onClick={() => setSelectedStat('ATS Home Underdog')} active={selectedStat === 'ATS Home Underdog'} />
                <StatCard label="ATS Away Favorite" value={`${stats.atsAwayFav.wins}-${stats.atsAwayFav.losses}-${stats.atsAwayFav.pushes}`}
                  sub={`Cover %: ${winPct(stats.atsAwayFav.wins, stats.atsAwayFav.losses)}`} icon={<Compass size={40} />} color="#ffcc00"
                  onClick={() => setSelectedStat('ATS Away Favorite')} active={selectedStat === 'ATS Away Favorite'} />
                <StatCard label="ATS Away Underdog" value={`${stats.atsAwayDog.wins}-${stats.atsAwayDog.losses}-${stats.atsAwayDog.pushes}`}
                  sub={`Cover %: ${winPct(stats.atsAwayDog.wins, stats.atsAwayDog.losses)}`} icon={<Compass size={40} />} color="#ffcc00"
                  onClick={() => setSelectedStat('ATS Away Underdog')} active={selectedStat === 'ATS Away Underdog'} />
              </div>

              {/* O/U Section */}
              <h3 style={{ marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px' }}>Over/Under Records</h3>
              <div className="manual-grid" style={{ marginBottom: '24px' }}>
                <StatCard label="O/U Overall" value={`${stats.ou.overs}-${stats.ou.unders}-${stats.ou.pushes}`}
                  sub={`Over %: ${winPct(stats.ou.overs, stats.ou.unders)}`} icon={<BarChart2 size={40} />} color="#ff9800"
                  onClick={() => setSelectedStat('OU Overall')} active={selectedStat === 'OU Overall'} />
                <StatCard label="O/U Home" value={`${stats.ouHome.overs}-${stats.ouHome.unders}-${stats.ouHome.pushes}`}
                  sub={`Over %: ${winPct(stats.ouHome.overs, stats.ouHome.unders)}`} icon={<Home size={40} />} color="#ff9800"
                  onClick={() => setSelectedStat('OU Home')} active={selectedStat === 'OU Home'} />
                <StatCard label="O/U Away" value={`${stats.ouAway.overs}-${stats.ouAway.unders}-${stats.ouAway.pushes}`}
                  sub={`Over %: ${winPct(stats.ouAway.overs, stats.ouAway.unders)}`} icon={<Compass size={40} />} color="#ff9800"
                  onClick={() => setSelectedStat('OU Away')} active={selectedStat === 'OU Away'} />
              </div>

              {/* Interactive Chart */}
              <ResearchChart selectedStat={selectedStat} teamName={selectedTeam} stats={stats} />

              {/* Recent Games Table */}
              <div className="panel" style={{ marginTop: '32px', background: 'rgba(0,0,0,0.2)' }}>
                <h4>Recent Games</h4>
                <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', marginTop: '10px', minWidth: '520px' }}>
                  <thead>
                    <tr>
                      <th>Season/Week</th>
                      <th style={{ textAlign: 'left' }}>Opponent</th>
                      <th>Score</th>
                      <th>Spread</th>
                      <th>ATS Result</th>
                      <th>O/U Line</th>
                      <th>O/U Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recent.map((g, idx) => {
                      const scoreStr = `${g.teamScore} - ${g.oppScore}`;
                      const isWin = g.suResult === 'win';
                      const isLoss = g.suResult === 'loss';
                      const isCover = g.atsResult === 'win';
                      const isAtsLoss = g.atsResult === 'loss';
                      const isOver = g.ouResult === 'over';
                      const isUnder = g.ouResult === 'under';

                      return (
                        <tr key={idx}>
                          <td style={{ textAlign: 'center' }}>{g.season} W{g.week}</td>
                          <td style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#888', fontSize: '0.85em' }}>{g.isHome ? 'vs' : '@'}</span>
                            {g.opponent}
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold', color: isWin ? '#4caf50' : isLoss ? '#f44336' : '#ccc' }}>
                            {g.suResult.toUpperCase()} {scoreStr}
                          </td>
                          <td style={{ textAlign: 'center' }}>{g.spread !== null ? (g.spread > 0 ? `+${g.spread}` : g.spread) : '—'}</td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold', color: isCover ? '#4caf50' : isAtsLoss ? '#f44336' : '#ccc' }}>
                            {g.atsResult.toUpperCase()}
                          </td>
                          <td style={{ textAlign: 'center' }}>{g.overUnder !== null ? g.overUnder : '—'}</td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold', color: isOver ? '#ff9800' : isUnder ? '#2196f3' : '#ccc' }}>
                            {g.ouResult.toUpperCase()} ({g.teamScore + g.oppScore})
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'compare' && (
        <CompareTeamsPanel teams={teams} conferenceList={conferenceList} timeRange={researchTimeRange} selectedWeek={selectedWeek} selectedSeason={selectedSeason} />
      )}

      {activeTab === 'conference' && (
        <ConferencePanel conferenceList={conferenceList} timeRange={researchTimeRange} selectedWeek={selectedWeek} selectedSeason={selectedSeason} />
      )}

      {activeTab === 'compare-conf' && (
        <CompareConferencesPanel teams={teams} conferenceList={conferenceList} timeRange={researchTimeRange} selectedWeek={selectedWeek} selectedSeason={selectedSeason} />
      )}

      {activeTab === 'rankings' && (
        <RankingsPanel timeRange={researchTimeRange} selectedWeek={selectedWeek} selectedSeason={selectedSeason} />
      )}

    </section>
  );
};

export default ResearchPage;
