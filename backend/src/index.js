import express from 'express';
import cors from 'cors';
import { initDb } from './db/init.js';
import recipeRoutes from './routes/recipes.js';
import pantryRoutes from './routes/pantry.js';
import nutritionRoutes from './routes/nutrition.js';
import shoppingListRoutes from './routes/shoppingList.js';
import folderRoutes from './routes/folders.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/recipes', recipeRoutes);
app.use('/api/pantry', pantryRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/shopping-list', shoppingListRoutes);
app.use('/api/folders', folderRoutes);

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
