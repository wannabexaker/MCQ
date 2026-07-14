// ── Deep-linkable question sets ─────────────────────────────────────────────
// Every bundled set gets its own shareable URL: ?set=<file>.
//   • Opening such a link loads that set directly (a fresh visitor lands
//     straight in the test).
//   • The address bar tracks the active test, so it can be copied/shared, and
//     each landing card gets a 🔗 button that copies (or Web-Share's) the link.
//   • The browser Back button returns to the set picker (the card grid) instead
//     of leaving the site.
// Purely additive — mirrors the assessments module: its own DOMContentLoaded,
// no edits to the boot sequence in 08-boot-theme.js.
(function () {
  const PARAM = "set";
  const CANONICAL = "https://wannabexaker.github.io/mcq-trainer/";

  const knownSet = (f) =>
    Array.isArray(BUNDLED_SETS) && BUNDLED_SETS.some((s) => s.file === f);
  const setTitle = (f) => {
    const s = (typeof BUNDLED_SETS !== "undefined" ? BUNDLED_SETS : []).find((x) => x.file === f);
    return s ? s.title : "MCQ test";
  };
  const isLoaded = (f) => {
    try { return getImportedSources().some((s) => s.fileName === f); } catch { return false; }
  };
  const paramSet = () => {
    try { return new URLSearchParams(location.search).get(PARAM); } catch { return null; }
  };
  const shareUrl = (f) => {
    const native = typeof window !== "undefined" && window.Capacitor?.isNativePlatform?.();
    const base = native ? CANONICAL : location.origin + location.pathname;
    return `${base}?${PARAM}=${encodeURIComponent(f)}`;
  };
  const assessmentActive = () =>
    typeof isAssessmentActive === "function" && isAssessmentActive();

  // Render the bundled-set grid even when sets are already loaded.
  function showPicker() {
    window.__mcqShowPicker = true;
    if (typeof applySourceFilter === "function") applySourceFilter();
    else if (typeof renderQuiz === "function") renderQuiz([]);
    try { window.scrollTo(0, 0); } catch {}
  }

  // Restrict the source filter to just the linked set, so a shared link shows
  // ONLY that test even if the visitor already has other sets loaded.
  function isolateToSet(file) {
    try {
      if (typeof SOURCE_DEFINITIONS !== "undefined" && typeof ACTIVE_SOURCE_IDS !== "undefined") {
        const ids = SOURCE_DEFINITIONS.filter((s) => s && s.file === file).map((s) => s.id);
        if (ids.length) {
          ACTIVE_SOURCE_IDS = new Set(ids);
          if (typeof renderSourceChecklist === "function") renderSourceChecklist();
        }
      }
    } catch {}
    if (typeof applySourceFilter === "function") applySourceFilter();
  }

  // Load a specific set and show it, syncing URL + history. `isolate` (used by
  // shared links) narrows the view to only this set; in-app card clicks keep
  // the app's normal multi-source merge behaviour.
  async function openSet(file, { push = true, isolate = false } = {}) {
    if (!knownSet(file)) return false;
    window.__mcqShowPicker = false;
    if (push) {
      try { history.pushState({ mcqSet: file, iso: !!isolate }, "", shareUrl(file)); } catch {}
    }
    if (!isLoaded(file)) {
      await loadBundledQuestionSet(file); // imports the set + re-renders the quiz
    } else if (isolate && typeof reloadSourcesAndFilters === "function") {
      await reloadSourcesAndFilters();
    }
    if (isolate) isolateToSet(file);
    else if (typeof applySourceFilter === "function") applySourceFilter();
    try { window.scrollTo(0, 0); } catch {}
    return true;
  }

  function promptCopy(url) {
    try { window.prompt("Copy this link:", url); } catch {}
  }
  function shareSet(file) {
    if (!knownSet(file)) return;
    const url = shareUrl(file);
    const ok = () => { try { showToast("Link copied — send it to start this test"); } catch {} };
    if (navigator.share) {
      navigator.share({ title: setTitle(file), url }).catch(() => {});
      return;
    }
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(ok).catch(() => promptCopy(url));
      return;
    }
    promptCopy(url);
  }

  // Exposed for the card wiring in 07-quiz.js.
  window.mcqOpenSet = openSet;
  window.mcqShareSet = shareSet;
  window.mcqShowSetPicker = showPicker;

  // Back / forward navigation.
  window.addEventListener("popstate", (e) => {
    if (assessmentActive()) return; // assessments own their own routing
    const st = e.state;
    if (st && st.mcqSet && knownSet(st.mcqSet)) openSet(st.mcqSet, { push: false, isolate: !!st.iso });
    else showPicker();
  });

  // Deep-link boot: ?set=<file> loads that set, with a synthetic picker entry
  // behind it so Back returns to the list. Assessment share links (?ar=) take
  // precedence and own the surface, so we stand down when one is present.
  document.addEventListener("DOMContentLoaded", () => {
    let ar = null;
    try { ar = new URLSearchParams(location.search).get("ar"); } catch {}
    if (ar) return;
    const file = paramSet();
    if (!file || !knownSet(file)) return;
    try {
      history.replaceState({ mcqPicker: true }, "", location.origin + location.pathname);
      history.pushState({ mcqSet: file, iso: true }, "", shareUrl(file));
    } catch {}
    openSet(file, { push: false, isolate: true });
  });
})();
