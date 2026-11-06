import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDiet } from '../domain/diets';
import { dailyTargets } from '../domain/nutrition';
import type { BodyProfile, Preferences } from '../domain/types';
import { useStore } from '../store/AppStore';
import { Icon } from '../ui/Icon';
import { BodyForm, DEFAULT_BODY, DietPicker, PreferencesForm } from './ProfileForms';

const STEPS = ['Your diet', 'About you', 'Your tastes'] as const;

export function Onboarding() {
  const { state, dispatch } = useStore();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [body, setBody] = useState<BodyProfile>(state.body ?? DEFAULT_BODY);
  const [prefs, setPrefs] = useState<Preferences>(state.prefs);

  const diet = getDiet(prefs.dietId);
  const last = step === STEPS.length - 1;

  const finish = () => {
    dispatch({ type: 'completeOnboarding', body, prefs });
    nav('/', { replace: true });
  };

  return (
    <div className="page">
      <div className="row-between">
        <div className="progress-dots">{STEPS.map((s, i) => <i key={s} className={i <= step ? 'on' : ''} />)}</div>
        <span className="subtle">Step {step + 1} of {STEPS.length}</span>
      </div>

      {step === 0 && (
        <>
          <header className="stack-sm">
            <span className="row" style={{ color: 'var(--primary)' }}><Icon name="leaf" /> WellFood</span>
            <h1>Food that works with your body</h1>
            <p className="muted">Pick the eating pattern you follow. Every recommendation in the app is tied to published research — you can always see why.</p>
          </header>
          <DietPicker value={prefs.dietId} onChange={(dietId) => setPrefs({ ...prefs, dietId })} />
          <div className="card soft small">{diet.evidenceNote}</div>
        </>
      )}

      {step === 1 && (
        <>
          <header className="stack-sm">
            <h1>A little about you</h1>
            <p className="muted">Used to estimate your daily energy needs with the Mifflin–St Jeor equation. Stored only on this device.</p>
          </header>
          <BodyForm value={body} onChange={setBody} />
          <TargetsPreview body={body} dietId={prefs.dietId} />
        </>
      )}

      {step === 2 && (
        <>
          <header className="stack-sm">
            <h1>What do you enjoy?</h1>
            <p className="muted">We'll prioritise these — and never show what you exclude.</p>
          </header>
          <PreferencesForm value={prefs} onChange={setPrefs} />
        </>
      )}

      <div className="sticky-actions" style={{ bottom: 16 }}>
        {step > 0 && <button className="btn secondary" onClick={() => setStep(step - 1)}>Back</button>}
        <button className="btn block" onClick={() => (last ? finish() : setStep(step + 1))}>{last ? 'Start cooking' : 'Continue'}</button>
      </div>
    </div>
  );
}

function TargetsPreview({ body, dietId }: { body: BodyProfile; dietId: string }) {
  const t = dailyTargets(body, getDiet(dietId));
  return (
    <div className="card soft">
      <div className="row-between">
        <span className="muted">Your daily target</span>
        <strong style={{ fontSize: 20 }}>{t.kcal} kcal</strong>
      </div>
      <p className="subtle">Protein {t.protein} g · Carbs {t.carbs} g · Fat {t.fat} g · Fibre ≥ {t.fiber} g</p>
    </div>
  );
}
