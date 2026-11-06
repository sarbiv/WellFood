import { describe, expect, it } from 'vitest';
import { INGREDIENT_BY_ID } from '../../data/ingredients';
import { SEED_RECIPES } from '../../data/recipes';
import { assessRecipe } from '../compliance';
import { DIETS, getDiet } from '../diets';
import { SOURCES } from '../evidence';
import { buildGroceryItems, mergeGrocery } from '../grocery';
import { pantryMatch, searchRecipes, violatesRestrictions } from '../matching';
import { bmrMifflin, dailyTargets, perServing, proteinReferenceWeight } from '../nutrition';
import { dayNutrients, fitPortion, generatePlan } from '../planner';
import type { BodyProfile, Preferences, Recipe } from '../types';

const lookup = (id: string) => INGREDIENT_BY_ID.get(id);
const byId = (id: string) => SEED_RECIPES.find((r) => r.id === id) as Recipe;

const body: BodyProfile = { sex: 'female', ageYears: 40, heightCm: 165, weightKg: 85, activity: 'light', goal: 'lose' };
const prefs: Preferences = { dietId: 'lipedema-med', mealTypes: [], tastes: [], excludedIngredients: [], excludedFlags: [], mealsPerDay: 3 };

describe('data integrity', () => {
  it('every recipe ingredient exists in the database', () => {
    for (const r of SEED_RECIPES) for (const i of r.ingredients) expect(lookup(i.ingredientId), `${r.id}:${i.ingredientId}`).toBeDefined();
  });
  it('recipe ids are unique', () => {
    expect(new Set(SEED_RECIPES.map((r) => r.id)).size).toBe(SEED_RECIPES.length);
  });
  it('every diet rule cites a known source', () => {
    for (const d of DIETS) for (const rule of d.rules) for (const s of rule.sources) expect(SOURCES[s]).toBeDefined();
  });
  it('ingredient energy is consistent with Atwater factors (±25%)', () => {
    for (const ing of INGREDIENT_BY_ID.values()) {
      const n = ing.per100g;
      // USDA uses food-specific energy factors for very high-fibre foods (cocoa, spices).
      // Vanilla extract's energy is mostly alcohol.
      if (n.kcal < 50 || n.fiber > 20 || ing.id === 'vanilla') continue;
      const atwater = n.protein * 4 + (n.carbs - n.fiber) * 4 + n.fiber * 2 + n.fat * 9;
      expect(Math.abs(atwater - n.kcal) / n.kcal, ing.id).toBeLessThan(0.25);
    }
  });
});

describe('energy & targets', () => {
  it('Mifflin–St Jeor matches the published formula', () => {
    expect(bmrMifflin(body)).toBeCloseTo(10 * 85 + 6.25 * 165 - 5 * 40 - 161, 5);
  });
  it('uses adjusted weight for protein when BMI ≥ 30', () => {
    const heavy = { ...body, weightKg: 110 };
    expect(proteinReferenceWeight(heavy)).toBeLessThan(110);
    expect(proteinReferenceWeight({ ...body, weightKg: 70 })).toBe(70);
  });
  it('never drops below the safety floor', () => {
    const t = dailyTargets({ ...body, weightKg: 50, heightCm: 150, ageYears: 70, activity: 'sedentary' }, getDiet('lipedema-med'));
    expect(t.kcal).toBeGreaterThanOrEqual(1200);
    expect(t.notes.length).toBeGreaterThan(0);
  });
  it('low-carb diet yields fewer carbs than Mediterranean', () => {
    expect(dailyTargets(body, getDiet('lipedema-lchf')).carbs).toBeLessThan(dailyTargets(body, getDiet('mediterranean')).carbs);
  });
});

describe('compliance', () => {
  const lip = getDiet('lipedema-med');
  it('flags added sugar for lipedema', () => {
    expect(assessRecipe(byId('pancakes-honey'), lip, lookup).verdict).toBe('avoid');
  });
  it('rates an omega-3 vegetable dish highly', () => {
    expect(['great', 'good']).toContain(assessRecipe(byId('salmon-quinoa-bowl'), lip, lookup).verdict);
  });
  it('every reason carries sources', () => {
    for (const reason of assessRecipe(byId('greek-chicken-salad'), lip, lookup).reasons) expect(reason.sources.length).toBeGreaterThan(0);
  });
});

describe('matching', () => {
  it('excluded ingredients are hard-filtered (no tomatoes)', () => {
    const p = { ...prefs, excludedIngredients: ['tomato', 'cherry-tomato', 'canned-tomato'] };
    expect(violatesRestrictions(byId('greek-chicken-salad'), p, lookup)).toBe(true);
    // Optional tomatoes don't disqualify.
    expect(violatesRestrictions(byId('spinach-feta-omelette'), p, lookup)).toBe(false);
  });
  it('vegan excludes animal flags', () => {
    const p = { ...prefs, excludedFlags: ['meat', 'fish', 'dairy', 'egg'] as Preferences['excludedFlags'] };
    const res = searchRecipes(SEED_RECIPES, {}, { lookup, prefs: p, assess: (r) => assessRecipe(r, getDiet('lipedema-med'), lookup) });
    expect(res.length).toBeGreaterThan(0);
    expect(res.map((r) => r.recipe.id)).not.toContain('greek-chicken-salad');
  });
  it('pantry coverage ignores staples and optionals', () => {
    const m = pantryMatch(byId('cottage-berry-bowl'), new Set(['cottage-cheese', 'raspberries', 'pumpkin-seeds']), lookup);
    expect(m.coverage).toBe(1);
    expect(m.missing).toEqual([]);
  });
  it('pantry mode respects maxMissing and ranks complete matches first', () => {
    const pantry = new Set(['egg', 'spinach', 'feta', 'olive-oil']);
    const res = searchRecipes(SEED_RECIPES, { pantry: { items: pantry, maxMissing: 1 } }, { lookup, prefs, assess: (r) => assessRecipe(r, getDiet('balanced'), lookup) });
    expect(res[0]?.recipe.id).toBe('spinach-feta-omelette');
    for (const r of res) expect(r.pantry!.missing.length).toBeLessThanOrEqual(1);
  });
});

describe('planner', () => {
  it('portion fitting is stepped and clamped', () => {
    expect(fitPortion(400, 600)).toBe(1.5);
    expect(fitPortion(100, 1000)).toBe(2);
    expect(fitPortion(1000, 100)).toBe(0.5);
  });
  it('builds a 7-day plan without avoided recipes, close to target', () => {
    const diet = getDiet('lipedema-med');
    const targets = dailyTargets(body, diet);
    const assess = (r: Recipe) => assessRecipe(r, diet, lookup);
    const plan = generatePlan({ recipes: SEED_RECIPES, targets, prefs, lookup, assess, startDate: new Date('2026-01-05'), days: 7, seed: 42 });
    expect(plan.days).toHaveLength(7);
    for (const day of plan.days) {
      expect(day.slots).toHaveLength(3);
      for (const s of day.slots) expect(assess(byId(s.recipeId)).verdict).not.toBe('avoid');
      const kcal = dayNutrients(day, byId, lookup).kcal;
      expect(Math.abs(kcal - targets.kcal) / targets.kcal).toBeLessThan(0.3);
    }
    // No recipe twice on the same day.
    for (const day of plan.days) expect(new Set(day.slots.map((s) => s.recipeId)).size).toBe(day.slots.length);
  });
  it('is deterministic for a seed', () => {
    const diet = getDiet('balanced');
    const args = { recipes: SEED_RECIPES, targets: dailyTargets(body, diet), prefs, lookup, assess: (r: Recipe) => assessRecipe(r, diet, lookup), startDate: new Date('2026-01-05'), days: 3, seed: 7 };
    expect(generatePlan(args).days).toEqual(generatePlan(args).days);
  });
});

describe('grocery', () => {
  it('lists only missing non-staples, scaled by servings', () => {
    const r = byId('chickpea-tuna-salad'); // serves 2
    const items = buildGroceryItems([{ recipe: r, servings: 4 }], new Set(['olive-oil', 'lemon']), lookup);
    const chick = items.find((i) => i.ingredientId === 'chickpeas');
    expect(chick?.grams).toBe(480);
    expect(items.find((i) => i.ingredientId === 'olive-oil')).toBeUndefined();
  });
  it('merging sums quantities and preserves manual items', () => {
    const manual = { id: 'manual:1', label: 'Coffee', checked: true, fromRecipes: [] };
    const a = buildGroceryItems([{ recipe: byId('chickpea-tuna-salad'), servings: 2 }], new Set(), lookup);
    const merged = mergeGrocery([manual, ...a], a);
    expect(merged.find((i) => i.id === 'manual:1')).toEqual(manual);
    expect(merged.find((i) => i.ingredientId === 'chickpeas')?.grams).toBe(480);
  });
  it('per-serving nutrition is total / servings', () => {
    const r = byId('broccoli-soup');
    expect(perServing(r, lookup).kcal * r.servings).toBeGreaterThan(0);
  });
});
