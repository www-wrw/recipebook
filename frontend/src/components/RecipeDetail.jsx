import { useEffect, useState } from 'react';
import api from '../api';

const DIET_LABELS = {
  'anti-inflammatory': 'Anti-inflammatory',
  'high-fiber': 'High Fiber',
  'high-protein': 'High Protein',
  'low-fodmap': 'Low FODMAP',
  'vegetarian': 'Vegetarian',
  'vegan': 'Vegan',
  'keto': 'Keto',
  'gluten-free': 'Gluten-free'
};

export default function RecipeDetail({ recipeId, onClose, onEdit }) {
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dietAnalysis, setDietAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');

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

  const nutrition = (recipe?.ingredients || []).reduce((acc, i) => {
    const q = Number(i.quantity) || 0;
    acc.calories += (i.calories || 0) * q;
    acc.protein  += (i.protein  || 0) * q;
    acc.carbs    += (i.carbs    || 0) * q;
    acc.fat      += (i.fat      || 0) * q;
    acc.fiber    += (i.fiber    || 0) * q;
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

  const hasNutrition = nutrition.calories || nutrition.protein || nutrition.fiber;

  const runDietAnalysis = async () => {
    if (!recipe?.ingredients?.length) return;
    setAnalyzing(true);
    setAnalysisError('');
    try {
      const { data } = await api.post('/ai/analyze-diet', {
        recipeName: recipe.name,
        ingredients: recipe.ingredients
      });
      setDietAnalysis(data);
    } catch (err) {
      setAnalysisError(err.response?.data?.error || 'Analysis failed — check that ANTHROPIC_API_KEY is set on the server.');
      console.error('Diet analysis error:', err);
    } finally {
      setAnalyzing(false);
    }
  };

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
              <img src={recipe.imageUrl} alt={recipe.name} className="w-full h-56 object-cover rounded-lg mb-4"/>
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
                  ['Protein',  `${Math.round(nutrition.protein)}g`],
                  ['Carbs',    `${Math.round(nutrition.carbs)}g`],
                  ['Fat',      `${Math.round(nutrition.fat)}g`],
                  ['Fiber',    `${Math.round(nutrition.fiber)}g`]
                ].map(([label, val]) => (
                  <div key={label}>
                    <div className="text-lg font-semibold text-gray-900">{val}</div>
                    <div className="text-xs text-gray-500">{label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Diet Analysis */}
            <div className="border border-gray-200 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-900">AI Diet Analysis</h3>
                {!dietAnalysis && (
                  <button onClick={runDietAnalysis} disabled={analyzing}
                    className="flex items-center gap-2 text-sm bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition">
                    {analyzing ? (
                      <>
                        <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                        </svg>
                        Analyzing...
                      </>
                    ) : 'Analyze'}
                  </button>
                )}
              </div>

              {analysisError && (
                <p className="text-sm text-red-600">{analysisError}</p>
              )}

              {!dietAnalysis && !analyzing && !analysisError && (
                <p className="text-sm text-gray-400">Tap Analyze to see which diets this recipe qualifies for and get ingredient swap suggestions.</p>
              )}

              {dietAnalysis && (
                <>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {Object.entries(dietAnalysis.dietAnalysis || {}).map(([id, info]) => (
                      <div key={id} className={`p-2 rounded-lg text-xs ${info.qualifies ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                        <div className="flex items-center gap-1 font-medium mb-0.5">
                          <span>{info.qualifies ? '✓' : '✗'}</span>
                          <span className={info.qualifies ? 'text-green-800' : 'text-gray-500'}>{DIET_LABELS[id] || id}</span>
                        </div>
                        <p className={info.qualifies ? 'text-green-700' : 'text-gray-400'}>{info.reason}</p>
                      </div>
                    ))}
                  </div>

                  {dietAnalysis.suggestions?.length > 0 && (
                    <>
                      <h4 className="font-medium text-gray-800 mb-2 text-sm">Ingredient Swap Suggestions</h4>
                      <div className="space-y-2">
                        {dietAnalysis.suggestions.map((s, i) => (
                          <div key={i} className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="line-through text-gray-500">{s.original}</span>
                              <span className="text-blue-600">→</span>
                              <span className="font-medium text-blue-800">{s.substitute}</span>
                            </div>
                            <p className="text-gray-600 text-xs">{s.benefit}</p>
                            {s.dietTags?.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {s.dietTags.map(t => (
                                  <span key={t} className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{DIET_LABELS[t] || t}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <button onClick={() => { setDietAnalysis(null); runDietAnalysis(); }}
                    className="mt-3 text-xs text-purple-600 hover:text-purple-800">Refresh analysis</button>
                </>
              )}
            </div>

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
