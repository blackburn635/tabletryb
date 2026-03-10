/**
 * DashboardPage — The main signed-in home page.
 *
 * Three-tab workflow:
 *   Tab 1: "Selections"  — Randomly selected meals from recipe list. All users vote here.
 *   Tab 2: "Results"     — Final vote tally, organized by votes. Primary users select meals
 *                          for the grocery list. (Primary users only)
 *   Tab 3: "Grocery List" — Generated grocery list with store integrations. (Primary users only)
 *
 * Members (non-primary) only see Tab 1.
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  ThumbsUp, ThumbsDown, ChefHat, ShoppingCart,
  ListChecks, ArrowRight, Check, RefreshCw,
} from 'lucide-react';

type TabId = 'selections' | 'results' | 'grocery';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const isPrimary = user?.role === 'primary';
  const [activeTab, setActiveTab] = useState<TabId>('selections');

  const tabs: { id: TabId; label: string; icon: React.ReactNode; primaryOnly: boolean }[] = [
    { id: 'selections', label: 'Selections', icon: <ThumbsUp size={18} />, primaryOnly: false },
    { id: 'results', label: 'Results', icon: <ListChecks size={18} />, primaryOnly: true },
    { id: 'grocery', label: 'Grocery List', icon: <ShoppingCart size={18} />, primaryOnly: true },
  ];

  const visibleTabs = tabs.filter((t) => !t.primaryOnly || isPrimary);

  return (
    <div className="dashboard">
      {/* Tab bar */}
      <div className="dashboard-tabs">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            className={`dashboard-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="dashboard-content">
        {activeTab === 'selections' && <SelectionsTab />}
        {activeTab === 'results' && isPrimary && <ResultsTab />}
        {activeTab === 'grocery' && isPrimary && <GroceryTab />}
      </div>
    </div>
  );
};

// ============================================================================
// Tab 1: Selections — Voting interface (all users)
// ============================================================================
const SelectionsTab: React.FC = () => {
  // TODO: Port voting logic from prototype's VotingPage
  // - Fetch this week's randomly selected meals
  // - Show recipe cards with thumbs up/down buttons
  // - Show how others have voted (avatar + vote indicator per meal)

  return (
    <div className="tab-panel">
      <div className="tab-header">
        <div>
          <h2>This Week's Selections</h2>
          <p className="tab-subtitle">
            Vote on the meals you'd like this week. Everyone can see how the family voted.
          </p>
        </div>
      </div>

      {/* Placeholder meal cards — replace with real data */}
      <div className="meal-voting-grid">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="meal-vote-card">
            <div className="meal-vote-image">
              <ChefHat size={32} />
            </div>
            <div className="meal-vote-body">
              <h4>Recipe Placeholder {i}</h4>
              <p className="meal-vote-meta">30 min · 4 servings</p>

              {/* Vote buttons */}
              <div className="meal-vote-actions">
                <button className="vote-btn vote-btn--up" title="Vote yes">
                  <ThumbsUp size={16} />
                </button>
                <button className="vote-btn vote-btn--down" title="Vote no">
                  <ThumbsDown size={16} />
                </button>
              </div>

              {/* Who voted — visible to everyone */}
              <div className="meal-vote-summary">
                <span className="vote-dot vote-dot--up" title="Dad voted yes" />
                <span className="vote-dot vote-dot--up" title="Mom voted yes" />
                <span className="vote-dot vote-dot--down" title="Reece voted no" />
                <span className="vote-dot vote-dot--pending" title="Rane hasn't voted" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// Tab 2: Results — Vote tally + finalization (primary users only)
// ============================================================================
const ResultsTab: React.FC = () => {
  // TODO: Port finalization logic from prototype's FinalizePage
  // - Show all meals sorted by number of upvotes (descending)
  // - Include meals with zero votes at the bottom
  // - Primary user selects how many meals to include on grocery list
  // - "Finalize" button locks selections

  const [selectedCount, setSelectedCount] = useState(7);

  return (
    <div className="tab-panel">
      <div className="tab-header">
        <div>
          <h2>Vote Results</h2>
          <p className="tab-subtitle">
            Recipes ranked by votes. Select how many to add to the grocery list.
          </p>
        </div>
        <div className="tab-header-action">
          <label className="results-count-label">
            Meals to include:
            <select
              className="form-input results-count-select"
              value={selectedCount}
              onChange={(e) => setSelectedCount(Number(e.target.value))}
            >
              {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>{n} meals</option>
              ))}
            </select>
          </label>
          <button className="btn btn-primary">
            <Check size={16} />
            Finalize
          </button>
        </div>
      </div>

      {/* Placeholder results list */}
      <div className="results-list">
        {[
          { name: 'Chicken Parmesan', up: 4, down: 0 },
          { name: 'Beef Tacos', up: 3, down: 1 },
          { name: 'Salmon Bowl', up: 3, down: 1 },
          { name: 'Pasta Primavera', up: 2, down: 1 },
          { name: 'Thai Curry', up: 2, down: 2 },
          { name: 'Meatloaf', up: 1, down: 3 },
          { name: 'Veggie Stir Fry', up: 0, down: 0 },
        ].map((meal, i) => (
          <div key={i} className={`results-row ${i < selectedCount ? 'results-row--included' : ''}`}>
            <span className="results-rank">{i + 1}</span>
            <span className="results-name">{meal.name}</span>
            <span className="results-votes">
              <ThumbsUp size={14} /> {meal.up}
              <ThumbsDown size={14} /> {meal.down}
            </span>
            {i < selectedCount && (
              <span className="results-badge">
                <Check size={12} /> Included
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// Tab 3: Grocery List (primary users only)
// ============================================================================
const GroceryTab: React.FC = () => {
  // TODO: Port grocery list logic from prototype's GroceryListPage
  // - Generate consolidated list from finalized meals
  // - Group by aisle
  // - Separate pantry staples
  // - Show store links / cart-push buttons based on household settings

  return (
    <div className="tab-panel">
      <div className="tab-header">
        <div>
          <h2>Grocery List</h2>
          <p className="tab-subtitle">
            Consolidated from your finalized meals, grouped by store aisle.
          </p>
        </div>
        <div className="tab-header-action">
          <button className="btn btn-secondary">
            <RefreshCw size={16} />
            Regenerate
          </button>
          <button className="btn btn-primary">
            <ShoppingCart size={16} />
            Push to Cart
          </button>
        </div>
      </div>

      {/* Placeholder grocery sections */}
      {[
        { aisle: 'Produce', items: ['Onions (3)', 'Garlic (1 head)', 'Bell peppers (4)', 'Cilantro (1 bunch)'] },
        { aisle: 'Meat & Seafood', items: ['Chicken breast (3 lb)', 'Ground beef (2 lb)', 'Salmon fillets (1 lb)'] },
        { aisle: 'Dairy & Eggs', items: ['Mozzarella (1 lb)', 'Eggs (1 dozen)', 'Sour cream (8 oz)'] },
        { aisle: 'Pantry Check', items: ['Olive oil', 'Salt', 'Cumin', 'Soy sauce', 'Flour'] },
      ].map((section) => (
        <div key={section.aisle} className="grocery-section">
          <h3 className="grocery-aisle">{section.aisle}</h3>
          {section.items.map((item) => (
            <label key={item} className="grocery-item">
              <input type="checkbox" className="grocery-checkbox" />
              <span>{item}</span>
            </label>
          ))}
        </div>
      ))}
    </div>
  );
};

export default DashboardPage;
