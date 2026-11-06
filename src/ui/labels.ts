import type { DietFlag, Goal, MealType, Sex, Taste } from '../domain/types';

export const MEAL_LABEL: Record<MealType, string> = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };
export const TASTE_LABEL: Record<Taste, string> = { sweet: 'Sweet', savory: 'Savory', spicy: 'Spicy', fresh: 'Fresh & light' };
export const GOAL_LABEL: Record<Goal, string> = { lose: 'Lose weight', maintain: 'Maintain', gain: 'Gain' };
export const SEX_LABEL: Record<Sex, string> = { female: 'Female', male: 'Male' };

/** User-facing restriction presets map onto ingredient flags. */
export const RESTRICTIONS: { id: string; label: string; flags: DietFlag[] }[] = [
  { id: 'vegetarian', label: 'Vegetarian', flags: ['meat', 'fish'] },
  { id: 'pescatarian', label: 'No meat', flags: ['meat'] },
  { id: 'vegan', label: 'Vegan', flags: ['meat', 'fish', 'dairy', 'egg'] },
  { id: 'dairy', label: 'Dairy-free', flags: ['dairy'] },
  { id: 'gluten', label: 'Gluten-free', flags: ['gluten'] },
  { id: 'nuts', label: 'Nut-free', flags: ['nuts'] },
  { id: 'egg', label: 'Egg-free', flags: ['egg'] },
  { id: 'soy', label: 'Soy-free', flags: ['soy'] },
];

export const restrictionActive = (flags: DietFlag[], preset: { flags: DietFlag[] }) => preset.flags.every((f) => flags.includes(f));

export const toggleRestriction = (flags: DietFlag[], preset: { flags: DietFlag[] }): DietFlag[] =>
  restrictionActive(flags, preset)
    ? flags.filter((f) => !preset.flags.includes(f))
    : Array.from(new Set([...flags, ...preset.flags]));

export const fmtGrams = (g: number) =>
  g >= 1000 ? `${Math.round(g / 100) / 10} kg` : g < 1 ? 'to taste' : `${Math.round(g)} g`;

export const fmtPortion = (p: number) => (p === 1 ? '1 serving' : `${p} servings`);

export const greeting = (d = new Date()) => {
  const h = d.getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};
