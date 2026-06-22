import { useState } from 'react';
import RecipeList from './components/RecipeList';
import RecipeForm from './components/RecipeForm';
import PantryManager from './components/PantryManager';
import ShoppingList from './components/ShoppingList';
import Navbar from './components/Navbar';

function App() {
  const [currentView, setCurrentView] = useState('recipes');
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentView={currentView} setCurrentView={setCurrentView} />

      <main className="container mx-auto px-4 py-8">
        {currentView === 'recipes' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Recipes</h1>
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
              >
                {showForm ? 'Cancel' : 'Add Recipe'}
              </button>
            </div>

            {showForm && <RecipeForm onClose={() => setShowForm(false)} />}
            <RecipeList />
          </div>
        )}

        {currentView === 'pantry' && <PantryManager />}
        {currentView === 'shopping' && <ShoppingList />}
      </main>
    </div>
  );
}

export default App;
