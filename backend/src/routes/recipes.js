import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/init.js';

const router = express.Router();

// Get all recipes
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const result = await db.query(`
      SELECT r.*, f.name as "folderName"
      FROM recipes r
      LEFT JOIN folders f ON r."folderId" = f.id
      ORDER BY r."updatedAt" DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recipe by ID with ingredients
router.get('/:id', async (req, res) => {
  try {
    const db = getDb();
    const recipe = await db.query('SELECT * FROM recipes WHERE id = $1', [req.params.id]);
    if (recipe.rows.length === 0) return res.status(404).json({ error: 'Recipe not found' });

    const ingredients = await db.query(
      'SELECT * FROM recipe_ingredients WHERE "recipeId" = $1',
      [req.params.id]
    );

    const dietTags = await db.query(`
      SELECT dp.* FROM diet_preferences dp
      JOIN recipe_diet_tags rdt ON dp.id = rdt."dietPreferenceId"
      WHERE rdt."recipeId" = $1
    `, [req.params.id]);

    res.json({ ...recipe.rows[0], ingredients: ingredients.rows, dietTags: dietTags.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create recipe
router.post('/', async (req, res) => {
  try {
    const { name, description, imageUrl, folderId, servings, ingredients, dietTags } = req.body;
    const db = getDb();
    const recipeId = uuidv4();

    await db.query(
      `INSERT INTO recipes (id, name, description, "imageUrl", "folderId", servings)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [recipeId, name, description, imageUrl || null, folderId || null, servings || 1]
    );

    // Add ingredients
    if (ingredients && Array.isArray(ingredients)) {
      const ingStmt = `INSERT INTO recipe_ingredients
       (id, "recipeId", "ingredientName", quantity, unit, calories, protein, carbs, fat, fiber)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`;
      for (const ing of ingredients) {
        await db.query(ingStmt, [
          uuidv4(), recipeId, ing.name, ing.quantity, ing.unit,
          ing.calories || null, ing.protein || null, ing.carbs || null, ing.fat || null, ing.fiber || null
        ]);
      }
    }

    // Add diet tags
    if (dietTags && Array.isArray(dietTags)) {
      for (const dietId of dietTags) {
        await db.query(
          `INSERT INTO recipe_diet_tags ("recipeId", "dietPreferenceId") VALUES ($1, $2)`,
          [recipeId, dietId]
        );
      }
    }

    res.status(201).json({ id: recipeId, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update recipe
router.put('/:id', async (req, res) => {
  try {
    const { name, description, imageUrl, folderId, servings, ingredients, dietTags } = req.body;
    const db = getDb();

    await db.query(
      `UPDATE recipes
       SET name = $1, description = $2, "imageUrl" = $3, "folderId" = $4, servings = $5, "updatedAt" = CURRENT_TIMESTAMP
       WHERE id = $6`,
      [name, description, imageUrl || null, folderId || null, servings || 1, req.params.id]
    );

    // Update ingredients
    await db.query('DELETE FROM recipe_ingredients WHERE "recipeId" = $1', [req.params.id]);
    if (ingredients && Array.isArray(ingredients)) {
      const ingStmt = `INSERT INTO recipe_ingredients
       (id, "recipeId", "ingredientName", quantity, unit, calories, protein, carbs, fat, fiber)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`;
      for (const ing of ingredients) {
        await db.query(ingStmt, [
          uuidv4(), req.params.id, ing.name, ing.quantity, ing.unit,
          ing.calories || null, ing.protein || null, ing.carbs || null, ing.fat || null, ing.fiber || null
        ]);
      }
    }

    // Update diet tags
    await db.query('DELETE FROM recipe_diet_tags WHERE "recipeId" = $1', [req.params.id]);
    if (dietTags && Array.isArray(dietTags)) {
      for (const dietId of dietTags) {
        await db.query(
          `INSERT INTO recipe_diet_tags ("recipeId", "dietPreferenceId") VALUES ($1, $2)`,
          [req.params.id, dietId]
        );
      }
    }

    res.json({ id: req.params.id, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete recipe
router.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    await db.query('DELETE FROM recipes WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
