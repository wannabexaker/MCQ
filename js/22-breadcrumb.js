// ── Breadcrumb: 🏠 Home › section › item ────────────────────────────────────
// Rebuilt after every render of #quiz (quiz, picker or assessments), so it
// always reflects what is on screen. "Home" is the landing page with the set
// picker; a folder crumb reopens that folder there.
(function () {
  const host = document.getElementById("breadcrumb");
  if (!host) return;

  const setMeta = (file) => (typeof BUNDLED_SETS !== "undefined" ? BUNDLED_SETS : []).find((s) => s.file === file) || null;
  const groupMeta = (g) => (g && typeof BUNDLED_GROUPS !== "undefined" ? BUNDLED_GROUPS[g] : null);
  const shortTitle = (s) => String(s.title || "").replace(/^(SQL|C#)\s*—\s*/, "");

  function crumbs() {
    const home = { label: "🏠 Home", go: () => window.mcqGoHome?.() };
    // Assessments
    if (typeof isAssessmentActive === "function" && isAssessmentActive()) {
      const hub = { label: typeof assessT === "function" ? assessT("hubTitle") : "Assessments", go: () => typeof assessGoHub === "function" && assessGoHub() };
      const v = typeof ASSESS_VIEW !== "undefined" ? ASSESS_VIEW : {};
      if (v.mode === "hub" || !v.testId || !ASSESS_TESTS?.[v.testId]) return [home, hub];
      return [home, hub, { label: assessT(ASSESS_TESTS[v.testId].nameKey) }];
    }
    // Landing picker (optionally with a folder open)
    if (window.__mcqShowPicker === true || document.querySelector("#quiz .welcome-card")) {
      const g = groupMeta(typeof openWelcomeFolder !== "undefined" ? openWelcomeFolder : null);
      return g ? [home, { label: g.title }] : [home];
    }
    // Quiz: name the set when exactly one bundled set is showing
    const active = (typeof SOURCE_DEFINITIONS !== "undefined" ? SOURCE_DEFINITIONS : []).filter((s) => ACTIVE_SOURCE_IDS?.has(s.id));
    const files = [...new Set(active.map((s) => s.file))];
    if (files.length === 1) {
      const s = setMeta(files[0]);
      if (s) {
        const g = groupMeta(s.group);
        return g
          ? [home, { label: g.title, go: () => window.mcqGoHome?.(s.group) }, { label: shortTitle(s) }]
          : [home, { label: s.title }];
      }
      return [home, { label: active[0]?.label || files[0] }];
    }
    return [home, { label: files.length ? `Quiz · ${files.length} sets` : "Quiz" }];
  }

  function render() {
    const list = crumbs();
    host.innerHTML = "";
    const ol = document.createElement("ol");
    list.forEach((c, i) => {
      const li = document.createElement("li");
      const last = i === list.length - 1;
      if (!last && c.go) {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = c.label;
        b.addEventListener("click", c.go);
        li.appendChild(b);
      } else {
        const span = document.createElement("span");
        span.textContent = c.label;
        if (last) span.setAttribute("aria-current", "page");
        li.appendChild(span);
      }
      ol.appendChild(li);
    });
    host.appendChild(ol);
  }
  window.mcqUpdateBreadcrumb = render;

  // Refresh after every render path (same wrap pattern as 20-share-links.js).
  ["renderQuiz", "renderAssessmentView"].forEach((name) => {
    const orig = window[name];
    if (typeof orig !== "function") return;
    window[name] = function () {
      const r = orig.apply(this, arguments);
      try { render(); } catch {}
      return r;
    };
  });
  render();
})();
