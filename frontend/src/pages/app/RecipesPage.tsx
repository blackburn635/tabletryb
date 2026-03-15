/**
 * RecipesPage — Recipe library (the "Favorites" from the personal app).
 * Matches the prototype's FavoritesPage layout:
 *   - Meal-card tile grid with prominent photos
 *   - Click card to view full recipe in modal
 *   - Edit / delete buttons on each card
 *   - Three methods to add: Photo scan, URL import, Manual entry
 *   - Two-step AI flow: extract → review in RecipeEditForm → save
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import RecipeEditForm from '../../components/recipe/RecipeEditForm';
import RecipeModal from '../../components/recipe/RecipeModal';
import type { Recipe, AnalyzeRecipeResponse } from '@tabletryb/shared';

type AddMode = null | 'photo' | 'url' | 'manual' | 'edit';

const RecipesPage: React.FC = () => {
  const api = useApi();
  const { user } = useAuth();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [addMode, setAddMode] = useState<AddMode>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // AI extraction state
  const [aiExtractedData, setAiExtractedData] = useState<AnalyzeRecipeResponse | null>(null);

  // Edit state
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  // Modal state
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Toast
  const [toast, setToast] = useState<string | null>(null);
  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Load recipes from API
  const loadRecipes = useCallback(async () => {
    if (!user?.householdId) return;
    setLoading(true);
    try {
      const data = await api.get<Recipe[]>(
        `/v1/households/${user.householdId}/recipes`
      );
      setRecipes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load recipes:', err);
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  }, [api, user?.householdId]);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  // Close panel and reset all state
  const closePanel = () => {
    setAddMode(null);
    setEditingRecipe(null);
    setAiExtractedData(null);
  };

  // After save, close panel and refresh list
  const handleFormSaved = () => {
    closePanel();
    loadRecipes();
  };

  // Toggle add mode (click again to close)
  const toggleAddMode = (mode: AddMode) => {
    if (addMode === mode) {
      closePanel();
    } else {
      setAddMode(mode);
      setEditingRecipe(null);
      setAiExtractedData(null);
    }
  };

  // Open edit mode
  const openEdit = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setAiExtractedData(null);
    setAddMode('edit');
    setSelectedRecipe(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete recipe
  const handleDelete = async (recipeId: string) => {
    if (!user?.householdId) return;
    if (!window.confirm('Remove this recipe from your list?')) return;
    try {
      await api.del(`/v1/households/${user.householdId}/recipes/${recipeId}`);
      showToast('Recipe removed');
      setRecipes((prev) => prev.filter((r) => r.recipeId !== recipeId));
      setSelectedRecipe(null);
    } catch (err) {
      console.error(err);
      showToast('Failed to remove recipe.');
    }
  };

  // Filter by search
  const filteredRecipes = recipes.filter((r) =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const panelOpen = addMode !== null;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Loading recipes...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Recipes</h1>
        <p>
          {recipes.length} saved recipe{recipes.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* ---- Add Recipe Buttons ---- */}
      <div className="add-recipe-bar">
        <span className="add-recipe-label">Add a recipe:</span>
        <div className="add-recipe-buttons">
          <button
            className={`btn ${addMode === 'photo' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => toggleAddMode('photo')}
            style={{ fontSize: '0.85rem' }}
          >
            📷 Scan Photo
          </button>
          <button
            className={`btn ${addMode === 'url' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => toggleAddMode('url')}
            style={{ fontSize: '0.85rem' }}
          >
            🔗 Import URL
          </button>
          <button
            className={`btn ${addMode === 'manual' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => toggleAddMode('manual')}
            style={{ fontSize: '0.85rem' }}
          >
            ✏️ Manual
          </button>
        </div>
      </div>

      {/* ---- Expandable Panel ---- */}
      {panelOpen && (
        <div className="add-recipe-panel">
          <button className="add-panel-close" onClick={closePanel}>
            ✕ Close
          </button>

          {/* Manual Entry */}
          {addMode === 'manual' && (
            <RecipeEditForm
              showToast={showToast}
              onSave={handleFormSaved}
              onCancel={closePanel}
            />
          )}

          {/* Edit Existing */}
          {addMode === 'edit' && editingRecipe && (
            <RecipeEditForm
              initialData={editingRecipe}
              isEdit
              showToast={showToast}
              onSave={handleFormSaved}
              onCancel={closePanel}
            />
          )}

          {/* Photo Scan — Step 1: upload */}
          {addMode === 'photo' && !aiExtractedData && (
            <PhotoScanStep
              showToast={showToast}
              onExtracted={(data) => setAiExtractedData(data)}
              householdId={user?.householdId || ''}
              api={api}
            />
          )}
          {/* Photo Scan — Step 2: review & edit */}
          {addMode === 'photo' && aiExtractedData && (
            <div>
              <div className="ai-success-banner">
                ✓ Claude extracted "<strong>{aiExtractedData.title}</strong>" — review and
                edit below, then save.
              </div>
              <RecipeEditForm
                initialData={aiExtractedData}
                showToast={showToast}
                onSave={handleFormSaved}
                onCancel={() => setAiExtractedData(null)}
              />
            </div>
          )}

          {/* URL Import — Step 1: paste URL */}
          {addMode === 'url' && !aiExtractedData && (
            <UrlImportStep
              showToast={showToast}
              onExtracted={(data) => setAiExtractedData(data)}
              householdId={user?.householdId || ''}
              api={api}
            />
          )}
          {/* URL Import — Step 2: review & edit */}
          {addMode === 'url' && aiExtractedData && (
            <div>
              <div className="ai-success-banner">
                ✓ Claude extracted "<strong>{aiExtractedData.title}</strong>" — review and
                edit below, then save.
              </div>
              <RecipeEditForm
                initialData={aiExtractedData}
                showToast={showToast}
                onSave={handleFormSaved}
                onCancel={() => setAiExtractedData(null)}
              />
            </div>
          )}
        </div>
      )}

      {/* ---- Recipe Grid ---- */}
      {filteredRecipes.length > 0 ? (
        <div className="meals-grid" style={{ marginTop: panelOpen ? '24px' : '0' }}>
          {filteredRecipes.map((recipe) => (
            <div key={recipe.recipeId} className="meal-card">
              <div
                className="meal-card-image"
                onClick={() => setSelectedRecipe(recipe)}
                style={{ cursor: 'pointer' }}
              >
                {recipe.image ? (
                  <img src={recipe.image} alt={recipe.title} loading="lazy" />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      background: 'var(--clr-surface-2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2.5rem',
                    }}
                  >
                    🍽️
                  </div>
                )}
                {recipe.source && (
                  <span className="meal-card-source">
                    {recipe.source === 'claude-photo' && '📷 Photo'}
                    {recipe.source === 'claude-url' && '🔗 URL'}
                    {recipe.source === 'manual' && '✏️ Manual'}
                    {recipe.source === 'import' && '📥 Import'}
                  </span>
                )}
              </div>
              <div className="meal-card-body">
                <h3
                  className="meal-card-title"
                  onClick={() => setSelectedRecipe(recipe)}
                  style={{ cursor: 'pointer' }}
                >
                  {recipe.title}
                </h3>
                <div className="meal-card-meta">
                  {recipe.readyInMinutes > 0 && (
                    <span>⏱ {recipe.readyInMinutes} min</span>
                  )}
                  {recipe.servings > 0 && (
                    <span>👥 {recipe.servings} servings</span>
                  )}
                </div>
                {recipe.cuisines && recipe.cuisines.length > 0 && (
                  <div className="meal-card-meta">
                    <span>🌍 {recipe.cuisines.join(', ')}</span>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                  <button
                    className="btn btn-secondary"
                    style={{
                      flex: 1,
                      padding: '6px',
                      fontSize: '0.8rem',
                      justifyContent: 'center',
                    }}
                    onClick={() => openEdit(recipe)}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{
                      padding: '6px 10px',
                      fontSize: '0.8rem',
                      color: 'var(--clr-danger)',
                    }}
                    onClick={() => handleDelete(recipe.recipeId)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !panelOpen ? (
        <div className="favorites-empty">
          <span style={{ fontSize: '3rem' }}>🍽️</span>
          <h3>No recipes yet</h3>
          <p style={{ marginTop: '8px' }}>
            Use the buttons above to start adding recipes.
          </p>
        </div>
      ) : null}

      {/* ---- Recipe Detail Modal ---- */}
      {selectedRecipe && (
        <RecipeModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onEdit={() => openEdit(selectedRecipe)}
          onDelete={() => handleDelete(selectedRecipe.recipeId)}
        />
      )}

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
};

export default RecipesPage;


/* ================================================
   URL Import Step — Step 1 of URL import flow
   ================================================ */
interface StepProps {
  showToast: (msg: string) => void;
  onExtracted: (data: AnalyzeRecipeResponse) => void;
  householdId: string;
  api: ReturnType<typeof useApi>;
}

const UrlImportStep: React.FC<StepProps> = ({
  showToast,
  onExtracted,
  householdId,
  api,
}) => {
  const [url, setUrl] = useState('');
  const [importing, setImporting] = useState(false);

  const handleImport = async () => {
    if (!url.trim() || !url.startsWith('http')) {
      showToast('Enter a valid URL starting with http');
      return;
    }
    if (!householdId) {
      showToast('No household found');
      return;
    }

    setImporting(true);
    try {
      const data = await api.post<AnalyzeRecipeResponse>(
        `/v1/households/${householdId}/recipes/analyze`,
        { type: 'url', url: url.trim() }
      );
      const recipe = { ...data, sourceUrl: data.sourceUrl || url.trim() };
      showToast(`Extracted "${recipe.title}" — review below`);
      onExtracted(recipe);
    } catch (err) {
      console.error(err);
      showToast('Failed to import. The URL may be blocked or not contain a recipe.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div style={{ maxWidth: '700px' }}>
      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          marginBottom: '8px',
        }}
      >
        🔗 Import from URL
      </h3>
      <p
        style={{
          color: 'var(--clr-text-2)',
          fontSize: '0.9rem',
          marginBottom: '16px',
          fontFamily: 'var(--font-display)',
        }}
      >
        Paste a recipe URL. Claude AI visits the page and extracts the recipe —
        you'll review before saving.
      </p>
      <div className="manual-field">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.allrecipes.com/recipe/..."
          style={{ width: '100%' }}
          onKeyDown={(e) => e.key === 'Enter' && !importing && handleImport()}
        />
      </div>
      <button
        className="btn btn-primary"
        onClick={handleImport}
        disabled={!url.trim() || importing}
        style={{ width: '100%', justifyContent: 'center', padding: '14px' }}
      >
        {importing
          ? '🤖 Claude is extracting...'
          : '🤖 Extract Recipe with Claude AI'}
      </button>

      {importing && (
        <div style={{ marginTop: '12px', textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto' }} />
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.85rem',
              color: 'var(--clr-text-2)',
              marginTop: '8px',
            }}
          >
            Fetching page and analyzing... this may take 10–15 seconds.
          </p>
        </div>
      )}
    </div>
  );
};


/* ================================================
   Photo Scan Step — Step 1 of photo scan flow
   ================================================ */
const ACCEPTED_IMAGE_TYPES =
  'image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif';

const PhotoScanStep: React.FC<StepProps> = ({
  showToast,
  onExtracted,
  householdId,
  api,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.size > 10 * 1024 * 1024) {
      showToast('Image must be under 10MB');
      return;
    }
    setFile(selected);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(selected);
  };

  const handleAnalyze = async () => {
    if (!file || !householdId) return;

    setAnalyzing(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const data = await api.post<AnalyzeRecipeResponse>(
        `/v1/households/${householdId}/recipes/analyze`,
        {
          type: 'photo',
          imageData: base64,
          imageMimeType: file.type || 'image/jpeg',
        }
      );

      showToast(`Extracted "${data.title}" — review below`);
      onExtracted(data);
    } catch (err) {
      console.error(err);
      showToast('Failed to extract recipe from photo. Try a clearer image.');
    } finally {
      setAnalyzing(false);
    }
  };

  const fileSize = file
    ? file.size / 1024 < 1024
      ? `${(file.size / 1024).toFixed(0)} KB`
      : `${(file.size / 1024 / 1024).toFixed(1)} MB`
    : '';

  return (
    <div style={{ maxWidth: '700px' }}>
      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          marginBottom: '8px',
        }}
      >
        📷 Scan a Recipe Photo
      </h3>
      <p
        style={{
          color: 'var(--clr-text-2)',
          fontSize: '0.9rem',
          marginBottom: '16px',
          fontFamily: 'var(--font-display)',
        }}
      >
        Take a photo of a recipe card, cookbook page, or screenshot. Claude AI
        extracts the recipe — you'll review before saving.
      </p>

      <div
        className="image-dropzone"
        onClick={() => document.getElementById('scan-input')?.click()}
        style={{ marginBottom: '16px', cursor: 'pointer' }}
      >
        {preview ? (
          <img src={preview} alt="Preview" className="image-preview" />
        ) : (
          <div className="dropzone-placeholder">
            <span style={{ fontSize: '2.5rem' }}>📷</span>
            <span>Click to select a file</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--clr-text-2)' }}>
              JPG, PNG, WebP, GIF, or HEIC
            </span>
          </div>
        )}
      </div>
      <input
        id="scan-input"
        type="file"
        accept={ACCEPTED_IMAGE_TYPES}
        capture="environment"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {file && (
        <div
          style={{
            marginBottom: '12px',
            fontFamily: 'var(--font-display)',
            fontSize: '0.82rem',
            color: 'var(--clr-text-2)',
          }}
        >
          Selected: <strong>{file.name}</strong> ({fileSize})
        </div>
      )}

      <button
        className="btn btn-primary"
        onClick={handleAnalyze}
        disabled={!file || analyzing}
        style={{ width: '100%', justifyContent: 'center', padding: '14px' }}
      >
        {analyzing
          ? '🤖 Claude is analyzing...'
          : '🤖 Extract Recipe with Claude AI'}
      </button>

      {analyzing && (
        <div style={{ marginTop: '12px', textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto' }} />
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.85rem',
              color: 'var(--clr-text-2)',
              marginTop: '8px',
            }}
          >
            This may take 10–15 seconds...
          </p>
        </div>
      )}
    </div>
  );
};
