import type {
  ActivityLevel,
  BodyProfile,
  Ingredient,
  MealType,
  Nutrients,
  Recipe,
  RecipeIngredient,
} from './types';
import type { DietProfile } from './diets';

export type IngredientLookup = (id: string) => Ingredient | undefined;

export const ZERO: Nutrients = Object.freeze({
  kcal: 0, protein: 0, fat: 0, satFat: 0, carbs: 0, fiber: 0, sugar: 0, addedSugar: 0, sodium: 0,
});

const KEYS = Object.keys(ZERO) as (keyof Nutrients)[];

export const addNutrients = (a: Nutrients, b: Nutrients): Nutrients =>
  KEYS.reduce((acc, k) => ({ ...acc, [k]: a[k] + b[k] }), { ...ZERO });

export const scaleNutrients = (n: Nutrients, factor: number): Nutrients =>
  KEYS.reduce((acc, k) => ({ ...acc, [k]: n[k] * factor }), { ...ZERO });

export const sumNutrients = (list: Nutrients[]): Nutrients => list.reduce(addNutrients, { ...ZERO });

/** Net carbs = total carbohydrate − fibre (US labelling convention). */
export const netCarbs = (n: Nutrients) => Math.max(0, n.carbs - n.fiber);

export const ingredientNutrients = (ing: Ingredient, grams: number): Nutrients =>
  scaleNutrients(ing.per100g, grams / 100);

export interface IngredientLine {
  item: RecipeIngredient;
  ingredient: Ingredient | undefined;
  nutrients: Nutrients;
}

/** Nutrition of each line (whole recipe, all servings). Unknown ingredients count as zero. */
export const recipeLines = (recipe: Recipe, lookup: IngredientLookup): IngredientLine[] =>
  recipe.ingredients.map((item) => {
    const ingredient = lookup(item.ingredientId);
    return {
      item,
      ingredient,
      nutrients: ingredient ? ingredientNutrients(ingredient, item.grams) : { ...ZERO },
    };
  });

export const recipeTotal = (recipe: Recipe, lookup: IngredientLookup): Nutrients =>
  sumNutrients(recipeLines(recipe, lookup).map((l) => l.nutrients));

export const perServing = (recipe: Recipe, lookup: IngredientLookup): Nutrients =>
  scaleNutrients(recipeTotal(recipe, lookup), 1 / Math.max(1, recipe.servings));

/** Share of energy from each macro (Atwater 4/4/9). */
export const energySplit = (n: Nutrients) => {
  const p = n.protein * 4;
  const c = n.carbs * 4;
  const f = n.fat * 9;
  const total = p + c + f || 1;
  return { protein: p / total, carbs: c / total, fat: f / total };
};

// ── Energy & targets ─────────────────────────────────────────────

/** Physical activity multipliers (FAO/WHO/UNU PAL ranges). */
export const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  'very-active': 1.9,
};

export const ACTIVITY_LABEL: Record<ActivityLevel, string> = {
  sedentary: 'Mostly sitting',
  light: 'Light (1–3 workouts/week)',
  moderate: 'Moderate (3–5 workouts/week)',
  active: 'Active (6–7 workouts/week)',
  'very-active': 'Very active (physical job + training)',
};

/** Mifflin–St Jeor resting energy expenditure, kcal/day. */
export const bmrMifflin = (b: Pick<BodyProfile, 'sex' | 'weightKg' | 'heightCm' | 'ageYears'>) =>
  10 * b.weightKg + 6.25 * b.heightCm - 5 * b.ageYears + (b.sex === 'male' ? 5 : -161);

export const bmi = (b: Pick<BodyProfile, 'weightKg' | 'heightCm'>) =>
  b.weightKg / (b.heightCm / 100) ** 2;

/**
 * Weight used for protein targets. With BMI ≥ 30, actual weight overstates
 * lean-mass needs, so we use adjusted body weight: ref + 0.25·(actual − ref),
 * where ref is the weight at BMI 25. Particularly relevant in lipedema, where
 * a large share of mass is disproportionate subcutaneous fat.
 */
export const proteinReferenceWeight = (b: Pick<BodyProfile, 'weightKg' | 'heightCm'>) => {
  if (bmi(b) < 30) return b.weightKg;
  const ref = 25 * (b.heightCm / 100) ** 2;
  return ref + 0.25 * (b.weightKg - ref);
};

const MIN_KCAL = { female: 1200, male: 1500 } as const;
const GOAL_DELTA = { lose: -500, maintain: 0, gain: 300 } as const;
const PROTEIN_PER_KG = { lose: 1.4, maintain: 1.0, gain: 1.6 } as const;

export interface DailyTargets {
  bmr: number;
  tdee: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  /** Ceiling for added sugar (g). */
  addedSugarMax: number;
  sodiumMax: number;
  /** Notes explaining adjustments (floors, adjusted weight, ...). */
  notes: string[];
}

export function dailyTargets(body: BodyProfile, diet: DietProfile): DailyTargets {
  const notes: string[] = [];
  const bmr = bmrMifflin(body);
  const tdee = bmr * ACTIVITY_FACTOR[body.activity];

  let kcal = tdee + GOAL_DELTA[body.goal];
  const floor = Math.max(MIN_KCAL[body.sex], body.goal === 'lose' ? bmr * 0.9 : 0);
  if (kcal < floor) {
    kcal = floor;
    notes.push(`Calories held at a safe minimum of ${Math.round(floor)} kcal — larger deficits risk muscle loss.`);
  }

  const refWeight = proteinReferenceWeight(body);
  if (refWeight !== body.weightKg) {
    notes.push(`Protein is based on an adjusted body weight of ${Math.round(refWeight)} kg (BMI ≥ 30).`);
  }
  let protein = refWeight * PROTEIN_PER_KG[body.goal];
  protein = Math.min(protein, (kcal * 0.35) / 4);

  let carbs = (kcal * diet.macros.carbEnergyShare) / 4;
  if (diet.macros.maxNetCarbsPerDay) carbs = Math.min(carbs, diet.macros.maxNetCarbsPerDay + 25);

  const fat = Math.max(0, (kcal - protein * 4 - carbs * 4) / 9);
  const fiber = Math.max(25, (kcal / 1000) * 14);

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    kcal: Math.round(kcal),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
    fiber: Math.round(fiber),
    addedSugarMax: Math.round((kcal * diet.macros.addedSugarMaxShare) / 4),
    sodiumMax: 2000,
    notes,
  };
}

/** How the day's energy is split across meals. */
export const MEAL_SHARE: Record<3 | 4, Partial<Record<MealType, number>>> = {
  3: { breakfast: 0.3, lunch: 0.4, dinner: 0.3 },
  4: { breakfast: 0.25, lunch: 0.35, dinner: 0.3, snack: 0.1 },
};

export const round = (n: number, digits = 0) => {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
};
