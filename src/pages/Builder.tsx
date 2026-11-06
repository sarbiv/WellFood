import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { INGREDIENTS } from '../data/ingredients';
import { assessRecipe } from '../domain/compliance';
import { perServing } from '../domain/nutrition';
import { MEAL_TYPES, TASTES, type Recipe, type RecipeIngredient } from '../domain/types';
import { useStore } from '../store/AppStore';
import { Chip, NutriGrid, PageHeader, Stepper, VerdictBadge, toast } from '../ui/components';
import { Icon } from '../ui/Icon';
import { MEAL_LABEL, TASTE_LABEL } from '../ui/labels';

const newId = () => `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

const blank = (): Recipe => ({
  id: newId(), title: '', summary: '', mealTypes: ['lunch'], tastes: [], servings: 2, minutes: 20,
  ingredients: [], steps: [''], source: 'user', createdAt: Date.now(),
});

export function Builder() {
  const { id } = useParams();
  const nav = useNavigate();
  const { state, dispatch, recipeById, lookup, diet } = useStore();
  const existing = id ? recipeById(id) : undefined;
  // Editing a seed recipe creates a personal copy rather than mutating the library.
  const [draft, setDraft] = useState<Recipe>(() =>
    existing ? (existing.source === 'user' ? existing : { ...existing, id: newId(), title: `${existing.title} (my version)`, source: 'user', createdAt: Date.now() }) : blank(),
  );
  const set = <K extends keyof Recipe>(k: K, v: Recipe[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const toggle = <T,>(list: T[], x: T) => (list.includes(x) ? list.filter((y) => y !== x) : [...list, x]);

  const per = useMemo(() => perServing(draft, lookup), [draft, lookup]);
  const compliance = useMemo(() => (draft.ingredients.length ? assessRecipe(draft, diet, lookup) : null), [draft, diet, lookup]);

  const updateLine = (i: number, patch: Partial<RecipeIngredient>) =>
    set('ingredients', draft.ingredients.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const valid = draft.title.trim() && draft.ingredients.length > 0 && draft.mealTypes.length > 0;
  const save = () => {
    if (!valid) return;
    dispatch({ type: 'upsertRecipe', recipe: { ...draft, title: draft.title.trim(), steps: draft.steps.map((s) => s.trim()).filter(Boolean) } });
    toast('Recipe saved');
    nav(`/recipes/${draft.id}`, { replace: true });
  };

  const isOwn = state.userRecipes.some((r) => r.id === draft.id);

  return (
    <div className="page">
      <PageHeader back eyebrow={isOwn ? 'Edit recipe' : 'Create'} title={isOwn ? draft.title || 'Recipe' : 'New recipe'} />

      <section className="card stack">
        <div className="field"><label htmlFor="title">Name</label><input id="title" className="input" value={draft.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Grandma's lentil soup" /></div>
        <div className="field"><label htmlFor="summary">Short description</label><input id="summary" className="input" value={draft.summary} onChange={(e) => set('summary', e.target.value)} placeholder="Optional" /></div>
        <div className="row-between"><span className="label">Servings</span><Stepper value={draft.servings} onChange={(v) => set('servings', v)} min={1} max={12} /></div>
        <div className="row-between"><span className="label">Time</span><Stepper value={draft.minutes} onChange={(v) => set('minutes', v)} step={5} min={5} max={240} format={(v) => `${v} min`} /></div>
        <div className="field"><span className="label">Meal</span><div className="chips">{MEAL_TYPES.map((m) => <Chip key={m} on={draft.mealTypes.includes(m)} onClick={() => set('mealTypes', toggle(draft.mealTypes, m))}>{MEAL_LABEL[m]}</Chip>)}</div></div>
        <div className="field"><span className="label">Taste</span><div className="chips">{TASTES.map((t) => <Chip key={t} on={draft.tastes.includes(t)} onClick={() => set('tastes', toggle(draft.tastes, t))}>{TASTE_LABEL[t]}</Chip>)}</div></div>
      </section>

      <section className="card stack">
        <h3>Ingredients</h3>
        {draft.ingredients.length === 0 && <p className="subtle">Add ingredients — nutrition is calculated automatically.</p>}
        <div className="list">
          {draft.ingredients.map((line, i) => {
            const ing = lookup(line.ingredientId);
            if (!ing) return null;
            return (
              <div key={line.ingredientId} className="list-item">
                <span style={{ flex: 1 }}>{ing.name}</span>
                <AmountInput grams={line.grams} units={ing.units} onChange={(grams) => updateLine(i, { grams })} />
                <button className="icon-btn" style={{ width: 32, height: 32 }} aria-label={`Remove ${ing.name}`} onClick={() => set('ingredients', draft.ingredients.filter((_, idx) => idx !== i))}><Icon name="x" size={14} /></button>
              </div>
            );
          })}
        </div>
        <IngredientSearch exclude={new Set(draft.ingredients.map((l) => l.ingredientId))}
          onPick={(ingId, grams) => set('ingredients', [...draft.ingredients, { ingredientId: ingId, grams }])} />
      </section>

      {draft.ingredients.length > 0 && (
        <section className="card stack">
          <div className="row-between"><h3>Per serving</h3>{compliance && <VerdictBadge verdict={compliance.verdict} />}</div>
          <NutriGrid n={per} />
          {compliance?.reasons.filter((r) => r.tone === 'negative').map((r, i) => <p key={i} className="subtle">• {r.text}</p>)}
        </section>
      )}

      <section className="card stack">
        <h3>Method</h3>
        {draft.steps.map((s, i) => (
          <div key={i} className="row" style={{ alignItems: 'flex-start' }}>
            <span className="badge neutral" style={{ marginTop: 12 }}>{i + 1}</span>
            <textarea className="input" style={{ minHeight: 60 }} value={s} placeholder="Describe this step" onChange={(e) => set('steps', draft.steps.map((x, idx) => (idx === i ? e.target.value : x)))} />
          </div>
        ))}
        <button className="btn ghost small" onClick={() => set('steps', [...draft.steps, ''])}><Icon name="plus" size={16} />Add step</button>
      </section>

      <div className="sticky-actions">
        {isOwn && (
          <button className="btn secondary" onClick={() => { if (confirm('Delete this recipe?')) { dispatch({ type: 'deleteRecipe', id: draft.id }); nav('/recipes', { replace: true }); } }}>
            <Icon name="trash" size={16} />
          </button>
        )}
        <button className="btn block" disabled={!valid} onClick={save}>Save recipe</button>
      </div>
    </div>
  );
}

/** Amount in grams or a household unit; always stored as grams. */
function AmountInput({ grams, units, onChange }: { grams: number; units: { label: string; grams: number }[]; onChange: (g: number) => void }) {
  const [unit, setUnit] = useState('g');
  const factor = unit === 'g' ? 1 : (units.find((u) => u.label === unit)?.grams ?? 1);
  const display = Math.round((grams / factor) * 100) / 100;
  return (
    <div className="row" style={{ gap: 4 }}>
      <input className="input" style={{ width: 72, height: 38, textAlign: 'right' }} inputMode="decimal" aria-label="Amount"
        value={display} onChange={(e) => { const v = Number(e.target.value); if (Number.isFinite(v) && v >= 0) onChange(v * factor); }} />
      <select className="input" style={{ width: 'auto', height: 38, padding: '0 8px' }} value={unit} onChange={(e) => setUnit(e.target.value)} aria-label="Unit">
        <option value="g">g</option>
        {units.map((u) => <option key={u.label} value={u.label}>{u.label}</option>)}
      </select>
    </div>
  );
}

function IngredientSearch({ exclude, onPick }: { exclude: ReadonlySet<string>; onPick: (id: string, grams: number) => void }) {
  const [q, setQ] = useState('');
  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return INGREDIENTS.filter((i) => !exclude.has(i.id) && i.name.toLowerCase().includes(t)).slice(0, 6);
  }, [q, exclude]);
  return (
    <div className="stack-sm">
      <div className="search"><Icon name="search" size={18} /><input className="input" placeholder="Add an ingredient" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Add an ingredient" /></div>
      {results.length > 0 && (
        <div className="card flat" style={{ padding: '4px 14px' }}>
          <div className="list">
            {results.map((i) => (
              <button key={i.id} className="list-item" style={{ background: 'none', border: 0, borderBottom: '1px solid var(--line)', textAlign: 'left', width: '100%' }}
                onClick={() => { onPick(i.id, i.units[0]?.grams ?? 100); setQ(''); }}>
                <Icon name="plus" size={16} /><span style={{ flex: 1 }}>{i.name}</span><span className="subtle">{i.per100g.kcal} kcal/100g</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
