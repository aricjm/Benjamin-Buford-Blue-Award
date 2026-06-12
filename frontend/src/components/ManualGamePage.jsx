import React, { useState } from 'react';

const emptyManualGame = {
  home_team: '',
  away_team: '',
  commence_time: '',
  site: 'Manual',
  spread_home: '',
  spread_away: '',
  home_price: '',
  away_price: '',
  is_televised: false,
  is_mandatory: false
};

const ManualGamePage = ({ 
  teams, 
  selectedWeek, 
  selectedSeason, 
  addManualGame, 
  setMessage, 
  setAlertMessage, 
  setShowAlertModal, 
  loading 
}) => {
  const [manualGame, setManualGame] = useState(emptyManualGame);

  const handleManualGameChange = (field, value) => {
    // For number inputs, ensure value is either empty or a valid number
    if (['spread_home', 'spread_away', 'home_price', 'away_price'].includes(field)) {
      if (value === '' || !isNaN(Number(value))) {
        setManualGame((prev) => ({ ...prev, [field]: value }));
      }
    } else {
      setManualGame((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleAddManualGame = async () => {
    if (!manualGame.home_team || !manualGame.away_team || !manualGame.commence_time || selectedWeek === null || !selectedSeason) {
      setAlertMessage('Home team, away team, commence time, season, and week are required.');
      setShowAlertModal(true);
      return;
    }

    try {
      const result = await addManualGame({
        ...manualGame,
        spread_home: manualGame.spread_home ? Number(manualGame.spread_home) : null,
        spread_away: manualGame.spread_away ? Number(manualGame.spread_away) : null,
        home_price: manualGame.home_price ? Number(manualGame.home_price) : null,
        away_price: manualGame.away_price ? Number(manualGame.away_price) : null,
      });

      if (result.success) {
        setManualGame(emptyManualGame);
        setMessage('Manual game added.');
      } else {
        setMessage(result.error || 'Failed to add manual game.');
      }
    } catch (error) {
      setMessage('Unable to add manual game.');
    }
  };

  return (
    <section className="panel manual-panel">
      <h2>Add a Manual Game</h2>
      <div className="manual-grid">
        <label>
          Home team
          <select
            value={manualGame.home_team}
            onChange={(e) => handleManualGameChange('home_team', e.target.value)}
          >
            <option value="">-- Select Home Team --</option>
            {teams.map((t) => (
              <option key={t.id} value={t.school}>{t.school} {t.nickname}</option>
            ))}
          </select>
        </label>
        <label>
          Away team
          <select
            value={manualGame.away_team}
            onChange={(e) => handleManualGameChange('away_team', e.target.value)}
          >
            <option value="">-- Select Away Team --</option>
            {teams.map((t) => (
              <option key={t.id} value={t.school}>{t.school} {t.nickname}</option>
            ))}
          </select>
        </label>
        <label>
          Commence time
          <input
            type="datetime-local"
            value={manualGame.commence_time}
            onChange={(e) => handleManualGameChange('commence_time', e.target.value)}
          />
        </label>
        <label>
          Spread home
          <input
            type="number"
            step="0.5"
            value={manualGame.spread_home}
            onChange={(e) => handleManualGameChange('spread_home', e.target.value)}
            placeholder="e.g. -3.5"
          />
        </label>
        <label>
          Spread away
          <input
            type="number"
            step="0.5"
            value={manualGame.spread_away}
            onChange={(e) => handleManualGameChange('spread_away', e.target.value)}
            placeholder="e.g. 3.5"
          />
        </label>
        <label>
          Home price
          <input
            type="number"
            step="1"
            value={manualGame.home_price}
            onChange={(e) => handleManualGameChange('home_price', e.target.value)}
            placeholder="e.g. -110"
          />
        </label>
        <label>
          Away price
          <input
            type="number"
            step="1"
            value={manualGame.away_price}
            onChange={(e) => handleManualGameChange('away_price', e.target.value)}
            placeholder="e.g. -110"
          />
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={manualGame.is_televised}
            onChange={(e) => handleManualGameChange('is_televised', e.target.checked)}
          />
          Televised
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={manualGame.is_mandatory}
            onChange={(e) => handleManualGameChange('is_mandatory', e.target.checked)}
          />
          Mandatory
        </label>
      </div>
      <div className="actions manual-actions">
        <button disabled={loading || selectedWeek === null} onClick={handleAddManualGame}>Add Manual Game</button>
      </div>
    </section>
  );
};

export default ManualGamePage;