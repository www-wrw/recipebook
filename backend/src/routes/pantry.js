import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/init.js';

const router = express.Router();

// Get all pantry items
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const result = await db.query('SELECT * FROM pantry ORDER BY category, name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add pantry item
router.post('/', async (req, res) => {
  try {
    const { name, quantity, unit, category, expiryDate } = req.body;
    const db = getDb();
    const id = uuidv4();

    await db.query(
      `INSERT INTO pantry (id, name, quantity, unit, category, "expiryDate")
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, name, quantity, unit, category || 'Other', expiryDate || null]
    );

    res.status(201).json({ id, name, quantity, unit, category, expiryDate });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk add pantry items (from photo scan or quick text entry)
router.post('/bulk', async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items array required' });
    }

    const db = getDb();
    const inserted = [];
    const sql = `INSERT INTO pantry (id, name, quantity, unit, category, "expiryDate")
                 VALUES ($1, $2, $3, $4, $5, $6)`;
    for (const item of items) {
      if (!item.name || !item.name.trim()) continue;
      const id = uuidv4();
      await db.query(sql, [
        id,
        item.name.trim(),
        item.quantity || 1,
        item.unit || 'piece',
        item.category || 'Other',
        item.expiryDate || null
      ]);
      inserted.push({ id, ...item });
    }

    res.status(201).json(inserted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update pantry item
router.put('/:id', async (req, res) => {
  try {
    const { name, quantity, unit, category, expiryDate } = req.body;
    const db = getDb();

    await db.query(
      `UPDATE pantry SET name = $1, quantity = $2, unit = $3, category = $4, "expiryDate" = $5
       WHERE id = $6`,
      [name, quantity, unit, category || 'Other', expiryDate || null, req.params.id]
    );

    res.json({ id: req.params.id, name, quantity, unit, category, expiryDate });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete pantry item
router.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    await db.query('DELETE FROM pantry WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
