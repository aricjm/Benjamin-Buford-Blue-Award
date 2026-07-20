import { useState } from 'react';
import * as Lucide from 'lucide-react';

function ButtonsPage() {
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter out non-component exports from lucide-react
  // Lucide icons are typically functions (functional components) or forwardRef objects.
  // We also want to exclude helper functions like `createLucideIcon` or context objects.
  const iconNames = Object.keys(Lucide).filter(
    (key) =>
      /^[A-Z]/.test(key) && // Icon components start with an uppercase letter
      typeof Lucide[key] === 'object' && 
      Lucide[key].displayName // Lucide components have a displayName property
  );

  const filteredIcons = iconNames.filter((name) =>
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      <div className="control-card" style={{ marginTop: '2rem' }}>
        <h3>Lucide Icons Reference</h3>
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Search icons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontSize: '1rem'
            }}
          />
        </div>
        <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '4px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd', background: '#f9f9f9' }}>
                <th style={{ padding: '0.75rem' }}>Icon</th>
                <th style={{ padding: '0.75rem' }}>Name</th>
                <th style={{ padding: '0.75rem' }}>Usage Code</th>
              </tr>
            </thead>
            <tbody>
              {filteredIcons.map((name) => {
                const IconComponent = Lucide[name];
                // Double check that it's a valid component before rendering
                if (!IconComponent || typeof IconComponent === 'string') return null;
                
                return (
                  <tr key={name} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <IconComponent size={24} />
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{name}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <code>{`import { ${name} } from 'lucide-react';\n\n<${name} />`}</code>
                    </td>
                  </tr>
                );
              })}
              {filteredIcons.length === 0 && (
                <tr>
                  <td colSpan="3" style={{ padding: '1rem', textAlign: 'center', color: '#999' }}>
                    No icons found matching "{searchTerm}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default ButtonsPage;