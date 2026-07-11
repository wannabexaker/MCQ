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

