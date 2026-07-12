/* ═══════════════════════════════════════════════════════════════
   ASSESSMENTS · ENGINE — state machine, hub, sequential runner,
   session persistence, mode enter/exit, share-URL boot hook.
   Coexists with the quiz through ONE hook: the guard at the top
   of applySourceFilter() (04-source-filter.js) re-routes rendering
   here while isAssessmentActive(). The quiz state (CURRENT_DATA,
   progress) is never touched.
   ═══════════════════════════════════════════════════════════════ */

/* ── UI label i18n (assessment screens are fully bilingual) ───── */
const ASSESS_I18N = {
  en: {
    hubTitle: "Assessments",
    hubIntro: "Three self-tests with rich, explained results — an IQ estimate, an analytical-thinking profile, and a Dark-Triad personality archetype. Unlike the quiz sets, you don't just get a score: every result explains what it means.",
    hubPrivacy: "Everything runs on this device — nothing is uploaded.",
    backToQuiz: "← Back to quiz",
    iqName: "IQ Test",
    analyticalName: "Analytical Thinking Test",
    sd3Name: "Dark Triad Personality Test",
    iqDesc: "20 questions · 4 domains. Estimates an IQ band with strengths and weaknesses per domain.",
    analyticalDesc: "25 logic questions. Places you on a 7-band ladder from Chaotic Thinker to Mastermind Intelligence.",
    sd3Desc: "27 statements, 1–5 agreement. Maps narcissism, Machiavellianism and psychopathy to one of 8 archetypes. No right answers.",
    itemsLabel: "questions",
    minutesLabel: "min",
    notStarted: "Not started",
    inProgress: "In progress",
    completed: "Completed",
    start: "Start",
    continueLabel: "Continue",
    viewResults: "View results",
    retake: "Retake",
    question: "Question",
    answeredLabel: "answered",
    back: "◀ Back",
    skip: "Skip",
    next: "Next ▶",
    submit: "✓ Submit",
    exitToHub: "✕ Save & exit",
    noRightAnswers: "There are no right or wrong answers — answer honestly.",
    submitBlanksConfirm: "Unanswered questions: {n}. They will be scored as incorrect. Submit anyway?",
    sd3Incomplete: "Please answer all statements — {n} remaining.",
    retakeConfirm: "Start over? Your previous result stays until you submit the new run.",
    confirmSubmit: "Submit",
    cancel: "Cancel",
    you: "You",
    likelyRange: "Likely range",
    rawScore: "Raw score",
    whatItMeans: "What this means",
    domainBreakdown: "Domain breakdown",
    domainCaption: "Bar = estimated percentile within each domain (rounded to the nearest 5).",
    areaBreakdown: "Per-area breakdown",
    traitBreakdown: "Trait breakdown",
    archetypeLabel: "Your archetype",
    cognitionNote: "Cognitive tendency",
    famousExamples: "Famous examples",
    limitationsTitle: "Read this before quoting your result",
    anLimitations: "25 items measure one narrow slice of thinking skill, without time pressure or norms. Treat the band as a playful label and the per-area notes as the useful part — not as a verdict on your intelligence.",
    strong: "Strength",
    mid: "Balanced",
    weak: "Needs work",
    high: "High",
    low: "Low",
    share: "Share result",
    copied: "Link copied!",
    shareFail: "Could not copy the link.",
    invalidShare: "Invalid shared-result link.",
    sharedNote: "You are viewing a shared result.",
    sharedPartialNote: "The per-area breakdown is visible only on the device where the test was taken.",
    takeThisTest: "Take this test",
    exploreAssessments: "See all tests",
    backToHub: "Back to tests",
    disclaimer: "This is not a clinical assessment. Results are for educational and entertainment purposes only.",
    attributionIq: "Item formats inspired by the public-domain item types of ICAR (International Cognitive Ability Resource).",
    attributionSd3: "Format follows the Short Dark Triad (SD3) — Jones & Paulhus (2014). Items are original paraphrases.",
  },
  el: {
    hubTitle: "Αξιολογήσεις",
    hubIntro: "Τρία τεστ αυτοαξιολόγησης με πλούσια, επεξηγημένα αποτελέσματα — εκτίμηση IQ, προφίλ αναλυτικής σκέψης και αρχέτυπο προσωπικότητας Σκοτεινής Τριάδας. Σε αντίθεση με τα σετ του κουίζ, δεν παίρνεις απλώς ένα σκορ: κάθε αποτέλεσμα εξηγεί τι σημαίνει.",
    hubPrivacy: "Όλα τρέχουν σε αυτή τη συσκευή — τίποτα δεν αποστέλλεται.",
    backToQuiz: "← Πίσω στο κουίζ",
    iqName: "Τεστ IQ",
    analyticalName: "Τεστ Αναλυτικής Σκέψης",
    sd3Name: "Τεστ Προσωπικότητας Σκοτεινής Τριάδας",
    iqDesc: "20 ερωτήσεις · 4 τομείς. Εκτιμά εύρος IQ με δυνατά και αδύναμα σημεία ανά τομέα.",
    analyticalDesc: "25 ερωτήσεις λογικής. Σε τοποθετεί σε κλίμακα 7 βαθμίδων, από Χαοτικό Στοχαστή έως Ιδιοφυή Νου.",
    sd3Desc: "27 δηλώσεις, συμφωνία 1–5. Αποτυπώνει ναρκισσισμό, μακιαβελισμό και ψυχοπάθεια σε 1 από 8 αρχέτυπα. Δεν υπάρχουν σωστές απαντήσεις.",
    itemsLabel: "ερωτήσεις",
    minutesLabel: "λεπ.",
    notStarted: "Δεν ξεκίνησε",
    inProgress: "Σε εξέλιξη",
    completed: "Ολοκληρώθηκε",
    start: "Έναρξη",
    continueLabel: "Συνέχεια",
    viewResults: "Δες αποτελέσματα",
    retake: "Επανάληψη",
    question: "Ερώτηση",
    answeredLabel: "απαντημένες",
    back: "◀ Πίσω",
    skip: "Παράλειψη",
    next: "Επόμενη ▶",
    submit: "✓ Υποβολή",
    exitToHub: "✕ Αποθήκευση & έξοδος",
    noRightAnswers: "Δεν υπάρχουν σωστές ή λάθος απαντήσεις — απάντησε ειλικρινά.",
    submitBlanksConfirm: "Αναπάντητες ερωτήσεις: {n}. Θα μετρηθούν ως λάθος. Υποβολή;",
    sd3Incomplete: "Απάντησε όλες τις δηλώσεις — αναπάντητες: {n}.",
    retakeConfirm: "Νέα προσπάθεια; Το προηγούμενο αποτέλεσμα μένει μέχρι να υποβάλεις τη νέα.",
    confirmSubmit: "Υποβολή",
    cancel: "Άκυρο",
    you: "Εσύ",
    likelyRange: "Πιθανό εύρος",
    rawScore: "Σκορ",
    whatItMeans: "Τι σημαίνει αυτό",
    domainBreakdown: "Ανάλυση ανά τομέα",
    domainCaption: "Μπάρα = εκτιμώμενο εκατοστημόριο ανά τομέα (στρογγυλοποιημένο στο πλησιέστερο 5).",
    areaBreakdown: "Ανάλυση ανά περιοχή",
    traitBreakdown: "Ανάλυση ανά χαρακτηριστικό",
    archetypeLabel: "Το αρχέτυπό σου",
    cognitionNote: "Γνωστική τάση",
    famousExamples: "Γνωστά παραδείγματα",
    limitationsTitle: "Διάβασε αυτό πριν επικαλεστείς το αποτέλεσμα",
    anLimitations: "Οι 25 ερωτήσεις μετρούν ένα στενό κομμάτι της σκέψης, χωρίς πίεση χρόνου και χωρίς στάθμιση. Αντιμετώπισε τη βαθμίδα ως παιχνιδιάρικη ετικέτα και τις σημειώσεις ανά περιοχή ως το χρήσιμο μέρος — όχι ως ετυμηγορία για τη νοημοσύνη σου.",
    strong: "Δυνατό σημείο",
    mid: "Ισορροπημένο",
    weak: "Θέλει δουλειά",
    high: "Υψηλό",
    low: "Χαμηλό",
    share: "Κοινοποίηση",
    copied: "Ο σύνδεσμος αντιγράφηκε!",
    shareFail: "Δεν ήταν δυνατή η αντιγραφή του συνδέσμου.",
    invalidShare: "Μη έγκυρος σύνδεσμος αποτελέσματος.",
    sharedNote: "Βλέπεις ένα κοινοποιημένο αποτέλεσμα.",
    sharedPartialNote: "Η ανάλυση ανά περιοχή είναι ορατή μόνο στη συσκευή όπου έγινε το τεστ.",
    takeThisTest: "Κάνε το τεστ",
    exploreAssessments: "Δες όλα τα τεστ",
    backToHub: "Πίσω στα τεστ",
    disclaimer: "Δεν αποτελεί κλινική αξιολόγηση. Τα αποτελέσματα προορίζονται αποκλειστικά για εκπαιδευτικούς και ψυχαγωγικούς σκοπούς.",
    attributionIq: "Τα φορμά των ερωτήσεων είναι εμπνευσμένα από τους τύπους ερωτήσεων δημόσιου τομέα του ICAR (International Cognitive Ability Resource).",
    attributionSd3: "Η δομή ακολουθεί το Short Dark Triad (SD3) — Jones & Paulhus (2014). Οι δηλώσεις είναι πρωτότυπες παραφράσεις.",
  },
};

function assessT(key) {
  const lang = typeof currentLang === "string" ? currentLang : "en";
  return (ASSESS_I18N[lang] && ASSESS_I18N[lang][key]) || ASSESS_I18N.en[key] || key;
}

function pickLang(obj, field) {
  if (!obj) return "";
  const lang = typeof currentLang === "string" ? currentLang : "en";
  return obj[`${field}_${lang}`] || obj[`${field}_en`] || "";
}

/* ── Test registry ──────────────────────────────────────────────── */
const ASSESS_TESTS = {
  iq: {
    icon: "🧠",
    nameKey: "iqName",
    descKey: "iqDesc",
    minutes: 15,
    kind: "mcq",
    items: () => IQ_ITEMS,
    score: (answers) => scoreIq(answers),
    toStored: (r, attempt) => ({
      completedAt: Date.now(), raw: r.raw, domains: r.domains,
      iqPoint: r.iqPoint, band: r.band, attempt,
    }),
    fromStored: (s) => computeIqFromDomains(s.domains),
    render: (host, result, opts) => renderIqResults(host, result, opts),
  },
  analytical: {
    icon: "🧩",
    nameKey: "analyticalName",
    descKey: "analyticalDesc",
    minutes: 15,
    kind: "mcq",
    items: () => ANALYTICAL_ITEMS,
    score: (answers) => scoreAnalytical(answers),
    toStored: (r, attempt) => ({
      completedAt: Date.now(), raw: r.raw, areas: r.areas,
      bandIndex: r.bandIndex, attempt,
    }),
    fromStored: (s) => ({ raw: s.raw, areas: s.areas || null, bandIndex: analyticalBandIndex(s.raw) }),
    render: (host, result, opts) => renderAnalyticalResults(host, result, opts),
  },
  sd3: {
    icon: "🎭",
    nameKey: "sd3Name",
    descKey: "sd3Desc",
    minutes: 5,
    kind: "likert",
    items: () => SD3_ITEMS,
    score: (answers) => scoreSd3(answers),
    toStored: (r, attempt) => ({
      completedAt: Date.now(), sums: r.sums, norm: r.norm,
      high: r.high, archetypeKey: r.archetypeKey, attempt,
    }),
    fromStored: (s) => computeSd3FromSums(s.sums),
    render: (host, result, opts) => renderSd3Results(host, result, opts),
  },
};
const ASSESS_TEST_IDS = ["iq", "analytical", "sd3"];

/* ── View state ─────────────────────────────────────────────────── */
let ASSESS_VIEW = { mode: "inactive", testId: null, index: 0, shared: null };

function isAssessmentActive() {
  return ASSESS_VIEW.mode !== "inactive";
}

/* ── Persistence (via guarded appStorage; keys wiped by Clear-all) ─ */
function _loadAssessStore(key) {
  try {
    const raw = appStorage.getItem(key);
    if (!raw) return { v: 1 };
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object" || data.v !== 1) return { v: 1 };
    return data;
  } catch {
    return { v: 1 };
  }
}
function _saveAssessStore(key, data) {
  try { appStorage.setItem(key, JSON.stringify(data)); } catch {}
}

function getAssessSession(testId) {
  const store = _loadAssessStore(ASSESS_SESSIONS_STORAGE_KEY);
  const s = store[testId];
  return s && typeof s === "object" && s.answers && typeof s.answers === "object" ? s : null;
}
function saveAssessSession(testId, session) {
  const store = _loadAssessStore(ASSESS_SESSIONS_STORAGE_KEY);
  store[testId] = session;
  _saveAssessStore(ASSESS_SESSIONS_STORAGE_KEY, store);
}
function deleteAssessSession(testId) {
  const store = _loadAssessStore(ASSESS_SESSIONS_STORAGE_KEY);
  delete store[testId];
  _saveAssessStore(ASSESS_SESSIONS_STORAGE_KEY, store);
}
function getAssessResult(testId) {
  const store = _loadAssessStore(ASSESS_RESULTS_STORAGE_KEY);
  const r = store[testId];
  return r && typeof r === "object" ? r : null;
}
function saveAssessResult(testId, stored) {
  const store = _loadAssessStore(ASSESS_RESULTS_STORAGE_KEY);
  store[testId] = stored;
  _saveAssessStore(ASSESS_RESULTS_STORAGE_KEY, store);
}

function assessAnsweredCount(session, items) {
  if (!session) return 0;
  return items.filter((it) => {
    const v = session.answers[it.id];
    return v !== null && v !== undefined;
  }).length;
}

/* ── Landing entry card (injected by renderQuiz in 07-quiz.js) ──── */
function assessmentsEntryCardHtml() {
  return `
    <div class="assessments-entry" id="assessmentsEntry" role="button" tabindex="0" aria-label="Open Assessments">
      <div class="assessments-entry-head">
        <span class="assessments-entry-icon">🎯</span>
        <span class="assessments-entry-title">Assessments</span>
        <span class="assessments-entry-badge">NEW</span>
      </div>
      <p class="assessments-entry-desc">IQ · Analytical Thinking · Dark Triad — three self-tests with rich, explained results. Free, on-device, bilingual (EN/EL). Not a clinical assessment.</p>
    </div>`;
}

function wireAssessmentsEntry(root) {
  const el = root.querySelector("#assessmentsEntry");
  if (!el) return;
  const go = () => enterAssessments();
  el.addEventListener("click", go);
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); }
  });
}

/* ── Mode enter / exit ──────────────────────────────────────────── */
function syncAssessButtons(active) {
  ["openAssessments", "m-openAssessments"].forEach((id) => {
    document.getElementById(id)?.classList.toggle("active", !!active);
  });
}

function enterAssessments() {
  if (!isAssessmentActive()) logActivity("assessment", { event: "enter" });
  ASSESS_VIEW = { mode: "hub", testId: null, index: 0, shared: null };
  document.body.classList.add("assessment-on");
  syncAssessButtons(true);
  renderAssessmentView();
}

function exitAssessments() {
  stripAssessShareParam();
  ASSESS_VIEW = { mode: "inactive", testId: null, index: 0, shared: null };
  document.body.classList.remove("assessment-on");
  syncAssessButtons(false);
  logActivity("assessment", { event: "exit" });
  applySourceFilter(); // guard is now inactive → normal quiz render
}

function toggleAssessmentsFromToolbar() {
  if (!isAssessmentActive()) { enterAssessments(); return; }
  if (ASSESS_VIEW.mode === "hub") exitAssessments();
  else assessGoHub();
}

function stripAssessShareParam() {
  try {
    if (new URLSearchParams(location.search).has("ar")) {
      history.replaceState(null, "", location.pathname + location.hash);
    }
  } catch {}
}

/* ── View dispatcher (called by the applySourceFilter guard) ────── */
function renderAssessmentView() {
  const host = document.getElementById("quiz");
  if (!host) return;
  host.innerHTML = "";
  if (ASSESS_VIEW.mode === "hub") renderAssessHub(host);
  else if (ASSESS_VIEW.mode === "running") renderAssessRunner(host);
  else if (ASSESS_VIEW.mode === "results") renderAssessResultsView(host);
  else if (ASSESS_VIEW.mode === "shared") renderAssessSharedView(host);
}

/* ── Hub ────────────────────────────────────────────────────────── */
function renderAssessHub(host) {
  const wrap = document.createElement("section");
  wrap.className = "card assess-card assess-hub";

  const cards = ASSESS_TEST_IDS.map((id) => {
    const test = ASSESS_TESTS[id];
    const items = test.items();
    const session = getAssessSession(id);
    const stored = getAssessResult(id);
    const answered = assessAnsweredCount(session, items);

    let statusChip, primaryLabel, primaryAction;
    if (session) {
      statusChip = `<span class="assess-chip assess-chip-progress">${escapeHTML(assessT("inProgress"))} · ${answered}/${items.length}</span>`;
      primaryLabel = `▶ ${assessT("continueLabel")}`;
      primaryAction = "continue";
    } else if (stored) {
      const when = new Date(stored.completedAt).toLocaleDateString();
      statusChip = `<span class="assess-chip assess-chip-done">✓ ${escapeHTML(assessT("completed"))} · ${escapeHTML(when)}</span>`;
      primaryLabel = `📊 ${assessT("viewResults")}`;
      primaryAction = "results";
    } else {
      statusChip = `<span class="assess-chip">${escapeHTML(assessT("notStarted"))}</span>`;
      primaryLabel = `▶ ${assessT("start")}`;
      primaryAction = "start";
    }

    const secondary = stored && !session
      ? `<button type="button" class="assess-test-secondary" data-test="${id}" data-act="retake">🔁 ${escapeHTML(assessT("retake"))}</button>`
      : stored && session
        ? `<button type="button" class="assess-test-secondary" data-test="${id}" data-act="results">📊 ${escapeHTML(assessT("viewResults"))}</button>`
        : "";

    return `<div class="assess-test-card">
      <div class="assess-test-head">
        <span class="assess-test-icon">${test.icon}</span>
        <span class="assess-test-name">${escapeHTML(assessT(test.nameKey))}</span>
      </div>
      <div class="assess-test-meta">${items.length} ${escapeHTML(assessT("itemsLabel"))} · ~${test.minutes} ${escapeHTML(assessT("minutesLabel"))} ${statusChip}</div>
      <p class="assess-test-desc">${escapeHTML(assessT(test.descKey))}</p>
      <div class="assess-test-actions">
        <button type="button" class="assess-test-primary" data-test="${id}" data-act="${primaryAction}">${primaryLabel}</button>
        ${secondary}
      </div>
    </div>`;
  }).join("");

  wrap.innerHTML = `
    <div class="assess-hub-top">
      <h2 class="assess-title">🎯 ${escapeHTML(assessT("hubTitle"))}</h2>
      <button type="button" class="assess-exit-btn" id="assessBackToQuiz">${escapeHTML(assessT("backToQuiz"))}</button>
    </div>
    <p class="assess-hub-intro">${escapeHTML(assessT("hubIntro"))}</p>
    <p class="assess-caption">🔒 ${escapeHTML(assessT("hubPrivacy"))}</p>
    <div class="assess-hub-grid">${cards}</div>
    ${assessFooterHtml(`${assessT("attributionIq")} ${assessT("attributionSd3")}`)}
  `;
  host.appendChild(wrap);

  wrap.querySelector("#assessBackToQuiz")?.addEventListener("click", () => exitAssessments());
  wrap.querySelectorAll("[data-act]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-test");
      const act = btn.getAttribute("data-act");
      if (act === "results") { ASSESS_VIEW = { ...ASSESS_VIEW, mode: "results", testId: id }; renderAssessmentView(); }
      else if (act === "retake") assessRetake(id);
      else startOrResumeTest(id);
    });
  });
}

/* ── Runner ─────────────────────────────────────────────────────── */
function createAssessSession(testId) {
  const session = { startedAt: Date.now(), updatedAt: Date.now(), index: 0, answers: {} };
  saveAssessSession(testId, session);
  logActivity("assessment", { event: "start", test: testId });
  return session;
}

function startOrResumeTest(testId) {
  stripAssessShareParam();
  const items = ASSESS_TESTS[testId].items();
  let session = getAssessSession(testId);
  if (!session) session = createAssessSession(testId);
  ASSESS_VIEW = {
    mode: "running",
    testId,
    index: Math.min(Number(session.index) || 0, items.length - 1),
    shared: null,
  };
  document.body.classList.add("assessment-on");
  syncAssessButtons(true);
  renderAssessmentView();
}

function renderAssessRunner(host) {
  const testId = ASSESS_VIEW.testId;
  const test = ASSESS_TESTS[testId];
  const items = test.items();
  const session = getAssessSession(testId) || createAssessSession(testId);
  const idx = Math.max(0, Math.min(ASSESS_VIEW.index, items.length - 1));
  const item = items[idx];
  const answered = assessAnsweredCount(session, items);
  const isLast = idx === items.length - 1;

  const wrap = document.createElement("section");
  wrap.className = "card assess-card assess-runner";

  // Header + progress
  const header = document.createElement("div");
  header.className = "assess-runner-top";
  header.innerHTML = `
    <span class="assess-runner-title">${test.icon} ${escapeHTML(assessT(test.nameKey))}</span>
    <button type="button" class="assess-exit-btn" id="assessRunnerExit">${escapeHTML(assessT("exitToHub"))}</button>`;
  wrap.appendChild(header);

  const pct = Math.round((answered / items.length) * 100);
  const progress = document.createElement("div");
  progress.className = "assess-progress";
  progress.innerHTML = `
    <div class="assess-progress-track"><div class="assess-progress-fill" style="width:${pct}%"></div></div>
    <div class="assess-progress-text">${escapeHTML(assessT("question"))} ${idx + 1} / ${items.length} · ${answered} ${escapeHTML(assessT("answeredLabel"))}</div>`;
  wrap.appendChild(progress);

  // Dot strip (jump navigation — the skip-and-return mechanism)
  const dots = document.createElement("div");
  dots.className = "assess-dots";
  dots.setAttribute("role", "tablist");
  items.forEach((it, i) => {
    const v = session.answers[it.id];
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "assess-dot";
    if (v !== null && v !== undefined) dot.classList.add("done");
    else if (v === null) dot.classList.add("skipped");
    if (i === idx) dot.classList.add("current");
    dot.title = `${assessT("question")} ${i + 1}`;
    dot.setAttribute("aria-label", `${assessT("question")} ${i + 1}`);
    dot.addEventListener("click", () => setAssessIndex(i));
    dots.appendChild(dot);
  });
  wrap.appendChild(dots);

  // Item card
  const card = document.createElement("div");
  card.className = "assess-item";

  const prompt = document.createElement("p");
  prompt.className = "assess-item-prompt";
  prompt.textContent = pickLang(item, test.kind === "likert" ? "text" : "prompt") || pickLang(item, "text");
  card.appendChild(prompt);

  if (item.stimulusSvg) {
    const stim = document.createElement("div");
    stim.className = "assess-stimulus";
    stim.innerHTML = item.stimulusSvg; // trusted static SVG from our data files
    card.appendChild(stim);
  }

  const current = session.answers[item.id];

  if (test.kind === "likert") {
    const hint = document.createElement("p");
    hint.className = "assess-caption";
    hint.textContent = assessT("noRightAnswers");
    card.appendChild(hint);

    const likert = document.createElement("div");
    likert.className = "assess-likert";
    likert.setAttribute("role", "radiogroup");
    const labels = currentLang === "el" ? SD3_LIKERT.labels_el : SD3_LIKERT.labels_en;
    for (let v = 1; v <= 5; v++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "assess-likert-btn";
      btn.setAttribute("role", "radio");
      btn.setAttribute("aria-checked", current === v ? "true" : "false");
      if (current === v) btn.classList.add("picked");
      btn.innerHTML = `<span class="assess-likert-num">${v}</span><span class="assess-likert-lab">${escapeHTML(labels[v - 1])}</span>`;
      btn.addEventListener("click", () => recordAssessAnswer(v));
      likert.appendChild(btn);
    }
    card.appendChild(likert);
  } else if (item.choiceSvgs) {
    const grid = document.createElement("div");
    grid.className = "assess-svg-choices";
    grid.setAttribute("role", "radiogroup");
    const letters = ["A", "B", "C", "D"];
    item.choiceSvgs.forEach((svg, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "assess-svg-choice";
      btn.setAttribute("role", "radio");
      btn.setAttribute("aria-checked", current === i ? "true" : "false");
      btn.setAttribute("aria-label", `${assessT("question")} ${idx + 1} — ${letters[i]}`);
      if (current === i) btn.classList.add("picked");
      btn.innerHTML = `<span class="assess-svg-letter">${letters[i]}</span>${svg}`; // trusted static SVG
      btn.addEventListener("click", () => recordAssessAnswer(i));
      grid.appendChild(btn);
    });
    card.appendChild(grid);
  } else {
    const list = document.createElement("div");
    list.className = "choices assess-choices";
    list.setAttribute("role", "radiogroup");
    const letters = ["A", "B", "C", "D"];
    const texts = currentLang === "el" && Array.isArray(item.choices_el) ? item.choices_el : item.choices_en;
    texts.forEach((text, i) => {
      const choice = document.createElement("div");
      choice.className = "choice assess-choice";
      choice.setAttribute("role", "radio");
      choice.setAttribute("aria-checked", current === i ? "true" : "false");
      choice.tabIndex = 0;
      if (current === i) choice.classList.add("picked");
      choice.innerHTML = `<span class="letter">${letters[i]}</span><span class="text">${escapeHTML(text || "")}</span>`;
      choice.addEventListener("click", () => recordAssessAnswer(i));
      choice.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          recordAssessAnswer(i);
          return;
        }
        const forward = e.key === "ArrowDown" || e.key === "ArrowRight";
        const backward = e.key === "ArrowUp" || e.key === "ArrowLeft";
        if (forward || backward) {
          e.preventDefault();
          const siblings = [...list.querySelectorAll(".choice")];
          const next = siblings[(siblings.indexOf(choice) + (forward ? 1 : -1) + siblings.length) % siblings.length];
          next?.focus();
        }
      });
      list.appendChild(choice);
    });
    card.appendChild(list);
  }
  wrap.appendChild(card);

  // Navigation
  const nav = document.createElement("div");
  nav.className = "assess-nav";
  nav.innerHTML = `
    <button type="button" id="assessNavBack" ${idx === 0 ? "disabled" : ""}>${escapeHTML(assessT("back"))}</button>
    <button type="button" id="assessNavSkip">${escapeHTML(assessT("skip"))}</button>
    <button type="button" id="assessNavNext" class="assess-nav-primary">${escapeHTML(isLast ? assessT("submit") : assessT("next"))}</button>`;
  wrap.appendChild(nav);

  const footer = document.createElement("div");
  footer.innerHTML = assessFooterHtml("");
  wrap.appendChild(footer.firstElementChild);

  host.appendChild(wrap);

  wrap.querySelector("#assessRunnerExit")?.addEventListener("click", () => assessGoHub());
  wrap.querySelector("#assessNavBack")?.addEventListener("click", () => setAssessIndex(idx - 1));
  wrap.querySelector("#assessNavSkip")?.addEventListener("click", () => skipAssessItem());
  wrap.querySelector("#assessNavNext")?.addEventListener("click", () => {
    if (isLast) submitAssessment();
    else setAssessIndex(idx + 1);
  });
}

function setAssessIndex(i) {
  const items = ASSESS_TESTS[ASSESS_VIEW.testId].items();
  const idx = Math.max(0, Math.min(i, items.length - 1));
  ASSESS_VIEW.index = idx;
  const session = getAssessSession(ASSESS_VIEW.testId);
  if (session) {
    session.index = idx;
    session.updatedAt = Date.now();
    saveAssessSession(ASSESS_VIEW.testId, session);
  }
  renderAssessmentView();
}

function recordAssessAnswer(value) {
  const testId = ASSESS_VIEW.testId;
  const items = ASSESS_TESTS[testId].items();
  const item = items[ASSESS_VIEW.index];
  const session = getAssessSession(testId) || createAssessSession(testId);
  session.answers[item.id] = value;
  session.updatedAt = Date.now();
  saveAssessSession(testId, session);
  renderAssessmentView();
}

function skipAssessItem() {
  const testId = ASSESS_VIEW.testId;
  const items = ASSESS_TESTS[testId].items();
  const item = items[ASSESS_VIEW.index];
  const session = getAssessSession(testId) || createAssessSession(testId);
  if (session.answers[item.id] === undefined) session.answers[item.id] = null;
  session.updatedAt = Date.now();
  saveAssessSession(testId, session);
  if (ASSESS_VIEW.index < items.length - 1) setAssessIndex(ASSESS_VIEW.index + 1);
  else renderAssessmentView();
}

function submitAssessment() {
  const testId = ASSESS_VIEW.testId;
  const test = ASSESS_TESTS[testId];
  const items = test.items();
  const session = getAssessSession(testId);
  if (!session) return;

  const unanswered = items.filter((it) => {
    const v = session.answers[it.id];
    return v === null || v === undefined;
  });

  if (test.kind === "likert" && unanswered.length > 0) {
    showToast(assessT("sd3Incomplete").replace("{n}", String(unanswered.length)));
    const firstIdx = items.findIndex((it) => {
      const v = session.answers[it.id];
      return v === null || v === undefined;
    });
    if (firstIdx >= 0) setAssessIndex(firstIdx);
    return;
  }

  const doSubmit = () => {
    const result = test.score(session.answers);
    const attempt = (getAssessResult(testId)?.attempt || 0) + 1;
    saveAssessResult(testId, test.toStored(result, attempt));
    deleteAssessSession(testId);
    const logDetail = { event: "submit", test: testId, attempt };
    if (testId !== "sd3") logDetail.raw = result.raw; // never log SD-3 scores (privacy)
    logActivity("assessment", logDetail);
    ASSESS_VIEW = { mode: "results", testId, index: 0, shared: null };
    renderAssessmentView();
  };

  if (unanswered.length > 0) {
    openModeResetConfirm(
      assessT("submitBlanksConfirm").replace("{n}", String(unanswered.length)),
      doSubmit,
      null,
      { confirmLabel: assessT("confirmSubmit"), cancelLabel: assessT("cancel") }
    );
  } else {
    doSubmit();
  }
}

/* ── Results / shared views ─────────────────────────────────────── */
function renderAssessResultsView(host) {
  const testId = ASSESS_VIEW.testId;
  const test = ASSESS_TESTS[testId];
  const stored = test ? getAssessResult(testId) : null;
  if (!stored) { renderAssessHub(host); return; }
  test.render(host, test.fromStored(stored), { shared: false });
}

function renderAssessSharedView(host) {
  const shared = ASSESS_VIEW.shared;
  const test = shared ? ASSESS_TESTS[shared.testId] : null;
  if (!test) { renderAssessHub(host); return; }
  test.render(host, shared.result, { shared: true, partial: !!shared.partial });
}

function assessGoHub() {
  stripAssessShareParam();
  ASSESS_VIEW = { mode: "hub", testId: null, index: 0, shared: null };
  document.body.classList.add("assessment-on");
  syncAssessButtons(true);
  renderAssessmentView();
}

function assessRetake(testId) {
  openModeResetConfirm(
    assessT("retakeConfirm"),
    () => {
      deleteAssessSession(testId);
      createAssessSession(testId);
      ASSESS_VIEW = { mode: "running", testId, index: 0, shared: null };
      renderAssessmentView();
    },
    null,
    { confirmLabel: assessT("retake"), cancelLabel: assessT("cancel") }
  );
}

function assessTakeSharedTest(testId) {
  startOrResumeTest(testId);
}

function assessShare(testId) {
  const test = ASSESS_TESTS[testId];
  const stored = getAssessResult(testId);
  if (!test || !stored) return;
  const url = buildShareUrl(testId, test.fromStored(stored));
  if (!url) return;

  const copyFallback = () => {
    try {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      showToast(assessT(ok ? "copied" : "shareFail"));
    } catch {
      showToast(assessT("shareFail"));
    }
  };

  if (navigator.share) {
    navigator.share({ title: assessT(test.nameKey), url }).catch(() => {});
    return;
  }
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(url)
      .then(() => showToast(assessT("copied")))
      .catch(copyFallback);
    return;
  }
  copyFallback();
}

/* ── Boot: toolbar wiring + share-URL hook ──────────────────────────
   Registered as our own DOMContentLoaded listener — zero diff to
   08-boot-theme.js. 08's boot awaits loadQuestionData() before its
   applySourceFilter() call, so setting assessment mode synchronously
   here guarantees the guard re-routes that call and a shared-results
   view is never clobbered by the quiz render. */
document.addEventListener("DOMContentLoaded", () => {
  ["openAssessments", "m-openAssessments"].forEach((id) => {
    document.getElementById(id)?.addEventListener("click", () => {
      if (typeof setMobileMenuOpen === "function") setMobileMenuOpen(false);
      toggleAssessmentsFromToolbar();
    });
  });

  let ar = null;
  try { ar = new URLSearchParams(location.search).get("ar"); } catch {}
  if (!ar) return;
  const decoded = decodeShare(ar);
  if (!decoded) {
    showToast(assessT("invalidShare"));
    return;
  }
  logActivity("assessment", { event: "shared-view", test: decoded.testId });
  ASSESS_VIEW = { mode: "shared", testId: decoded.testId, index: 0, shared: decoded };
  document.body.classList.add("assessment-on");
  syncAssessButtons(true);
  renderAssessmentView();
});
