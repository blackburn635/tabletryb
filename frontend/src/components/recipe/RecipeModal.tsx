/**
 * RecipeModal — Full recipe detail overlay.
 * Ported from the prototype's RecipeModal.js → TypeScript.
 *
 * Shows: hero image, title, meta (time, servings, cuisine, dish type),
 * source URL link, summary, ingredients list, numbered instructions.
 */
import React from 'react';
import type { Recipe, Ingredient } from '@tabletryb/shared';

type RecipeData = Partial<Recipe> & { title: string };

interface RecipeModalProps {
  recipe: RecipeData;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const RecipeModal: React.FC<RecipeModalProps> = ({ recipe, onClose, onEdit, onDelete }) => {
  const ingredients = recipe.ingredients || [];
  const instructions = recipe.instructions || [];
  const hasRecipeDetail = ingredients.length > 0 || instructions.length > 0;

  return (
    <div className="recipe-modal-overlay" onClick={onClose}>
      <div className="recipe-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header image */}
        <div className="recipe-modal-hero">
          {recipe.image ? (
            <img
              src={recipe.image}
              alt={recipe.title}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '';
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                background: 'var(--clr-surface-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '3rem',
              }}
            >
              🍽️
            </div>
          )}
          <button className="recipe-modal-close" onClick={onClose}>
            ✕
          </button>
          <div className="recipe-modal-hero-overlay">
            {recipe.source && (
              <span
                className={`meal-card-source ${
                  recipe.source === 'claude-url' || recipe.source === 'claude-photo'
                    ? ''
                    : recipe.source === 'manual'
                      ? ''
                      : ''
                }`}
              >
                {recipe.source === 'claude-photo' && '📷 Photo Scan'}
                {recipe.source === 'claude-url' && '🔗 URL Import'}
                {recipe.source === 'manual' && '✏️ Manual'}
                {recipe.source === 'import' && '📥 Imported'}
              </span>
            )}
          </div>
        </div>

        {/* Title and meta */}
        <div className="recipe-modal-body">
          <h2 className="recipe-modal-title">{recipe.title}</h2>

          <div className="recipe-modal-meta">
            {(recipe.readyInMinutes ?? 0) > 0 && (
              <span className="recipe-meta-chip">⏱ {recipe.readyInMinutes} min</span>
            )}
            {(recipe.servings ?? 0) > 0 && (
              <span className="recipe-meta-chip">👥 {recipe.servings} servings</span>
            )}
            {recipe.cuisines && recipe.cuisines.length > 0 && (
              <span className="recipe-meta-chip">🌍 {recipe.cuisines.join(', ')}</span>
            )}
            {recipe.dishTypes && recipe.dishTypes.length > 0 && (
              <span className="recipe-meta-chip">🍽️ {recipe.dishTypes.join(', ')}</span>
            )}
          </div>

          {/* Source link */}
          {recipe.sourceUrl && (
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="recipe-source-link"
            >
              🔗 View original recipe
            </a>
          )}

          {/* Summary/Notes */}
          {recipe.summary && (
            <div className="recipe-section">
              <h3 className="recipe-section-heading">About</h3>
              <p className="recipe-summary">{stripHtml(recipe.summary)}</p>
            </div>
          )}

          {/* Ingredients */}
          {ingredients.length > 0 && (
            <div className="recipe-section">
              <h3 className="recipe-section-heading">
                🥘 Ingredients
                <span className="recipe-section-count">{ingredients.length} items</span>
              </h3>
              <ul className="recipe-ingredients">
                {ingredients.map((ing, i) => (
                  <li key={i} className="recipe-ingredient">
                    <span className="recipe-ingredient-bullet">•</span>
                    <span>{ing.original || formatIngredient(ing)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Instructions */}
          {instructions.length > 0 && (
            <div className="recipe-section">
              <h3 className="recipe-section-heading">
                📋 Instructions
                <span className="recipe-section-count">{instructions.length} steps</span>
              </h3>
              <ol className="recipe-steps">
                {instructions.map((step, i) => (
                  <li key={i} className="recipe-step">
                    <span className="recipe-step-number">{step.number || i + 1}</span>
                    <span className="recipe-step-text">{step.step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* No detail fallback */}
          {!hasRecipeDetail && (
            <div className="recipe-section" style={{ textAlign: 'center', padding: '24px 0' }}>
              <p style={{ color: 'var(--clr-text-2)', fontFamily: 'var(--font-display)' }}>
                {recipe.sourceUrl ? (
                  <>
                    Full recipe details are available at the{' '}
                    <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer">
                      original source
                    </a>
                    .
                  </>
                ) : (
                  'No detailed ingredients or instructions available for this recipe.'
                )}
              </p>
            </div>
          )}

          {/* Action buttons */}
          {(onEdit || onDelete) && (
            <div
              style={{
                display: 'flex',
                gap: '8px',
                marginTop: 'var(--space-md)',
                paddingTop: 'var(--space-md)',
                borderTop: '1px solid var(--clr-surface-2)',
              }}
            >
              {onEdit && (
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1, justifyContent: 'center', padding: '10px' }}
                  onClick={onEdit}
                >
                  ✏️ Edit Recipe
                </button>
              )}
              {onDelete && (
                <button
                  className="btn btn-secondary"
                  style={{
                    padding: '10px 16px',
                    color: 'var(--clr-danger)',
                  }}
                  onClick={onDelete}
                >
                  🗑️ Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeModal;

/** Strip HTML tags from summary text */
function stripHtml(html: string): string {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > 400 ? text.substring(0, 400) + '...' : text;
}

/** Format ingredient from structured data if no original string */
function formatIngredient(ing: Ingredient): string {
  const parts: string[] = [];
  if (ing.amount) {
    const amt =
      ing.amount === Math.floor(ing.amount)
        ? String(Math.floor(ing.amount))
        : ing.amount.toFixed(1);
    parts.push(amt);
  }
  if (ing.unit) parts.push(ing.unit);
  if (ing.name) parts.push(ing.name);
  return parts.join(' ');
}
