import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/init.js';

const router = express.Router();

// Get all pantry items
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const items = db.prepare(
      'SELECT * FROM pantry ORDER BY category, name'
    ).all();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add pantry item
router.post('/', (req, res) => {
  try {
    const { name, quantity, unit, category, expiryDate } = req.body;
    const db = getDb();
    const id = uuidv4();

    db.prepare(
      `INSERT INTO pantry (id, name, quantity, unit, category, expiryDate)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, name, quantity, unit, category || 'Other', expiryDate || null);

    res.status(201).json({ id, name, quantity, unit, category, expiryDate });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update pantry item
router.put('/:id', (req, res) => {
  try {
    const { name, quantity, unit, category, expiryDate } = req.body;
    const db = getDb();

    db.prepare(
      `UPDATE pantry SET name = ?, quantity = ?, unit = ?, category = ?, expiryDate = ?
       WHERE id = ?`
    ).run(name, quantity, unit, category || 'Other', expiryDate || null, req.params.id);

    res.json({ id: req.params.id, name, quantity, unit, category, expiryDate });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete pantry item
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM pantry WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
