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
  /** true once the DOI was checked against Crossref metadata (title, first author). Checked 2026-10-20 and 2026-10-21. */
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
    shortRef: "Pelland 2025",
    title:
      "The Resistance Training Dose Response: Meta-Regressions Exploring the Effects of Weekly Volume and Frequency on Muscle Hypertrophy and Strength Gains",
    authors: "Pelland JC, Remmert JF, Robinson ZP, Hinson SR, et al.",
    year: 2025,
    doiUrl: "https://doi.org/10.1007/s40279-025-02344-w",
    finding:
      "Growth keeps rising with weekly volume but with diminishing returns; counting indirect (secondary) sets as about half a set fits the data well.",
    strength: "moderate",
    verified: true,
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
    key: "robinson2024failure",
    shortRef: "Robinson 2024",
    title:
      "Exploring the Dose–Response Relationship Between Estimated Resistance Training Proximity to Failure, Strength Gain, and Muscle Hypertrophy: A Series of Meta-Regressions",
    authors: "Robinson ZP, Pelland JC, Remmert JF, Refalo MC, Jukic I, Steele J, Zourdos MC",
    year: 2024,
    doiUrl: "https://doi.org/10.1007/s40279-024-02069-2",
    finding:
      "Muscle growth rose as sets ended closer to failure; strength gains were much less sensitive to how close you went.",
    strength: "moderate",
    verified: true,
  },
  {
    key: "helms2016rir",
    shortRef: "Helms 2016",
    title: "Application of the Repetitions in Reserve-Based Rating of Perceived Exertion Scale for Resistance Training",
    authors: "Helms ER, Cronin J, Storey A, Zourdos MC",
    year: 2016,
    doiUrl: "https://doi.org/10.1519/SSC.0000000000000218",
    finding:
      "Rating each set by reps in reserve (how many more you could have done) is a practical way to judge and steer effort.",
    strength: "practitioner",
    verified: true,
  },
  {
    key: "zourdos2016rir",
    shortRef: "Zourdos 2016",
    title: "Novel Resistance Training–Specific Rating of Perceived Exertion Scale Measuring Repetitions in Reserve",
    authors: "Zourdos MC, Klemp A, Dolan C, Quiles JM, Schau KA, Jo E, Helms E, et al.",
    year: 2016,
    doiUrl: "https://doi.org/10.1519/JSC.0000000000001049",
    finding:
      "A rating scale based on reps in reserve closely tracked how hard sets really were (bar speed), most clearly in experienced lifters.",
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
  // Grip variations. DOIs checked against Crossref and findings read from the abstracts, 2026-10-23.
  {
    key: "saeterbakken2017bench",
    shortRef: "Saeterbakken 2017",
    title: "The Effects of Bench Press Variations in Competitive Athletes on Muscle Activity and Performance",
    authors: "Saeterbakken AH, Mo DA, Scott S, Andersen V",
    year: 2017,
    doiUrl: "https://doi.org/10.1515/hukin-2017-0047",
    finding:
      "Medium and wide grips lifted 5.8–11.1% more than a narrow grip. Chest, shoulder and triceps activity barely changed between widths; only the biceps worked less with a narrow grip.",
    strength: "moderate",
    verified: true,
  },
  {
    key: "lehman2005bench",
    shortRef: "Lehman 2005",
    title:
      "The Influence of Grip Width and Forearm Pronation/Supination on Upper-Body Myoelectric Activity During the Flat Bench Press",
    authors: "Lehman GJ",
    year: 2005,
    doiUrl: "https://doi.org/10.1519/R-15024.1",
    finding:
      "Narrower grips raised triceps activity and lowered the lower (sternal) chest; an underhand grip raised the upper (clavicular) chest and biceps. The changes were small.",
    strength: "moderate",
    verified: true,
  },
  {
    key: "barnett1995bench",
    shortRef: "Barnett 1995",
    title: "Effects of Variations of the Bench Press Exercise on the EMG Activity of Five Shoulder Muscles",
    authors: "Barnett C, Kippers V, Turner P",
    year: 1995,
    doiUrl: "https://doi.org/10.1519/00124278-199511000-00003",
    finding: "A narrow bench grip worked the triceps and the upper (clavicular) chest more than a wide grip.",
    strength: "moderate",
    verified: true,
  },
  {
    key: "andersen2014pulldown",
    shortRef: "Andersen 2014",
    title: "Effects of Grip Width on Muscle Strength and Activation in the Lat Pull-Down",
    authors: "Andersen V, Fimland MS, Wiik E, Skoglund A, Saeterbakken AH",
    year: 2014,
    doiUrl: "https://doi.org/10.1097/JSC.0000000000000232",
    finding:
      "Narrow and medium overhand grips lifted about 3.5% more than a wide grip (6RM). Lat, trap and rotator cuff activity was similar at every width.",
    strength: "moderate",
    verified: true,
  },
  {
    key: "lehman2004lats",
    shortRef: "Lehman 2004",
    title: "Variations in muscle activation levels during traditional latissimus dorsi weight training exercises: An experimental study",
    authors: "Lehman GJ, Buchan DD, Lundy A, Myers N, Nalborczyk A",
    year: 2004,
    doiUrl: "https://doi.org/10.1186/1476-5918-3-4",
    finding:
      "A wide overhand pulldown had a higher lat-to-biceps ratio than an underhand pulldown; biceps activity didn't change. Grip and setup changes made only small differences.",
    strength: "moderate",
    verified: true,
  },
  {
    key: "youdas2010pullup",
    shortRef: "Youdas 2010",
    title:
      "Surface Electromyographic Activation Patterns and Elbow Joint Motion During a Pull-Up, Chin-Up, or Perfect-Pullup Rotational Exercise",
    authors: "Youdas JW, Amundson CL, Cicero KS, Hahn JJ, Harezlak DT, Hollman JH",
    year: 2010,
    doiUrl: "https://doi.org/10.1519/JSC.0b013e3181f1598c",
    finding:
      "The underhand chin-up worked the biceps and chest more than the overhand pull-up; the pull-up worked the lower traps more. Lats worked hard in both.",
    strength: "moderate",
    verified: true,
  },
  {
    key: "dickie2017pullup",
    shortRef: "Dickie 2017",
    title: "Electromyographic analysis of muscle activation during pull-up variations",
    authors: "Dickie JA, Faulkner JA, Barnes MJ, Lark SD",
    year: 2017,
    doiUrl: "https://doi.org/10.1016/j.jelekin.2016.11.004",
    finding:
      "Overhand, underhand, neutral and rope pull-ups worked the arm and back muscles about the same; overhand worked the middle traps more than neutral.",
    strength: "moderate",
    verified: true,
  },
  {
    key: "kohn2018forearm",
    shortRef: "Kohn 2018",
    title:
      "Voluntary activation and twitch potentiation of the elbow flexors across supinated, neutral, and pronated forearm orientations",
    authors: "Kohn S, Smart RR, Jakobi JM",
    year: 2018,
    doiUrl: "https://doi.org/10.14814/phy2.13560",
    finding:
      "Elbow flexion was strongest with palms facing (neutral), then palms up; palms down produced about half the force of palms up.",
    strength: "moderate",
    verified: true,
  },
  {
    key: "kleiber2015curl",
    shortRef: "Kleiber 2015",
    title: "Muscular coordination of biceps brachii and brachioradialis in elbow flexion with respect to hand position",
    authors: "Kleiber T, Kunz L, Disselhorst-Klug C",
    year: 2015,
    doiUrl: "https://doi.org/10.3389/fphys.2015.00215",
    finding:
      "Palms-down curls shifted work to the brachioradialis (forearm); biceps activity was similar in every hand position.",
    strength: "moderate",
    verified: true,
  },
  {
    key: "gripcoaching",
    shortRef: "Grip coaching",
    title: "Grip choice in rows, pushdowns and pulls: mixed, hook, straps and snatch grip",
    authors: "Coaching practice",
    year: 2024,
    doiUrl: null,
    finding:
      "How you hold the bar (mixed, hook, straps) changes what limits you, not which muscles grow. Row and pushdown grips shift emphasis a little; few studies have measured them.",
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
