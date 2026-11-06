import { useMemo, useState } from 'react';
import { CATEGORY_LABEL, INGREDIENT_BY_ID } from '../data/ingredients';
import { shoppingGrams } from '../domain/grocery';
import type { GroceryItem } from '../domain/types';
import { useStore } from '../store/AppStore';
import { Empty, PageHeader, toast } from '../ui/components';
import { Icon } from '../ui/Icon';
import { fmtGrams } from '../ui/labels';

export function Grocery() {
  const { state, dispatch, recipeById } = useStore();
  const [text, setText] = useState('');
  const items = state.grocery;
  const checked = items.filter((i) => i.checked).length;

  // Group by store section so the list follows a walk through the shop.
  const groups = useMemo(() => {
    const map = new Map<string, GroceryItem[]>();
    for (const item of items) {
      const cat = item.ingredientId ? CATEGORY_LABEL[INGREDIENT_BY_ID.get(item.ingredientId)?.category ?? 'pantry'] : 'Other';
      map.set(cat, [...(map.get(cat) ?? []), item]);
    }
    return [...map.entries()].map(([k, v]) => [k, v.sort((a, b) => Number(a.checked) - Number(b.checked))] as const);
  }, [items]);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: 'addGroceryManual', label: text });
    setText('');
  };

  return (
    <div className="page">
      <PageHeader eyebrow={items.length ? `${items.length - checked} to buy · ${checked} in cart` : 'Shopping'} title="Grocery list" />

      <form onSubmit={add} className="row">
        <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Add an item" aria-label="Add an item" style={{ borderRadius: 999 }} />
        <button className="btn" type="submit" disabled={!text.trim()} aria-label="Add"><Icon name="plus" size={18} /></button>
      </form>

      {items.length === 0 ? (
        <Empty icon="cart" title="Nothing to buy yet">Open a recipe or your meal plan and tap “Add missing to grocery list” — we skip what's already in your fridge.</Empty>
      ) : (
        <>
          {groups.map(([cat, list]) => (
            <section key={cat} className="card" style={{ padding: '12px 18px' }}>
              <span className="label">{cat}</span>
              <div className="list">
                {list.map((item) => (
                  <div key={item.id} className="list-item">
                    <button className={`check${item.checked ? ' on' : ''}`} onClick={() => dispatch({ type: 'toggleGrocery', id: item.id })} aria-label={`${item.checked ? 'Uncheck' : 'Check'} ${item.label}`} aria-pressed={item.checked}>
                      <Icon name="check" size={14} />
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className={item.checked ? 'done' : ''}>{item.label}</div>
                      {item.fromRecipes.length > 0 && (
                        <div className="subtle" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          for {item.fromRecipes.map((id) => recipeById(id)?.title ?? 'a recipe').join(', ')}
                        </div>
                      )}
                    </div>
                    {item.grams ? <span className="subtle">{fmtGrams(shoppingGrams(item.grams))}</span> : null}
                    <button className="icon-btn" style={{ width: 30, height: 30, border: 0 }} onClick={() => dispatch({ type: 'removeGrocery', id: item.id })} aria-label={`Remove ${item.label}`}><Icon name="x" size={14} /></button>
                  </div>
                ))}
              </div>
            </section>
          ))}
          <div className="stack-sm">
            {checked > 0 && (
              <button className="btn block" onClick={() => { dispatch({ type: 'moveCheckedToPantry' }); toast('Moved to your fridge'); }}>
                <Icon name="fridge" size={18} />Bought — move {checked} to my fridge
              </button>
            )}
            <button className="btn ghost" onClick={() => dispatch({ type: 'clearGrocery', onlyChecked: false })}>Clear list</button>
          </div>
        </>
      )}
    </div>
  );
}
