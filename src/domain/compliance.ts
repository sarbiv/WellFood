import type { DietProfile, DietRule } from './diets';
import type { SourceId } from './evidence';
import { netCarbs, perServing, type IngredientLookup } from './nutrition';
import type { Ingredient, Recipe } from './types';

export type Verdict = 'great' | 'good' | 'caution' | 'avoid';

export interface ComplianceReason {
  tone: 'positive' | 'negative' | 'neutral';
  text: string;
  sources: SourceId[];
}

export interface Compliance {
  score: number; // 0–100
  verdict: Verdict;
  reasons: ComplianceReason[];
}

const matches = (rule: DietRule, ing: Ingredient) =>
  (rule.quality !== undefined && ing.qualities.includes(rule.quality)) ||
  (rule.glycemic !== undefined && ing.glycemic === rule.glycemic);

/** Ingredients below this weight share are seasoning-level and don't change the verdict. */
const TRACE_SHARE = 0.03;

/**
 * Scores a recipe against a diet. Transparent by design: each point gained or
 * lost becomes a human-readable reason with its sources.
 */
export function assessRecipe(recipe: Recipe, diet: DietProfile, lookup: IngredientLookup): Compliance {
  const reasons: ComplianceReason[] = [];
  const totalGrams = recipe.ingredients.reduce((s, i) => s + i.grams, 0) || 1;
  let score = 70;
  let hardFail = false;

  for (const rule of diet.rules) {
    const hits = recipe.ingredients
      .filter((ri) => !ri.optional)
      .map((ri) => ({ ri, ing: lookup(ri.ingredientId) }))
      .filter((x): x is { ri: typeof x.ri; ing: Ingredient } => !!x.ing && matches(rule, x.ing));
    if (hits.length === 0) continue;

    const share = hits.reduce((s, h) => s + h.ri.grams, 0) / totalGrams;
    const names = hits.map((h) => h.ing.name.toLowerCase()).join(', ');

    if (rule.kind === 'favor') {
      score += Math.min(8, 3 + share * 20);
      reasons.push({ tone: 'positive', text: `${rule.label}: ${names}`, sources: rule.sources });
    } else if (share < TRACE_SHARE && rule.kind === 'limit') {
      reasons.push({ tone: 'neutral', text: `Small amount of ${names} (${rule.label.toLowerCase()})`, sources: rule.sources });
    } else if (rule.kind === 'limit') {
      score -= 8 + share * 30;
      reasons.push({ tone: 'negative', text: `${rule.label}: ${names}. ${rule.why}`, sources: rule.sources });
    } else {
      score -= 30;
      if (share >= TRACE_SHARE) hardFail = true;
      reasons.push({ tone: 'negative', text: `Contains ${names} — ${rule.label.toLowerCase()}. ${rule.why}`, sources: rule.sources });
    }
  }

  // Macro-level check for carb-restricted diets: one serving shouldn't eat more than ~40% of the daily budget.
  const n = perServing(recipe, lookup);
  if (diet.macros.maxNetCarbsPerDay) {
    const nc = netCarbs(n);
    const budget = diet.macros.maxNetCarbsPerDay * 0.4;
    if (nc > budget) {
      score -= 15;
      reasons.push({
        tone: 'negative',
        text: `${Math.round(nc)} g net carbs per serving — over ${Math.round(budget)} g, a typical single-meal budget for this diet.`,
        sources: diet.sources.slice(0, 1),
      });
    } else {
      reasons.push({ tone: 'positive', text: `${Math.round(nc)} g net carbs per serving fits a low-carb day.`, sources: diet.sources.slice(0, 1) });
    }
  }

  if (n.kcal > 0 && (n.protein * 4) / n.kcal >= 0.25) {
    score += 4;
    reasons.push({ tone: 'positive', text: 'Protein-rich — supports satiety and lean mass.', sources: ['leidy2015'] });
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const verdict: Verdict = hardFail ? 'avoid' : score >= 85 ? 'great' : score >= 70 ? 'good' : score >= 50 ? 'caution' : 'avoid';
  return { score, verdict, reasons };
}

export const VERDICT_LABEL: Record<Verdict, string> = {
  great: 'Great fit',
  good: 'Good fit',
  caution: 'Occasional',
  avoid: 'Not a fit',
};
