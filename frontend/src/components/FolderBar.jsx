import { useState } from 'react';
import api from '../api';

export default function FolderBar({ folders, activeFolder, setActiveFolder, onChanged }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  const createFolder = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await api.post('/folders', { name: name.trim() });
      setName('');
      setAdding(false);
      onChanged();
    } catch (err) {
      console.error('Could not create folder:', err);
      alert('Could not create folder');
    }
  };

  const deleteFolder = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this folder? Recipes inside it will be kept (just unfiled).')) return;
    try {
      await api.delete(`/folders/${id}`);
      if (activeFolder === id) setActiveFolder('all');
      onChanged();
    } catch (err) {
      console.error('Could not delete folder:', err);
    }
  };

  const chip = (active) =>
    `px-3 py-1.5 rounded-full text-sm font-medium transition cursor-pointer ${
      active ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
    }`;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <button className={chip(activeFolder === 'all')} onClick={() => setActiveFolder('all')}>
        All
      </button>

      {folders.map(f => (
        <button key={f.id} className={`${chip(activeFolder === f.id)} group flex items-center gap-2`}
          onClick={() => setActiveFolder(f.id)}>
          <span>📁 {f.name}</span>
          <span className="text-xs opacity-60">{f.recipeCount}</span>
          <span onClick={(e) => deleteFolder(f.id, e)}
            className="opacity-0 group-hover:opacity-100 hover:text-red-300">×</span>
        </button>
      ))}

      {adding ? (
        <form onSubmit={createFolder} className="flex items-center gap-2">
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Folder name"
            className="px-3 py-1.5 border border-gray-300 rounded-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          <button type="submit" className="text-blue-600 text-sm font-medium">Add</button>
          <button type="button" onClick={() => { setAdding(false); setName(''); }} className="text-gray-400 text-sm">Cancel</button>
        </form>
      ) : (
        <button onClick={() => setAdding(true)}
          className="px-3 py-1.5 rounded-full text-sm font-medium text-blue-600 border border-dashed border-blue-300 hover:bg-blue-50">
          + New Folder
        </button>
      )}
    </div>
  );
}
