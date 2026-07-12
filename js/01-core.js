// Guarded storage: localStorage can throw (Safari private mode, disabled
// cookies, quota). Falls back to an in-memory store so the app keeps working
// for the session instead of crashing.
const appStorage = (() => {
  let native = null;
  try {
    native = window["localStorage"];
    const probe = "__mcq_probe__";
    native.setItem(probe, "1");
    native.removeItem(probe);
  } catch { native = null; }
  const mem = new Map();
  return {
    getItem(k)    { try { if (native) return native.getItem(k); } catch {} return mem.has(k) ? mem.get(k) : null; },
    setItem(k, v) { try { if (native) { native.setItem(k, v); return; } } catch {} mem.set(k, String(v)); },
    removeItem(k) { try { if (native) { native.removeItem(k); return; } } catch {} mem.delete(k); },
    keys()        { try { if (native) return Object.keys(native); } catch {} return [...mem.keys()]; },
  };
})();

let progress = { answered: {}, correct: 0, total: 0 };
let shuffleMode = false;
let shuffleAnswersMode = false;
let examMode = false;
let godlikeMode = false;

function loadProgress() {
  const saved = appStorage.getItem("quiz-progress");
  if (saved) progress = JSON.parse(saved);
}
function saveProgress() {
  appStorage.setItem("quiz-progress", JSON.stringify(progress));
}

let ANSWER_KEY = Object.freeze({});
let CURRENT_DATA = [];
const LANG_STORAGE_KEY = "quiz-lang-v1";
let currentLang = (() => {
  try { return appStorage.getItem(LANG_STORAGE_KEY) === "el" ? "el" : "en"; }
  catch { return "en"; }
})();
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
const ASSESS_SESSIONS_STORAGE_KEY = "assessments-sessions-v1";
const ASSESS_RESULTS_STORAGE_KEY = "assessments-results-v1";
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
    const raw = appStorage.getItem(ACTIVITY_LOG_STORAGE_KEY);
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
    appStorage.setItem(ACTIVITY_LOG_STORAGE_KEY, JSON.stringify(__activityLogCache));
  } catch (e) {
    // Storage quota exceeded → drop oldest 25% and retry once.
    __activityLogCache.splice(0, Math.floor(__activityLogCache.length * 0.25));
    try {
      appStorage.setItem(ACTIVITY_LOG_STORAGE_KEY, JSON.stringify(__activityLogCache));
    } catch {}
  }
}
