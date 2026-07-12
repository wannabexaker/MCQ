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
  clampLo: 55,
  clampHi: 145,
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
  const iqPoint = Math.min(
    IQ_MODEL.clampHi,
    Math.max(IQ_MODEL.clampLo, Math.round(100 + 15 * z))
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
  return { raw, areas, bandIndex: analyticalBandIndex(raw) };
}

function analyticalBandIndex(raw) {
  const i = ANALYTICAL_BANDS.findIndex((b) => raw >= b.min && raw <= b.max);
  return i >= 0 ? i : 0;
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
function computeSd3FromSums(sums) {
  const means = {}, norm = {}, high = {};
  SD3_TEST_META.traits.forEach((t) => {
    means[t] = sums[t] / 9;
    norm[t] = Math.round(((means[t] - 1) / 4) * 100);
    high[t] = means[t] >= SD3_THRESHOLDS[t];
  });
  const archetypeKey = `${high.N ? 1 : 0}${high.M ? 1 : 0}${high.P ? 1 : 0}`;
  return { sums: { ...sums }, means, norm, high, archetypeKey };
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
  return null;
}

function decodeShare(str) {
  const m = /^1([iad])(\d+)$/.exec(String(str || "").trim());
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
      result: { raw, areas: null, bandIndex: analyticalBandIndex(raw) },
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
