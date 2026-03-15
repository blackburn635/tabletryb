/**
 * RecipesPage — Recipe library (the "Favorites" from the personal app).
 * Three methods to add recipes:
 *   1. Photo scan (Claude AI vision)
 *   2. URL import (Claude AI text extraction)
 *   3. Manual entry
 *
 * Follows the prototype's two-step flow:
 *   Step 1: Input (paste URL / select photo / manual fields)
 *   Step 2: Review extracted data in RecipeEditForm → Save
 */
import React, { useState, useCallback } from 'react';
import {
  Camera, Globe, PenLine, Search, ChefHat, X, Loader,
} from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import RecipeEditForm from '../../components/recipe/RecipeEditForm';
import type { AnalyzeRecipeResponse } from '@tabletryb/shared';

type AddMode = null | 'photo' | 'url' | 'manual';

const RecipesPage: React.FC = () => {
  const api = useApi();
  const { user } = useAuth();

  const [addMode, setAddMode] = useState<AddMode>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // AI extraction state — shared across photo and URL modes
  const [aiExtractedData, setAiExtractedData] = useState<AnalyzeRecipeResponse | null>(null);

  // Toast
  const [toast, setToast] = useState<string | null>(null);
  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Close the add-recipe panel and reset all state
  const closePanel = () => {
    setAddMode(null);
    setAiExtractedData(null);
  };

  // After a recipe is saved, close panel and refresh
  const handleFormSaved = () => {
    closePanel();
    // TODO: Refresh recipe list from API
  };

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
          <button
            className={`btn ${addMode === 'photo' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setAiExtractedData(null); setAddMode(addMode === 'photo' ? null : 'photo'); }}
          >
            <Camera size={16} /> Photo
          </button>
          <button
            className={`btn ${addMode === 'url' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setAiExtractedData(null); setAddMode(addMode === 'url' ? null : 'url'); }}
          >
            <Globe size={16} /> URL
          </button>
          <button
            className={`btn ${addMode === 'manual' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setAiExtractedData(null); setAddMode(addMode === 'manual' ? null : 'manual'); }}
          >
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

      {/* ---- Expandable Add Recipe Panel ---- */}
      {addMode && (
        <div className="add-recipe-panel">
          <button className="add-panel-close" onClick={closePanel}>
            ✕ Close
          </button>

          {/* ======== MANUAL ENTRY ======== */}
          {addMode === 'manual' && (
            <RecipeEditForm
              showToast={showToast}
              onSave={handleFormSaved}
              onCancel={closePanel}
            />
          )}

          {/* ======== PHOTO SCAN ======== */}
          {/* Step 1: upload photo */}
          {addMode === 'photo' && !aiExtractedData && (
            <PhotoScanStep
              showToast={showToast}
              onExtracted={(data) => setAiExtractedData(data)}
              householdId={user?.householdId || ''}
              api={api}
            />
          )}
          {/* Step 2: review extracted data */}
          {addMode === 'photo' && aiExtractedData && (
            <div>
              <div className="ai-success-banner">
                ✓ Claude extracted "<strong>{aiExtractedData.title}</strong>" — review and edit below, then save.
              </div>
              <RecipeEditForm
                initialData={aiExtractedData}
                showToast={showToast}
                onSave={handleFormSaved}
                onCancel={() => setAiExtractedData(null)}
              />
            </div>
          )}

          {/* ======== URL IMPORT ======== */}
          {/* Step 1: paste URL */}
          {addMode === 'url' && !aiExtractedData && (
            <UrlImportStep
              showToast={showToast}
              onExtracted={(data) => setAiExtractedData(data)}
              householdId={user?.householdId || ''}
              api={api}
            />
          )}
          {/* Step 2: review extracted data */}
          {addMode === 'url' && aiExtractedData && (
            <div>
              <div className="ai-success-banner">
                ✓ Claude extracted "<strong>{aiExtractedData.title}</strong>" — review and edit below, then save.
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
                <p>
                  {recipe.readyInMinutes} min · {recipe.servings} servings
                </p>
                <span className="recipe-source-badge">
                  {recipe.source === 'claude-photo' && '📷 Photo'}
                  {recipe.source === 'claude-url' && '🔗 URL'}
                  {recipe.source === 'manual' && '✏️ Manual'}
                </span>
              </div>
            </div>
          ))}
      </div>

      {/* Toast notification */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
};

export default RecipesPage;


/* ================================================
   URL Import Step — Step 1 of URL import flow
   ================================================ */
interface UrlImportStepProps {
  showToast: (msg: string) => void;
  onExtracted: (data: AnalyzeRecipeResponse) => void;
  householdId: string;
  api: ReturnType<typeof useApi>;
}

const UrlImportStep: React.FC<UrlImportStepProps> = ({
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

      // Attach the source URL to the extracted data
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
      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '8px' }}>
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
        Paste a recipe URL. Claude AI visits the page and extracts the recipe — you'll review before saving.
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
        {importing ? (
          <>
            <Loader size={16} className="spin" /> Claude is extracting...
          </>
        ) : (
          '🤖 Extract Recipe with Claude AI'
        )}
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
interface PhotoScanStepProps {
  showToast: (msg: string) => void;
  onExtracted: (data: AnalyzeRecipeResponse) => void;
  householdId: string;
  api: ReturnType<typeof useApi>;
}

const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif';

const PhotoScanStep: React.FC<PhotoScanStepProps> = ({
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
      // Convert to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Strip the data URL prefix (e.g., "data:image/jpeg;base64,")
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

  const fileSize = file ? (file.size / 1024 < 1024
    ? `${(file.size / 1024).toFixed(0)} KB`
    : `${(file.size / 1024 / 1024).toFixed(1)} MB`) : '';

  return (
    <div style={{ maxWidth: '700px' }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '8px' }}>
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
        Take a photo of a recipe card, cookbook page, or screenshot.
        Claude AI extracts the recipe — you'll review before saving.
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
        {analyzing ? (
          <>
            <Loader size={16} className="spin" /> Claude is analyzing...
          </>
        ) : (
          '🤖 Extract Recipe with Claude AI'
        )}
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
