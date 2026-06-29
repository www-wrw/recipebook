import { useState, useEffect } from 'react';
import api from '../api';

export default function ShoppingList() {
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipes, setSelectedRecipes] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      const response = await api.get('/recipes');
      setRecipes(response.data);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRecipe = (recipeId) => {
    setSelectedRecipes(prev =>
      prev.includes(recipeId)
        ? prev.filter(id => id !== recipeId)
        : [...prev, recipeId]
    );
  };

  const generateShoppingList = async () => {
    if (selectedRecipes.length === 0) {
      alert('Select at least one recipe');
      return;
    }

    try {
      const response = await api.post('/shopping-list/generate', {
        recipeIds: selectedRecipes
      });
      setShoppingList(response.data);
      setGenerated(true);
    } catch (error) {
      console.error('Error generating shopping list:', error);
      alert('Error generating shopping list');
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-ink/50 font-hand text-xl">Loading…</div>;
  }

  return (
    <div>
      <h1 className="font-display text-4xl font-extrabold text-ink mb-6">Shopping List</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recipe Selection */}
        <div className="lg:col-span-1">
          <div className="bg-parchment rounded-xl border border-edge shadow-card p-6">
            <h2 className="font-display text-xl font-bold text-ink mb-4">Select Recipes</h2>
            <div className="space-y-1 mb-4 max-h-96 overflow-y-auto">
              {recipes.length === 0 ? (
                <p className="text-ink/50 text-sm">No recipes yet</p>
              ) : (
                recipes.map(recipe => (
                  <label key={recipe.id} className="flex items-center p-2 hover:bg-cream rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedRecipes.includes(recipe.id)}
                      onChange={() => toggleRecipe(recipe.id)}
                      className="rounded border-edge text-tomato focus:ring-tomato"
                    />
                    <span className="ml-2 text-sm text-ink/80">{recipe.name}</span>
                  </label>
                ))
              )}
            </div>
            <button
              onClick={generateShoppingList}
              className="w-full bg-tomato hover:bg-tomato-dark text-cream px-4 py-2 rounded-lg transition font-medium shadow-card"
            >
              Generate List
            </button>
          </div>
        </div>

        {/* Shopping List */}
        <div className="lg:col-span-2">
          {generated && (
            <div className="bg-parchment rounded-xl border border-edge shadow-card p-6">
              <h2 className="font-display text-xl font-bold text-ink mb-4">Your List</h2>
              {shoppingList.length === 0 ? (
                <p className="text-ink/60 font-hand text-xl">All ingredients are in your pantry! 🎉</p>
              ) : (
                <div className="space-y-2">
                  {shoppingList.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-cream rounded-lg border border-edge/60">
                      <div>
                        <p className="font-medium text-ink">{item.name}</p>
                        <p className="text-sm text-ink/60">
                          Need: {item.needed.toFixed(2)} {item.unit}
                        </p>
                      </div>
                      <input type="checkbox" className="rounded border-edge text-sage focus:ring-sage" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
