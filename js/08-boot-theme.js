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

// ── Question language (EN/ΕΛ). UI stays English; question/choice text switches. ──
function refreshLangButtons() {
  const toGreek = currentLang === "en";
  const label = toGreek ? "EL" : "EN";
  const title = toGreek ? "Εμφάνιση ερωτήσεων στα Ελληνικά" : "Show questions in English";
  const desk = document.getElementById("toggleLang");
  const mob = document.getElementById("m-toggleLang");
  if (desk) { desk.textContent = label; desk.title = title; desk.setAttribute("aria-label", title); }
  if (mob)  { mob.textContent = `🌐 ${label}`; mob.title = title; mob.setAttribute("aria-label", title); }
}

function toggleLanguage() {
  currentLang = currentLang === "en" ? "el" : "en";
  try { appStorage.setItem(LANG_STORAGE_KEY, currentLang); } catch {}
  refreshLangButtons();
  applySourceFilter();
  logActivity("mode", { name: "lang", state: currentLang });
}

document.getElementById("toggleLang")?.addEventListener("click", toggleLanguage);
document.getElementById("m-toggleLang")?.addEventListener("click", toggleLanguage);
refreshLangButtons();
setThemeButtonsLabel(getCurrentTheme());
updateTitleForTheme(getCurrentTheme());

// Escape hatch from the Gay Edition theme: the "No" button runs away on
// purpose, but pressing Escape 3 times within 1.5s always returns to dark.
let gayEscapeTimes = [];
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape" || getCurrentTheme() !== "gay") return;
  const now = Date.now();
  gayEscapeTimes = gayEscapeTimes.filter((t) => now - t < 1500);
  gayEscapeTimes.push(now);
  if (gayEscapeTimes.length >= 3) {
    gayEscapeTimes = [];
    closeGayThemeModal();
    const celebrate = document.getElementById("gayCelebrateModal");
    if (celebrate) celebrate.style.display = "none";
    applyTheme("dark");
  }
});

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

