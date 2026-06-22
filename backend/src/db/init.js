import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../../recipebook.db');

let db = null;

export function initDb() {
  if (db) return db;

  db = new Database(DB_PATH);
  db.pragma('foreign_keys = ON');

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      imageUrl TEXT,
      folderId TEXT,
      servings INTEGER DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS recipe_ingredients (
      id TEXT PRIMARY KEY,
      recipeId TEXT NOT NULL,
      ingredientName TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      calories REAL,
      protein REAL,
      carbs REAL,
      fat REAL,
      fiber REAL,
      FOREIGN KEY (recipeId) REFERENCES recipes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS pantry (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      category TEXT,
      dateAdded DATETIME DEFAULT CURRENT_TIMESTAMP,
      expiryDate DATETIME
    );

    CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS diet_preferences (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS recipe_diet_tags (
      recipeId TEXT NOT NULL,
      dietPreferenceId TEXT NOT NULL,
      PRIMARY KEY (recipeId, dietPreferenceId),
      FOREIGN KEY (recipeId) REFERENCES recipes(id) ON DELETE CASCADE,
      FOREIGN KEY (dietPreferenceId) REFERENCES diet_preferences(id)
    );

    CREATE INDEX IF NOT EXISTS idx_recipes_folder ON recipes(folderId);
    CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON recipe_ingredients(recipeId);
    CREATE INDEX IF NOT EXISTS idx_pantry_name ON pantry(name);
  `);

  insertDefaultDiets();
  return db;
}

function insertDefaultDiets() {
  const diets = [
    { id: 'anti-inflammatory', name: 'Anti-inflammatory', description: 'Foods that reduce inflammation' },
    { id: 'high-fiber', name: 'High Fiber', description: 'Foods rich in fiber' },
    { id: 'high-protein', name: 'High Protein', description: 'Protein-rich meals' },
    { id: 'low-fodmap', name: 'Low FODMAP', description: 'Easy to digest' },
    { id: 'vegetarian', name: 'Vegetarian', description: 'No meat' },
    { id: 'vegan', name: 'Vegan', description: 'No animal products' },
    { id: 'keto', name: 'Keto', description: 'Low carb, high fat' },
    { id: 'gluten-free', name: 'Gluten-free', description: 'No gluten' }
  ];

  const stmt = db.prepare(
    `INSERT OR IGNORE INTO diet_preferences (id, name, description) VALUES (?, ?, ?)`
  );
  for (const diet of diets) {
    stmt.run(diet.id, diet.name, diet.description);
  }
}

export function getDb() {
  if (!db) {
    initDb();
  }
  return db;
}
