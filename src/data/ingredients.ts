import type { DietFlag, GlycemicBand, HouseholdUnit, Ingredient, IngredientCategory, QualityTag } from '../domain/types';

/**
 * Ingredient database. Values per 100 g edible portion, rounded, from USDA
 * FoodData Central (SR Legacy / Foundation). GI bands follow Atkinson 2021.
 *
 * Compact tuple format keeps the table scannable and diff-friendly:
 * [kcal, protein, fat, satFat, carbs, fiber, sugar, sodium(mg)]
 */
type N = [number, number, number, number, number, number, number, number];

interface Def {
  id: string;
  name: string;
  cat: IngredientCategory;
  n: N;
  flags?: DietFlag[];
  q?: QualityTag[];
  gi?: GlycemicBand;
  units?: HouseholdUnit[];
  staple?: boolean;
}

const u = (label: string, grams: number): HouseholdUnit => ({ label, grams });

const DEFS: Def[] = [
  // ── Vegetables ──────────────────────────────────────────────
  { id: 'spinach', name: 'Spinach', cat: 'vegetables', n: [23, 2.9, 0.4, 0.1, 3.6, 2.2, 0.4, 79], q: ['leafy-green', 'polyphenol-rich'], gi: 'low', units: [u('cup', 30)] },
  { id: 'kale', name: 'Kale', cat: 'vegetables', n: [35, 2.9, 1.5, 0.2, 4.4, 4.1, 1, 53], q: ['leafy-green', 'cruciferous', 'polyphenol-rich'], gi: 'low', units: [u('cup', 21)] },
  { id: 'arugula', name: 'Arugula', cat: 'vegetables', n: [25, 2.6, 0.7, 0.1, 3.7, 1.6, 2, 27], q: ['leafy-green', 'cruciferous'], gi: 'low', units: [u('cup', 20)] },
  { id: 'romaine', name: 'Romaine lettuce', cat: 'vegetables', n: [17, 1.2, 0.3, 0, 3.3, 2.1, 1.2, 8], q: ['leafy-green'], gi: 'low', units: [u('cup', 47)] },
  { id: 'broccoli', name: 'Broccoli', cat: 'vegetables', n: [34, 2.8, 0.4, 0.1, 6.6, 2.6, 1.7, 33], q: ['cruciferous', 'high-fiber'], gi: 'low', units: [u('cup', 91)] },
  { id: 'cauliflower', name: 'Cauliflower', cat: 'vegetables', n: [25, 1.9, 0.3, 0.1, 5, 2, 1.9, 30], q: ['cruciferous'], gi: 'low', units: [u('cup', 107)] },
  { id: 'brussels', name: 'Brussels sprouts', cat: 'vegetables', n: [43, 3.4, 0.3, 0.1, 9, 3.8, 2.2, 25], q: ['cruciferous', 'high-fiber'], gi: 'low', units: [u('cup', 88)] },
  { id: 'cabbage-red', name: 'Red cabbage', cat: 'vegetables', n: [31, 1.4, 0.2, 0, 7.4, 2.1, 3.8, 27], q: ['cruciferous', 'polyphenol-rich'], gi: 'low', units: [u('cup', 89)] },
  { id: 'zucchini', name: 'Zucchini', cat: 'vegetables', n: [17, 1.2, 0.3, 0.1, 3.1, 1, 2.5, 8], gi: 'low', units: [u('medium', 196)] },
  { id: 'cucumber', name: 'Cucumber', cat: 'vegetables', n: [15, 0.7, 0.1, 0, 3.6, 0.5, 1.7, 2], gi: 'low', units: [u('medium', 300)] },
  { id: 'bell-pepper', name: 'Bell pepper', cat: 'vegetables', n: [31, 1, 0.3, 0, 6, 2.1, 4.2, 4], q: ['polyphenol-rich'], gi: 'low', units: [u('medium', 119)] },
  { id: 'tomato', name: 'Tomato', cat: 'vegetables', n: [18, 0.9, 0.2, 0, 3.9, 1.2, 2.6, 5], q: ['polyphenol-rich'], gi: 'low', units: [u('medium', 123)] },
  { id: 'cherry-tomato', name: 'Cherry tomatoes', cat: 'vegetables', n: [18, 0.9, 0.2, 0, 3.9, 1.2, 2.6, 5], q: ['polyphenol-rich'], gi: 'low', units: [u('cup', 149)] },
  { id: 'onion', name: 'Onion', cat: 'vegetables', n: [40, 1.1, 0.1, 0, 9.3, 1.7, 4.2, 4], q: ['polyphenol-rich'], gi: 'low', units: [u('medium', 110)] },
  { id: 'red-onion', name: 'Red onion', cat: 'vegetables', n: [40, 1.1, 0.1, 0, 9.3, 1.7, 4.2, 4], q: ['polyphenol-rich'], gi: 'low', units: [u('medium', 110)] },
  { id: 'garlic', name: 'Garlic', cat: 'vegetables', n: [149, 6.4, 0.5, 0.1, 33, 2.1, 1, 17], q: ['polyphenol-rich'], gi: 'low', units: [u('clove', 3)] },
  { id: 'carrot', name: 'Carrot', cat: 'vegetables', n: [41, 0.9, 0.2, 0, 9.6, 2.8, 4.7, 69], gi: 'low', units: [u('medium', 61)] },
  { id: 'mushroom', name: 'Mushrooms', cat: 'vegetables', n: [22, 3.1, 0.3, 0, 3.3, 1, 2, 5], gi: 'low', units: [u('cup', 70)] },
  { id: 'eggplant', name: 'Eggplant', cat: 'vegetables', n: [25, 1, 0.2, 0, 5.9, 3, 3.5, 2], q: ['high-fiber'], gi: 'low', units: [u('medium', 458)] },
  { id: 'asparagus', name: 'Asparagus', cat: 'vegetables', n: [20, 2.2, 0.1, 0, 3.9, 2.1, 1.9, 2], gi: 'low', units: [u('spear', 16)] },
  { id: 'green-beans', name: 'Green beans', cat: 'vegetables', n: [31, 1.8, 0.2, 0.1, 7, 2.7, 3.3, 6], gi: 'low', units: [u('cup', 100)] },
  { id: 'celery', name: 'Celery', cat: 'vegetables', n: [16, 0.7, 0.2, 0, 3, 1.6, 1.3, 80], gi: 'low', units: [u('stalk', 40)] },
  { id: 'sweet-potato', name: 'Sweet potato', cat: 'vegetables', n: [86, 1.6, 0.1, 0, 20, 3, 4.2, 55], q: ['starchy', 'high-fiber'], gi: 'medium', units: [u('medium', 130)] },
  { id: 'potato', name: 'Potato', cat: 'vegetables', n: [77, 2, 0.1, 0, 17, 2.2, 0.8, 6], q: ['starchy'], gi: 'high', units: [u('medium', 173)] },
  { id: 'avocado', name: 'Avocado', cat: 'vegetables', n: [160, 2, 14.7, 2.1, 8.5, 6.7, 0.7, 7], q: ['mufa-rich', 'high-fiber'], gi: 'low', units: [u('whole', 150), u('half', 75)] },
  { id: 'olives', name: 'Olives', cat: 'vegetables', n: [115, 0.8, 10.7, 1.4, 6.3, 3.2, 0, 735], q: ['mufa-rich', 'polyphenol-rich'], gi: 'low', units: [u('olive', 4)] },

  // ── Fruit ───────────────────────────────────────────────────
  { id: 'blueberries', name: 'Blueberries', cat: 'fruit', n: [57, 0.7, 0.3, 0, 14.5, 2.4, 10, 1], q: ['polyphenol-rich'], gi: 'low', units: [u('cup', 148)] },
  { id: 'raspberries', name: 'Raspberries', cat: 'fruit', n: [52, 1.2, 0.7, 0, 11.9, 6.5, 4.4, 1], q: ['polyphenol-rich', 'high-fiber'], gi: 'low', units: [u('cup', 123)] },
  { id: 'strawberries', name: 'Strawberries', cat: 'fruit', n: [32, 0.7, 0.3, 0, 7.7, 2, 4.9, 1], q: ['polyphenol-rich'], gi: 'low', units: [u('cup', 152)] },
  { id: 'apple', name: 'Apple', cat: 'fruit', n: [52, 0.3, 0.2, 0, 13.8, 2.4, 10.4, 1], q: ['polyphenol-rich'], gi: 'low', units: [u('medium', 182)] },
  { id: 'banana', name: 'Banana', cat: 'fruit', n: [89, 1.1, 0.3, 0.1, 22.8, 2.6, 12.2, 1], gi: 'medium', units: [u('medium', 118)] },
  { id: 'lemon', name: 'Lemon', cat: 'fruit', n: [29, 1.1, 0.3, 0, 9.3, 2.8, 2.5, 2], gi: 'low', units: [u('whole', 58), u('tbsp juice', 15)] },
  { id: 'orange', name: 'Orange', cat: 'fruit', n: [47, 0.9, 0.1, 0, 11.8, 2.4, 9.4, 0], gi: 'low', units: [u('medium', 131)] },
  { id: 'pomegranate', name: 'Pomegranate seeds', cat: 'fruit', n: [83, 1.7, 1.2, 0.1, 18.7, 4, 13.7, 3], q: ['polyphenol-rich'], gi: 'low', units: [u('tbsp', 12)] },

  // ── Protein ─────────────────────────────────────────────────
  { id: 'chicken-breast', name: 'Chicken breast', cat: 'protein', n: [120, 22.5, 2.6, 0.6, 0, 0, 0, 45], flags: ['meat'], gi: 'none', units: [u('fillet', 170)] },
  { id: 'chicken-thigh', name: 'Chicken thigh (skinless)', cat: 'protein', n: [121, 19.7, 4.1, 1, 0, 0, 0, 95], flags: ['meat'], gi: 'none', units: [u('thigh', 110)] },
  { id: 'turkey-mince', name: 'Turkey mince', cat: 'protein', n: [148, 19.7, 7.7, 2, 0, 0, 0, 72], flags: ['meat'], gi: 'none' },
  { id: 'beef-mince', name: 'Lean beef mince (90%)', cat: 'protein', n: [176, 20, 10, 3.9, 0, 0, 0, 66], flags: ['meat'], gi: 'none' },
  { id: 'egg', name: 'Egg', cat: 'protein', n: [143, 12.6, 9.5, 3.1, 0.7, 0, 0.4, 142], flags: ['egg'], gi: 'none', units: [u('large', 50)] },
  { id: 'tofu', name: 'Tofu (firm)', cat: 'protein', n: [144, 17.3, 8.7, 1.3, 2.8, 2.3, 0.6, 14], flags: ['soy'], gi: 'low', units: [u('block', 400)] },
  { id: 'tempeh', name: 'Tempeh', cat: 'protein', n: [192, 20.3, 10.8, 2.2, 7.6, 0, 0, 9], flags: ['soy'], q: ['fermented'], gi: 'low' },
  { id: 'bacon', name: 'Bacon', cat: 'protein', n: [458, 12.6, 45, 15, 1.4, 0, 0, 833], flags: ['meat'], q: ['processed-meat'], gi: 'none', units: [u('slice', 12)] },

  // ── Fish ────────────────────────────────────────────────────
  { id: 'salmon', name: 'Salmon', cat: 'fish', n: [208, 20.4, 13.4, 3.1, 0, 0, 0, 59], flags: ['fish'], q: ['omega-3'], gi: 'none', units: [u('fillet', 150)] },
  { id: 'sardines', name: 'Sardines (in olive oil, drained)', cat: 'fish', n: [208, 24.6, 11.5, 1.5, 0, 0, 0, 307], flags: ['fish'], q: ['omega-3'], gi: 'none', units: [u('can', 92)] },
  { id: 'mackerel', name: 'Mackerel', cat: 'fish', n: [205, 18.6, 13.9, 3.3, 0, 0, 0, 90], flags: ['fish'], q: ['omega-3'], gi: 'none', units: [u('fillet', 110)] },
  { id: 'cod', name: 'Cod', cat: 'fish', n: [82, 17.8, 0.7, 0.1, 0, 0, 0, 54], flags: ['fish'], gi: 'none', units: [u('fillet', 150)] },
  { id: 'shrimp', name: 'Shrimp', cat: 'fish', n: [85, 20.1, 0.5, 0.1, 0, 0, 0, 119], flags: ['fish'], gi: 'none' },
  { id: 'tuna-can', name: 'Tuna (canned in water)', cat: 'fish', n: [116, 25.5, 0.8, 0.2, 0, 0, 0, 247], flags: ['fish'], gi: 'none', units: [u('can', 142)] },

  // ── Dairy ───────────────────────────────────────────────────
  { id: 'greek-yogurt', name: 'Greek yogurt (plain, 2%)', cat: 'dairy', n: [73, 9.9, 1.9, 1.2, 3.9, 0, 3.6, 34], flags: ['dairy'], q: ['fermented'], gi: 'low', units: [u('cup', 227), u('tbsp', 15)] },
  { id: 'feta', name: 'Feta', cat: 'dairy', n: [264, 14.2, 21.3, 14.9, 4.1, 0, 4.1, 917], flags: ['dairy'], q: ['fermented'], gi: 'none', units: [u('tbsp crumbled', 9)] },
  { id: 'parmesan', name: 'Parmesan', cat: 'dairy', n: [392, 35.8, 25.8, 16.4, 3.2, 0, 0.8, 1376], flags: ['dairy'], q: ['fermented'], gi: 'none', units: [u('tbsp grated', 5)] },
  { id: 'mozzarella', name: 'Mozzarella', cat: 'dairy', n: [280, 27.5, 17.1, 10.9, 3.1, 0, 1.2, 627], flags: ['dairy'], gi: 'none' },
  { id: 'cottage-cheese', name: 'Cottage cheese', cat: 'dairy', n: [98, 11.1, 4.3, 1.7, 3.4, 0, 2.7, 364], flags: ['dairy'], gi: 'low', units: [u('cup', 210)] },
  { id: 'milk', name: 'Milk (2%)', cat: 'dairy', n: [50, 3.3, 2, 1.1, 4.8, 0, 5.1, 47], flags: ['dairy'], gi: 'low', units: [u('cup', 244)] },
  { id: 'almond-milk', name: 'Almond milk (unsweetened)', cat: 'dairy', n: [15, 0.6, 1.2, 0.1, 0.3, 0.2, 0, 72], flags: ['nuts'], gi: 'low', units: [u('cup', 240)] },
  { id: 'coconut-milk', name: 'Coconut milk (canned)', cat: 'dairy', n: [197, 2, 21.3, 18.9, 2.8, 0, 2.8, 13], gi: 'low', units: [u('cup', 226)] },
  { id: 'butter', name: 'Butter', cat: 'fats-oils', n: [717, 0.9, 81, 51, 0.1, 0, 0.1, 11], flags: ['dairy'], gi: 'none', units: [u('tbsp', 14)] },

  // ── Grains ──────────────────────────────────────────────────
  { id: 'oats', name: 'Rolled oats', cat: 'grains', n: [379, 13.2, 6.5, 1.1, 67.7, 10.1, 1, 6], q: ['whole-grain', 'high-fiber'], gi: 'medium', units: [u('cup', 81)] },
  { id: 'quinoa', name: 'Quinoa (cooked)', cat: 'grains', n: [120, 4.4, 1.9, 0.2, 21.3, 2.8, 0.9, 7], q: ['whole-grain'], gi: 'low', units: [u('cup', 185)] },
  { id: 'brown-rice', name: 'Brown rice (cooked)', cat: 'grains', n: [123, 2.7, 1, 0.3, 25.6, 1.6, 0.2, 4], q: ['whole-grain'], gi: 'medium', units: [u('cup', 195)] },
  { id: 'white-rice', name: 'White rice (cooked)', cat: 'grains', n: [130, 2.7, 0.3, 0.1, 28.2, 0.4, 0.1, 1], q: ['refined-grain', 'starchy'], gi: 'high', units: [u('cup', 158)] },
  { id: 'pasta', name: 'Pasta (cooked)', cat: 'grains', n: [158, 5.8, 0.9, 0.2, 30.9, 1.8, 0.6, 1], flags: ['gluten'], q: ['refined-grain'], gi: 'medium', units: [u('cup', 140)] },
  { id: 'wholegrain-bread', name: 'Wholegrain bread', cat: 'grains', n: [252, 12.5, 3.5, 0.7, 42.7, 6, 4.4, 450], flags: ['gluten'], q: ['whole-grain', 'high-fiber'], gi: 'medium', units: [u('slice', 32)] },
  { id: 'white-bread', name: 'White bread', cat: 'grains', n: [266, 8.9, 3.3, 0.7, 49.4, 2.7, 5.7, 490], flags: ['gluten'], q: ['refined-grain'], gi: 'high', units: [u('slice', 25)] },
  { id: 'buckwheat', name: 'Buckwheat groats (cooked)', cat: 'grains', n: [92, 3.4, 0.6, 0.1, 19.9, 2.7, 0.9, 4], q: ['whole-grain'], gi: 'low', units: [u('cup', 168)] },

  // ── Legumes ─────────────────────────────────────────────────
  { id: 'lentils', name: 'Lentils (cooked)', cat: 'legumes', n: [116, 9, 0.4, 0.1, 20.1, 7.9, 1.8, 2], q: ['high-fiber'], gi: 'low', units: [u('cup', 198)] },
  { id: 'chickpeas', name: 'Chickpeas (cooked)', cat: 'legumes', n: [164, 8.9, 2.6, 0.3, 27.4, 7.6, 4.8, 7], q: ['high-fiber'], gi: 'low', units: [u('cup', 164)] },
  { id: 'black-beans', name: 'Black beans (cooked)', cat: 'legumes', n: [132, 8.9, 0.5, 0.1, 23.7, 8.7, 0.3, 1], q: ['high-fiber', 'polyphenol-rich'], gi: 'low', units: [u('cup', 172)] },
  { id: 'edamame', name: 'Edamame', cat: 'legumes', n: [121, 11.9, 5.2, 0.6, 8.9, 5.2, 2.2, 6], flags: ['soy'], q: ['high-fiber'], gi: 'low', units: [u('cup', 155)] },
  { id: 'hummus', name: 'Hummus', cat: 'legumes', n: [166, 7.9, 9.6, 1.4, 14.3, 6, 0.3, 379], q: ['high-fiber'], gi: 'low', units: [u('tbsp', 15)] },

  // ── Nuts & seeds ────────────────────────────────────────────
  { id: 'almonds', name: 'Almonds', cat: 'nuts-seeds', n: [579, 21.2, 49.9, 3.8, 21.6, 12.5, 4.4, 1], flags: ['nuts'], q: ['mufa-rich', 'high-fiber'], gi: 'low', units: [u('handful', 28)] },
  { id: 'walnuts', name: 'Walnuts', cat: 'nuts-seeds', n: [654, 15.2, 65.2, 6.1, 13.7, 6.7, 2.6, 2], flags: ['nuts'], q: ['omega-3', 'polyphenol-rich'], gi: 'low', units: [u('handful', 28)] },
  { id: 'chia', name: 'Chia seeds', cat: 'nuts-seeds', n: [486, 16.5, 30.7, 3.3, 42.1, 34.4, 0, 16], q: ['omega-3', 'high-fiber'], gi: 'low', units: [u('tbsp', 12)] },
  { id: 'flaxseed', name: 'Ground flaxseed', cat: 'nuts-seeds', n: [534, 18.3, 42.2, 3.7, 28.9, 27.3, 1.6, 30], q: ['omega-3', 'high-fiber'], gi: 'low', units: [u('tbsp', 7)] },
  { id: 'pumpkin-seeds', name: 'Pumpkin seeds', cat: 'nuts-seeds', n: [559, 30.2, 49, 8.7, 10.7, 6, 1.4, 7], gi: 'low', units: [u('tbsp', 9)] },
  { id: 'tahini', name: 'Tahini', cat: 'nuts-seeds', n: [595, 17, 53.8, 7.5, 21.2, 9.3, 0.5, 115], q: ['mufa-rich'], gi: 'low', units: [u('tbsp', 15)] },
  { id: 'almond-butter', name: 'Almond butter', cat: 'nuts-seeds', n: [614, 21, 55.5, 4.2, 18.8, 10.3, 4.4, 7], flags: ['nuts'], q: ['mufa-rich'], gi: 'low', units: [u('tbsp', 16)] },

  // ── Fats & oils ─────────────────────────────────────────────
  { id: 'olive-oil', name: 'Extra-virgin olive oil', cat: 'fats-oils', n: [884, 0, 100, 13.8, 0, 0, 0, 2], q: ['mufa-rich', 'polyphenol-rich'], gi: 'none', units: [u('tbsp', 13.5), u('tsp', 4.5)] },
  { id: 'coconut-oil', name: 'Coconut oil', cat: 'fats-oils', n: [892, 0, 99, 82.5, 0, 0, 0, 0], gi: 'none', units: [u('tbsp', 13.6)] },

  // ── Herbs & spices ──────────────────────────────────────────
  { id: 'turmeric', name: 'Turmeric (ground)', cat: 'herbs-spices', n: [312, 9.7, 3.3, 1.8, 67.1, 22.7, 3.2, 27], q: ['polyphenol-rich'], gi: 'none', units: [u('tsp', 3)] },
  { id: 'ginger', name: 'Fresh ginger', cat: 'herbs-spices', n: [80, 1.8, 0.8, 0.2, 17.8, 2, 1.7, 13], q: ['polyphenol-rich'], gi: 'none', units: [u('tsp grated', 2)] },
  { id: 'cinnamon', name: 'Cinnamon', cat: 'herbs-spices', n: [247, 4, 1.2, 0.3, 80.6, 53.1, 2.2, 10], q: ['polyphenol-rich'], gi: 'none', units: [u('tsp', 2.6)] },
  { id: 'cumin', name: 'Cumin', cat: 'herbs-spices', n: [375, 17.8, 22.3, 1.5, 44.2, 10.5, 2.3, 168], gi: 'none', units: [u('tsp', 2)], staple: true },
  { id: 'paprika', name: 'Paprika', cat: 'herbs-spices', n: [282, 14.1, 12.9, 2.1, 54, 34.9, 10.3, 68], gi: 'none', units: [u('tsp', 2.3)], staple: true },
  { id: 'chili-flakes', name: 'Chili flakes', cat: 'herbs-spices', n: [318, 12, 17.3, 3.3, 56.6, 27.2, 10.3, 30], gi: 'none', units: [u('tsp', 1.8)], staple: true },
  { id: 'basil', name: 'Fresh basil', cat: 'herbs-spices', n: [23, 3.2, 0.6, 0, 2.7, 1.6, 0.3, 4], q: ['polyphenol-rich'], gi: 'none', units: [u('handful', 5)] },
  { id: 'parsley', name: 'Fresh parsley', cat: 'herbs-spices', n: [36, 3, 0.8, 0.1, 6.3, 3.3, 0.9, 56], q: ['polyphenol-rich'], gi: 'none', units: [u('handful', 8)] },
  { id: 'cilantro', name: 'Fresh cilantro', cat: 'herbs-spices', n: [23, 2.1, 0.5, 0, 3.7, 2.8, 0.9, 46], gi: 'none', units: [u('handful', 8)] },
  { id: 'dill', name: 'Fresh dill', cat: 'herbs-spices', n: [43, 3.5, 1.1, 0.1, 7, 2.1, 0, 61], gi: 'none', units: [u('handful', 5)] },
  { id: 'salt', name: 'Salt', cat: 'herbs-spices', n: [0, 0, 0, 0, 0, 0, 0, 38758], gi: 'none', units: [u('pinch', 0.4), u('tsp', 6)], staple: true },
  { id: 'black-pepper', name: 'Black pepper', cat: 'herbs-spices', n: [251, 10.4, 3.3, 1.4, 64, 25.3, 0.6, 20], gi: 'none', units: [u('pinch', 0.3)], staple: true },

  // ── Pantry ──────────────────────────────────────────────────
  { id: 'water', name: 'Water', cat: 'pantry', n: [0, 0, 0, 0, 0, 0, 0, 4], gi: 'none', staple: true },
  { id: 'vegetable-stock', name: 'Vegetable stock', cat: 'pantry', n: [5, 0.2, 0.1, 0, 0.9, 0, 0.4, 230], gi: 'none', units: [u('cup', 240)] },
  { id: 'canned-tomato', name: 'Canned chopped tomatoes', cat: 'pantry', n: [32, 1.6, 0.3, 0, 7.3, 1.9, 4.4, 115], q: ['polyphenol-rich'], gi: 'low', units: [u('can', 400)] },
  { id: 'soy-sauce', name: 'Soy sauce / tamari', cat: 'pantry', n: [53, 8.1, 0.6, 0.1, 4.9, 0.8, 0.4, 5493], flags: ['soy'], q: ['fermented'], gi: 'none', units: [u('tbsp', 16)] },
  { id: 'dijon', name: 'Dijon mustard', cat: 'pantry', n: [66, 4.4, 3.3, 0.2, 5.8, 3.3, 0.9, 1135], gi: 'none', units: [u('tsp', 5)] },
  { id: 'apple-cider-vinegar', name: 'Apple cider vinegar', cat: 'pantry', n: [21, 0, 0, 0, 0.9, 0, 0.4, 5], gi: 'none', units: [u('tbsp', 15)] },
  { id: 'honey', name: 'Honey', cat: 'pantry', n: [304, 0.3, 0, 0, 82.4, 0.2, 82.1, 4], q: ['added-sugar'], gi: 'medium', units: [u('tsp', 7), u('tbsp', 21)] },
  { id: 'maple-syrup', name: 'Maple syrup', cat: 'pantry', n: [260, 0, 0.1, 0, 67, 0, 60.5, 12], q: ['added-sugar'], gi: 'medium', units: [u('tbsp', 20)] },
  { id: 'dark-chocolate', name: 'Dark chocolate (85%)', cat: 'pantry', n: [598, 7.8, 42.6, 24.5, 45.9, 10.9, 24, 20], q: ['polyphenol-rich'], gi: 'low', units: [u('square', 10)] },
  { id: 'cocoa', name: 'Cocoa powder (unsweetened)', cat: 'pantry', n: [228, 19.6, 13.7, 8.1, 57.9, 37, 1.8, 21], q: ['polyphenol-rich'], gi: 'low', units: [u('tbsp', 5.4)] },
  { id: 'vanilla', name: 'Vanilla extract', cat: 'pantry', n: [288, 0.1, 0.1, 0, 12.7, 0, 12.7, 9], gi: 'none', units: [u('tsp', 4.2)] },
];

export const INGREDIENTS: Ingredient[] = DEFS.map((d) => ({
  id: d.id,
  name: d.name,
  category: d.cat,
  per100g: {
    kcal: d.n[0],
    protein: d.n[1],
    fat: d.n[2],
    satFat: d.n[3],
    carbs: d.n[4],
    fiber: d.n[5],
    sugar: d.n[6],
    addedSugar: d.q?.includes('added-sugar') ? d.n[6] : 0,
    sodium: d.n[7],
  },
  flags: d.flags ?? [],
  qualities: d.q ?? [],
  glycemic: d.gi ?? 'none',
  units: d.units ?? [],
  staple: d.staple,
}));

export const INGREDIENT_BY_ID: ReadonlyMap<string, Ingredient> = new Map(
  INGREDIENTS.map((i) => [i.id, i]),
);

export const CATEGORY_LABEL: Record<IngredientCategory, string> = {
  vegetables: 'Vegetables',
  fruit: 'Fruit',
  protein: 'Meat, eggs & plant protein',
  fish: 'Fish & seafood',
  dairy: 'Dairy & alternatives',
  grains: 'Grains',
  legumes: 'Legumes',
  'nuts-seeds': 'Nuts & seeds',
  'fats-oils': 'Fats & oils',
  'herbs-spices': 'Herbs & spices',
  pantry: 'Pantry',
};
