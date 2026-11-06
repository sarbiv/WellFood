import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FACET_LABEL, searchRecipes, type Facet } from '../domain/matching';
import { MEAL_TYPES, TASTES, type MealType, type Taste } from '../domain/types';
import { useStore } from '../store/AppStore';
import { Chip, Empty, PageHeader, Segmented } from '../ui/components';
import { Icon } from '../ui/Icon';
import { MEAL_LABEL, TASTE_LABEL } from '../ui/labels';
import { RecipeCard } from '../ui/RecipeCard';

type Mode = 'all' | 'fridge' | 'saved';
const FACETS = Object.keys(FACET_LABEL) as Facet[];

export function Recipes() {
  const { state, recipes, lookup, assess, pantry } = useStore();
  const [params, setParams] = useSearchParams();
  const mode = (params.get('mode') as Mode) || 'all';
  const setMode = (m: Mode) => setParams(m === 'all' ? {} : { mode: m }, { replace: true });

  const [text, setText] = useState('');
  const [meal, setMeal] = useState<MealType | undefined>();
  const [taste, setTaste] = useState<Taste | undefined>();
  const [facets, setFacets] = useState<Facet[]>([]);
  const [maxMissing, setMaxMissing] = useState(2);
  const [hideNonCompliant, setHide] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const saved = useMemo(() => new Set(state.savedRecipeIds), [state.savedRecipeIds]);
  const results = useMemo(
    () =>
      searchRecipes(
        recipes,
        {
          text,
          mealType: meal,
          taste,
          facets,
          hideNonCompliant,
          ids: mode === 'saved' ? saved : undefined,
          pantry: mode === 'fridge' ? { items: pantry, maxMissing } : undefined,
        },
        { lookup, prefs: state.prefs, assess },
      ),
    [recipes, text, meal, taste, facets, hideNonCompliant, mode, saved, pantry, maxMissing, lookup, state.prefs, assess],
  );

  const activeFilters = (meal ? 1 : 0) + (taste ? 1 : 0) + facets.length;

  return (
    <div className="page">
      <PageHeader eyebrow="Discover" title="Recipes" action={<Link to="/builder" className="btn small"><Icon name="plus" size={16} />New</Link>} />

      <Segmented<Mode> value={mode} onChange={setMode} options={[{ value: 'all', label: 'All' }, { value: 'fridge', label: 'From my fridge' }, { value: 'saved', label: 'Saved' }]} />

      <div className="row">
        <div className="search" style={{ flex: 1 }}>
          <Icon name="search" size={18} />
          <input className="input" placeholder="Search recipes or ingredients" value={text} onChange={(e) => setText(e.target.value)} aria-label="Search recipes" />
        </div>
        <button className={`icon-btn${showFilters || activeFilters ? ' active' : ''}`} onClick={() => setShowFilters(!showFilters)} aria-label="Filters" style={{ width: 46, height: 46 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 6h16M7 12h10M10 18h4" /></svg>
        </button>
      </div>

      <div className="chips scroll">
        <Chip on={!meal} onClick={() => setMeal(undefined)}>Any meal</Chip>
        {MEAL_TYPES.map((m) => <Chip key={m} on={meal === m} onClick={() => setMeal(meal === m ? undefined : m)}>{MEAL_LABEL[m]}</Chip>)}
      </div>

      {showFilters && (
        <div className="card stack">
          <div className="field">
            <span className="label">Taste</span>
            <div className="chips">{TASTES.map((t) => <Chip key={t} on={taste === t} onClick={() => setTaste(taste === t ? undefined : t)}>{TASTE_LABEL[t]}</Chip>)}</div>
          </div>
          <div className="field">
            <span className="label">Category</span>
            <div className="chips">{FACETS.map((f) => <Chip key={f} on={facets.includes(f)} onClick={() => setFacets(facets.includes(f) ? facets.filter((x) => x !== f) : [...facets, f])}>{FACET_LABEL[f]}</Chip>)}</div>
          </div>
          <label className="row small"><input type="checkbox" checked={hideNonCompliant} onChange={(e) => setHide(e.target.checked)} />Hide recipes that don't fit my diet</label>
        </div>
      )}

      {mode === 'fridge' && (
        <div className="card soft stack-sm">
          <div className="row-between">
            <span className="small"><strong>{pantry.size}</strong> ingredients in your fridge</span>
            <Link to="/fridge" className="link">Edit</Link>
          </div>
          <div className="row-between">
            <span className="small muted">Extra items I'm OK buying</span>
            <Segmented<number> value={maxMissing} onChange={setMaxMissing} options={[0, 1, 2, 4].map((v) => ({ value: v, label: v === 0 ? 'None' : `≤ ${v}` }))} />
          </div>
        </div>
      )}

      <div className="stack">
        {results.map((r) => <RecipeCard key={r.recipe.id} item={r} showPantry={mode === 'fridge'} />)}
        {results.length === 0 && (
          mode === 'fridge' && pantry.size === 0 ? (
            <Empty icon="fridge" title="Your fridge is empty" action={<Link to="/fridge" className="btn">Add ingredients</Link>}>Tell us what you have and we'll find recipes that fit your diet.</Empty>
          ) : mode === 'saved' ? (
            <Empty icon="heart" title="No saved recipes yet">Tap the heart on any recipe to keep it here.</Empty>
          ) : (
            <Empty icon="search" title="Nothing matches">Try fewer filters{mode === 'fridge' ? ' or allow a few extra ingredients' : ''}.</Empty>
          )
        )}
      </div>
    </div>
  );
}
