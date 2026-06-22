# RecipeBook - Meal Planning Made Easy

A full-stack web app for managing recipes, tracking pantry inventory, generating shopping lists, and planning meals based on dietary preferences.

## Features

- 📸 **Recipe Management**: Add recipes with photos, ingredients, and nutritional info
- 🥘 **Pantry Tracking**: Keep track of ingredients you have on hand
- 🛒 **Smart Shopping Lists**: Automatically generate shopping lists based on selected recipes
- 🏷️ **Organization**: Organize recipes with custom folders/groups
- 🥗 **Diet Preferences**: Tag recipes with dietary preferences (anti-inflammatory, high-protein, vegan, etc.)
- 📊 **Nutrition Calculator**: Calculate calories, protein, carbs, fiber, and more for meals

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: SQLite3
- **API**: USDA FoodData Central (free nutrition data)

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

```bash
# Install dependencies for both backend and frontend
npm install

# Install workspace dependencies
npm install -w backend
npm install -w frontend
```

### Development

```bash
# Start both backend and frontend
npm run dev

# Or run them individually:
# Backend: npm run dev -w backend (runs on port 3001)
# Frontend: npm run dev -w frontend (runs on port 3000)
```

### Building

```bash
npm run build
```

## Project Structure

```
recipebook/
├── backend/
│   └── src/
│       ├── db/
│       │   └── init.js
│       ├── routes/
│       │   ├── recipes.js
│       │   ├── pantry.js
│       │   ├── nutrition.js
│       │   └── shoppingList.js
│       └── index.js
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── RecipeList.jsx
│       │   ├── RecipeForm.jsx
│       │   ├── PantryManager.jsx
│       │   ├── ShoppingList.jsx
│       │   └── Navbar.jsx
│       ├── App.jsx
│       └── index.css
└── README.md
```

## API Endpoints

### Recipes
- `GET /api/recipes` - Get all recipes
- `GET /api/recipes/:id` - Get recipe details
- `POST /api/recipes` - Create new recipe
- `PUT /api/recipes/:id` - Update recipe
- `DELETE /api/recipes/:id` - Delete recipe

### Pantry
- `GET /api/pantry` - Get all pantry items
- `POST /api/pantry` - Add pantry item
- `PUT /api/pantry/:id` - Update pantry item
- `DELETE /api/pantry/:id` - Delete pantry item

### Shopping List
- `POST /api/shopping-list/generate` - Generate shopping list from recipes

### Nutrition
- `GET /api/nutrition/search?query=<ingredient>` - Search nutrition data
- `POST /api/nutrition/calculate` - Calculate meal nutrition

## Future Enhancements

- Meal planning calendar
- Cycle-syncing recommendations
- Barcode/ingredient scanning
- Recipe OCR from photos
- Dietary alternative suggestions
- Multi-user support
- Mobile app

## License

MIT