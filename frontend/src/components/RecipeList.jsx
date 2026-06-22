import api from '../api';

export default function RecipeList({ recipes, onView, onEdit, onDeleted }) {
  const deleteRecipe = async (id) => {
    if (!window.confirm('Delete this recipe?')) return;
    try {
      await api.delete(`/recipes/${id}`);
      onDeleted();
    } catch (error) {
      console.error('Error deleting recipe:', error);
      alert('Could not delete recipe');
    }
  };

  if (recipes.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No recipes here yet. Add one to get started!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {recipes.map(recipe => (
        <div key={recipe.id} className="bg-white rounded-lg shadow hover:shadow-md transition p-4 flex flex-col">
          {recipe.imageUrl && (
            <img
              src={recipe.imageUrl}
              alt={recipe.name}
              className="w-full h-48 object-cover rounded-md mb-4"
            />
          )}
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{recipe.name}</h3>
          {recipe.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-3">{recipe.description}</p>
          )}
          {recipe.folderName && (
            <p className="text-xs text-blue-600 mb-3">📁 {recipe.folderName}</p>
          )}
          <div className="flex justify-end gap-3 mt-auto pt-2">
            <button onClick={() => onView(recipe.id)} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View
            </button>
            <button onClick={() => onEdit(recipe)} className="text-gray-600 hover:text-gray-900 text-sm font-medium">
              Edit
            </button>
            <button onClick={() => deleteRecipe(recipe.id)} className="text-red-600 hover:text-red-700 text-sm font-medium">
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
