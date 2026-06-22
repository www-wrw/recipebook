import { useEffect, useState } from 'react';
import api from '../api';

export default function RecipeList() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const deleteRecipe = async (id) => {
    if (window.confirm('Delete this recipe?')) {
      try {
        await api.delete(`/recipes/${id}`);
        setRecipes(recipes.filter(r => r.id !== id));
      } catch (error) {
        console.error('Error deleting recipe:', error);
      }
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading recipes...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {recipes.length === 0 ? (
        <div className="col-span-full text-center py-12 text-gray-500">
          No recipes yet. Add one to get started!
        </div>
      ) : (
        recipes.map(recipe => (
          <div key={recipe.id} className="bg-white rounded-lg shadow hover:shadow-md transition p-4">
            {recipe.imageUrl && (
              <img
                src={recipe.imageUrl}
                alt={recipe.name}
                className="w-full h-48 object-cover rounded-md mb-4"
              />
            )}
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{recipe.name}</h3>
            {recipe.description && (
              <p className="text-sm text-gray-600 mb-3">{recipe.description}</p>
            )}
            {recipe.folderName && (
              <p className="text-xs text-blue-600 mb-3">📁 {recipe.folderName}</p>
            )}
            <div className="flex justify-end gap-2">
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View
              </button>
              <button
                onClick={() => deleteRecipe(recipe.id)}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
