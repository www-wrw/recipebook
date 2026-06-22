import express from 'express';
import { getDb } from '../db/init.js';

const router = express.Router();

// Generate shopping list based on recipes and pantry.
// Matching note: this compares on normalized ingredient name + unit. It does
// NOT yet convert between units (e.g. cups vs grams) — see roadmap.
router.post('/generate', async (req, res) => {
  try {
    const { recipeIds } = req.body;
    if (!recipeIds || !Array.isArray(recipeIds) || recipeIds.length === 0) {
      return res.status(400).json({ error: 'At least one recipe required' });
    }

    const db = getDb();

    const placeholders = recipeIds.map((_, i) => `$${i + 1}`).join(',');
    const recipeIngredients = await db.query(`
      SELECT "ingredientName", SUM(quantity) as "totalQuantity", unit
      FROM recipe_ingredients
      WHERE "recipeId" IN (${placeholders})
      GROUP BY "ingredientName", unit
    `, recipeIds);

    const pantryResult = await db.query('SELECT name, quantity, unit FROM pantry');
    const pantryMap = new Map();
    pantryResult.rows.forEach(item => {
      pantryMap.set(`${item.name.trim().toLowerCase()}:${item.unit}`, item.quantity);
    });

    const shoppingList = recipeIngredients.rows
      .map(ingredient => {
        const key = `${ingredient.ingredientName.trim().toLowerCase()}:${ingredient.unit}`;
        const pantryQty = pantryMap.get(key) || 0;
        return {
          name: ingredient.ingredientName,
          quantity: Number(ingredient.totalQuantity),
          unit: ingredient.unit,
          needed: Number(ingredient.totalQuantity) - pantryQty
        };
      })
      .filter(item => item.needed > 0);

    res.json(shoppingList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
