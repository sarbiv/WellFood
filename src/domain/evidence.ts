/**
 * Evidence registry. Every rule the app applies (energy equations, diet rules,
 * nutrient data) points to one of these sources so users can see *why*.
 *
 * Links are PubMed searches on the exact title rather than hard-coded DOIs,
 * so a link never silently points at the wrong paper.
 */

export interface Source {
  id: string;
  authors: string;
  title: string;
  venue: string;
  year: number;
  /** One-line, plain-language takeaway used in the UI. */
  takeaway: string;
  kind: 'guideline' | 'rct' | 'cohort' | 'review' | 'pilot' | 'equation' | 'database';
  url: string;
}

const pubmed = (title: string) =>
  `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(title)}`;

const src = (s: Omit<Source, 'url'> & { url?: string }): Source => ({
  ...s,
  url: s.url ?? pubmed(s.title),
});

export const SOURCES = {
  mifflin: src({
    id: 'mifflin',
    authors: 'Mifflin MD, St Jeor ST, et al.',
    title: 'A new predictive equation for resting energy expenditure in healthy individuals',
    venue: 'Am J Clin Nutr',
    year: 1990,
    kind: 'equation',
    takeaway:
      'Mifflin–St Jeor estimates resting energy expenditure from sex, age, height and weight; it is the most accurate common equation for adults.',
  }),
  herbst2021: src({
    id: 'herbst2021',
    authors: 'Herbst KL, Kahn LA, Iker E, et al.',
    title: 'Standard of care for lipedema in the United States',
    venue: 'Phlebology',
    year: 2021,
    kind: 'guideline',
    takeaway:
      'Consensus guideline: lipedema fat responds poorly to calorie restriction alone; an anti-inflammatory, whole-food diet low in refined carbohydrates and sugar is recommended alongside compression and movement.',
  }),
  direnzo2021: src({
    id: 'direnzo2021',
    authors: 'Di Renzo L, Cinelli G, Romano L, et al.',
    title: 'Potential Effects of a Modified Mediterranean Diet on Body Composition in Lipoedema',
    venue: 'Nutrients',
    year: 2021,
    kind: 'pilot',
    takeaway:
      'A modified Mediterranean diet (low-glycemic, rich in vegetables, olive oil, fish, legumes) reduced body weight and fat mass in women with lipedema.',
  }),
  jeziorek2023: src({
    id: 'jeziorek2023',
    authors: 'Jeziorek M, Szuba A, Sowicz M, et al.',
    title:
      'The Effect of a Low-Carbohydrate High-Fat Diet versus Moderate-Carbohydrate and Fat Diet on Body Composition in Patients with Lipedema',
    venue: 'Diabetes Metab Syndr Obes',
    year: 2023,
    kind: 'rct',
    takeaway:
      'Both a low-carb high-fat diet and a moderate-carb diet reduced weight in lipedema; the low-carb arm showed larger reductions in body fat and limb circumference.',
  }),
  sorlie2022: src({
    id: 'sorlie2022',
    authors: 'Sørlie V, De Soysa AK, Hyldmo ÅA, et al.',
    title: 'Effect of a ketogenic diet on pain and quality of life in patients with lipedema: The LIPODIET pilot study',
    venue: 'Obes Sci Pract',
    year: 2022,
    kind: 'pilot',
    takeaway:
      'A ketogenic diet (≈ <30 g net carbs/day) over 7 weeks reduced weight and self-reported pain in women with lipedema.',
  }),
  keith2021: src({
    id: 'keith2021',
    authors: 'Keith L, Seo CA, Rowsemitt C, et al.',
    title: 'Ketogenic diet as a potential intervention for lipedema',
    venue: 'Med Hypotheses',
    year: 2021,
    kind: 'review',
    takeaway:
      'Proposes that lowering insulin and inflammation via carbohydrate restriction may slow lipedema progression; evidence still emerging.',
  }),
  predimed2018: src({
    id: 'predimed2018',
    authors: 'Estruch R, Ros E, Salas-Salvadó J, et al.',
    title:
      'Primary Prevention of Cardiovascular Disease with a Mediterranean Diet Supplemented with Extra-Virgin Olive Oil or Nuts',
    venue: 'N Engl J Med',
    year: 2018,
    kind: 'rct',
    takeaway:
      'A Mediterranean diet with extra-virgin olive oil or nuts reduced major cardiovascular events by ~30% versus a reduced-fat control diet.',
  }),
  whoSugar2015: src({
    id: 'whoSugar2015',
    authors: 'World Health Organization',
    title: 'Guideline: Sugars intake for adults and children',
    venue: 'WHO',
    year: 2015,
    kind: 'guideline',
    takeaway: 'Keep free sugars below 10% of energy, ideally below 5%.',
    url: 'https://www.who.int/publications/i/item/9789241549028',
  }),
  leidy2015: src({
    id: 'leidy2015',
    authors: 'Leidy HJ, Clifton PM, Astrup A, et al.',
    title: 'The role of protein in weight loss and maintenance',
    venue: 'Am J Clin Nutr',
    year: 2015,
    kind: 'review',
    takeaway:
      'Protein intakes of ~1.2–1.6 g/kg/day help preserve lean mass and improve satiety during weight loss.',
  }),
  atkinson2021: src({
    id: 'atkinson2021',
    authors: 'Atkinson FS, Brand-Miller JC, Foster-Powell K, et al.',
    title: 'International tables of glycemic index and glycemic load values 2021: a systematic review',
    venue: 'Am J Clin Nutr',
    year: 2021,
    kind: 'database',
    takeaway: 'Reference glycemic index values used to classify ingredients as low / medium / high GI.',
  }),
  fdc: src({
    id: 'fdc',
    authors: 'U.S. Department of Agriculture, Agricultural Research Service',
    title: 'FoodData Central',
    venue: 'USDA',
    year: 2019,
    kind: 'database',
    takeaway: 'Ingredient nutrient values (per 100 g) are taken from USDA FoodData Central (SR Legacy / Foundation Foods), rounded.',
    url: 'https://fdc.nal.usda.gov/',
  }),
  ada2024: src({
    id: 'ada2024',
    authors: 'American Diabetes Association Professional Practice Committee',
    title: 'Facilitating Positive Health Behaviors and Well-being to Improve Health Outcomes: Standards of Care in Diabetes',
    venue: 'Diabetes Care',
    year: 2024,
    kind: 'guideline',
    takeaway:
      'Emphasise non-starchy vegetables, minimal added sugar and refined grains, and whole foods; reducing overall carbohydrate improves glycemia.',
  }),
  efsaFiber2010: src({
    id: 'efsaFiber2010',
    authors: 'EFSA Panel on Dietetic Products, Nutrition and Allergies',
    title: 'Scientific Opinion on Dietary Reference Values for carbohydrates and dietary fibre',
    venue: 'EFSA Journal',
    year: 2010,
    kind: 'guideline',
    takeaway: 'Adults should eat at least 25 g of dietary fibre per day.',
    url: 'https://www.efsa.europa.eu/en/efsajournal/pub/1462',
  }),
} satisfies Record<string, Source>;

export type SourceId = keyof typeof SOURCES;

export const getSource = (id: SourceId): Source => SOURCES[id];
