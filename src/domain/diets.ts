import type { SourceId } from './evidence';
import type { GlycemicBand, QualityTag } from './types';

/**
 * Diet profiles are declarative: macro intent + composition rules, each rule
 * backed by sources. Adding a new condition = adding a profile, not code.
 */

export type RuleKind = 'avoid' | 'limit' | 'favor';

export interface DietRule {
  id: string;
  kind: RuleKind;
  /** Match by ingredient quality tag … */
  quality?: QualityTag;
  /** … or by glycemic band. */
  glycemic?: GlycemicBand;
  label: string;
  why: string;
  sources: SourceId[];
}

export interface DietProfile {
  id: string;
  name: string;
  tagline: string;
  audience: string;
  description: string;
  macros: {
    /** Fraction of energy from carbohydrate. */
    carbEnergyShare: number;
    /** Hard daily ceiling (net carbs, g) for low-carb profiles. */
    maxNetCarbsPerDay?: number;
    addedSugarMaxShare: number;
  };
  rules: DietRule[];
  sources: SourceId[];
  /** Honest statement of evidence strength shown in the UI. */
  evidenceNote: string;
}

const r = (rule: DietRule) => rule;

const COMMON_FAVOR: DietRule[] = [
  r({ id: 'leafy', kind: 'favor', quality: 'leafy-green', label: 'Leafy greens', why: 'Nutrient-dense, low energy, low glycemic.', sources: ['direnzo2021', 'herbst2021'] }),
  r({ id: 'crucif', kind: 'favor', quality: 'cruciferous', label: 'Cruciferous vegetables', why: 'High in fibre and polyphenols; core of Mediterranean-style patterns.', sources: ['direnzo2021'] }),
  r({ id: 'omega3', kind: 'favor', quality: 'omega-3', label: 'Omega-3 sources (oily fish, walnuts, flax, chia)', why: 'Anti-inflammatory fatty acids recommended in lipedema care.', sources: ['herbst2021', 'direnzo2021'] }),
  r({ id: 'poly', kind: 'favor', quality: 'polyphenol-rich', label: 'Polyphenol-rich foods (berries, herbs, EVOO)', why: 'Associated with lower inflammatory markers in Mediterranean diet trials.', sources: ['predimed2018', 'direnzo2021'] }),
  r({ id: 'fiber', kind: 'favor', quality: 'high-fiber', label: 'High-fibre foods', why: 'Improves satiety and glycemic response; adults need ≥ 25 g/day.', sources: ['efsaFiber2010'] }),
  r({ id: 'mufa', kind: 'favor', quality: 'mufa-rich', label: 'Olive oil, avocado, nuts', why: 'Monounsaturated fats reduced cardiovascular events in PREDIMED.', sources: ['predimed2018'] }),
];

export const DIETS: DietProfile[] = [
  {
    id: 'lipedema-med',
    name: 'Lipedema · Mediterranean',
    tagline: 'Anti-inflammatory, low-glycemic whole foods',
    audience: 'Lipedema (recommended starting point)',
    description:
      'A modified Mediterranean pattern: plenty of vegetables, olive oil, fish, legumes and nuts; low-glycemic carbohydrates; no added sugar, refined grains or processed meat.',
    macros: { carbEnergyShare: 0.35, addedSugarMaxShare: 0.05 },
    rules: [
      r({ id: 'sugar', kind: 'avoid', quality: 'added-sugar', label: 'Added sugar', why: 'Lipedema guidelines advise eliminating refined sugar; WHO recommends < 5% of energy.', sources: ['herbst2021', 'whoSugar2015'] }),
      r({ id: 'refined', kind: 'avoid', quality: 'refined-grain', label: 'Refined grains', why: 'High-glycemic refined carbohydrates are discouraged in lipedema standard of care.', sources: ['herbst2021'] }),
      r({ id: 'procmeat', kind: 'avoid', quality: 'processed-meat', label: 'Processed meat', why: 'Pro-inflammatory; excluded from the modified Mediterranean protocol.', sources: ['direnzo2021'] }),
      r({ id: 'highgi', kind: 'limit', glycemic: 'high', label: 'High-GI foods', why: 'The lipedema Mediterranean protocol is built on low-glycemic carbohydrates.', sources: ['direnzo2021', 'atkinson2021'] }),
      ...COMMON_FAVOR,
    ],
    sources: ['herbst2021', 'direnzo2021', 'predimed2018', 'whoSugar2015'],
    evidenceNote:
      'Supported by the US standard-of-care consensus and small clinical studies. Lipedema nutrition research is young — use this alongside your care team.',
  },
  {
    id: 'lipedema-lchf',
    name: 'Lipedema · Low-carb',
    tagline: 'Low-carb, high-fat (LCHF / keto-leaning)',
    audience: 'Lipedema, when advised by your clinician',
    description:
      'Carbohydrates kept low (≈ 15% of energy), fat from olive oil, avocado, nuts and fish. Studied in lipedema for fat-mass and pain reduction.',
    macros: { carbEnergyShare: 0.15, maxNetCarbsPerDay: 75, addedSugarMaxShare: 0.02 },
    rules: [
      r({ id: 'sugar', kind: 'avoid', quality: 'added-sugar', label: 'Added sugar', why: 'Incompatible with carbohydrate restriction.', sources: ['jeziorek2023', 'sorlie2022'] }),
      r({ id: 'refined', kind: 'avoid', quality: 'refined-grain', label: 'Refined grains', why: 'High carbohydrate density and glycemic load.', sources: ['jeziorek2023'] }),
      r({ id: 'starchy', kind: 'limit', quality: 'starchy', label: 'Starchy vegetables', why: 'Quickly exceed a low-carb budget.', sources: ['jeziorek2023'] }),
      r({ id: 'highgi', kind: 'avoid', glycemic: 'high', label: 'High-GI foods', why: 'Raise insulin, which the low-carb approach aims to keep low.', sources: ['keith2021'] }),
      r({ id: 'wholegrain', kind: 'limit', quality: 'whole-grain', label: 'Grains (even whole)', why: 'Fit only in small portions within a low-carb budget.', sources: ['jeziorek2023'] }),
      r({ id: 'procmeat', kind: 'limit', quality: 'processed-meat', label: 'Processed meat', why: 'Low-carb does not mean processed; prefer whole proteins.', sources: ['herbst2021'] }),
      ...COMMON_FAVOR.filter((x) => x.id !== 'fiber'),
    ],
    sources: ['jeziorek2023', 'sorlie2022', 'keith2021', 'herbst2021'],
    evidenceNote:
      'One randomised trial and pilot studies show benefit in lipedema. Ketogenic diets need medical supervision if you take medication for diabetes or blood pressure.',
  },
  {
    id: 'low-gi',
    name: 'Blood-sugar friendly',
    tagline: 'Low-GI, fibre-rich, no added sugar',
    audience: 'Insulin resistance, prediabetes, type 2 diabetes',
    description:
      'Emphasises non-starchy vegetables, legumes and whole grains; minimises added sugar and high-GI foods.',
    macros: { carbEnergyShare: 0.4, addedSugarMaxShare: 0.05 },
    rules: [
      r({ id: 'sugar', kind: 'avoid', quality: 'added-sugar', label: 'Added sugar', why: 'Raises post-meal glucose.', sources: ['ada2024', 'whoSugar2015'] }),
      r({ id: 'highgi', kind: 'avoid', glycemic: 'high', label: 'High-GI foods', why: 'Larger glucose spikes.', sources: ['atkinson2021', 'ada2024'] }),
      r({ id: 'refined', kind: 'limit', quality: 'refined-grain', label: 'Refined grains', why: 'Prefer whole grains.', sources: ['ada2024'] }),
      ...COMMON_FAVOR,
    ],
    sources: ['ada2024', 'atkinson2021', 'whoSugar2015'],
    evidenceNote: 'Based on the American Diabetes Association Standards of Care.',
  },
  {
    id: 'mediterranean',
    name: 'Mediterranean',
    tagline: 'Heart-healthy everyday eating',
    audience: 'General health, cardiovascular risk',
    description: 'Vegetables, legumes, whole grains, fish and extra-virgin olive oil; little processed meat or sugar.',
    macros: { carbEnergyShare: 0.45, addedSugarMaxShare: 0.1 },
    rules: [
      r({ id: 'procmeat', kind: 'avoid', quality: 'processed-meat', label: 'Processed meat', why: 'Discouraged in the Mediterranean pattern.', sources: ['predimed2018'] }),
      r({ id: 'sugar', kind: 'limit', quality: 'added-sugar', label: 'Added sugar', why: 'Keep below 10% of energy.', sources: ['whoSugar2015'] }),
      r({ id: 'refined', kind: 'limit', quality: 'refined-grain', label: 'Refined grains', why: 'Prefer whole grains.', sources: ['predimed2018'] }),
      ...COMMON_FAVOR,
    ],
    sources: ['predimed2018', 'whoSugar2015', 'efsaFiber2010'],
    evidenceNote: 'One of the best-studied dietary patterns (large randomised trial).',
  },
  {
    id: 'balanced',
    name: 'Balanced',
    tagline: 'General healthy eating',
    audience: 'Everyone else',
    description: 'Flexible, whole-food-based eating within WHO sugar and EFSA fibre recommendations.',
    macros: { carbEnergyShare: 0.5, addedSugarMaxShare: 0.1 },
    rules: [
      r({ id: 'sugar', kind: 'limit', quality: 'added-sugar', label: 'Added sugar', why: 'Keep below 10% of energy.', sources: ['whoSugar2015'] }),
      r({ id: 'procmeat', kind: 'limit', quality: 'processed-meat', label: 'Processed meat', why: 'Best eaten rarely.', sources: ['predimed2018'] }),
      ...COMMON_FAVOR.filter((x) => ['fiber', 'leafy', 'omega3'].includes(x.id)),
    ],
    sources: ['whoSugar2015', 'efsaFiber2010'],
    evidenceNote: 'Population-level guidelines.',
  },
];

export const DEFAULT_DIET_ID = 'lipedema-med';

export const getDiet = (id: string): DietProfile =>
  DIETS.find((d) => d.id === id) ?? (DIETS[0] as DietProfile);
