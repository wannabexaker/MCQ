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

  // Load a specific set and show it, syncing URL + history.
  async function openSet(file, { push = true } = {}) {
    if (!knownSet(file)) return false;
    window.__mcqShowPicker = false;
    if (push) {
      try { history.pushState({ mcqSet: file }, "", shareUrl(file)); } catch {}
    }
    if (isLoaded(file)) {
      if (typeof applySourceFilter === "function") applySourceFilter();
    } else {
      await loadBundledQuestionSet(file); // imports the set + re-renders the quiz
    }
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
    if (st && st.mcqSet && knownSet(st.mcqSet)) openSet(st.mcqSet, { push: false });
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
      history.pushState({ mcqSet: file }, "", shareUrl(file));
    } catch {}
    openSet(file, { push: false });
  });
})();
