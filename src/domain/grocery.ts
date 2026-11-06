import type { IngredientLookup } from './nutrition';
import type { GroceryItem, Recipe } from './types';

export interface RecipeDemand {
  recipe: Recipe;
  /** Servings to cook (portion multipliers summed). */
  servings: number;
}

export const groceryIdFor = (ingredientId: string) => `ing:${ingredientId}`;

/**
 * Turns "what I want to cook" into "what I need to buy":
 * aggregates grams across recipes, drops what's in the pantry and staples,
 * then merges into the existing list without losing checked state or manual items.
 */
export function buildGroceryItems(
  demands: RecipeDemand[],
  pantry: ReadonlySet<string>,
  lookup: IngredientLookup,
): GroceryItem[] {
  const acc = new Map<string, GroceryItem>();
  for (const { recipe, servings } of demands) {
    const factor = servings / Math.max(1, recipe.servings);
    for (const ri of recipe.ingredients) {
      if (ri.optional || pantry.has(ri.ingredientId)) continue;
      const ing = lookup(ri.ingredientId);
      if (!ing || ing.staple) continue;
      const id = groceryIdFor(ing.id);
      const prev = acc.get(id);
      const grams = (prev?.grams ?? 0) + ri.grams * factor;
      const fromRecipes = prev ? Array.from(new Set([...prev.fromRecipes, recipe.id])) : [recipe.id];
      acc.set(id, { id, ingredientId: ing.id, label: ing.name, grams, checked: false, fromRecipes });
    }
  }
  return [...acc.values()];
}

export function mergeGrocery(existing: GroceryItem[], incoming: GroceryItem[]): GroceryItem[] {
  const out = new Map(existing.map((i) => [i.id, i]));
  for (const item of incoming) {
    const prev = out.get(item.id);
    if (!prev) {
      out.set(item.id, item);
      continue;
    }
    out.set(item.id, {
      ...prev,
      grams: (prev.grams ?? 0) + (item.grams ?? 0),
      // New demand re-opens a ticked item: you need more than you bought.
      checked: false,
      fromRecipes: Array.from(new Set([...prev.fromRecipes, ...item.fromRecipes])),
    });
  }
  return [...out.values()];
}

/** Round to sensible shopping quantities. */
export const shoppingGrams = (g: number) => (g < 20 ? Math.ceil(g) : g < 250 ? Math.ceil(g / 10) * 10 : Math.ceil(g / 50) * 50);
