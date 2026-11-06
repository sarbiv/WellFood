import type { Compliance } from './compliance';
import { MEAL_SHARE, perServing, scaleNutrients, sumNutrients, type DailyTargets, type IngredientLookup } from './nutrition';
import { violatesRestrictions } from './matching';
import type { MealPlan, MealPlanDay, MealPlanSlot, MealType, Nutrients, Preferences, Recipe } from './types';

export interface PlannerInput {
  recipes: Recipe[];
  targets: DailyTargets;
  prefs: Preferences;
  lookup: IngredientLookup;
  assess: (r: Recipe) => Compliance;
  pantry?: ReadonlySet<string>;
  startDate: Date;
  days: number;
  /** Seed for reproducible variety (tests, "regenerate"). */
  seed?: number;
}

/** Small deterministic PRNG (mulberry32) — variety without Math.random in tests. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const isoDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const PORTION_STEP = 0.25;
const PORTION_MIN = 0.5;
const PORTION_MAX = 2;

/** Portion multiplier that brings a recipe's serving closest to the slot's kcal target. */
export const fitPortion = (kcalPerServing: number, kcalTarget: number) => {
  if (kcalPerServing <= 0) return 1;
  const raw = kcalTarget / kcalPerServing;
  const stepped = Math.round(raw / PORTION_STEP) * PORTION_STEP;
  return Math.min(PORTION_MAX, Math.max(PORTION_MIN, stepped));
};

export const mealTypesFor = (prefs: Preferences): MealType[] =>
  prefs.mealsPerDay === 4 ? ['breakfast', 'lunch', 'dinner', 'snack'] : ['breakfast', 'lunch', 'dinner'];

interface Candidate {
  recipe: Recipe;
  kcal: number;
  base: number;
}

/**
 * Greedy, constraint-first planner:
 *  1. Hard filter: restrictions, meal type, diet verdict ≠ avoid.
 *  2. Score: diet fit + taste prefs + pantry coverage + portion accuracy − recent repetition.
 *  3. Weighted-random pick among the top few to keep weeks varied.
 * Simple and explainable; swap for an ILP solver later if needed.
 */
export function generatePlan(input: PlannerInput): MealPlan {
  const { recipes, targets, prefs, lookup, assess, pantry } = input;
  const rand = rng(input.seed ?? Date.now());
  const shares = MEAL_SHARE[prefs.mealsPerDay];
  const types = mealTypesFor(prefs);

  const byType = new Map<MealType, Candidate[]>();
  for (const type of types) {
    const list: Candidate[] = [];
    for (const recipe of recipes) {
      if (!recipe.mealTypes.includes(type)) continue;
      if (violatesRestrictions(recipe, prefs, lookup)) continue;
      const c = assess(recipe);
      if (c.verdict === 'avoid') continue;
      let base = c.score;
      if (recipe.tastes.some((t) => prefs.tastes.includes(t))) base += 10;
      if (pantry) {
        const req = recipe.ingredients.filter((i) => !i.optional && !lookup(i.ingredientId)?.staple);
        const have = req.filter((i) => pantry.has(i.ingredientId)).length;
        base += req.length ? (have / req.length) * 15 : 0;
      }
      list.push({ recipe, kcal: perServing(recipe, lookup).kcal, base });
    }
    byType.set(type, list);
  }

  const lastUsed = new Map<string, number>();
  const days: MealPlanDay[] = [];

  for (let d = 0; d < input.days; d++) {
    const date = new Date(input.startDate);
    date.setDate(date.getDate() + d);
    const slots: MealPlanSlot[] = [];

    for (const type of types) {
      const target = targets.kcal * (shares[type] ?? 0);
      const candidates = byType.get(type) ?? [];
      if (!candidates.length) continue;

      const scored = candidates
        .map((c) => {
          const portion = fitPortion(c.kcal, target);
          const accuracy = 1 - Math.min(1, Math.abs(c.kcal * portion - target) / Math.max(1, target));
          const since = lastUsed.has(c.recipe.id) ? d - (lastUsed.get(c.recipe.id) as number) : Infinity;
          const repeatPenalty = since === 0 ? 100 : since < 3 ? 40 / since : 0;
          return { c, portion, score: c.base + accuracy * 20 - repeatPenalty };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 4);

      // Weighted pick among top 4 (weights 4,3,2,1).
      const weights = scored.map((_, i) => scored.length - i);
      let roll = rand() * weights.reduce((a, b) => a + b, 0);
      let pick = scored[0];
      for (let i = 0; i < scored.length; i++) {
        roll -= weights[i] as number;
        if (roll <= 0) { pick = scored[i]; break; }
      }
      if (!pick) continue;

      lastUsed.set(pick.c.recipe.id, d);
      slots.push({ mealType: type, recipeId: pick.c.recipe.id, servings: pick.portion });
    }
    days.push({ date: isoDate(date), slots });
  }

  return { createdAt: Date.now(), targetKcal: targets.kcal, days };
}

/** Nutrition actually planned for a day (servings × per-serving). */
export function dayNutrients(day: MealPlanDay, recipeById: (id: string) => Recipe | undefined, lookup: IngredientLookup): Nutrients {
  return sumNutrients(
    day.slots.flatMap((s) => {
      const r = recipeById(s.recipeId);
      return r ? [scaleNutrients(perServing(r, lookup), s.servings)] : [];
    }),
  );
}
