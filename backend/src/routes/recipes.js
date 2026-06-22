import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/init.js';

const router = express.Router();

// Get all recipes
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const recipes = db.prepare(`
      SELECT r.*, f.name as folderName
      FROM recipes r
      LEFT JOIN folders f ON r.folderId = f.id
      ORDER BY r.updatedAt DESC
    `).all();
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recipe by ID with ingredients
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(req.params.id);
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });

    const ingredients = db.prepare(
      'SELECT * FROM recipe_ingredients WHERE recipeId = ?'
    ).all(req.params.id);

    const dietTags = db.prepare(`
      SELECT dp.* FROM diet_preferences dp
      JOIN recipe_diet_tags rdt ON dp.id = rdt.dietPreferenceId
      WHERE rdt.recipeId = ?
    `).all(req.params.id);

    res.json({ ...recipe, ingredients, dietTags });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create recipe
router.post('/', (req, res) => {
  try {
    const { name, description, imageUrl, folderId, servings, ingredients, dietTags } = req.body;
    const db = getDb();
    const recipeId = uuidv4();

    db.prepare(
      `INSERT INTO recipes (id, name, description, imageUrl, folderId, servings)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(recipeId, name, description, imageUrl || null, folderId || null, servings || 1);

    // Add ingredients
    if (ingredients && Array.isArray(ingredients)) {
      const ingStmt = db.prepare(
        `INSERT INTO recipe_ingredients
         (id, recipeId, ingredientName, quantity, unit, calories, protein, carbs, fat, fiber)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      for (const ing of ingredients) {
        ingStmt.run(
          uuidv4(), recipeId, ing.name, ing.quantity, ing.unit,
          ing.calories || null, ing.protein || null, ing.carbs || null, ing.fat || null, ing.fiber || null
        );
      }
    }

    // Add diet tags
    if (dietTags && Array.isArray(dietTags)) {
      const tagStmt = db.prepare(
        `INSERT INTO recipe_diet_tags (recipeId, dietPreferenceId) VALUES (?, ?)`
      );
      for (const dietId of dietTags) {
        tagStmt.run(recipeId, dietId);
      }
    }

    res.status(201).json({ id: recipeId, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update recipe
router.put('/:id', (req, res) => {
  try {
    const { name, description, imageUrl, folderId, servings, ingredients, dietTags } = req.body;
    const db = getDb();

    db.prepare(
      `UPDATE recipes
       SET name = ?, description = ?, imageUrl = ?, folderId = ?, servings = ?, updatedAt = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).run(name, description, imageUrl || null, folderId || null, servings || 1, req.params.id);

    // Update ingredients
    db.prepare('DELETE FROM recipe_ingredients WHERE recipeId = ?').run(req.params.id);
    if (ingredients && Array.isArray(ingredients)) {
      const ingStmt = db.prepare(
        `INSERT INTO recipe_ingredients
         (id, recipeId, ingredientName, quantity, unit, calories, protein, carbs, fat, fiber)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      for (const ing of ingredients) {
        ingStmt.run(
          uuidv4(), req.params.id, ing.name, ing.quantity, ing.unit,
          ing.calories || null, ing.protein || null, ing.carbs || null, ing.fat || null, ing.fiber || null
        );
      }
    }

    // Update diet tags
    db.prepare('DELETE FROM recipe_diet_tags WHERE recipeId = ?').run(req.params.id);
    if (dietTags && Array.isArray(dietTags)) {
      const tagStmt = db.prepare(
        `INSERT INTO recipe_diet_tags (recipeId, dietPreferenceId) VALUES (?, ?)`
      );
      for (const dietId of dietTags) {
        tagStmt.run(req.params.id, dietId);
      }
    }

    res.json({ id: req.params.id, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete recipe
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM recipes WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
