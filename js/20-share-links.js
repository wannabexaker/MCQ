// ── Clean, shareable deep links (hash routing) ──────────────────────────────
// Everything shareable gets a clean #hash URL — no ?query strings:
//   Assessments:    #iq   #analytical   #dark-triad   (#assessments = the hub)
//   Question sets:  #sql01  #cs02  #networking  …      (from the q_<slug>.json file)
// Opening a link takes the visitor straight into that test; the address bar
// always tracks the current test so it is ready to copy/share; each hub/landing
// card has a 🔗 button; and the browser Back button walks the natural stack
// (test → hub/picker → quiz) instead of leaving the site.
//
// Hash-only + additive, so it works on static hosting (GitHub Pages) with no
// server rewrites. It mirrors the assessments module's style and reflects app
// navigation into the URL by lightly wrapping the existing navigation
// functions — no edits to their bodies.
(function () {
  // testId → public slug, and slug → testId (dark-triad is the friendly slug for sd3)
  const A_SLUG = { iq: "iq", analytical: "analytical", sd3: "dark-triad", spectrum: "spectrum" };
  const A_ID = { iq: "iq", analytical: "analytical", "dark-triad": "sd3", sd3: "sd3", spectrum: "spectrum", sexuality: "spectrum" };

  const setSlug = (file) => String(file || "").replace(/^q_/i, "").replace(/\.json$/i, "").toLowerCase();
  const knownSet = (f) => typeof BUNDLED_SETS !== "undefined" && BUNDLED_SETS.some((s) => s.file === f);
  const setFromSlug = (slug) => {
    const s = (typeof BUNDLED_SETS !== "undefined" ? BUNDLED_SETS : []).find((x) => setSlug(x.file) === String(slug).toLowerCase());
    return s ? s.file : null;
  };
  const setTitle = (f) => { const s = (typeof BUNDLED_SETS !== "undefined" ? BUNDLED_SETS : []).find((x) => x.file === f); return s ? s.title : "MCQ test"; };
  const isLoaded = (f) => { try { return getImportedSources().some((s) => s.fileName === f); } catch { return false; } };
  const assessActive = () => typeof isAssessmentActive === "function" && isAssessmentActive();
  const assessmentTitle = (id) => {
    try { return typeof assessT === "function" && ASSESS_TESTS?.[id] ? assessT(ASSESS_TESTS[id].nameKey) : "MCQ test"; }
    catch { return "MCQ test"; }
  };
  const linkFor = (slug) => {
    const native = typeof window !== "undefined" && window.Capacitor?.isNativePlatform?.();
    const base = native ? "https://wannabexaker.github.io/mcq-trainer/" : location.origin + location.pathname;
    return base + "#" + slug;
  };

  let routing = false; // true while we drive navigation from a hash → don't echo back to the URL

  function setHash(slug) {
    if (routing) return;
    const want = slug ? "#" + slug : "";
    if ((location.hash || "") === want) return;
    if (slug) location.hash = slug; // fires hashchange → route() (idempotent, so harmless)
    else history.replaceState(null, "", location.pathname + location.search); // clear hash, no hashchange
  }

  // ── Share / copy ──
  function shareLink(slug, title) {
    if (!slug) return;
    const url = linkFor(slug);
    const ok = () => { try { showToast("Link copied — send it to start this test"); } catch {} };
    if (navigator.share) { navigator.share({ title: title || "MCQ Trainer", url }).catch(() => {}); return; }
    if (navigator.clipboard?.writeText) { navigator.clipboard.writeText(url).then(ok).catch(() => { try { window.prompt("Copy this link:", url); } catch {} }); return; }
    try { window.prompt("Copy this link:", url); } catch {}
  }
  window.mcqShareAssessment = (id) => shareLink(A_SLUG[id], assessmentTitle(id));
  window.mcqShareSet = (file) => { if (knownSet(file)) shareLink(setSlug(file), setTitle(file)); };

  // ── Question-set picker + isolation ──
  function showPicker() {
    window.__mcqShowPicker = true;
    if (typeof applySourceFilter === "function") applySourceFilter();
    else if (typeof renderQuiz === "function") renderQuiz([]);
    try { window.scrollTo(0, 0); } catch {}
  }
  function isolateToSet(file) {
    try {
      if (typeof SOURCE_DEFINITIONS !== "undefined" && typeof ACTIVE_SOURCE_IDS !== "undefined") {
        const ids = SOURCE_DEFINITIONS.filter((s) => s && s.file === file).map((s) => s.id);
        if (ids.length) { ACTIVE_SOURCE_IDS = new Set(ids); if (typeof renderSourceChecklist === "function") renderSourceChecklist(); }
      }
    } catch {}
    if (typeof applySourceFilter === "function") applySourceFilter();
  }
  async function openSet(file) {
    if (!knownSet(file)) return;
    if (assessActive() && typeof exitAssessments === "function") exitAssessments();
    window.__mcqShowPicker = false;
    if (!isLoaded(file)) await loadBundledQuestionSet(file);
    else if (typeof reloadSourcesAndFilters === "function") await reloadSourcesAndFilters();
    isolateToSet(file); // a shared link shows ONLY this test, even if others are loaded
    try { window.scrollTo(0, 0); } catch {}
  }

  // ── Assessments ──
  function openAssessment(id) {
    if (!assessActive() && typeof enterAssessments === "function") enterAssessments();
    if (typeof startOrResumeTest === "function") startOrResumeTest(id);
  }
  function openHub() {
    if (!assessActive()) { if (typeof enterAssessments === "function") enterAssessments(); }
    else if (typeof ASSESS_VIEW !== "undefined" && ASSESS_VIEW.mode !== "hub" && typeof assessGoHub === "function") assessGoHub();
  }

  // ── Router ──
  function route(rawSlug) {
    const slug = String(rawSlug || "").replace(/^#/, "").trim().toLowerCase();
    routing = true;
    try {
      if (!slug) {
        if (assessActive() && typeof exitAssessments === "function") exitAssessments();
        else showPicker();
      } else if (slug === "assessments" || slug === "tests") {
        openHub();
      } else if (A_ID[slug]) {
        openAssessment(A_ID[slug]);
      } else {
        const file = setFromSlug(slug);
        if (file) openSet(file);
        // unknown hash → leave the app as-is
      }
    } finally {
      routing = false;
    }
  }

  // In-app "Load" on a set card → reflect in the URL; the hashchange drives the load.
  window.mcqOpenSet = (file) => { if (knownSet(file)) setHash(setSlug(file)); };
  window.mcqShowSetPicker = () => setHash("");

  // ── Reflect app navigation into the URL (wrap, don't edit, the originals) ──
  function wrapAfter(name, after) {
    const orig = window[name];
    if (typeof orig !== "function") return;
    window[name] = function () {
      const r = orig.apply(this, arguments);
      try { after.apply(this, arguments); } catch {}
      return r;
    };
  }
  wrapAfter("startOrResumeTest", (id) => setHash(A_SLUG[id] || "assessments"));
  wrapAfter("assessTakeSharedTest", (id) => setHash(A_SLUG[id] || "assessments"));
  wrapAfter("enterAssessments", () => setHash("assessments"));
  wrapAfter("assessGoHub", () => setHash("assessments"));
  wrapAfter("exitAssessments", () => setHash(""));

  window.addEventListener("hashchange", () => {
    let ar = null;
    try { ar = new URLSearchParams(location.search).get("ar"); } catch {}
    if (ar) return; // an assessment result-share link owns the surface
    route(location.hash);
  });

  document.addEventListener("DOMContentLoaded", () => {
    let ar = null;
    try { ar = new URLSearchParams(location.search).get("ar"); } catch {}
    if (ar) return;
    const slug = location.hash.replace(/^#/, "").trim().toLowerCase();
    if (!slug) return; // empty hash on boot → leave the normal landing/quiz render alone
    // Seed a sensible "Back" target behind a direct link so Back returns to the
    // hub (for a test) or the set picker (for a set), not off-site.
    try {
      if (A_ID[slug] && slug !== "assessments" && slug !== "tests") {
        history.replaceState(null, "", location.pathname + location.search + "#assessments");
        history.pushState(null, "", "#" + slug);
      } else if (setFromSlug(slug)) {
        history.replaceState(null, "", location.pathname + location.search);
        history.pushState(null, "", "#" + slug);
      }
    } catch {}
    route(slug);
  });
})();
