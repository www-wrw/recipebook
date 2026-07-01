import { useState } from 'react';

const NAV_ITEMS = [
  { id: 'recipes',  label: 'Recipes',       icon: '🍓' },
  { id: 'pantry',   label: 'Pantry',        icon: '🥫' },
  { id: 'shopping', label: 'Shopping List', icon: '🧺' }
];

export default function Navbar({ currentView, setCurrentView }) {
  const [open, setOpen] = useState(false);

  const navigate = (id) => {
    setCurrentView(id);
    setOpen(false);
  };

  return (
    <nav className="bg-parchment border-b border-edge relative z-40">
      {/* gingham picnic-cloth strip along the very top */}
      <div className="gingham-blue h-2.5 w-full" />

      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-baseline gap-2">
            <h1 className="font-display text-2xl font-bold tracking-wide text-tomato">RecipeBook</h1>
            <span className="hidden sm:inline font-hand text-lg text-sage">est. in the kitchen</span>
          </div>

          <button
            onClick={() => setOpen(o => !o)}
            aria-label="Menu"
            className="p-2 rounded-lg text-ink/70 hover:bg-cream hover:text-tomato transition"
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
          <div className="absolute right-4 top-[4.5rem] w-52 bg-parchment rounded-lg shadow-card border border-edge py-1.5 z-40">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`w-full text-left px-4 py-2.5 text-sm font-medium transition flex items-center gap-2.5 ${
                  currentView === item.id
                    ? 'bg-tomato/10 text-tomato'
                    : 'text-ink/80 hover:bg-cream'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </nav>
  );
}
