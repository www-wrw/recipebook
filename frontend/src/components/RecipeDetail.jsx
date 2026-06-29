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

  const totals = (recipe?.ingredients || []).reduce((acc, i) => {
    const q = Number(i.quantity) || 0;
    acc.calories += (i.calories || 0) * q;
    acc.protein  += (i.protein  || 0) * q;
    acc.carbs    += (i.carbs    || 0) * q;
    acc.fat      += (i.fat      || 0) * q;
    acc.fiber    += (i.fiber    || 0) * q;
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

  const servings = Math.max(1, Number(recipe?.servings) || 1);
  const nutrition = {
    calories: totals.calories / servings,
    protein:  totals.protein  / servings,
    carbs:    totals.carbs    / servings,
    fat:      totals.fat      / servings,
    fiber:    totals.fiber    / servings,
  };

  const hasNutrition = totals.calories || totals.protein || totals.fiber;

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
      <div className="bg-parchment rounded-xl border border-edge shadow-xl p-6 my-8 w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        {loading ? (
          <div className="py-12 text-center text-ink/50 font-hand text-xl">Loading…</div>
        ) : !recipe ? (
          <div className="py-12 text-center text-ink/50">Recipe not found.</div>
        ) : (
          <>
            <div className="flex justify-between items-start mb-4">
              <h2 className="font-display text-3xl font-extrabold text-ink">{recipe.name}</h2>
              <button onClick={onClose} className="text-ink/40 hover:text-tomato text-2xl leading-none">×</button>
            </div>

            {recipe.imageUrl && (
              <img src={recipe.imageUrl} alt={recipe.name} className="w-full h-56 object-cover rounded-lg mb-4 border border-edge"/>
            )}

            {recipe.description && <p className="text-ink/70 mb-4">{recipe.description}</p>}
            <p className="text-sm text-ink/50 mb-4 font-hand text-base">Serves {recipe.servings}</p>

            {recipe.dietTags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {recipe.dietTags.map(tag => (
                  <span key={tag.id} className="px-2.5 py-1 bg-sage/15 text-sage-dark border border-sage/30 text-xs rounded-full">{tag.name}</span>
                ))}
              </div>
            )}

            <h3 className="font-display font-bold text-ink mb-2 text-lg">Ingredients</h3>
            <ul className="space-y-1 mb-6">
              {recipe.ingredients?.map(i => (
                <li key={i.id} className="text-sm text-ink/80 flex justify-between border-b border-edge/60 py-1.5">
                  <span>{i.ingredientName}</span>
                  <span className="text-ink/50">{i.quantity} {i.unit}</span>
                </li>
              ))}
            </ul>

            {recipe.instructions && (
              <>
                <h3 className="font-display font-bold text-ink mb-2 text-lg">Directions</h3>
                <ol className="space-y-2.5 mb-6">
                  {recipe.instructions.split('\n').filter(s => s.trim()).map((step, i) => (
                    <li key={i} className="text-sm text-ink/80 flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-tomato text-cream rounded-full text-xs flex items-center justify-center font-bold mt-0.5">
                        {i + 1}
                      </span>
                      <span className="pt-0.5">{step.replace(/^\d+[\.\)]\s*/, '')}</span>
                    </li>
                  ))}
                </ol>
              </>
            )}

            {hasNutrition && (
              <div className="bg-cream rounded-lg border border-edge p-4 mb-6">
                <p className="text-xs text-ink/40 text-center mb-2 uppercase tracking-wide">Per serving · {recipe.servings} servings total</p>
                <div className="grid grid-cols-5 gap-2 text-center">
                  {[
                    ['Calories', Math.round(nutrition.calories)],
                    ['Protein',  `${Math.round(nutrition.protein)}g`],
                    ['Carbs',    `${Math.round(nutrition.carbs)}g`],
                    ['Fat',      `${Math.round(nutrition.fat)}g`],
                    ['Fiber',    `${Math.round(nutrition.fiber)}g`]
                  ].map(([label, val]) => (
                    <div key={label}>
                      <div className="font-display text-xl font-bold text-tomato">{val}</div>
                      <div className="text-xs text-ink/50">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Diet Analysis */}
            <div className="border border-edge bg-cream/40 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-display font-bold text-ink text-lg">AI Diet Analysis</h3>
                {!dietAnalysis && (
                  <button onClick={runDietAnalysis} disabled={analyzing}
                    className="flex items-center gap-2 text-sm bg-cornflower hover:bg-cornflower-dark disabled:opacity-50 text-cream px-3 py-1.5 rounded-lg transition">
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
                <p className="text-sm text-tomato">{analysisError}</p>
              )}

              {!dietAnalysis && !analyzing && !analysisError && (
                <p className="text-sm text-ink/50">Tap Analyze to see which diets this recipe qualifies for and get ingredient swap suggestions.</p>
              )}

              {dietAnalysis && (
                <>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {Object.entries(dietAnalysis.dietAnalysis || {}).map(([id, info]) => (
                      <div key={id} className={`p-2 rounded-lg text-xs ${info.qualifies ? 'bg-sage/10 border border-sage/30' : 'bg-cream border border-edge'}`}>
                        <div className="flex items-center gap-1 font-medium mb-0.5">
                          <span className={info.qualifies ? 'text-sage-dark' : 'text-ink/40'}>{info.qualifies ? '✓' : '✗'}</span>
                          <span className={info.qualifies ? 'text-sage-dark' : 'text-ink/50'}>{DIET_LABELS[id] || id}</span>
                        </div>
                        <p className={info.qualifies ? 'text-sage-dark/80' : 'text-ink/40'}>{info.reason}</p>
                      </div>
                    ))}
                  </div>

                  {dietAnalysis.suggestions?.length > 0 && (
                    <>
                      <h4 className="font-medium text-ink mb-2 text-sm">Ingredient Swap Suggestions</h4>
                      <div className="space-y-2">
                        {dietAnalysis.suggestions.map((s, i) => (
                          <div key={i} className="bg-cornflower/10 border border-cornflower/25 rounded-lg p-3 text-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="line-through text-ink/50">{s.original}</span>
                              <span className="text-cornflower">→</span>
                              <span className="font-medium text-cornflower-dark">{s.substitute}</span>
                            </div>
                            <p className="text-ink/60 text-xs">{s.benefit}</p>
                            {s.dietTags?.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {s.dietTags.map(t => (
                                  <span key={t} className="px-1.5 py-0.5 bg-cornflower/15 text-cornflower-dark rounded text-xs">{DIET_LABELS[t] || t}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <button onClick={() => { setDietAnalysis(null); runDietAnalysis(); }}
                    className="mt-3 text-xs text-cornflower hover:text-cornflower-dark">Refresh analysis</button>
                </>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => onEdit(recipe)}
                className="flex-1 bg-tomato hover:bg-tomato-dark text-cream px-6 py-2 rounded-lg transition font-medium shadow-card">
                Edit
              </button>
              <button onClick={onClose}
                className="flex-1 bg-cream border border-edge hover:bg-edge/50 text-ink px-6 py-2 rounded-lg transition font-medium">
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
