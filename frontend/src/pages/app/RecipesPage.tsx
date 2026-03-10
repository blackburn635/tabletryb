/**
 * RecipesPage — Recipe library (the "Favorites" from the personal app).
 * Three methods to add recipes:
 *   1. Photo scan (Claude AI vision)
 *   2. URL import (Claude AI text extraction)
 *   3. Manual entry
 */
import React, { useState } from 'react';
import {
  Camera, Globe, PenLine, Plus, Search, ChefHat, X,
} from 'lucide-react';

type AddMode = null | 'photo' | 'url' | 'manual';

const RecipesPage: React.FC = () => {
  const [addMode, setAddMode] = useState<AddMode>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // TODO: Fetch recipes from GET /v1/households/{hhId}/recipes
  const mockRecipes = [
    { id: '1', title: 'Chicken Parmesan', source: 'claude-url', readyInMinutes: 45, servings: 4 },
    { id: '2', title: 'Beef Tacos', source: 'claude-photo', readyInMinutes: 30, servings: 6 },
    { id: '3', title: 'Pasta Primavera', source: 'manual', readyInMinutes: 25, servings: 4 },
    { id: '4', title: 'Thai Green Curry', source: 'claude-url', readyInMinutes: 35, servings: 4 },
    { id: '5', title: 'Salmon Bowl', source: 'manual', readyInMinutes: 20, servings: 2 },
  ];

  return (
    <div className="page-container">
      <div className="recipes-header">
        <h1 className="page-title">Recipe List</h1>

        {/* Add recipe buttons */}
        <div className="recipes-add-group">
          <button className="btn btn-primary" onClick={() => setAddMode('photo')}>
            <Camera size={16} /> Photo
          </button>
          <button className="btn btn-primary" onClick={() => setAddMode('url')}>
            <Globe size={16} /> URL
          </button>
          <button className="btn btn-primary" onClick={() => setAddMode('manual')}>
            <PenLine size={16} /> Manual
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="recipes-search">
        <Search size={16} />
        <input
          type="text"
          placeholder="Search recipes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Add recipe modal/panel */}
      {addMode && (
        <div className="recipe-add-panel">
          <div className="recipe-add-panel-header">
            <h3>
              {addMode === 'photo' && <><Camera size={18} /> Scan a Recipe Photo</>}
              {addMode === 'url' && <><Globe size={18} /> Import from URL</>}
              {addMode === 'manual' && <><PenLine size={18} /> Add Manually</>}
            </h3>
            <button className="recipe-add-close" onClick={() => setAddMode(null)}>
              <X size={18} />
            </button>
          </div>
          <div className="recipe-add-panel-body">
            {addMode === 'photo' && (
              <div>
                <p className="recipe-add-desc">
                  Take a photo of a recipe card, cookbook page, or screenshot.
                  Our AI extracts every ingredient and step automatically.
                </p>
                <label className="recipe-upload-zone">
                  <Camera size={32} />
                  <span>Tap to take photo or upload image</span>
                  <input type="file" accept="image/*" capture="environment" hidden />
                </label>
              </div>
            )}
            {addMode === 'url' && (
              <div>
                <p className="recipe-add-desc">
                  Paste a URL from any recipe website. AI extracts the recipe automatically.
                </p>
                <div className="form-group">
                  <input className="form-input" type="url" placeholder="https://www.allrecipes.com/recipe/..." />
                </div>
                <button className="btn btn-primary">
                  <Globe size={16} /> Import Recipe
                </button>
              </div>
            )}
            {addMode === 'manual' && (
              <div>
                <p className="recipe-add-desc">
                  Enter recipe details by hand.
                </p>
                <div className="form-group">
                  <label className="form-label">Recipe Title</label>
                  <input className="form-input" placeholder="e.g., Mom's Lasagna" />
                </div>
                <button className="btn btn-primary">
                  <Plus size={16} /> Create Recipe
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recipe list */}
      <div className="recipes-grid">
        {mockRecipes
          .filter((r) => r.title.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((recipe) => (
            <div key={recipe.id} className="recipe-list-card">
              <div className="recipe-list-image">
                <ChefHat size={24} />
              </div>
              <div className="recipe-list-body">
                <h4>{recipe.title}</h4>
                <p>{recipe.readyInMinutes} min · {recipe.servings} servings</p>
                <span className="recipe-source-badge">
                  {recipe.source === 'claude-photo' && '📷 Photo'}
                  {recipe.source === 'claude-url' && '🔗 URL'}
                  {recipe.source === 'manual' && '✏️ Manual'}
                </span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default RecipesPage;
