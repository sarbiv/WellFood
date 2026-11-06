import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type Dispatch, type ReactNode } from 'react';
import { INGREDIENT_BY_ID } from '../data/ingredients';
import { SEED_RECIPES } from '../data/recipes';
import { assessRecipe, type Compliance } from '../domain/compliance';
import { getDiet, type DietProfile } from '../domain/diets';
import { dailyTargets, type DailyTargets, type IngredientLookup } from '../domain/nutrition';
import type { Recipe } from '../domain/types';
import { reducer, type Action, type AppState } from './state';
import { localStateStorage, type StateStorage } from './storage';

interface Store {
  state: AppState;
  dispatch: Dispatch<Action>;
  // Derived, memoised views — components never recompute these themselves.
  diet: DietProfile;
  targets: DailyTargets | null;
  recipes: Recipe[];
  recipeById: (id: string) => Recipe | undefined;
  lookup: IngredientLookup;
  assess: (r: Recipe) => Compliance;
  pantry: ReadonlySet<string>;
}

const Ctx = createContext<Store | null>(null);

const lookup: IngredientLookup = (id) => INGREDIENT_BY_ID.get(id);

export function AppStoreProvider({ children, storage = localStateStorage }: { children: ReactNode; storage?: StateStorage }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => storage.load());

  useEffect(() => {
    storage.save(state);
  }, [state, storage]);

  const diet = useMemo(() => getDiet(state.prefs.dietId), [state.prefs.dietId]);
  const targets = useMemo(() => (state.body ? dailyTargets(state.body, diet) : null), [state.body, diet]);
  const recipes = useMemo(() => [...state.userRecipes, ...SEED_RECIPES], [state.userRecipes]);
  const index = useMemo(() => new Map(recipes.map((r) => [r.id, r])), [recipes]);
  const recipeById = useCallback((id: string) => index.get(id), [index]);
  const pantry = useMemo(() => new Set(state.pantry), [state.pantry]);

  // Compliance is pure per (recipe, diet): cache by identity.
  const assess = useMemo(() => {
    const cache = new WeakMap<Recipe, Compliance>();
    return (r: Recipe) => {
      let c = cache.get(r);
      if (!c) cache.set(r, (c = assessRecipe(r, diet, lookup)));
      return c;
    };
  }, [diet]);

  const value = useMemo<Store>(
    () => ({ state, dispatch, diet, targets, recipes, recipeById, lookup, assess, pantry }),
    [state, diet, targets, recipes, recipeById, assess, pantry],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used inside <AppStoreProvider>');
  return s;
}
