/* ═══════════════════════════════════════════════════════════════
   ASSESSMENTS · SCORING — pure functions, no DOM, no storage.
   All model assumptions are intentional simplifications for an
   unnormed practice test and are disclosed to the user in the
   on-screen "limitations" boxes (see 12/14 data files).
   ═══════════════════════════════════════════════════════════════ */

// Canonical public URL used for share links when running inside the
// Capacitor APK (whose origin is a useless https://localhost).
const ASSESS_CANONICAL_URL = "https://wannabexaker.github.io/mcq-trainer/";

/* ── Normal CDF via the logistic approximation ──────────────────
   Φ(z) ≈ 1 / (1 + e^(−1.702·z)) — max error < 1%, plenty for
   percentiles that we round to the nearest 5 anyway. */
function normalCdf(z) {
  return 1 / (1 + Math.exp(-1.702 * z));
}

/* ── IQ test ────────────────────────────────────────────────────
   Model (disclosed in the limitations box):
   · items target pass-rates [.85,.70,.55,.40,.25] per difficulty
     → population mean raw μ = 4 × Σp = 11.0
   · binomial variance Σp(1−p) ≈ 4.05 inflated by a design effect
     of ≈3 for inter-item correlation → σ = 3.5
   · IQ = 100 + 15·z, clamped to [55,145]: a 20-item test cannot
     discriminate beyond that range.
   · displayed band = point ± 7.5, rounded to the nearest 5.
   Domains: raw_d ∈ 0..5, μ_d = 2.75, σ_d = 1.3.               */
const IQ_MODEL = {
  mean: 11.0,
  sd: 3.5,
  // Reliability attenuation: a 20-item test measures with noise, so the best
  // estimate of the "true" z is r·z_observed (classical true-score shrinkage).
  // This pulls extreme results realistically toward 100 — a perfect 20/20
  // reads ~133, not 139+ — and the clamp is narrowed to what such a short
  // test can honestly claim.
  reliability: 0.85,
  clampLo: 60,
  clampHi: 140,
  bandHalfWidth: 7.5,
  domainMean: 2.75,
  domainSd: 1.3,
  strengthZ: 0.6,
};

// answers: { itemId: choiceIndex | null } — null/missing = incorrect.
function scoreIq(answers) {
  const domains = {};
  IQ_TEST_META.domains.forEach((d) => { domains[d] = 0; });
  IQ_ITEMS.forEach((item) => {
    const a = answers ? answers[item.id] : null;
    if (a !== null && a !== undefined && Number(a) === item.correctIndex) {
      domains[item.domain] += 1;
    }
  });
  return computeIqFromDomains(domains);
}

// Deterministic derivation from domain raw scores (also used by the
// share-URL decoder, which transmits only these four numbers).
function computeIqFromDomains(domains) {
  const raw = IQ_TEST_META.domains.reduce((s, d) => s + (domains[d] || 0), 0);
  const z = (raw - IQ_MODEL.mean) / IQ_MODEL.sd;
  const zTrue = z * IQ_MODEL.reliability; // shrink toward the mean (see IQ_MODEL)
  const iqPoint = Math.min(
    IQ_MODEL.clampHi,
    Math.max(IQ_MODEL.clampLo, Math.round(100 + 15 * zTrue))
  );
  const bandLo = Math.max(IQ_MODEL.clampLo, Math.round((iqPoint - IQ_MODEL.bandHalfWidth) / 5) * 5);
  const bandHi = Math.min(IQ_MODEL.clampHi, Math.round((iqPoint + IQ_MODEL.bandHalfWidth) / 5) * 5);

  const domainPercentiles = {};
  const domainFlags = {};
  IQ_TEST_META.domains.forEach((d) => {
    const zd = ((domains[d] || 0) - IQ_MODEL.domainMean) / IQ_MODEL.domainSd;
    const pct = Math.round((normalCdf(zd) * 100) / 5) * 5;
    domainPercentiles[d] = Math.min(99, Math.max(1, pct));
    domainFlags[d] = zd >= IQ_MODEL.strengthZ ? "strong" : zd <= -IQ_MODEL.strengthZ ? "weak" : "mid";
  });

  return { raw, domains: { ...domains }, z, iqPoint, band: [bandLo, bandHi], domainPercentiles, domainFlags };
}

function iqBandText(iqPoint) {
  return IQ_RESULT_TEXTS.bands.find((b) => iqPoint >= b.min && iqPoint <= b.max) || IQ_RESULT_TEXTS.bands[0];
}

/* ── Analytical test ────────────────────────────────────────────
   Raw correct count 0..25 → named band. Per-area counts 0..5:
   ≥4 strong · ≤1 weak · else mid.                              */
function scoreAnalytical(answers) {
  const areas = {};
  ANALYTICAL_TEST_META.areas.forEach((a) => { areas[a] = 0; });
  ANALYTICAL_ITEMS.forEach((item) => {
    const a = answers ? answers[item.id] : null;
    if (a !== null && a !== undefined && Number(a) === item.correctIndex) {
      areas[item.area] += 1;
    }
  });
  const raw = ANALYTICAL_TEST_META.areas.reduce((s, a) => s + areas[a], 0);
  return { raw, areas, bandIndex: analyticalBandIndex(raw), percentile: analyticalPercentile(raw) };
}

function analyticalBandIndex(raw) {
  const i = ANALYTICAL_BANDS.findIndex((b) => raw >= b.min && raw <= b.max);
  return i >= 0 ? i : 0;
}

/* Estimated population standing for a raw 0..25: assumed μ=13, σ=4
   (mixed-difficulty items, 4-option guessing floor ≈6). Rounded to 5,
   clamped to [1,99] — an estimate, not a norm, and labeled as such. */
function analyticalPercentile(raw) {
  const z = (raw - 13) / 4;
  const pct = Math.round((normalCdf(z) * 100) / 5) * 5;
  return Math.min(99, Math.max(1, pct));
}

function analyticalAreaFlag(count) {
  return count >= 4 ? "strong" : count <= 1 ? "weak" : "mid";
}

/* ── Dark Triad (SD-3 style) ────────────────────────────────────
   Per item: v = reverse ? 6−answer : answer  (answers 1..5).
   Trait sum ∈ [9,45], mean ∈ [1,5].
   norm = (mean−1)/4 × 100  → 0..100 radar axes.
   High/Low thresholds ≈ published SD3 sample means
   (Jones & Paulhus, 2014): N ≥ 2.8 · M ≥ 3.1 · P ≥ 2.1.
   NOTE (disclosed on screen): mean-split ⇒ roughly half of all
   test-takers land "High" on any given trait.                  */
const SD3_THRESHOLDS = { N: 2.8, M: 3.1, P: 2.1 };

// answers: { itemId: 1..5 } — must be complete (engine enforces it).
function scoreSd3(answers) {
  const sums = { N: 0, M: 0, P: 0 };
  SD3_ITEMS.forEach((item) => {
    const a = Number(answers ? answers[item.id] : 0) || 0;
    const v = item.reverse ? 6 - a : a;
    sums[item.trait] += v;
  });
  return computeSd3FromSums(sums);
}

// Deterministic derivation from trait sums (also used by the decoder).
/* Per-trait graded levels, anchored to published SD3 sample statistics
   (Jones & Paulhus, 2014: means ≈ N 2.8 · M 3.1 · P 2.1 on the 1-5 scale,
   SDs ≈ 0.75/0.72/0.66 → on the 0-100 norm: mean ≈ N 45 · M 53 · P 27,
   σ ≈ 19/18/17). Cuts sit at mean −1.5σ, −0.5σ, +0.5σ, +1.5σ, so
   "Moderate" genuinely means "around the average person" for EACH trait —
   e.g. Psychopathy 50/100 is HIGH relative to people (its mean is ~27),
   while Machiavellianism 50/100 is Moderate (its mean is ~53). */
const SD3_LEVEL_CUTS = {
  N: [17, 36, 54, 73],
  M: [25, 43, 61, 79],
  P: [5, 19, 36, 52],
};

function sd3LevelKey(trait, norm) {
  const c = SD3_LEVEL_CUTS[trait] || [20, 40, 60, 80];
  if (norm < c[0]) return "veryLow";
  if (norm < c[1]) return "low";
  if (norm < c[2]) return "moderate";
  if (norm < c[3]) return "high";
  return "veryHigh";
}

// Pick a named archetype from the three 0-100 norms, graded by overall
// intensity (avg) and profile shape (dominant trait / balance). This is what
// makes results span gentle → moderate → dark instead of everyone reading "high".
function sd3ArchetypeId(norm) {
  const N = norm.N, M = norm.M, P = norm.P;
  const avg = (N + M + P) / 3;
  const spread = Math.max(N, M, P) - Math.min(N, M, P);
  const balanced = spread < 15;
  const dom = (N >= M && N >= P) ? "N" : (M >= P ? "M" : "P");
  const byDom = (n, m, p) => (dom === "N" ? n : dom === "M" ? m : p);
  const domVal = byDom(N, M, P);
  const othersAvg = ((N + M + P) - domVal) / 2;
  if (avg >= 78 && Math.min(N, M, P) >= 60) return "triad"; // all three genuinely high
  // Dominance override: one trait pegged very high and clearly ahead of the
  // rest defines the profile even when the overall average is tame —
  // e.g. Narcissism 100 with the others low IS "The Star".
  if (domVal >= 80 && domVal - othersAvg >= 25) return byDom("star", "operator", "daredevil");
  if (avg < 22) return "gentle";
  if (avg < 40) return balanced ? "grounded" : byDom("quiet", "diplomat", "freespirit");
  if (avg < 60) return balanced ? "balanced" : byDom("charmer", "strategist", "maverick");
  return byDom("star", "operator", "daredevil"); // 60+
}

// All archetype ids the selector can emit (for validation).
const SD3_ARCHETYPE_IDS = [
  "gentle", "grounded", "quiet", "diplomat", "freespirit",
  "balanced", "charmer", "strategist", "maverick",
  "star", "operator", "daredevil", "triad",
];

function computeSd3FromSums(sums) {
  const means = {}, norm = {}, high = {}, levels = {};
  SD3_TEST_META.traits.forEach((t) => {
    means[t] = sums[t] / 9;
    norm[t] = Math.round(((means[t] - 1) / 4) * 100);
    high[t] = means[t] >= SD3_THRESHOLDS[t];
    levels[t] = sd3LevelKey(t, norm[t]);
  });
  // Kept for the share codec / backwards compatibility; the results view now
  // uses the graded archetypeId instead.
  const archetypeKey = `${high.N ? 1 : 0}${high.M ? 1 : 0}${high.P ? 1 : 0}`;
  const archetypeId = sd3ArchetypeId(norm);
  return { sums: { ...sums }, means, norm, high, levels, archetypeKey, archetypeId };
}

/* ── Sexuality Spectrum ─────────────────────────────────────────
   Per item: v = reverse ? 6−answer : answer (answers 1..5).
   Six dimensions with different item counts (see SPECTRUM_TEST_META):
   S same-gender · O other-gender · I intensity · D bond-dependence ·
   G gender-irrelevance · F fluidity. norm = (mean−1)/4 × 100.
   The category is a REGION of the spectrum, framed as "your answers
   align most closely with" — never a verdict.                    */
function scoreSpectrum(answers) {
  const sums = { S: 0, O: 0, I: 0, D: 0, G: 0, F: 0 };
  SPECTRUM_ITEMS.forEach((item) => {
    const a = Number(answers ? answers[item.id] : 0) || 0;
    const v = item.reverse ? 6 - a : a;
    sums[item.dim] += v;
  });
  return computeSpectrumFromSums(sums);
}

/* Category selection from the six 0-100 norms. Order matters:
   intensity first (ace spectrum), then gender pattern.           */
function spectrumCategoryId(norm) {
  const { S, O, I, D, G } = norm;
  if (I < 20) return "ace";
  if (D >= 65 && I < 55) return "demi";
  if (I < 38) return "grayAce";
  // Allosexual zone — gender pattern decides.
  if (S < 25 && O < 25) return "questioning"; // real intensity, no gender pattern
  if (G >= 62 && S >= 45 && O >= 45) return "pan";
  if (S >= 40 && O >= 40) return "bi";
  if (O >= S) return (O >= 55 && S < 22) ? "straight" : "mostlyStraight";
  return (S >= 55 && O < 22) ? "gay" : "mostlyGay";
}

const SPECTRUM_CATEGORY_IDS = [
  "straight", "mostlyStraight", "bi", "pan", "mostlyGay", "gay",
  "demi", "grayAce", "ace", "questioning",
];

// Generic 3-step level for the dimension bars (no published per-dim
// population norms exist for this custom instrument, so keep it honest).
function spectrumLevelKey(norm) {
  if (norm < 35) return "low";
  if (norm < 65) return "moderate";
  return "high";
}

function computeSpectrumFromSums(sums) {
  const counts = SPECTRUM_TEST_META.dimCounts;
  const norm = {}, levels = {};
  SPECTRUM_TEST_META.dims.forEach((d) => {
    const mean = sums[d] / counts[d];
    norm[d] = Math.round(((mean - 1) / 4) * 100);
    levels[d] = spectrumLevelKey(norm[d]);
  });
  const categoryId = spectrumCategoryId(norm);
  // Kinsey-style position 0..6 from the same/other ratio (allosexual only).
  const kinsey = (norm.S + norm.O) > 0
    ? Math.round((6 * norm.S / (norm.S + norm.O)) * 10) / 10
    : null;
  // Qualifier notes assembled by the renderer.
  const fluid = norm.F >= 62;
  const biLean = (categoryId === "bi" || categoryId === "pan")
    ? (norm.S - norm.O >= 18 ? "same" : norm.O - norm.S >= 18 ? "other" : "balanced")
    : null;
  const aceCat = categoryId === "ace" || categoryId === "grayAce" || categoryId === "demi";
  const romLean = aceCat
    ? ((norm.S < 20 && norm.O < 20) ? "none"
      : Math.abs(norm.S - norm.O) < 15 ? "both"
      : norm.S > norm.O ? "same" : "other")
    : null;
  return { sums: { ...sums }, norm, levels, categoryId, kinsey, fluid, biLean, romLean };
}

/* ── Share-URL codec ────────────────────────────────────────────
   Param `ar`, format <version><testChar><digits> — aggregates
   only, never per-item data:
   · iq          "1i" + 4 digits  (domain raws 0..5 in meta order)
   · analytical  "1a" + 2 digits  (raw 00..25)
   · sd3         "1d" + 6 digits  (N,M,P sums 09..45, zero-padded)
   decodeShare returns { testId, result, partial } or null.
   `partial` marks results synthesized without per-item data
   (analytical loses the per-area breakdown).                   */
function encodeShare(testId, result) {
  if (testId === "iq" && result && result.domains) {
    return "1i" + IQ_TEST_META.domains.map((d) => String(result.domains[d] || 0)).join("");
  }
  if (testId === "analytical" && result) {
    return "1a" + String(result.raw).padStart(2, "0");
  }
  if (testId === "sd3" && result && result.sums) {
    return "1d" + SD3_TEST_META.traits.map((t) => String(result.sums[t]).padStart(2, "0")).join("");
  }
  if (testId === "spectrum" && result && result.sums) {
    return "1x" + SPECTRUM_TEST_META.dims.map((d) => String(result.sums[d]).padStart(2, "0")).join("");
  }
  return null;
}

function decodeShare(str) {
  const m = /^1([iadx])(\d+)$/.exec(String(str || "").trim());
  if (!m) return null;
  const kind = m[1], digits = m[2];

  if (kind === "i") {
    if (digits.length !== 4) return null;
    const domains = {};
    for (let k = 0; k < 4; k++) {
      const v = Number(digits[k]);
      if (v > 5) return null;
      domains[IQ_TEST_META.domains[k]] = v;
    }
    return { testId: "iq", result: computeIqFromDomains(domains), partial: false };
  }

  if (kind === "a") {
    if (digits.length !== 2) return null;
    const raw = Number(digits);
    if (raw > 25) return null;
    return {
      testId: "analytical",
      result: { raw, areas: null, bandIndex: analyticalBandIndex(raw), percentile: analyticalPercentile(raw) },
      partial: true,
    };
  }

  if (kind === "d") {
    if (digits.length !== 6) return null;
    const sums = {};
    for (let k = 0; k < 3; k++) {
      const v = Number(digits.slice(k * 2, k * 2 + 2));
      if (v < 9 || v > 45) return null;
      sums[SD3_TEST_META.traits[k]] = v;
    }
    return { testId: "sd3", result: computeSd3FromSums(sums), partial: false };
  }

  if (kind === "x") {
    if (digits.length !== 12) return null;
    const sums = {};
    for (let k = 0; k < 6; k++) {
      const d = SPECTRUM_TEST_META.dims[k];
      const count = SPECTRUM_TEST_META.dimCounts[d];
      const v = Number(digits.slice(k * 2, k * 2 + 2));
      if (v < count || v > count * 5) return null;
      sums[d] = v;
    }
    return { testId: "spectrum", result: computeSpectrumFromSums(sums), partial: false };
  }

  return null;
}

function buildShareUrl(testId, result) {
  const payload = encodeShare(testId, result);
  if (!payload) return null;
  const isNative = typeof window !== "undefined" && window.Capacitor?.isNativePlatform?.();
  const base = isNative
    ? ASSESS_CANONICAL_URL
    : location.origin + location.pathname;
  return `${base}?ar=${payload}`;
}
