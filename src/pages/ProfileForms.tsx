import { useState } from 'react';
import { DIETS } from '../domain/diets';
import { ACTIVITY_LABEL } from '../domain/nutrition';
import { MEAL_TYPES, TASTES, type ActivityLevel, type BodyProfile, type Goal, type Preferences, type Sex } from '../domain/types';
import { Chip, Segmented } from '../ui/components';
import { IngredientPicker } from '../ui/IngredientPicker';
import { GOAL_LABEL, MEAL_LABEL, RESTRICTIONS, restrictionActive, SEX_LABEL, TASTE_LABEL, toggleRestriction } from '../ui/labels';

/** Reusable form sections shared by onboarding and the profile page. */

export function DietPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <div className="stack">
      {DIETS.map((d) => (
        <button key={d.id} type="button" className={`option-card${d.id === value ? ' on' : ''}`} onClick={() => onChange(d.id)}>
          <strong>{d.name}</strong>
          <span className="muted small">{d.tagline}</span>
          <span className="subtle">For: {d.audience}</span>
        </button>
      ))}
    </div>
  );
}

export const DEFAULT_BODY: BodyProfile = { sex: 'female', ageYears: 35, heightCm: 165, weightKg: 70, activity: 'light', goal: 'maintain' };

export function BodyForm({ value, onChange }: { value: BodyProfile; onChange: (b: BodyProfile) => void }) {
  const set = <K extends keyof BodyProfile>(k: K, v: BodyProfile[K]) => onChange({ ...value, [k]: v });
  const num = (k: 'ageYears' | 'heightCm' | 'weightKg', label: string, unit: string, min: number, max: number) => (
    <NumberField label={`${label} (${unit})`} value={value[k]} min={min} max={max} onChange={(v) => set(k, v)} />
  );
  return (
    <div className="stack">
      <div className="field">
        <span className="label">Sex (used by the energy equation)</span>
        <Segmented<Sex> value={value.sex} onChange={(v) => set('sex', v)} options={(['female', 'male'] as Sex[]).map((s) => ({ value: s, label: SEX_LABEL[s] }))} />
      </div>
      <div className="grid-2">
        {num('ageYears', 'Age', 'years', 14, 100)}
        {num('heightCm', 'Height', 'cm', 120, 220)}
      </div>
      {num('weightKg', 'Weight', 'kg', 35, 300)}
      <div className="field">
        <label htmlFor="activity">Activity level</label>
        <select id="activity" className="input" value={value.activity} onChange={(e) => set('activity', e.target.value as ActivityLevel)}>
          {(Object.keys(ACTIVITY_LABEL) as ActivityLevel[]).map((a) => <option key={a} value={a}>{ACTIVITY_LABEL[a]}</option>)}
        </select>
      </div>
      <div className="field">
        <span className="label">Goal</span>
        <Segmented<Goal> value={value.goal} onChange={(v) => set('goal', v)} options={(['lose', 'maintain', 'gain'] as Goal[]).map((g) => ({ value: g, label: GOAL_LABEL[g] }))} />
      </div>
    </div>
  );
}

/** Number input that tolerates partial typing and clamps on blur. */
function NumberField({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  const [draft, setDraft] = useState(String(value));
  const id = label.replace(/\W+/g, '-').toLowerCase();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} className="input" inputMode="decimal" value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          const v = Number(e.target.value);
          if (Number.isFinite(v) && v >= min && v <= max) onChange(v);
        }}
        onBlur={() => {
          const v = Math.min(max, Math.max(min, Number(draft) || value));
          setDraft(String(v));
          onChange(v);
        }} />
    </div>
  );
}

export function PreferencesForm({ value, onChange, showExclusions = true }: { value: Preferences; onChange: (p: Preferences) => void; showExclusions?: boolean }) {
  const set = <K extends keyof Preferences>(k: K, v: Preferences[K]) => onChange({ ...value, [k]: v });
  const toggle = <T,>(list: T[], x: T) => (list.includes(x) ? list.filter((y) => y !== x) : [...list, x]);
  const excluded = new Set(value.excludedIngredients);
  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="field">
        <span className="label">Meals per day</span>
        <Segmented<3 | 4> value={value.mealsPerDay} onChange={(v) => set('mealsPerDay', v)} options={[{ value: 3, label: '3 meals' }, { value: 4, label: '3 meals + snack' }]} />
      </div>
      <div className="field">
        <span className="label">Which meals do you want ideas for?</span>
        <div className="chips">
          {MEAL_TYPES.map((m) => <Chip key={m} on={value.mealTypes.includes(m)} onClick={() => set('mealTypes', toggle(value.mealTypes, m))}>{MEAL_LABEL[m]}</Chip>)}
        </div>
      </div>
      <div className="field">
        <span className="label">Flavours you love</span>
        <div className="chips">
          {TASTES.map((t) => <Chip key={t} on={value.tastes.includes(t)} onClick={() => set('tastes', toggle(value.tastes, t))}>{TASTE_LABEL[t]}</Chip>)}
        </div>
      </div>
      <div className="field">
        <span className="label">Dietary restrictions</span>
        <div className="chips">
          {RESTRICTIONS.map((r) => (
            <Chip key={r.id} on={restrictionActive(value.excludedFlags, r)} onClick={() => set('excludedFlags', toggleRestriction(value.excludedFlags, r))}>{r.label}</Chip>
          ))}
        </div>
      </div>
      {showExclusions && (
        <div className="field">
          <span className="label">Never show me recipes with… {excluded.size > 0 && <span className="subtle">({excluded.size} excluded)</span>}</span>
          <IngredientPicker danger selected={excluded} placeholder="e.g. tomato" onToggle={(ing) => set('excludedIngredients', toggle(value.excludedIngredients, ing.id))} />
        </div>
      )}
    </div>
  );
}
