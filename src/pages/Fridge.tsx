import { Link } from 'react-router-dom';
import { INGREDIENT_BY_ID } from '../data/ingredients';
import { useStore } from '../store/AppStore';
import { Chip, PageHeader } from '../ui/components';
import { Icon } from '../ui/Icon';
import { IngredientPicker } from '../ui/IngredientPicker';

export function Fridge() {
  const { state, dispatch, pantry } = useStore();

  return (
    <div className="page">
      <PageHeader back eyebrow="What you have" title="My fridge" action={
        pantry.size > 0 ? <button className="link" onClick={() => dispatch({ type: 'setPantry', ids: [] })}>Clear</button> : undefined
      } />

      {pantry.size > 0 && (
        <div className="card stack-sm">
          <span className="label">In your fridge & pantry ({pantry.size})</span>
          <div className="chips">
            {state.pantry.map((id) => (
              <Chip key={id} on onClick={() => dispatch({ type: 'togglePantry', id })}>
                {INGREDIENT_BY_ID.get(id)?.name ?? id}<Icon name="x" size={14} />
              </Chip>
            ))}
          </div>
        </div>
      )}

      <p className="subtle">Salt, pepper, water and common dried spices are assumed — no need to add them.</p>
      <IngredientPicker selected={pantry} onToggle={(ing) => dispatch({ type: 'togglePantry', id: ing.id })} />

      {pantry.size > 0 && (
        <div className="sticky-actions">
          <Link to="/recipes?mode=fridge" className="btn block"><Icon name="sparkle" size={18} />Find recipes</Link>
        </div>
      )}
    </div>
  );
}
