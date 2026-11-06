import { DEFAULT_DIET_ID } from '../domain/diets';
import { buildGroceryItems, mergeGrocery, type RecipeDemand } from '../domain/grocery';
import type { IngredientLookup } from '../domain/nutrition';
import type { BodyProfile, GroceryItem, MealPlan, MealPlanSlot, Preferences, Recipe } from '../domain/types';

export interface AppState {
  version: 1;
  onboarded: boolean;
  body: BodyProfile | null;
  prefs: Preferences;
  /** Ingredient ids currently in fridge/pantry. */
  pantry: string[];
  savedRecipeIds: string[];
  userRecipes: Recipe[];
  plan: MealPlan | null;
  grocery: GroceryItem[];
}

export const initialState: AppState = {
  version: 1,
  onboarded: false,
  body: null,
  prefs: {
    dietId: DEFAULT_DIET_ID,
    mealTypes: ['breakfast', 'lunch', 'dinner'],
    tastes: [],
    excludedIngredients: [],
    excludedFlags: [],
    mealsPerDay: 3,
  },
  pantry: [],
  savedRecipeIds: [],
  userRecipes: [],
  plan: null,
  grocery: [],
};

export type Action =
  | { type: 'completeOnboarding'; body: BodyProfile; prefs: Preferences }
  | { type: 'setBody'; body: BodyProfile }
  | { type: 'setPrefs'; prefs: Partial<Preferences> }
  | { type: 'togglePantry'; id: string }
  | { type: 'setPantry'; ids: string[] }
  | { type: 'toggleSaved'; id: string }
  | { type: 'upsertRecipe'; recipe: Recipe }
  | { type: 'deleteRecipe'; id: string }
  | { type: 'setPlan'; plan: MealPlan | null }
  | { type: 'replaceSlot'; date: string; index: number; slot: MealPlanSlot }
  | { type: 'addToGrocery'; demands: RecipeDemand[]; lookup: IngredientLookup }
  | { type: 'addGroceryManual'; label: string }
  | { type: 'toggleGrocery'; id: string }
  | { type: 'removeGrocery'; id: string }
  | { type: 'clearGrocery'; onlyChecked: boolean }
  | { type: 'moveCheckedToPantry' }
  | { type: 'reset' };

const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'completeOnboarding':
      return { ...state, onboarded: true, body: action.body, prefs: action.prefs };
    case 'setBody':
      return { ...state, body: action.body };
    case 'setPrefs':
      return { ...state, prefs: { ...state.prefs, ...action.prefs } };
    case 'togglePantry':
      return { ...state, pantry: toggle(state.pantry, action.id) };
    case 'setPantry':
      return { ...state, pantry: action.ids };
    case 'toggleSaved':
      return { ...state, savedRecipeIds: toggle(state.savedRecipeIds, action.id) };
    case 'upsertRecipe': {
      const exists = state.userRecipes.some((r) => r.id === action.recipe.id);
      return {
        ...state,
        userRecipes: exists
          ? state.userRecipes.map((r) => (r.id === action.recipe.id ? action.recipe : r))
          : [action.recipe, ...state.userRecipes],
        // Own recipes are saved by default.
        savedRecipeIds: state.savedRecipeIds.includes(action.recipe.id) ? state.savedRecipeIds : [...state.savedRecipeIds, action.recipe.id],
      };
    }
    case 'deleteRecipe':
      return {
        ...state,
        userRecipes: state.userRecipes.filter((r) => r.id !== action.id),
        savedRecipeIds: state.savedRecipeIds.filter((x) => x !== action.id),
        plan: state.plan && {
          ...state.plan,
          days: state.plan.days.map((d) => ({ ...d, slots: d.slots.filter((s) => s.recipeId !== action.id) })),
        },
      };
    case 'setPlan':
      return { ...state, plan: action.plan };
    case 'replaceSlot':
      if (!state.plan) return state;
      return {
        ...state,
        plan: {
          ...state.plan,
          days: state.plan.days.map((d) =>
            d.date !== action.date ? d : { ...d, slots: d.slots.map((s, i) => (i === action.index ? action.slot : s)) },
          ),
        },
      };
    case 'addToGrocery':
      return {
        ...state,
        grocery: mergeGrocery(state.grocery, buildGroceryItems(action.demands, new Set(state.pantry), action.lookup)),
      };
    case 'addGroceryManual': {
      const label = action.label.trim();
      if (!label) return state;
      return {
        ...state,
        grocery: [...state.grocery, { id: `manual:${Date.now().toString(36)}`, label, checked: false, fromRecipes: [] }],
      };
    }
    case 'toggleGrocery':
      return { ...state, grocery: state.grocery.map((g) => (g.id === action.id ? { ...g, checked: !g.checked } : g)) };
    case 'removeGrocery':
      return { ...state, grocery: state.grocery.filter((g) => g.id !== action.id) };
    case 'clearGrocery':
      return { ...state, grocery: action.onlyChecked ? state.grocery.filter((g) => !g.checked) : [] };
    case 'moveCheckedToPantry': {
      const bought = state.grocery.filter((g) => g.checked && g.ingredientId).map((g) => g.ingredientId as string);
      return {
        ...state,
        pantry: Array.from(new Set([...state.pantry, ...bought])),
        grocery: state.grocery.filter((g) => !g.checked),
      };
    }
    case 'reset':
      return initialState;
  }
}
