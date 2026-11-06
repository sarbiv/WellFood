# WellFood

An evidence-informed diet companion — built first for **lipedema**, designed for any condition that needs a specific diet.

- **Cook from your fridge** — add what you have and get recipes that fit your diet, ranked by how much you already have. You choose how many extra items you're willing to buy.
- **Filters & preferences** — meal type, taste (sweet / savory / spicy / fresh), categories (quick, high-protein, low-carb, high-fibre, vegetarian, vegan, dairy-free, gluten-free), restrictions, and hard exclusions ("no tomatoes").
- **Your measurements** — sex, age, height, weight, activity and goal give daily calorie and macro targets.
- **Nutrition everywhere** — calories, protein, carbs, fibre, sugar (and added sugar), fat, saturated fat and sodium for every recipe, per serving and per ingredient.
- **Meal plans** — a 7-day plan sized to your targets, with portions scaled to fit and one-tap meal swaps.
- **Your own recipes** — build them from the ingredient database with live nutrition and diet-fit feedback; save any recipe.
- **Grocery list** — generated from the missing ingredients of a recipe or a whole week's plan, grouped by store section; ticked items can be moved straight into your fridge.
- **The science** — every rule cites its source (consensus guidelines, RCTs, pilot studies) and the app says so where evidence is still early.

> Educational information, not medical advice.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # domain tests (vitest)
npm run build      # static build in dist/ (hash routing → deploys to any static host)
```

## Architecture

```
src/
  domain/        Pure TypeScript, no React — the product's brain, fully unit-tested
    types.ts       Domain model (everything in grams; nutrients per 100 g)
    evidence.ts    Source registry (citations + plain-language takeaways)
    diets.ts       Declarative diet profiles: macro intent + favour/limit/avoid rules → sources
    nutrition.ts   Nutrient math, Mifflin–St Jeor, activity factors, daily targets
    compliance.ts  Scores a recipe against a diet, producing cited reasons
    matching.ts    Search, derived categories, pantry coverage, restriction gate
    planner.ts     Constraint-first, seeded greedy meal planner with portion fitting
    grocery.ts     Demand → missing items aggregation and non-destructive merging
  data/          Ingredient table (USDA FoodData Central values) and seed recipes
  store/         Reducer + context; persistence behind a `StateStorage` port (localStorage today)
  ui/, pages/    Presentational layer
```

Key decisions:

- **Diets are data, not code.** A new condition (PCOS, IBS-low-FODMAP, CKD…) is a new `DietProfile` with rules and sources.
- **Nutrition is always derived** from ingredient grams, never hand-typed, so user recipes are as accurate as curated ones.
- **Explainability is a feature.** Each score is the sum of human-readable, cited reasons.
- **Local-first.** Data stays on the device. Swapping `localStateStorage` for a synced backend doesn't touch the UI.

## Evidence base (lipedema)

- Herbst et al., *Standard of care for lipedema in the United States*, Phlebology 2021
- Di Renzo et al., *Modified Mediterranean diet … in lipoedema*, Nutrients 2021
- Jeziorek et al., *LCHF vs moderate-carb diet in lipedema*, DMSO 2023 (RCT)
- Sørlie et al., *LIPODIET pilot study*, Obes Sci Pract 2022
- Keith et al., *Ketogenic diet as a potential intervention for lipedema*, Med Hypotheses 2021

Full list in-app under **Profile → The science**.

## Roadmap ideas

- Larger ingredient database via the USDA FoodData Central API (search + barcode scan)
- Macro-aware planner (optimise protein/carb balance, not just calories) and batch-cooking leftovers
- Pantry quantities and expiry dates; "use it up" suggestions
- Accounts + sync; share recipes and lists with household members
- Native wrapper (Capacitor) for app stores
