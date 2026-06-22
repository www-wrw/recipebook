import { useState, useEffect, useRef } from 'react';
import api from '../api';

const DIET_OPTIONS = [
  { id: 'anti-inflammatory', name: 'Anti-inflammatory' },
  { id: 'high-fiber', name: 'High Fiber' },
  { id: 'high-protein', name: 'High Protein' },
  { id: 'low-fodmap', name: 'Low FODMAP' },
  { id: 'vegetarian', name: 'Vegetarian' },
  { id: 'vegan', name: 'Vegan' },
  { id: 'keto', name: 'Keto' },
  { id: 'gluten-free', name: 'Gluten-free' }
];

const UNITS = ['cup', 'tbsp', 'tsp', 'oz', 'lb', 'g', 'ml', 'piece'];

const EMPTY = {
  name: '',
  description: '',
  servings: 1,
  folderId: '',
  ingredients: [{ name: '', quantity: 1, unit: 'cup' }],
  dietTags: [],
  imageUrl: ''
};

export default function RecipeForm({ recipe, folders, onClose, onSaved }) {
  const isEdit = Boolean(recipe?.id);
  const [formData, setFormData] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanNote, setScanNote] = useState('');
  const scanInputRef = useRef(null);

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get(`/recipes/${recipe.id}`);
        if (cancelled) return;
        setFormData({
          name: data.name || '',
          description: data.description || '',
          servings: data.servings || 1,
          folderId: data.folderId || '',
          imageUrl: data.imageUrl || '',
          ingredients: data.ingredients?.length
            ? data.ingredients.map(i => ({
                name: i.ingredientName,
                quantity: i.quantity,
                unit: i.unit,
                calories: i.calories,
                protein: i.protein,
                carbs: i.carbs,
                fat: i.fat,
                fiber: i.fiber
              }))
            : [{ name: '', quantity: 1, unit: 'cup' }],
          dietTags: (data.dietTags || []).map(d => d.id)
        });
      } catch (err) {
        console.error('Could not load recipe for editing:', err);
      }
    })();
    return () => { cancelled = true; };
  }, [isEdit, recipe]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setFormData(prev => ({ ...prev, imageUrl: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleScanPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setScanning(true);
    setScanNote('');
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const { data } = await api.post('/ai/scan-recipe', {
          image: reader.result,
          mediaType: file.type || 'image/jpeg'
        });
        setFormData(prev => ({
          ...prev,
          name: data.name || prev.name,
          description: data.description || prev.description,
          servings: data.servings || prev.servings,
          imageUrl: reader.result,
          ingredients: data.ingredients?.length
            ? data.ingredients.map(i => ({
                name: i.name,
                quantity: i.quantity,
                unit: UNITS.includes(i.unit) ? i.unit : 'piece',
                calories: i.calories || null,
                protein: i.protein || null,
                carbs: i.carbs || null,
                fat: i.fat || null,
                fiber: i.fiber || null
              }))
            : prev.ingredients,
          dietTags: data.dietTags?.length ? data.dietTags : prev.dietTags
        }));
        if (data.dietReasoning) setScanNote(data.dietReasoning);
      } catch (err) {
        setScanNote(err.response?.data?.error || 'Could not analyze photo.');
        console.error('Scan error:', err);
      } finally {
        setScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleIngredientChange = (index, field, value) => {
    const next = [...formData.ingredients];
    next[index] = { ...next[index], [field]: value };
    setFormData(prev => ({ ...prev, ingredients: next }));
  };

  const addIngredient = () =>
    setFormData(prev => ({ ...prev, ingredients: [...prev.ingredients, { name: '', quantity: 1, unit: 'cup' }] }));

  const removeIngredient = (index) =>
    setFormData(prev => ({ ...prev, ingredients: prev.ingredients.filter((_, i) => i !== index) }));

  const toggleDiet = (dietId) =>
    setFormData(prev => ({
      ...prev,
      dietTags: prev.dietTags.includes(dietId)
        ? prev.dietTags.filter(d => d !== dietId)
        : [...prev.dietTags, dietId]
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...formData,
      servings: Number(formData.servings) || 1,
      folderId: formData.folderId || null,
      ingredients: formData.ingredients
        .filter(i => i.name.trim())
        .map(i => ({ ...i, quantity: Number(i.quantity) || 0 }))
    };
    try {
      if (isEdit) {
        await api.put(`/recipes/${recipe.id}`, payload);
      } else {
        await api.post('/recipes', payload);
      }
      onSaved();
    } catch (error) {
      console.error('Error saving recipe:', error);
      alert('Error saving recipe');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center overflow-y-auto p-4 z-50">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl p-6 my-8 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-1">
          <h2 className="text-2xl font-bold">{isEdit ? 'Edit Recipe' : 'Add New Recipe'}</h2>
          <button
            type="button"
            onClick={() => scanInputRef.current?.click()}
            disabled={scanning}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition text-sm font-medium"
          >
            {scanning ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Analyzing...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                Scan Photo
              </>
            )}
          </button>
          <input ref={scanInputRef} type="file" accept="image/*"
            className="hidden" onChange={handleScanPhoto}/>
        </div>
        <p className="text-xs text-gray-400 mb-5">Tap Scan Photo to auto-fill from a recipe image — AI extracts ingredients and detects diet tags.</p>

        {scanNote && (
          <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-800">
            <span className="font-semibold">AI: </span>{scanNote}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recipe Name *</label>
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Servings</label>
              <input type="number" name="servings" value={formData.servings} onChange={handleInputChange} min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Folder</label>
              <select name="folderId" value={formData.folderId} onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">No folder</option>
                {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recipe Image</label>
            <input type="file" accept="image/*" onChange={handleImageUpload}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"/>
            {formData.imageUrl && (
              <img src={formData.imageUrl} alt="preview" className="mt-2 h-32 object-cover rounded-md"/>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Diet Tags
              {formData.dietTags.length > 0 && (
                <span className="ml-2 text-xs text-purple-600 font-normal">auto-detected — review and adjust</span>
              )}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DIET_OPTIONS.map(diet => (
                <label key={diet.id} className="flex items-center">
                  <input type="checkbox" checked={formData.dietTags.includes(diet.id)}
                    onChange={() => toggleDiet(diet.id)} className="rounded border-gray-300 text-blue-600"/>
                  <span className="ml-2 text-sm text-gray-700">{diet.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Ingredients *</label>
              <button type="button" onClick={addIngredient}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium">+ Add Ingredient</button>
            </div>
            <div className="space-y-2">
              {formData.ingredients.map((ing, index) => (
                <div key={index} className="flex gap-2">
                  <input type="text" placeholder="Ingredient name" value={ing.name}
                    onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
                  <input type="number" placeholder="Qty" value={ing.quantity} step="any"
                    onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
                  <select value={ing.unit} onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    {UNITS.map(u => <option key={u}>{u}</option>)}
                  </select>
                  {formData.ingredients.length > 1 && (
                    <button type="button" onClick={() => removeIngredient(index)}
                      className="text-red-600 hover:text-red-700 font-medium px-2">×</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg transition font-medium">
              {saving ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Recipe')}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 px-6 py-2 rounded-lg transition font-medium">
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
