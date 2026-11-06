import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { pantryMatch, recipeFacets, FACET_LABEL } from '../domain/matching';
import { ingredientNutrients, perServing, recipeLines, scaleNutrients } from '../domain/nutrition';
import { useStore } from '../store/AppStore';
import { Empty, NutriGrid, NutritionTable, SourceLinks, Stepper, Thumb, VerdictBadge, toast } from '../ui/components';
import { Icon } from '../ui/Icon';
import { fmtGrams, MEAL_LABEL } from '../ui/labels';

export function RecipeDetail() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { state, dispatch, recipeById, lookup, assess, pantry, diet } = useStore();
  const recipe = recipeById(id);
  const [servings, setServings] = useState(() => Number(params.get('servings')) || 1);
  const [openIng, setOpenIng] = useState<string | null>(null);

  const data = useMemo(() => {
    if (!recipe) return null;
    const per = perServing(recipe, lookup);
    return {
      per,
      lines: recipeLines(recipe, lookup),
      compliance: assess(recipe),
      match: pantryMatch(recipe, pantry, lookup),
      facets: [...recipeFacets(recipe, lookup, per)],
    };
  }, [recipe, lookup, assess, pantry]);

  if (!recipe || !data) return <div className="page"><Empty icon="search" title="Recipe not found" action={<Link to="/recipes" className="btn">Browse recipes</Link>} /></div>;

  const factor = servings / recipe.servings;
  const n = scaleNutrients(data.per, servings);
  const isSaved = state.savedRecipeIds.includes(recipe.id);
  const missingCount = data.match.missing.length;

  const addMissing = () => {
    dispatch({ type: 'addToGrocery', demands: [{ recipe, servings }], lookup });
    toast(missingCount ? `Added ${missingCount} item${missingCount > 1 ? 's' : ''} to your grocery list` : 'You already have everything');
  };

  return (
    <div className="page">
      <div className="row-between">
        <button className="icon-btn" onClick={() => nav(-1)} aria-label="Back"><Icon name="back" /></button>
        <div className="row">
          {recipe.source === 'user' && <Link to={`/builder/${recipe.id}`} className="icon-btn" aria-label="Edit recipe"><Icon name="edit" size={18} /></Link>}
          <button className={`icon-btn${isSaved ? ' active' : ''}`} aria-label={isSaved ? 'Unsave' : 'Save'} aria-pressed={isSaved}
            onClick={() => { dispatch({ type: 'toggleSaved', id: recipe.id }); toast(isSaved ? 'Removed from saved' : 'Saved'); }}>
            <Icon name="heart" size={18} fill={isSaved} />
          </button>
        </div>
      </div>

      <header className="row" style={{ gap: 16, alignItems: 'flex-start' }}>
        <Thumb title={recipe.title} />
        <div className="stack-sm">
          <h1 style={{ fontSize: 26 }}>{recipe.title}</h1>
          <p className="muted">{recipe.summary}</p>
          <div className="row wrap" style={{ gap: 6 }}>
            <VerdictBadge verdict={data.compliance.verdict} />
            <span className="badge neutral"><Icon name="clock" size={12} />{recipe.minutes} min</span>
            {recipe.mealTypes.map((m) => <span key={m} className="badge neutral">{MEAL_LABEL[m]}</span>)}
          </div>
        </div>
      </header>

      <section className="card stack">
        <div className="row-between">
          <h3>Nutrition</h3>
          <Stepper value={servings} onChange={setServings} step={0.5} min={0.5} max={12} format={(v) => `${v} serv.`} />
        </div>
        <NutriGrid n={n} />
        <details>
          <summary className="link">Full nutrition facts</summary>
          <div style={{ marginTop: 8 }}><NutritionTable n={n} /></div>
          <p className="subtle" style={{ marginTop: 8 }}>Calculated from USDA FoodData Central values for each ingredient.</p>
        </details>
        {data.facets.length > 0 && <div className="chips">{data.facets.map((f) => <span key={f} className="badge neutral">{FACET_LABEL[f]}</span>)}</div>}
      </section>

      <section className="card stack">
        <div className="row-between">
          <h3>Ingredients</h3>
          <span className="subtle">{data.match.have.length}/{data.match.have.length + missingCount} in your fridge</span>
        </div>
        <div className="list">
          {data.lines.map(({ item, ingredient }) => {
            if (!ingredient) return null;
            const have = pantry.has(ingredient.id) || ingredient.staple;
            const grams = item.grams * factor;
            const unit = ingredient.units[0];
            const open = openIng === ingredient.id;
            const inn = ingredientNutrients(ingredient, grams);
            return (
              <div key={ingredient.id} className="list-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
                <button className="row" style={{ background: 'none', border: 0, padding: 0, textAlign: 'left', width: '100%' }} onClick={() => setOpenIng(open ? null : ingredient.id)} aria-expanded={open}>
                  <span className="dot" style={{ background: have ? 'var(--good)' : 'var(--accent)' }} title={have ? 'In your fridge' : 'Missing'} />
                  <span style={{ flex: 1 }}>{ingredient.name}{item.optional && <span className="subtle"> · optional</span>}</span>
                  <span className="subtle">
                    {fmtGrams(grams)}
                    {unit && grams >= 1 && grams >= unit.grams * 0.5 && ` · ≈ ${Math.round((grams / unit.grams) * 2) / 2} ${unit.label}`}
                  </span>
                </button>
                {open && (
                  <span className="subtle" style={{ paddingLeft: 16 }}>
                    {Math.round(inn.kcal)} kcal · P {inn.protein.toFixed(1)} g · C {inn.carbs.toFixed(1)} g · F {inn.fat.toFixed(1)} g · fibre {inn.fiber.toFixed(1)} g
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <button className="btn secondary block" onClick={addMissing}>
          <Icon name="cart" size={18} />{missingCount ? `Add ${missingCount} missing to grocery list` : 'You have everything'}
        </button>
      </section>

      <section className="card stack">
        <div className="row-between"><h3>Why it fits {diet.name}</h3><span className="badge neutral">{data.compliance.score}/100</span></div>
        <div className="stack">
          {data.compliance.reasons.map((r, i) => (
            <div key={i} className="reason">
              <span style={{ color: r.tone === 'positive' ? 'var(--good)' : r.tone === 'negative' ? 'var(--bad)' : 'var(--ink-3)' }}>
                <Icon name={r.tone === 'positive' ? 'check' : r.tone === 'negative' ? 'x' : 'info'} size={16} />
              </span>
              <div className="stack-sm" style={{ gap: 2 }}>
                <span>{r.text}</span>
                <SourceLinks ids={r.sources} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card stack">
        <h3>Method</h3>
        <ol className="steps">{recipe.steps.map((s, i) => <li key={i}><span>{s}</span></li>)}</ol>
      </section>
    </div>
  );
}
