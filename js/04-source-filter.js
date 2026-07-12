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
  // Assessments mode owns the #quiz surface while active. Every render path
  // (language toggle, resets, source changes) funnels through here, so this
  // single guard keeps both worlds from clobbering each other.
  if (typeof isAssessmentActive === "function" && isAssessmentActive()) {
    renderAssessmentView();
    return;
  }
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

