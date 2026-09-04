import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Check, Database, Plus, Save, Trash2, X } from 'lucide-react';

const STORAGE_KEY = 'bbba-models';
const GROUPS = [
  ['TEAM STRENGTH', ['Offensive Rating', 'Defensive Rating', 'Rankings']],
  ['PERFORMANCE', ['Recent Performance', 'Yards / Play', 'Success Rate', 'Turnovers', 'QB Rating']],
  ['MARKET', ['Current Spread', 'Moneyline', 'Over / Under']],
  ['GAME', ['Home / Away', 'Injuries']],
  ['WEATHER', ['Temperature', 'Wind', 'Precipitation', 'Condition']]
];
const TYPES = [['quick', 'Quick Pick', 'Tell us what you think'], ['weighted', 'Weighted Model', 'Tell us what matters'], ['lab', 'Model Lab', 'Build your own logic']];
const DEFAULT_WEIGHTS = { 'Current Spread': 30, 'Offensive Rating': 15, 'Defensive Rating': 15, 'Recent Performance': 10, 'QB Rating': 10, 'Home / Away': 10, Moneyline: 5, Injuries: 5 };
const NEW_RULE = { feature: 'Current Spread', operator: '>', threshold: 3, adjustment: 2.5 };

const FALLBACK_TEST_GAMES = [
  { id: 69, home_team: 'Illinois Fighting Illini', away_team: 'UAB Blazers', spread_home: -27.5, spread_away: 27.5, over_under: 56.5, score_home: 42, score_away: 23, completed: 1, winner: 'home' },
  { id: 68, home_team: 'Utah Utes', away_team: 'Idaho Vandals', spread_home: -33.5, spread_away: 33.5, over_under: 56.5, score_home: 66, score_away: 14, completed: 1, winner: 'home' },
  { id: 65, home_team: 'Missouri Tigers', away_team: 'Arkansas-Pine Bluff Golden Lions', spread_home: -54.5, spread_away: 54.5, over_under: 60.5, score_home: 54, score_away: 14, completed: 1, winner: 'home' },
  { id: 66, home_team: 'Georgia Tech Yellow Jackets', away_team: 'Colorado Buffaloes', spread_home: -7, spread_away: 7, over_under: 50.5, score_home: 13, score_away: 14, completed: 1, winner: 'away' },
  { id: 67, home_team: 'Minnesota Golden Gophers', away_team: 'Eastern Illinois Panthers', spread_home: -43.5, spread_away: 43.5, over_under: 51.5, score_home: 59, score_away: 7, completed: 1, winner: 'home' },
  { id: 61, home_team: 'Wake Forest Demon Deacons', away_team: 'Akron Zips', spread_home: -22.5, spread_away: 22.5, over_under: 49.5, score_home: 38, score_away: 16, completed: 1, winner: 'home' },
  { id: 60, home_team: 'UCF Knights', away_team: 'Bethune-Cookman Wildcats', spread_home: -41.5, spread_away: 41.5, over_under: 59.5, score_home: 73, score_away: 6, completed: 1, winner: 'home' },
  { id: 62, home_team: 'Delaware Blue Hens', away_team: 'Merrimack Warriors', spread_home: -27.5, spread_away: 27.5, over_under: 55.5, score_home: 42, score_away: 7, completed: 1, winner: 'home' },
  { id: 63, home_team: 'Kennesaw State Owls', away_team: 'West Georgia Wolves', spread_home: -22.5, spread_away: 22.5, over_under: 51.5, score_home: 47, score_away: 0, completed: 1, winner: 'home' },
  { id: 64, home_team: 'Buffalo Bulls', away_team: 'UAlbany Great Danes', spread_home: -24.5, spread_away: 24.5, over_under: 48.5, score_home: 21, score_away: 17, completed: 1, winner: 'home' }
];

function readSaved() { try { const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); return Array.isArray(value) ? value.slice(0, 3) : []; } catch { return []; } }
function signal(game, feature) { if (feature === 'Current Spread' && game.spread_home != null) return -Number(game.spread_home); if (feature === 'Home / Away') return 3; if (feature === 'Moneyline' && game.home_price != null && game.away_price != null) return Number(game.home_price) < Number(game.away_price) ? 5 : -5; return null; }
function evaluate(model, games) {
  return games.map((game) => {
    let margin = 0;
    if (model.type === 'quick') {
      const quick = model.quick;
      const direction = quick.better === 'home' ? 1 : -1;
      margin = direction * ((quick.strength - 5) * 1.8 + (quick.form - 5) * .8 + (quick.offense - 5) * .8 + (quick.defense - 5) * .8 + (quick.qb - 5) * .6) + Number(quick.environment) + Number(quick.injuries);
    } else {
      model.features.forEach(({ label, weight }) => { const value = signal(game, label); if (value !== null) margin += value * weight / 100; });
    }
    if (model.type === 'lab') model.rules.forEach((rule) => { const value = signal(game, rule.feature); if (value !== null && (rule.operator === '>' ? value > Number(rule.threshold) : value < Number(rule.threshold))) margin += Number(rule.adjustment); });
    const currentTotal = game.over_under == null ? null : Number(game.over_under);
    const projectedTotal = currentTotal == null ? null : currentTotal + (model.type === 'quick' ? Math.max(-7, Math.min(7, (model.quick.offense + model.quick.qb - 10))) : 0);
    const spreadEdge = game.spread_home == null ? null : margin + Number(game.spread_home);
    const totalEdge = projectedTotal == null ? null : projectedTotal - currentTotal;
    const spreadBet = spreadEdge == null || Math.abs(spreadEdge) < 1 ? 'Pass spread' : `${spreadEdge > 0 ? game.home_team : game.away_team} spread`;
    const totalBet = totalEdge == null || Math.abs(totalEdge) < 1 ? 'Pass total' : `${totalEdge > 0 ? 'Over' : 'Under'} ${currentTotal}`;
    const confidence = Math.min(95, Math.max(50, Math.round(50 + Math.abs(margin) * 4)));
    const totalConfidence = totalEdge == null ? null : Math.min(90, Math.max(50, Math.round(50 + Math.abs(totalEdge) * 5)));
    return { ...game, margin, prediction: margin >= 0 ? 'home' : 'away', confidence, projectedTotal, spreadEdge, totalEdge, spreadBet, totalBet, totalConfidence };
  });
}

function isGameFinished(game) {
  if (!game) return false;
  if (Boolean(game.completed) || Number(game.completed) === 1) return true;
  if (game.status === 'Final' || game.status === 'post' || game.status === 'STATUS_FINAL') return true;
  if (game.score_home !== null && game.score_away !== null && (game.completed === 1 || Boolean(game.completed))) return true;
  return false;
}

function CreateModelPage({ selectedSeason, selectedWeek }) {
  const [testGames, setTestGames] = useState(FALLBACK_TEST_GAMES);
  const [weekGames, setWeekGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [weekLoading, setWeekLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(readSaved);
  const [type, setType] = useState('quick');
  const [name, setName] = useState('');
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [rules, setRules] = useState([{ id: 1, ...NEW_RULE }]);
  const [quick, setQuick] = useState({ better: 'home', strength: 7, form: 5, offense: 5, defense: 5, qb: 5, environment: 0, injuries: 0 });
  const [results, setResults] = useState(null);
  const [singleId, setSingleId] = useState('');
  const [singleResult, setSingleResult] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/model-games')
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled && data.games && data.games.length) setTestGames(data.games);
      })
      .catch((err) => {
        console.warn('Could not refresh test games from server:', err);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedSeason || selectedWeek === null || selectedWeek === undefined) return;
    let cancelled = false;
    setWeekLoading(true);
    fetch(`/api/week/${selectedWeek}/games?season=${encodeURIComponent(selectedSeason)}`)
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled) setWeekGames(data.games || []);
      })
      .catch(() => {
        if (!cancelled) setError('Unable to load games for the selected week.');
      })
      .finally(() => {
        if (!cancelled) setWeekLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedSeason, selectedWeek]);

  const upcomingWeekGames = useMemo(() => {
    return weekGames.filter((game) => !isGameFinished(game));
  }, [weekGames]);
  const model = useMemo(() => ({ type, name: name.trim() || 'Untitled model', features: Object.entries(weights).filter(([, value]) => Number(value) > 0).map(([label, weight]) => ({ label, weight: Number(weight) })), rules, quick }), [type, name, weights, rules, quick]);
  const total = Object.values(weights).reduce((sum, value) => sum + Number(value || 0), 0); const updateWeight = (label, value) => setWeights((current) => ({ ...current, [label]: Math.max(0, Math.min(100, Number(value) || 0)) })); const updateRule = (id, field, value) => setRules((current) => current.map((rule) => rule.id === id ? { ...rule, [field]: value } : rule));
  const save = () => { if (!name.trim()) return setError('Give the model a name before saving.'); if (type === 'weighted' && total !== 100) return setError('Weighted factors must total 100%.'); if (saved.length >= 3) return setError('You can save up to 3 models.'); const next = [...saved, { ...model, id: crypto.randomUUID(), savedAt: new Date().toISOString() }]; setSaved(next); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); setError(''); };
  const renderVariables = () => <div className="feature-list">{GROUPS.map(([title, labels]) => <div className="feature-group" key={title}><div className="feature-group-heading"><span>{title}</span><i /></div>{labels.map((label) => { const weight = Number(weights[label] || 0); return <div className="feature-row" key={label}><button className={`feature-check ${weight ? 'checked' : ''}`} onClick={() => updateWeight(label, weight ? 0 : 5)} aria-label={`Toggle ${label}`}>{weight ? <Check size={15} /> : null}</button><div className="feature-copy"><strong>{label}</strong></div><input className="weight-input" type="number" min="0" max="100" value={weight} onChange={(event) => updateWeight(label, event.target.value)} /><span className="percent">%</span></div>; })}</div>)}</div>;
  const formatGame = (game) => {
    const spread = game.spread_home != null ? `${game.spread_home > 0 ? '+' : ''}${game.spread_home}` : 'N/A';
    const ou = game.over_under != null ? `${game.over_under}` : 'N/A';
    return `${game.away_team} @ ${game.home_team} (${spread} | O/U ${ou})`;
  };
  return <div className="model-page"><div className="model-hero"><div><p className="eyebrow">Prediction lab</p><h1>Create Model</h1><p className="model-subtitle">Build a transparent margin-of-victory model your way.</p></div><div className="model-count"><Database size={18} /> {saved.length}/3 saved</div></div>{error && <div className="model-alert">{error}</div>}
  <section className="model-panel model-builder"><div className="panel-heading"><h2>Build your model</h2></div><label className="model-label">Model name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Saturday slate model" /></label><div className="model-tabs">{TYPES.map(([key, label, subtitle]) => <button type="button" key={key} className={type === key ? 'active' : ''} onClick={() => { setType(key); setResults(null); }}><strong>{label}</strong><small>{subtitle}</small></button>)}</div>{type === 'quick' && <div className="quick-form"><p>Use guided questions to create a quick margin projection.</p>{[['strength', 'Overall team strength'], ['form', 'Recent performance'], ['offense', 'Offense'], ['defense', 'Defense'], ['qb', 'QB rating']].map(([key, label]) => <label className="quick-slider" key={key}><span>{label}<b>{quick[key]}/10</b></span><input type="range" min="0" max="10" value={quick[key]} onChange={(event) => setQuick((current) => ({ ...current, [key]: Number(event.target.value) }))} /></label>)}</div>}{type !== 'quick' && <><div className="weight-header"><span>Available Variables</span><strong>{total}% assigned</strong></div>{renderVariables()}</>}{type === 'lab' && <div className="lab-rules"><div className="rules-heading"><strong>IF / THEN rules</strong><button type="button" onClick={() => setRules((current) => [...current, { id: Date.now(), ...NEW_RULE }])}><Plus size={15} /> Add rule</button></div>{rules.map((rule, index) => <div className="rule-card" key={rule.id}><strong>Rule {index + 1}</strong><select value={rule.feature} onChange={(event) => updateRule(rule.id, 'feature', event.target.value)}>{GROUPS.flatMap(([, labels]) => labels).map((label) => <option key={label}>{label}</option>)}</select><select value={rule.operator} onChange={(event) => updateRule(rule.id, 'operator', event.target.value)}><option value=">">&gt;</option><option value="<">&lt;</option></select><input type="number" value={rule.threshold} onChange={(event) => updateRule(rule.id, 'threshold', event.target.value)} /><span>adjust margin by</span><input type="number" step="0.5" value={rule.adjustment} onChange={(event) => updateRule(rule.id, 'adjustment', event.target.value)} />{rules.length > 1 && <button type="button" onClick={() => setRules((current) => current.filter((item) => item.id !== rule.id))}><X size={15} /></button>}</div>)}</div>}<button className="primary-model-button" type="button" onClick={save} disabled={loading || saved.length >= 3}><Save size={17} /> Save Model</button></section>
  <section className="model-panel model-results">
    <div className="panel-heading"><h2>Test results</h2></div>
    {!results ? (
      <>
        <p className="empty-model-state">Run the model against ten completed test games.</p>
        <button
          className="primary-model-button run-model-button"
          type="button"
          onClick={() => setResults(evaluate(model, testGames))}
        >
          <BarChart3 size={17} /> Run Tests
        </button>
      </>
    ) : (
      <div>
        <div className="result-score">
          <strong>{results.filter((game) => game.prediction === game.winner).length}/{results.length}</strong>
          <span>straight-up winners correct</span>
          <em>Test run complete</em>
        </div>
        <div className="test-games">
          {results.map((game) => (
            <div className="test-game" key={game.id}>
              <div>
                <strong>{game.away_team}</strong><span>at</span><strong>{game.home_team}</strong>
                <small>Final score: {game.away_team} {game.score_away} - {game.score_home} {game.home_team}</small>
                <small>Actual spread: {game.spread_home == null ? 'N/A' : game.home_team + ' ' + game.spread_home} · Actual O/U: {game.over_under ?? 'N/A'}</small>
                <small>Projected spread: {game.margin >= 0 ? game.home_team : game.away_team} {game.margin >= 0 ? '-' : '+'}{Math.abs(game.margin).toFixed(1)} · {game.confidence}% winner confidence</small>
                <small>Projected O/U: {game.projectedTotal == null ? 'N/A' : game.projectedTotal.toFixed(1)} · {game.totalBet} ({game.totalConfidence ?? 'N/A'}%)</small>
                <small>Recommended bet: {game.spreadBet} · Spread edge: {game.spreadEdge == null ? 'N/A' : game.spreadEdge.toFixed(1)} points</small>
              </div>
              <span className={game.prediction === game.winner ? 'result-dot right' : 'result-dot wrong'}>
                {game.prediction === game.winner ? <Check size={15} /> : 'x'}
              </span>
            </div>
          ))}
        </div>
        <button
          className="primary-model-button run-model-button"
          type="button"
          style={{ marginTop: '14px' }}
          onClick={() => setResults(evaluate(model, testGames))}
        >
          <BarChart3 size={17} /> Re-run Tests
        </button>
      </div>
    )}
  </section>
  <section className="model-panel single-game-panel">
    <div className="panel-heading"><h2>Run one game</h2></div>
    <label className="model-label">
      Current week upcoming game
      <select
        value={singleId}
        onChange={(event) => {
          setSingleId(event.target.value);
          setSingleResult(null);
        }}
        disabled={weekLoading || !upcomingWeekGames.length}
        className="single-game-select"
      >
        <option value="">
          {weekLoading
            ? 'Loading current week...'
            : !upcomingWeekGames.length
            ? 'No upcoming games remaining this week'
            : `Choose an upcoming game (${upcomingWeekGames.length} available)`}
        </option>
        {upcomingWeekGames.map((game) => (
          <option key={game.id} value={game.id}>
            {formatGame(game)}
          </option>
        ))}
      </select>
    </label>
    <button
      className="primary-model-button"
      type="button"
      onClick={() => {
        const game = upcomingWeekGames.find((item) => String(item.id) === singleId);
        if (game) setSingleResult(evaluate(model, [game])[0]);
      }}
      disabled={!singleId}
    >
      <BarChart3 size={17} /> Run Single Test
    </button>
    {singleResult && (
      <div className="single-result">
        <strong>{displayName(singleResult, singleResult.prediction)}</strong>
        <span>{singleResult.confidence}% winner confidence · {singleResult.spreadBet}</span>
        <small>Actual spread: {singleResult.spread_home ?? 'N/A'} · Projected spread: {singleResult.margin.toFixed(1)} · Edge: {singleResult.spreadEdge == null ? 'N/A' : singleResult.spreadEdge.toFixed(1)}</small>
        <small>Actual O/U: {singleResult.over_under ?? 'N/A'} · Projected O/U: {singleResult.projectedTotal == null ? 'N/A' : singleResult.projectedTotal.toFixed(1)}</small>
        <small>Recommended total: {singleResult.totalBet} · Confidence: {singleResult.totalConfidence ?? 'N/A'}%</small>
      </div>
    )}
  </section>
  <section className="model-panel saved-models"><div className="panel-heading"><h2>Saved models</h2></div>{saved.map((item) => <div className="saved-model" key={item.id}><strong>{item.name}</strong><small>{TYPES.find(([key]) => key === item.type)?.[1]}</small><button type="button" onClick={() => { setName(item.name); setType(item.type); setWeights(item.weights || DEFAULT_WEIGHTS); setRules(item.rules || [{ id: 1, ...NEW_RULE }]); setQuick(item.quick || quick); }}>Load</button><button type="button" onClick={() => { const next = saved.filter((entry) => entry.id !== item.id); setSaved(next); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }} aria-label={`Delete ${item.name}`}><Trash2 size={16} /></button></div>)}</section></div>;
}

function displayName(game, side) { return side === 'home' ? game.home_team : game.away_team; }
export default CreateModelPage;
