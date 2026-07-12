/* ═══════════════════════════════════════════════════════════════
   ASSESSMENTS · RESULTS RENDERERS — one rich, explanatory results
   screen per test. The differentiator vs the plain quiz: every
   screen explains WHAT the numbers mean, per-domain/trait, plus
   an honest limitations box. innerHTML receives only trusted
   templates; all data text passes through escapeHTML/pickLang.
   ═══════════════════════════════════════════════════════════════ */

/* Shared skeleton pieces */
function assessChipHtml(flag) {
  return `<span class="assess-chip assess-chip-${flag}">${escapeHTML(assessT(flag))}</span>`;
}

function assessActionsHtml(opts) {
  if (opts.shared) {
    return `<div class="assess-actions">
      <button type="button" data-assess-action="take">🎯 ${escapeHTML(assessT("takeThisTest"))}</button>
      <button type="button" data-assess-action="hub">${escapeHTML(assessT("exploreAssessments"))}</button>
    </div>`;
  }
  return `<div class="assess-actions">
    <button type="button" data-assess-action="retake">🔁 ${escapeHTML(assessT("retake"))}</button>
    <button type="button" data-assess-action="share">🔗 ${escapeHTML(assessT("share"))}</button>
    <button type="button" data-assess-action="hub">← ${escapeHTML(assessT("backToHub"))}</button>
  </div>`;
}

function assessLimitationsHtml(text) {
  return `<div class="assess-limitations">
    <div class="assess-limitations-title">⚖️ ${escapeHTML(assessT("limitationsTitle"))}</div>
    <p>${escapeHTML(text)}</p>
  </div>`;
}

function assessFooterHtml(attributionText) {
  const attr = attributionText
    ? `<p class="assess-attribution">${escapeHTML(attributionText)}</p>`
    : "";
  return `<div class="assess-footer">
    <p class="assess-disclaimer">${escapeHTML(assessT("disclaimer"))}</p>
    ${attr}
  </div>`;
}

function wireResultActions(container, testId, opts) {
  container.querySelectorAll("[data-assess-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.getAttribute("data-assess-action");
      if (action === "retake") assessRetake(testId);
      else if (action === "share") assessShare(testId, btn);
      else if (action === "hub") assessGoHub();
      else if (action === "take") assessTakeSharedTest(testId);
    });
  });
}

function assessSharedNoteHtml(opts) {
  if (!opts.shared) return "";
  return `<p class="assess-shared-note">🔗 ${escapeHTML(assessT("sharedNote"))}</p>`;
}

/* ── IQ results ────────────────────────────────────────────────── */
function renderIqResults(host, result, opts) {
  const section = document.createElement("section");
  section.className = "card assess-card assess-results";

  const band = iqBandText(result.iqPoint);
  const domainRows = IQ_TEST_META.domains.map((d) => ({
    label: pickLang(IQ_DOMAIN_INFO[d], "label"),
    pct: result.domainPercentiles[d],
    valueText: `${result.domains[d]}/5 · ~${result.domainPercentiles[d]}%`,
  }));

  const breakdown = IQ_TEST_META.domains
    .map((d) => {
      const info = IQ_DOMAIN_INFO[d];
      const flag = result.domainFlags[d];
      const text = pickLang(info, flag === "strong" ? "strong" : flag === "weak" ? "weak" : "mid");
      return `<div class="assess-block">
        <div class="assess-block-head">
          <span class="assess-block-label">${escapeHTML(pickLang(info, "label"))}</span>
          ${assessChipHtml(flag)}
        </div>
        <p class="assess-block-desc">${escapeHTML(pickLang(info, "desc"))}</p>
        <p>${escapeHTML(text)}</p>
      </div>`;
    })
    .join("");

  section.innerHTML = `
    <h2 class="assess-title">🧠 ${escapeHTML(assessT("iqName"))}</h2>
    ${assessSharedNoteHtml(opts)}
    <div class="assess-hero">
      <div class="assess-hero-main">≈ ${result.iqPoint}</div>
      <div class="assess-hero-sub">${escapeHTML(assessT("likelyRange"))}: <strong>${result.band[0]}–${result.band[1]}</strong></div>
      <div class="assess-hero-raw">${escapeHTML(assessT("rawScore"))}: ${result.raw}/20</div>
    </div>
    <div class="assess-chart">${buildBellCurveSvg({ iqPoint: result.iqPoint, band: result.band, youLabel: assessT("you") })}</div>
    <h3 class="assess-section-title">${escapeHTML(assessT("whatItMeans"))}</h3>
    <p class="assess-band-head"><strong>${escapeHTML(pickLang(band, "head"))}</strong></p>
    <p>${escapeHTML(pickLang(band, "body"))}</p>
    <h3 class="assess-section-title">${escapeHTML(assessT("domainBreakdown"))}</h3>
    <div class="assess-chart">${buildDomainBarsSvg(domainRows)}</div>
    <p class="assess-caption">${escapeHTML(assessT("domainCaption"))}</p>
    ${breakdown}
    ${assessLimitationsHtml(pickLang(IQ_RESULT_TEXTS, "limitations"))}
    ${assessActionsHtml(opts)}
    ${assessFooterHtml(assessT("attributionIq"))}
  `;
  host.appendChild(section);
  wireResultActions(section, "iq", opts);
}

/* ── Analytical results ────────────────────────────────────────── */
function renderAnalyticalResults(host, result, opts) {
  const section = document.createElement("section");
  section.className = "card assess-card assess-results";

  const band = ANALYTICAL_BANDS[result.bandIndex];
  const bandList = ANALYTICAL_BANDS
    .map((b, i) => {
      const cur = i === result.bandIndex;
      return `<li class="${cur ? "assess-band-current" : ""}">
        <span class="assess-band-range">${b.min}–${b.max}</span>
        <span class="assess-band-name">${escapeHTML(pickLang(b, "name"))}</span>${cur ? " ◀" : ""}
      </li>`;
    })
    .join("");

  let areasHtml = "";
  if (result.areas) {
    areasHtml =
      `<h3 class="assess-section-title">${escapeHTML(assessT("areaBreakdown"))}</h3>` +
      ANALYTICAL_TEST_META.areas
        .map((a) => {
          const info = ANALYTICAL_AREA_INFO[a];
          const count = result.areas[a];
          const flag = analyticalAreaFlag(count);
          return `<div class="assess-block">
            <div class="assess-block-head">
              <span class="assess-block-label">${escapeHTML(pickLang(info, "label"))}</span>
              <span class="assess-block-score">${count}/5</span>
              ${assessChipHtml(flag)}
            </div>
            <p>${escapeHTML(pickLang(info, flag))}</p>
          </div>`;
        })
        .join("");
  } else if (opts.shared) {
    areasHtml = `<p class="assess-caption">${escapeHTML(assessT("sharedPartialNote"))}</p>`;
  }

  section.innerHTML = `
    <h2 class="assess-title">🧩 ${escapeHTML(assessT("analyticalName"))}</h2>
    ${assessSharedNoteHtml(opts)}
    <div class="assess-hero">
      <div class="assess-hero-main">${escapeHTML(pickLang(band, "name"))}</div>
      <div class="assess-hero-raw">${escapeHTML(assessT("rawScore"))}: ${result.raw}/25</div>
    </div>
    <div class="assess-chart">${buildBandLadderSvg({ raw: result.raw, bands: ANALYTICAL_BANDS, currentIndex: result.bandIndex })}</div>
    <ul class="assess-band-list">${bandList}</ul>
    <h3 class="assess-section-title">${escapeHTML(assessT("whatItMeans"))}</h3>
    <p class="assess-band-head"><strong>${escapeHTML(pickLang(band, "desc"))}</strong></p>
    <p>${escapeHTML(pickLang(band, "meaning"))}</p>
    ${areasHtml}
    ${assessLimitationsHtml(assessT("anLimitations"))}
    ${assessActionsHtml(opts)}
    ${assessFooterHtml("")}
  `;
  host.appendChild(section);
  wireResultActions(section, "analytical", opts);
}

/* ── Dark Triad (SD-3) results ─────────────────────────────────── */
function renderSd3Results(host, result, opts) {
  const section = document.createElement("section");
  section.className = "card assess-card assess-results";

  const archetype = SD3_ARCHETYPES[result.archetypeKey];
  const radarRows = SD3_TEST_META.traits.map((t) => ({
    label: pickLang(SD3_TRAIT_INFO[t], "label"),
    value: result.norm[t],
  }));
  const traitBars = SD3_TEST_META.traits.map((t) => ({
    label: pickLang(SD3_TRAIT_INFO[t], "label"),
    pct: result.norm[t],
    valueText: `${result.norm[t]}/100 · ${assessT(result.high[t] ? "high" : "low")}`,
  }));

  const traitBlocks = SD3_TEST_META.traits
    .map((t) => {
      const info = SD3_TRAIT_INFO[t];
      const isHigh = result.high[t];
      return `<div class="assess-block">
        <div class="assess-block-head">
          <span class="assess-block-label">${escapeHTML(pickLang(info, "label"))}</span>
          <span class="assess-block-score">${result.norm[t]}/100</span>
          ${assessChipHtml(isHigh ? "high" : "low")}
        </div>
        <p class="assess-block-desc">${escapeHTML(pickLang(info, "desc"))}</p>
        <p>${escapeHTML(pickLang(info, isHigh ? "high" : "low"))}</p>
      </div>`;
    })
    .join("");

  section.innerHTML = `
    <h2 class="assess-title">🎭 ${escapeHTML(assessT("sd3Name"))}</h2>
    ${assessSharedNoteHtml(opts)}
    <div class="assess-hero">
      <div class="assess-hero-label">${escapeHTML(assessT("archetypeLabel"))}</div>
      <div class="assess-hero-main">${escapeHTML(pickLang(archetype, "name"))}</div>
    </div>
    <div class="assess-chart assess-chart-radar">${buildRadarSvg({ rows: radarRows })}</div>
    <div class="assess-archetype">
      <p class="assess-band-head"><strong>${escapeHTML(pickLang(archetype, "desc"))}</strong></p>
      <p><span class="assess-inline-label">🧠 ${escapeHTML(assessT("cognitionNote"))}:</span> ${escapeHTML(pickLang(archetype, "cognition"))}</p>
      <p><span class="assess-inline-label">🎬 ${escapeHTML(assessT("famousExamples"))}:</span> ${escapeHTML(pickLang(archetype, "examples"))}</p>
    </div>
    <h3 class="assess-section-title">${escapeHTML(assessT("traitBreakdown"))}</h3>
    <div class="assess-chart">${buildDomainBarsSvg(traitBars)}</div>
    ${traitBlocks}
    ${assessLimitationsHtml(pickLang(SD3_RESULT_NOTES, "framing"))}
    ${assessActionsHtml(opts)}
    ${assessFooterHtml(assessT("attributionSd3"))}
  `;
  host.appendChild(section);
  wireResultActions(section, "sd3", opts);
}
