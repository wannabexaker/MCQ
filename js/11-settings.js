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
  const raw = appStorage.getItem(QA_FONT_STORAGE_KEY);
  const n = Number(raw);
  if (!Number.isFinite(n)) return 16;
  return clamp(Math.round(n), 12, 22);
}

function applyQaFontSizePx(px) {
  const val = clamp(Math.round(Number(px) || 16), 12, 22);
  document.documentElement.style.setProperty("--qa-font-size", `${val}px`);
  if (settingsQaFontSize) settingsQaFontSize.value = String(val);
  if (settingsQaFontSizeValue) settingsQaFontSizeValue.textContent = `${val}px`;
  appStorage.setItem(QA_FONT_STORAGE_KEY, String(val));
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
  const raw = String(appStorage.getItem(CONTROLS_LAYOUT_STORAGE_KEY) || "").toLowerCase();
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
  appStorage.setItem(CONTROLS_LAYOUT_STORAGE_KEY, mode);
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
  const raw = String(appStorage.getItem(SETTINGS_TAB_STORAGE_KEY) || "").toLowerCase();
  if (raw === "hud") return "hud";
  if (raw === "test") return "test";
  if (raw === "docker") return "docker";
  return "general";
}

function setSettingsTab(tab) {
  const t = tab === "hud" || tab === "test" || tab === "docker" ? tab : "general";
  appStorage.setItem(SETTINGS_TAB_STORAGE_KEY, t);

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
