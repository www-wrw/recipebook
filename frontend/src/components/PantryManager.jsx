import { useEffect, useState, useRef } from 'react';
import api from '../api';
import { UNITS, PANTRY_CATEGORIES as CATEGORIES } from '../constants';

export default function PantryManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', quantity: 1, unit: 'cup', category: 'Other' });

  const [quickText, setQuickText] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [reviewItems, setReviewItems] = useState(null); // array under review, or null
  const scanInputRef = useRef(null);

  useEffect(() => { fetchPantryItems(); }, []);

  const fetchPantryItems = async () => {
    try {
      const response = await api.get('/pantry');
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching pantry:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/pantry', formData);
      setFormData({ name: '', quantity: 1, unit: 'cup', category: 'Other' });
      setShowForm(false);
      fetchPantryItems();
    } catch (error) {
      console.error('Error adding pantry item:', error);
      alert('Error adding item');
    }
  };

  const deleteItem = async (id) => {
    try {
      await api.delete(`/pantry/${id}`);
      fetchPantryItems();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  // Quick add: comma or newline separated item names -> bulk add as 1 piece each.
  const handleQuickAdd = async (e) => {
    e.preventDefault();
    const names = quickText.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
    if (names.length === 0) return;
    try {
      await api.post('/pantry/bulk', {
        items: names.map(name => ({ name, quantity: 1, unit: 'piece', category: 'Other' }))
      });
      setQuickText('');
      fetchPantryItems();
    } catch (error) {
      console.error('Quick add error:', error);
      alert('Could not add items');
    }
  };

  const readAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleScan = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setScanning(true);
    setScanError('');
    try {
      const images = await Promise.all(files.map(readAsDataUrl));
      const { data } = await api.post('/ai/scan-pantry', {
        images,
        mediaType: files[0].type || 'image/jpeg'
      });
      if (!data.items?.length) {
        setScanError('No food items detected — try a clearer photo.');
      } else {
        setReviewItems(data.items.map(i => ({
          name: i.name || '',
          quantity: i.quantity || 1,
          unit: UNITS.includes(i.unit) ? i.unit : 'piece',
          category: CATEGORIES.includes(i.category) ? i.category : 'Other'
        })));
      }
    } catch (err) {
      setScanError(err.response?.data?.error || 'Could not analyze photo(s).');
      console.error('Scan error:', err);
    } finally {
      setScanning(false);
      e.target.value = '';
    }
  };

  const updateReviewItem = (index, field, value) => {
    setReviewItems(prev => prev.map((it, i) => i === index ? { ...it, [field]: value } : it));
  };

  const removeReviewItem = (index) => {
    setReviewItems(prev => prev.filter((_, i) => i !== index));
  };

  const confirmReview = async () => {
    const valid = reviewItems.filter(i => i.name.trim());
    if (valid.length === 0) { setReviewItems(null); return; }
    try {
      await api.post('/pantry/bulk', { items: valid.map(i => ({ ...i, quantity: Number(i.quantity) || 1 })) });
      setReviewItems(null);
      fetchPantryItems();
    } catch (error) {
      console.error('Bulk add error:', error);
      alert('Could not add items');
    }
  };

  if (loading) return <div className="text-center py-8">Loading pantry...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Pantry</h1>
        <div className="flex gap-2">
          <button onClick={() => scanInputRef.current?.click()} disabled={scanning}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition text-sm font-medium">
            {scanning ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Scanning...
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
          <input ref={scanInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleScan}/>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition text-sm font-medium">
            {showForm ? 'Cancel' : 'Add Item'}
          </button>
        </div>
      </div>

      {scanError && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm">{scanError}</div>
      )}

      {/* Quick text add */}
      <form onSubmit={handleQuickAdd} className="mb-6 flex gap-2">
        <input type="text" value={quickText} onChange={(e) => setQuickText(e.target.value)}
          placeholder="Quick add — type items separated by commas (eggs, milk, rice...)"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"/>
        <button type="submit" className="bg-gray-800 hover:bg-gray-900 text-white px-5 py-2 rounded-lg transition text-sm font-medium">Add</button>
      </form>

      {/* Scan review panel */}
      {reviewItems && (
        <div className="mb-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-purple-900">Review detected items ({reviewItems.length})</h3>
            <button onClick={() => setReviewItems(null)} className="text-purple-400 hover:text-purple-700 text-xl leading-none">×</button>
          </div>
          <div className="space-y-2 mb-4">
            {reviewItems.map((it, index) => (
              <div key={index} className="flex gap-2 items-center bg-white rounded-lg p-2">
                <input value={it.name} onChange={(e) => updateReviewItem(index, 'name', e.target.value)}
                  className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm"/>
                <input type="number" value={it.quantity} step="any" onChange={(e) => updateReviewItem(index, 'quantity', e.target.value)}
                  className="w-16 px-2 py-1 border border-gray-200 rounded text-sm"/>
                <select value={it.unit} onChange={(e) => updateReviewItem(index, 'unit', e.target.value)}
                  className="px-1 py-1 border border-gray-200 rounded text-sm">
                  {UNITS.map(u => <option key={u}>{u}</option>)}
                </select>
                <select value={it.category} onChange={(e) => updateReviewItem(index, 'category', e.target.value)}
                  className="px-1 py-1 border border-gray-200 rounded text-sm hidden sm:block">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <button onClick={() => removeReviewItem(index)} className="text-red-400 hover:text-red-600 px-1 text-lg leading-none">×</button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={confirmReview}
              className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg transition text-sm font-medium">
              Add {reviewItems.length} {reviewItems.length === 1 ? 'item' : 'items'}
            </button>
            <button onClick={() => setReviewItems(null)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2 rounded-lg transition text-sm font-medium">Cancel</button>
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <select name="unit" value={formData.unit} onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                {UNITS.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition">Add</button>
            </div>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Item</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Quantity</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Unit</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Category</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No items in pantry</td>
              </tr>
            ) : (
              items.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.quantity}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.unit}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.category}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => deleteItem(item.id)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
