import { useState } from 'react';
import api from '../api';

export default function RecipeForm({ onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    servings: 1,
    ingredients: [{ name: '', quantity: 1, unit: 'cup' }],
    dietTags: [],
    imageUrl: ''
  });

  const dietOptions = [
    { id: 'anti-inflammatory', name: 'Anti-inflammatory' },
    { id: 'high-fiber', name: 'High Fiber' },
    { id: 'high-protein', name: 'High Protein' },
    { id: 'low-fodmap', name: 'Low FODMAP' },
    { id: 'vegetarian', name: 'Vegetarian' },
    { id: 'vegan', name: 'Vegan' },
    { id: 'keto', name: 'Keto' },
    { id: 'gluten-free', name: 'Gluten-free' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIngredientChange = (index, field, value) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setFormData(prev => ({ ...prev, ingredients: newIngredients }));
  };

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: '', quantity: 1, unit: 'cup' }]
    }));
  };

  const removeIngredient = (index) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const toggleDiet = (dietId) => {
    setFormData(prev => ({
      ...prev,
      dietTags: prev.dietTags.includes(dietId)
        ? prev.dietTags.filter(d => d !== dietId)
        : [...prev.dietTags, dietId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/recipes', formData);
      onClose();
      window.location.reload();
    } catch (error) {
      console.error('Error creating recipe:', error);
      alert('Error creating recipe');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-2xl font-bold mb-6">Add New Recipe</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Recipe Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows="3"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Servings</label>
            <input
              type="number"
              name="servings"
              value={formData.servings}
              onChange={handleInputChange}
              min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recipe Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Diet Preferences</label>
          <div className="grid grid-cols-2 gap-2">
            {dietOptions.map(diet => (
              <label key={diet.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.dietTags.includes(diet.id)}
                  onChange={() => toggleDiet(diet.id)}
                  className="rounded border-gray-300 text-blue-600"
                />
                <span className="ml-2 text-sm text-gray-700">{diet.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">Ingredients *</label>
            <button
              type="button"
              onClick={addIngredient}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              + Add Ingredient
            </button>
          </div>
          <div className="space-y-2">
            {formData.ingredients.map((ing, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ingredient name"
                  value={ing.name}
                  onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                  required
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="number"
                  placeholder="Qty"
                  value={ing.quantity}
                  onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                  className="w-20 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <select
                  value={ing.unit}
                  onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option>cup</option>
                  <option>tbsp</option>
                  <option>tsp</option>
                  <option>oz</option>
                  <option>lb</option>
                  <option>g</option>
                  <option>ml</option>
                </select>
                {formData.ingredients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeIngredient(index)}
                    className="text-red-600 hover:text-red-700 font-medium"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition font-medium"
          >
            Create Recipe
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 px-6 py-2 rounded-lg transition font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
