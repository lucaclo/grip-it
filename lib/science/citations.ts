export type EvidenceStrength = "strong" | "moderate" | "practitioner";

export type Citation = {
  key: string;
  shortRef: string;
  title: string;
  authors: string;
  year: number;
  doiUrl: string | null;
  finding: string;
  strength: EvidenceStrength;
  /** true once the DOI was checked against Crossref metadata (title, first author). Checked 2026-10-20. */
  verified: boolean;
};

const list: Citation[] = [
  {
    key: "schoenfeld2017volume",
    shortRef: "Schoenfeld 2017",
    title:
      "Dose-response relationship between weekly resistance training volume and increases in muscle mass: A systematic review and meta-analysis",
    authors: "Schoenfeld BJ, Ogborn D, Krieger JW",
    year: 2017,
    doiUrl: "https://doi.org/10.1080/02640414.2016.1210197",
    finding:
      "More weekly sets per muscle produced more growth; 10 or more sets per week beat fewer than 5.",
    strength: "strong",
    verified: true,
  },
  {
    key: "pelland2024volume",
    shortRef: "Pelland 2024",
    title:
      "The resistance training dose-response: meta-regressions exploring the effects of weekly volume and frequency on muscle hypertrophy and strength gain",
    authors: "Pelland JC, Remmert JF, Robinson ZP, et al.",
    year: 2024,
    doiUrl: null,
    finding:
      "Growth keeps rising with weekly volume but with diminishing returns; counting indirect (secondary) sets as about half a set fits the data well.",
    strength: "moderate",
    verified: false,
  },
  {
    key: "schoenfeld2016frequency",
    shortRef: "Schoenfeld 2016",
    title:
      "Effects of Resistance Training Frequency on Measures of Muscle Hypertrophy: A Systematic Review and Meta-Analysis",
    authors: "Schoenfeld BJ, Ogborn D, Krieger JW",
    year: 2016,
    doiUrl: "https://doi.org/10.1007/s40279-016-0543-8",
    finding: "Training each muscle at least twice a week grew more muscle than once a week.",
    strength: "moderate",
    verified: true,
  },
  {
    key: "schoenfeld2017loading",
    shortRef: "Schoenfeld 2017 (loads)",
    title:
      "Strength and Hypertrophy Adaptations Between Low- vs. High-Load Resistance Training: A Systematic Review and Meta-analysis",
    authors: "Schoenfeld BJ, Grgic J, Ogborn D, Krieger JW",
    year: 2017,
    doiUrl: "https://doi.org/10.1519/JSC.0000000000002200",
    finding:
      "Light and heavy loads build similar muscle when sets are hard; heavy loads build more maximal strength.",
    strength: "strong",
    verified: true,
  },
  {
    key: "refalo2023failure",
    shortRef: "Refalo 2023",
    title:
      "Influence of Resistance Training Proximity-to-Failure on Skeletal Muscle Hypertrophy: A Systematic Review with Meta-analysis",
    authors: "Refalo MC, Helms ER, Trexler ET, Hamilton DL, Fyfe JJ",
    year: 2023,
    doiUrl: "https://doi.org/10.1007/s40279-022-01784-y",
    finding:
      "Sets need to be taken reasonably close to failure for growth; going all the way to failure adds little.",
    strength: "moderate",
    verified: true,
  },
  {
    key: "morton2018protein",
    shortRef: "Morton 2018",
    title:
      "A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength in healthy adults",
    authors: "Morton RW, Murphy KT, McKellar SR, et al.",
    year: 2018,
    doiUrl: "https://doi.org/10.1136/bjsports-2017-097608",
    finding:
      "Benefits of extra protein level off around 1.6 g per kg of body weight per day (upper confidence bound about 2.2).",
    strength: "strong",
    verified: true,
  },
  {
    key: "helms2014prep",
    shortRef: "Helms 2014",
    title:
      "Evidence-based recommendations for natural bodybuilding contest preparation: nutrition and supplementation",
    authors: "Helms ER, Aragon AA, Fitschen PJ",
    year: 2014,
    doiUrl: "https://doi.org/10.1186/1550-2783-11-20",
    finding:
      "When dieting, lose about 0.5–1% of body weight per week and eat 2.3–3.1 g protein per kg of lean mass to keep muscle.",
    strength: "moderate",
    verified: true,
  },
  {
    key: "iraki2019offseason",
    shortRef: "Iraki 2019",
    title: "Nutrition Recommendations for Bodybuilders in the Off-Season: A Narrative Review",
    authors: "Iraki J, Fitschen P, Espinar S, Helms E",
    year: 2019,
    doiUrl: "https://doi.org/10.3390/sports7070154",
    finding:
      "For lean muscle gain, a small surplus that gains about 0.25–0.5% of body weight per week limits fat gain.",
    strength: "moderate",
    verified: true,
  },
  {
    key: "mifflin1990bmr",
    shortRef: "Mifflin 1990",
    title: "A new predictive equation for resting energy expenditure in healthy individuals",
    authors: "Mifflin MD, St Jeor ST, Hill LA, Scott BJ, Daugherty SA, Koh YO",
    year: 1990,
    doiUrl: "https://doi.org/10.1093/ajcn/51.2.241",
    finding: "Resting energy use can be estimated from weight, height, age and sex.",
    strength: "strong",
    verified: true,
  },
  {
    key: "katchmcardle",
    shortRef: "Katch-McArdle",
    title: "Katch-McArdle lean-mass equation for resting metabolic rate",
    authors: "Katch FI, McArdle WD",
    year: 1996,
    doiUrl: null,
    finding:
      "When body-fat % is known, resting energy use is estimated from lean mass: 370 + 21.6 × lean kg.",
    strength: "practitioner",
    verified: false,
  },
  {
    key: "epley1985",
    shortRef: "Epley 1985",
    title: "Poundage Chart (Boyd Epley Workout)",
    authors: "Epley B",
    year: 1985,
    doiUrl: null,
    finding: "Estimated 1-rep max ≈ weight × (1 + reps ÷ 30); most accurate at 12 reps or fewer.",
    strength: "practitioner",
    verified: false,
  },
  {
    key: "doubleprogression",
    shortRef: "Double progression",
    title: "Double progression: add reps within a range, then add load",
    authors: "Coaching practice",
    year: 2024,
    doiUrl: null,
    finding:
      "Work up to the top of a rep range across all sets, then add a small amount of weight and start again at the bottom.",
    strength: "practitioner",
    verified: false,
  },
  {
    key: "dots",
    shortRef: "DOTS",
    title: "DOTS (Dynamic Objective Team Scoring) bodyweight-adjusted strength formula",
    authors: "Powerlifting federations",
    year: 2019,
    doiUrl: null,
    finding: "Adjusts a lifting total for body weight so lifters of different sizes can be compared.",
    strength: "practitioner",
    verified: false,
  },
];

export const citations: Record<string, Citation> = Object.fromEntries(list.map((c) => [c.key, c]));

export function cite(...keys: string[]): string[] {
  for (const k of keys) if (!citations[k]) throw new Error(`Unknown citation key: ${k}`);
  return keys;
}
