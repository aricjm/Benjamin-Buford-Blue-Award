import { useState, useEffect } from 'react';
import { Lock, TrendingUp, TrendingDown, AlertTriangle, DollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const UNIT = 10; // dollars risked per parlay

// Total return (stake + profit) for N legs at -110 each
// e.g. 3 legs: 10 * (100/110+1)^3 = $69.57
function parlayTotalReturn(legs) {
  const decimalOdds = 100 / 110 + 1;
  return parseFloat((UNIT * Math.pow(decimalOdds, legs)).toFixed(2));
}

function resultColor(result) {
  if (result === 'win') return '#4caf50';
  if (result === 'loss') return '#f44336';
  if (result === 'push') return '#ff9800';
  return '#aaa';
}

function ResultBadge({ result }) {
  if (!result || result === 'pending') return <span style={{ color: '#aaa', fontSize: '0.8em' }}>Pending</span>;
  const colors = { win: '#4caf50', loss: '#f44336', push: '#ff9800' };
  return (
    <span style={{
      background: colors[result] || '#555',
      color: '#fff',
      borderRadius: '4px',
      padding: '2px 8px',
      fontSize: '0.78em',
      fontWeight: 'bold',
      textTransform: 'uppercase'
    }}>
      {result}
    </span>
  );
}

function LockPickLabel({ lock }) {
  if (lock.selectionTeam) {
    const isHome = lock.selectionTeam === lock.homeTeam;
    if (isHome) {
      return (
        <span style={{ color: '#ccc' }}>
          {lock.awayTeam} @ <strong style={{ color: '#fff' }}>{lock.homeTeam} {lock.spreadText}</strong>
        </span>
      );
    } else {
      return (
        <span style={{ color: '#ccc' }}>
          <strong style={{ color: '#fff' }}>{lock.awayTeam} {lock.spreadText}</strong> @ {lock.homeTeam}
        </span>
      );
    }
  } else if (lock.selectionTotal) {
    return (
      <span style={{ color: '#ccc' }}>
        {lock.awayTeam} @ {lock.homeTeam} <strong style={{ color: '#fff' }}>{lock.selectionTotal.toUpperCase()} {lock.totalLine}</strong>
      </span>
    );
  }
  return <span style={{ color: '#ccc' }}>{lock.label}</span>;
}

export default function BBBMLPPage({ seasons, players = [] }) {
  const [data, setData] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Default to the most recent season if available, otherwise 'All'
  const defaultSeason = seasons && seasons.length > 0 ? seasons[0] : 'All';
  const [selectedSeason, setSelectedSeason] = useState(defaultSeason);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const url = selectedSeason === 'All'
          ? '/api/bbbmlp'
          : `/api/bbbmlp?season=${selectedSeason}`;
        const [res, curRes] = await Promise.all([fetch(url), fetch('/api/bbbmlp/current')]);
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const [json, curJson] = await Promise.all([res.json(), curRes.json()]);
        setData(json);
        setCurrentWeek(curJson);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedSeason]);

  const weeks = data?.weeks || [];
  const playerStats = data?.playerStats || {};

  // Get list of player names from props or fallback to standard three
  const displayPlayers = players.length > 0 
    ? players.map(p => p.name) 
    : ['Aric', 'Nick', 'Cisco'];

  // netResult from backend: totalReturn on win (e.g. $69.57), -10 on loss, 0 on push, null on pending
  // Net P&L = sum of (return - stake) for wins + losses
  // push = stake returned = $0 net; win = total return minus stake; loss = -stake
  const totalNet = weeks.reduce((sum, w) => {
    if (w.parlayResult === 'win') return sum + (w.netResult ?? 0) - UNIT;
    if (w.parlayResult === 'loss') return sum - UNIT;
    return sum; // push: $0 net P&L
  }, 0);
  const totalWins = weeks.filter(w => w.parlayResult === 'win').length;
  const totalLosses = weeks.filter(w => w.parlayResult === 'loss').length;
  const totalPushes = weeks.filter(w => w.parlayResult === 'push').length;
  const totalPending = weeks.filter(w => w.parlayResult === 'pending').length;

  // Calculate cumulative P&L for the chart
  let runningTotal = 0;
  // The weeks array from backend is sorted season ASC, week ASC (chronological).
  // We map it directly so Week 1 is on the left and the latest week is on the right.
  const chartData = weeks.map(w => {
    if (w.parlayResult === 'win') runningTotal += (w.netResult ?? 0) - UNIT;
    else if (w.parlayResult === 'loss') runningTotal -= UNIT;
    // push and pending don't change the running total
    return {
      name: `${w.season} W${w.week}`,
      pnl: parseFloat(runningTotal.toFixed(2))
    };
  });
  // Add a starting point at 0
  if (chartData.length > 0) {
    chartData.unshift({ name: 'Start', pnl: 0 });
  }

  // Determine dynamic Y-axis domain based on min/max P&L
  const pnlValues = chartData.map(d => d.pnl);
  const minPnl = Math.min(...pnlValues);
  const maxPnl = Math.max(...pnlValues);
  
  // Add some padding to the min/max (e.g., round to nearest 50 or 100)
  const yAxisMin = Math.floor(minPnl / 50) * 50 - 50;
  const yAxisMax = Math.ceil(maxPnl / 50) * 50 + 50;

  return (
    <div style={{ padding: '16px', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <Lock size={24} style={{ color: '#f1c40f' }} />
        <h2 style={{ margin: 0, fontSize: '1.4rem' }}>BBB Mortal Lock Parlay</h2>
        <select
          value={selectedSeason}
          onChange={e => setSelectedSeason(e.target.value)}
          style={{ marginLeft: 'auto', padding: '6px 12px', borderRadius: '6px', background: '#1e1e2e', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
        >
          {(seasons || []).map(s => <option key={s} value={s}>{s}</option>)}
          <option value="All">All Seasons</option>
        </select>
      </div>

      {loading && <div style={{ color: '#aaa', padding: '20px' }}>Loading...</div>}
      {error && <div style={{ color: '#f44336', padding: '20px' }}>{error}</div>}

      {/* Current Week Hero - Only show if 'All' or the current season is selected */}
      {!loading && currentWeek && currentWeek.week != null && (selectedSeason === 'All' || selectedSeason === currentWeek.season) && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(241,196,15,0.12) 0%, rgba(77,124,255,0.08) 100%)',
          border: '1px solid rgba(241,196,15,0.35)',
          borderRadius: '14px',
          padding: '20px 24px',
          marginBottom: '28px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
              {currentWeek.season} — Week {currentWeek.week} Mortal Lock Parlay
            </span>
            {currentWeek.locks.length > 0 && currentWeek.missingPlayers.length === 0 && (
              <span style={{ marginLeft: 'auto', fontSize: '0.8em', color: '#4caf50', fontWeight: 'bold' }}>ALL LOCKS IN</span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {currentWeek.locks.map((lock, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
                background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '10px 14px'
              }}>
                <span style={{ color: '#f1c40f', fontWeight: 'bold', minWidth: '60px', fontSize: '0.9em' }}>{lock.player}</span>
                <span style={{ flex: 1 }}><LockPickLabel lock={lock} /></span>
                <ResultBadge result={lock.result} />
              </div>
            ))}
            {currentWeek.missingPlayers.map(player => (
              <div key={player} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                background: 'rgba(255,255,255,0.02)', borderRadius: '8px', padding: '10px 14px',
                border: '1px dashed rgba(255,255,255,0.1)'
              }}>
                <span style={{ color: '#f1c40f', fontWeight: 'bold', minWidth: '60px', fontSize: '0.9em' }}>{player}</span>
                <span style={{ color: '#666', fontStyle: 'italic' }}>Still waiting on {player}'s mortal lock…</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* Summary Banner */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px',
            marginBottom: '24px'
          }}>
            <StatCard label="Net P&L" value={`${totalNet >= 0 ? '+' : ''}$${totalNet.toFixed(2)}`} color={totalNet >= 0 ? '#4caf50' : '#f44336'} icon={<DollarSign size={18} />} />
            <StatCard label="Parlay Wins" value={totalWins} color="#4caf50" />
            <StatCard label="Parlay Losses" value={totalLosses} color="#f44336" />
            {totalPushes > 0 && <StatCard label="Pushes" value={totalPushes} color="#ff9800" />}
            {totalPending > 0 && <StatCard label="Pending" value={totalPending} color="#aaa" />}
            <StatCard label="Unit Size" value={`$${UNIT}`} color="#4d7cff" />
          </div>

          {/* Player Lock Records */}
          {displayPlayers.length > 0 && (
            <div style={{ marginBottom: '28px' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '1rem', color: '#ccc' }}>Player Lock Records</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                {displayPlayers.map(player => {
                  const s = playerStats[player] || { wins: 0, losses: 0, pushes: 0, pending: 0, soleBust: 0 };
                  return (
                    <div key={player} style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '10px',
                      padding: '14px 16px'
                    }}>
                      <div style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {player}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.85em' }}>
                        <Stat label="Wins" value={s.wins} color="#4caf50" />
                        <Stat label="Losses" value={s.losses} color="#f44336" />
                        <Stat label="Pushes" value={s.pushes} color="#ff9800" />
                        <Stat label="Pending" value={s.pending} color="#aaa" />
                        <Stat label="Win %" value={s.wins + s.losses > 0 ? `${((s.wins / (s.wins + s.losses)) * 100).toFixed(1)}%` : '—'} color="#4d7cff" />
                        <Stat label="Sole Bust" value={s.soleBust} color="#e91e63" title="Times this player's lock lost while all others won" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Week-by-Week Table */}
          {weeks.length === 0 ? (
            <div style={{ color: '#aaa', padding: '20px', textAlign: 'center' }}>No lock pick data found.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88em' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.15)', color: '#aaa', textAlign: 'left' }}>
                    <th style={{ padding: '8px 10px' }}>Season</th>
                    <th style={{ padding: '8px 10px' }}>Week</th>
                    <th style={{ padding: '8px 10px' }}>Lock Picks</th>
                    <th style={{ padding: '8px 10px' }}>Parlay</th>
                    <th style={{ padding: '8px 10px' }}>P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {[...weeks].reverse().map((w, i) => (
                    <tr key={i} style={{
                      borderBottom: '1px solid rgba(255,255,255,0.07)',
                      background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'
                    }}>
                      <td style={{ padding: '8px 10px', color: '#aaa' }}>{w.season}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 'bold' }}>Week {w.week}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {w.locks.map((lock, li) => (
                            <div key={li} style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <span style={{ color: '#f1c40f', fontSize: '0.8em', fontWeight: 'bold', minWidth: '50px' }}>{lock.player}</span>
                              <LockPickLabel lock={lock} />
                              <ResultBadge result={lock.result} />
                            </div>
                          ))}
                          {w.locks.length === 0 && <span style={{ color: '#555' }}>No locks</span>}
                        </div>
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <ResultBadge result={w.parlayResult} />
                        {w.parlayResult !== 'pending' && w.locks.length > 0 && (
                          <div style={{ fontSize: '0.75em', color: '#666', marginTop: '2px' }}>
                            {w.locks.length}-leg
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '8px 10px', fontWeight: 'bold', color: (w.netResult ?? 0) > 0 ? '#4caf50' : (w.netResult ?? 0) < 0 ? '#f44336' : '#ff9800' }}>
                        {w.parlayResult === 'pending'
                          ? '—'
                          : w.parlayResult === 'win'
                            ? `+$${(w.netResult ?? 0).toFixed(2)}`
                            : w.parlayResult === 'push'
                              ? `+$${UNIT.toFixed(2)} (push)`
                              : `-$${UNIT.toFixed(2)}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid rgba(255,255,255,0.2)', fontWeight: 'bold' }}>
                    <td colSpan={4} style={{ padding: '10px 10px', color: '#ccc' }}>Total</td>
                    <td style={{ padding: '10px 10px', color: totalNet >= 0 ? '#4caf50' : '#f44336', fontSize: '1.05em' }}>
                      {totalNet >= 0 ? '+' : ''}${totalNet.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* P&L Timeline Chart */}
          {chartData.length > 1 && (
            <div style={{ marginTop: '40px', marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '1rem', color: '#ccc' }}>P&L Timeline</h3>
              <div style={{ 
                background: 'rgba(255,255,255,0.02)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '10px', 
                padding: '20px 20px 10px 0',
                height: '350px'
              }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#888" 
                      fontSize={12} 
                      tickMargin={10}
                      minTickGap={30}
                    />
                    <YAxis 
                      stroke="#888" 
                      fontSize={12} 
                      tickFormatter={(val) => `$${val}`}
                      domain={[yAxisMin, yAxisMax]}
                    />
                    <Tooltip 
                      contentStyle={{ background: '#1e1e2e', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                      formatter={(value) => [`$${value.toFixed(2)}`, 'Net P&L']}
                      labelStyle={{ color: '#aaa', marginBottom: '4px' }}
                    />
                    <ReferenceLine y={0} stroke="#f44336" strokeWidth={1} opacity={0.8} />
                    <Line 
                      type="monotone" 
                      dataKey="pnl" 
                      stroke="#4d7cff" 
                      strokeWidth={3}
                      dot={{ r: 3, fill: '#4d7cff', strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: '#fff', stroke: '#4d7cff', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, color, icon }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '10px',
      padding: '14px 16px',
      textAlign: 'center'
    }}>
      <div style={{ color: '#aaa', fontSize: '0.78em', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
        {icon}{label}
      </div>
      <div style={{ color, fontSize: '1.4em', fontWeight: 'bold' }}>{value}</div>
    </div>
  );
}

function Stat({ label, value, color, title }) {
  return (
    <div title={title}>
      <div style={{ color: '#666', fontSize: '0.8em' }}>{label}</div>
      <div style={{ color: color || '#fff', fontWeight: 'bold' }}>{value}</div>
    </div>
  );
}
