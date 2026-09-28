const BUNDLED_SETS = [
  { file: "q_networking.json",    icon: "🌐",  title: "Networking",                    tag: "networking",    desc: "OSI layers, TCP/IP, subnetting, routing, DNS, DHCP and more." },
  { file: "q_cybersecurity.json", icon: "🛡️", title: "Cybersecurity",                 tag: "cybersecurity", desc: "OWASP, crypto, authentication, common attacks and defenses." },
  { file: "q_it_general.json",    icon: "💻",  title: "IT General",                    tag: "itGeneral",     desc: "Algorithms, databases, Linux, Git, web fundamentals, OOP." },
  { file: "q_demo.json",          icon: "📦",  title: "Demo (general)",                tag: "demo",          desc: "12 mixed general-knowledge questions — quick smoke test." },

  // ── SQL sets ──
  { file: "q_sql01.json", icon: "🗄️", title: "SQL — Basics",                  tag: "SQL", group: "sql", n: 15, desc: "SELECT, WHERE, DISTINCT, NULLs, JOINs, ORDER BY, aggregates, GROUP BY/HAVING, DML." },
  { file: "q_sql02.json", icon: "🗄️", title: "SQL — JOINs & Subqueries",      tag: "SQL", group: "sql", n: 15, desc: "INNER/LEFT/RIGHT/FULL/CROSS/SELF JOIN, EXISTS vs IN, NOT IN NULL trap, derived tables." },
  { file: "q_sql03.json", icon: "🗄️", title: "SQL — GROUP BY & Aggregates",   tag: "SQL", group: "sql", n: 15, desc: "COUNT/SUM/AVG/MIN/MAX, DISTINCT, HAVING vs WHERE, logical processing order." },
  { file: "q_sql04.json", icon: "🗄️", title: "SQL — String & Date Functions", tag: "SQL", group: "sql", n: 15, desc: "LEN, SUBSTRING, CHARINDEX, LIKE, DATEADD/DATEDIFF, CAST/CONVERT, ISNULL/COALESCE." },
  { file: "q_sql05.json", icon: "🗄️", title: "SQL — Transactions & ACID",     tag: "SQL", group: "sql", n: 15, desc: "ACID, COMMIT/ROLLBACK, savepoints, isolation levels, dirty/phantom reads, deadlocks." },
  { file: "q_sql06.json", icon: "🗄️", title: "SQL — Indexes & Performance",   tag: "SQL", group: "sql", n: 15, desc: "Clustered vs non-clustered, covering/INCLUDE, seek vs scan, fragmentation, plans." },
  { file: "q_sql07.json", icon: "🗄️", title: "SQL — CTEs & Window Functions", tag: "SQL", group: "sql", n: 15, desc: "CTEs, recursion, ROW_NUMBER/RANK, PARTITION BY, LAG/LEAD, running totals." },

  // ── C# sets ──
  { file: "q_cs01.json",  icon: "#️⃣", title: "C# — Types & Control Flow",     tag: "C#",  group: "cs", n: 15, desc: "Value vs reference, var, const/readonly, ref/out, overloading, loops, switch." },
  { file: "q_cs02.json",  icon: "#️⃣", title: "C# — OOP",                      tag: "C#",  group: "cs", n: 15, desc: "class vs struct, interfaces, virtual/override, sealed, access modifiers, polymorphism." },
  { file: "q_cs03.json",  icon: "#️⃣", title: "C# — Null Handling",            tag: "C#",  group: "cs", n: 15, desc: "?? , ??=, ?. , nullable types, HasValue, IsNullOrWhiteSpace, is not null." },
  { file: "q_cs04.json",  icon: "#️⃣", title: "C# — Collections",              tag: "C#",  group: "cs", n: 15, desc: "List, Dictionary, HashSet, Queue, Stack — when to use which, TryGetValue." },
  { file: "q_cs05.json",  icon: "#️⃣", title: "C# — LINQ & Lambdas",           tag: "C#",  group: "cs", n: 15, desc: "Where/Select/First/Any/All/GroupBy/OrderBy, deferred execution, method vs query." },
  { file: "q_cs06.json",  icon: "#️⃣", title: "C# — Strings & StringBuilder",  tag: "C#",  group: "cs", n: 15, desc: "Immutability, StringBuilder, Split/Join, Trim, interpolation, comparisons." },
  { file: "q_cs07.json",  icon: "#️⃣", title: "C# — ADO.NET",                  tag: "C#",  group: "cs", n: 15, desc: "SqlConnection/Command/Reader, ExecuteReader/NonQuery/Scalar, parameters, DBNull." },
  { file: "q_cs08.json",  icon: "#️⃣", title: "C# — Exceptions & async/await", tag: "C#",  group: "cs", n: 15, desc: "try/catch/finally, throw vs throw ex, async/await, Task, deadlocks, CancellationToken." },

  // ── Hidden sets: not shown on the welcome grid by default,
  //    only surface via the search box (match on tag or title). ──
  { file: "q_RosenCh1-4.json",    icon: "📘",  title: "Rosenberg — Philosophy of Social Science (Ch 1-4)", tag: "RosenCh1-4",    desc: "Naturalism vs interpretation, explanation, reasons and causes, intentionality — 40 Q.", hidden: true },
  { file: "q_RosenCh614.json",    icon: "📗",  title: "Rosenberg — Philosophy of Social Science (Ch 6-14)", tag: "RosenCh614",    desc: "Rational choice, game theory, facts and values, objectivity — 50 Q.", hidden: true },
];

// Landing-page folders: sets sharing a `group` are shown inside one folder card.
// `n` on a grouped set = its question count (checked by tests/validate-questions.mjs).
const BUNDLED_GROUPS = {
  sql: { title: "SQL", desc: "From SELECT basics to transactions, indexes, CTEs and window functions." },
  cs:  { title: "C#",  desc: "From types and OOP to LINQ, ADO.NET, exceptions and async/await." },
  my:  { title: "My MCQ", desc: "Your own question sets — imported or generated with the AI prompt." },
};
const MY_GROUP = "my";
const shortSetTitle = (s) => String(s.title || "").replace(/^(SQL|C#)\s*—\s*/, "");

// The folder open on the landing page (null = all closed). Kept across
// re-renders so the breadcrumb and Back can return to it.
let openWelcomeFolder = null;

async function loadBundledQuestionSet(fileName) {
  try {
    const res = await fetch(fileName, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const ok = await importQuestionsData(fileName, data);
    if (ok) {
      DATA_WARNINGS.push(`${fileName} loaded. Delete it anytime from 📚 Sources → Imported.`);
      showDataWarnings();
    }
  } catch (e) {
    DATA_WARNINGS.push(`Could not load ${fileName}: ${e?.message || e}`);
    showDataWarnings();
  }
}

async function downloadBundledQuestionSet(fileName) {
  try {
    const res = await fetch(fileName, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    downloadJsonFile(fileName, data);
  } catch (e) {
    DATA_WARNINGS.push(`Could not download ${fileName}: ${e?.message || e}`);
    showDataWarnings();
  }
}

// Legacy alias kept for compatibility.
function loadDemoQuestions() {
  return loadBundledQuestionSet("q_demo.json");
}


// Render quiz cards and answer choices.
function renderQuiz(items) {
  const host = document.getElementById("quiz");
  if (!host) return;
  host.innerHTML = "";

  // The set-links router can force the picker (the bundled-set grid) even when
  // sets are already loaded — used by the Back button to return to the list.
  const forcePicker = typeof window !== "undefined" && window.__mcqShowPicker === true;
  if (forcePicker || !items || items.length === 0) {
    const noSourcesAtAll =
      forcePicker ||
      ((!Array.isArray(SOURCE_DEFINITIONS) || SOURCE_DEFINITIONS.length === 0) &&
        getImportedSources().length === 0);
    const empty = document.createElement("section");
    empty.className = "card welcome-card";
    if (noSourcesAtAll) {
      const setCardHtml = (s, inFolder) => `
        <div class="welcome-set" data-file="${escapeHTML(s.file)}" data-tag="${escapeHTML((s.tag || "").toLowerCase())}" data-title="${escapeHTML((s.title || "").toLowerCase())}" data-hidden="${s.hidden ? "true" : "false"}"${s.hidden ? " hidden" : ""}>
          <div class="welcome-set-head">
            <span class="welcome-set-icon">${s.icon}</span>
            <span class="welcome-set-title">${escapeHTML(inFolder ? shortSetTitle(s) : s.title)}</span>
            <span class="welcome-set-tag" title="Category tag">#${escapeHTML(s.tag || "")}</span>
          </div>
          <p class="welcome-set-desc">${escapeHTML(s.desc)}</p>
          <div class="welcome-set-actions">
            <button type="button" class="welcome-set-load" data-file="${escapeHTML(s.file)}">▶ Load</button>
            <button type="button" class="welcome-set-share" data-file="${escapeHTML(s.file)}" title="Copy a direct link to this test" aria-label="Share this test">🔗</button>
            <button type="button" class="welcome-set-download" data-file="${escapeHTML(s.file)}" title="Download as .json" aria-label="Download this test as JSON">⬇️</button>
          </div>
        </div>`;
      const folderHtml = (group, { meta, chips, bodyHtml, icon }) => {
        const g = BUNDLED_GROUPS[group];
        const open = openWelcomeFolder === group;
        return `
        <div class="welcome-folder${open ? " open" : ""}" data-group="${escapeHTML(group)}">
          <button type="button" class="welcome-folder-head" aria-expanded="${open}">
            <span class="welcome-folder-icon">${iconSvg(icon)}</span>
            <span class="welcome-folder-main">
              <span class="welcome-folder-title">${escapeHTML(g.title)}</span>
              <span class="welcome-folder-meta">${escapeHTML(meta)}</span>
            </span>
            <span class="welcome-folder-open">${open ? "Close" : "Open"} ${iconSvg("chevronRight")}</span>
          </button>
          <p class="welcome-folder-desc">${escapeHTML(g.desc)}</p>
          ${chips.length ? `<div class="welcome-folder-chips">${chips.map((c) => `<span>${escapeHTML(c)}</span>`).join("")}</div>` : ""}
          <div class="welcome-folder-body"${open ? "" : " hidden"}>${bodyHtml}</div>
        </div>`;
      };
      const seenGroups = new Set();
      const setsHtml = BUNDLED_SETS.map((s) => {
        if (!s.group || !BUNDLED_GROUPS[s.group]) return setCardHtml(s, false);
        if (seenGroups.has(s.group)) return "";
        seenGroups.add(s.group);
        const members = BUNDLED_SETS.filter((x) => x.group === s.group);
        const total = members.reduce((sum, x) => sum + (x.n || 0), 0);
        return folderHtml(s.group, {
          icon: "folder",
          meta: `${members.length} sets · ${total} questions`,
          chips: members.map(shortSetTitle),
          bodyHtml: members.map((m) => setCardHtml(m, true)).join(""),
        });
      }).join("") + (() => {
        // The user's own sets: every imported source that is not a bundled set.
        const bundledFiles = new Set(BUNDLED_SETS.map((x) => x.file));
        const mine = getImportedSources().filter((x) => x && !bundledFiles.has(x.fileName));
        const count = (x) => (Array.isArray(x.questions) ? x.questions.length : 0);
        const cards = mine.map((x) => `
          <div class="welcome-set welcome-set-custom" data-source="${escapeHTML(x.id)}" data-tag="${escapeHTML(String(x.tagKey || "").toLowerCase())}" data-title="${escapeHTML(String(x.label || x.fileName || "").toLowerCase())}" data-hidden="false">
            <div class="welcome-set-head">
              <span class="welcome-set-icon">${iconSvg("user")}</span>
              <span class="welcome-set-title">${escapeHTML(x.label || x.fileName || "Imported")}</span>
            </div>
            <p class="welcome-set-desc">${count(x)} questions · ${escapeHTML(x.fileName || "")}</p>
            <div class="welcome-set-actions">
              <button type="button" class="welcome-set-load" data-source="${escapeHTML(x.id)}">▶ Open</button>
              <button type="button" class="welcome-custom-export" data-source="${escapeHTML(x.id)}" title="Export as .json" aria-label="Export this set as JSON">⬇️</button>
              <button type="button" class="welcome-custom-delete" data-source="${escapeHTML(x.id)}" title="Delete this set" aria-label="Delete this set">🗑</button>
            </div>
          </div>`).join("");
        const empty = `
          <div class="welcome-folder-empty">
            <p>No sets of your own yet. Import a <code>q_*.json</code> file or generate one from any text with the AI prompt.</p>
            <div class="welcome-actions">
              <button type="button" class="welcome-my-import" data-tab="bring">⤴️ Import .json</button>
              <button type="button" class="welcome-my-import" data-tab="ai">✨ AI prompt</button>
            </div>
          </div>`;
        return folderHtml(MY_GROUP, {
          icon: "user",
          meta: mine.length ? `${mine.length} set${mine.length === 1 ? "" : "s"} · ${mine.reduce((a, x) => a + count(x), 0)} questions` : "Empty — add your first set",
          chips: mine.map((x) => x.label || x.fileName || "Imported"),
          bodyHtml: mine.length ? cards : empty,
        });
      })();

      empty.innerHTML = `
        <h2 class="welcome-title">Welcome to MCQ Trainer</h2>
        <p class="welcome-text">Pick a pre-built question set below, or import your own <code>q_*.json</code>.</p>

        <div class="welcome-search">
          <span class="welcome-search-icon" aria-hidden="true">🔎</span>
          <input
            type="search"
            id="welcomeSearch"
            class="welcome-search-input"
            placeholder="Search by tag (e.g. networking, demo)…"
            autocomplete="off"
            spellcheck="false"
          />
          <button type="button" id="welcomeSearchClear" class="welcome-search-clear" aria-label="Clear search" hidden>✕</button>
        </div>

        <div class="welcome-sets-grid" id="welcomeSetsGrid">
          ${setsHtml}
        </div>
        <p class="welcome-search-empty" id="welcomeSearchEmpty" hidden>No matching tags. Try clearing the search.</p>

        ${typeof assessmentsEntryCardHtml === "function" ? assessmentsEntryCardHtml() : ""}

        <div class="welcome-custom">
          <div class="welcome-custom-title">Use your own questions</div>
          <div class="welcome-actions">
            <button type="button" id="welcomeImport">⤴️ Import .json</button>
            <button type="button" id="welcomeTemplate">⬇️ Download template</button>
          </div>
          <p class="welcome-hint">File name must start with <code>q_</code> and end with <code>.json</code>. Loaded sets can be deleted from <strong>📚 Sources → Imported</strong>.</p>
        </div>
      `;
    } else {
      empty.innerHTML = `
        <h2 class="welcome-title">No questions to show</h2>
        <p class="welcome-text">Your current Sources / Categories filter is hiding everything. Open <strong>📚 Sources</strong> and enable at least one source or category.</p>
        ${typeof assessmentsEntryCardHtml === "function" ? assessmentsEntryCardHtml() : ""}
      `;
    }
    host.appendChild(empty);
    if (typeof wireAssessmentsEntry === "function") wireAssessmentsEntry(empty);
    empty.querySelector("#welcomeImport")?.addEventListener("click", () => {
      openImportPromptModal();
    });
    empty.querySelector("#welcomeTemplate")?.addEventListener("click", () => {
      downloadQuestionsTemplate();
    });
    empty.querySelectorAll(".welcome-set-load[data-source]").forEach((btn) => {
      btn.addEventListener("click", () => window.mcqOpenCustomSet?.(btn.getAttribute("data-source")));
    });
    empty.querySelectorAll(".welcome-custom-export").forEach((btn) => {
      btn.addEventListener("click", () => exportImportedSource(btn.getAttribute("data-source")));
    });
    empty.querySelectorAll(".welcome-custom-delete").forEach((btn) => {
      btn.addEventListener("click", () => confirmDeleteImportedSource(btn.getAttribute("data-source")));
    });
    empty.querySelectorAll(".welcome-my-import").forEach((btn) => {
      btn.addEventListener("click", () => {
        openImportPromptModal();
        setImportTab(btn.getAttribute("data-tab"));
      });
    });
    empty.querySelectorAll(".welcome-set-load[data-file]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const f = btn.getAttribute("data-file");
        if (!f) return;
        // Route through the set-links router (URL + history) when present.
        if (typeof window.mcqOpenSet === "function") window.mcqOpenSet(f);
        else loadBundledQuestionSet(f);
      });
    });
    empty.querySelectorAll(".welcome-set-share").forEach((btn) => {
      btn.addEventListener("click", () => {
        const f = btn.getAttribute("data-file");
        if (f && typeof window.mcqShareSet === "function") window.mcqShareSet(f);
      });
    });
    empty.querySelectorAll(".welcome-set-download").forEach((btn) => {
      btn.addEventListener("click", () => {
        const f = btn.getAttribute("data-file");
        if (f) downloadBundledQuestionSet(f);
      });
    });

    // ── Welcome tag search ─────────────────────────────
    const searchInput = empty.querySelector("#welcomeSearch");
    const searchClear = empty.querySelector("#welcomeSearchClear");
    const setsGrid    = empty.querySelector("#welcomeSetsGrid");
    const emptyMsg    = empty.querySelector("#welcomeSearchEmpty");

    function applyWelcomeFilter() {
      const q = (searchInput?.value || "").trim().toLowerCase();
      if (searchClear) searchClear.hidden = q.length === 0;
      const cards = setsGrid?.querySelectorAll(".welcome-set") || [];
      let visible = 0;
      cards.forEach((card) => {
        const isHidden = card.getAttribute("data-hidden") === "true";
        if (!q) {
          // No search → show only public cards, keep hidden ones out of sight.
          card.hidden = isHidden;
          if (!isHidden) visible++;
          return;
        }
        const tag   = card.getAttribute("data-tag")   || "";
        const title = card.getAttribute("data-title") || "";
        const match = tag.includes(q) || title.includes(q);
        card.hidden = !match;
        if (match) visible++;
      });
      // Folders: while searching, open the ones with matches and hide the rest;
      // otherwise show them all and restore the user's open folder.
      setsGrid?.querySelectorAll(".welcome-folder").forEach((folder) => {
        const hasMatch = [...folder.querySelectorAll(".welcome-set")].some((c) => !c.hidden);
        const open = q ? hasMatch : folder.getAttribute("data-group") === openWelcomeFolder;
        folder.hidden = q ? !hasMatch : false;
        setWelcomeFolderOpen(folder, open);
      });
      // "No matches" message only when actively searching and nothing visible.
      if (emptyMsg) emptyMsg.hidden = !(q && visible === 0);
    }

    function setWelcomeFolderOpen(folder, open) {
      folder.classList.toggle("open", open);
      const openLabel = folder.querySelector(".welcome-folder-open");
      if (openLabel) openLabel.innerHTML = `${open ? "Close" : "Open"} ${iconSvg("chevronRight")}`;
      folder.querySelector(".welcome-folder-head")?.setAttribute("aria-expanded", String(open));
      const body = folder.querySelector(".welcome-folder-body");
      if (body) body.hidden = !open;
    }

    setsGrid?.querySelectorAll(".welcome-folder-head").forEach((head) => {
      head.addEventListener("click", () => {
        const folder = head.closest(".welcome-folder");
        const group = folder?.getAttribute("data-group") || null;
        const opening = !folder.classList.contains("open");
        openWelcomeFolder = opening ? group : null;
        setsGrid.querySelectorAll(".welcome-folder").forEach((f) =>
          setWelcomeFolderOpen(f, opening && f === folder)
        );
        if (typeof window.mcqUpdateBreadcrumb === "function") window.mcqUpdateBreadcrumb();
      });
    });

    searchInput?.addEventListener("input", applyWelcomeFilter);
    searchClear?.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      applyWelcomeFilter();
      searchInput?.focus();
    });

    return;
  }

  if (!shuffleMode) items.sort((a, b) => a.number - b.number);
  items.forEach((q, displayIndex) => {
    const card = document.createElement("section");
    card.className = "card";
    card.dataset.number = String(q.number);
    card.dataset.qid = getQuestionId(q);
    const qText =
      currentLang === "el" ? q.question_el || q.question_en : q.question_en;
    const choices =
      currentLang === "el" ? q.choices_el || q.choices_en : q.choices_en;

    const qHeader = document.createElement("div");
    qHeader.className = "q-header";

    const qIndex = document.createElement("span");
    qIndex.className = "q-index";
    qIndex.textContent = String(displayIndex + 1);
    qHeader.appendChild(qIndex);

    const qTitle = document.createElement("div");
    qTitle.className = "q-title";
    qTitle.textContent = `${qText || "-"}`;
    qHeader.appendChild(qTitle);
    card.appendChild(qHeader);
    if (q.image) {
      const img = document.createElement("img");
      img.src = q.image;
      img.className = "q-image";
      img.loading = "lazy";
      card.appendChild(img);
    }
    if (q.image_answers) {
      const imgAns = document.createElement("img");
      imgAns.src = q.image_answers;
      imgAns.className = "answers-image";
      imgAns.loading = "lazy";
      card.appendChild(imgAns);
    }
    if (q.code && q.code.trim().length > 0) {
      const pre = document.createElement("pre");
      const codeTag = document.createElement("code");
      codeTag.textContent = q.code;
      pre.className = "q-code";
      pre.appendChild(codeTag);
      card.appendChild(pre);
    }
    const choicesWrap = document.createElement("div");
    choicesWrap.className = "choices";
    choicesWrap.setAttribute("role", "radiogroup");
    choicesWrap.setAttribute("aria-label", `Answers for question ${displayIndex + 1}`);

    const numChoices = Array.isArray(choices) ? choices.length : 4;
    const letters = ["A", "B", "C", "D", "E", "F", "G", "H"].slice(0, Math.max(2, Math.min(8, numChoices)));

    letters.forEach((letter, i) => {
      const choice = document.createElement("div");
      choice.className = "choice";
      choice.dataset.i = i;
      choice.setAttribute("role", "radio");
      choice.setAttribute("aria-checked", "false");
      choice.tabIndex = 0;
      choice.innerHTML = `<span class="tick"></span><span class="letter">${letter}</span><span class="text">${escapeHTML(
        choices[i] || ""
      )}</span>`;
      choice.addEventListener("click", () => onSelectChoice(q, choice, card));
      choice.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelectChoice(q, choice, card);
          return;
        }
        const forward = e.key === "ArrowDown" || e.key === "ArrowRight";
        const backward = e.key === "ArrowUp" || e.key === "ArrowLeft";
        if (forward || backward) {
          e.preventDefault();
          const siblings = [...choicesWrap.querySelectorAll(".choice")];
          const next =
            siblings[(siblings.indexOf(choice) + (forward ? 1 : -1) + siblings.length) % siblings.length];
          next?.focus();
        }
      });
      choicesWrap.appendChild(choice);
    });
    card.appendChild(choicesWrap);
    const saved = progress.answered[getQuestionId(q)];
    if (saved) {
      card.querySelectorAll(".choice").forEach((c, idx) => {
        if (idx === saved.correct) c.classList.add("correct");
        if (idx === saved.selected && saved.selected !== saved.correct)
          c.classList.add("wrong");
        if (idx === saved.selected) c.setAttribute("aria-checked", "true");
      });
    }
    const actions = document.createElement("div");
    actions.className = "actions";
    const btn = document.createElement("button");
    btn.className = "btn-toggle";
    btn.textContent = "Show answer";
    actions.appendChild(btn);
    card.appendChild(actions);
    const ansBox = document.createElement("div");
    ansBox.className = "answer";
    ansBox.setAttribute("aria-live", "polite");
    card.appendChild(ansBox);

    btn.addEventListener("click", () => {
      if (examMode || godlikeMode) return; // Block manual reveal while Exam or Godlike mode is enabled.
      const correct = getCorrectIndex(q);
      const isShowing = ansBox.classList.contains("show");
      if (isShowing) {
        ansBox.classList.remove("show");
        btn.textContent = "Show answer";
        card
          .querySelectorAll(".choice")
          .forEach((el) => el.classList.remove("correct"));
        logActivity("reveal", { qid: getQuestionId(q), n: q.number, action: "hide" });
      } else {
        card
          .querySelectorAll(".choice")
          .forEach((el, idx) =>
            el.classList.toggle("correct", idx === correct)
          );
        ansBox.textContent = `Correct: ${"ABCDEFGH"[correct] ?? "?"}`;
        ansBox.classList.add("show");
        btn.textContent = "Hide answer";
        logActivity("reveal", { qid: getQuestionId(q), n: q.number, action: "show" });
      }
    });

    host.appendChild(card);
  });
}

function updateScoreUI() {
  const box = document.getElementById("scoreBox");
  box.innerHTML = `Correct: <span id="score-correct">${progress.correct
    }</span> / <span id="score-total">${progress.total}</span>`;

  const godModeIcon = godlikeMode ? "⚡" : "🧠";
  const godModeTitle = godlikeMode ? "God Mode: ON" : "God Mode: OFF";

  const godlikeBtn = document.getElementById("toggleGodlike");
  const mobileGodlikeBtn = document.getElementById("m-toggleGodlike");
  [godlikeBtn, mobileGodlikeBtn].forEach((btn) => {
    if (!btn) return;
    btn.classList.toggle("active", godlikeMode);
    setButtonIconLabel(btn, godModeIcon, "God Mode");
    btn.title = godModeTitle;
    btn.setAttribute("aria-label", godModeTitle);
  });

  const toggleAllBtn = document.getElementById("toggleAll");
  const mobileToggleAllBtn = document.getElementById("m-toggleAll");
  if (godlikeMode || examMode) {
    toggleAllBtn.disabled = true; // Disable "Show all" while Exam or Godlike mode is active.
    if (mobileToggleAllBtn) mobileToggleAllBtn.disabled = true;
  } else {
    toggleAllBtn.disabled = false; // Re-enable "Show all" when both modes are off.
    if (mobileToggleAllBtn) mobileToggleAllBtn.disabled = false;
  }
}

function onSelectChoice(q, choiceEl, card) {
  const qid = getQuestionId(q);
  if (progress.answered[qid]) return;
  const selected = Number(choiceEl.dataset.i);
  const correctIndex = getCorrectIndex(q);
  const choices = card.querySelectorAll(".choice");
  choices.forEach((c, idx) => {
    if (idx === correctIndex) c.classList.add("correct");
    if (idx === selected && selected !== correctIndex) c.classList.add("wrong");
    c.setAttribute("aria-checked", idx === selected ? "true" : "false");
  });
  progress.total++;
  const isCorrect = selected === correctIndex;
  if (isCorrect) progress.correct++;
  recordQuestionAttempt(q, isCorrect);
  progress.answered[qid] = { selected, correct: correctIndex, isCorrect };
  saveProgress();
  updateScoreUI();
  logActivity("answer", {
    qid,
    n: q.number,
    sel: selected,
    cor: correctIndex,
    ok: isCorrect,
    exam: examMode,
    god: godlikeMode,
  });
  if (godlikeMode && !isCorrect) {
    const modal = document.getElementById("godlikeModal");
    modal.style.display = "flex";
    document.getElementById("closeGodlike").onclick = () => {
      modal.style.display = "none";
      appStorage.removeItem("quiz-progress");
      progress = { answered: {}, correct: 0, total: 0 };
      applySourceFilter();
      updateScoreUI();
    };
  }
}

function triggerExplosion() {
  const container = document.getElementById("explosionEffect");
  container.innerHTML = "";
  container.style.display = "block";
  const particles = 30;
  for (let i = 0; i < particles; i++) {
    const p = document.createElement("div");
    p.className = "explosion-particle";
    const angle = Math.random() * 2 * Math.PI;
    const distance = 200 + Math.random() * 150;
    const dx = Math.cos(angle) * distance + "px";
    const dy = Math.sin(angle) * distance + "px";
    p.style.setProperty("--dx", dx);
    p.style.setProperty("--dy", dy);
    container.appendChild(p);
  }
  setTimeout(() => {
    container.style.display = "none";
    container.innerHTML = "";
  }, 900);
}

function shuffleArray(arr) {
  return arr
    .map((x) => ({ x, r: Math.random() }))
    .sort((a, b) => a.r - b.r)
    .map((o) => o.x);
}

