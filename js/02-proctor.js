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
  try { appStorage.removeItem(ACTIVITY_LOG_STORAGE_KEY); } catch {}
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
    const raw = appStorage.getItem(AUDIO_PREFS_STORAGE_KEY);
    __audioPrefs = raw ? JSON.parse(raw) : { enabled: false, volume: 0.6 };
  } catch {
    __audioPrefs = { enabled: false, volume: 0.6 };
  }
  return __audioPrefs;
}
function _writeAudioPrefs() {
  try { appStorage.setItem(AUDIO_PREFS_STORAGE_KEY, JSON.stringify(__audioPrefs)); } catch {}
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
  MCQ_STORAGE_KEYS.forEach((k) => { try { appStorage.removeItem(k); } catch {} });
  try {
    for (let i = appStorage.length - 1; i >= 0; i--) {
      const k = appStorage.key(i);
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
        try { appStorage.removeItem(k); } catch {}
      }
    }
  } catch {}
}
