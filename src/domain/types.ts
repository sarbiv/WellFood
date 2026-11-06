/**
 * Core domain model. Pure data — no React, no storage concerns.
 * Everything nutritional is stored per 100 g and in grams so the math stays exact;
 * household units are a presentation concern (see Ingredient.units).
 */

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export type Taste = 'sweet' | 'savory' | 'spicy' | 'fresh';
export const TASTES: Taste[] = ['sweet', 'savory', 'spicy', 'fresh'];

export type IngredientCategory =
  | 'vegetables'
  | 'fruit'
  | 'protein'
  | 'fish'
  | 'dairy'
  | 'grains'
  | 'legumes'
  | 'nuts-seeds'
  | 'fats-oils'
  | 'herbs-spices'
  | 'pantry';

/** Flags used for dietary restrictions (vegan, gluten-free, ...). */
export type DietFlag = 'meat' | 'fish' | 'dairy' | 'egg' | 'gluten' | 'nuts' | 'soy';

/**
 * Evidence-linked qualities. Diet profiles reward or penalise these.
 * Keep them objective (composition-based), not marketing terms.
 */
export type QualityTag =
  | 'leafy-green'
  | 'cruciferous'
  | 'omega-3'
  | 'polyphenol-rich'
  | 'high-fiber'
  | 'whole-grain'
  | 'refined-grain'
  | 'added-sugar'
  | 'processed-meat'
  | 'starchy'
  | 'fermented'
  | 'mufa-rich';

export type GlycemicBand = 'low' | 'medium' | 'high' | 'none';

/** Macro + key micro nutrients. Units: kcal, g, mg for sodium. */
export interface Nutrients {
  kcal: number;
  protein: number;
  fat: number;
  satFat: number;
  carbs: number;
  fiber: number;
  sugar: number;
  /** Sugar from ingredients tagged 'added-sugar' (honey, syrups) — what WHO limits. */
  addedSugar: number;
  sodium: number;
}

export interface HouseholdUnit {
  label: string; // "cup", "tbsp", "medium"
  grams: number;
}

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  /** Nutrients per 100 g (edible portion). */
  per100g: Nutrients;
  flags: DietFlag[];
  qualities: QualityTag[];
  glycemic: GlycemicBand;
  units: HouseholdUnit[];
  /** Pantry staples (salt, pepper, water) never block a recipe or hit the grocery list. */
  staple?: boolean;
}

export interface RecipeIngredient {
  ingredientId: string;
  grams: number;
  /** Optional ingredients don't count against pantry coverage. */
  optional?: boolean;
  note?: string;
}

export interface Recipe {
  id: string;
  title: string;
  summary: string;
  mealTypes: MealType[];
  tastes: Taste[];
  servings: number;
  minutes: number;
  ingredients: RecipeIngredient[];
  steps: string[];
  /** 'seed' = curated library; 'user' = created in-app. */
  source: 'seed' | 'user';
  createdAt?: number;
}

export type Sex = 'female' | 'male';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active';

export type Goal = 'lose' | 'maintain' | 'gain';

export interface BodyProfile {
  sex: Sex;
  ageYears: number;
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
  goal: Goal;
}

export interface Preferences {
  dietId: string;
  mealTypes: MealType[];
  tastes: Taste[];
  /** Ingredient ids the user never wants (e.g. "tomato"). */
  excludedIngredients: string[];
  /** Restrictions expressed as flags to exclude (vegan = meat, fish, dairy, egg). */
  excludedFlags: DietFlag[];
  mealsPerDay: 3 | 4;
}

export interface MealPlanSlot {
  mealType: MealType;
  recipeId: string;
  servings: number;
}

export interface MealPlanDay {
  date: string; // ISO yyyy-mm-dd
  slots: MealPlanSlot[];
}

export interface MealPlan {
  createdAt: number;
  targetKcal: number;
  days: MealPlanDay[];
}

export interface GroceryItem {
  id: string;
  /** Linked to the ingredient db when known; free text otherwise. */
  ingredientId?: string;
  label: string;
  grams?: number;
  checked: boolean;
  /** Which recipe(s) generated the item — lets users see "why is this here?". */
  fromRecipes: string[];
}
