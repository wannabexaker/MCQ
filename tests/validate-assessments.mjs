#!/usr/bin/env node
// Validates the assessment data files (js/12-14) and the pure scoring
// module (js/15) — structure, SVG safety, bilingual completeness,
// scoring sanity and share-codec round-trips.
// Run: node tests/validate-assessments.mjs
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FILES = [
  "js/12-assess-data-iq.js",
  "js/13-assess-data-analytical.js",
  "js/14-assess-data-sd3.js",
  "js/15-assess-scoring.js",
  "js/19-assess-export.js", // top-level is pure (consts + function declarations)
];

let errors = 0;
const err = (where, msg) => { console.error(`  ${where}: ${msg}`); errors++; };

// ── Load the classic scripts in one sandbox and extract the globals ──
let G;
try {
  const src =
    FILES.map((f) => readFileSync(join(ROOT, f), "utf8")).join("\n;\n") +
    `\n;({ IQ_TEST_META, IQ_ITEMS, IQ_DOMAIN_INFO, IQ_RESULT_TEXTS,
       ANALYTICAL_TEST_META, ANALYTICAL_ITEMS, ANALYTICAL_BANDS, ANALYTICAL_AREA_INFO,
       SD3_TEST_META, SD3_ITEMS, SD3_LIKERT, SD3_TRAIT_INFO, SD3_ARCHETYPES, SD3_RESULT_NOTES,
       SD3_THRESHOLDS, scoreIq, computeIqFromDomains, iqBandText,
       scoreAnalytical, analyticalBandIndex, analyticalAreaFlag,
       scoreSd3, computeSd3FromSums, encodeShare, decodeShare, buildMinimalPdf })`;
  G = vm.runInNewContext(src, {}, { filename: "assess-combined.js" });
} catch (e) {
  console.error(`FAIL: could not evaluate assessment scripts — ${e.message}`);
  process.exit(1);
}

// ── Helpers ─────────────────────────────────────────────────────────
const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;

function checkSvg(where, svg) {
  if (!isNonEmptyString(svg)) return err(where, "SVG is empty");
  if (!svg.trimStart().startsWith("<svg")) err(where, "SVG must start with <svg");
  if (!/viewBox=/.test(svg)) err(where, "SVG missing viewBox");
  if (/<script/i.test(svg)) err(where, "SVG contains <script>");
  if (/[\s"']on[a-z]+\s*=/i.test(svg)) err(where, "SVG contains an inline event handler");
  if (/\bhref\s*=/i.test(svg)) err(where, "SVG contains href");
}

// Every *_en field must have a non-empty *_el sibling (and vice versa
// for arrays: same length, non-empty entries).
function checkBilingual(where, obj, seen = new Set()) {
  if (!obj || typeof obj !== "object" || seen.has(obj)) return;
  seen.add(obj);
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => checkBilingual(`${where}[${i}]`, v, seen));
    return;
  }
  for (const key of Object.keys(obj)) {
    const v = obj[key];
    if (key.endsWith("_en")) {
      const elKey = key.slice(0, -3) + "_el";
      const el = obj[elKey];
      if (Array.isArray(v)) {
        if (!Array.isArray(el) || el.length !== v.length)
          err(where, `${elKey} must be an array of length ${v.length}`);
        else if (el.some((s) => !isNonEmptyString(s)))
          err(where, `${elKey} contains empty entries`);
      } else if (isNonEmptyString(v) && !isNonEmptyString(el)) {
        err(where, `missing Greek translation ${elKey}`);
      }
    }
    if (v && typeof v === "object" && !key.endsWith("Svg") && key !== "choiceSvgs") {
      checkBilingual(`${where}.${key}`, v, seen);
    }
  }
}

function checkUniqueIds(where, items) {
  const seen = new Set();
  items.forEach((it) => {
    if (!isNonEmptyString(it.id)) err(where, "item with missing id");
    else if (seen.has(it.id)) err(where, `duplicate id ${it.id}`);
    seen.add(it.id);
  });
}

// ── IQ data ─────────────────────────────────────────────────────────
{
  const W = "iq";
  const items = G.IQ_ITEMS;
  if (!Array.isArray(items) || items.length !== 20) err(W, `expected exactly 20 items, found ${items?.length}`);
  checkUniqueIds(W, items);

  const perDomain = {};
  items.forEach((it, i) => {
    const at = `${W}[${it.id || i}]`;
    if (!G.IQ_TEST_META.domains.includes(it.domain)) err(at, `unknown domain ${it.domain}`);
    (perDomain[it.domain] ||= []).push(it.difficulty);
    if (!Number.isInteger(it.difficulty) || it.difficulty < 1 || it.difficulty > 5)
      err(at, `difficulty must be 1..5`);
    if (!isNonEmptyString(it.prompt_en)) err(at, "missing prompt_en");
    if (!Number.isInteger(it.correctIndex) || it.correctIndex < 0 || it.correctIndex > 3)
      err(at, `correctIndex must be 0..3`);

    const visual = Array.isArray(it.choiceSvgs);
    const textual = Array.isArray(it.choices_en);
    if (visual === textual) err(at, "must have exactly one of choiceSvgs / choices_en");
    if (visual) {
      if (it.choiceSvgs.length !== 4) err(at, "choiceSvgs must have 4 entries");
      it.choiceSvgs.forEach((svg, k) => checkSvg(`${at}.choiceSvgs[${k}]`, svg));
    }
    if (textual) {
      if (it.choices_en.length !== 4) err(at, "choices_en must have 4 entries");
      if (!Array.isArray(it.choices_el) || it.choices_el.length !== 4) err(at, "choices_el must have 4 entries");
    }
    if ((it.domain === "matrix" || it.domain === "spatial") && !visual)
      err(at, "matrix/spatial items must use visual (SVG) choices");
    if (it.stimulusSvg !== null) checkSvg(`${at}.stimulusSvg`, it.stimulusSvg);
  });
  for (const d of G.IQ_TEST_META.domains) {
    const diffs = (perDomain[d] || []).slice().sort();
    if (diffs.join(",") !== "1,2,3,4,5")
      err(W, `domain ${d} must have difficulties 1..5 exactly once (found ${diffs.join(",")})`);
  }
  checkBilingual("iq.items", items);
  checkBilingual("iq.domainInfo", G.IQ_DOMAIN_INFO);
  checkBilingual("iq.resultTexts", G.IQ_RESULT_TEXTS);
  if (G.IQ_RESULT_TEXTS.bands.length !== 5) err(W, "expected 5 IQ interpretation bands");
}

// ── Analytical data ─────────────────────────────────────────────────
{
  const W = "analytical";
  const items = G.ANALYTICAL_ITEMS;
  if (!Array.isArray(items) || items.length !== 25) err(W, `expected exactly 25 items, found ${items?.length}`);
  checkUniqueIds(W, items);

  const perArea = {};
  items.forEach((it, i) => {
    const at = `${W}[${it.id || i}]`;
    if (!G.ANALYTICAL_TEST_META.areas.includes(it.area)) err(at, `unknown area ${it.area}`);
    perArea[it.area] = (perArea[it.area] || 0) + 1;
    if (!isNonEmptyString(it.text_en)) err(at, "missing text_en");
    if (!Array.isArray(it.choices_en) || it.choices_en.length !== 4) err(at, "choices_en must have 4 entries");
    if (!Array.isArray(it.choices_el) || it.choices_el.length !== 4) err(at, "choices_el must have 4 entries");
    if (!Number.isInteger(it.correctIndex) || it.correctIndex < 0 || it.correctIndex > 3)
      err(at, "correctIndex must be 0..3");
  });
  for (const a of G.ANALYTICAL_TEST_META.areas) {
    if (perArea[a] !== 5) err(W, `area ${a} must have exactly 5 items (found ${perArea[a] || 0})`);
  }

  // Bands must contiguously cover raw 0..25.
  const bands = G.ANALYTICAL_BANDS;
  if (bands.length !== 7) err(W, `expected 7 bands, found ${bands.length}`);
  if (bands[0].min !== 0) err(W, "first band must start at 0");
  if (bands[bands.length - 1].max !== 25) err(W, "last band must end at 25");
  for (let i = 1; i < bands.length; i++) {
    if (bands[i].min !== bands[i - 1].max + 1)
      err(W, `band gap/overlap between ${bands[i - 1].max} and ${bands[i].min}`);
  }
  checkBilingual("analytical.items", items);
  checkBilingual("analytical.bands", bands);
  checkBilingual("analytical.areaInfo", G.ANALYTICAL_AREA_INFO);
}

// ── SD-3 data ───────────────────────────────────────────────────────
{
  const W = "sd3";
  const items = G.SD3_ITEMS;
  if (!Array.isArray(items) || items.length !== 27) err(W, `expected exactly 27 items, found ${items?.length}`);
  checkUniqueIds(W, items);

  const perTrait = { N: 0, M: 0, P: 0 };
  const reversed = { N: 0, M: 0, P: 0 };
  items.forEach((it, i) => {
    const at = `${W}[${it.id || i}]`;
    if (!["N", "M", "P"].includes(it.trait)) err(at, `unknown trait ${it.trait}`);
    else {
      perTrait[it.trait]++;
      if (it.reverse === true) reversed[it.trait]++;
    }
    if (typeof it.reverse !== "boolean") err(at, "reverse must be boolean");
    if (!isNonEmptyString(it.text_en)) err(at, "missing text_en");
  });
  for (const t of ["N", "M", "P"]) {
    if (perTrait[t] !== 9) err(W, `trait ${t} must have exactly 9 items (found ${perTrait[t]})`);
  }
  // 3 reverse-keyed items per trait — straight-lining "agree with
  // everything" must not be able to max out any trait.
  for (const t of ["N", "M", "P"]) {
    if (reversed[t] !== 3) err(W, `trait ${t} must have 3 reverse-keyed items (found ${reversed[t]})`);
  }

  const keys = Object.keys(G.SD3_ARCHETYPES).sort();
  const expected = [
    "balanced", "charmer", "daredevil", "diplomat", "freespirit", "gentle",
    "grounded", "maverick", "operator", "quiet", "star", "strategist", "triad",
  ];
  if (keys.join(",") !== expected.join(","))
    err(W, `archetype keys must be exactly ${expected.join(" ")} (found ${keys.join(" ")})`);

  if (G.SD3_LIKERT.labels_en.length !== 5 || G.SD3_LIKERT.labels_el.length !== 5)
    err(W, "Likert labels must have 5 entries per language");

  checkBilingual("sd3.items", items);
  checkBilingual("sd3.traitInfo", G.SD3_TRAIT_INFO);
  checkBilingual("sd3.archetypes", G.SD3_ARCHETYPES);
  checkBilingual("sd3.notes", G.SD3_RESULT_NOTES);
  checkBilingual("sd3.likert", G.SD3_LIKERT);
}

// ── Scoring sanity ──────────────────────────────────────────────────
{
  const W = "scoring";

  // IQ: all-correct and all-wrong stay inside the clamp; percentiles sane.
  const allRight = {}, allWrong = {};
  G.IQ_ITEMS.forEach((it) => {
    allRight[it.id] = it.correctIndex;
    allWrong[it.id] = (it.correctIndex + 1) % 4;
  });
  const top = G.scoreIq(allRight);
  const bottom = G.scoreIq(allWrong);
  if (top.raw !== 20) err(W, `all-correct raw should be 20, got ${top.raw}`);
  if (bottom.raw !== 0) err(W, `all-wrong raw should be 0, got ${bottom.raw}`);
  for (const r of [top, bottom]) {
    if (r.iqPoint < 55 || r.iqPoint > 145) err(W, `iqPoint ${r.iqPoint} outside clamp [55,145]`);
    if (!(r.band[0] <= r.iqPoint && r.iqPoint <= r.band[1])) err(W, `band ${r.band} does not contain point ${r.iqPoint}`);
    Object.values(r.domainPercentiles).forEach((p) => {
      if (p < 1 || p > 99) err(W, `domain percentile ${p} outside [1,99]`);
    });
    if (!G.iqBandText(r.iqPoint)) err(W, `no interpretation band for iqPoint ${r.iqPoint}`);
  }

  // Analytical: every raw 0..25 resolves to a band.
  for (let raw = 0; raw <= 25; raw++) {
    const bi = G.analyticalBandIndex(raw);
    if (bi < 0 || bi > 6) err(W, `raw ${raw} resolves to invalid band index ${bi}`);
  }
  ["strong", "mid", "weak"].forEach((f, i) => {
    const got = G.analyticalAreaFlag([5, 3, 0][i]);
    if (got !== f) err(W, `area flag for ${[5, 3, 0][i]}/5 should be ${f}, got ${got}`);
  });

  // SD-3: reverse-keying actually applies (all-5 answers).
  // 6 forward ×5 + 3 reversed ×1 = 33 per trait — agreeing with
  // everything lands mid-high, never at the maximum.
  const allFive = {};
  G.SD3_ITEMS.forEach((it) => { allFive[it.id] = 5; });
  const r5 = G.scoreSd3(allFive);
  for (const t of ["N", "M", "P"]) {
    if (r5.sums[t] !== 33) err(W, `all-5 ${t} sum should be 33 (3 reversed), got ${r5.sums[t]}`);
  }

  // All 8 high/low combinations still resolve to the right binary key.
  const HIGH = { N: 26, M: 28, P: 19 }, LOW = { N: 25, M: 27, P: 18 };
  for (const bits of ["000", "001", "010", "011", "100", "101", "110", "111"]) {
    const sums = {
      N: bits[0] === "1" ? HIGH.N : LOW.N,
      M: bits[1] === "1" ? HIGH.M : LOW.M,
      P: bits[2] === "1" ? HIGH.P : LOW.P,
    };
    const res = G.computeSd3FromSums(sums);
    if (res.archetypeKey !== bits) err(W, `sums ${JSON.stringify(sums)} → ${res.archetypeKey}, expected ${bits}`);
    if (!res.archetypeId || !G.SD3_ARCHETYPES[res.archetypeId]) err(W, `no archetype entry for id ${res.archetypeId}`);
  }

  // Each trait spans the full 0-100 range (the user's fix): min sum → 0%, max → 100%.
  const loAll = G.computeSd3FromSums({ N: 9, M: 9, P: 9 });
  const hiAll = G.computeSd3FromSums({ N: 45, M: 45, P: 45 });
  for (const t of ["N", "M", "P"]) {
    if (loAll.norm[t] !== 0) err(W, `min sum ${t} should be 0%, got ${loAll.norm[t]}`);
    if (hiAll.norm[t] !== 100) err(W, `max sum ${t} should be 100%, got ${hiAll.norm[t]}`);
  }

  // Sweep the sum space: every norm stays in [0,100], every level + archetypeId is valid.
  const LEVELS = new Set(["veryLow", "low", "moderate", "high", "veryHigh"]);
  for (let n = 9; n <= 45; n += 3) for (let m = 9; m <= 45; m += 6) for (let p = 9; p <= 45; p += 6) {
    const res = G.computeSd3FromSums({ N: n, M: m, P: p });
    for (const t of ["N", "M", "P"]) {
      if (res.norm[t] < 0 || res.norm[t] > 100) err(W, `norm ${t}=${res.norm[t]} outside [0,100]`);
      if (!LEVELS.has(res.levels[t])) err(W, `bad level ${res.levels[t]} for norm ${res.norm[t]}`);
    }
    if (!G.SD3_ARCHETYPES[res.archetypeId]) err(W, `sums ${n},${m},${p} → unknown archetypeId ${res.archetypeId}`);
  }
}

// ── Share-codec round-trips ─────────────────────────────────────────
{
  const W = "codec";

  const iqRes = G.computeIqFromDomains({ matrix: 3, verbal: 4, numerical: 2, spatial: 5 });
  const iqEnc = G.encodeShare("iq", iqRes);
  if (iqEnc !== "1i3425") err(W, `iq payload should be 1i3425, got ${iqEnc}`);
  const iqDec = G.decodeShare(iqEnc);
  if (!iqDec || iqDec.testId !== "iq" || iqDec.result.raw !== 14)
    err(W, `iq decode failed (${JSON.stringify(iqDec && { testId: iqDec.testId, raw: iqDec.result?.raw })})`);

  const anEnc = G.encodeShare("analytical", { raw: 17 });
  if (anEnc !== "1a17") err(W, `analytical payload should be 1a17, got ${anEnc}`);
  const anDec = G.decodeShare(anEnc);
  if (!anDec || anDec.result.raw !== 17 || anDec.result.bandIndex !== G.analyticalBandIndex(17))
    err(W, "analytical decode failed");

  const sdRes = G.computeSd3FromSums({ N: 27, M: 35, P: 21 });
  const sdEnc = G.encodeShare("sd3", sdRes);
  if (sdEnc !== "1d273521") err(W, `sd3 payload should be 1d273521, got ${sdEnc}`);
  const sdDec = G.decodeShare(sdEnc);
  if (!sdDec || sdDec.result.sums.N !== 27 || sdDec.result.sums.M !== 35 || sdDec.result.sums.P !== 21)
    err(W, "sd3 decode failed");

  // Boundary payloads survive.
  const zero = G.decodeShare(G.encodeShare("iq", G.computeIqFromDomains({ matrix: 0, verbal: 0, numerical: 0, spatial: 0 })));
  if (!zero || zero.result.raw !== 0) err(W, "iq zero payload failed");
  const full = G.decodeShare(G.encodeShare("analytical", { raw: 25 }));
  if (!full || full.result.raw !== 25) err(W, "analytical max payload failed");

  // Malformed payloads must return null.
  for (const bad of ["", "xx", "2i3425", "1i9425", "1i342", "1a26", "1a5", "1d080808", "1d12345", "1z1234"]) {
    if (G.decodeShare(bad) !== null) err(W, `malformed payload "${bad}" should decode to null`);
  }
}

// ── PDF builder structural check ────────────────────────────────────
{
  const W = "pdf";
  const fakeJpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4, 0xff, 0xd9]);
  const bytes = G.buildMinimalPdf(fakeJpeg, 100, 80);
  const text = Buffer.from(bytes).toString("latin1");
  if (!text.startsWith("%PDF-1.4")) err(W, "missing %PDF-1.4 header");
  if (!text.trimEnd().endsWith("%%EOF")) err(W, "missing %%EOF trailer");
  const sx = /startxref\n(\d+)\n%%EOF$/.exec(text.trimEnd());
  if (!sx) err(W, "missing startxref");
  else if (text.slice(Number(sx[1]), Number(sx[1]) + 4) !== "xref") err(W, "startxref does not point at the xref table");
  const xrefEntries = /xref\n0 6\n0000000000 65535 f \n((?:\d{10} 00000 n \n){5})/.exec(text);
  if (!xrefEntries) err(W, "malformed xref table");
  else {
    xrefEntries[1].trimEnd().split("\n").forEach((line, i) => {
      const off = Number(line.slice(0, 10));
      const expect = `${i + 1} 0 obj`;
      if (text.slice(off, off + expect.length) !== expect)
        err(W, `xref offset for object ${i + 1} does not point at "${expect}"`);
    });
  }
  if (!text.includes("/Filter /DCTDecode")) err(W, "image XObject is not DCTDecode");
}

if (errors) {
  console.error(`\nFAIL: ${errors} error(s) in assessment data/scoring`);
  process.exit(1);
}
console.log("OK: assessments valid (20 IQ · 25 analytical · 27 SD-3, scoring + codec + pdf sane)");
