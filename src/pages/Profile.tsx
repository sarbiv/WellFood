import { useState } from 'react';
import { Link } from 'react-router-dom';
import { bmi } from '../domain/nutrition';
import { useStore } from '../store/AppStore';
import { PageHeader, toast } from '../ui/components';
import { Icon } from '../ui/Icon';
import { BodyForm, DEFAULT_BODY, DietPicker, PreferencesForm } from './ProfileForms';

type Section = 'body' | 'diet' | 'prefs' | null;

export function Profile() {
  const { state, dispatch, targets, diet } = useStore();
  const [open, setOpen] = useState<Section>(null);
  const body = state.body ?? DEFAULT_BODY;

  const section = (id: Exclude<Section, null>, title: string, summary: string, content: React.ReactNode) => (
    <div className="card">
      <button className="row-between" style={{ width: '100%', background: 'none', border: 0, padding: 0, textAlign: 'left' }} onClick={() => setOpen(open === id ? null : id)} aria-expanded={open === id}>
        <div className="stack-sm" style={{ gap: 2 }}>
          <h3>{title}</h3>
          <span className="subtle">{summary}</span>
        </div>
        <Icon name={open === id ? 'minus' : 'edit'} size={18} />
      </button>
      {open === id && <div style={{ marginTop: 16 }}>{content}</div>}
    </div>
  );

  return (
    <div className="page">
      <PageHeader eyebrow="Your profile" title="Settings" />

      {targets && (
        <div className="card soft stack-sm">
          <div className="row-between"><span className="muted">Daily target</span><strong style={{ fontSize: 20 }}>{targets.kcal} kcal</strong></div>
          <p className="subtle">Resting {targets.bmr} kcal · with activity {targets.tdee} kcal · BMI {bmi(body).toFixed(1)}</p>
          <p className="subtle">Protein {targets.protein} g · Carbs {targets.carbs} g · Fat {targets.fat} g · Fibre ≥ {targets.fiber} g · Added sugar ≤ {targets.addedSugarMax} g</p>
          {targets.notes.map((n) => <p key={n} className="subtle">• {n}</p>)}
        </div>
      )}

      {section('diet', 'Diet', diet.name, <DietPicker value={state.prefs.dietId} onChange={(dietId) => dispatch({ type: 'setPrefs', prefs: { dietId } })} />)}
      {section('body', 'Measurements', `${body.heightCm} cm · ${body.weightKg} kg · ${body.ageYears} y`, <BodyForm value={body} onChange={(b) => dispatch({ type: 'setBody', body: b })} />)}
      {section('prefs', 'Preferences', `${state.prefs.excludedIngredients.length} excluded ingredients · ${state.prefs.excludedFlags.length ? 'restrictions on' : 'no restrictions'}`,
        <PreferencesForm value={state.prefs} onChange={(p) => dispatch({ type: 'setPrefs', prefs: p })} />)}

      <Link to="/science" className="card row-between" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="row"><Icon name="book2" /><div><h3>The science</h3><span className="subtle">Every rule and the research behind it</span></div></div>
        <Icon name="chevron" size={16} />
      </Link>

      <button className="btn ghost" onClick={() => {
        if (confirm('Erase all your data on this device?')) { dispatch({ type: 'reset' }); toast('Data cleared'); }
      }}><Icon name="trash" size={16} />Reset app data</button>

      <p className="disclaimer">
        WellFood provides educational nutrition information based on published research and USDA nutrient data. It is not medical advice and does not replace your doctor, dietitian or lymphoedema therapist. Talk to them before major diet changes — especially ketogenic diets if you take medication.
      </p>
    </div>
  );
}
