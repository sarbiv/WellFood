import { Link } from 'react-router-dom';
import type { RankedRecipe } from '../domain/matching';
import { netCarbs } from '../domain/nutrition';
import { Icon } from './Icon';
import { Thumb, VerdictBadge } from './components';

export function RecipeCard({ item, showPantry }: { item: RankedRecipe; showPantry?: boolean }) {
  const { recipe, nutrients, compliance, pantry } = item;
  return (
    <Link to={`/recipes/${recipe.id}`} className="card recipe-card">
      <Thumb title={recipe.title} />
      <div className="body">
        <div className="row-between" style={{ alignItems: 'flex-start' }}>
          <span className="title">{recipe.title}</span>
        </div>
        <div className="meta">
          <span className="row" style={{ gap: 4 }}><Icon name="flame" size={14} />{Math.round(nutrients.kcal)} kcal</span>
          <span className="row" style={{ gap: 4 }}><Icon name="clock" size={14} />{recipe.minutes} min</span>
          <span>{Math.round(nutrients.protein)}g protein · {Math.round(netCarbs(nutrients))}g net carbs</span>
        </div>
        <div className="row wrap" style={{ gap: 6, marginTop: 'auto' }}>
          <VerdictBadge verdict={compliance.verdict} />
          {showPantry && pantry && (
            <span className={`badge ${pantry.missing.length === 0 ? 'great' : 'accent'}`}>
              {pantry.missing.length === 0 ? 'You have everything' : `Missing ${pantry.missing.length}`}
            </span>
          )}
          {recipe.source === 'user' && <span className="badge neutral">My recipe</span>}
        </div>
      </div>
    </Link>
  );
}
