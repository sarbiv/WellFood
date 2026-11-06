import { DIETS } from '../domain/diets';
import { SOURCES, type Source } from '../domain/evidence';
import { useStore } from '../store/AppStore';
import { PageHeader, SourceLinks } from '../ui/components';
import { Icon } from '../ui/Icon';

const KIND_LABEL: Record<Source['kind'], string> = {
  guideline: 'Guideline', rct: 'Randomised trial', cohort: 'Cohort study', review: 'Review', pilot: 'Pilot study', equation: 'Validated equation', database: 'Reference database',
};

export function Science() {
  const { diet } = useStore();
  const ordered = [diet, ...DIETS.filter((d) => d.id !== diet.id)];
  return (
    <div className="page">
      <PageHeader back eyebrow="Transparency" title="The science" />
      <p className="muted">WellFood doesn't guess. Every recommendation comes from a rule, and every rule cites the research it's based on. Where evidence is still early, we say so.</p>

      <section className="card stack">
        <h3>How your targets are calculated</h3>
        <ul className="stack-sm small" style={{ margin: 0, paddingLeft: 18 }}>
          <li>Resting energy: Mifflin–St Jeor equation. <SourceLinks ids={['mifflin']} /></li>
          <li>Daily energy: resting × activity factor (1.2–1.9); weight loss uses a ~500 kcal deficit, never below 1200/1500 kcal.</li>
          <li>Protein: 1.0–1.6 g/kg depending on goal, using adjusted body weight when BMI ≥ 30. <SourceLinks ids={['leidy2015']} /></li>
          <li>Fibre: at least 25 g/day. <SourceLinks ids={['efsaFiber2010']} /> Added sugar: diet-specific cap. <SourceLinks ids={['whoSugar2015']} /></li>
          <li>Nutrient values per ingredient: <SourceLinks ids={['fdc']} />. Glycemic bands: <SourceLinks ids={['atkinson2021']} /></li>
        </ul>
      </section>

      {ordered.map((d) => (
        <details key={d.id} className="card" open={d.id === diet.id}>
          <summary className="row-between">
            <div><h3>{d.name}{d.id === diet.id && <span className="badge great" style={{ marginLeft: 8 }}>Your diet</span>}</h3><span className="subtle">{d.tagline}</span></div>
            <Icon name="plus" size={16} />
          </summary>
          <div className="stack" style={{ marginTop: 12 }}>
            <p className="small">{d.description}</p>
            <p className="small muted"><strong>Evidence:</strong> {d.evidenceNote}</p>
            <div className="stack-sm">
              {d.rules.map((r) => (
                <div key={r.id} className="reason">
                  <span style={{ color: r.kind === 'favor' ? 'var(--good)' : r.kind === 'avoid' ? 'var(--bad)' : 'var(--warn)' }}>
                    <Icon name={r.kind === 'favor' ? 'check' : r.kind === 'avoid' ? 'x' : 'minus'} size={16} />
                  </span>
                  <div className="stack-sm" style={{ gap: 0 }}>
                    <span className="small"><strong>{r.kind === 'favor' ? 'Favour' : r.kind === 'avoid' ? 'Avoid' : 'Limit'}:</strong> {r.label} — {r.why}</span>
                    <SourceLinks ids={r.sources} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </details>
      ))}

      <section className="stack">
        <h2>References</h2>
        {Object.values(SOURCES).map((s) => (
          <a key={s.id} href={s.url} target="_blank" rel="noreferrer" className="card stack-sm" style={{ textDecoration: 'none', color: 'inherit' }}>
            <span className="badge neutral" style={{ alignSelf: 'flex-start' }}>{KIND_LABEL[s.kind]}</span>
            <strong className="small">{s.title}</strong>
            <span className="subtle">{s.authors} · {s.venue} · {s.year}</span>
            <span className="small muted">{s.takeaway}</span>
          </a>
        ))}
      </section>

      <p className="disclaimer">Educational information, not medical advice. Lipedema is a medical condition — work with your doctor, dietitian and lymphoedema therapist.</p>
    </div>
  );
}
