import pg from 'pg';

const { Pool } = pg;

let pool = null;

export function initDb() {
  if (pool) return pool;

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  createTables();
  return pool;
}

async function createTables() {
  const queries = [
    `CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      "imageUrl" TEXT,
      "folderId" TEXT,
      servings INTEGER DEFAULT 1,
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS recipe_ingredients (
      id TEXT PRIMARY KEY,
      "recipeId" TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
      "ingredientName" TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      calories REAL,
      protein REAL,
      carbs REAL,
      fat REAL,
      fiber REAL
    )`,

    `CREATE TABLE IF NOT EXISTS pantry (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      category TEXT,
      "dateAdded" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "expiryDate" TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT,
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS diet_preferences (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT
    )`,

    `CREATE TABLE IF NOT EXISTS recipe_diet_tags (
      "recipeId" TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
      "dietPreferenceId" TEXT NOT NULL REFERENCES diet_preferences(id),
      PRIMARY KEY ("recipeId", "dietPreferenceId")
    )`,

    `CREATE INDEX IF NOT EXISTS idx_recipes_folder ON recipes("folderId")`,
    `CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON recipe_ingredients("recipeId")`,
    `CREATE INDEX IF NOT EXISTS idx_pantry_name ON pantry(name)`
  ];

  for (const query of queries) {
    try {
      await pool.query(query);
    } catch (error) {
      if (!error.message.includes('already exists')) {
        console.error('Error creating table:', error);
      }
    }
  }

  await insertDefaultDiets();
}

async function insertDefaultDiets() {
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

  for (const diet of diets) {
    try {
      await pool.query(
        `INSERT INTO diet_preferences (id, name, description) VALUES ($1, $2, $3)
         ON CONFLICT (id) DO NOTHING`,
        [diet.id, diet.name, diet.description]
      );
    } catch (error) {
      console.error('Error inserting diet:', error);
    }
  }
}

export function getDb() {
  if (!pool) {
    initDb();
  }
  return pool;
}
