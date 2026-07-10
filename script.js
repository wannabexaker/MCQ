let progress = { answered: {}, correct: 0, total: 0 };
let shuffleMode = false;
let shuffleAnswersMode = false;
let examMode = false;
let godlikeMode = false;

function loadProgress() {
  const saved = localStorage.getItem("quiz-progress");
  if (saved) progress = JSON.parse(saved);
}
function saveProgress() {
  localStorage.setItem("quiz-progress", JSON.stringify(progress));
}

let ANSWER_KEY = Object.freeze({});
let CURRENT_DATA = [];
let currentLang = "en";
let ORIGINAL_ANSWERS = Object.freeze({});
let SOURCE_DEFINITIONS = [];
let ACTIVE_SOURCE_IDS = new Set();
let CATEGORY_DEFINITIONS = [];
let ACTIVE_CATEGORY_KEYS = new Set();
let DATA_WARNINGS = [];
let DEDUPE_REMOVED_DETAILS = [];

const DEFAULT_SOURCE_ID = "default-questions";
const DEFAULT_SOURCE_LABEL = "Questions";
const SOURCE_FILE_PATTERN = /^q_.*\.json$/i;
const EXCLUDED_SOURCE_FILES = new Set([
  "questions.json",
  "q_uestions.json",
  "questions_example.json",
  "q_otieinai.json",
]);
const SOURCE_INDEX_FILE = "sources_index.json";
const SOURCE_LABEL_OVERRIDES = {};
const IMPORTED_SOURCES_STORAGE_KEY = "imported-question-sources-v1";
const QUESTION_STATS_STORAGE_KEY = "question-stats-v1";
const TEST_HISTORY_STORAGE_KEY = "test-history-v1";
const PRACTICE_MODE_STORAGE_KEY = "practice-mode-v1";
const ACTIVITY_LOG_STORAGE_KEY = "activity-log-v1";
const AUDIO_PREFS_STORAGE_KEY = "audio-prefs-v1";
const ACTIVITY_LOG_MAX = 5000;

/* ═══════════════════════════════════════════════════════════════
   ACTIVITY LOG — tamper-evident record of every monitored event.
   Used for proctoring: an instructor can review what the student
   did and when (answers, reveals, mode toggles, off-screen blurs).
   Ring buffer in localStorage, capped at ACTIVITY_LOG_MAX entries.
   ═══════════════════════════════════════════════════════════════ */
let __activityLogCache = null;
function _readActivityLog() {
  if (__activityLogCache) return __activityLogCache;
  try {
    const raw = localStorage.getItem(ACTIVITY_LOG_STORAGE_KEY);
    __activityLogCache = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(__activityLogCache)) __activityLogCache = [];
  } catch {
    __activityLogCache = [];
  }
  return __activityLogCache;
}
function _writeActivityLog() {
  if (!__activityLogCache) return;
  try {
    localStorage.setItem(ACTIVITY_LOG_STORAGE_KEY, JSON.stringify(__activityLogCache));
  } catch (e) {
    // Storage quota exceeded → drop oldest 25% and retry once.
    __activityLogCache.splice(0, Math.floor(__activityLogCache.length * 0.25));
    try {
      localStorage.setItem(ACTIVITY_LOG_STORAGE_KEY, JSON.stringify(__activityLogCache));
    } catch {}
  }
}
function logActivity(type, detail) {
  const log = _readActivityLog();
  const entry = {
    t: Date.now(),
    type,
    detail: detail || null,
  };
  log.push(entry);
  if (log.length > ACTIVITY_LOG_MAX) log.splice(0, log.length - ACTIVITY_LOG_MAX);
  _writeActivityLog();
  // Play a proctor tone (if enabled) and refresh viewer if open.
  playEventSound(type, detail);
  renderActivityLogIfOpen();
  return entry;
}
function getActivityLog() { return _readActivityLog().slice(); }
function clearActivityLog() {
  __activityLogCache = [];
  try { localStorage.removeItem(ACTIVITY_LOG_STORAGE_KEY); } catch {}
  renderActivityLogIfOpen();
}

/* ═══════════════════════════════════════════════════════════════
   PROCTOR AUDIO — Web Audio synth, no assets. Distinct tone per
   event so a supervisor can hear what's happening without looking
   at the screen. Default OFF, opt-in via Settings → Test → Audio.
   ═══════════════════════════════════════════════════════════════ */
let __audioCtx = null;
let __audioPrefs = null;
function _readAudioPrefs() {
  if (__audioPrefs) return __audioPrefs;
  try {
    const raw = localStorage.getItem(AUDIO_PREFS_STORAGE_KEY);
    __audioPrefs = raw ? JSON.parse(raw) : { enabled: false, volume: 0.6 };
  } catch {
    __audioPrefs = { enabled: false, volume: 0.6 };
  }
  return __audioPrefs;
}
function _writeAudioPrefs() {
  try { localStorage.setItem(AUDIO_PREFS_STORAGE_KEY, JSON.stringify(__audioPrefs)); } catch {}
}
function setAudioEnabled(on) {
  _readAudioPrefs();
  __audioPrefs.enabled = !!on;
  _writeAudioPrefs();
}
function setAudioVolume(v) {
  _readAudioPrefs();
  __audioPrefs.volume = Math.max(0, Math.min(1, Number(v) || 0));
  _writeAudioPrefs();
}
function _ensureAudioCtx() {
  if (__audioCtx) return __audioCtx;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  try { __audioCtx = new Ctx(); } catch { return null; }
  return __audioCtx;
}
function _playTone(freq, durationMs, opts = {}) {
  const prefs = _readAudioPrefs();
  if (!prefs.enabled) return;
  const ctx = _ensureAudioCtx();
  if (!ctx) return;
  try {
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = opts.type || "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (opts.glideTo) {
      osc.frequency.exponentialRampToValueAtTime(
        opts.glideTo,
        ctx.currentTime + durationMs / 1000
      );
    }
    const peak = Math.max(0.0001, prefs.volume * (opts.gain ?? 0.25));
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(peak, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000 + 0.02);
  } catch {}
}
function _playSequence(steps) {
  let acc = 0;
  steps.forEach((s) => {
    setTimeout(() => _playTone(s.freq, s.dur, s.opts || {}), acc);
    acc += s.gap ?? s.dur;
  });
}
// Distinct timbres per event so a listener can tell them apart.
const PROCTOR_TONES = {
  "answer":          () => _playTone(660, 80,  { type: "sine",     gain: 0.18 }),
  "reveal":          () => _playSequence([
                        { freq: 880, dur: 120, opts: { type: "square", gain: 0.18 } },
                        { freq: 990, dur: 160, opts: { type: "square", gain: 0.18 } },
                      ]),
  "mode-exam-on":    () => _playSequence([
                        { freq: 220, dur: 140, opts: { type: "triangle" } },
                        { freq: 165, dur: 220, opts: { type: "triangle" } },
                      ]),
  "mode-exam-off":   () => _playSequence([
                        { freq: 165, dur: 140, opts: { type: "triangle" } },
                        { freq: 220, dur: 220, opts: { type: "triangle" } },
                      ]),
  "mode-god-on":     () => _playSequence([
                        { freq: 523, dur: 90,  opts: { type: "square" } },
                        { freq: 659, dur: 90,  opts: { type: "square" } },
                        { freq: 784, dur: 160, opts: { type: "square" } },
                      ]),
  "mode-god-off":    () => _playSequence([
                        { freq: 784, dur: 90,  opts: { type: "square" } },
                        { freq: 659, dur: 90,  opts: { type: "square" } },
                        { freq: 523, dur: 160, opts: { type: "square" } },
                      ]),
  "mode-practice":   () => _playSequence([
                        { freq: 392, dur: 110, opts: { type: "sine" } },
                        { freq: 587, dur: 160, opts: { type: "sine" } },
                      ]),
  "reset":           () => _playSequence([
                        { freq: 440, dur: 90,  opts: { type: "sawtooth" } },
                        { freq: 330, dur: 90,  opts: { type: "sawtooth" } },
                        { freq: 220, dur: 200, opts: { type: "sawtooth" } },
                      ]),
  "submit":          () => _playSequence([
                        { freq: 523, dur: 110 },
                        { freq: 659, dur: 110 },
                        { freq: 784, dur: 240 },
                      ]),
  "source":          () => _playTone(523, 100, { type: "triangle", gain: 0.15 }),
  // Cheat-indicator sounds: prominent, alarm-style.
  "blur":            () => _playSequence([
                        { freq: 196, dur: 200, opts: { type: "sawtooth", gain: 0.35 } },
                        { freq: 196, dur: 200, opts: { type: "sawtooth", gain: 0.35 }, gap: 260 },
                      ]),
  "focus":           () => _playTone(330, 90, { type: "triangle", gain: 0.12 }),
  // Timer tones.
  "timer-tick":      () => _playTone(1200, 50, { type: "sine", gain: 0.15 }),
  "timer-fire":      () => _playSequence([
                        { freq: 880, dur: 150, opts: { type: "square", gain: 0.35 } },
                        { freq: 880, dur: 150, opts: { type: "square", gain: 0.35 }, gap: 200 },
                        { freq: 880, dur: 300, opts: { type: "square", gain: 0.35 } },
                      ]),
  "test":            () => _playSequence([
                        { freq: 440, dur: 100 },
                        { freq: 660, dur: 100 },
                        { freq: 880, dur: 160 },
                      ]),
};
function playEventSound(type, detail) {
  // Map activity-log types to tone keys.
  let key = type;
  if (type === "mode") {
    const n = detail?.name;
    const on = detail?.state === "on";
    if (n === "exam")     key = on ? "mode-exam-on"     : "mode-exam-off";
    else if (n === "god") key = on ? "mode-god-on"      : "mode-god-off";
    else if (n === "practice") key = "mode-practice";
  }
  const fn = PROCTOR_TONES[key];
  if (typeof fn === "function") {
    try { fn(); } catch {}
  }
}

/* ═══════════════════════════════════════════════════════════════
   CLEAR-ALL — wipes every mcq-data localStorage key and reloads.
   Bundled q_*.json files stay intact (they ship with the app);
   imported sets, progress, stats, history, modes, log are gone.
   ═══════════════════════════════════════════════════════════════ */
const MCQ_STORAGE_KEYS = [
  "quiz-progress",
  IMPORTED_SOURCES_STORAGE_KEY,
  QUESTION_STATS_STORAGE_KEY,
  TEST_HISTORY_STORAGE_KEY,
  PRACTICE_MODE_STORAGE_KEY,
  ACTIVITY_LOG_STORAGE_KEY,
  AUDIO_PREFS_STORAGE_KEY,
  "exam-mode-v1",
  "godlike-mode-v1",
  "shuffle-mode-v1",
  "shuffle-answers-v1",
  "lang-v1",
  "theme-v1",
  "timer-position-v1",
  "controls-position-v1",
  "widgets-position-v1",
  "qa-font-size-v1",
  "controls-layout-v1",
];
function wipeAllMcqStorage() {
  // Be defensive: remove known keys explicitly, then sweep anything that
  // starts with our prefixes in case future versions added more.
  MCQ_STORAGE_KEYS.forEach((k) => { try { localStorage.removeItem(k); } catch {} });
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (
        k.startsWith("quiz-") ||
        k.startsWith("imported-") ||
        k.startsWith("question-stats") ||
        k.startsWith("test-history") ||
        k.startsWith("practice-mode") ||
        k.startsWith("activity-log") ||
        k.startsWith("audio-prefs") ||
        k.endsWith("-position-v1") ||
        k.endsWith("-mode-v1")
      ) {
        try { localStorage.removeItem(k); } catch {}
      }
    }
  } catch {}
}
const CATEGORY_LABEL_OVERRIDES = {};
const DUPLICATE_STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "to",
  "of",
  "for",
  "in",
  "on",
  "by",
  "with",
  "from",
  "that",
  "this",
  "which",
  "what",
  "who",
  "when",
  "where",
  "why",
  "how",
  "is",
  "are",
  "was",
  "were",
  "be",
  "as",
  "it",
]);

function getQuestionId(question) {
  return String(question?.__qid ?? question?.number ?? "");
}

function getStatsKey(question) {
  const src = String(question?.__sourceFile || question?.__sourceLabel || "unknown");
  const qid = typeof question?.id === "string" && question.id.trim()
    ? question.id.trim()
    : String(Number.isInteger(question?.number) ? question.number : getQuestionId(question));
  return `${src}:${qid}`;
}

function loadQuestionStats() {
  try {
    const raw = localStorage.getItem(QUESTION_STATS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveQuestionStats(stats) {
  try {
    localStorage.setItem(QUESTION_STATS_STORAGE_KEY, JSON.stringify(stats || {}));
  } catch (e) {
    console.warn("Failed to save question stats:", e);
  }
}

function recordQuestionAttempt(question, isCorrect) {
  const stats = loadQuestionStats();
  const key = getStatsKey(question);
  const now = new Date().toISOString();
  const cur = stats[key] || { attempts: 0, correct: 0, wrong: 0, lastAt: null };
  cur.attempts = (cur.attempts || 0) + 1;
  if (isCorrect) cur.correct = (cur.correct || 0) + 1;
  else cur.wrong = (cur.wrong || 0) + 1;
  cur.lastAt = now;
  stats[key] = cur;
  saveQuestionStats(stats);
}

function loadTestHistory() {
  try {
    const raw = localStorage.getItem(TEST_HISTORY_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveTestHistory(history) {
  try {
    localStorage.setItem(TEST_HISTORY_STORAGE_KEY, JSON.stringify(history || []));
  } catch (e) {
    console.warn("Failed to save test history:", e);
  }
}

function addHistoryEntry(entry) {
  const hist = loadTestHistory();
  hist.unshift(entry);
  hist.splice(10);
  saveTestHistory(hist);
}

function getPracticeMode() {
  const raw = String(localStorage.getItem(PRACTICE_MODE_STORAGE_KEY) || "").toLowerCase();
  if (raw === "wrong_once") return "wrong_once";
  if (raw === "wrong_repeat") return "wrong_repeat";
  return "off";
}

function setPracticeMode(mode) {
  const normalized = mode === "wrong_once" || mode === "wrong_repeat" ? mode : "off";
  const prev = (typeof localStorage !== "undefined" && localStorage.getItem(PRACTICE_MODE_STORAGE_KEY)) || "off";
  localStorage.setItem(PRACTICE_MODE_STORAGE_KEY, normalized);
  if (prev !== normalized) {
    logActivity("mode", { name: "practice", state: normalized });
  }
}

function loadImportedSourcesFromStorage() {
  try {
    const raw = localStorage.getItem(IMPORTED_SOURCES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn("Failed to load imported sources from storage:", e);
    return [];
  }
}

function saveImportedSourcesToStorage(sources) {
  try {
    localStorage.setItem(
      IMPORTED_SOURCES_STORAGE_KEY,
      JSON.stringify(Array.isArray(sources) ? sources : [])
    );
    return true;
  } catch (e) {
    console.warn("Failed to save imported sources to storage:", e);
    DATA_WARNINGS.push(
      "Could not save imported questions (storage full or blocked). Try fewer questions or export and re-import later."
    );
    return false;
  }
}

function getImportedSources() {
  return loadImportedSourcesFromStorage();
}

function upsertImportedSource(source) {
  const list = getImportedSources();
  const idx = list.findIndex((s) => s && s.id === source.id);
  if (idx >= 0) list[idx] = source;
  else list.push(source);
  return saveImportedSourcesToStorage(list);
}

function deleteImportedSource(sourceId) {
  const list = getImportedSources().filter((s) => s && s.id !== sourceId);
  return saveImportedSourcesToStorage(list);
}

function renderImportedSourcesList() {
  const host = document.getElementById("importedSourcesList");
  if (!host) return;
  const imports = getImportedSources();
  if (!imports.length) {
    host.innerHTML = `<div class="source-filter-item-meta">No imported sources yet.</div>`;
    return;
  }

  host.innerHTML = "";
  imports.forEach((src) => {
    const row = document.createElement("div");
    row.className = "imported-source-row";
    const title = document.createElement("div");
    title.className = "imported-source-title";
    title.textContent = src.label || src.fileName || src.id || "Imported";
    const meta = document.createElement("div");
    meta.className = "imported-source-meta";
    meta.textContent = `${Array.isArray(src.questions) ? src.questions.length : 0} Q`;
    const actions = document.createElement("div");
    actions.className = "imported-source-actions";

    const btnRename = document.createElement("button");
    btnRename.textContent = "Rename";
    btnRename.addEventListener("click", () => promptRenameImportedSource(src.id));

    const btnEdit = document.createElement("button");
    btnEdit.textContent = "Edit";
    btnEdit.addEventListener("click", () => openJsonEditorForImportedSource(src.id));

    const btnExport = document.createElement("button");
    btnExport.textContent = "Export";
    btnExport.addEventListener("click", () => exportImportedSource(src.id));

    const btnDelete = document.createElement("button");
    btnDelete.textContent = "Delete";
    btnDelete.addEventListener("click", () => confirmDeleteImportedSource(src.id));

    actions.append(btnRename, btnEdit, btnExport, btnDelete);
    row.append(title, meta, actions);
    host.appendChild(row);
  });
}

function toCategoryLabel(key) {
  if (CATEGORY_LABEL_OVERRIDES[key]) return CATEGORY_LABEL_OVERRIDES[key];
  return key;
}

function buildCategoryDefinitions(items) {
  const skip = new Set([
    "number",
    "question_en",
    "question_el",
    "choices_en",
    "choices_el",
    "correctIndex",
    "image",
    "image_answers",
    "code",
    "id",
    "__sourceId",
    "__sourceLabel",
    "__qid",
  ]);
  const keys = new Set();
  items.forEach((q) => {
    if (!q || typeof q !== "object") return;
    Object.entries(q).forEach(([k, v]) => {
      if (skip.has(k)) return;
      if (typeof v === "boolean" && v === true) keys.add(k);
    });
  });
  return [...keys]
    .sort((a, b) => a.localeCompare(b))
    .map((key) => ({ key, label: toCategoryLabel(key) }));
}

function showDataWarnings() {
  const host = document.getElementById("dataWarnings");
  if (!host) return;
  if (!DATA_WARNINGS.length && DEDUPE_REMOVED_DETAILS.length === 0) {
    host.hidden = true;
    host.innerHTML = "";
    return;
  }
  host.hidden = false;
  const warningHtml = DATA_WARNINGS
    .map((w) => `<div class="data-warning-item">⚠ ${escapeHTML(w)}</div>`)
    .join("");
  const dedupeHtml =
    DEDUPE_REMOVED_DETAILS.length > 0
      ? `
      <details class="data-warning-item data-warning-details">
        <summary>Show more ▾</summary>
        <ul class="data-warning-list">
          ${DEDUPE_REMOVED_DETAILS.map(
            (d) =>
              `<li><strong>Removed</strong> (${escapeHTML(d.droppedSourceLabel)}): ${escapeHTML(
                d.droppedQuestion
              )}<br><strong>Kept</strong> (${escapeHTML(d.keptSourceLabel)}): ${escapeHTML(
                d.keptQuestion
              )}</li>`
          ).join("")}
        </ul>
      </details>
    `
      : "";
  host.innerHTML = warningHtml + dedupeHtml;
}

function sourceLabelFromFile(file) {
  return file.replace(/^q_/i, "").replace(/\.json$/i, "");
}

function sourceTagKeyFromFile(file) {
  return file
    .replace(/^q[_-]/i, "")
    .replace(/\.json$/i, "")
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function validateQuestionsStructure(file, data) {
  const errors = [];
  const coreKeys = new Set([
    "number",
    "question_en",
    "question_el",
    "choices_en",
    "choices_el",
    "correctIndex",
    "image",
    "image_answers",
    "code",
    "id",
  ]);
  if (!Array.isArray(data)) {
    errors.push(`${file}: root must be an array.`);
    return { valid: false, errors };
  }
  data.forEach((q, i) => {
    const ref = `${file} item ${i + 1}`;
    // Template/guide records are allowed in templates; they are ignored by the app.
    if (q && typeof q === "object" && q.__template === true) return;
    if (!q || typeof q !== "object") errors.push(`${ref}: must be an object.`);
    if (!Number.isInteger(q?.number)) errors.push(`${ref}: "number" must be integer.`);
    if (typeof q?.question_en !== "string" || !q.question_en.trim()) {
      errors.push(`${ref}: "question_en" must be non-empty string.`);
    }
    if (!Array.isArray(q?.choices_en) || q.choices_en.length < 2) {
      errors.push(`${ref}: "choices_en" must be array with at least 2 options.`);
    }
    if (!Number.isInteger(q?.correctIndex)) {
      errors.push(`${ref}: "correctIndex" must be integer.`);
    } else if (Array.isArray(q?.choices_en)) {
      if (q.correctIndex < 0 || q.correctIndex >= q.choices_en.length) {
        errors.push(
          `${ref}: "correctIndex" out of range (${q.correctIndex}/${q.choices_en.length}).`
        );
      }
    }

    // Require at least one boolean category tag to guarantee filter visibility.
    const hasCategoryTag = Object.entries(q || {}).some(
      ([key, value]) => !coreKeys.has(key) && typeof value === "boolean" && value === true
    );
    if (!hasCategoryTag) {
      errors.push(`${ref}: missing category tag (e.g. "generalGK": true).`);
    }
  });
  return { valid: errors.length === 0, errors };
}

function hasAnyBooleanCategoryTag(question) {
  const coreKeys = new Set([
    "number",
    "question_en",
    "question_el",
    "choices_en",
    "choices_el",
    "correctIndex",
    "image",
    "image_answers",
    "code",
    "id",
    "__sourceId",
    "__sourceLabel",
    "__qid",
  ]);
  return Object.entries(question || {}).some(
    ([key, value]) =>
      !coreKeys.has(key) && typeof value === "boolean" && value === true
  );
}

function normalizeComparableText(text) {
  return String(text ?? "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeAnswerText(text) {
  return normalizeComparableText(text)
    .replace(/\bpid\b/g, "project initiation documentation")
    .replace(/\bproduct based\b/g, "products")
    .replace(/\bhappened\b/g, "occurred")
    .replace(/\bhas already happened\b/g, "has already occurred");
}

function tokenizeComparableText(text) {
  return new Set(
    normalizeComparableText(text)
      .split(" ")
      .filter((w) => w.length > 2 && !DUPLICATE_STOP_WORDS.has(w))
  );
}

function jaccardSimilarity(aText, bText) {
  const a = tokenizeComparableText(aText);
  const b = tokenizeComparableText(bText);
  if (a.size === 0 && b.size === 0) return 1;
  let intersection = 0;
  a.forEach((token) => {
    if (b.has(token)) intersection += 1;
  });
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function overlapCoefficient(aText, bText) {
  const a = tokenizeComparableText(aText);
  const b = tokenizeComparableText(bText);
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  a.forEach((token) => {
    if (b.has(token)) intersection += 1;
  });
  return intersection / Math.min(a.size, b.size);
}

function getCorrectAnswerText(question) {
  if (!question || !Array.isArray(question.choices_en)) return "";
  if (!Number.isInteger(question.correctIndex)) return "";
  return question.choices_en[question.correctIndex] || "";
}

function areQuestionsDuplicateByMeaning(a, b) {
  const qA = normalizeComparableText(a?.question_en);
  const qB = normalizeComparableText(b?.question_en);
  if (!qA || !qB) return false;
  if (qA === qB) return true;

  const qSimilarity = jaccardSimilarity(qA, qB);
  const qOverlap = overlapCoefficient(qA, qB);
  if (qSimilarity >= 0.92) return true;

  const aAnswer = normalizeAnswerText(getCorrectAnswerText(a));
  const bAnswer = normalizeAnswerText(getCorrectAnswerText(b));
  const sameAnswer = aAnswer && bAnswer ? aAnswer === bAnswer : false;
  const answerSimilarity = jaccardSimilarity(aAnswer, bAnswer);

  if (qOverlap >= 0.9 && (sameAnswer || answerSimilarity >= 0.45)) return true;
  return qSimilarity >= 0.78 && (sameAnswer || answerSimilarity >= 0.5);
}

function getQuestionQualityScore(question) {
  const qLen = normalizeComparableText(question?.question_en).length;
  const aLen = normalizeAnswerText(getCorrectAnswerText(question)).length;
  return qLen + aLen;
}

function dedupeQuestions(items) {
  function mergeTrueBooleanTags(primary, secondary) {
    const merged = { ...primary };
    Object.entries(secondary || {}).forEach(([key, value]) => {
      if (
        typeof value === "boolean" &&
        value === true &&
        !key.startsWith("__")
      ) {
        merged[key] = true;
      }
    });
    return merged;
  }

  const kept = [];
  const removedBySource = new Map();
  const removedPairs = [];

  items.forEach((candidate) => {
    let duplicateIndex = -1;

    // 1) Hard exact-duplicate check on normalized question text.
    const candidateQuestionKey = normalizeComparableText(candidate?.question_en);
    if (candidateQuestionKey) {
      for (let i = 0; i < kept.length; i += 1) {
        if (normalizeComparableText(kept[i]?.question_en) === candidateQuestionKey) {
          duplicateIndex = i;
          break;
        }
      }
    }

    // 2) Semantic duplicate check (same meaning), only if exact text did not match.
    if (duplicateIndex === -1) {
      for (let i = 0; i < kept.length; i += 1) {
        if (areQuestionsDuplicateByMeaning(candidate, kept[i])) {
          duplicateIndex = i;
          break;
        }
      }
    }

    if (duplicateIndex === -1) {
      kept.push(candidate);
      return;
    }

    const existing = kept[duplicateIndex];
    const keepCandidate =
      getQuestionQualityScore(candidate) > getQuestionQualityScore(existing);
    const dropped = keepCandidate ? existing : candidate;
    const baseSurvivor = keepCandidate ? candidate : existing;
    const mergedSurvivor = mergeTrueBooleanTags(
      mergeTrueBooleanTags(baseSurvivor, existing),
      candidate
    );
    kept[duplicateIndex] = mergedSurvivor;

    const droppedSource = dropped.__sourceId || "unknown";
    removedBySource.set(droppedSource, (removedBySource.get(droppedSource) || 0) + 1);
    removedPairs.push({
      keptQid: getQuestionId(mergedSurvivor),
      droppedQid: getQuestionId(dropped),
      sourceId: droppedSource,
      keptSourceId: mergedSurvivor.__sourceId || "unknown",
      keptQuestion: mergedSurvivor.question_en || "",
      droppedQuestion: dropped.question_en || "",
    });
  });

  return {
    items: kept,
    removedCount: items.length - kept.length,
    removedBySource,
    removedPairs,
  };
}

function buildAnswerKey(items) {
  return Object.freeze(
    items.reduce((acc, q) => {
      if (
        q &&
        Number.isInteger(q.number) &&
        Number.isInteger(q.correctIndex) &&
        q.correctIndex >= 0
      ) {
        acc[getQuestionId(q)] = q.correctIndex;
      }
      return acc;
    }, {})
  );
}

function buildOriginalAnswers(items) {
  return Object.freeze(
    items.reduce((acc, q) => {
      if (!q || !Number.isInteger(q.number) || !Array.isArray(q.choices_en)) {
        return acc;
      }
      acc[getQuestionId(q)] = {
        choices_en: [...q.choices_en],
        correctIndex: Number.isInteger(q.correctIndex) ? q.correctIndex : null,
      };
      return acc;
    }, {})
  );
}

function setDataSource(items) {
  CURRENT_DATA = Array.isArray(items) ? items : [];
  ANSWER_KEY = buildAnswerKey(CURRENT_DATA);
  ORIGINAL_ANSWERS = buildOriginalAnswers(CURRENT_DATA);
  CATEGORY_DEFINITIONS = buildCategoryDefinitions(CURRENT_DATA);
  ACTIVE_CATEGORY_KEYS = new Set(CATEGORY_DEFINITIONS.map((c) => c.key));
}

async function loadQuestionData() {
  async function discoverQuestionFilesFromDirectory() {
    try {
      const response = await fetch("./", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Failed to list directory (${response.status})`);
      }
      const html = await response.text();
      const hrefs = [...html.matchAll(/href="([^"]+)"/gi)].map((m) => m[1]);
      const files = hrefs
        .map((h) => decodeURIComponent(h).replace(/^\.\//, ""))
        .filter((h) => SOURCE_FILE_PATTERN.test(h))
        .filter((h) => !EXCLUDED_SOURCE_FILES.has(h.toLowerCase()))
        .map((h) => h.split("/").pop());
      return [...new Set(files)].sort((a, b) => a.localeCompare(b));
    } catch (error) {
      console.warn("Directory auto-discovery failed:", error);
      return [];
    }
  }

  async function discoverQuestionFilesFromIndex() {
    try {
      const response = await fetch(SOURCE_INDEX_FILE, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Failed to load ${SOURCE_INDEX_FILE} (${response.status})`);
      }
      const index = await response.json();
      if (!index || !Array.isArray(index.files)) {
        throw new Error(`${SOURCE_INDEX_FILE} must contain: { files: string[] }`);
      }
      const files = index.files
        .map((name) => String(name || "").trim())
        .filter(Boolean)
        .filter((name) => SOURCE_FILE_PATTERN.test(name))
        .filter((name) => !EXCLUDED_SOURCE_FILES.has(name.toLowerCase()));
      return [...new Set(files)].sort((a, b) => a.localeCompare(b));
    } catch (error) {
      console.warn("Index discovery failed:", error);
      return [];
    }
  }

  try {
    DATA_WARNINGS = [];
    DEDUPE_REMOVED_DETAILS = [];
    if (typeof location !== "undefined" && location.protocol === "file:") {
      DATA_WARNINGS.push(
        "You opened index.html via file://. Browsers block fetch() for local JSON files, so q_*.json auto-loading may not work. Recommended: run via Docker or a local web server. Import will still work."
      );
    }
    const discoveredFromDirectory = await discoverQuestionFilesFromDirectory();
    const discoveredFromIndex =
      discoveredFromDirectory.length > 0 ? [] : await discoverQuestionFilesFromIndex();
      const sourceFiles =
      discoveredFromDirectory.length > 0 ? discoveredFromDirectory : discoveredFromIndex;

    const importedFallback = getImportedSources().filter(
      (s) => s && Array.isArray(s.questions) && s.questions.length > 0
    );

    if (sourceFiles.length === 0 && importedFallback.length === 0) {
      DATA_WARNINGS.push(
        `No q_*.json source files discovered. Ensure files exist and ${SOURCE_INDEX_FILE} is updated.`
      );
      throw new Error("No source files discovered");
    }

    if (sourceFiles.length === 0 && importedFallback.length > 0) {
      DATA_WARNINGS.push(
        "No q_*.json files could be discovered/loaded, but imported sources were found. Loading imported sources only."
      );
    }

    if (discoveredFromDirectory.length === 0) {
      DATA_WARNINGS.push(
        `Loaded sources via ${SOURCE_INDEX_FILE} because directory listing is unavailable.`
      );
    }

    const sources = sourceFiles.map((file, index) => {
      const label = sourceLabelFromFile(file);
      const tagKey = sourceTagKeyFromFile(file);
      return {
        id: `source-${index + 1}-${file.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`,
        label,
        tagKey,
        file,
        type: "file",
        enabled: true,
      };
    });

    const imported = importedFallback;
    imported.forEach((imp) => {
      sources.push({
        id: String(imp.id),
        label: String(imp.label || sourceLabelFromFile(imp.fileName || "imported")),
        tagKey: String(imp.tagKey || sourceTagKeyFromFile(imp.fileName || "imported")),
        file: String(imp.fileName || "imported.json"),
        type: "import",
        enabled: true,
        inlineQuestions: imp.questions,
      });
    });

    const loadedSources = [];
    const mergedQuestions = [];

    for (const source of sources) {
      try {
        const data =
          source.type === "import"
            ? source.inlineQuestions
            : await (async () => {
                const response = await fetch(source.file, { cache: "no-store" });
                if (!response.ok) {
                  throw new Error(`Failed to load ${source.file} (${response.status})`);
                }
                return await response.json();
              })();
        const validation = validateQuestionsStructure(source.file, data);
        if (!validation.valid) {
          DATA_WARNINGS.push(
            `${source.file} has invalid JSON structure and was skipped.`
          );
          console.warn(
            `Invalid structure in ${source.file}:`,
            validation.errors.slice(0, 20)
          );
          continue;
        }

        loadedSources.push({
          id: source.id,
          label: source.label,
          file: source.file,
          enabled: source.enabled,
          count: data.length,
        });

        data.forEach((q, idx) => {
          if (!q || typeof q !== "object") return;
          if (q.__template === true) return;
          const withAutoSourceTag = { ...q };
          // Add source-derived category only when question has no explicit category tag.
          if (source.tagKey && !hasAnyBooleanCategoryTag(withAutoSourceTag)) {
            withAutoSourceTag[source.tagKey] = true;
          }
            mergedQuestions.push({
              ...withAutoSourceTag,
              __sourceId: source.id,
              __sourceLabel: source.label,
              __sourceFile: source.file,
              __qid:
                typeof withAutoSourceTag.id === "string" && withAutoSourceTag.id.trim()
                  ? `${source.id}:${withAutoSourceTag.id.trim()}`
                  : `${source.id}:${Number.isInteger(withAutoSourceTag.number) ? withAutoSourceTag.number : idx + 1}:${idx}`,
            });
        });
      } catch (sourceError) {
        console.warn(`Skipping source ${source.file}:`, sourceError);
      }
    }

    if (mergedQuestions.length === 0) {
      throw new Error("No valid questions loaded from configured sources");
    }

    const deduped = dedupeQuestions(mergedQuestions);
    const dedupedQuestions = deduped.items;
    if (deduped.removedCount > 0) {
      const breakdown = [...deduped.removedBySource.entries()]
        .map(([sourceId, count]) => {
          const source = loadedSources.find((s) => s.id === sourceId);
          return `${source?.label || sourceId}: ${count}`;
        })
        .join("; ");
      DATA_WARNINGS.push(
        `Removed ${deduped.removedCount} duplicate or same-meaning questions automatically. ${breakdown}`
      );
      DEDUPE_REMOVED_DETAILS = deduped.removedPairs.map((entry) => {
        const droppedSource = loadedSources.find((s) => s.id === entry.sourceId);
        const keptSource = loadedSources.find((s) => s.id === entry.keptSourceId);
        return {
          droppedSourceLabel: droppedSource?.label || entry.sourceId || "unknown",
          keptSourceLabel: keptSource?.label || entry.keptSourceId || "unknown",
          droppedQuestion: entry.droppedQuestion || "",
          keptQuestion: entry.keptQuestion || "",
        };
      });
    }

    const countsBySource = new Map();
    dedupedQuestions.forEach((q) => {
      const id = q.__sourceId || "unknown";
      countsBySource.set(id, (countsBySource.get(id) || 0) + 1);
    });
    loadedSources.forEach((source) => {
      source.rawCount = source.count;
      source.count = countsBySource.get(source.id) || 0;
    });

    SOURCE_DEFINITIONS = loadedSources;
    ACTIVE_SOURCE_IDS = new Set(
      loadedSources
        .filter((s) => s.enabled)
        .map((s) => s.id)
    );
    if (ACTIVE_SOURCE_IDS.size === 0) {
      loadedSources.forEach((s) => ACTIVE_SOURCE_IDS.add(s.id));
    }

    return dedupedQuestions;
  } catch (error) {
    const imported = getImportedSources().filter(
      (s) => s && Array.isArray(s.questions) && s.questions.length > 0
    );
    const fallbackData = Array.isArray(globalThis.DATA) ? globalThis.DATA : [];
    console.warn("Using fallback question source:", error);
    if (imported.length === 0) {
      DATA_WARNINGS.push("No valid q*.json source loaded. Fallback data was used.");
    } else {
      DATA_WARNINGS.push("q_*.json sources could not be loaded. Imported sources were used.");
    }

    const fallbackDefs = [];
    const mergedQuestions = [];
    if (fallbackData.length > 0) {
      fallbackDefs.push({
        id: DEFAULT_SOURCE_ID,
        label: DEFAULT_SOURCE_LABEL,
        file: "pc_devskills_en.js",
        enabled: true,
        count: fallbackData.length,
      });
      fallbackData.forEach((q, idx) => {
        mergedQuestions.push({
          ...q,
          __sourceId: DEFAULT_SOURCE_ID,
          __sourceLabel: DEFAULT_SOURCE_LABEL,
          __sourceFile: "pc_devskills_en.js",
          __qid:
            typeof q?.id === "string" && q.id.trim()
              ? `${DEFAULT_SOURCE_ID}:${q.id.trim()}`
              : `${DEFAULT_SOURCE_ID}:${Number.isInteger(q?.number) ? q.number : idx + 1}:${idx}`,
        });
      });
    }

    imported.forEach((imp) => {
      const sourceId = String(imp.id);
      const label = String(imp.label || sourceLabelFromFile(imp.fileName || "imported"));
      const tagKey = String(imp.tagKey || sourceTagKeyFromFile(imp.fileName || "imported"));
      const fileName = String(imp.fileName || "imported.json");
      const data = Array.isArray(imp.questions) ? imp.questions : [];
      fallbackDefs.push({
        id: sourceId,
        label,
        file: fileName,
        enabled: true,
        count: data.length,
      });
      data.forEach((q, idx) => {
        if (!q || typeof q !== "object") return;
        if (q.__template === true) return;
        const withAutoSourceTag = { ...q };
        if (tagKey && !hasAnyBooleanCategoryTag(withAutoSourceTag)) {
          withAutoSourceTag[tagKey] = true;
        }
        mergedQuestions.push({
          ...withAutoSourceTag,
          __sourceId: sourceId,
          __sourceLabel: label,
          __sourceFile: fileName,
          __qid:
            typeof withAutoSourceTag.id === "string" && withAutoSourceTag.id.trim()
              ? `${sourceId}:${withAutoSourceTag.id.trim()}`
              : `${sourceId}:${Number.isInteger(withAutoSourceTag.number) ? withAutoSourceTag.number : idx + 1}:${idx}`,
        });
      });
    });

    if (mergedQuestions.length === 0) {
      SOURCE_DEFINITIONS = [];
      ACTIVE_SOURCE_IDS = new Set();
      return [];
    }

    const deduped = dedupeQuestions(mergedQuestions);
    SOURCE_DEFINITIONS = fallbackDefs;
    ACTIVE_SOURCE_IDS = new Set(fallbackDefs.map((s) => s.id));
    return deduped.items;
  }
}

function setButtonIconLabel(btn, icon, label) {
  if (!btn) return;
  const text = btn.id?.startsWith("m-") ? `${icon} ${label}` : icon;
  btn.textContent = text;
}

function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max);
}

// ---------- Toast notifications (short, non-blocking) ----------
function showToast(message, ms = 2000) {
  const host = document.getElementById("toastHost");
  if (!host) return;
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = String(message || "");
  host.appendChild(toast);
  // Next frame to trigger transition.
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 250);
  }, Math.max(500, ms));
}

function getSourceFilteredItems() {
  const practiceMode = getPracticeMode();
  const stats = practiceMode === "off" ? null : loadQuestionStats();

  const filtered = CURRENT_DATA.filter((q) => {
    if (!ACTIVE_SOURCE_IDS.has(q.__sourceId)) return false;
    if (ACTIVE_CATEGORY_KEYS.size === 0) return true;
    return [...ACTIVE_CATEGORY_KEYS].some((key) => q[key] === true);
  });

  const practiceFiltered =
    practiceMode === "off"
      ? filtered
      : filtered.filter((q) => {
          const st = stats?.[getStatsKey(q)];
          const wrong = Number(st?.wrong || 0);
          if (practiceMode === "wrong_once") return wrong >= 1;
          if (practiceMode === "wrong_repeat") return wrong >= 2;
          return true;
        });

  // Final UI-level guard: hide duplicate/same-meaning questions after all filters.
  const deduped = [];
  const seenExactQuestionKeys = new Set();
  for (const candidate of practiceFiltered) {
    const qKey = normalizeComparableText(candidate?.question_en);
    if (qKey && seenExactQuestionKeys.has(qKey)) {
      continue;
    }

    let isDuplicate = false;
    for (const existing of deduped) {
      if (areQuestionsDuplicateByMeaning(candidate, existing)) {
        isDuplicate = true;
        break;
      }
    }
    if (!isDuplicate) {
      deduped.push(candidate);
      if (qKey) seenExactQuestionKeys.add(qKey);
    }
  }
  return deduped;
}

function updateSourceFilterButtonUI() {
  const btn = document.getElementById("filterCycle");
  const mobileBtn = document.getElementById("m-filterCycle");
  const selectedCount = ACTIVE_SOURCE_IDS.size;
  const totalCount = SOURCE_DEFINITIONS.length;
  const selectedCategories = ACTIVE_CATEGORY_KEYS.size;
  const totalCategories = CATEGORY_DEFINITIONS.length;
  const title = `Sources: ${selectedCount}/${totalCount} | Categories: ${selectedCategories}/${totalCategories}`;

  setButtonIconLabel(btn, "📚", "Sources");
  btn.title = title;
  btn.setAttribute("aria-label", title);

  if (mobileBtn) {
    setButtonIconLabel(
      mobileBtn,
      "📚",
      `Sources ${selectedCount}/${totalCount}`
    );
    mobileBtn.title = title;
    mobileBtn.setAttribute("aria-label", title);
  }
}

function applySourceFilter() {
  updateSourceFilterButtonUI();
  renderQuiz(getSourceFilteredItems());
  updateScoreUI();
}

function sanitizeProgressForCurrentData() {
  const validIds = new Set(CURRENT_DATA.map((q) => getQuestionId(q)));
  const cleanedAnswered = {};
  let total = 0;
  let correct = 0;

  Object.entries(progress.answered || {}).forEach(([id, state]) => {
    if (!validIds.has(id)) return;
    cleanedAnswered[id] = state;
    total += 1;
    if (state?.isCorrect) correct += 1;
  });

  progress = { answered: cleanedAnswered, total, correct };
  saveProgress();
}

function renderSourceChecklist() {
  const container = document.getElementById("sourceFilterChecklist");
  if (!container) return;

  container.innerHTML = "";
  SOURCE_DEFINITIONS.forEach((source) => {
    const item = document.createElement("label");
    item.className = "source-filter-item";
    item.innerHTML = `
      <input type="checkbox" value="${escapeHTML(source.id)}" />
      <span class="source-filter-item-title">${escapeHTML(source.label)}</span>
      <span class="source-filter-item-meta">(${source.count})</span>
    `;
    const input = item.querySelector("input");
    input.checked = ACTIVE_SOURCE_IDS.has(source.id);
    input.addEventListener("change", () => {
      if (input.checked) ACTIVE_SOURCE_IDS.add(source.id);
      else ACTIVE_SOURCE_IDS.delete(source.id);

      applySourceFilter();
      logActivity("source", { kind: "toggle", id: source.id, on: input.checked });
    });
    container.appendChild(item);
  });
}

function setAllSourcesSelected(selected) {
  if (selected) {
    ACTIVE_SOURCE_IDS = new Set(SOURCE_DEFINITIONS.map((s) => s.id));
  } else {
    ACTIVE_SOURCE_IDS = new Set();
  }
  renderSourceChecklist();
  applySourceFilter();
}

function renderCategoryChecklist() {
  const container = document.getElementById("categoryFilterChecklist");
  if (!container) return;
  container.innerHTML = "";

  if (CATEGORY_DEFINITIONS.length === 0) {
    container.innerHTML =
      '<div class="source-filter-item"><span class="source-filter-item-title">No category tags found.</span></div>';
    return;
  }

  CATEGORY_DEFINITIONS.forEach((category) => {
    const count = CURRENT_DATA.filter((q) => q[category.key] === true).length;
    const item = document.createElement("label");
    item.className = "source-filter-item";
    item.innerHTML = `
      <input type="checkbox" value="${escapeHTML(category.key)}" />
      <span class="source-filter-item-title">${escapeHTML(category.label)}</span>
      <span class="source-filter-item-meta">(${count})</span>
    `;
    const input = item.querySelector("input");
    input.checked = ACTIVE_CATEGORY_KEYS.has(category.key);
    input.addEventListener("change", () => {
      if (input.checked) ACTIVE_CATEGORY_KEYS.add(category.key);
      else ACTIVE_CATEGORY_KEYS.delete(category.key);
      applySourceFilter();
      logActivity("source", { kind: "category-toggle", key: category.key, on: input.checked });
    });
    container.appendChild(item);
  });
}

function setAllCategoriesSelected(selected) {
  if (selected) {
    ACTIVE_CATEGORY_KEYS = new Set(CATEGORY_DEFINITIONS.map((c) => c.key));
  } else {
    ACTIVE_CATEGORY_KEYS = new Set();
  }
  renderCategoryChecklist();
  applySourceFilter();
}

function setSourceFilterMenuOpen(open) {
  const menu = document.getElementById("sourceFilterMenu");
  const overlay = document.getElementById("menuOverlay");
  if (!menu) return;
  menu.hidden = !open;
  if (overlay) overlay.hidden = !(open || document.body.classList.contains("mobile-menu-open"));
  if (open) {
    // Re-apply current search filter on each open so the user's last query
    // still narrows newly rendered lists (e.g. after Refresh).
    applySourcesPanelSearch();
  }
}

// Live filter for the Sources panel — hides any source / imported / category
// row whose title doesn't match the typed query (case-insensitive substring).
function applySourcesPanelSearch() {
  const input = document.getElementById("sourcesSearch");
  const clearBtn = document.getElementById("sourcesSearchClear");
  if (!input) return;
  const q = (input.value || "").trim().toLowerCase();
  if (clearBtn) clearBtn.hidden = q.length === 0;

  const sections = [
    {
      list: document.getElementById("sourceFilterChecklist"),
      itemSelector: ".source-filter-item",
      textSelector: ".source-filter-item-title",
    },
    {
      list: document.getElementById("categoryFilterChecklist"),
      itemSelector: ".source-filter-item",
      textSelector: ".source-filter-item-title",
    },
    {
      list: document.getElementById("importedSourcesList"),
      itemSelector: ".imported-source-row",
      textSelector: ".imported-source-title",
    },
  ];

  sections.forEach((s) => {
    if (!s.list) return;
    const items = s.list.querySelectorAll(s.itemSelector);
    items.forEach((item) => {
      if (!q) {
        item.hidden = false;
        return;
      }
      const txt = (item.querySelector(s.textSelector)?.textContent || "").toLowerCase();
      item.hidden = !txt.includes(q);
    });
  });
}

function wireSourcesPanelSearch() {
  const input = document.getElementById("sourcesSearch");
  const clearBtn = document.getElementById("sourcesSearchClear");
  if (!input) return;
  input.addEventListener("input", applySourcesPanelSearch);
  clearBtn?.addEventListener("click", () => {
    input.value = "";
    applySourcesPanelSearch();
    input.focus();
  });
}

async function reloadSourcesAndFilters() {
  const refreshBtn = document.getElementById("sourceFilterRefresh");
  try {
    if (refreshBtn) {
      refreshBtn.disabled = true;
      refreshBtn.textContent = "Refreshing...";
    }
    setDataSource(await loadQuestionData());
    sanitizeProgressForCurrentData();
    renderSourceChecklist();
    renderCategoryChecklist();
    applySourceFilter();
    updateScoreUI();
    showDataWarnings();
  } finally {
    if (refreshBtn) {
      refreshBtn.disabled = false;
      refreshBtn.textContent = "Refresh";
    }
  }
}

function getCorrectIndex(question) {
  if (Number.isInteger(question?.correctIndex)) return question.correctIndex;
  return ANSWER_KEY[getQuestionId(question)];
}

function escapeHTML(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function sanitizeToQFilename(name) {
  const base = String(name || "")
    .trim()
    .replace(/\.json$/i, "")
    .replace(/^q[_-]/i, "")
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
  return `q_${base || "new_questions"}.json`;
}

function buildQuestionsTemplate() {
  return [
    {
      number: 1,
      id: "replace-me-1",
      question_en: "REQUIRED: Write your question here (English). Example: What is 2 + 2?",
      // OPTIONAL: Greek translation (leave empty if you do not need it).
      question_el: "",
      // REQUIRED: 2-7 options. Keep them short and unique.
      choices_en: ["3", "4", "5", "22"],
      // OPTIONAL: Greek choices (same order as choices_en). Leave [] if not used.
      choices_el: [],
      // REQUIRED: zero-based index of the correct answer in choices_en/choices_el.
      correctIndex: 1,
      // REQUIRED: At least one boolean tag must be true (used for the Categories filter).
      // You can name tags however you want. Keep names simple and consistent.
      generalGK: true,

      // OPTIONAL: show an image under the question (path relative to index.html).
      // Example: "images/video_questions/video2_1.png"
      image: "",
      // OPTIONAL: show an image under the answers (path relative to index.html).
      image_answers: "",
      // OPTIONAL: show a code block under the question.
      code: "",

      // Template help fields (safe to delete). They are ignored by the app.
      __fieldGuide: {
        number: "REQUIRED integer. The app shows its own numbering in the UI; this is used for sorting and stable ids.",
        question_en: "REQUIRED non-empty string (English).",
        choices_en: "REQUIRED array (min 2). Use strings only.",
        correctIndex: "REQUIRED integer in range [0..choices_en.length-1].",
        categoryTags:
          "REQUIRED: at least one boolean tag must be true (example: generalGK: true). Used by Categories filter.",
        id: "OPTIONAL string. Recommended to keep stable identifiers when you edit/reorder questions.",
        question_el: "OPTIONAL Greek translation.",
        choices_el: "OPTIONAL Greek choices in the same order as choices_en.",
        image: "OPTIONAL path to an image shown under the question.",
        image_answers: "OPTIONAL path to an image shown under the answers.",
        code: "OPTIONAL code snippet shown under the question.",
      },
      __tips: [
        "File name must be q_*.json (example: q_my_new_set.json).",
        "Root JSON must be an array: [ {question1}, {question2}, ... ].",
        "Do not include comments in JSON. Use these __help fields instead (or delete them).",
      ],
      __quickCopyPasteExample:
        '{\n' +
        '  "number": 1,\n' +
        '  "question_en": "What color is the sky on a clear day?",\n' +
        '  "choices_en": ["Blue", "Green", "Red", "Yellow"],\n' +
        '  "correctIndex": 0,\n' +
        '  "generalGK": true\n' +
        '}',
    },
    {
      number: 2,
      id: "replace-me-2",
      question_en: "OPTIONAL example with code + images: Which SQL clause filters rows?",
      question_el: "",
      choices_en: ["ORDER BY", "WHERE", "GROUP BY", "SELECT"],
      choices_el: [],
      correctIndex: 1,
      // Example of a different category tag.
      sql: true,
      image: "images/video_questions/video2_1.png",
      image_answers: "images/video_questions/video2_1answer.png",
      code: "SELECT *\nFROM Users\nWHERE IsActive = 1;",
    },
  ];
}

function isMobileDevice() {
  return (
    navigator.maxTouchPoints > 0 ||
    window.Capacitor?.isNativePlatform?.() === true
  );
}

function _blobDownload(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function triggerDownload(filename, blob) {
  // On mobile/native, try Web Share API so the OS Save dialog appears.
  if (isMobileDevice() && navigator.canShare) {
    try {
      const file = new File([blob], filename, { type: blob.type });
      if (navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: filename }).catch(() => {
          _blobDownload(filename, blob);
        });
        return;
      }
    } catch (_) {
      // canShare/share not supported in this context — fall through
    }
  }
  _blobDownload(filename, blob);
}

function downloadJsonFile(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], {
    type: "application/json",
  });
  triggerDownload(filename, blob);
}

function downloadTextFile(filename, text, type = "text/plain") {
  const blob = new Blob([String(text ?? "")], { type });
  triggerDownload(filename, blob);
}

// Minimal ZIP writer (store/no compression) so we can download multiple files as one bundle.
// Avoids external deps (works offline).
function crc32(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    crc ^= bytes[i];
    for (let j = 0; j < 8; j += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function toDosTimeDate(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = Math.floor(date.getSeconds() / 2);
  const dosTime = (hours << 11) | (minutes << 5) | seconds;
  const dosDate = ((year - 1980) << 9) | (month << 5) | day;
  return { dosTime, dosDate };
}

function u16(n) {
  const b = new Uint8Array(2);
  b[0] = n & 0xff;
  b[1] = (n >>> 8) & 0xff;
  return b;
}

function u32(n) {
  const b = new Uint8Array(4);
  b[0] = n & 0xff;
  b[1] = (n >>> 8) & 0xff;
  b[2] = (n >>> 16) & 0xff;
  b[3] = (n >>> 24) & 0xff;
  return b;
}

function concatBytes(chunks) {
  const total = chunks.reduce((sum, c) => sum + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  chunks.forEach((c) => {
    out.set(c, offset);
    offset += c.length;
  });
  return out;
}

function toBytes(textOrBytes) {
  if (textOrBytes instanceof Uint8Array) return textOrBytes;
  return new TextEncoder().encode(String(textOrBytes ?? ""));
}

function downloadZip(zipName, entries) {
  const { dosTime, dosDate } = toDosTimeDate(new Date());

  const localParts = [];
  const centralParts = [];
  let offset = 0;

  entries.forEach(({ name, text, bytes }) => {
    const safeName = String(name || "file.txt").replace(/\\/g, "/");
    const nameBytes = toBytes(safeName);
    const dataBytes = bytes ? toBytes(bytes) : toBytes(text);
    const crc = crc32(dataBytes);

    // Local file header
    const localHeader = concatBytes([
      u32(0x04034b50), // signature
      u16(20), // version needed
      u16(0), // flags
      u16(0), // compression (store)
      u16(dosTime),
      u16(dosDate),
      u32(crc),
      u32(dataBytes.length),
      u32(dataBytes.length),
      u16(nameBytes.length),
      u16(0), // extra len
      nameBytes,
    ]);
    localParts.push(localHeader, dataBytes);

    // Central directory header
    const centralHeader = concatBytes([
      u32(0x02014b50), // signature
      u16(20), // version made by
      u16(20), // version needed
      u16(0), // flags
      u16(0), // compression
      u16(dosTime),
      u16(dosDate),
      u32(crc),
      u32(dataBytes.length),
      u32(dataBytes.length),
      u16(nameBytes.length),
      u16(0), // extra
      u16(0), // comment
      u16(0), // disk start
      u16(0), // internal attrs
      u32(0), // external attrs
      u32(offset), // local header offset
      nameBytes,
    ]);
    centralParts.push(centralHeader);

    offset += localHeader.length + dataBytes.length;
  });

  const centralDir = concatBytes(centralParts);
  const centralDirOffset = offset;
  const centralDirSize = centralDir.length;

  // End of central directory record
  const end = concatBytes([
    u32(0x06054b50), // signature
    u16(0), // disk #
    u16(0), // disk start
    u16(entries.length),
    u16(entries.length),
    u32(centralDirSize),
    u32(centralDirOffset),
    u16(0), // comment length
  ]);

  const zipBytes = concatBytes([...localParts, centralDir, end]);
  const blob = new Blob([zipBytes], { type: "application/zip" });
  triggerDownload(zipName, blob);
}

function getDockerTemplates() {
  const dockerfile = `FROM nginx:alpine

COPY . /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
`;

  const nginxConf = `server {
  listen 80;
  server_name _;

  root /usr/share/nginx/html;
  index index.html;
  autoindex off;

  location / {
    try_files $uri $uri/ =404;
  }

  location ~* \\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js)$ {
    expires 7d;
    add_header Cache-Control "public, max-age=604800";
    try_files $uri =404;
  }

  location ~* \\.json$ {
    default_type application/json;
    expires 1h;
    add_header Cache-Control "public, max-age=3600";
    try_files $uri =404;
  }
}
`;

  const compose = `services:
  mcq:
    build: .
    container_name: mcq
    ports:
      - "8080:80"
`;

  const dockerignore = `.git
.vscode
node_modules
*.log
dist
build
coverage
`;

  const readme = `# Run With Docker

IMPORTANT:
- Place Docker files in the SAME folder as index.html (project root), then run docker compose there.

## Quick Start
From the project folder:

\`\`\`bash
docker compose up --build
\`\`\`

Open:
- http://localhost:8080

Stop:

\`\`\`bash
docker compose down
\`\`\`

## Change Port
Edit docker-compose.yml:

\`\`\`yml
ports:
  - "8080:80"
\`\`\`

## Quick Local Server (No Docker)
If you have Python 3 installed, you can also run a local server:

\`\`\`bash
python -m http.server 8000
\`\`\`

Windows alternative:

\`\`\`bash
py -3 -m http.server 8000
\`\`\`

Open:
- http://localhost:8000
`;

  const manual = `# Manual Docker Templates

These templates are safe defaults. Customize if needed:

- Change port in docker-compose.yml
- Use a different server image (Caddy/Apache) if you prefer
- For development, you can mount the folder as a volume (advanced)
`;

  const readmeFirst = `MCQ Docker Setup

You downloaded ONLY Docker files.

Next steps:
1) Extract/copy these files into your MCQ project root (the folder that contains index.html).
2) Run: docker compose up --build
3) Open: http://localhost:8080
`;

  return { dockerfile, nginxConf, compose, dockerignore, readme, manual, readmeFirst };
}

function getLocalServerTemplates() {
  const readme = `# Run With Python (Local Server)

Why:
- Browsers block loading q_*.json when you open index.html via file://
- Running a local HTTP server fixes it

## Quick Start
From the folder that contains index.html:

\`\`\`bash
python -m http.server 8000
\`\`\`

Windows alternative:

\`\`\`bash
py -3 -m http.server 8000
\`\`\`

Open:
- http://localhost:8000

Stop:
- Press Ctrl+C in the terminal
`;

  const ps1 = `param(
  [int]$Port = 8000
)

Set-Location -LiteralPath $PSScriptRoot

Write-Host \"Starting local server on http://localhost:$Port\"
Write-Host \"Stop with Ctrl+C\"

try {
  python -m http.server $Port
  exit 0
} catch {
  try {
    py -3 -m http.server $Port
    exit 0
  } catch {
    Write-Host \"Python was not found. Install Python 3, then run: python -m http.server 8000\"
    exit 1
  }
}
`;

  const bat = `@echo off
setlocal
cd /d \"%~dp0\"
set PORT=8000

echo Starting local server on http://localhost:%PORT%
echo Stop with Ctrl+C
echo.

py -3 -m http.server %PORT% >nul 2>&1
if %errorlevel%==0 (
  py -3 -m http.server %PORT%
  exit /b 0
)

python -m http.server %PORT% >nul 2>&1
if %errorlevel%==0 (
  python -m http.server %PORT%
  exit /b 0
)

echo Python was not found. Install Python 3 and run: python -m http.server 8000
pause
exit /b 1
`;

  return { readme, ps1, bat };
}

async function tryFetchText(path) {
  try {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function tryFetchBytes(path) {
  try {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return new Uint8Array(buf);
  } catch {
    return null;
  }
}

async function fetchFileBytes(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch ${path} (${res.status})`);
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

function uniqueStrings(list) {
  return [...new Set((list || []).map((s) => String(s || "").trim()).filter(Boolean))];
}

function collectBundleFileList() {
  const files = [];
  // Core app files
  files.push(
    "index.html",
    "script.js",
    "style.css",
    "sources_index.json",
    "questions_template.json",
    "manifest.json",
    "sw.js"
  );

  // Question sources currently known to the app (q_*.json)
  (SOURCE_DEFINITIONS || []).forEach((s) => {
    const f = String(s?.file || "");
    if (SOURCE_FILE_PATTERN.test(f)) files.push(f);
  });
  // Fallback: include source files observed in loaded data.
  (CURRENT_DATA || []).forEach((q) => {
    const f = String(q?.__sourceFile || "");
    if (SOURCE_FILE_PATTERN.test(f)) files.push(f);
  });

  // Static images used by UI
  files.push("images/favicon.png", "images/game_over.jpg", "images/sidebanner.jpg");

  // Images referenced by questions
  (CURRENT_DATA || []).forEach((q) => {
    if (q?.image) files.push(String(q.image));
    if (q?.image_answers) files.push(String(q.image_answers));
  });

  return uniqueStrings(files).filter((p) => !p.startsWith("http"));
}

async function downloadAppDockerBundleZip() {
  const t = getDockerTemplates();
  const local = getLocalServerTemplates();
  const appFiles = collectBundleFileList();

  // Prefer the project's real files (latest), fallback to built-in templates.
  const dockerfileText = (await tryFetchText("Dockerfile")) ?? t.dockerfile;
  const composeText = (await tryFetchText("docker-compose.yml")) ?? t.compose;
  const dockerignoreText = (await tryFetchText(".dockerignore")) ?? t.dockerignore;
  const nginxConfText = (await tryFetchText("nginx.conf")) ?? t.nginxConf;
  const dockerReadmeText = (await tryFetchText("README_DOCKER.md")) ?? t.readme;
  const manualText = (await tryFetchText("DOCKER_MANUAL_TEMPLATES.md")) ?? t.manual;
  const localReadmeText = (await tryFetchText("README_LOCAL_SERVER.md")) ?? local.readme;
  const localPs1Text = (await tryFetchText("start_server.ps1")) ?? local.ps1;
  const localBatText = (await tryFetchText("start_server.bat")) ?? local.bat;

  const entries = [
    { name: "README_FIRST.txt", text: "Extract this zip, then run: docker compose up --build\nOpen: http://localhost:8080\n" },
    { name: "Dockerfile", text: dockerfileText },
    { name: "docker-compose.yml", text: composeText },
    { name: ".dockerignore", text: dockerignoreText },
    { name: "nginx.conf", text: nginxConfText },
    { name: "README_DOCKER.md", text: dockerReadmeText },
    { name: "DOCKER_MANUAL_TEMPLATES.md", text: manualText },
    { name: "README_LOCAL_SERVER.md", text: localReadmeText },
    { name: "start_server.ps1", text: localPs1Text },
    { name: "start_server.bat", text: localBatText },
  ];

  // Fetch and include app assets (binary safe).
  for (const path of appFiles) {
    try {
      const bytes = (await tryFetchBytes(path)) ?? (await fetchFileBytes(path));
      entries.push({ name: path, bytes });
    } catch (e) {
      console.warn("Bundle missing file:", path, e);
    }
  }

  downloadZip("mcq-app-docker-bundle.zip", entries);
}

async function downloadQuestionsTemplate() {
  // One template file containing SIMPLE + ADVANCED sections.
  // Fallback to the JS-built template if the file can't be fetched.
  try {
    const res = await fetch("questions_template.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`template fetch failed (${res.status})`);
    const template = await res.json();
    downloadJsonFile("q_new_questions.json", template);
  } catch (e) {
    console.warn("Template download fallback used:", e);
    downloadJsonFile("q_new_questions.json", buildQuestionsTemplate());
  }
}

// ---------- Import management UI ----------
const textPromptModal = document.getElementById("textPromptModal");
const textPromptTitle = document.getElementById("textPromptTitle");
const textPromptInput = document.getElementById("textPromptInput");
const textPromptOk = document.getElementById("textPromptOk");
const textPromptCancel = document.getElementById("textPromptCancel");
let pendingTextPrompt = null;

function closeTextPrompt() {
  if (textPromptModal) textPromptModal.style.display = "none";
  pendingTextPrompt = null;
}

function openTextPrompt({ title, value, onOk }) {
  if (!textPromptModal || !textPromptInput) {
    onOk?.(value);
    return;
  }
  if (textPromptTitle) textPromptTitle.textContent = title || "Input";
  textPromptInput.value = value || "";
  pendingTextPrompt = onOk;
  textPromptModal.style.display = "flex";
  setTimeout(() => textPromptInput.focus(), 0);
}

textPromptOk?.addEventListener("click", () => {
  const v = textPromptInput?.value ?? "";
  const cb = pendingTextPrompt;
  closeTextPrompt();
  cb?.(String(v).trim());
});
textPromptCancel?.addEventListener("click", closeTextPrompt);

const jsonEditorModal = document.getElementById("jsonEditorModal");
const jsonEditorTitle = document.getElementById("jsonEditorTitle");
const jsonEditorHint = document.getElementById("jsonEditorHint");
const jsonEditorTextarea = document.getElementById("jsonEditorTextarea");
const jsonEditorError = document.getElementById("jsonEditorError");
const jsonEditorSave = document.getElementById("jsonEditorSave");
const jsonEditorCancel = document.getElementById("jsonEditorCancel");
let pendingJsonEditor = null;

function closeJsonEditor() {
  if (jsonEditorModal) jsonEditorModal.style.display = "none";
  if (jsonEditorError) {
    jsonEditorError.hidden = true;
    jsonEditorError.textContent = "";
  }
  pendingJsonEditor = null;
}

function openJsonEditor({ title, hint, value, onSave }) {
  if (!jsonEditorModal || !jsonEditorTextarea) {
    onSave?.(value);
    return;
  }
  if (jsonEditorTitle) jsonEditorTitle.textContent = title || "Edit JSON";
  if (jsonEditorHint) jsonEditorHint.textContent = hint || "";
  jsonEditorTextarea.value = value || "[]";
  pendingJsonEditor = onSave;
  jsonEditorModal.style.display = "flex";
  setTimeout(() => jsonEditorTextarea.focus(), 0);
}

jsonEditorCancel?.addEventListener("click", closeJsonEditor);
jsonEditorSave?.addEventListener("click", () => {
  const cb = pendingJsonEditor;
  const text = jsonEditorTextarea?.value ?? "[]";
  cb?.(String(text));
});

function getImportedSourceById(id) {
  return getImportedSources().find((s) => s && s.id === id) || null;
}

function promptRenameImportedSource(sourceId) {
  const src = getImportedSourceById(sourceId);
  if (!src) return;
  openTextPrompt({
    title: "Rename imported source",
    value: src.label || "",
    onOk: (newName) => {
      if (!newName) return;
      const updated = { ...src, label: newName };
      if (upsertImportedSource(updated)) {
        reloadSourcesAndFilters();
        renderImportedSourcesList();
      }
    },
  });
}

function confirmDeleteImportedSource(sourceId) {
  const src = getImportedSourceById(sourceId);
  if (!src) return;
  openModeResetConfirm(
    `Delete imported source "${src.label || src.fileName || "Imported"}"?`,
    () => {
      deleteImportedSource(sourceId);
      reloadSourcesAndFilters();
      renderImportedSourcesList();
    },
    null,
    { destructive: true }
  );
}

function exportImportedSource(sourceId) {
  const src = getImportedSourceById(sourceId);
  if (!src) return;
  const fileName = SOURCE_FILE_PATTERN.test(src.fileName || "")
    ? src.fileName
    : sanitizeToQFilename(src.label || "imported");
  downloadJsonFile(fileName, Array.isArray(src.questions) ? src.questions : []);
}

function openJsonEditorForImportedSource(sourceId) {
  const src = getImportedSourceById(sourceId);
  if (!src) return;
  const fileName = SOURCE_FILE_PATTERN.test(src.fileName || "")
    ? src.fileName
    : sanitizeToQFilename(src.label || "imported");

  openJsonEditor({
    title: `Edit: ${src.label || fileName}`,
    hint: "Paste an array of question objects. It will be validated before saving.",
    value: JSON.stringify(Array.isArray(src.questions) ? src.questions : [], null, 2),
    onSave: (text) => {
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        if (jsonEditorError) {
          jsonEditorError.hidden = false;
          jsonEditorError.textContent = "Invalid JSON. Fix syntax and try again.";
        }
        return;
      }

      const validation = validateQuestionsStructure(fileName, parsed);
      if (!validation.valid) {
        if (jsonEditorError) {
          jsonEditorError.hidden = false;
          jsonEditorError.textContent =
            "Validation failed:\n" + validation.errors.slice(0, 40).join("\n");
        }
        return;
      }

      const updated = {
        ...src,
        fileName,
        tagKey: src.tagKey || sourceTagKeyFromFile(fileName),
        questions: parsed.filter((q) => !(q && typeof q === "object" && q.__template === true)),
        updatedAt: new Date().toISOString(),
      };
      if (upsertImportedSource(updated)) {
        closeJsonEditor();
        reloadSourcesAndFilters();
        renderImportedSourcesList();
      }
    },
  });
}

const IMPORT_AI_PROMPT_BASE = `You are an expert quiz author. I will give you source material (a book chapter, article, notes, or any text). Generate multiple-choice questions from it.

OUTPUT REQUIREMENTS — read carefully:
- Output ONLY a valid JSON array. No prose, no commentary, no markdown fences, no \`\`\`json wrapper.
- The root must be an array of question objects: [ { ... }, { ... } ].
- Each question object MUST have these fields:
  - "number": integer, sequential starting at 1 (1, 2, 3, ...)
  - "question_en": string, the question text
  - "choices_en": array of 3 to 5 short, distinct strings (the options)
  - "correctIndex": integer, ZERO-BASED index of the correct option in choices_en (0 = first, 1 = second, etc.)
  - exactly ONE boolean category tag set to true. Pick a short snake_case or camelCase name that describes the topic. Examples: "history": true, "biology": true, "chapter1": true, "networking": true. Be consistent across all questions from the same source — use the SAME tag for all of them.
- Optional fields you MAY add:
  - "id": a stable short string identifier
  - "question_el": Greek translation of the question
  - "choices_el": Greek translations of the choices (same order as choices_en)
  - "code": a code snippet shown as a code block under the question
- Do NOT include any other fields (no "explanation", no "difficulty", no "tags" array — just the boolean category tag).
- Make sure correctIndex is correct. Double-check before outputting.
- Questions must be self-contained (no "according to the text above" — phrase them as standalone).
- Avoid trivial yes/no questions. Prefer questions that test understanding.

EXAMPLE of valid output (this is what your reply must look like — just the JSON, nothing else):
[
  {
    "number": 1,
    "question_en": "Which planet in our solar system is known as the Red Planet?",
    "choices_en": ["Earth", "Mars", "Jupiter", "Venus"],
    "correctIndex": 1,
    "astronomy": true
  },
  {
    "number": 2,
    "question_en": "Who wrote the play 'Hamlet'?",
    "choices_en": ["William Shakespeare", "Charles Dickens", "Mark Twain", "Jane Austen"],
    "correctIndex": 0,
    "astronomy": true
  }
]

Now produce questions from the following source material. After you reply, I will save your output as a file named q_<topic>.json and import it into my MCQ Trainer app.`;

function buildImportPrompt() {
  const lang = document.getElementById("importPrefLang")?.value || "";
  const count = document.getElementById("importPrefCount")?.value || "";
  const tag = document.getElementById("importPrefTag")?.value?.trim() || "";

  let extra = [];
  if (lang) extra.push(`Language for questions and answers = ${lang}`);
  if (count) extra.push(`Number of questions to generate = ${count}`);
  if (tag) extra.push(`Category tag to use = ${tag}`);

  let prompt = IMPORT_AI_PROMPT_BASE;
  if (extra.length) {
    prompt += "\n\nPREFERENCES:\n" + extra.join("\n");
  }
  prompt += "\n\nSOURCE MATERIAL:\n<<< paste your book chapter, notes, or any text here >>>";
  return prompt;
}

function refreshImportPromptText() {
  const ta = document.getElementById("importPromptText");
  if (ta) ta.value = buildImportPrompt();
}

function openImportPromptModal() {
  const modal = document.getElementById("importPromptModal");
  const ta = document.getElementById("importPromptText");
  if (!modal) {
    pickAndImportQuestionsJson();
    return;
  }
  if (ta) refreshImportPromptText();
  // Clear paste area
  const pasteText = document.getElementById("importPasteText");
  const pasteError = document.getElementById("importPasteError");
  if (pasteText) pasteText.value = "";
  if (pasteError) pasteError.hidden = true;
  renderImportLibrary();
  setImportTab("library");
  modal.style.display = "flex";
  closeSourceFilterMenu();
}

/* ───── Import modal: tabs + library grid (bundled question banks) ───── */
function setImportTab(name) {
  if (!name) name = "library";
  document.querySelectorAll("#importPromptModal .import-tab").forEach((tab) => {
    const on = tab.getAttribute("data-tab") === name;
    tab.classList.toggle("active", on);
    tab.setAttribute("aria-selected", on ? "true" : "false");
  });
  document.querySelectorAll("#importPromptModal .import-tab-panel").forEach((p) => {
    p.hidden = p.getAttribute("data-panel") !== name;
  });
}

function renderImportLibrary() {
  const grid = document.getElementById("importLibraryGrid");
  if (!grid) return;
  grid.innerHTML = BUNDLED_SETS.map((s) => `
    <div class="welcome-set import-library-card"
         data-file="${escapeHTML(s.file)}"
         data-tag="${escapeHTML((s.tag || "").toLowerCase())}"
         data-title="${escapeHTML((s.title || "").toLowerCase())}"
         data-desc="${escapeHTML((s.desc || "").toLowerCase())}">
      <div class="welcome-set-head">
        <span class="welcome-set-icon">${s.icon}</span>
        <span class="welcome-set-title">${escapeHTML(s.title)}</span>
        <span class="welcome-set-tag" title="Category tag">#${escapeHTML(s.tag || "")}</span>
      </div>
      <p class="welcome-set-desc">${escapeHTML(s.desc || "")}</p>
      <div class="welcome-set-actions">
        <button type="button" class="welcome-set-load"     data-file="${escapeHTML(s.file)}">▶ Load</button>
        <button type="button" class="welcome-set-download" data-file="${escapeHTML(s.file)}" title="Download as .json">⬇️</button>
      </div>
    </div>
  `).join("");

  grid.querySelectorAll(".welcome-set-load").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const f = btn.getAttribute("data-file");
      if (!f) return;
      closeImportPromptModal();
      await loadBundledQuestionSet(f);
    });
  });
  grid.querySelectorAll(".welcome-set-download").forEach((btn) => {
    btn.addEventListener("click", () => {
      const f = btn.getAttribute("data-file");
      if (f) downloadBundledQuestionSet(f);
    });
  });

  applyImportLibraryFilter();
}

function applyImportLibraryFilter() {
  const inp = document.getElementById("importLibrarySearch");
  const clearBtn = document.getElementById("importLibrarySearchClear");
  const grid = document.getElementById("importLibraryGrid");
  const emptyMsg = document.getElementById("importLibraryEmpty");
  if (!inp || !grid) return;
  const q = (inp.value || "").trim().toLowerCase();
  if (clearBtn) clearBtn.hidden = q.length === 0;

  const cards = grid.querySelectorAll(".import-library-card");
  let visible = 0;
  cards.forEach((card) => {
    if (!q) {
      // In the import modal the user is explicitly looking for sources to
      // add, so we show every bank — including the hidden ones — by default.
      card.hidden = false;
      visible++;
      return;
    }
    const tag   = card.getAttribute("data-tag")   || "";
    const title = card.getAttribute("data-title") || "";
    const desc  = card.getAttribute("data-desc")  || "";
    const match = tag.includes(q) || title.includes(q) || desc.includes(q);
    card.hidden = !match;
    if (match) visible++;
  });
  if (emptyMsg) emptyMsg.hidden = visible !== 0;
}

function closeImportPromptModal() {
  const modal = document.getElementById("importPromptModal");
  if (modal) modal.style.display = "none";
}

function wireImportPromptModal() {
  document
    .getElementById("importPromptClose")
    ?.addEventListener("click", closeImportPromptModal);

  // Tabs (Library / Generate / Import) — only one panel visible at a time.
  document.querySelectorAll("#importPromptModal .import-tab").forEach((tab) => {
    tab.addEventListener("click", () => setImportTab(tab.getAttribute("data-tab")));
  });

  // Library tab: search + bundled-sets grid (covers hidden sets too).
  document.getElementById("importLibrarySearch")?.addEventListener("input", applyImportLibraryFilter);
  document.getElementById("importLibrarySearchClear")?.addEventListener("click", () => {
    const inp = document.getElementById("importLibrarySearch");
    if (inp) { inp.value = ""; applyImportLibraryFilter(); inp.focus(); }
  });

  // Preference fields → live-update prompt
  ["importPrefLang", "importPrefCount", "importPrefTag"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", refreshImportPromptText);
    document.getElementById(id)?.addEventListener("change", refreshImportPromptText);
  });

  // Option 1 — Pick file (use persistent hidden input for mobile compatibility)
  const persistentFileInput = document.getElementById("importFileInput");
  if (persistentFileInput) {
    persistentFileInput.addEventListener("change", async () => {
      const file = persistentFileInput.files?.[0];
      persistentFileInput.value = "";
      if (!file) return;
      closeImportPromptModal();
      await handleImportFile(file);
    });
  }

  document.getElementById("importPromptPickFile")?.addEventListener("click", () => {
    if (persistentFileInput) {
      persistentFileInput.click();
    } else {
      closeImportPromptModal();
      pickAndImportQuestionsJson();
    }
  });

  // Option 2 — Copy prompt
  document.getElementById("importPromptCopy")?.addEventListener("click", async () => {
    const ta = document.getElementById("importPromptText");
    const btn = document.getElementById("importPromptCopy");
    if (!ta || !btn) return;
    const text = ta.value;
    let ok = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        ok = true;
      } else {
        ta.removeAttribute("readonly");
        ta.select();
        ta.setSelectionRange(0, text.length);
        ok = document.execCommand("copy");
        ta.setAttribute("readonly", "true");
        window.getSelection()?.removeAllRanges();
      }
    } catch (e) {
      console.warn("Copy failed:", e);
    }
    const original = btn.textContent;
    btn.textContent = ok ? "✅ Copied!" : "❌ Copy failed — select manually";
    setTimeout(() => (btn.textContent = original), 1800);
  });

  document
    .getElementById("importPromptDownloadTemplate")
    ?.addEventListener("click", () => {
      downloadQuestionsTemplate();
    });

  // Option 3 — Paste JSON and save
  document.getElementById("importPasteSave")?.addEventListener("click", async () => {
    const nameInput = document.getElementById("importPasteName");
    const textArea = document.getElementById("importPasteText");
    const errorEl = document.getElementById("importPasteError");
    if (!textArea) return;

    const rawText = textArea.value.trim();
    if (!rawText) {
      if (errorEl) { errorEl.textContent = "Paste a JSON array first."; errorEl.hidden = false; }
      return;
    }

    // Clean markdown fences if user pasted with ```json ... ```
    let cleanText = rawText;
    cleanText = cleanText.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/, "");

    let data;
    try {
      data = JSON.parse(cleanText);
    } catch (e) {
      if (errorEl) { errorEl.textContent = "Invalid JSON: " + e.message; errorEl.hidden = false; }
      return;
    }

    if (!Array.isArray(data) || data.length === 0) {
      if (errorEl) { errorEl.textContent = "JSON must be a non-empty array of question objects."; errorEl.hidden = false; }
      return;
    }

    // Build filename
    let name = (nameInput?.value || "").trim().replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
    if (!name) name = "pasted_" + Date.now();
    const fileName = `q_${name}.json`;

    if (errorEl) errorEl.hidden = true;

    const ok = await importQuestionsData(fileName, data);
    if (ok) {
      closeImportPromptModal();
    } else {
      if (errorEl) { errorEl.textContent = "Validation failed. Check the JSON structure — each object needs question_en, choices_en, and correctIndex."; errorEl.hidden = false; }
    }
  });

  // Backdrop click to close
  document
    .getElementById("importPromptModal")
    ?.addEventListener("click", (e) => {
      if (e.target?.id === "importPromptModal") closeImportPromptModal();
    });
}

function closeSourceFilterMenu() {
  const menu = document.getElementById("sourceFilterMenu");
  if (menu && !menu.hidden) menu.hidden = true;
}

function confirmDeleteAllImportedSources() {
  const all = getImportedSources();
  if (!all.length) {
    DATA_WARNINGS.push("No imported sources to delete.");
    showDataWarnings();
    return;
  }
  openModeResetConfirm(
    `Delete all ${all.length} imported source(s)? This cannot be undone.`,
    () => {
      saveImportedSourcesToStorage([]);
      reloadSourcesAndFilters();
      renderImportedSourcesList();
    },
    null,
    { destructive: true }
  );
}

async function handleImportFile(file) {
  const fileName = String(file.name || "");
  if (!SOURCE_FILE_PATTERN.test(fileName) || EXCLUDED_SOURCE_FILES.has(fileName.toLowerCase())) {
    DATA_WARNINGS.push(
      `Import skipped: file must match q_*.json and not be excluded. Received: ${fileName || "(unknown)"}`
    );
    showDataWarnings();
    return;
  }

  let data;
  try {
    const text = await file.text();
    data = JSON.parse(text);
  } catch {
    DATA_WARNINGS.push(`Import failed: ${fileName} is not valid JSON.`);
    showDataWarnings();
    return;
  }

  await importQuestionsData(fileName, data);
}

async function pickAndImportQuestionsJson() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json,.json";

  const file = await new Promise((resolve) => {
    input.addEventListener("change", () => resolve(input.files?.[0] || null), {
      once: true,
    });
    input.click();
  });
  if (!file) return;

  await handleImportFile(file);
}

async function importQuestionsData(fileName, data) {
  const validation = validateQuestionsStructure(fileName, data);
  if (!validation.valid) {
    DATA_WARNINGS.push(`${fileName} has invalid JSON structure and was not imported.`);
    console.warn(`Import validation errors for ${fileName}:`, validation.errors.slice(0, 50));
    showDataWarnings();
    return false;
  }

  const label = sourceLabelFromFile(fileName);
  const tagKey = sourceTagKeyFromFile(fileName);
  const sourceId = `import-${Date.now()}-${fileName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
  const importedQuestions = data
    .filter((q) => !(q && typeof q === "object" && q.__template === true))
    .map((q, idx) => {
      const withAutoSourceTag = { ...q };
      if (tagKey && !hasAnyBooleanCategoryTag(withAutoSourceTag)) {
        withAutoSourceTag[tagKey] = true;
      }
      return {
        ...withAutoSourceTag,
        __sourceId: sourceId,
        __sourceLabel: label,
        __sourceFile: fileName,
        __qid:
          typeof withAutoSourceTag.id === "string" && withAutoSourceTag.id.trim()
            ? `${sourceId}:${withAutoSourceTag.id.trim()}`
            : `${sourceId}:${Number.isInteger(withAutoSourceTag.number) ? withAutoSourceTag.number : idx + 1}:${idx}`,
      };
    });

  const stored = {
    id: sourceId,
    fileName,
    label,
    tagKey,
    importedAt: new Date().toISOString(),
    questions: importedQuestions.map((q) => {
      const { __sourceId, __sourceLabel, __qid, ...rest } = q;
      return rest;
    }),
  };
  if (upsertImportedSource(stored)) {
    await reloadSourcesAndFilters();
    renderImportedSourcesList();
    return true;
  }
  return false;
}

const BUNDLED_SETS = [
  { file: "q_networking.json",    icon: "🌐",  title: "Networking",                    tag: "networking",    desc: "OSI layers, TCP/IP, subnetting, routing, DNS, DHCP and more." },
  { file: "q_cybersecurity.json", icon: "🛡️", title: "Cybersecurity",                 tag: "cybersecurity", desc: "OWASP, crypto, authentication, common attacks and defenses." },
  { file: "q_it_general.json",    icon: "💻",  title: "IT General",                    tag: "itGeneral",     desc: "Algorithms, databases, Linux, Git, web fundamentals, OOP." },
  { file: "q_demo.json",          icon: "📦",  title: "Demo (general)",                tag: "demo",          desc: "12 mixed general-knowledge questions — quick smoke test." },

  // ── SQL sets ──
  { file: "q_sql01.json", icon: "🗄️", title: "SQL — Basics",                  tag: "SQL", desc: "SELECT, WHERE, DISTINCT, NULLs, JOINs, ORDER BY, aggregates, GROUP BY/HAVING, DML." },
  { file: "q_sql02.json", icon: "🗄️", title: "SQL — JOINs & Subqueries",      tag: "SQL", desc: "INNER/LEFT/RIGHT/FULL/CROSS/SELF JOIN, EXISTS vs IN, NOT IN NULL trap, derived tables." },
  { file: "q_sql03.json", icon: "🗄️", title: "SQL — GROUP BY & Aggregates",   tag: "SQL", desc: "COUNT/SUM/AVG/MIN/MAX, DISTINCT, HAVING vs WHERE, logical processing order." },
  { file: "q_sql04.json", icon: "🗄️", title: "SQL — String & Date Functions", tag: "SQL", desc: "LEN, SUBSTRING, CHARINDEX, LIKE, DATEADD/DATEDIFF, CAST/CONVERT, ISNULL/COALESCE." },
  { file: "q_sql05.json", icon: "🗄️", title: "SQL — Transactions & ACID",     tag: "SQL", desc: "ACID, COMMIT/ROLLBACK, savepoints, isolation levels, dirty/phantom reads, deadlocks." },
  { file: "q_sql06.json", icon: "🗄️", title: "SQL — Indexes & Performance",   tag: "SQL", desc: "Clustered vs non-clustered, covering/INCLUDE, seek vs scan, fragmentation, plans." },
  { file: "q_sql07.json", icon: "🗄️", title: "SQL — CTEs & Window Functions", tag: "SQL", desc: "CTEs, recursion, ROW_NUMBER/RANK, PARTITION BY, LAG/LEAD, running totals." },

  // ── C# sets ──
  { file: "q_cs01.json",  icon: "#️⃣", title: "C# — Types & Control Flow",     tag: "C#",  desc: "Value vs reference, var, const/readonly, ref/out, overloading, loops, switch." },
  { file: "q_cs02.json",  icon: "#️⃣", title: "C# — OOP",                      tag: "C#",  desc: "class vs struct, interfaces, virtual/override, sealed, access modifiers, polymorphism." },
  { file: "q_cs03.json",  icon: "#️⃣", title: "C# — Null Handling",            tag: "C#",  desc: "?? , ??=, ?. , nullable types, HasValue, IsNullOrWhiteSpace, is not null." },
  { file: "q_cs04.json",  icon: "#️⃣", title: "C# — Collections",              tag: "C#",  desc: "List, Dictionary, HashSet, Queue, Stack — when to use which, TryGetValue." },
  { file: "q_cs05.json",  icon: "#️⃣", title: "C# — LINQ & Lambdas",           tag: "C#",  desc: "Where/Select/First/Any/All/GroupBy/OrderBy, deferred execution, method vs query." },
  { file: "q_cs06.json",  icon: "#️⃣", title: "C# — Strings & StringBuilder",  tag: "C#",  desc: "Immutability, StringBuilder, Split/Join, Trim, interpolation, comparisons." },
  { file: "q_cs07.json",  icon: "#️⃣", title: "C# — ADO.NET",                  tag: "C#",  desc: "SqlConnection/Command/Reader, ExecuteReader/NonQuery/Scalar, parameters, DBNull." },
  { file: "q_cs08.json",  icon: "#️⃣", title: "C# — Exceptions & async/await", tag: "C#",  desc: "try/catch/finally, throw vs throw ex, async/await, Task, deadlocks, CancellationToken." },

  // ── Hidden sets: not shown on the welcome grid by default,
  //    only surface via the search box (match on tag or title). ──
  { file: "q_RosenCh1-4.json",    icon: "📘",  title: "Rosen — Discrete Math (Ch 1-4)", tag: "RosenCh1-4",    desc: "Logic, sets, functions, induction — 40 Q from Rosen Ch 1-4.", hidden: true },
  { file: "q_RosenCh614.json",    icon: "📗",  title: "Rosen — Discrete Math (Ch 6-14)", tag: "RosenCh614",    desc: "Counting, graphs, trees, advanced topics — 50 Q from Rosen Ch 6-14.", hidden: true },
];

async function loadBundledQuestionSet(fileName) {
  try {
    const res = await fetch(fileName, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const ok = await importQuestionsData(fileName, data);
    if (ok) {
      DATA_WARNINGS.push(`${fileName} loaded. Delete it anytime from 📚 Sources → Imported.`);
      showDataWarnings();
    }
  } catch (e) {
    DATA_WARNINGS.push(`Could not load ${fileName}: ${e?.message || e}`);
    showDataWarnings();
  }
}

async function downloadBundledQuestionSet(fileName) {
  try {
    const res = await fetch(fileName, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    downloadJsonFile(fileName, data);
  } catch (e) {
    DATA_WARNINGS.push(`Could not download ${fileName}: ${e?.message || e}`);
    showDataWarnings();
  }
}

// Legacy alias kept for compatibility.
function loadDemoQuestions() {
  return loadBundledQuestionSet("q_demo.json");
}


// Render quiz cards and answer choices.
function renderQuiz(items) {
  const host = document.getElementById("quiz");
  if (!host) return;
  host.innerHTML = "";

  if (!items || items.length === 0) {
    const noSourcesAtAll =
      (!Array.isArray(SOURCE_DEFINITIONS) || SOURCE_DEFINITIONS.length === 0) &&
      getImportedSources().length === 0;
    const empty = document.createElement("section");
    empty.className = "card welcome-card";
    if (noSourcesAtAll) {
      const setsHtml = BUNDLED_SETS.map(
        (s) => `
        <div class="welcome-set" data-file="${escapeHTML(s.file)}" data-tag="${escapeHTML((s.tag || "").toLowerCase())}" data-title="${escapeHTML((s.title || "").toLowerCase())}" data-hidden="${s.hidden ? "true" : "false"}"${s.hidden ? " hidden" : ""}>
          <div class="welcome-set-head">
            <span class="welcome-set-icon">${s.icon}</span>
            <span class="welcome-set-title">${escapeHTML(s.title)}</span>
            <span class="welcome-set-tag" title="Category tag">#${escapeHTML(s.tag || "")}</span>
          </div>
          <p class="welcome-set-desc">${escapeHTML(s.desc)}</p>
          <div class="welcome-set-actions">
            <button type="button" class="welcome-set-load" data-file="${escapeHTML(s.file)}">▶ Load</button>
            <button type="button" class="welcome-set-download" data-file="${escapeHTML(s.file)}" title="Download as .json">⬇️</button>
          </div>
        </div>`
      ).join("");

      empty.innerHTML = `
        <h2 class="welcome-title">Welcome to MCQ Trainer</h2>
        <p class="welcome-text">Pick a pre-built question set below, or import your own <code>q_*.json</code>.</p>

        <div class="welcome-search">
          <span class="welcome-search-icon" aria-hidden="true">🔎</span>
          <input
            type="search"
            id="welcomeSearch"
            class="welcome-search-input"
            placeholder="Search by tag (e.g. networking, demo)…"
            autocomplete="off"
            spellcheck="false"
          />
          <button type="button" id="welcomeSearchClear" class="welcome-search-clear" aria-label="Clear search" hidden>✕</button>
        </div>

        <div class="welcome-sets-grid" id="welcomeSetsGrid">
          ${setsHtml}
        </div>
        <p class="welcome-search-empty" id="welcomeSearchEmpty" hidden>No matching tags. Try clearing the search.</p>

        <div class="welcome-custom">
          <div class="welcome-custom-title">Use your own questions</div>
          <div class="welcome-actions">
            <button type="button" id="welcomeImport">⤴️ Import .json</button>
            <button type="button" id="welcomeTemplate">⬇️ Download template</button>
          </div>
          <p class="welcome-hint">File name must start with <code>q_</code> and end with <code>.json</code>. Loaded sets can be deleted from <strong>📚 Sources → Imported</strong>.</p>
        </div>
      `;
    } else {
      empty.innerHTML = `
        <h2 class="welcome-title">No questions to show</h2>
        <p class="welcome-text">Your current Sources / Categories filter is hiding everything. Open <strong>📚 Sources</strong> and enable at least one source or category.</p>
      `;
    }
    host.appendChild(empty);
    empty.querySelector("#welcomeImport")?.addEventListener("click", () => {
      openImportPromptModal();
    });
    empty.querySelector("#welcomeTemplate")?.addEventListener("click", () => {
      downloadQuestionsTemplate();
    });
    empty.querySelectorAll(".welcome-set-load").forEach((btn) => {
      btn.addEventListener("click", () => {
        const f = btn.getAttribute("data-file");
        if (f) loadBundledQuestionSet(f);
      });
    });
    empty.querySelectorAll(".welcome-set-download").forEach((btn) => {
      btn.addEventListener("click", () => {
        const f = btn.getAttribute("data-file");
        if (f) downloadBundledQuestionSet(f);
      });
    });

    // ── Welcome tag search ─────────────────────────────
    const searchInput = empty.querySelector("#welcomeSearch");
    const searchClear = empty.querySelector("#welcomeSearchClear");
    const setsGrid    = empty.querySelector("#welcomeSetsGrid");
    const emptyMsg    = empty.querySelector("#welcomeSearchEmpty");

    function applyWelcomeFilter() {
      const q = (searchInput?.value || "").trim().toLowerCase();
      if (searchClear) searchClear.hidden = q.length === 0;
      const cards = setsGrid?.querySelectorAll(".welcome-set") || [];
      let visible = 0;
      cards.forEach((card) => {
        const isHidden = card.getAttribute("data-hidden") === "true";
        if (!q) {
          // No search → show only public cards, keep hidden ones out of sight.
          card.hidden = isHidden;
          if (!isHidden) visible++;
          return;
        }
        const tag   = card.getAttribute("data-tag")   || "";
        const title = card.getAttribute("data-title") || "";
        const match = tag.includes(q) || title.includes(q);
        card.hidden = !match;
        if (match) visible++;
      });
      // "No matches" message only when actively searching and nothing visible.
      if (emptyMsg) emptyMsg.hidden = !(q && visible === 0);
    }

    searchInput?.addEventListener("input", applyWelcomeFilter);
    searchClear?.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      applyWelcomeFilter();
      searchInput?.focus();
    });

    return;
  }

  if (!shuffleMode) items.sort((a, b) => a.number - b.number);
  items.forEach((q, displayIndex) => {
    const card = document.createElement("section");
    card.className = "card";
    card.dataset.number = String(q.number);
    card.dataset.qid = getQuestionId(q);
    const qText =
      currentLang === "el" ? q.question_el || q.question_en : q.question_en;
    const choices =
      currentLang === "el" ? q.choices_el || q.choices_en : q.choices_en;

    const qHeader = document.createElement("div");
    qHeader.className = "q-header";

    const qIndex = document.createElement("span");
    qIndex.className = "q-index";
    qIndex.textContent = String(displayIndex + 1);
    qHeader.appendChild(qIndex);

    const qTitle = document.createElement("div");
    qTitle.className = "q-title";
    qTitle.textContent = `${qText || "-"}`;
    qHeader.appendChild(qTitle);
    card.appendChild(qHeader);
    if (q.image) {
      const img = document.createElement("img");
      img.src = q.image;
      img.className = "q-image";
      img.loading = "lazy";
      card.appendChild(img);
    }
    if (q.image_answers) {
      const imgAns = document.createElement("img");
      imgAns.src = q.image_answers;
      imgAns.className = "answers-image";
      imgAns.loading = "lazy";
      card.appendChild(imgAns);
    }
    if (q.code && q.code.trim().length > 0) {
      const pre = document.createElement("pre");
      const codeTag = document.createElement("code");
      codeTag.textContent = q.code;
      pre.className = "q-code";
      pre.appendChild(codeTag);
      card.appendChild(pre);
    }
    const choicesWrap = document.createElement("div");
    choicesWrap.className = "choices";

    const numChoices = Array.isArray(choices) ? choices.length : 4;
    const letters = ["A", "B", "C", "D", "E", "F", "G", "H"].slice(0, Math.max(2, Math.min(8, numChoices)));

    letters.forEach((letter, i) => {
      const choice = document.createElement("div");
      choice.className = "choice";
      choice.dataset.i = i;
      choice.innerHTML = `<span class="tick"></span><span class="letter">${letter}</span><span class="text">${escapeHTML(
        choices[i] || ""
      )}</span>`;
      choice.addEventListener("click", () => onSelectChoice(q, choice, card));
      choicesWrap.appendChild(choice);
    });
    card.appendChild(choicesWrap);
    const saved = progress.answered[getQuestionId(q)];
    if (saved) {
      card.querySelectorAll(".choice").forEach((c, idx) => {
        if (idx === saved.correct) c.classList.add("correct");
        if (idx === saved.selected && saved.selected !== saved.correct)
          c.classList.add("wrong");
      });
    }
    const actions = document.createElement("div");
    actions.className = "actions";
    const btn = document.createElement("button");
    btn.className = "btn-toggle";
    btn.textContent = "Show answer";
    actions.appendChild(btn);
    card.appendChild(actions);
    const ansBox = document.createElement("div");
    ansBox.className = "answer";
    ansBox.setAttribute("aria-live", "polite");
    card.appendChild(ansBox);

    btn.addEventListener("click", () => {
      if (examMode || godlikeMode) return; // Block manual reveal while Exam or Godlike mode is enabled.
      const correct = getCorrectIndex(q);
      const isShowing = ansBox.classList.contains("show");
      if (isShowing) {
        ansBox.classList.remove("show");
        btn.textContent = "Show answer";
        card
          .querySelectorAll(".choice")
          .forEach((el) => el.classList.remove("correct"));
        logActivity("reveal", { qid: getQuestionId(q), n: q.number, action: "hide" });
      } else {
        card
          .querySelectorAll(".choice")
          .forEach((el, idx) =>
            el.classList.toggle("correct", idx === correct)
          );
        ansBox.textContent = `Correct: ${["A", "B", "C", "D", "E", "F", "G"][correct]
          }`;
        ansBox.classList.add("show");
        btn.textContent = "Hide answer";
        logActivity("reveal", { qid: getQuestionId(q), n: q.number, action: "show" });
      }
    });

    host.appendChild(card);
  });
}

function updateScoreUI() {
  const box = document.getElementById("scoreBox");
  box.innerHTML = `Correct: <span id="score-correct">${progress.correct
    }</span> / <span id="score-total">${progress.total}</span>`;

  const godModeIcon = godlikeMode ? "⚡" : "🧠";
  const godModeTitle = godlikeMode ? "God Mode: ON" : "God Mode: OFF";

  const godlikeBtn = document.getElementById("toggleGodlike");
  const mobileGodlikeBtn = document.getElementById("m-toggleGodlike");
  [godlikeBtn, mobileGodlikeBtn].forEach((btn) => {
    if (!btn) return;
    btn.classList.toggle("active", godlikeMode);
    setButtonIconLabel(btn, godModeIcon, "God Mode");
    btn.title = godModeTitle;
    btn.setAttribute("aria-label", godModeTitle);
  });

  const toggleAllBtn = document.getElementById("toggleAll");
  const mobileToggleAllBtn = document.getElementById("m-toggleAll");
  if (godlikeMode || examMode) {
    toggleAllBtn.disabled = true; // Disable "Show all" while Exam or Godlike mode is active.
    if (mobileToggleAllBtn) mobileToggleAllBtn.disabled = true;
  } else {
    toggleAllBtn.disabled = false; // Re-enable "Show all" when both modes are off.
    if (mobileToggleAllBtn) mobileToggleAllBtn.disabled = false;
  }
}

function onSelectChoice(q, choiceEl, card) {
  const qid = getQuestionId(q);
  if (progress.answered[qid]) return;
  const selected = Number(choiceEl.dataset.i);
  const correctIndex = getCorrectIndex(q);
  const choices = card.querySelectorAll(".choice");
  choices.forEach((c, idx) => {
    if (idx === correctIndex) c.classList.add("correct");
    if (idx === selected && selected !== correctIndex) c.classList.add("wrong");
  });
  progress.total++;
  const isCorrect = selected === correctIndex;
  if (isCorrect) progress.correct++;
  recordQuestionAttempt(q, isCorrect);
  progress.answered[qid] = { selected, correct: correctIndex, isCorrect };
  saveProgress();
  updateScoreUI();
  logActivity("answer", {
    qid,
    n: q.number,
    sel: selected,
    cor: correctIndex,
    ok: isCorrect,
    exam: examMode,
    god: godlikeMode,
  });
  if (godlikeMode && !isCorrect) {
    const modal = document.getElementById("godlikeModal");
    modal.style.display = "flex";
    document.getElementById("closeGodlike").onclick = () => {
      modal.style.display = "none";
      localStorage.removeItem("quiz-progress");
      progress = { answered: {}, correct: 0, total: 0 };
      applySourceFilter();
      updateScoreUI();
    };
  }
}

function triggerExplosion() {
  const container = document.getElementById("explosionEffect");
  container.innerHTML = "";
  container.style.display = "block";
  const particles = 30;
  for (let i = 0; i < particles; i++) {
    const p = document.createElement("div");
    p.className = "explosion-particle";
    const angle = Math.random() * 2 * Math.PI;
    const distance = 200 + Math.random() * 150;
    const dx = Math.cos(angle) * distance + "px";
    const dy = Math.sin(angle) * distance + "px";
    p.style.setProperty("--dx", dx);
    p.style.setProperty("--dy", dy);
    container.appendChild(p);
  }
  setTimeout(() => {
    container.style.display = "none";
    container.innerHTML = "";
  }, 900);
}

function shuffleArray(arr) {
  return arr
    .map((x) => ({ x, r: Math.random() }))
    .sort((a, b) => a.r - b.r)
    .map((o) => o.x);
}

document.addEventListener("DOMContentLoaded", async () => {
  loadProgress();
  setDataSource(await loadQuestionData());
  showDataWarnings();
  sanitizeProgressForCurrentData();
  renderSourceChecklist();
  renderCategoryChecklist();
  applySourceFilter();
  updateScoreUI();

  // Proctor: record app launch + every off-screen blur and return-to-screen.
  // Blur is the canonical cheat indicator — the student left the quiz tab.
  logActivity("app", { event: "launch", url: location.href });
  window.addEventListener("blur",  () => logActivity("blur",  { event: "blur"  }));
  window.addEventListener("focus", () => logActivity("focus", { event: "focus" }));
  document.addEventListener("visibilitychange", () => {
    logActivity(document.hidden ? "blur" : "focus", { event: "visibilitychange", hidden: document.hidden });
  });

  document.getElementById("filterCycle")?.addEventListener("click", (e) => {
    e.stopPropagation();
    const menu = document.getElementById("sourceFilterMenu");
    const isOpen = menu && !menu.hidden;
    setSourceFilterMenuOpen(!isOpen);
  });

  document.getElementById("m-filterCycle")?.addEventListener("click", () => {
    document.getElementById("filterCycle")?.click();
  });

  document.getElementById("sourceFilterSelectAll")?.addEventListener("click", () => {
    setAllSourcesSelected(true);
  });

  document.getElementById("sourceFilterClearAll")?.addEventListener("click", () => {
    setAllSourcesSelected(false);
  });

  document.getElementById("sourceFilterRefresh")?.addEventListener("click", () => {
    reloadSourcesAndFilters();
  });

  document.getElementById("sourceDownloadTemplate")?.addEventListener("click", () => {
    downloadQuestionsTemplate();
  });

  document.getElementById("sourceImportJson")?.addEventListener("click", () => {
    openImportPromptModal();
  });

  document.getElementById("importedDeleteAll")?.addEventListener("click", () => {
    confirmDeleteAllImportedSources();
  });

  wireImportPromptModal();
  wireSourcesPanelSearch();

  renderImportedSourcesList();

  document
    .getElementById("categoryFilterSelectAll")
    ?.addEventListener("click", () => {
      setAllCategoriesSelected(true);
    });

  document
    .getElementById("categoryFilterClearAll")
    ?.addEventListener("click", () => {
      setAllCategoriesSelected(false);
    });

  document.addEventListener("click", (event) => {
    const menu = document.getElementById("sourceFilterMenu");
    const triggerDesktop = document.getElementById("filterCycle");
    const triggerMobile = document.getElementById("m-filterCycle");
    if (!menu || menu.hidden) return;
    const target = event.target;
    if (
      menu.contains(target) ||
      triggerDesktop?.contains(target) ||
      triggerMobile?.contains(target)
    ) {
      return;
    }
    setSourceFilterMenuOpen(false);
  });
});

function getCurrentTheme() {
  if (document.body.classList.contains("gay")) return "gay";
  if (document.body.classList.contains("dark")) return "dark";
  return "light";
}

function updateTitleForTheme(theme) {
  const titleEl = document.getElementById("appTitle");
  if (!titleEl) return;
  titleEl.textContent =
    theme === "gay" ? "MCQ Trainer (Gay Edition)" : "MCQ Trainer";
}

function setThemeButtonsLabel(currentTheme) {
  const nextThemeMeta = {
    dark: { icon: "💡", label: "Light Mode" },
    light: { icon: "🌈", label: "Gay Mode" },
    gay: { icon: "🌙", label: "Dark Mode" },
  }[currentTheme];

  const desktopBtn = document.getElementById("toggleTheme");
  const mobileBtn = document.getElementById("m-toggleTheme");

  [desktopBtn, mobileBtn].forEach((btn) => {
    if (!btn) return;
    setButtonIconLabel(btn, nextThemeMeta.icon, "Theme");
    btn.setAttribute("aria-label", `Switch to ${nextThemeMeta.label}`);
    btn.title = `Switch to ${nextThemeMeta.label}`;
  });
}

function applyTheme(theme) {
  document.body.classList.remove("dark", "gay");
  if (theme === "dark" || theme === "gay") {
    document.body.classList.add(theme);
  }
  setThemeButtonsLabel(theme);
  updateTitleForTheme(theme);
}

function cycleTheme() {
  if (getCurrentTheme() === "gay") {
    openGayThemeModal();
    return;
  }
  const nextTheme = {
    dark: "light",
    light: "gay",
    gay: "dark",
  }[getCurrentTheme()];
  applyTheme(nextTheme);
}

document.getElementById("toggleTheme").addEventListener("click", cycleTheme);
document.getElementById("m-toggleTheme")?.addEventListener("click", cycleTheme);
setThemeButtonsLabel(getCurrentTheme());
updateTitleForTheme(getCurrentTheme());

const gayThemeModal = document.getElementById("gayThemeModal");
const gayCelebrateModal = document.getElementById("gayCelebrateModal");
const gayThemeStep1 = document.getElementById("gayThemeStep1");
const gayThemeStep2 = document.getElementById("gayThemeStep2");
const gayThemeYes = document.getElementById("gayThemeYes");
const gayThemeNo = document.getElementById("gayThemeNo");
const gayThemeYes2 = document.getElementById("gayThemeYes2");
const gayThemeNo2 = document.getElementById("gayThemeNo2");
const gayCelebrateClose = document.getElementById("gayCelebrateClose");
const gayNoPersistModal = document.getElementById("gayNoPersistModal");
const gayNoPersistClose = document.getElementById("gayNoPersistClose");
const modeResetConfirmModal = document.getElementById("modeResetConfirmModal");
const modeResetConfirmText = document.getElementById("modeResetConfirmText");
const modeResetConfirmYes = document.getElementById("modeResetConfirmYes");
const modeResetConfirmNo = document.getElementById("modeResetConfirmNo");
const GAY_NO_MOVE_LIMIT = 69;
const GAY_NO_HIDE_PHASE_START = 10;
const GAY_NO_HIDE_PHASE_MS = 10000;
let gayNoHoverCount = 0;
let gayNoHidePhaseActive = false;
let gayNoHidePhaseTimer = null;
let gayNoHidePhaseDone = false;
let gayNoLastMoveAt = 0;
let pendingModeResetAction = null;

function moveNoButtonRandomly(btn) {
  if (!btn) return;
  if (gayNoHoverCount >= GAY_NO_MOVE_LIMIT) return;
  const now = Date.now();
  if (now - gayNoLastMoveAt < 120) return;
  gayNoLastMoveAt = now;
  gayNoHoverCount++;
  const pad = 12;
  const maxX = Math.max(pad, window.innerWidth - btn.offsetWidth - pad);
  const maxY = Math.max(pad, window.innerHeight - btn.offsetHeight - pad);
  btn.style.position = "fixed";
  btn.style.left = `${Math.floor(Math.random() * (maxX - pad + 1)) + pad}px`;
  btn.style.top = `${Math.floor(Math.random() * (maxY - pad + 1)) + pad}px`;
}

function placeNoBehindYes(approach = 0) {
  if (!gayThemeNo2 || !gayThemeYes2) return;
  const actions = gayThemeNo2.parentElement;
  if (!actions) return;

  const parentRect = actions.getBoundingClientRect();
  const yesRect = gayThemeYes2.getBoundingClientRect();
  const noRect = gayThemeNo2.getBoundingClientRect();

  const yesLeft = yesRect.left - parentRect.left;
  const yesTop = yesRect.top - parentRect.top;
  // Keep "No" behind "Yes" and reveal only a thin strip.
  // As pointer gets closer (approach -> 1), the strip gets smaller.
  const visiblePx = Math.max(2, Math.round(22 - 20 * approach));
  const left = yesLeft + yesRect.width - noRect.width - visiblePx;

  actions.style.position = "relative";
  gayThemeYes2.style.position = "relative";
  gayThemeYes2.style.zIndex = "3";
  gayThemeNo2.style.position = "absolute";
  gayThemeNo2.style.top = `${yesTop}px`;
  gayThemeNo2.style.left = `${left}px`;
  gayThemeNo2.style.zIndex = "2";
  gayThemeNo2.style.opacity = "1";
  gayThemeNo2.style.pointerEvents = "auto";
  gayThemeNo2.style.transition = "left 0.08s linear";
}

function handleHidePhasePointerMove(event) {
  if (!gayNoHidePhaseActive || !gayThemeNo2) return;
  const rect = gayThemeNo2.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = event.clientX - cx;
  const dy = event.clientY - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const approach = Math.max(0, Math.min(1, 1 - dist / 260));
  placeNoBehindYes(approach);
}

function endGayNoHidePhase() {
  gayNoHidePhaseActive = false;
  gayNoHidePhaseDone = true;
  if (gayNoHidePhaseTimer) {
    clearTimeout(gayNoHidePhaseTimer);
    gayNoHidePhaseTimer = null;
  }
  if (gayThemeNo2) {
    gayThemeNo2.style.position = "";
    gayThemeNo2.style.left = "";
    gayThemeNo2.style.top = "";
    gayThemeNo2.style.zIndex = "";
    gayThemeNo2.style.opacity = "";
    gayThemeNo2.style.transition = "";
    gayThemeNo2.style.pointerEvents = "";
  }
  if (gayThemeYes2) {
    gayThemeYes2.style.position = "";
    gayThemeYes2.style.zIndex = "";
  }
  document.removeEventListener("pointermove", handleHidePhasePointerMove);
}

function startGayNoHidePhase() {
  if (gayNoHidePhaseActive) return;
  gayNoHidePhaseActive = true;
  placeNoBehindYes(0);
  document.addEventListener("pointermove", handleHidePhasePointerMove);
  if (gayNoHidePhaseTimer) clearTimeout(gayNoHidePhaseTimer);
  gayNoHidePhaseTimer = setTimeout(() => {
    endGayNoHidePhase();
  }, GAY_NO_HIDE_PHASE_MS);
}

function resetGayThemeModal() {
  gayNoHoverCount = 0;
  gayNoLastMoveAt = 0;
  endGayNoHidePhase();
  gayNoHidePhaseDone = false;
  if (gayThemeStep1) gayThemeStep1.style.display = "block";
  if (gayThemeStep2) gayThemeStep2.style.display = "none";
  if (gayThemeNo2) {
    gayThemeNo2.style.position = "";
    gayThemeNo2.style.left = "";
    gayThemeNo2.style.top = "";
  }
}

function openGayThemeModal() {
  resetGayThemeModal();
  if (gayThemeModal) gayThemeModal.style.display = "flex";
}

function closeGayThemeModal() {
  if (gayThemeModal) gayThemeModal.style.display = "none";
  resetGayThemeModal();
}

function handleGayNoAfterPersistence() {
  closeGayThemeModal();
  applyTheme("dark");
  if (gayNoPersistModal) gayNoPersistModal.style.display = "flex";
}

gayThemeNo?.addEventListener("click", closeGayThemeModal);
gayThemeYes?.addEventListener("click", () => {
  if (gayThemeStep1) gayThemeStep1.style.display = "none";
  if (gayThemeStep2) gayThemeStep2.style.display = "block";
});
gayThemeYes2?.addEventListener("click", () => {
  closeGayThemeModal();
  if (gayCelebrateModal) gayCelebrateModal.style.display = "flex";
});
gayCelebrateClose?.addEventListener("click", () => {
  if (gayCelebrateModal) gayCelebrateModal.style.display = "none";
});
gayNoPersistClose?.addEventListener("click", () => {
  if (gayNoPersistModal) gayNoPersistModal.style.display = "none";
});

function resetQuizProgress() {
  const prev = { total: progress.total, correct: progress.correct };
  localStorage.removeItem("quiz-progress");
  progress = { answered: {}, correct: 0, total: 0 };
  logActivity("reset", { kind: "progress", prev });
}

function setExamModeState(enabled) {
  const prev = examMode;
  examMode = enabled;
  const examBtn = document.getElementById("toggleExam");
  const examBtnMobile = document.getElementById("m-toggleExam");
  examBtn?.classList.toggle("active", examMode);
  examBtnMobile?.classList.toggle("active", examMode);
  document.body.classList.toggle("exam-on", examMode);
  const revealBtn = document.getElementById("revealAll");
  revealBtn?.classList.toggle("disabled", examMode);
  if (prev !== enabled) {
    logActivity("mode", { name: "exam", state: enabled ? "on" : "off" });
  }
}

function setGodModeState(enabled) {
  const prev = godlikeMode;
  godlikeMode = enabled;
  if (prev !== enabled) {
    logActivity("mode", { name: "god", state: enabled ? "on" : "off" });
  }
}

function closeModeResetConfirm() {
  if (modeResetConfirmModal) modeResetConfirmModal.style.display = "none";
  document.getElementById("modeResetConfirmDialog")?.classList.remove("is-destructive");
  if (modeResetConfirmYes) modeResetConfirmYes.textContent = "Yes";
  if (modeResetConfirmNo)  modeResetConfirmNo.textContent  = "No";
  pendingModeResetAction = null;
  pendingModeResetCancel = null;
}

let pendingModeResetCancel = null;

function openModeResetConfirm(message, onConfirm, onCancel, opts = {}) {
  if (!modeResetConfirmModal || !modeResetConfirmText) {
    onConfirm?.();
    return;
  }
  modeResetConfirmText.textContent = message;
  pendingModeResetAction = onConfirm;
  pendingModeResetCancel = typeof onCancel === "function" ? onCancel : null;

  const dialog = document.getElementById("modeResetConfirmDialog");
  if (opts.destructive) {
    dialog?.classList.add("is-destructive");
    if (modeResetConfirmYes) modeResetConfirmYes.textContent = opts.confirmLabel || "Delete";
    if (modeResetConfirmNo)  modeResetConfirmNo.textContent  = opts.cancelLabel  || "Cancel";
  } else {
    dialog?.classList.remove("is-destructive");
    if (modeResetConfirmYes) modeResetConfirmYes.textContent = opts.confirmLabel || "Yes";
    if (modeResetConfirmNo)  modeResetConfirmNo.textContent  = opts.cancelLabel  || "No";
  }

  modeResetConfirmModal.style.display = "flex";
}

modeResetConfirmYes?.addEventListener("click", () => {
  const action = pendingModeResetAction;
  closeModeResetConfirm();
  action?.();
});

modeResetConfirmNo?.addEventListener("click", () => {
  const cancel = pendingModeResetCancel;
  closeModeResetConfirm();
  cancel?.();
});

["mouseenter", "pointerdown", "touchstart", "click"].forEach((evt) => {
  gayThemeNo2?.addEventListener(evt, (e) => {
    if (gayNoHidePhaseActive) {
      e.preventDefault();
      if (evt === "click" && gayNoHoverCount >= GAY_NO_MOVE_LIMIT) {
        handleGayNoAfterPersistence();
      }
      return;
    }

    if (
      !gayNoHidePhaseDone &&
      gayNoHoverCount >= GAY_NO_HIDE_PHASE_START &&
      gayNoHoverCount < GAY_NO_MOVE_LIMIT
    ) {
      e.preventDefault();
      startGayNoHidePhase();
      return;
    }

    if (gayNoHoverCount < GAY_NO_MOVE_LIMIT) {
      e.preventDefault();
      moveNoButtonRandomly(gayThemeNo2);
      return;
    }
    if (evt === "click") {
      e.preventDefault();
      handleGayNoAfterPersistence();
    }
  });
});

// =======================================================
// --- Simple Timer with Start / Stop / Reset ---
// =======================================================

const display = document.getElementById("timer-display");
const btnStart = document.getElementById("timer-start");
const btnStop = document.getElementById("timer-stop");
const btnReset = document.getElementById("timer-reset");

let startTime = 0; // Timestamp when the timer was last started.
let elapsed = 0; // Total accumulated elapsed time in milliseconds.
let timerId = null; // Active interval id, or null when stopped.

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  const millis = String(ms % 1000).padStart(3, "0");
  return `${minutes}:${seconds}.${millis}`;
}

function updateDisplay() {
  const now = Date.now();
  const current = elapsed + (now - startTime);
  display.textContent = formatTime(current);
}

function startTimer() {
  if (timerId !== null) return; // Timer is already running.

  startTime = Date.now();
  timerId = setInterval(updateDisplay, 10);
}

function stopTimer() {
  if (timerId === null) return;

  clearInterval(timerId);
  timerId = null;
  elapsed += Date.now() - startTime;
  display.textContent = formatTime(elapsed);
}

function resetTimer() {
  clearInterval(timerId);
  timerId = null;
  elapsed = 0;
  startTime = 0;
  display.textContent = "00:00.000";
}

btnStart.addEventListener("click", () => {
  startTimer();
  logActivity("timer", { event: "start" });
  PROCTOR_TONES["timer-tick"]?.();
});
btnStop.addEventListener("click", () => {
  stopTimer();
  logActivity("timer", { event: "stop", elapsedMs: elapsed });
  PROCTOR_TONES["timer-fire"]?.();
});
btnReset.addEventListener("click", () => {
  resetTimer();
  logActivity("timer", { event: "reset" });
  PROCTOR_TONES["reset"]?.();
});

document.getElementById("shuffleBtn").addEventListener("click", () => {
  shuffleMode = !shuffleMode;
  const btn = document.getElementById("shuffleBtn");
  const mobileBtn = document.getElementById("m-shuffleBtn");
  if (shuffleMode) {
    CURRENT_DATA = shuffleArray(CURRENT_DATA);
    showToast("Shuffle questions: ON");
    [btn, mobileBtn].forEach((b) => {
      if (!b) return;
      b.classList.add("active");
      b.title = "Shuffle questions: ON";
      b.setAttribute("aria-label", "Shuffle questions ON");
    });
  } else {
    CURRENT_DATA.sort((a, b) => a.number - b.number); // Restore default question order.
    showToast("Shuffle questions: OFF");
    [btn, mobileBtn].forEach((b) => {
      if (!b) return;
      b.classList.remove("active");
      b.title = "Shuffle questions: OFF";
      b.setAttribute("aria-label", "Shuffle questions OFF");
    });
  }
  applySourceFilter();
  btn.classList.add("disabled");
  setTimeout(() => btn.classList.remove("disabled"), 2000);
});


document.getElementById("toggleExam").addEventListener("click", () => {
  if (!examMode) {
    setExamModeState(true);
    applySourceFilter();
    updateScoreUI();
    return;
  }

  openModeResetConfirm(
    "Are you sure you want to disable Exam Mode? This will reset your progress.",
    () => {
      setExamModeState(false);
      resetQuizProgress();
      applySourceFilter();
      updateScoreUI();
    }
  );
});

document.getElementById("toggleGodlike")?.addEventListener("click", () => {
  if (!godlikeMode) {
    setGodModeState(true);
    updateScoreUI();
    return;
  }

  openModeResetConfirm(
    "Are you sure you want to disable God Mode? This will reset your progress.",
    () => {
      setGodModeState(false);
      resetQuizProgress();
      applySourceFilter();
      updateScoreUI();
    }
  );
});

document.getElementById("resetQuiz").addEventListener("click", () => {
  openModeResetConfirm(
    "Are you sure you want to reset all progress?",
    () => {
      resetQuizProgress();
      applySourceFilter();
      updateScoreUI();
    }
  );
});

document.getElementById("new-fact").addEventListener("click", () => {
  const fact = document.getElementById("fact");
  fact.textContent = "Loading...";
  fetch("https://catfact.ninja/fact")
    .then((res) => res.json())
    .then((data) => (fact.textContent = data.fact))
    .catch(() => (fact.textContent = "Failed to load fact ðŸ˜¿"));
});

function setWidgetsVisible(show) {
  document
    .querySelectorAll(".side-banner, .cat-widget")
    .forEach((el) => el.classList.toggle("visible", show));
}

function toggleWidgetsVisibility() {
  const hasVisible = Array.from(
    document.querySelectorAll(".side-banner, .cat-widget")
  ).some((el) => el.classList.contains("visible"));
  setWidgetsVisible(!hasVisible);
}

function getWidgetDisplayMode() {
  const widgetsVisible = Array.from(
    document.querySelectorAll(".side-banner, .cat-widget")
  ).some((el) => el.classList.contains("visible"));
  const timer = document.getElementById("timer-wrapper");
  const timerVisible = !!timer && !timer.classList.contains("timer-hidden");
  if (widgetsVisible && timerVisible) return "all";
  if (widgetsVisible) return "widgets";
  if (timerVisible) return "timer";
  return "none";
}

function setTimerVisible(show) {
  const timer = document.getElementById("timer-wrapper");
  if (!timer) return;
  timer.classList.toggle("timer-hidden", !show);
}

function toggleTimerVisibility() {
  const timer = document.getElementById("timer-wrapper");
  if (!timer) return;
  const isVisible = !timer.classList.contains("timer-hidden");
  setTimerVisible(!isVisible);
  updateWidgetButtonsUI(getWidgetDisplayMode());
}

function applyWidgetDisplayMode(mode) {
  if (mode === "widgets") {
    setWidgetsVisible(true);
    setTimerVisible(false);
  } else if (mode === "timer") {
    setWidgetsVisible(false);
    setTimerVisible(true);
  } else if (mode === "all") {
    setWidgetsVisible(true);
    setTimerVisible(true);
  } else {
    setWidgetsVisible(false);
    setTimerVisible(false);
  }
  updateWidgetButtonsUI(getWidgetDisplayMode());
}

function updateWidgetButtonsUI(mode) {
  const map = {
    widgets: { icon: "🧩", label: "Widgets", title: "Display mode: Widgets only" },
    timer: { icon: "⏱️", label: "Timer", title: "Display mode: Timer only" },
    all: { icon: "🧩⏱️", label: "Both", title: "Display mode: Widgets + Timer" },
    none: { icon: "🚫", label: "Off", title: "Display mode: Off" },
  };
  const meta = map[mode] || map.none;
  const desktopBtn = document.getElementById("toggleWidgets");
  const mobileBtn = document.getElementById("m-toggleWidgets");
  [desktopBtn, mobileBtn].forEach((btn) => {
    if (!btn) return;
    setButtonIconLabel(btn, meta.icon, `Widgets: ${meta.label}`);
    btn.title = `${meta.title} (click to rotate)`;
    btn.setAttribute("aria-label", `${meta.title}. Click to rotate mode.`);
  });
}

function rotateWidgetDisplayMode() {
  const current = getWidgetDisplayMode();
  const next = {
    timer: "all",
    all: "widgets",
    widgets: "none",
    none: "timer",
  }[current] || "timer";
  applyWidgetDisplayMode(next);
}

document.getElementById("toggleWidgets").addEventListener("click", () => {
  rotateWidgetDisplayMode();
});
document.getElementById("m-toggleWidgets")?.addEventListener("click", () => {
  rotateWidgetDisplayMode();
});
let lastW = 0;
let lastT = 0;
document.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  const now = Date.now();

  if (key === "w") {
    if (now - lastW < 300) {
      rotateWidgetDisplayMode();
    }
    lastW = now;
  }

  if (key === "t") {
    if (now - lastT < 300) {
      toggleTimerVisibility();
    }
    lastT = now;
  }
});

const timerWidget = document.getElementById("timer-wrapper");
let offsetX = 0,
  offsetY = 0,
  isDragging = false;
let timerPointerId = null;

timerWidget.addEventListener("pointerdown", (e) => {
  if (e.pointerType === "mouse" && e.button !== 0) return;
  // Keep timer controls clickable; start drag only outside control buttons.
  if (e.target.closest("#timer-controls button")) return;
  const rect = timerWidget.getBoundingClientRect();
  // Convert from right-anchored to left/top absolute coords before drag.
  timerWidget.style.right = "auto";
  timerWidget.style.left = `${rect.left}px`;
  timerWidget.style.top = `${rect.top}px`;

  isDragging = true;
  timerPointerId = e.pointerId;
  offsetX = e.clientX - rect.left;
  offsetY = e.clientY - rect.top;
  timerWidget.setPointerCapture(e.pointerId);
  e.preventDefault();
});

timerWidget.addEventListener("pointermove", (e) => {
  if (!isDragging || e.pointerId !== timerPointerId) return;
  const pad = 8;
  const maxX = Math.max(pad, window.innerWidth - timerWidget.offsetWidth - pad);
  const maxY = Math.max(pad, window.innerHeight - timerWidget.offsetHeight - pad);
  const left = clamp(e.clientX - offsetX, pad, maxX);
  const top = clamp(e.clientY - offsetY, pad, maxY);
  timerWidget.style.left = `${left}px`;
  timerWidget.style.top = `${top}px`;
});

function stopTimerDrag(e) {
  if (e.pointerId !== timerPointerId) return;
  isDragging = false;
  timerPointerId = null;
}

timerWidget.addEventListener("pointerup", stopTimerDrag);
timerWidget.addEventListener("pointercancel", stopTimerDrag);

function makeDraggable(el) {
  let isDown = false,
    offsetX = 0,
    offsetY = 0;
  const disableSelection = () => {
    document.body.style.userSelect = "none";
  };
  const enableSelection = () => {
    document.body.style.userSelect = "";
  };
  el.addEventListener("mousedown", (e) => {
    isDown = true;
    el.style.zIndex = 999999;
    offsetX = e.clientX - el.getBoundingClientRect().left;
    offsetY = e.clientY - el.getBoundingClientRect().top;
    disableSelection();
    e.preventDefault();
  });
  document.addEventListener("mouseup", () => {
    isDown = false;
    enableSelection();
  });
  document.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    const pad = 8;
    const maxX = Math.max(pad, window.innerWidth - el.offsetWidth - pad);
    const maxY = Math.max(pad, window.innerHeight - el.offsetHeight - pad);
    const left = clamp(e.clientX - offsetX, pad, maxX);
    const top = clamp(e.clientY - offsetY, pad, maxY);
    el.style.left = left + "px";
    el.style.top = top + "px";
    el.style.position = "fixed";
  });
}

let allShown = false;

document.getElementById("toggleAll").addEventListener("click", () => {
  const btn = document.getElementById("toggleAll");
  const mobileBtn = document.getElementById("m-toggleAll");

  if (examMode || godlikeMode) return;

  allShown = !allShown;

  document.querySelectorAll(".card").forEach((card) => {
    const qid = String(card.dataset.qid || "");
    const question = CURRENT_DATA.find((q) => getQuestionId(q) === qid);
    const correctIndex = getCorrectIndex(question);
    const ansBox = card.querySelector(".answer");

    if (!Number.isInteger(correctIndex)) return;

    if (allShown) {
      card.querySelectorAll(".choice").forEach((el, idx) => {
        el.classList.toggle("correct", idx === correctIndex);
      });

      ansBox.textContent = `Correct: ${["A", "B", "C", "D", "E", "F", "G"][correctIndex]}`;
      ansBox.classList.add("show");
      btn.textContent = "🙈";
      btn.setAttribute("aria-label", "Hide all answers");
      btn.title = "Hide all answers";
      if (mobileBtn) {
        setButtonIconLabel(mobileBtn, "🙈", "Hide All");
        mobileBtn.setAttribute("aria-label", "Hide all answers");
        mobileBtn.title = "Hide all answers";
      }
    } else {
      card.querySelectorAll(".choice").forEach((el) => {
        el.classList.remove("correct");
      });

      ansBox.classList.remove("show");
      ansBox.textContent = "";
      btn.textContent = "👁️";
      btn.setAttribute("aria-label", "Show all answers");
      btn.title = "Show all answers";
      if (mobileBtn) {
        setButtonIconLabel(mobileBtn, "👁️", "Show All");
        mobileBtn.setAttribute("aria-label", "Show all answers");
        mobileBtn.title = "Show all answers";
      }
    }
  });
});

document.getElementById("shuffle-answers-btn").addEventListener("click", () => {
  shuffleAnswersMode = !shuffleAnswersMode;
  const btn = document.getElementById("shuffle-answers-btn");
  const mobileBtn = document.getElementById("m-shuffle-answers-btn");

  if (shuffleAnswersMode) {
    showToast("Shuffle answers: ON");
    CURRENT_DATA.forEach((q) => {
      const correctAnswerIndex = getCorrectIndex(q);
      if (!Number.isInteger(correctAnswerIndex)) return;
      if (!Array.isArray(q.choices_en) || q.choices_en.length === 0) return;

      const correctAnswer = q.choices_en[correctAnswerIndex];
      const wrongAnswers = shuffleArray(
        q.choices_en.filter((_, idx) => idx !== correctAnswerIndex)
      );
      const randomIndex = Math.floor(Math.random() * (wrongAnswers.length + 1));
      wrongAnswers.splice(randomIndex, 0, correctAnswer);
      q.choices_en = wrongAnswers;
      q.correctIndex = randomIndex;
    });
    [btn, mobileBtn].forEach((b) => {
      if (!b) return;
      b.classList.add("active");
      b.title = "Shuffle answers: ON";
      b.setAttribute("aria-label", "Shuffle answers ON");
    });
  } else {
    showToast("Shuffle answers: OFF");
    CURRENT_DATA.forEach((q) => {
      const original = ORIGINAL_ANSWERS[getQuestionId(q)];
      if (!original) return;
      q.choices_en = [...original.choices_en];
      if (Number.isInteger(original.correctIndex)) {
        q.correctIndex = original.correctIndex;
      }
    });
    [btn, mobileBtn].forEach((b) => {
      if (!b) return;
      b.classList.remove("active");
      b.title = "Shuffle answers: OFF";
      b.setAttribute("aria-label", "Shuffle answers OFF");
    });
  }

  applySourceFilter();
  btn.classList.add("disabled");
  setTimeout(() => btn.classList.remove("disabled"), 2000);
});

document.querySelectorAll(".draggable").forEach((el) => {
  // Timer has its own pointer-based drag logic.
  if (el.id === "timer-wrapper") return;
  makeDraggable(el);
});

// Keep widgets hidden by default until explicitly toggled.
setWidgetsVisible(false);
updateWidgetButtonsUI(getWidgetDisplayMode());

const controlsShell = document.getElementById("controlsShell");
const controlsToggle = document.getElementById("controlsToggle");
const settingsBtn = document.getElementById("resetControlsPosition");
const settingsModal = document.getElementById("settingsModal");
const settingsClose = document.getElementById("settingsClose");
const settingsResetTimer = document.getElementById("settingsResetTimer");
const settingsResetWidgets = document.getElementById("settingsResetWidgets");
const settingsResetControls = document.getElementById("settingsResetControls");
const settingsQaFontSize = document.getElementById("settingsQaFontSize");
const settingsQaFontSizeValue = document.getElementById("settingsQaFontSizeValue");
const settingsQaFontReset = document.getElementById("settingsQaFontReset");
const QA_FONT_STORAGE_KEY = "qa-font-size-px-v1";
const controlsPanel = document.getElementById("controlsPanel");
const settingsControlsLayoutValue = document.getElementById("settingsControlsLayoutValue");
const settingsControlsHorizontal = document.getElementById("settingsControlsHorizontal");
const settingsControlsVertical = document.getElementById("settingsControlsVertical");
const CONTROLS_LAYOUT_STORAGE_KEY = "controls-layout-v1";
const settingsCompleteTest = document.getElementById("settingsCompleteTest");
const settingsHistoryList = document.getElementById("settingsHistoryList");
const settingsPracticeModeValue = document.getElementById("settingsPracticeModeValue");
const settingsPracticeOff = document.getElementById("settingsPracticeOff");
const settingsPracticeWrongOnce = document.getElementById("settingsPracticeWrongOnce");
const settingsPracticeWrongRepeat = document.getElementById("settingsPracticeWrongRepeat");
const settingsTabGeneral = document.getElementById("settingsTabGeneral");
const settingsTabHud = document.getElementById("settingsTabHud");
const settingsTabTest = document.getElementById("settingsTabTest");
const settingsTabDocker = document.getElementById("settingsTabDocker");
const settingsPanelGeneral = document.getElementById("settingsPanelGeneral");
const settingsPanelHud = document.getElementById("settingsPanelHud");
const settingsPanelTest = document.getElementById("settingsPanelTest");
const settingsPanelDocker = document.getElementById("settingsPanelDocker");
const SETTINGS_TAB_STORAGE_KEY = "settings-tab-v1";
const settingsDockerDownloadAll = document.getElementById("settingsDockerDownloadAll");
const settingsDockerDownloadManual = document.getElementById("settingsDockerDownloadManual");
const settingsDockerDownloadBundle = document.getElementById("settingsDockerDownloadBundle");
const settingsLocalServerDownloadScripts = document.getElementById("settingsLocalServerDownloadScripts");
const settingsOpenSetupGuide = document.getElementById("settingsOpenSetupGuide");
const settingsClearAllData = document.getElementById("settingsClearAllData");
const settingsAudioEnabled = document.getElementById("settingsAudioEnabled");
const settingsAudioVolume = document.getElementById("settingsAudioVolume");
const settingsAudioVolumeValue = document.getElementById("settingsAudioVolumeValue");
const settingsAudioTest = document.getElementById("settingsAudioTest");
const settingsActivityList = document.getElementById("settingsActivityList");
const settingsActivityCount = document.getElementById("settingsActivityCount");
const settingsActivityExportJson = document.getElementById("settingsActivityExportJson");
const settingsActivityExportCsv  = document.getElementById("settingsActivityExportCsv");
const settingsActivityClear     = document.getElementById("settingsActivityClear");
let __activityLogFilter = "all";

const docsModal = document.getElementById("docsModal");
const docsModalTitle = document.getElementById("docsModalTitle");
const docsModalBody = document.getElementById("docsModalBody");
const docsModalClose = document.getElementById("docsModalClose");

function closeDocsModal() {
  if (docsModal) docsModal.style.display = "none";
}

function openDocsModal({ title, body }) {
  if (docsModalTitle) docsModalTitle.textContent = title || "Setup Guide";
  if (docsModalBody) docsModalBody.textContent = body || "";
  if (docsModal) docsModal.style.display = "flex";
}

docsModalClose?.addEventListener("click", closeDocsModal);
docsModal?.addEventListener("click", (e) => {
  if (e.target === docsModal) closeDocsModal();
});

function toggleControlsCollapsed() {
  controlsShell?.classList.toggle("collapsed");
  const collapsed = controlsShell?.classList.contains("collapsed");
  controlsToggle.textContent = collapsed ? "▶" : "◀";
  controlsToggle.title = collapsed ? "Expand controls" : "Collapse controls";
  controlsToggle.setAttribute(
    "aria-label",
    collapsed ? "Expand controls" : "Collapse controls"
  );
}

function resetControlsPositionToDefault() {
  if (!controlsShell) return;
  // Clear drag-applied inline styles so CSS default layout takes over again.
  controlsShell.style.position = "";
  controlsShell.style.left = "";
  controlsShell.style.top = "";
  controlsShell.style.right = "";
  controlsShell.style.bottom = "";
  controlsShell.style.zIndex = "";
  controlsShell.style.marginLeft = "";
}

function resetTimerPositionToDefault() {
  const timer = document.getElementById("timer-wrapper");
  if (!timer) return;
  timer.style.position = "";
  timer.style.left = "";
  timer.style.top = "";
  timer.style.right = "";
  timer.style.bottom = "";
  timer.style.zIndex = "";
}

function resetWidgetsPositionToDefault() {
  const els = document.querySelectorAll(".cat-widget, .side-banner");
  els.forEach((el) => {
    el.style.position = "";
    el.style.left = "";
    el.style.top = "";
    el.style.right = "";
    el.style.bottom = "";
    el.style.zIndex = "";
    el.style.transform = "";
  });
}

function getStoredQaFontSizePx() {
  const raw = localStorage.getItem(QA_FONT_STORAGE_KEY);
  const n = Number(raw);
  if (!Number.isFinite(n)) return 16;
  return clamp(Math.round(n), 12, 22);
}

function applyQaFontSizePx(px) {
  const val = clamp(Math.round(Number(px) || 16), 12, 22);
  document.documentElement.style.setProperty("--qa-font-size", `${val}px`);
  if (settingsQaFontSize) settingsQaFontSize.value = String(val);
  if (settingsQaFontSizeValue) settingsQaFontSizeValue.textContent = `${val}px`;
  localStorage.setItem(QA_FONT_STORAGE_KEY, String(val));
}

function initQaFontSizeSetting() {
  applyQaFontSizePx(getStoredQaFontSizePx());
  settingsQaFontSize?.addEventListener("input", () => {
    applyQaFontSizePx(settingsQaFontSize.value);
  });
  settingsQaFontReset?.addEventListener("click", () => {
    applyQaFontSizePx(16);
  });
}

function getStoredControlsLayout() {
  // Default is horizontal unless user explicitly chose vertical.
  const raw = String(localStorage.getItem(CONTROLS_LAYOUT_STORAGE_KEY) || "").toLowerCase();
  return raw === "vertical" ? "vertical" : "horizontal";
}

function applyControlsLayout(layout) {
  const mode = layout === "vertical" ? "vertical" : "horizontal";
  controlsPanel?.classList.toggle("vertical", mode === "vertical");
  if (settingsControlsLayoutValue) {
    settingsControlsLayoutValue.textContent = mode === "vertical" ? "Vertical" : "Horizontal";
  }
  settingsControlsHorizontal?.classList.toggle("active", mode === "horizontal");
  settingsControlsVertical?.classList.toggle("active", mode === "vertical");
  localStorage.setItem(CONTROLS_LAYOUT_STORAGE_KEY, mode);
}

function initControlsLayoutSetting() {
  applyControlsLayout(getStoredControlsLayout());
  settingsControlsHorizontal?.addEventListener("click", () => applyControlsLayout("horizontal"));
  settingsControlsVertical?.addEventListener("click", () => applyControlsLayout("vertical"));
}

settingsTabGeneral?.addEventListener("click", () => setSettingsTab("general"));
settingsTabHud?.addEventListener("click", () => setSettingsTab("hud"));
settingsTabTest?.addEventListener("click", () => setSettingsTab("test"));
settingsTabDocker?.addEventListener("click", () => setSettingsTab("docker"));

function getStoredSettingsTab() {
  const raw = String(localStorage.getItem(SETTINGS_TAB_STORAGE_KEY) || "").toLowerCase();
  if (raw === "hud") return "hud";
  if (raw === "test") return "test";
  if (raw === "docker") return "docker";
  return "general";
}

function setSettingsTab(tab) {
  const t = tab === "hud" || tab === "test" || tab === "docker" ? tab : "general";
  localStorage.setItem(SETTINGS_TAB_STORAGE_KEY, t);

  const tabs = [
    { tab: "general", btn: settingsTabGeneral, panel: settingsPanelGeneral },
    { tab: "hud", btn: settingsTabHud, panel: settingsPanelHud },
    { tab: "test", btn: settingsTabTest, panel: settingsPanelTest },
    { tab: "docker", btn: settingsTabDocker, panel: settingsPanelDocker },
  ];
  tabs.forEach(({ tab: key, btn, panel }) => {
    btn?.classList.toggle("active", key === t);
    btn?.setAttribute("aria-selected", key === t ? "true" : "false");
    if (panel) panel.hidden = key !== t;
  });
}

function formatHistoryTimestamp(ts) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return String(ts || "");
  }
}

function renderHistoryList() {
  if (!settingsHistoryList) return;
  const hist = loadTestHistory();
  if (!hist.length) {
    settingsHistoryList.innerHTML = `<div class="settings-history-item"><span>No history yet.</span><span class="settings-history-item-meta"></span></div>`;
    return;
  }
  settingsHistoryList.innerHTML = "";
  hist.forEach((h, idx) => {
    const row = document.createElement("div");
    row.className = "settings-history-item";
    const score = document.createElement("div");
    score.innerHTML = `<strong>${Number(h.correct || 0)}</strong> / ${Number(h.answered || 0)} <span class="settings-history-item-meta">(of ${Number(h.available || 0)} shown)</span>`;
    const meta = document.createElement("div");
    meta.className = "settings-history-item-meta";
    meta.textContent = formatHistoryTimestamp(h.at);

    const del = document.createElement("button");
    del.type = "button";
    del.className = "settings-history-delete";
    del.title = "Delete this history entry";
    del.setAttribute("aria-label", "Delete this history entry");
    del.textContent = "🗑";
    del.addEventListener("click", () => {
      openModeResetConfirm("Delete this history entry?", () => {
        const next = loadTestHistory();
        next.splice(idx, 1);
        saveTestHistory(next);
        renderHistoryList();
        showToast("History entry deleted.");
      }, null, { destructive: true });
    });

    row.append(score, meta, del);
    settingsHistoryList.appendChild(row);
  });
}

function applyPracticeButtonsUI(mode) {
  const label =
    mode === "wrong_once"
      ? "Wrong 1+"
      : mode === "wrong_repeat"
        ? "Wrong 2+"
        : "Off";
  if (settingsPracticeModeValue) settingsPracticeModeValue.textContent = label;
  settingsPracticeOff?.classList.toggle("active", mode === "off");
  settingsPracticeWrongOnce?.classList.toggle("active", mode === "wrong_once");
  settingsPracticeWrongRepeat?.classList.toggle("active", mode === "wrong_repeat");
}

function setPracticeModeAndApply(mode) {
  setPracticeMode(mode);
  applyPracticeButtonsUI(getPracticeMode());
  applySourceFilter();
}

function completeTestToHistory() {
  const available = getSourceFilteredItems().length;
  const entry = {
    at: new Date().toISOString(),
    answered: progress.total,
    correct: progress.correct,
    available,
    examMode: !!examMode,
    godMode: !!godlikeMode,
    practiceMode: getPracticeMode(),
  };
  addHistoryEntry(entry);
  renderHistoryList();
}

function openSettingsModal() {
  if (settingsModal) settingsModal.style.display = "flex";
  renderHistoryList();
  applyPracticeButtonsUI(getPracticeMode());
  setSettingsTab(getStoredSettingsTab());
  applyAudioPrefsUI();
  renderActivityLog();
}

function isSettingsModalOpen() {
  return settingsModal && settingsModal.style.display === "flex";
}

/* ────────── Activity Log viewer ────────── */
function renderActivityLogIfOpen() {
  if (isSettingsModalOpen()) renderActivityLog();
}
function _formatLogTime(t) {
  const d = new Date(t);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
function _formatLogDetail(entry) {
  const d = entry.detail || {};
  switch (entry.type) {
    case "answer":
      return `Q${d.n ?? "?"} sel=${d.sel} cor=${d.cor} ${d.ok ? "✓" : "✗"}${d.exam ? " · exam" : ""}${d.god ? " · god" : ""}`;
    case "reveal":
      return `Q${d.n ?? "?"} ${d.action || "?"}`;
    case "mode":
      return `${d.name}: ${d.state}`;
    case "reset":
      return `${d.kind}${d.prev ? ` (was ${d.prev.correct}/${d.prev.total})` : ""}`;
    case "source":
      return d.kind === "category-toggle"
        ? `category ${d.key} ${d.on ? "on" : "off"}`
        : `source ${d.id} ${d.on ? "on" : "off"}`;
    case "blur":
      return d.event || "off-screen";
    case "focus":
      return d.event || "back on screen";
    case "app":
      return d.event || "";
    case "submit":
      return `submit ${d.score ?? "?"}/${d.total ?? "?"}`;
    case "timer":
      return d.event + (d.elapsedMs ? ` (${Math.round(d.elapsedMs / 1000)}s)` : "");
    default:
      try { return JSON.stringify(d); } catch { return String(d); }
  }
}
function renderActivityLog() {
  if (!settingsActivityList) return;
  const log = getActivityLog();
  if (settingsActivityCount) settingsActivityCount.textContent = `${log.length} event${log.length === 1 ? "" : "s"}`;
  const filtered = __activityLogFilter === "all"
    ? log
    : log.filter((e) => {
        if (__activityLogFilter === "blur") return e.type === "blur" || e.type === "focus";
        return e.type === __activityLogFilter;
      });
  if (!filtered.length) {
    settingsActivityList.innerHTML = `<div class="activity-log-empty">No events yet${__activityLogFilter === "all" ? "" : ` for filter "${__activityLogFilter}"`}.</div>`;
    return;
  }
  // Newest at top.
  const html = filtered.slice().reverse().map((e) => {
    const cls = `activity-log-row type-${e.type}`;
    return `<div class="${cls}"><span class="activity-log-time">${_formatLogTime(e.t)}</span><span class="activity-log-type">${escapeHTML(e.type)}</span><span class="activity-log-detail">${escapeHTML(_formatLogDetail(e))}</span></div>`;
  }).join("");
  settingsActivityList.innerHTML = html;
}
function wireActivityLogUI() {
  document.querySelectorAll(".activity-filter").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".activity-filter").forEach((b) => b.classList.toggle("active", b === btn));
      __activityLogFilter = btn.getAttribute("data-filter") || "all";
      renderActivityLog();
    });
  });
  settingsActivityExportJson?.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(getActivityLog(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mcq-activity-${Date.now()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  settingsActivityExportCsv?.addEventListener("click", () => {
    const rows = [["time_iso", "type", "detail"]];
    getActivityLog().forEach((e) => {
      const detailStr = JSON.stringify(e.detail || {});
      rows.push([new Date(e.t).toISOString(), e.type, detailStr.replace(/"/g, '""')]);
    });
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mcq-activity-${Date.now()}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  settingsActivityClear?.addEventListener("click", () => {
    openModeResetConfirm(
      "Clear the entire activity log? This cannot be undone.",
      () => {
        clearActivityLog();
        showToast?.("Activity log cleared.");
      },
      null,
      { destructive: true, confirmLabel: "Clear log" }
    );
  });
}

/* ────────── Proctor Audio settings ────────── */
function applyAudioPrefsUI() {
  const prefs = _readAudioPrefs();
  if (settingsAudioEnabled) settingsAudioEnabled.checked = !!prefs.enabled;
  if (settingsAudioVolume)  settingsAudioVolume.value = String(Math.round((prefs.volume ?? 0.6) * 100));
  if (settingsAudioVolumeValue) settingsAudioVolumeValue.textContent = `${Math.round((prefs.volume ?? 0.6) * 100)}%`;
}
function wireAudioSettings() {
  settingsAudioEnabled?.addEventListener("change", () => {
    setAudioEnabled(settingsAudioEnabled.checked);
    if (settingsAudioEnabled.checked) {
      // First user-gesture: warm the AudioContext so subsequent tones fire.
      _ensureAudioCtx()?.resume?.().catch(() => {});
      PROCTOR_TONES["test"]?.();
    }
  });
  settingsAudioVolume?.addEventListener("input", () => {
    const pct = Number(settingsAudioVolume.value);
    setAudioVolume(pct / 100);
    if (settingsAudioVolumeValue) settingsAudioVolumeValue.textContent = `${pct}%`;
  });
  settingsAudioTest?.addEventListener("click", () => {
    _ensureAudioCtx()?.resume?.().catch(() => {});
    PROCTOR_TONES["test"]?.();
  });
}

/* ────────── Clear all data ────────── */
function wireClearAllData() {
  settingsClearAllData?.addEventListener("click", () => {
    openModeResetConfirm(
      "Wipe all locally stored MCQ data (imported sets, progress, stats, history, activity log, modes)? The page will reload.",
      () => {
        wipeAllMcqStorage();
        try { showToast?.("All data cleared. Reloading…"); } catch {}
        setTimeout(() => location.reload(), 250);
      },
      null,
      { destructive: true, confirmLabel: "Wipe & reload" }
    );
  });
}

function closeSettingsModal() {
  if (settingsModal) settingsModal.style.display = "none";
}

settingsBtn?.addEventListener("click", openSettingsModal);
settingsClose?.addEventListener("click", closeSettingsModal);
settingsModal?.addEventListener("click", (e) => {
  if (e.target === settingsModal) closeSettingsModal();
});

settingsResetWidgets?.addEventListener("click", () => {
  resetWidgetsPositionToDefault();
  showToast("Widgets position reset.");
});
settingsResetControls?.addEventListener("click", () => {
  resetControlsPositionToDefault();
  showToast("Controls position reset.");
});
settingsResetTimer?.addEventListener("click", () => {
  resetTimerPositionToDefault();
  showToast("Timer position reset.");
});

initQaFontSizeSetting();
initControlsLayoutSetting();
wireClearAllData();
wireAudioSettings();
wireActivityLogUI();
applyAudioPrefsUI();

settingsCompleteTest?.addEventListener("click", () => {
  completeTestToHistory();
  logActivity("submit", { score: progress.correct, total: progress.total });
  showToast("Saved to history.");
});

settingsPracticeOff?.addEventListener("click", () => {
  setPracticeModeAndApply("off");
  showToast("Practice mode: Off");
});
settingsPracticeWrongOnce?.addEventListener("click", () => {
  // Practice means reattempting; reset current progress to allow retry.
  closeSettingsModal();
  openModeResetConfirm(
    "Start practice mode? This will reset your current progress (history and wrong-count stats stay).",
    () => {
      resetQuizProgress();
      setPracticeModeAndApply("wrong_once");
      showToast("Practice mode: Wrong 1+");
    },
    () => openSettingsModal()
  );
});
settingsPracticeWrongRepeat?.addEventListener("click", () => {
  closeSettingsModal();
  openModeResetConfirm(
    "Start practice mode? This will reset your current progress (history and wrong-count stats stay).",
    () => {
      resetQuizProgress();
      setPracticeModeAndApply("wrong_repeat");
      showToast("Practice mode: Wrong 2+");
    },
    () => openSettingsModal()
  );
});

settingsDockerDownloadAll?.addEventListener("click", async () => {
  const t = getDockerTemplates();
  const dockerfileText = (await tryFetchText("Dockerfile")) ?? t.dockerfile;
  const composeText = (await tryFetchText("docker-compose.yml")) ?? t.compose;
  const dockerignoreText = (await tryFetchText(".dockerignore")) ?? t.dockerignore;
  const nginxConfText = (await tryFetchText("nginx.conf")) ?? t.nginxConf;
  const dockerReadmeText = (await tryFetchText("README_DOCKER.md")) ?? t.readme;
  const manualText = (await tryFetchText("DOCKER_MANUAL_TEMPLATES.md")) ?? t.manual;

  downloadZip("docker-files.zip", [
    { name: "README_FIRST.txt", text: t.readmeFirst },
    { name: "Dockerfile", text: dockerfileText },
    { name: "docker-compose.yml", text: composeText },
    { name: ".dockerignore", text: dockerignoreText },
    { name: "nginx.conf", text: nginxConfText },
    { name: "README_DOCKER.md", text: dockerReadmeText },
    { name: "DOCKER_MANUAL_TEMPLATES.md", text: manualText },
  ]);
  showToast("Docker .zip downloaded.");
});

settingsDockerDownloadBundle?.addEventListener("click", async () => {
  showToast("Building bundle zip...");
  await downloadAppDockerBundleZip();
  showToast("App + Docker bundle downloaded.");
});

settingsDockerDownloadManual?.addEventListener("click", () => {
  const t = getDockerTemplates();
  downloadTextFile("DOCKER_MANUAL_TEMPLATES.md", t.manual);
  showToast("Manual templates downloaded.");
});

settingsLocalServerDownloadScripts?.addEventListener("click", () => {
  const t = getLocalServerTemplates();
  downloadZip("mcq-local-server.zip", [
    { name: "README_LOCAL_SERVER.md", text: t.readme },
    { name: "start_server.ps1", text: t.ps1 },
    { name: "start_server.bat", text: t.bat },
  ]);
  showToast("Local server scripts downloaded.");
});

settingsOpenSetupGuide?.addEventListener("click", async () => {
  const docker = await tryFetchText("README_DOCKER.md");
  const local = await tryFetchText("README_LOCAL_SERVER.md");
  const extra = `# Project Notes

- Recommended: run via Docker or a local server (Python) so q_*.json can be loaded.
- Question files must be named q_*.json and contain a JSON array of question objects.
- Use the Sources filter to import, enable/disable sources, and practice wrong questions.
`;

  openDocsModal({
    title: "Setup Guide",
    body:
      (docker ? docker.trim() : getDockerTemplates().readme.trim()) +
      "\n\n" +
      (local ? local.trim() : getLocalServerTemplates().readme.trim()) +
      "\n\n" +
      extra.trim() +
      "\n",
  });
});

let controlsTogglePointerId = null;
let controlsToggleMoved = false;
let controlsToggleSuppressClick = false;
let controlsToggleStartX = 0;
let controlsToggleStartY = 0;
let controlsToggleOffsetX = 0;
let controlsToggleOffsetY = 0;
let controlsToggleStartRect = null;

controlsToggle?.addEventListener("click", () => {
  if (controlsToggleSuppressClick) {
    controlsToggleSuppressClick = false;
    return;
  }
  toggleControlsCollapsed();
});

controlsToggle?.addEventListener("pointerdown", (e) => {
  if (e.pointerType === "mouse" && e.button !== 0) return;
  if (!controlsToggle || !controlsShell) return;
  controlsTogglePointerId = e.pointerId;
  controlsToggleMoved = false;
  controlsToggleStartX = e.clientX;
  controlsToggleStartY = e.clientY;
  // We drag the whole controls shell so the toggle and menu move together.
  controlsToggleStartRect = controlsShell.getBoundingClientRect();
  controlsToggleOffsetX = e.clientX - controlsToggleStartRect.left;
  controlsToggleOffsetY = e.clientY - controlsToggleStartRect.top;
  controlsToggle.setPointerCapture(e.pointerId);
});

controlsToggle?.addEventListener("pointermove", (e) => {
  if (!controlsToggle || !controlsShell || e.pointerId !== controlsTogglePointerId) return;
  const dx = e.clientX - controlsToggleStartX;
  const dy = e.clientY - controlsToggleStartY;
  if (!controlsToggleMoved && Math.hypot(dx, dy) < 6) return; // threshold so clicks still work

  if (!controlsToggleMoved) {
    controlsToggleMoved = true;
    controlsToggleSuppressClick = true;
    const rect = controlsToggleStartRect || controlsShell.getBoundingClientRect();
    controlsShell.style.position = "fixed";
    controlsShell.style.left = `${rect.left}px`;
    controlsShell.style.top = `${rect.top}px`;
    controlsShell.style.right = "auto";
    controlsShell.style.bottom = "auto";
    controlsShell.style.marginLeft = "0";
    controlsShell.style.zIndex = "var(--z-float)";
    controlsToggle.classList.add("dragging");
  }

  const pad = 8;
  const maxX = Math.max(pad, window.innerWidth - controlsShell.offsetWidth - pad);
  const maxY = Math.max(pad, window.innerHeight - controlsShell.offsetHeight - pad);
  const left = clamp(e.clientX - controlsToggleOffsetX, pad, maxX);
  const top = clamp(e.clientY - controlsToggleOffsetY, pad, maxY);
  controlsShell.style.left = `${left}px`;
  controlsShell.style.top = `${top}px`;
  e.preventDefault();
});

function endControlsToggleDrag(e) {
  if (!controlsToggle || e.pointerId !== controlsTogglePointerId) return;
  controlsTogglePointerId = null;
  controlsToggleStartRect = null;
  controlsToggle.classList.remove("dragging");
}

controlsToggle?.addEventListener("pointerup", endControlsToggleDrag);
controlsToggle?.addEventListener("pointercancel", endControlsToggleDrag);

// Mobile menu (burger) behavior
const burgerBtn = document.getElementById("burgerBtn");
const mobileMenu = document.getElementById("mobileMenu");
const menuOverlay = document.getElementById("menuOverlay");

function setMobileMenuOpen(open) {
  if (!mobileMenu || !burgerBtn) return;
  document.body.classList.toggle("mobile-menu-open", open);
  mobileMenu.classList.toggle("open", open);
  const sourcesOpen = document.getElementById("sourceFilterMenu")?.hidden === false;
  if (menuOverlay) menuOverlay.hidden = !(open || sourcesOpen);
  burgerBtn.textContent = open ? "✕" : "☰";
  burgerBtn.title = open ? "Close menu" : "Open menu";
  burgerBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  burgerBtn.setAttribute("aria-expanded", open ? "true" : "false");
}

burgerBtn?.addEventListener("click", () => {
  if (!mobileMenu) return;
  setMobileMenuOpen(!mobileMenu?.classList.contains("open"));
});

burgerBtn?.addEventListener("pointerup", (e) => {
  e.stopPropagation();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") setMobileMenuOpen(false);
});

document.addEventListener("click", (e) => {
  if (!mobileMenu?.classList.contains("open")) return;
  if (mobileMenu.contains(e.target) || burgerBtn?.contains(e.target)) return;
  setMobileMenuOpen(false);
});

document.addEventListener("pointerup", (e) => {
  if (!mobileMenu?.classList.contains("open")) return;
  if (mobileMenu.contains(e.target) || burgerBtn?.contains(e.target)) return;
  setMobileMenuOpen(false);
});

menuOverlay?.addEventListener("click", () => {
  setMobileMenuOpen(false);
  setSourceFilterMenuOpen(false);
});

// Mobile buttons reuse desktop logic to keep behavior identical.
document.getElementById("m-resetQuiz")?.addEventListener("click", () => {
  document.getElementById("resetQuiz")?.click();
});
document.getElementById("m-shuffleBtn")?.addEventListener("click", () => {
  document.getElementById("shuffleBtn")?.click();
});
document
  .getElementById("m-shuffle-answers-btn")
  ?.addEventListener("click", () => {
    document.getElementById("shuffle-answers-btn")?.click();
  });
document.getElementById("m-toggleExam")?.addEventListener("click", () => {
  document.getElementById("toggleExam")?.click();
});
document.getElementById("m-toggleAll")?.addEventListener("click", () => {
  document.getElementById("toggleAll")?.click();
});
document.getElementById("m-toggleGodlike")?.addEventListener("click", () => {
  document.getElementById("toggleGodlike")?.click();
});
document.getElementById("m-toggleTimer")?.addEventListener("click", () => {
  toggleTimerVisibility();
});

mobileMenu?.querySelectorAll("button").forEach((btn) => {
  btn.addEventListener("click", () => setMobileMenuOpen(false));
});

setMobileMenuOpen(false);
