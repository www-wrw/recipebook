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
      <div className="text-center py-16 text-ink/50">
        <p className="font-hand text-2xl mb-1">Nothing on the menu yet</p>
        <p className="text-sm">Add your first recipe to get started!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {recipes.map(recipe => (
        <div key={recipe.id} className="bg-parchment rounded-xl border border-edge shadow-card hover:-translate-y-0.5 hover:shadow-lg transition p-4 flex flex-col">
          {recipe.imageUrl && (
            <img
              src={recipe.imageUrl}
              alt={recipe.name}
              className="w-full h-48 object-cover rounded-lg mb-4 border border-edge"
            />
          )}
          <h3 className="font-display text-xl font-bold text-ink mb-2">{recipe.name}</h3>
          {recipe.description && (
            <p className="text-sm text-ink/70 mb-3 line-clamp-3">{recipe.description}</p>
          )}
          {recipe.folderName && (
            <p className="text-xs text-cornflower font-medium mb-3">📁 {recipe.folderName}</p>
          )}
          <div className="flex justify-end gap-3 mt-auto pt-3 border-t border-edge/60">
            <button onClick={() => onView(recipe.id)} className="text-tomato hover:text-tomato-dark text-sm font-medium">
              View
            </button>
            <button onClick={() => onEdit(recipe)} className="text-ink/60 hover:text-ink text-sm font-medium">
              Edit
            </button>
            <button onClick={() => deleteRecipe(recipe.id)} className="text-ink/40 hover:text-tomato text-sm font-medium">
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
