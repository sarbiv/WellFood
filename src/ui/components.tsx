import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { VERDICT_LABEL, type Verdict } from '../domain/compliance';
import { getSource, type SourceId } from '../domain/evidence';
import { energySplit, netCarbs, round } from '../domain/nutrition';
import type { Nutrients } from '../domain/types';
import { Icon, type IconName } from './Icon';

export function PageHeader({ eyebrow, title, action, back }: { eyebrow?: string; title: string; action?: ReactNode; back?: boolean }) {
  const nav = useNavigate();
  return (
    <header className="stack-sm">
      {back && (
        <button className="icon-btn" onClick={() => nav(-1)} aria-label="Back">
          <Icon name="back" />
        </button>
      )}
      <div className="page-header">
        <div>
          {eyebrow && <div className="eyebrow">{eyebrow}</div>}
          <h1>{title}</h1>
        </div>
        {action}
      </div>
    </header>
  );
}

export function Chip({ on, onClick, children, danger }: { on?: boolean; onClick?: () => void; children: ReactNode; danger?: boolean }) {
  return (
    <button type="button" className={`chip${on ? ' on' : ''}${danger ? ' danger' : ''}`} aria-pressed={!!on} onClick={onClick}>
      {children}
    </button>
  );
}

export function Segmented<T extends string | number>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="segmented" role="radiogroup">
      {options.map((o) => (
        <button key={String(o.value)} type="button" role="radio" aria-checked={o.value === value} className={o.value === value ? 'on' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Stepper({ value, onChange, step = 1, min = step, max = 99, format = String }: { value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number; format?: (v: number) => string }) {
  return (
    <div className="stepper">
      <button type="button" aria-label="Decrease" onClick={() => onChange(Math.max(min, round(value - step, 2)))}><Icon name="minus" size={16} /></button>
      <span>{format(value)}</span>
      <button type="button" aria-label="Increase" onClick={() => onChange(Math.min(max, round(value + step, 2)))}><Icon name="plus" size={16} /></button>
    </div>
  );
}

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  return <span className={`badge ${verdict}`}>{verdict === 'avoid' ? <Icon name="x" size={12} /> : <Icon name="leaf" size={12} />}{VERDICT_LABEL[verdict]}</span>;
}

export function Empty({ icon, title, children, action }: { icon: IconName; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      <div className="icon-circle"><Icon name={icon} size={24} /></div>
      <h2>{title}</h2>
      {children && <p className="muted">{children}</p>}
      {action}
    </div>
  );
}

/** Calorie progress ring. */
export function Ring({ value, max, size = 112, label, sub }: { value: number; max: number; size?: number; label: string; sub: string }) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--surface-2)" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--primary)" strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: 'stroke-dashoffset .4s ease' }} />
      </svg>
      <div className="ring-label"><div><strong>{label}</strong><small>{sub}</small></div></div>
    </div>
  );
}

export function MacroBar({ label, value, target, color, unit = 'g' }: { label: string; value: number; target?: number; color: string; unit?: string }) {
  const pct = target ? Math.min(100, (value / target) * 100) : 100;
  return (
    <div className="macro">
      <span className="muted">{label}</span>
      <div className="bar"><i style={{ width: `${pct}%`, background: color }} /></div>
      <span>{Math.round(value)}{target ? ` / ${target}` : ''}{unit}</span>
    </div>
  );
}

/** Compact four-up summary used on cards and detail pages. */
export function NutriGrid({ n }: { n: Nutrients }) {
  return (
    <div className="nutri-grid">
      <div><strong>{Math.round(n.kcal)}</strong><span>kcal</span></div>
      <div><strong>{Math.round(n.protein)}g</strong><span>protein</span></div>
      <div><strong>{Math.round(netCarbs(n))}g</strong><span>net carbs</span></div>
      <div><strong>{Math.round(n.fat)}g</strong><span>fat</span></div>
    </div>
  );
}

/** Full label-style table. */
export function NutritionTable({ n }: { n: Nutrients }) {
  const split = energySplit(n);
  const rows: [string, string, boolean?][] = [
    ['Energy', `${Math.round(n.kcal)} kcal`],
    ['Protein', `${round(n.protein, 1)} g · ${Math.round(split.protein * 100)}%`],
    ['Carbohydrate', `${round(n.carbs, 1)} g · ${Math.round(split.carbs * 100)}%`],
    ['Fibre', `${round(n.fiber, 1)} g`, true],
    ['Sugars', `${round(n.sugar, 1)} g`, true],
    ['of which added', `${round(n.addedSugar, 1)} g`, true],
    ['Net carbs', `${round(netCarbs(n), 1)} g`, true],
    ['Fat', `${round(n.fat, 1)} g · ${Math.round(split.fat * 100)}%`],
    ['Saturated', `${round(n.satFat, 1)} g`, true],
    ['Sodium', `${Math.round(n.sodium)} mg`],
  ];
  return (
    <table className="table">
      <tbody>
        {rows.map(([k, v, sub]) => (
          <tr key={k} className={sub ? 'sub' : ''}><td>{k}</td><td>{v}</td></tr>
        ))}
      </tbody>
    </table>
  );
}

export function SourceLinks({ ids }: { ids: SourceId[] }) {
  const unique = Array.from(new Set(ids));
  return (
    <span className="subtle">
      {unique.map((id, i) => {
        const s = getSource(id);
        return (
          <span key={id}>
            {i > 0 && ' · '}
            <a href={s.url} target="_blank" rel="noreferrer">{s.authors.split(',')[0]} {s.year}</a>
          </span>
        );
      })}
    </span>
  );
}

/** Consistent, pleasant placeholder "image": initial on a tint derived from the title. */
const TINTS = ['#e3ece5', '#f6e8dd', '#e6ecf3', '#efe6ef', '#f1eedf', '#e2efec'];
export function Thumb({ title }: { title: string }) {
  const h = [...title].reduce((a, ch) => a + ch.charCodeAt(0), 0);
  return <div className="thumb" style={{ background: TINTS[h % TINTS.length] }}>{title.charAt(0)}</div>;
}

export function IconLink({ to, icon, label }: { to: string; icon: IconName; label: string }) {
  return <Link to={to} className="btn secondary small"><Icon name={icon} size={16} />{label}</Link>;
}

/** Lightweight toast via a module-level event — no context plumbing needed. */
const TOAST_EVENT = 'wellfood:toast';
export const toast = (msg: string) => window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: msg }));

export function ToastHost() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    let t: number | undefined;
    const on = (e: Event) => {
      setMsg((e as CustomEvent<string>).detail);
      window.clearTimeout(t);
      t = window.setTimeout(() => setMsg(null), 2200);
    };
    window.addEventListener(TOAST_EVENT, on);
    return () => { window.removeEventListener(TOAST_EVENT, on); window.clearTimeout(t); };
  }, []);
  return msg ? <div className="toast" role="status">{msg}</div> : null;
}
