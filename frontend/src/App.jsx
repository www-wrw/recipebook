import { useState, useEffect, useCallback } from 'react';
import api from './api';
import RecipeList from './components/RecipeList';
import RecipeForm from './components/RecipeForm';
import RecipeDetail from './components/RecipeDetail';
import FolderBar from './components/FolderBar';
import PantryManager from './components/PantryManager';
import ShoppingList from './components/ShoppingList';
import Navbar from './components/Navbar';

function App() {
  const [currentView, setCurrentView] = useState('recipes');
  const [recipes, setRecipes] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeFolder, setActiveFolder] = useState('all'); // 'all' | folderId
  const [formState, setFormState] = useState(null); // null | { recipe } (recipe null = new)
  const [detailId, setDetailId] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const [recipeRes, folderRes] = await Promise.all([
        api.get('/recipes'),
        api.get('/folders')
      ]);
      setRecipes(recipeRes.data);
      setFolders(folderRes.data);
      setError(null);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Could not reach the backend. It may be waking up — try again in ~30s.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const visibleRecipes = activeFolder === 'all'
    ? recipes
    : recipes.filter(r => r.folderId === activeFolder);

  return (
    <div className="min-h-screen bg-cream">
      <Navbar currentView={currentView} setCurrentView={setCurrentView} />

      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-4 bg-mustard/10 border border-mustard/40 text-ink rounded-lg text-sm">
            {error}
          </div>
        )}

        {currentView === 'recipes' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1 className="font-display text-4xl font-bold text-ink">Recipes</h1>
              <button
                onClick={() => setFormState({ recipe: null })}
                className="bg-tomato hover:bg-tomato-dark text-cream px-6 py-2 rounded-lg transition font-medium shadow-card"
              >
                + Add Recipe
              </button>
            </div>

            <FolderBar
              folders={folders}
              activeFolder={activeFolder}
              setActiveFolder={setActiveFolder}
              onChanged={refresh}
            />

            {loading ? (
              <div className="text-center py-12 text-ink/50 font-hand text-xl">Warming the oven…</div>
            ) : (
              <RecipeList
                recipes={visibleRecipes}
                onView={(id) => setDetailId(id)}
                onEdit={(recipe) => setFormState({ recipe })}
                onDeleted={refresh}
              />
            )}
          </div>
        )}

        {currentView === 'pantry' && <PantryManager />}
        {currentView === 'shopping' && <ShoppingList />}
      </main>

      {formState && (
        <RecipeForm
          recipe={formState.recipe}
          folders={folders}
          onClose={() => setFormState(null)}
          onSaved={() => { setFormState(null); refresh(); }}
        />
      )}

      {detailId && (
        <RecipeDetail
          recipeId={detailId}
          onClose={() => setDetailId(null)}
          onEdit={(recipe) => { setDetailId(null); setFormState({ recipe }); }}
        />
      )}
    </div>
  );
}

export default App;
