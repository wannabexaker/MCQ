/* ═══════════════════════════════════════════════════════════════
   ASSESSMENTS · EXPORT — save a result as a designed PNG image or
   a real single-page PDF. Zero dependencies:
   · The card is composed as a self-contained SVG (current theme
     colors resolved to literal values, system font stack), reusing
     the existing chart builders (16-assess-charts.js).
   · PNG: SVG → <img> → <canvas> → toBlob.
   · PDF: canvas → JPEG bytes → hand-built minimal PDF (one page,
     one DCTDecode image XObject). Pure ASCII PDF syntax, so no
     TextEncoder needed and the builder stays unit-testable.
   Downloads go through triggerDownload() (05-tools), which uses
   the OS share sheet on mobile.
   ═══════════════════════════════════════════════════════════════ */

const ASSESS_CARD_W = 1200;
const ASSESS_EXPORT_FONT =
  "'Segoe UI', system-ui, -apple-system, Roboto, 'Helvetica Neue', Arial, sans-serif";

/* ── Theme + text helpers ───────────────────────────────────────── */
function assessThemeColors() {
  const cs = getComputedStyle(document.body);
  const read = (name, fallback) => (cs.getPropertyValue(name) || "").trim() || fallback;
  return {
    bg: read("--bg", "#0d1117"),
    cardBg: read("--card-bg", "#161b22"),
    text: read("--text", "#e6edf3"),
    border: read("--border", "#30363d"),
    accent: read("--accent", "#2ea043"),
  };
}

// Charts emit var(--…) colors; resolve them so the SVG is self-contained.
function assessResolveThemeVars(svg, colors) {
  return svg
    .split("var(--bg)").join(colors.bg)
    .split("var(--card-bg)").join(colors.cardBg)
    .split("var(--text)").join(colors.text)
    .split("var(--border)").join(colors.border)
    .split("var(--accent)").join(colors.accent)
    .split("currentColor").join(colors.text);
}

// Naive word-wrap for SVG <text> (no native wrapping in SVG).
function assessWrapText(str, maxChars) {
  const words = String(str || "").split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    if (line && (line + " " + w).length > maxChars) {
      lines.push(line);
      line = w;
    } else {
      line = line ? line + " " + w : w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function assessCardText(x, y, size, fill, opts, content) {
  const o = opts || {};
  const lines = Array.isArray(content) ? content : [content];
  const attrs =
    `x="${x}" y="${y}" font-family="${ASSESS_EXPORT_FONT}" font-size="${size}" fill="${fill}"` +
    (o.weight ? ` font-weight="${o.weight}"` : "") +
    (o.anchor ? ` text-anchor="${o.anchor}"` : "") +
    (o.spacing ? ` letter-spacing="${o.spacing}"` : "") +
    (o.opacity ? ` opacity="${o.opacity}"` : "");
  const lineH = o.lineH || Math.round(size * 1.45);
  const spans = lines
    .map((l, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : lineH}">${escapeHTML(l)}</tspan>`)
    .join("");
  return `<text ${attrs}>${spans}</text>`;
}

// Place a chart's <svg viewBox="…"> string at x/y with a given size.
function assessPlaceChart(chartSvg, x, y, w, h) {
  return chartSvg.replace("<svg ", `<svg x="${x}" y="${y}" width="${w}" height="${h}" `);
}

/* ── Card composition ───────────────────────────────────────────── */
function assessCardChrome(colors, height, testTitle, dateStr) {
  return (
    `<rect x="0" y="0" width="${ASSESS_CARD_W}" height="${height}" fill="${colors.bg}"/>` +
    `<rect x="24" y="24" width="${ASSESS_CARD_W - 48}" height="${height - 48}" rx="28" fill="${colors.cardBg}" stroke="${colors.border}" stroke-width="2"/>` +
    assessCardText(84, 108, 26, colors.text, { spacing: "6", opacity: "0.65", weight: "600" }, "MCQ TRAINER · ASSESSMENTS") +
    assessCardText(ASSESS_CARD_W - 84, 108, 24, colors.text, { anchor: "end", opacity: "0.55" }, dateStr) +
    `<line x1="84" y1="142" x2="${ASSESS_CARD_W - 84}" y2="142" stroke="${colors.accent}" stroke-width="4"/>` +
    assessCardText(84, 218, 46, colors.accent, { weight: "800" }, testTitle)
  );
}

function assessCardFooter(colors, height, attribution) {
  const yLine = height - 168;
  const disclaimer = assessWrapText(assessT("disclaimer"), 100);
  const parts = [
    `<line x1="84" y1="${yLine}" x2="${ASSESS_CARD_W - 84}" y2="${yLine}" stroke="${colors.border}" stroke-width="2"/>`,
    assessCardText(84, yLine + 40, 20, colors.text, { opacity: "0.7" }, disclaimer),
    // URL on its own bottom row so it can never collide with the disclaimer
    assessCardText(ASSESS_CARD_W - 84, height - 46, 20, colors.accent, { anchor: "end", weight: "600" }, "wannabexaker.github.io/mcq-trainer"),
  ];
  if (attribution) {
    parts.push(assessCardText(84, yLine + 40 + disclaimer.length * 29 + 8, 17, colors.text, { opacity: "0.45" }, assessWrapText(attribution, 90)));
  }
  return parts.join("");
}

function buildResultCardSvg(testId, result) {
  const colors = assessThemeColors();
  const lang = typeof currentLang === "string" && currentLang === "el" ? "el-GR" : "en-GB";
  const dateStr = new Date().toLocaleDateString(lang, { year: "numeric", month: "short", day: "numeric" });
  let height, body;

  if (testId === "iq") {
    height = 1560;
    const band = iqBandText(result.iqPoint);
    const domainRows = IQ_TEST_META.domains.map((d) => ({
      label: pickLang(IQ_DOMAIN_INFO[d], "label"),
      pct: result.domainPercentiles[d],
      valueText: `${result.domains[d]}/5 · ~${result.domainPercentiles[d]}%`,
    }));
    body =
      assessCardText(600, 372, 116, colors.accent, { anchor: "middle", weight: "800" }, `≈ ${result.iqPoint}`) +
      assessCardText(600, 428, 34, colors.text, { anchor: "middle" }, `${assessT("likelyRange")}: ${result.band[0]}–${result.band[1]}`) +
      assessCardText(600, 468, 26, colors.text, { anchor: "middle", opacity: "0.65" }, `${assessT("rawScore")}: ${result.raw}/20`) +
      assessPlaceChart(buildBellCurveSvg({ iqPoint: result.iqPoint, band: result.band, youLabel: assessT("you") }), 84, 500, 1032, 484) +
      assessCardText(84, 1046, 30, colors.text, { weight: "700" }, assessT("domainBreakdown")) +
      assessPlaceChart(buildDomainBarsSvg(domainRows), 84, 1068, 1032, 371) +
      assessCardText(600, 1330, 24, colors.text, { anchor: "middle", opacity: "0.8" }, assessWrapText(pickLang(band, "head"), 80));
    return { svg: assessFinishCard(colors, height, assessT("iqName"), dateStr, body, assessT("attributionIq")), width: ASSESS_CARD_W, height };
  }

  if (testId === "analytical") {
    height = 1290;
    const band = ANALYTICAL_BANDS[result.bandIndex];
    const nameLines = assessWrapText(pickLang(band, "name"), 30);
    const descLines = assessWrapText(pickLang(band, "desc"), 78);
    const meaningLines = assessWrapText(pickLang(band, "meaning"), 92).slice(0, 5);
    body =
      assessCardText(600, 336, 62, colors.accent, { anchor: "middle", weight: "800", lineH: 74 }, nameLines) +
      assessCardText(600, 336 + nameLines.length * 74 - 26, 28, colors.text, { anchor: "middle", opacity: "0.7" }, `${assessT("rawScore")}: ${result.raw}/25`) +
      assessPlaceChart(buildBandLadderSvg({ raw: result.raw, bands: ANALYTICAL_BANDS, currentIndex: result.bandIndex }), 84, 520, 1032, 180) +
      assessCardText(84, 780, 28, colors.text, { weight: "700", lineH: 40 }, descLines) +
      assessCardText(84, 780 + descLines.length * 40 + 16, 24, colors.text, { opacity: "0.75", lineH: 36 }, meaningLines);
    return { svg: assessFinishCard(colors, height, assessT("analyticalName"), dateStr, body, ""), width: ASSESS_CARD_W, height };
  }

  // sd3
  height = 1560;
  const archetype = SD3_ARCHETYPES[result.archetypeKey];
  const radarRows = SD3_TEST_META.traits.map((t) => ({
    label: pickLang(SD3_TRAIT_INFO[t], "short"),
    value: result.norm[t],
  }));
  const traitBars = SD3_TEST_META.traits.map((t) => ({
    label: pickLang(SD3_TRAIT_INFO[t], "label"),
    pct: result.norm[t],
    valueText: `${result.norm[t]}/100 · ${assessT(result.high[t] ? "high" : "low")}`,
  }));
  const descLines = assessWrapText(pickLang(archetype, "desc"), 88).slice(0, 3);
  body =
    assessCardText(600, 296, 26, colors.text, { anchor: "middle", spacing: "5", opacity: "0.65" }, assessT("archetypeLabel")) +
    assessCardText(600, 360, 64, colors.accent, { anchor: "middle", weight: "800" }, pickLang(archetype, "name")) +
    assessPlaceChart(buildRadarSvg({ rows: radarRows }), 335, 408, 530, 498) +
    assessPlaceChart(buildDomainBarsSvg(traitBars), 84, 960, 1032, 280) +
    assessCardText(84, 1300, 24, colors.text, { opacity: "0.85", lineH: 36 }, descLines);
  return { svg: assessFinishCard(colors, height, assessT("sd3Name"), dateStr, body, assessT("attributionSd3")), width: ASSESS_CARD_W, height };
}

function assessFinishCard(colors, height, title, dateStr, body, attribution) {
  const inner =
    assessCardChrome(colors, height, title, dateStr) +
    body +
    assessCardFooter(colors, height, attribution);
  // font-family on the root so the nested chart SVGs (which set none)
  // inherit it instead of falling back to the browser's serif default.
  return assessResolveThemeVars(
    `<svg viewBox="0 0 ${ASSESS_CARD_W} ${height}" width="${ASSESS_CARD_W}" height="${height}" font-family="${ASSESS_EXPORT_FONT}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`,
    colors
  );
}

/* ── Rasterization ──────────────────────────────────────────────── */
function assessSvgToCanvas(svg, width, height, scale) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas);
      } catch (e) {
        URL.revokeObjectURL(url);
        reject(e);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("SVG rasterization failed"));
    };
    img.src = url;
  });
}

// The result currently on screen (own results or a shared view).
function assessCurrentResult(testId) {
  if (ASSESS_VIEW.mode === "shared" && ASSESS_VIEW.shared?.testId === testId) {
    return ASSESS_VIEW.shared.result;
  }
  const test = ASSESS_TESTS[testId];
  const stored = getAssessResult(testId);
  return test && stored ? test.fromStored(stored) : null;
}

function assessBuildImageBlob(testId) {
  const result = assessCurrentResult(testId);
  if (!result) return Promise.reject(new Error("no result"));
  const card = buildResultCardSvg(testId, result);
  return assessSvgToCanvas(card.svg, card.width, card.height, 2).then(
    (canvas) =>
      new Promise((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png");
      })
  );
}

function assessBuildPdfBlob(testId) {
  const result = assessCurrentResult(testId);
  if (!result) return Promise.reject(new Error("no result"));
  const card = buildResultCardSvg(testId, result);
  return assessSvgToCanvas(card.svg, card.width, card.height, 2)
    .then(
      (canvas) =>
        new Promise((resolve, reject) => {
          canvas.toBlob(
            (b) => (b ? resolve({ b, w: canvas.width, h: canvas.height }) : reject(new Error("toBlob failed"))),
            "image/jpeg",
            0.92
          );
        })
    )
    .then(({ b, w, h }) =>
      b.arrayBuffer().then((buf) => {
        const pdfBytes = buildMinimalPdf(new Uint8Array(buf), w, h);
        return new Blob([pdfBytes], { type: "application/pdf" });
      })
    );
}

/* ── Minimal single-page PDF builder (pure, ASCII-only syntax) ──── */
function _pdfAscii(str) {
  const out = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) out[i] = str.charCodeAt(i) & 0xff;
  return out;
}

function buildMinimalPdf(jpegBytes, imgW, imgH) {
  // Page size in points: fit to a document-like width.
  const pageW = 595;
  const pageH = Math.round((imgH / imgW) * pageW);

  const contentStream = `q\n${pageW} 0 0 ${pageH} 0 0 cm\n/Im0 Do\nQ\n`;
  const objects = [
    "<</Type /Catalog /Pages 2 0 R>>",
    "<</Type /Pages /Kids [3 0 R] /Count 1>>",
    `<</Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources <</XObject <</Im0 4 0 R>> /ProcSet [/PDF /ImageC]>> /Contents 5 0 R>>`,
  ];

  const parts = [];
  const offsets = [];
  let position = 0;
  const push = (bytes) => {
    parts.push(bytes);
    position += bytes.length;
  };

  push(_pdfAscii("%PDF-1.4\n"));
  objects.forEach((dict, i) => {
    offsets[i + 1] = position;
    push(_pdfAscii(`${i + 1} 0 obj\n${dict}\nendobj\n`));
  });

  offsets[4] = position;
  push(_pdfAscii(`4 0 obj\n<</Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length}>>\nstream\n`));
  push(jpegBytes);
  push(_pdfAscii("\nendstream\nendobj\n"));

  offsets[5] = position;
  push(_pdfAscii(`5 0 obj\n<</Length ${contentStream.length}>>\nstream\n${contentStream}endstream\nendobj\n`));

  const xrefOffset = position;
  let xref = "xref\n0 6\n0000000000 65535 f \n";
  for (let i = 1; i <= 5; i++) {
    xref += String(offsets[i]).padStart(10, "0") + " 00000 n \n";
  }
  push(_pdfAscii(xref + `trailer\n<</Size 6 /Root 1 0 R>>\nstartxref\n${xrefOffset}\n%%EOF`));

  const total = new Uint8Array(position);
  let at = 0;
  for (const p of parts) {
    total.set(p, at);
    at += p.length;
  }
  return total;
}

/* ── Download entry points (wired from 17-assess-results.js) ────── */
function _assessExportFilename(testId, ext) {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `mcq-${testId}-result-${stamp}.${ext}`;
}

function assessExportImage(testId) {
  assessBuildImageBlob(testId)
    .then((blob) => triggerDownload(_assessExportFilename(testId, "png"), blob))
    .catch(() => showToast(assessT("exportFail")));
}

function assessExportPdf(testId) {
  assessBuildPdfBlob(testId)
    .then((blob) => triggerDownload(_assessExportFilename(testId, "pdf"), blob))
    .catch(() => showToast(assessT("exportFail")));
}
