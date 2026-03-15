/**
 * RecipeEditForm — Shared recipe edit/create form.
 * Ported from the prototype's RecipeEditForm.js → TypeScript.
 *
 * Used by:
 *   - Manual entry (empty initialData)
 *   - Photo scan review (pre-populated from Claude)
 *   - URL import review (pre-populated from Claude)
 *   - Editing an existing recipe (pre-populated from DB)
 */
import React, { useState, useEffect, useRef } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import type { AnalyzeRecipeResponse, Ingredient, Recipe } from '@tabletryb/shared';

type InitialData = Partial<AnalyzeRecipeResponse> &
  Partial<Pick<Recipe, 'recipeId' | 'sourceUrl' | 'source'>>;

interface RecipeEditFormProps {
  initialData?: InitialData;
  isEdit?: boolean;
  onSave: () => void;
  onCancel?: () => void;
  showToast: (message: string) => void;
}

interface FormState {
  title: string;
  readyInMinutes: string;
  servings: string;
  sourceUrl: string;
  cuisines: string;
  dishTypes: string;
  summary: string;
}

interface IngredientRow {
  original: string;
  name?: string;
  amount?: number;
  unit?: string;
  aisle?: string;
}

interface InstructionRow {
  step: string;
}

type ImageMode = 'keep' | 'upload' | 'url';

const RecipeEditForm: React.FC<RecipeEditFormProps> = ({
  initialData,
  isEdit = false,
  onSave,
  onCancel,
  showToast,
}) => {
  const api = useApi();
  const { user } = useAuth();

  const [form, setForm] = useState<FormState>({
    title: '',
    readyInMinutes: '',
    servings: '4',
    sourceUrl: '',
    cuisines: '',
    dishTypes: 'main course',
    summary: '',
  });
  const [ingredients, setIngredients] = useState<IngredientRow[]>([{ original: '' }]);
  const [instructions, setInstructions] = useState<InstructionRow[]>([{ step: '' }]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageMode, setImageMode] = useState<ImageMode>('upload');
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Populate from initialData
  useEffect(() => {
    if (!initialData) return;
    setForm({
      title: initialData.title || '',
      readyInMinutes: initialData.readyInMinutes ? String(initialData.readyInMinutes) : '',
      servings: initialData.servings ? String(initialData.servings) : '4',
      sourceUrl: initialData.sourceUrl || '',
      cuisines: Array.isArray(initialData.cuisines)
        ? initialData.cuisines.join(', ')
        : '',
      dishTypes: Array.isArray(initialData.dishTypes)
        ? initialData.dishTypes[0] || 'main course'
        : 'main course',
      summary: initialData.summary || '',
    });

    if (initialData.ingredients?.length) {
      setIngredients(
        initialData.ingredients.map((ing) => ({
          original: ing.original || ing.name || '',
          name: ing.name || '',
          amount: ing.amount || 0,
          unit: ing.unit || '',
          aisle: ing.aisle || '',
        }))
      );
    }

    if (initialData.instructions?.length) {
      setInstructions(
        initialData.instructions.map((inst) => ({
          step: inst.step || '',
        }))
      );
    }

    if (initialData.image) {
      setExistingImageUrl(initialData.image);
      setImageMode('keep');
    } else {
      setImageMode('upload');
    }
  }, [initialData]);

  const updateField = (field: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be under 5MB');
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      showToast('Recipe title is required');
      return;
    }

    if (!user?.householdId) {
      showToast('No household found');
      return;
    }

    setSaving(true);
    try {
      // Resolve image URL
      let finalImageUrl = existingImageUrl;
      if (imageMode === 'upload' && imageFile) {
        // TODO: Implement S3 presigned upload via image-upload Lambda
        finalImageUrl = '';
      } else if (imageMode === 'url' && imageUrlInput.trim()) {
        finalImageUrl = imageUrlInput.trim();
      }

      const cleanIngredients: Ingredient[] = ingredients
        .filter((ing) => ing.original.trim())
        .map((ing) => ({
          name: ing.name || ing.original.trim(),
          amount: ing.amount || 0,
          unit: ing.unit || '',
          original: ing.original.trim(),
          aisle: ing.aisle || '',
        }));

      const cleanInstructions = instructions
        .filter((inst) => inst.step.trim())
        .map((inst, idx) => ({
          number: idx + 1,
          step: inst.step.trim(),
        }));

      // Determine source type
      let source: string = 'manual';
      if (isEdit && initialData?.source) {
        source = initialData.source; // preserve original source on edit
      } else if (initialData?.sourceUrl) {
        source = 'claude-url';
      }

      const recipe = {
        title: form.title.trim(),
        image: finalImageUrl,
        readyInMinutes: parseInt(form.readyInMinutes) || 0,
        servings: parseInt(form.servings) || 4,
        sourceUrl: form.sourceUrl.trim(),
        summary: form.summary.trim(),
        cuisines: form.cuisines
          ? form.cuisines.split(',').map((c) => c.trim()).filter(Boolean)
          : [],
        dishTypes: form.dishTypes ? [form.dishTypes.trim()] : ['main course'],
        diets: [],
        ingredients: cleanIngredients,
        instructions: cleanInstructions,
        source,
      };

      const basePath = `/v1/households/${user.householdId}/recipes`;

      if (isEdit && initialData?.recipeId) {
        await api.put(`${basePath}/${initialData.recipeId}`, recipe);
      } else {
        await api.post(basePath, recipe);
      }

      showToast(`"${recipe.title}" ${isEdit ? 'updated' : 'saved'}!`);
      onSave();
    } catch (err) {
      console.error(err);
      showToast('Failed to save recipe.');
    } finally {
      setSaving(false);
    }
  };

  const currentImage =
    imageMode === 'upload' && imagePreview
      ? imagePreview
      : imageMode === 'url' && imageUrlInput
        ? imageUrlInput
        : existingImageUrl;

  return (
    <div style={{ maxWidth: '700px' }}>
      <div className="settings-group">
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            marginBottom: '16px',
          }}
        >
          {isEdit ? '✏️ Edit Recipe' : '✏️ Review & Save Recipe'}
        </h3>

        {/* Title */}
        <div className="manual-field">
          <label className="manual-label">
            Recipe Title <span style={{ color: 'var(--clr-danger)' }}>*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="e.g., Grandma's Chicken Pot Pie"
            style={{ width: '100%' }}
          />
        </div>

        {/* Display Photo */}
        <div className="manual-field">
          <label className="manual-label">Display Photo</label>
          {currentImage && (
            <img
              src={currentImage}
              alt="Recipe"
              className="image-preview"
              style={{ marginBottom: '12px', maxHeight: '200px', borderRadius: 'var(--radius-sm)' }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            {existingImageUrl && (
              <button
                className={`btn ${imageMode === 'keep' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setImageMode('keep')}
                style={{ padding: '6px 14px', fontSize: '0.82rem' }}
              >
                ✓ Keep Current
              </button>
            )}
            <button
              className={`btn ${imageMode === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setImageMode('upload')}
              style={{ padding: '6px 14px', fontSize: '0.82rem' }}
            >
              📁 Upload New
            </button>
            <button
              className={`btn ${imageMode === 'url' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setImageMode('url')}
              style={{ padding: '6px 14px', fontSize: '0.82rem' }}
            >
              🔗 Paste URL
            </button>
          </div>
          {imageMode === 'upload' && (
            <div>
              <div
                className="image-dropzone"
                onClick={() => fileInputRef.current?.click()}
                style={{ cursor: 'pointer' }}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="image-preview" />
                ) : (
                  <div className="dropzone-placeholder">
                    <span style={{ fontSize: '2rem' }}>📷</span>
                    <span>Click to select a photo</span>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>
          )}
          {imageMode === 'url' && (
            <input
              type="text"
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              style={{ width: '100%' }}
            />
          )}
        </div>

        {/* Time and Servings */}
        <div style={{ display: 'flex', gap: '16px' }}>
          <div className="manual-field" style={{ flex: 1 }}>
            <label className="manual-label">Prep Time (min)</label>
            <input
              type="number"
              value={form.readyInMinutes}
              onChange={(e) => updateField('readyInMinutes', e.target.value)}
              placeholder="45"
              style={{ width: '100%' }}
            />
          </div>
          <div className="manual-field" style={{ flex: 1 }}>
            <label className="manual-label">Servings</label>
            <input
              type="number"
              value={form.servings}
              onChange={(e) => updateField('servings', e.target.value)}
              placeholder="4"
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Cuisine and Meal Type */}
        <div style={{ display: 'flex', gap: '16px' }}>
          <div className="manual-field" style={{ flex: 1 }}>
            <label className="manual-label">Cuisine</label>
            <input
              type="text"
              value={form.cuisines}
              onChange={(e) => updateField('cuisines', e.target.value)}
              placeholder="Italian, Mexican"
              style={{ width: '100%' }}
            />
          </div>
          <div className="manual-field" style={{ flex: 1 }}>
            <label className="manual-label">Meal Type</label>
            <select
              value={form.dishTypes}
              onChange={(e) => updateField('dishTypes', e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="main course">Main Course</option>
              <option value="dinner">Dinner</option>
              <option value="lunch">Lunch</option>
              <option value="breakfast">Breakfast</option>
              <option value="side dish">Side Dish</option>
              <option value="soup">Soup</option>
              <option value="salad">Salad</option>
              <option value="dessert">Dessert</option>
              <option value="snack">Snack</option>
              <option value="appetizer">Appetizer</option>
            </select>
          </div>
        </div>

        {/* Ingredients */}
        <div className="manual-field">
          <label className="manual-label">Ingredients</label>
          <p
            style={{
              fontSize: '0.8rem',
              color: 'var(--clr-text-2)',
              marginBottom: '8px',
              fontFamily: 'var(--font-display)',
            }}
          >
            One per line (e.g., "2 cups flour" or "1 lb chicken breast")
          </p>
          {ingredients.map((ing, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
              <input
                type="text"
                value={ing.original}
                onChange={(e) => {
                  const updated = [...ingredients];
                  updated[i] = { ...updated[i], original: e.target.value };
                  setIngredients(updated);
                }}
                placeholder={`Ingredient ${i + 1}`}
                style={{ flex: 1 }}
              />
              {ingredients.length > 1 && (
                <button
                  className="btn btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                  onClick={() => setIngredients(ingredients.filter((_, j) => j !== i))}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            className="btn btn-secondary"
            style={{ fontSize: '0.82rem', padding: '6px 14px', marginTop: '4px' }}
            onClick={() => setIngredients([...ingredients, { original: '' }])}
          >
            + Add Ingredient
          </button>
        </div>

        {/* Instructions */}
        <div className="manual-field">
          <label className="manual-label">Instructions</label>
          {instructions.map((inst, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '6px',
                alignItems: 'flex-start',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  color: 'var(--clr-accent)',
                  minWidth: '24px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {i + 1}.
              </span>
              <textarea
                value={inst.step}
                onChange={(e) => {
                  const updated = [...instructions];
                  updated[i] = { step: e.target.value };
                  setInstructions(updated);
                }}
                placeholder={`Step ${i + 1}`}
                rows={2}
                style={{
                  flex: 1,
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.9rem',
                  padding: '8px 12px',
                  border: '1px solid var(--clr-border)',
                  borderRadius: 'var(--radius-sm)',
                  resize: 'vertical',
                  background: 'var(--clr-surface)',
                  color: 'var(--clr-text)',
                }}
              />
              {instructions.length > 1 && (
                <button
                  className="btn btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                  onClick={() => setInstructions(instructions.filter((_, j) => j !== i))}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            className="btn btn-secondary"
            style={{ fontSize: '0.82rem', padding: '6px 14px', marginTop: '4px' }}
            onClick={() => setInstructions([...instructions, { step: '' }])}
          >
            + Add Step
          </button>
        </div>

        {/* Source URL */}
        <div className="manual-field">
          <label className="manual-label">Recipe URL (optional)</label>
          <input
            type="text"
            value={form.sourceUrl}
            onChange={(e) => updateField('sourceUrl', e.target.value)}
            placeholder="https://allrecipes.com/..."
            style={{ width: '100%' }}
          />
        </div>

        {/* Notes */}
        <div className="manual-field">
          <label className="manual-label">Notes (optional)</label>
          <textarea
            value={form.summary}
            onChange={(e) => updateField('summary', e.target.value)}
            placeholder="Tips, modifications..."
            rows={3}
            style={{
              width: '100%',
              fontFamily: 'var(--font-display)',
              fontSize: '0.9rem',
              padding: '8px 12px',
              border: '1px solid var(--clr-border)',
              borderRadius: 'var(--radius-sm)',
              resize: 'vertical',
              background: 'var(--clr-surface)',
              color: 'var(--clr-text)',
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <button
            className="btn btn-success"
            onClick={handleSubmit}
            disabled={saving}
            style={{ flex: 1, justifyContent: 'center', padding: '14px' }}
          >
            {saving ? 'Saving...' : isEdit ? '💾 Save Changes' : '💾 Save Recipe'}
          </button>
          {onCancel && (
            <button
              className="btn btn-secondary"
              onClick={onCancel}
              style={{ padding: '14px 24px' }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeEditForm;
