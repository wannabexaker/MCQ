const CATEGORY_LABEL_OVERRIDES = {};
const DUPLICATE_STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "to",
  "of",
  "for",
  "in",
  "on",
  "by",
  "with",
  "from",
  "that",
  "this",
  "which",
  "what",
  "who",
  "when",
  "where",
  "why",
  "how",
  "is",
  "are",
  "was",
  "were",
  "be",
  "as",
  "it",
]);

function getQuestionId(question) {
  return String(question?.__qid ?? question?.number ?? "");
}

function getStatsKey(question) {
  const src = String(question?.__sourceFile || question?.__sourceLabel || "unknown");
  const qid = typeof question?.id === "string" && question.id.trim()
    ? question.id.trim()
    : String(Number.isInteger(question?.number) ? question.number : getQuestionId(question));
  return `${src}:${qid}`;
}

function loadQuestionStats() {
  try {
    const raw = appStorage.getItem(QUESTION_STATS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveQuestionStats(stats) {
  try {
    appStorage.setItem(QUESTION_STATS_STORAGE_KEY, JSON.stringify(stats || {}));
  } catch (e) {
    console.warn("Failed to save question stats:", e);
  }
}

function recordQuestionAttempt(question, isCorrect) {
  const stats = loadQuestionStats();
  const key = getStatsKey(question);
  const now = new Date().toISOString();
  const cur = stats[key] || { attempts: 0, correct: 0, wrong: 0, lastAt: null };
  cur.attempts = (cur.attempts || 0) + 1;
  if (isCorrect) cur.correct = (cur.correct || 0) + 1;
  else cur.wrong = (cur.wrong || 0) + 1;
  cur.lastAt = now;
  stats[key] = cur;
  saveQuestionStats(stats);
}

function loadTestHistory() {
  try {
    const raw = appStorage.getItem(TEST_HISTORY_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveTestHistory(history) {
  try {
    appStorage.setItem(TEST_HISTORY_STORAGE_KEY, JSON.stringify(history || []));
  } catch (e) {
    console.warn("Failed to save test history:", e);
  }
}

function addHistoryEntry(entry) {
  const hist = loadTestHistory();
  hist.unshift(entry);
  hist.splice(10);
  saveTestHistory(hist);
}

function getPracticeMode() {
  const raw = String(appStorage.getItem(PRACTICE_MODE_STORAGE_KEY) || "").toLowerCase();
  if (raw === "wrong_once") return "wrong_once";
  if (raw === "wrong_repeat") return "wrong_repeat";
  return "off";
}

function setPracticeMode(mode) {
  const normalized = mode === "wrong_once" || mode === "wrong_repeat" ? mode : "off";
  const prev = (typeof localStorage !== "undefined" && appStorage.getItem(PRACTICE_MODE_STORAGE_KEY)) || "off";
  appStorage.setItem(PRACTICE_MODE_STORAGE_KEY, normalized);
  if (prev !== normalized) {
    logActivity("mode", { name: "practice", state: normalized });
  }
}

function loadImportedSourcesFromStorage() {
  try {
    const raw = appStorage.getItem(IMPORTED_SOURCES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn("Failed to load imported sources from storage:", e);
    return [];
  }
}

function saveImportedSourcesToStorage(sources) {
  try {
    appStorage.setItem(
      IMPORTED_SOURCES_STORAGE_KEY,
      JSON.stringify(Array.isArray(sources) ? sources : [])
    );
    return true;
  } catch (e) {
    console.warn("Failed to save imported sources to storage:", e);
    DATA_WARNINGS.push(
      "Could not save imported questions (storage full or blocked). Try fewer questions or export and re-import later."
    );
    return false;
  }
}

function getImportedSources() {
  return loadImportedSourcesFromStorage();
}

function upsertImportedSource(source) {
  const list = getImportedSources();
  const idx = list.findIndex((s) => s && s.id === source.id);
  if (idx >= 0) list[idx] = source;
  else list.push(source);
  return saveImportedSourcesToStorage(list);
}

function deleteImportedSource(sourceId) {
  const list = getImportedSources().filter((s) => s && s.id !== sourceId);
  return saveImportedSourcesToStorage(list);
}

function renderImportedSourcesList() {
  const host = document.getElementById("importedSourcesList");
  if (!host) return;
  const imports = getImportedSources();
  if (!imports.length) {
    host.innerHTML = `<div class="source-filter-item-meta">No imported sources yet.</div>`;
    return;
  }

  host.innerHTML = "";
  imports.forEach((src) => {
    const row = document.createElement("div");
    row.className = "imported-source-row";
    const title = document.createElement("div");
    title.className = "imported-source-title";
    title.textContent = src.label || src.fileName || src.id || "Imported";
    const meta = document.createElement("div");
    meta.className = "imported-source-meta";
    meta.textContent = `${Array.isArray(src.questions) ? src.questions.length : 0} Q`;
    const actions = document.createElement("div");
    actions.className = "imported-source-actions";

    const btnRename = document.createElement("button");
    btnRename.textContent = "Rename";
    btnRename.addEventListener("click", () => promptRenameImportedSource(src.id));

    const btnEdit = document.createElement("button");
    btnEdit.textContent = "Edit";
    btnEdit.addEventListener("click", () => openJsonEditorForImportedSource(src.id));

    const btnExport = document.createElement("button");
    btnExport.textContent = "Export";
    btnExport.addEventListener("click", () => exportImportedSource(src.id));

    const btnDelete = document.createElement("button");
    btnDelete.textContent = "Delete";
    btnDelete.addEventListener("click", () => confirmDeleteImportedSource(src.id));

    actions.append(btnRename, btnEdit, btnExport, btnDelete);
    row.append(title, meta, actions);
    host.appendChild(row);
  });
}

function toCategoryLabel(key) {
  if (CATEGORY_LABEL_OVERRIDES[key]) return CATEGORY_LABEL_OVERRIDES[key];
  return key;
}

function buildCategoryDefinitions(items) {
  const skip = new Set([
    "number",
    "question_en",
    "question_el",
    "choices_en",
    "choices_el",
    "correctIndex",
    "image",
    "image_answers",
    "code",
    "id",
    "__sourceId",
    "__sourceLabel",
    "__qid",
  ]);
  const keys = new Set();
  items.forEach((q) => {
    if (!q || typeof q !== "object") return;
    Object.entries(q).forEach(([k, v]) => {
      if (skip.has(k)) return;
      if (typeof v === "boolean" && v === true) keys.add(k);
    });
  });
  return [...keys]
    .sort((a, b) => a.localeCompare(b))
    .map((key) => ({ key, label: toCategoryLabel(key) }));
}

function showDataWarnings() {
  const host = document.getElementById("dataWarnings");
  if (!host) return;
  if (!DATA_WARNINGS.length && DEDUPE_REMOVED_DETAILS.length === 0) {
    host.hidden = true;
    host.innerHTML = "";
    return;
  }
  host.hidden = false;
  const warningHtml = DATA_WARNINGS
    .map((w) => `<div class="data-warning-item">⚠ ${escapeHTML(w)}</div>`)
    .join("");
  const dedupeHtml =
    DEDUPE_REMOVED_DETAILS.length > 0
      ? `
      <details class="data-warning-item data-warning-details">
        <summary>Show more ▾</summary>
        <ul class="data-warning-list">
          ${DEDUPE_REMOVED_DETAILS.map(
            (d) =>
              `<li><strong>Removed</strong> (${escapeHTML(d.droppedSourceLabel)}): ${escapeHTML(
                d.droppedQuestion
              )}<br><strong>Kept</strong> (${escapeHTML(d.keptSourceLabel)}): ${escapeHTML(
                d.keptQuestion
              )}</li>`
          ).join("")}
        </ul>
      </details>
    `
      : "";
  host.innerHTML = warningHtml + dedupeHtml;
}

function sourceLabelFromFile(file) {
  return file.replace(/^q_/i, "").replace(/\.json$/i, "");
}

function sourceTagKeyFromFile(file) {
  return file
    .replace(/^q[_-]/i, "")
    .replace(/\.json$/i, "")
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function validateQuestionsStructure(file, data) {
  const errors = [];
  const coreKeys = new Set([
    "number",
    "question_en",
    "question_el",
    "choices_en",
    "choices_el",
    "correctIndex",
    "image",
    "image_answers",
    "code",
    "id",
  ]);
  if (!Array.isArray(data)) {
    errors.push(`${file}: root must be an array.`);
    return { valid: false, errors };
  }
  data.forEach((q, i) => {
    const ref = `${file} item ${i + 1}`;
    // Template/guide records are allowed in templates; they are ignored by the app.
    if (q && typeof q === "object" && q.__template === true) return;
    if (!q || typeof q !== "object") errors.push(`${ref}: must be an object.`);
    if (!Number.isInteger(q?.number)) errors.push(`${ref}: "number" must be integer.`);
    if (typeof q?.question_en !== "string" || !q.question_en.trim()) {
      errors.push(`${ref}: "question_en" must be non-empty string.`);
    }
    if (!Array.isArray(q?.choices_en) || q.choices_en.length < 2) {
      errors.push(`${ref}: "choices_en" must be array with at least 2 options.`);
    }
    if (!Number.isInteger(q?.correctIndex)) {
      errors.push(`${ref}: "correctIndex" must be integer.`);
    } else if (Array.isArray(q?.choices_en)) {
      if (q.correctIndex < 0 || q.correctIndex >= q.choices_en.length) {
        errors.push(
          `${ref}: "correctIndex" out of range (${q.correctIndex}/${q.choices_en.length}).`
        );
      }
    }

    // Require at least one boolean category tag to guarantee filter visibility.
    const hasCategoryTag = Object.entries(q || {}).some(
      ([key, value]) => !coreKeys.has(key) && typeof value === "boolean" && value === true
    );
    if (!hasCategoryTag) {
      errors.push(`${ref}: missing category tag (e.g. "generalGK": true).`);
    }
  });
  return { valid: errors.length === 0, errors };
}

function hasAnyBooleanCategoryTag(question) {
  const coreKeys = new Set([
    "number",
    "question_en",
    "question_el",
    "choices_en",
    "choices_el",
    "correctIndex",
    "image",
    "image_answers",
    "code",
    "id",
    "__sourceId",
    "__sourceLabel",
    "__qid",
  ]);
  return Object.entries(question || {}).some(
    ([key, value]) =>
      !coreKeys.has(key) && typeof value === "boolean" && value === true
  );
}

function normalizeComparableText(text) {
  return String(text ?? "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeAnswerText(text) {
  return normalizeComparableText(text)
    .replace(/\bpid\b/g, "project initiation documentation")
    .replace(/\bproduct based\b/g, "products")
    .replace(/\bhappened\b/g, "occurred")
    .replace(/\bhas already happened\b/g, "has already occurred");
}

function tokenizeComparableText(text) {
  return new Set(
    normalizeComparableText(text)
      .split(" ")
      .filter((w) => w.length > 2 && !DUPLICATE_STOP_WORDS.has(w))
  );
}

function jaccardSimilarity(aText, bText) {
  const a = tokenizeComparableText(aText);
  const b = tokenizeComparableText(bText);
  if (a.size === 0 && b.size === 0) return 1;
  let intersection = 0;
  a.forEach((token) => {
    if (b.has(token)) intersection += 1;
  });
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function overlapCoefficient(aText, bText) {
  const a = tokenizeComparableText(aText);
  const b = tokenizeComparableText(bText);
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  a.forEach((token) => {
    if (b.has(token)) intersection += 1;
  });
  return intersection / Math.min(a.size, b.size);
}

function getCorrectAnswerText(question) {
  if (!question || !Array.isArray(question.choices_en)) return "";
  if (!Number.isInteger(question.correctIndex)) return "";
  return question.choices_en[question.correctIndex] || "";
}

function areQuestionsDuplicateByMeaning(a, b) {
  const qA = normalizeComparableText(a?.question_en);
  const qB = normalizeComparableText(b?.question_en);
  if (!qA || !qB) return false;
  if (qA === qB) return true;

  const qSimilarity = jaccardSimilarity(qA, qB);
  const qOverlap = overlapCoefficient(qA, qB);
  if (qSimilarity >= 0.92) return true;

  const aAnswer = normalizeAnswerText(getCorrectAnswerText(a));
  const bAnswer = normalizeAnswerText(getCorrectAnswerText(b));
  const sameAnswer = aAnswer && bAnswer ? aAnswer === bAnswer : false;
  const answerSimilarity = jaccardSimilarity(aAnswer, bAnswer);

  if (qOverlap >= 0.9 && (sameAnswer || answerSimilarity >= 0.45)) return true;
  return qSimilarity >= 0.78 && (sameAnswer || answerSimilarity >= 0.5);
}

function getQuestionQualityScore(question) {
  const qLen = normalizeComparableText(question?.question_en).length;
  const aLen = normalizeAnswerText(getCorrectAnswerText(question)).length;
  return qLen + aLen;
}

function dedupeQuestions(items) {
  function mergeTrueBooleanTags(primary, secondary) {
    const merged = { ...primary };
    Object.entries(secondary || {}).forEach(([key, value]) => {
      if (
        typeof value === "boolean" &&
        value === true &&
        !key.startsWith("__")
      ) {
        merged[key] = true;
      }
    });
    return merged;
  }

  const kept = [];
  const removedBySource = new Map();
  const removedPairs = [];

  items.forEach((candidate) => {
    let duplicateIndex = -1;

    // 1) Hard exact-duplicate check on normalized question text.
    const candidateQuestionKey = normalizeComparableText(candidate?.question_en);
    if (candidateQuestionKey) {
      for (let i = 0; i < kept.length; i += 1) {
        if (normalizeComparableText(kept[i]?.question_en) === candidateQuestionKey) {
          duplicateIndex = i;
          break;
        }
      }
    }

    // 2) Semantic duplicate check (same meaning), only if exact text did not match.
    if (duplicateIndex === -1) {
      for (let i = 0; i < kept.length; i += 1) {
        if (areQuestionsDuplicateByMeaning(candidate, kept[i])) {
          duplicateIndex = i;
          break;
        }
      }
    }

    if (duplicateIndex === -1) {
      kept.push(candidate);
      return;
    }

    const existing = kept[duplicateIndex];
    const keepCandidate =
      getQuestionQualityScore(candidate) > getQuestionQualityScore(existing);
    const dropped = keepCandidate ? existing : candidate;
    const baseSurvivor = keepCandidate ? candidate : existing;
    const mergedSurvivor = mergeTrueBooleanTags(
      mergeTrueBooleanTags(baseSurvivor, existing),
      candidate
    );
    kept[duplicateIndex] = mergedSurvivor;

    const droppedSource = dropped.__sourceId || "unknown";
    removedBySource.set(droppedSource, (removedBySource.get(droppedSource) || 0) + 1);
    removedPairs.push({
      keptQid: getQuestionId(mergedSurvivor),
      droppedQid: getQuestionId(dropped),
      sourceId: droppedSource,
      keptSourceId: mergedSurvivor.__sourceId || "unknown",
      keptQuestion: mergedSurvivor.question_en || "",
      droppedQuestion: dropped.question_en || "",
    });
  });

  return {
    items: kept,
    removedCount: items.length - kept.length,
    removedBySource,
    removedPairs,
  };
}

function buildAnswerKey(items) {
  return Object.freeze(
    items.reduce((acc, q) => {
      if (
        q &&
        Number.isInteger(q.number) &&
        Number.isInteger(q.correctIndex) &&
        q.correctIndex >= 0
      ) {
        acc[getQuestionId(q)] = q.correctIndex;
      }
      return acc;
    }, {})
  );
}

function buildOriginalAnswers(items) {
  return Object.freeze(
    items.reduce((acc, q) => {
      if (!q || !Number.isInteger(q.number) || !Array.isArray(q.choices_en)) {
        return acc;
      }
      acc[getQuestionId(q)] = {
        choices_en: [...q.choices_en],
        correctIndex: Number.isInteger(q.correctIndex) ? q.correctIndex : null,
      };
      return acc;
    }, {})
  );
}

function setDataSource(items) {
  CURRENT_DATA = Array.isArray(items) ? items : [];
  ANSWER_KEY = buildAnswerKey(CURRENT_DATA);
  ORIGINAL_ANSWERS = buildOriginalAnswers(CURRENT_DATA);
  CATEGORY_DEFINITIONS = buildCategoryDefinitions(CURRENT_DATA);
  ACTIVE_CATEGORY_KEYS = new Set(CATEGORY_DEFINITIONS.map((c) => c.key));
}

async function loadQuestionData() {
  async function discoverQuestionFilesFromDirectory() {
    try {
      const response = await fetch("./", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Failed to list directory (${response.status})`);
      }
      const html = await response.text();
      const hrefs = [...html.matchAll(/href="([^"]+)"/gi)].map((m) => m[1]);
      const files = hrefs
        .map((h) => decodeURIComponent(h).replace(/^\.\//, ""))
        .filter((h) => SOURCE_FILE_PATTERN.test(h))
        .filter((h) => !EXCLUDED_SOURCE_FILES.has(h.toLowerCase()))
        .map((h) => h.split("/").pop());
      return [...new Set(files)].sort((a, b) => a.localeCompare(b));
    } catch (error) {
      console.warn("Directory auto-discovery failed:", error);
      return [];
    }
  }

  async function discoverQuestionFilesFromIndex() {
    try {
      const response = await fetch(SOURCE_INDEX_FILE, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Failed to load ${SOURCE_INDEX_FILE} (${response.status})`);
      }
      const index = await response.json();
      if (!index || !Array.isArray(index.files)) {
        throw new Error(`${SOURCE_INDEX_FILE} must contain: { files: string[] }`);
      }
      const files = index.files
        .map((name) => String(name || "").trim())
        .filter(Boolean)
        .filter((name) => SOURCE_FILE_PATTERN.test(name))
        .filter((name) => !EXCLUDED_SOURCE_FILES.has(name.toLowerCase()));
      return [...new Set(files)].sort((a, b) => a.localeCompare(b));
    } catch (error) {
      console.warn("Index discovery failed:", error);
      return [];
    }
  }

  try {
    DATA_WARNINGS = [];
    DEDUPE_REMOVED_DETAILS = [];
    if (typeof location !== "undefined" && location.protocol === "file:") {
      DATA_WARNINGS.push(
        "You opened index.html via file://. Browsers block fetch() for local JSON files, so q_*.json auto-loading may not work. Recommended: run via Docker or a local web server. Import will still work."
      );
    }
    const discoveredFromDirectory = await discoverQuestionFilesFromDirectory();
    const discoveredFromIndex =
      discoveredFromDirectory.length > 0 ? [] : await discoverQuestionFilesFromIndex();
      const sourceFiles =
      discoveredFromDirectory.length > 0 ? discoveredFromDirectory : discoveredFromIndex;

    const importedFallback = getImportedSources().filter(
      (s) => s && Array.isArray(s.questions) && s.questions.length > 0
    );

    if (sourceFiles.length === 0 && importedFallback.length === 0) {
      DATA_WARNINGS.push(
        `No q_*.json source files discovered. Ensure files exist and ${SOURCE_INDEX_FILE} is updated.`
      );
      throw new Error("No source files discovered");
    }

    if (sourceFiles.length === 0 && importedFallback.length > 0) {
      DATA_WARNINGS.push(
        "No q_*.json files could be discovered/loaded, but imported sources were found. Loading imported sources only."
      );
    }

    if (discoveredFromDirectory.length === 0) {
      DATA_WARNINGS.push(
        `Loaded sources via ${SOURCE_INDEX_FILE} because directory listing is unavailable.`
      );
    }

    const sources = sourceFiles.map((file, index) => {
      const label = sourceLabelFromFile(file);
      const tagKey = sourceTagKeyFromFile(file);
      return {
        id: `source-${index + 1}-${file.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`,
        label,
        tagKey,
        file,
        type: "file",
        enabled: true,
      };
    });

    const imported = importedFallback;
    imported.forEach((imp) => {
      sources.push({
        id: String(imp.id),
        label: String(imp.label || sourceLabelFromFile(imp.fileName || "imported")),
        tagKey: String(imp.tagKey || sourceTagKeyFromFile(imp.fileName || "imported")),
        file: String(imp.fileName || "imported.json"),
        type: "import",
        enabled: true,
        inlineQuestions: imp.questions,
      });
    });

    const loadedSources = [];
    const mergedQuestions = [];

    for (const source of sources) {
      try {
        const data =
          source.type === "import"
            ? source.inlineQuestions
            : await (async () => {
                const response = await fetch(source.file, { cache: "no-store" });
                if (!response.ok) {
                  throw new Error(`Failed to load ${source.file} (${response.status})`);
                }
                return await response.json();
              })();
        const validation = validateQuestionsStructure(source.file, data);
        if (!validation.valid) {
          DATA_WARNINGS.push(
            `${source.file} has invalid JSON structure and was skipped.`
          );
          console.warn(
            `Invalid structure in ${source.file}:`,
            validation.errors.slice(0, 20)
          );
          continue;
        }

        loadedSources.push({
          id: source.id,
          label: source.label,
          file: source.file,
          enabled: source.enabled,
          count: data.length,
        });

        data.forEach((q, idx) => {
          if (!q || typeof q !== "object") return;
          if (q.__template === true) return;
          const withAutoSourceTag = { ...q };
          // Add source-derived category only when question has no explicit category tag.
          if (source.tagKey && !hasAnyBooleanCategoryTag(withAutoSourceTag)) {
            withAutoSourceTag[source.tagKey] = true;
          }
            mergedQuestions.push({
              ...withAutoSourceTag,
              __sourceId: source.id,
              __sourceLabel: source.label,
              __sourceFile: source.file,
              __qid:
                typeof withAutoSourceTag.id === "string" && withAutoSourceTag.id.trim()
                  ? `${source.id}:${withAutoSourceTag.id.trim()}`
                  : `${source.id}:${Number.isInteger(withAutoSourceTag.number) ? withAutoSourceTag.number : idx + 1}:${idx}`,
            });
        });
      } catch (sourceError) {
        console.warn(`Skipping source ${source.file}:`, sourceError);
      }
    }

    if (mergedQuestions.length === 0) {
      throw new Error("No valid questions loaded from configured sources");
    }

    const deduped = dedupeQuestions(mergedQuestions);
    const dedupedQuestions = deduped.items;
    if (deduped.removedCount > 0) {
      const breakdown = [...deduped.removedBySource.entries()]
        .map(([sourceId, count]) => {
          const source = loadedSources.find((s) => s.id === sourceId);
          return `${source?.label || sourceId}: ${count}`;
        })
        .join("; ");
      DATA_WARNINGS.push(
        `Removed ${deduped.removedCount} duplicate or same-meaning questions automatically. ${breakdown}`
      );
      DEDUPE_REMOVED_DETAILS = deduped.removedPairs.map((entry) => {
        const droppedSource = loadedSources.find((s) => s.id === entry.sourceId);
        const keptSource = loadedSources.find((s) => s.id === entry.keptSourceId);
        return {
          droppedSourceLabel: droppedSource?.label || entry.sourceId || "unknown",
          keptSourceLabel: keptSource?.label || entry.keptSourceId || "unknown",
          droppedQuestion: entry.droppedQuestion || "",
          keptQuestion: entry.keptQuestion || "",
        };
      });
    }

    const countsBySource = new Map();
    dedupedQuestions.forEach((q) => {
      const id = q.__sourceId || "unknown";
      countsBySource.set(id, (countsBySource.get(id) || 0) + 1);
    });
    loadedSources.forEach((source) => {
      source.rawCount = source.count;
      source.count = countsBySource.get(source.id) || 0;
    });

    SOURCE_DEFINITIONS = loadedSources;
    ACTIVE_SOURCE_IDS = new Set(
      loadedSources
        .filter((s) => s.enabled)
        .map((s) => s.id)
    );
    if (ACTIVE_SOURCE_IDS.size === 0) {
      loadedSources.forEach((s) => ACTIVE_SOURCE_IDS.add(s.id));
    }

    return dedupedQuestions;
  } catch (error) {
    const imported = getImportedSources().filter(
      (s) => s && Array.isArray(s.questions) && s.questions.length > 0
    );
    const fallbackData = Array.isArray(globalThis.DATA) ? globalThis.DATA : [];
    console.warn("Using fallback question source:", error);
    if (imported.length === 0) {
      DATA_WARNINGS.push("No valid q*.json source loaded. Fallback data was used.");
    } else {
      DATA_WARNINGS.push("q_*.json sources could not be loaded. Imported sources were used.");
    }

    const fallbackDefs = [];
    const mergedQuestions = [];
    if (fallbackData.length > 0) {
      fallbackDefs.push({
        id: DEFAULT_SOURCE_ID,
        label: DEFAULT_SOURCE_LABEL,
        file: "pc_devskills_en.js",
        enabled: true,
        count: fallbackData.length,
      });
      fallbackData.forEach((q, idx) => {
        mergedQuestions.push({
          ...q,
          __sourceId: DEFAULT_SOURCE_ID,
          __sourceLabel: DEFAULT_SOURCE_LABEL,
          __sourceFile: "pc_devskills_en.js",
          __qid:
            typeof q?.id === "string" && q.id.trim()
              ? `${DEFAULT_SOURCE_ID}:${q.id.trim()}`
              : `${DEFAULT_SOURCE_ID}:${Number.isInteger(q?.number) ? q.number : idx + 1}:${idx}`,
        });
      });
    }

    imported.forEach((imp) => {
      const sourceId = String(imp.id);
      const label = String(imp.label || sourceLabelFromFile(imp.fileName || "imported"));
      const tagKey = String(imp.tagKey || sourceTagKeyFromFile(imp.fileName || "imported"));
      const fileName = String(imp.fileName || "imported.json");
      const data = Array.isArray(imp.questions) ? imp.questions : [];
      fallbackDefs.push({
        id: sourceId,
        label,
        file: fileName,
        enabled: true,
        count: data.length,
      });
      data.forEach((q, idx) => {
        if (!q || typeof q !== "object") return;
        if (q.__template === true) return;
        const withAutoSourceTag = { ...q };
        if (tagKey && !hasAnyBooleanCategoryTag(withAutoSourceTag)) {
          withAutoSourceTag[tagKey] = true;
        }
        mergedQuestions.push({
          ...withAutoSourceTag,
          __sourceId: sourceId,
          __sourceLabel: label,
          __sourceFile: fileName,
          __qid:
            typeof withAutoSourceTag.id === "string" && withAutoSourceTag.id.trim()
              ? `${sourceId}:${withAutoSourceTag.id.trim()}`
              : `${sourceId}:${Number.isInteger(withAutoSourceTag.number) ? withAutoSourceTag.number : idx + 1}:${idx}`,
        });
      });
    });

    if (mergedQuestions.length === 0) {
      SOURCE_DEFINITIONS = [];
      ACTIVE_SOURCE_IDS = new Set();
      return [];
    }

    const deduped = dedupeQuestions(mergedQuestions);
    SOURCE_DEFINITIONS = fallbackDefs;
    ACTIVE_SOURCE_IDS = new Set(fallbackDefs.map((s) => s.id));
    return deduped.items;
  }
}

