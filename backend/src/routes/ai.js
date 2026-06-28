import express from 'express';
import Anthropic from '@anthropic-ai/sdk';

const router = express.Router();

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');
  return new Anthropic({ apiKey });
}

function stripJsonFences(text) {
  return text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
}

// Normalize one image input (data URL or raw base64) into an Anthropic image block.
function toImageBlock(image, fallbackMime = 'image/jpeg') {
  const base64 = image.includes(',') ? image.split(',')[1] : image;
  const mime = image.startsWith('data:') ? image.split(';')[0].slice(5) : fallbackMime;
  return { type: 'image', source: { type: 'base64', media_type: mime, data: base64 } };
}

// POST /api/ai/scan-recipe
// Accepts one image (`image`) or several (`images` array). Multiple photos of the
// same recipe (e.g. ingredients page + directions page) are analyzed together
// into a single recipe. Returns extracted recipe data + diet tags + nutrition.
router.post('/scan-recipe', async (req, res) => {
  try {
    const { image, images, mediaType = 'image/jpeg' } = req.body;
    const imageList = Array.isArray(images) && images.length ? images : (image ? [image] : []);
    if (imageList.length === 0) return res.status(400).json({ error: 'image is required' });

    const imageBlocks = imageList.map(img => toImageBlock(img, mediaType));
    const multi = imageBlocks.length > 1;

    const client = getClient();
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: [
          ...imageBlocks,
          {
            type: 'text',
            text: `${multi
              ? `These ${imageBlocks.length} images are different parts of the SAME recipe (e.g. one page lists ingredients, another lists directions). Combine them into one recipe — merge all ingredients and all directions across every image. Do not create separate recipes.`
              : 'Extract the recipe from this image.'} Estimate nutrition per 1 unit for each ingredient.

Return ONLY valid JSON (no markdown, no code fences):
{
  "name": "Recipe Name",
  "description": "One sentence description",
  "servings": 4,
  "instructions": "1. Preheat oven to 350°F.\n2. Mix dry ingredients.\n3. Fold in wet ingredients.\n4. Bake 25 minutes.",
  "ingredients": [
    {
      "name": "rolled oats",
      "quantity": 1,
      "unit": "cup",
      "calories": 307,
      "protein": 10.7,
      "carbs": 55.0,
      "fat": 5.3,
      "fiber": 8.2
    }
  ],
  "dietTags": ["vegetarian", "high-fiber"],
  "dietReasoning": "Vegetarian: no meat. High-fiber: oats provide ~8g fiber per cup."
}

Valid units: cup, tbsp, tsp, oz, lb, g, ml, piece
Valid dietTags (only include tags the recipe genuinely meets):
- anti-inflammatory: omega-3s, colorful veg, turmeric/ginger, minimal processed foods
- high-fiber: 5g+ fiber per serving
- high-protein: 20g+ protein per serving
- low-fodmap: no garlic, onion, wheat, certain legumes, excess dairy
- vegetarian: no meat or fish
- vegan: no animal products
- keto: <10g net carbs per serving, high fat
- gluten-free: no wheat, barley, or rye

Nutrition values must be per 1 unit (e.g. per cup, per tbsp) not per full recipe.
If this is not a recipe image, return: {"error": "Not a recipe image"}`
          }
        ]
      }]
    });

    const parsed = JSON.parse(stripJsonFences(message.content[0].text));
    if (parsed.error) return res.status(422).json(parsed);
    res.json(parsed);
  } catch (err) {
    console.error('AI scan-recipe error:', err.message);
    if (err.message?.includes('ANTHROPIC_API_KEY')) {
      return res.status(503).json({ error: 'AI not configured — set ANTHROPIC_API_KEY in environment.' });
    }
    res.status(500).json({ error: 'Failed to analyze image' });
  }
});

// POST /api/ai/analyze-diet
// Analyzes recipe ingredients: returns diet qualification breakdown + substitution suggestions.
router.post('/analyze-diet', async (req, res) => {
  try {
    const { recipeName, ingredients } = req.body;
    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ error: 'ingredients array required' });
    }

    const list = ingredients
      .map(i => `- ${i.quantity} ${i.unit} ${i.name || i.ingredientName}`)
      .join('\n');

    const client = getClient();
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `Recipe: ${recipeName || 'Unknown'}
Ingredients:
${list}

Analyze this recipe for diet compatibility and suggest ingredient swaps to expand it.

Return ONLY valid JSON (no markdown):
{
  "dietAnalysis": {
    "anti-inflammatory": { "qualifies": true, "reason": "Contains salmon (omega-3) and turmeric" },
    "high-fiber": { "qualifies": false, "reason": "Only ~2g fiber per serving" },
    "high-protein": { "qualifies": true, "reason": "~28g protein per serving from chicken breast" },
    "low-fodmap": { "qualifies": false, "reason": "Garlic and onion are high-FODMAP" },
    "vegetarian": { "qualifies": false, "reason": "Contains chicken" },
    "vegan": { "qualifies": false, "reason": "Contains chicken and butter" },
    "keto": { "qualifies": false, "reason": "White rice adds ~45g carbs per serving" },
    "gluten-free": { "qualifies": true, "reason": "No wheat or gluten ingredients" }
  },
  "suggestions": [
    {
      "original": "white rice",
      "substitute": "cauliflower rice",
      "benefit": "Drops net carbs from 45g to ~5g per serving",
      "dietTags": ["keto", "low-fodmap"]
    },
    {
      "original": "garlic",
      "substitute": "garlic-infused oil (discard solids)",
      "benefit": "Same flavour, no fructans — FODMAP safe",
      "dietTags": ["low-fodmap"]
    }
  ]
}`
      }]
    });

    const parsed = JSON.parse(stripJsonFences(message.content[0].text));
    res.json(parsed);
  } catch (err) {
    console.error('AI analyze-diet error:', err.message);
    if (err.message?.includes('ANTHROPIC_API_KEY')) {
      return res.status(503).json({ error: 'AI not configured — set ANTHROPIC_API_KEY in environment.' });
    }
    res.status(500).json({ error: 'Failed to analyze diet compatibility' });
  }
});

export default router;
