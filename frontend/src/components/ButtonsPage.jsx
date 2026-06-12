import { useState } from 'react';

function ButtonsPage() {
  const [selectedMeal, setSelectedMeal] = useState(null);

  return (
    <section className="panel buttons-panel">
      <h2>UI Controls Preview</h2>
      <p>Example buttons, radio groups, toggles, and dropdowns with dummy data.</p>

      <div className="demo-grid">
        <div className="control-card">
          <h3>Buttons</h3>
          <div className="button-row">
            <button className="sample-button">Primary</button>
            <button className="sample-button secondary">Secondary</button>
            <button className="sample-button danger">Danger</button>
            <button className="sample-button ghost">Ghost</button>
          </div>
        </div>

        <div className="control-card">
          <h3>Radio buttons</h3>
          <label><input type="radio" name="demo-radio" defaultChecked /> Option A</label>
          <label><input type="radio" name="demo-radio" /> Option B</label>
          <label><input type="radio" name="demo-radio" /> Option C</label>
        </div>

        <div className="control-card">
          <h3>Toggle switches</h3>
          <label className="toggle-switch">
            <input type="checkbox" defaultChecked />
            <span className="slider" />
            <span>Enable notifications</span>
          </label>
          <label className="toggle-switch">
            <input type="checkbox" />
            <span className="slider" />
            <span>Use dark mode</span>
          </label>
        </div>

        <div className="control-card">
          <h3>Dropdowns</h3>
          <label>
            Simple select
            <select>
              <option>Option 1</option>
              <option>Option 2</option>
              <option>Option 3</option>
            </select>
          </label>
          <label>
            Large select
            <select className="large-select">
              <option>Choose a team</option>
              <option>Team A</option>
              <option>Team B</option>
              <option>Team C</option>
            </select>
          </label>
        </div>

        <div className="control-card">
          <h3>Checkboxes</h3>
          <label><input type="checkbox" defaultChecked /> Auto sync</label>
          <label><input type="checkbox" /> Show scores</label>
        </div>

        <div className="control-card">
          <h3>Compact controls</h3>
          <div className="button-row compact">
            <button className="sample-button">Save</button>
            <button className="sample-button secondary">Cancel</button>
            <button className="sample-button danger">Delete</button>
          </div>
        </div>

        <div className="control-card">
          <h3>Pizza / Pasta switch</h3>
          <div className="meal-switch">
            <button
              type="button"
              className={`meal-switch-option ${selectedMeal === 'Pizza' ? 'active' : ''}`}
              onClick={() => setSelectedMeal('Pizza')}
            >
              Pizza
            </button>
            <button
              type="button"
              className={`meal-switch-option ${selectedMeal === null ? 'active' : ''}`}
              onClick={() => setSelectedMeal(null)}
            >
              Neither
            </button>
            <button
              type="button"
              className={`meal-switch-option ${selectedMeal === 'Pasta' ? 'active' : ''}`}
              onClick={() => setSelectedMeal('Pasta')}
            >
              Pasta
            </button>
            <span
              className="meal-switch-slider"
              style={{ 
                transform: selectedMeal === 'Pasta' ? 'translateX(200%)' : selectedMeal === 'Pizza' ? 'translateX(0)' : 'translateX(100%)',
                backgroundColor: selectedMeal === 'Pizza' ? '#ff9500' : (selectedMeal === 'Pasta' ? '#4caf50' : '#333333')
              }}
            />
          </div>
          <p className="switch-label">Selected: {selectedMeal || 'Neither'}</p>
        </div>
      </div>
    </section>
  );
}

export default ButtonsPage;