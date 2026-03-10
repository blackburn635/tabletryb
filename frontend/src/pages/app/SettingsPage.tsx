/**
 * SettingsPage — Household settings (primary users only).
 * - Number of recipes per selection page
 * - Select 1-3 grocery stores
 * - Day of week to reset selections
 * - How often to reset (weekly/biweekly/monthly)
 */
import React, { useState } from 'react';
import { Settings, Save, Store, Calendar, Hash } from 'lucide-react';
import { SUPPORTED_STORES } from '@tabletryb/shared';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const SettingsPage: React.FC = () => {
  // TODO: Fetch from GET /v1/households/{hhId} → settings
  const [mealsPerSelection, setMealsPerSelection] = useState(20);
  const [resetDay, setResetDay] = useState(5); // Friday
  const [resetFrequency, setResetFrequency] = useState<'weekly' | 'biweekly' | 'monthly'>('weekly');
  const [selectedStores, setSelectedStores] = useState<string[]>(['heb']);

  const toggleStore = (storeId: string) => {
    if (selectedStores.includes(storeId)) {
      setSelectedStores(selectedStores.filter((s) => s !== storeId));
    } else if (selectedStores.length < 3) {
      setSelectedStores([...selectedStores, storeId]);
    }
  };

  const handleSave = () => {
    // TODO: Call PUT /v1/households/{hhId}
    alert('Settings saved');
  };

  return (
    <div className="page-container">
      <h1 className="page-title"><Settings size={24} /> Settings</h1>

      <div className="settings-card">
        {/* Meals per selection */}
        <div className="settings-section">
          <h3><Hash size={18} /> Selection Size</h3>
          <p className="settings-desc">How many recipes to randomly include on the voting page each cycle.</p>
          <div className="settings-control">
            <input
              type="range" min={5} max={30} step={1}
              value={mealsPerSelection}
              onChange={(e) => setMealsPerSelection(Number(e.target.value))}
              className="settings-range"
            />
            <span className="settings-range-value">{mealsPerSelection} recipes</span>
          </div>
        </div>

        {/* Reset schedule */}
        <div className="settings-section">
          <h3><Calendar size={18} /> Reset Schedule</h3>
          <p className="settings-desc">When the selections refresh with new random recipes from your list.</p>
          <div className="settings-row">
            <div className="form-group">
              <label className="form-label">Reset Day</label>
              <select className="form-input form-select" value={resetDay} onChange={(e) => setResetDay(Number(e.target.value))}>
                {DAYS.map((day, i) => <option key={i} value={i}>{day}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Frequency</label>
              <select className="form-input form-select" value={resetFrequency} onChange={(e) => setResetFrequency(e.target.value as typeof resetFrequency)}>
                <option value="weekly">Every week</option>
                <option value="biweekly">Every 2 weeks</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
        </div>

        {/* Grocery stores */}
        <div className="settings-section">
          <h3><Store size={18} /> Grocery Stores</h3>
          <p className="settings-desc">Select up to 3 stores for grocery list links and cart integration.</p>
          <div className="store-picker">
            {SUPPORTED_STORES.map((store) => (
              <button
                key={store.storeId}
                className={`store-chip ${selectedStores.includes(store.storeId) ? 'store-chip--selected' : ''}`}
                onClick={() => toggleStore(store.storeId)}
                disabled={!selectedStores.includes(store.storeId) && selectedStores.length >= 3}
              >
                {store.displayName}
                {store.tier === 'cart-push' && <span className="store-chip-badge">Cart Push</span>}
              </button>
            ))}
          </div>
          <p className="settings-hint">{selectedStores.length}/3 selected</p>
        </div>

        <button className="btn btn-primary" onClick={handleSave}>
          <Save size={16} /> Save Settings
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
