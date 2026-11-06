import type { Compliance } from './compliance';
import { netCarbs, perServing, type IngredientLookup } from './nutrition';
import type { DietFlag, MealType, Nutrients, Preferences, Recipe, Taste } from './types';

// ── Facets: derived categories, never stored, so they can't drift ─────

export type Facet = 'quick' | 'high-protein' | 'low-carb' | 'high-fiber' | 'vegetarian' | 'vegan' | 'dairy-free' | 'gluten-free';

export const FACET_LABEL: Record<Facet, string> = {
  quick: 'Under 20 min',
  'high-protein': 'High protein',
  'low-carb': 'Low carb',
  'high-fiber': 'High fibre',
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  'dairy-free': 'Dairy-free',
  'gluten-free': 'Gluten-free',
};

export const recipeFlags = (recipe: Recipe, lookup: IngredientLookup): Set<DietFlag> => {
  const flags = new Set<DietFlag>();
  for (const ri of recipe.ingredients) {
    if (ri.optional) continue;
    lookup(ri.ingredientId)?.flags.forEach((f) => flags.add(f));
  }
  return flags;
};

export function recipeFacets(recipe: Recipe, lookup: IngredientLookup, n: Nutrients = perServing(recipe, lookup)): Set<Facet> {
  const flags = recipeFlags(recipe, lookup);
  const out = new Set<Facet>();
  if (recipe.minutes <= 20) out.add('quick');
  if (n.protein >= 25 || (n.kcal > 0 && (n.protein * 4) / n.kcal >= 0.3)) out.add('high-protein');
  if (netCarbs(n) <= 15) out.add('low-carb');
  if (n.fiber >= 8) out.add('high-fiber');
  if (!flags.has('meat') && !flags.has('fish')) out.add('vegetarian');
  if (!flags.has('meat') && !flags.has('fish') && !flags.has('dairy') && !flags.has('egg')) out.add('vegan');
  if (!flags.has('dairy')) out.add('dairy-free');
  if (!flags.has('gluten')) out.add('gluten-free');
  return out;
}

// ── Pantry coverage ────────────────────────────────────────────────

export interface PantryMatch {
  have: string[];
  missing: string[];
  /** 0–1 share of required (non-staple, non-optional) ingredients on hand. */
  coverage: number;
}

export function pantryMatch(recipe: Recipe, pantry: ReadonlySet<string>, lookup: IngredientLookup): PantryMatch {
  const required = recipe.ingredients.filter((ri) => !ri.optional && !lookup(ri.ingredientId)?.staple);
  const have = required.filter((ri) => pantry.has(ri.ingredientId)).map((ri) => ri.ingredientId);
  const missing = required.filter((ri) => !pantry.has(ri.ingredientId)).map((ri) => ri.ingredientId);
  return { have, missing, coverage: required.length ? have.length / required.length : 1 };
}

// ── Preference gate ────────────────────────────────────────────────

/** Hard constraints: excluded ingredients and restriction flags. Never violated. */
export function violatesRestrictions(recipe: Recipe, prefs: Pick<Preferences, 'excludedIngredients' | 'excludedFlags'>, lookup: IngredientLookup): boolean {
  const excluded = new Set(prefs.excludedIngredients);
  const banned = new Set(prefs.excludedFlags);
  return recipe.ingredients.some((ri) => {
    if (ri.optional) return false; // optional items are simply skipped by the cook
    if (excluded.has(ri.ingredientId)) return true;
    return lookup(ri.ingredientId)?.flags.some((f) => banned.has(f)) ?? false;
  });
}

// ── Search ─────────────────────────────────────────────────────────

export interface RecipeQuery {
  text?: string;
  mealType?: MealType;
  taste?: Taste;
  facets?: Facet[];
  /** Restrict to these ids (e.g. saved recipes). */
  ids?: ReadonlySet<string>;
  /** Pantry mode: rank by what you have. maxMissing = how many extras you're willing to buy. */
  pantry?: { items: ReadonlySet<string>; maxMissing: number };
  /** Hide recipes the diet rates 'avoid'. */
  hideNonCompliant?: boolean;
}

export interface RankedRecipe {
  recipe: Recipe;
  nutrients: Nutrients;
  facets: Set<Facet>;
  compliance: Compliance;
  pantry?: PantryMatch;
  rank: number;
}

export interface MatchContext {
  lookup: IngredientLookup;
  prefs: Preferences;
  assess: (r: Recipe) => Compliance;
}

export function searchRecipes(recipes: Recipe[], q: RecipeQuery, ctx: MatchContext): RankedRecipe[] {
  const text = q.text?.trim().toLowerCase();
  const out: RankedRecipe[] = [];

  for (const recipe of recipes) {
    if (q.ids && !q.ids.has(recipe.id)) continue;
    if (violatesRestrictions(recipe, ctx.prefs, ctx.lookup)) continue;
    if (q.mealType && !recipe.mealTypes.includes(q.mealType)) continue;
    if (q.taste && !recipe.tastes.includes(q.taste)) continue;
    if (text) {
      const hay = [recipe.title, recipe.summary, ...recipe.ingredients.map((i) => ctx.lookup(i.ingredientId)?.name ?? '')]
        .join(' ')
        .toLowerCase();
      if (!hay.includes(text)) continue;
    }

    const nutrients = perServing(recipe, ctx.lookup);
    const facets = recipeFacets(recipe, ctx.lookup, nutrients);
    if (q.facets?.some((f) => !facets.has(f))) continue;

    const compliance = ctx.assess(recipe);
    if (q.hideNonCompliant && compliance.verdict === 'avoid') continue;

    let pantry: PantryMatch | undefined;
    if (q.pantry) {
      pantry = pantryMatch(recipe, q.pantry.items, ctx.lookup);
      if (pantry.missing.length > q.pantry.maxMissing) continue;
    }

    // Ranking: diet fit first, then preference match; pantry coverage dominates in pantry mode.
    const tasteBonus = recipe.tastes.some((t) => ctx.prefs.tastes.includes(t)) ? 8 : 0;
    const mealBonus = recipe.mealTypes.some((m) => ctx.prefs.mealTypes.includes(m)) ? 4 : 0;
    const rank = compliance.score + tasteBonus + mealBonus + (pantry ? pantry.coverage * 100 - pantry.missing.length * 5 : 0);

    out.push({ recipe, nutrients, facets, compliance, pantry, rank });
  }

  return out.sort((a, b) => b.rank - a.rank);
}
