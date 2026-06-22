import { useEffect, useState } from 'react';
import api from '../api';

export default function RecipeDetail({ recipeId, onClose, onEdit }) {
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get(`/recipes/${recipeId}`);
        if (!cancelled) setRecipe(data);
      } catch (err) {
        console.error('Could not load recipe:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [recipeId]);

  // Per-ingredient nutrition is stored per unit; multiply by quantity for the total.
  const nutrition = (recipe?.ingredients || []).reduce((acc, i) => {
    const q = Number(i.quantity) || 0;
    acc.calories += (i.calories || 0) * q;
    acc.protein += (i.protein || 0) * q;
    acc.carbs += (i.carbs || 0) * q;
    acc.fat += (i.fat || 0) * q;
    acc.fiber += (i.fiber || 0) * q;
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

  const hasNutrition = nutrition.calories || nutrition.protein || nutrition.fiber;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center overflow-y-auto p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 my-8 w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        {loading ? (
          <div className="py-12 text-center text-gray-500">Loading...</div>
        ) : !recipe ? (
          <div className="py-12 text-center text-gray-500">Recipe not found.</div>
        ) : (
          <>
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900">{recipe.name}</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
            </div>

            {recipe.imageUrl && (
              <img src={recipe.imageUrl} alt={recipe.name} className="w-full h-56 object-cover rounded-lg mb-4" />
            )}

            {recipe.description && <p className="text-gray-600 mb-4">{recipe.description}</p>}

            <p className="text-sm text-gray-500 mb-4">Serves {recipe.servings}</p>

            {recipe.dietTags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {recipe.dietTags.map(tag => (
                  <span key={tag.id} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">{tag.name}</span>
                ))}
              </div>
            )}

            <h3 className="font-semibold text-gray-900 mb-2">Ingredients</h3>
            <ul className="space-y-1 mb-6">
              {recipe.ingredients?.map(i => (
                <li key={i.id} className="text-sm text-gray-700 flex justify-between border-b border-gray-100 py-1">
                  <span>{i.ingredientName}</span>
                  <span className="text-gray-500">{i.quantity} {i.unit}</span>
                </li>
              ))}
            </ul>

            {hasNutrition && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 grid grid-cols-5 gap-2 text-center">
                {[
                  ['Calories', Math.round(nutrition.calories)],
                  ['Protein', `${Math.round(nutrition.protein)}g`],
                  ['Carbs', `${Math.round(nutrition.carbs)}g`],
                  ['Fat', `${Math.round(nutrition.fat)}g`],
                  ['Fiber', `${Math.round(nutrition.fiber)}g`]
                ].map(([label, val]) => (
                  <div key={label}>
                    <div className="text-lg font-semibold text-gray-900">{val}</div>
                    <div className="text-xs text-gray-500">{label}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => onEdit(recipe)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition font-medium">
                Edit
              </button>
              <button onClick={onClose}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 px-6 py-2 rounded-lg transition font-medium">
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
