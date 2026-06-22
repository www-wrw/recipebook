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
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Recipe Selection */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Select Recipes</h2>
          <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
            {recipes.length === 0 ? (
              <p className="text-gray-500 text-sm">No recipes yet</p>
            ) : (
              recipes.map(recipe => (
                <label key={recipe.id} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedRecipes.includes(recipe.id)}
                    onChange={() => toggleRecipe(recipe.id)}
                    className="rounded border-gray-300 text-blue-600"
                  />
                  <span className="ml-2 text-sm text-gray-700">{recipe.name}</span>
                </label>
              ))
            )}
          </div>
          <button
            onClick={generateShoppingList}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition font-medium"
          >
            Generate List
          </button>
        </div>
      </div>

      {/* Shopping List */}
      <div className="lg:col-span-2">
        {generated && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Shopping List</h2>
            {shoppingList.length === 0 ? (
              <p className="text-gray-500">All ingredients are in your pantry!</p>
            ) : (
              <div className="space-y-2">
                {shoppingList.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        Need: {item.needed.toFixed(2)} {item.unit}
                      </p>
                    </div>
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
