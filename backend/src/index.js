import express from 'express';
import cors from 'cors';
import { initDb } from './db/init.js';
import recipeRoutes from './routes/recipes.js';
import pantryRoutes from './routes/pantry.js';
import nutritionRoutes from './routes/nutrition.js';
import shoppingListRoutes from './routes/shoppingList.js';
import folderRoutes from './routes/folders.js';
import aiRoutes from './routes/ai.js';
import { getDb } from './db/init.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check for Render
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Keep-alive: runs a trivial query so the database registers activity. A
// scheduled GitHub Action hits this every few days to stop Supabase's free
// tier from pausing the project after 7 days of inactivity.
app.get('/api/ping', async (req, res) => {
  try {
    await getDb().query('SELECT 1');
    res.json({ status: 'ok', db: 'up', time: new Date().toISOString() });
  } catch (error) {
    console.error('Ping DB error:', error.message);
    res.status(500).json({ status: 'error', db: 'down' });
  }
});

// Routes
app.use('/api/recipes', recipeRoutes);
app.use('/api/pantry', pantryRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/shopping-list', shoppingListRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/ai', aiRoutes);

// Initialize database, then start serving. We await schema creation so the
// first request can't hit a table that doesn't exist yet.
async function startServer() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
