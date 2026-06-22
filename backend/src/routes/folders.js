import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/init.js';

const router = express.Router();

// List folders with a count of recipes in each
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const result = await db.query(`
      SELECT f.*, COUNT(r.id)::int as "recipeCount"
      FROM folders f
      LEFT JOIN recipes r ON r."folderId" = f.id
      GROUP BY f.id
      ORDER BY f.name
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create folder
router.post('/', async (req, res) => {
  try {
    const { name, color } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Folder name is required' });
    }
    const db = getDb();
    const id = uuidv4();

    await db.query(
      'INSERT INTO folders (id, name, color) VALUES ($1, $2, $3)',
      [id, name.trim(), color || null]
    );

    res.status(201).json({ id, name: name.trim(), color: color || null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rename / recolor folder
router.put('/:id', async (req, res) => {
  try {
    const { name, color } = req.body;
    const db = getDb();
    await db.query(
      'UPDATE folders SET name = $1, color = $2 WHERE id = $3',
      [name, color || null, req.params.id]
    );
    res.json({ id: req.params.id, name, color: color || null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete folder (recipes are kept; their folderId is set NULL by the FK rule)
router.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    await db.query('DELETE FROM folders WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
