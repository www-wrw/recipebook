import express from 'express';
import axios from 'axios';
import { getDb } from '../db/init.js';

const router = express.Router();

const USDA_API_BASE = 'https://fdc.nal.usda.gov/api/foods/search';
// Set USDA_API_KEY in env for real use; DEMO_KEY is heavily rate-limited (shared
// globally, ~30 req/hour) and will 429 quickly. Free key: https://fdc.nal.usda.gov/api-key-signup.html
const USDA_API_KEY = process.env.USDA_API_KEY || 'DEMO_KEY';

// Search for ingredients nutrition data
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'Query must be at least 2 characters' });
    }

    const response = await axios.get(USDA_API_BASE, {
      params: {
        query,
        apiKey: USDA_API_KEY,
        pageSize: 10
      }
    });

    const foods = response.data.foods || [];
    const formatted = foods.map(food => ({
      id: food.fdcId,
      name: food.description,
      nutrients: parseNutrients(food.foodNutrients)
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Nutrition search error:', error.message);
    res.status(500).json({ error: 'Failed to search nutrition data' });
  }
});

// Calculate meal nutrition
router.post('/calculate', (req, res) => {
  try {
    const { ingredients } = req.body;
    if (!ingredients || !Array.isArray(ingredients)) {
      return res.status(400).json({ error: 'Invalid ingredients' });
    }

    let totals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0
    };

    for (const ing of ingredients) {
      if (ing.calories) totals.calories += ing.calories * ing.quantity;
      if (ing.protein) totals.protein += ing.protein * ing.quantity;
      if (ing.carbs) totals.carbs += ing.carbs * ing.quantity;
      if (ing.fat) totals.fat += ing.fat * ing.quantity;
      if (ing.fiber) totals.fiber += ing.fiber * ing.quantity;
    }

    res.json(totals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function parseNutrients(foodNutrients) {
  const nutrients = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0
  };

  if (!Array.isArray(foodNutrients)) return nutrients;

  foodNutrients.forEach(nutrient => {
    const value = nutrient.value || 0;
    const unitName = nutrient.unitName?.toLowerCase() || '';

    if (nutrient.nutrientName?.toLowerCase().includes('energy')) {
      nutrients.calories = unitName.includes('kcal') ? value : value * 4.184;
    } else if (nutrient.nutrientName?.toLowerCase().includes('protein')) {
      nutrients.protein = value;
    } else if (nutrient.nutrientName?.toLowerCase().includes('carbohydrate')) {
      nutrients.carbs = value;
    } else if (nutrient.nutrientName?.toLowerCase().includes('lipid') ||
               nutrient.nutrientName?.toLowerCase().includes('fat')) {
      nutrients.fat = value;
    } else if (nutrient.nutrientName?.toLowerCase().includes('fiber')) {
      nutrients.fiber = value;
    }
  });

  return nutrients;
}

export default router;
