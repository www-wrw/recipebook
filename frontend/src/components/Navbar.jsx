export default function Navbar({ currentView, setCurrentView }) {
  const navItems = [
    { id: 'recipes', label: 'Recipes' },
    { id: 'pantry', label: 'Pantry' },
    { id: 'shopping', label: 'Shopping List' }
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <h1 className="text-2xl font-bold text-blue-600">RecipeBook</h1>

          <div className="flex gap-6">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                  currentView === item.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
