import { Link } from 'react-router-dom';
import { netCarbs, perServing, scaleNutrients } from '../domain/nutrition';
import { dayNutrients, fitPortion, generatePlan, isoDate } from '../domain/planner';
import { MEAL_SHARE } from '../domain/nutrition';
import { violatesRestrictions } from '../domain/matching';
import type { MealPlanDay, MealPlanSlot } from '../domain/types';
import { useStore } from '../store/AppStore';
import { Empty, PageHeader, toast } from '../ui/components';
import { Icon } from '../ui/Icon';
import { fmtPortion, MEAL_LABEL } from '../ui/labels';

const dayLabel = (iso: string) => {
  const d = new Date(`${iso}T12:00:00`);
  return iso === isoDate(new Date()) ? 'Today' : d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' });
};

export function Plan() {
  const { state, dispatch, targets, recipes, recipeById, lookup, assess, pantry } = useStore();
  const plan = state.plan;

  if (!targets) {
    return <div className="page"><Empty icon="user" title="Add your measurements" action={<Link to="/welcome" className="btn">Set up profile</Link>}>We need them to size your meals.</Empty></div>;
  }

  const create = () => {
    dispatch({
      type: 'setPlan',
      plan: generatePlan({ recipes, targets, prefs: state.prefs, lookup, assess, pantry, startDate: new Date(), days: 7 }),
    });
    toast('New week planned');
  };

  /** Swap one meal for the next-best alternative not already used that day. */
  const swap = (day: MealPlanDay, index: number) => {
    const slot = day.slots[index] as MealPlanSlot;
    const used = new Set(day.slots.map((s) => s.recipeId));
    const target = targets.kcal * (MEAL_SHARE[state.prefs.mealsPerDay][slot.mealType] ?? 0.3);
    const options = recipes.filter((r) => r.mealTypes.includes(slot.mealType) && !used.has(r.id) && !violatesRestrictions(r, state.prefs, lookup) && assess(r).verdict !== 'avoid');
    if (!options.length) return toast('No other options for this meal');
    const pick = options[Math.floor(Math.random() * Math.min(options.length, 6))] ?? options[0]!;
    dispatch({ type: 'replaceSlot', date: day.date, index, slot: { ...slot, recipeId: pick.id, servings: fitPortion(perServing(pick, lookup).kcal, target) } });
  };

  const addWeekToGrocery = () => {
    if (!plan) return;
    const demand = new Map<string, number>();
    for (const d of plan.days) for (const s of d.slots) demand.set(s.recipeId, (demand.get(s.recipeId) ?? 0) + s.servings);
    const demands = [...demand.entries()].flatMap(([id, servings]) => { const recipe = recipeById(id); return recipe ? [{ recipe, servings }] : []; });
    dispatch({ type: 'addToGrocery', demands, lookup });
    toast('Grocery list updated with everything you’re missing');
  };

  return (
    <div className="page">
      <PageHeader eyebrow={`${targets.kcal} kcal · ${targets.protein} g protein per day`} title="Meal plan"
        action={plan && <button className="btn secondary small" onClick={create}><Icon name="refresh" size={16} />New week</button>} />

      {!plan ? (
        <Empty icon="calendar" title="Plan your week in one tap" action={<button className="btn" onClick={create}><Icon name="sparkle" size={18} />Create my plan</button>}>
          Meals matched to your diet, calorie target, tastes and what's in your fridge. Portions are sized to fit.
        </Empty>
      ) : (
        <>
          <button className="btn secondary block" onClick={addWeekToGrocery}><Icon name="cart" size={18} />Add missing ingredients to grocery list</button>
          {plan.days.map((day) => {
            const n = dayNutrients(day, recipeById, lookup);
            const diff = Math.round(n.kcal - targets.kcal);
            return (
              <section key={day.date} className="card stack-sm">
                <div className="row-between">
                  <h3>{dayLabel(day.date)}</h3>
                  <span className="subtle">{Math.round(n.kcal)} kcal <span style={{ color: Math.abs(diff) > targets.kcal * 0.1 ? 'var(--warn)' : 'var(--good)' }}>({diff >= 0 ? '+' : ''}{diff})</span></span>
                </div>
                <span className="subtle">P {Math.round(n.protein)} g · net C {Math.round(netCarbs(n))} g · F {Math.round(n.fat)} g · fibre {Math.round(n.fiber)} g</span>
                <div className="list">
                  {day.slots.map((s, i) => {
                    const r = recipeById(s.recipeId);
                    if (!r) return null;
                    const kcal = scaleNutrients(perServing(r, lookup), s.servings).kcal;
                    return (
                      <div key={i} className="list-item">
                        <Link to={`/recipes/${r.id}?servings=${s.servings}`} style={{ flex: 1, minWidth: 0, color: 'inherit', textDecoration: 'none' }}>
                          <div className="subtle">{MEAL_LABEL[s.mealType]} · {fmtPortion(s.servings)} · {Math.round(kcal)} kcal</div>
                          <div style={{ fontWeight: 500 }}>{r.title}</div>
                        </Link>
                        <button className="icon-btn" style={{ width: 34, height: 34 }} onClick={() => swap(day, i)} aria-label={`Swap ${r.title}`}><Icon name="refresh" size={16} /></button>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
          <button className="btn ghost" onClick={() => dispatch({ type: 'setPlan', plan: null })}>Clear plan</button>
        </>
      )}
    </div>
  );
}
