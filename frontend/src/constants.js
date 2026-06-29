// Shared measurement units used across recipe and pantry forms.
// Ordered roughly: count/informal first (most common when logging), then
// volume, then weight.
export const UNITS = [
  // count / informal
  'piece', 'can', 'stick', 'clove', 'slice', 'strip',
  'pinch', 'dash', 'bunch', 'sprig', 'head', 'stalk', 'ear',
  'package', 'jar', 'bottle', 'box', 'bag', 'handful', 'scoop',
  // volume
  'tsp', 'tbsp', 'cup', 'fl oz', 'pint', 'quart', 'gallon', 'ml', 'l',
  // weight
  'mg', 'g', 'kg', 'oz', 'lb'
];

export const PANTRY_CATEGORIES = [
  'Produce', 'Dairy', 'Meat', 'Seafood', 'Grains', 'Canned Goods',
  'Spices', 'Oils', 'Baking', 'Frozen', 'Snacks', 'Beverages', 'Other'
];
