import express from 'express';
import { getDb } from '../db/init.js';

const router = express.Router();

// Generate shopping list based on recipes and pantry
router.post('/generate', (req, res) => {
  try {
    const { recipeIds } = req.body;
    if (!recipeIds || !Array.isArray(recipeIds) || recipeIds.length === 0) {
      return res.status(400).json({ error: 'At least one recipe required' });
    }

    const db = getDb();

    // Get all ingredients from selected recipes
    const placeholders = recipeIds.map(() => '?').join(',');
    const recipeIngredients = db.prepare(`
      SELECT ingredientName, SUM(quantity) as totalQuantity, unit
      FROM recipe_ingredients
      WHERE recipeId IN (${placeholders})
      GROUP BY ingredientName, unit
    `).all(...recipeIds);

    // Get pantry items
    const pantryItems = db.prepare('SELECT name, quantity, unit FROM pantry').all();
    const pantryMap = new Map();
    pantryItems.forEach(item => {
      const key = `${item.name.toLowerCase()}:${item.unit}`;
      pantryMap.set(key, item.quantity);
    });

    // Calculate what's needed
    const shoppingList = recipeIngredients.filter(ingredient => {
      const key = `${ingredient.ingredientName.toLowerCase()}:${ingredient.unit}`;
      const pantryQty = pantryMap.get(key) || 0;
      return ingredient.totalQuantity > pantryQty;
    }).map(ingredient => ({
      name: ingredient.ingredientName,
      quantity: ingredient.totalQuantity,
      unit: ingredient.unit,
      needed: ingredient.totalQuantity - (pantryMap.get(`${ingredient.ingredientName.toLowerCase()}:${ingredient.unit}`) || 0)
    }));

    res.json(shoppingList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
