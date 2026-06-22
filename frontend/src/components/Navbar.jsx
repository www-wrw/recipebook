import { useState } from 'react';

const NAV_ITEMS = [
  { id: 'recipes',  label: 'Recipes' },
  { id: 'pantry',   label: 'Pantry' },
  { id: 'shopping', label: 'Shopping List' }
];

export default function Navbar({ currentView, setCurrentView }) {
  const [open, setOpen] = useState(false);

  const navigate = (id) => {
    setCurrentView(id);
    setOpen(false);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 relative z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <h1 className="text-xl font-bold text-blue-600">RecipeBook</h1>

          <button
            onClick={() => setOpen(o => !o)}
            aria-label="Menu"
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
          >
            {open ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)}/>
          <div className="absolute right-4 top-14 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-40">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`w-full text-left px-4 py-2.5 text-sm font-medium transition ${
                  currentView === item.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </nav>
  );
}
