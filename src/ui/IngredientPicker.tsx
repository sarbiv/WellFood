import { useMemo, useState } from 'react';
import { CATEGORY_LABEL, INGREDIENTS } from '../data/ingredients';
import type { Ingredient, IngredientCategory } from '../domain/types';
import { Chip } from './components';
import { Icon } from './Icon';

/**
 * Searchable, category-grouped multi-select. Used for the fridge, exclusions
 * and the recipe builder (single-pick mode via onPick).
 */
export function IngredientPicker({
  selected,
  onToggle,
  danger,
  hideStaples = true,
  placeholder = 'Search ingredients',
}: {
  selected: ReadonlySet<string>;
  onToggle: (ing: Ingredient) => void;
  danger?: boolean;
  hideStaples?: boolean;
  placeholder?: string;
}) {
  const [q, setQ] = useState('');
  const groups = useMemo(() => {
    const text = q.trim().toLowerCase();
    const map = new Map<IngredientCategory, Ingredient[]>();
    for (const ing of INGREDIENTS) {
      if (hideStaples && ing.staple) continue;
      if (text && !ing.name.toLowerCase().includes(text)) continue;
      map.set(ing.category, [...(map.get(ing.category) ?? []), ing]);
    }
    return [...map.entries()];
  }, [q, hideStaples]);

  return (
    <div className="stack">
      <div className="search">
        <Icon name="search" size={18} />
        <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
      </div>
      {groups.length === 0 && <p className="subtle">No matching ingredients.</p>}
      {groups.map(([cat, items]) => (
        <div key={cat} className="stack-sm">
          <span className="label">{CATEGORY_LABEL[cat]}</span>
          <div className="chips">
            {items.map((ing) => (
              <Chip key={ing.id} on={selected.has(ing.id)} danger={danger} onClick={() => onToggle(ing)}>
                {selected.has(ing.id) && <Icon name={danger ? 'x' : 'check'} size={14} />}
                {ing.name}
              </Chip>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
