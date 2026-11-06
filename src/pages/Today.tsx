import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { searchRecipes } from '../domain/matching';
import { netCarbs, perServing, scaleNutrients } from '../domain/nutrition';
import { dayNutrients, isoDate } from '../domain/planner';
import { useStore } from '../store/AppStore';
import { MacroBar, Ring, Thumb } from '../ui/components';
import { Icon } from '../ui/Icon';
import { fmtPortion, greeting, MEAL_LABEL } from '../ui/labels';
import { RecipeCard } from '../ui/RecipeCard';

export function Today() {
  const { state, targets, diet, recipes, recipeById, lookup, assess, pantry } = useStore();
  const today = state.plan?.days.find((d) => d.date === isoDate(new Date()));
  const planned = today ? dayNutrients(today, recipeById, lookup) : null;

  const fromFridge = useMemo(
    () => (pantry.size ? searchRecipes(recipes, { pantry: { items: pantry, maxMissing: 1 }, hideNonCompliant: true }, { lookup, prefs: state.prefs, assess }).slice(0, 3) : []),
    [recipes, pantry, lookup, state.prefs, assess],
  );

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <div className="eyebrow">{greeting()}</div>
          <h1>Today</h1>
        </div>
        <span className="badge neutral"><Icon name="leaf" size={12} />{diet.name}</span>
      </header>

      {targets && (
        <section className="card">
          <div className="ring-wrap">
            <Ring value={planned?.kcal ?? 0} max={targets.kcal} label={String(Math.round(planned?.kcal ?? 0))} sub={`of ${targets.kcal} kcal`} />
            <div className="stack-sm" style={{ flex: 1, gap: 10 }}>
              <MacroBar label="Protein" value={planned?.protein ?? 0} target={targets.protein} color="var(--protein)" />
              <MacroBar label="Carbs" value={planned ? netCarbs(planned) : 0} target={targets.carbs} color="var(--carbs)" />
              <MacroBar label="Fat" value={planned?.fat ?? 0} target={targets.fat} color="var(--fat)" />
              <MacroBar label="Fibre" value={planned?.fiber ?? 0} target={targets.fiber} color="var(--fiber)" />
            </div>
          </div>
          {!today && <p className="subtle" style={{ marginTop: 12 }}>Planned intake shows here once you create a meal plan.</p>}
        </section>
      )}

      <section className="stack">
        <div className="section-title"><h2>Today's meals</h2><Link to="/plan">Week plan</Link></div>
        {today?.slots.length ? (
          <div className="card" style={{ padding: '4px 18px' }}>
            <div className="list">
              {today.slots.map((s, i) => {
                const r = recipeById(s.recipeId);
                if (!r) return null;
                const n = scaleNutrients(perServing(r, lookup), s.servings);
                return (
                  <Link key={i} to={`/recipes/${r.id}?servings=${s.servings}`} className="list-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ transform: 'scale(.7)', margin: -12 }}><Thumb title={r.title} /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="subtle">{MEAL_LABEL[s.mealType]} · {fmtPortion(s.servings)}</div>
                      <div style={{ fontWeight: 600 }}>{r.title}</div>
                    </div>
                    <span className="subtle">{Math.round(n.kcal)} kcal</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          <Link to="/plan" className="card soft row" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Icon name="sparkle" />
            <div style={{ flex: 1 }}><h3>Build my meal plan</h3><span className="subtle">A week of meals matched to your targets and tastes.</span></div>
          </Link>
        )}
      </section>

      <section className="grid-2">
        <QuickAction to="/fridge" icon="fridge" title="My fridge" sub={pantry.size ? `${pantry.size} ingredients` : 'Add what you have'} />
        <QuickAction to="/recipes?mode=fridge" icon="sparkle" title="Cook from fridge" sub="Recipes you can make now" />
        <QuickAction to="/builder" icon="edit" title="New recipe" sub="Build your own" />
        <QuickAction to="/grocery" icon="cart" title="Grocery list" sub={`${state.grocery.filter((g) => !g.checked).length} to buy`} />
      </section>

      {fromFridge.length > 0 && (
        <section className="stack">
          <div className="section-title"><h2>Cook with what you have</h2><Link to="/recipes?mode=fridge">See all</Link></div>
          {fromFridge.map((r) => <RecipeCard key={r.recipe.id} item={r} showPantry />)}
        </section>
      )}
    </div>
  );
}

function QuickAction({ to, icon, title, sub }: { to: string; icon: Parameters<typeof Icon>[0]['name']; title: string; sub: string }) {
  return (
    <Link to={to} className="card stack-sm" style={{ textDecoration: 'none', color: 'inherit', padding: 16 }}>
      <span style={{ color: 'var(--primary)' }}><Icon name={icon} /></span>
      <h3>{title}</h3>
      <span className="subtle">{sub}</span>
    </Link>
  );
}
