/* ═══════════════════════════════════════════════════════════════
   ASSESSMENTS · CHARTS — pure SVG-string builders, zero deps.
   All colors go through CSS variables so every theme (light /
   dark / gay) renders correctly. Output is trusted generated
   markup; any embedded text is escaped via escapeHTML (05-tools).
   ═══════════════════════════════════════════════════════════════ */

/* Bell curve (IQ): normal distribution 55–145, shaded likely-range
   band, marker line at the point estimate. */
function buildBellCurveSvg(opts) {
  const iqPoint = opts.iqPoint;
  const [bandLo, bandHi] = opts.band;
  const youLabel = escapeHTML(opts.youLabel || "You");

  const W = 640, H = 300, X0 = 40, X1 = 600, BASE = 252, PEAK = 195;
  const px = (iq) => X0 + ((iq - 55) * (X1 - X0)) / 90;
  const py = (iq) => BASE - PEAK * Math.exp(-Math.pow((iq - 100) / 15, 2) / 2);

  let curve = `M ${px(55).toFixed(1)} ${py(55).toFixed(1)}`;
  for (let iq = 56; iq <= 145; iq++) curve += ` L ${px(iq).toFixed(1)} ${py(iq).toFixed(1)}`;

  let shade = `M ${px(bandLo).toFixed(1)} ${BASE}`;
  for (let iq = bandLo; iq <= bandHi; iq++) shade += ` L ${px(iq).toFixed(1)} ${py(iq).toFixed(1)}`;
  shade += ` L ${px(bandHi).toFixed(1)} ${BASE} Z`;

  const ticks = [55, 70, 85, 100, 115, 130, 145]
    .map((t) =>
      `<line x1="${px(t)}" y1="${BASE}" x2="${px(t)}" y2="${BASE + 7}" stroke="var(--border)" stroke-width="2"/>` +
      `<text x="${px(t)}" y="${BASE + 26}" text-anchor="middle" font-size="14" fill="var(--text)" opacity="0.75">${t}</text>`
    )
    .join("");

  const mx = px(iqPoint);
  const my = py(iqPoint);
  const labelY = Math.max(24, my - 16);

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" preserveAspectRatio="xMidYMid meet">
    <line x1="${X0 - 6}" y1="${BASE}" x2="${X1 + 6}" y2="${BASE}" stroke="var(--border)" stroke-width="2"/>
    ${ticks}
    <path d="${shade}" fill="var(--accent)" opacity="0.22" stroke="none"/>
    <path d="${curve}" fill="none" stroke="var(--accent)" stroke-width="3"/>
    <line x1="${mx}" y1="${BASE}" x2="${mx}" y2="${my}" stroke="var(--text)" stroke-width="2" stroke-dasharray="5 4"/>
    <circle cx="${mx}" cy="${my}" r="5" fill="var(--text)"/>
    <text x="${Math.min(Math.max(mx, 70), W - 90)}" y="${labelY}" text-anchor="middle" font-size="16" font-weight="bold" fill="var(--text)">${youLabel} ≈ ${Number(iqPoint)}</text>
  </svg>`;
}

/* Radar / triangle (SD-3): three axes N (top), M (bottom-right),
   P (bottom-left), values 0–100.
   opts.rows = [{ label, value }] in N, M, P order. */
function buildRadarSvg(opts) {
  const rows = opts.rows;
  const CX = 170, CY = 165, R = 115;
  const ANGLES = [-90, 30, 150].map((a) => (a * Math.PI) / 180);
  const pt = (i, frac) => [
    CX + R * frac * Math.cos(ANGLES[i]),
    CY + R * frac * Math.sin(ANGLES[i]),
  ];
  const poly = (frac) =>
    [0, 1, 2].map((i) => pt(i, frac).map((v) => v.toFixed(1)).join(",")).join(" ");

  const grid = [0.25, 0.5, 0.75, 1]
    .map((f) => `<polygon points="${poly(f)}" fill="none" stroke="var(--border)" stroke-width="${f === 1 ? 2 : 1}"/>`)
    .join("");
  const axes = [0, 1, 2]
    .map((i) => {
      const [x, y] = pt(i, 1);
      return `<line x1="${CX}" y1="${CY}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="var(--border)" stroke-width="1"/>`;
    })
    .join("");

  const dataPoints = rows.map((r, i) => pt(i, Math.max(0.02, Math.min(1, r.value / 100))));
  const dataPoly = dataPoints.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ");
  const dots = dataPoints
    .map((p) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="4.5" fill="var(--accent)"/>`)
    .join("");

  const labelAttrs = [
    { x: CX, y: 26, anchor: "middle" },
    { x: 336, y: 250, anchor: "end" },
    { x: 4, y: 250, anchor: "start" },
  ];
  const labels = rows
    .map((r, i) => {
      const a = labelAttrs[i];
      return `<text x="${a.x}" y="${a.y}" text-anchor="${a.anchor}" font-size="14" fill="var(--text)">${escapeHTML(r.label)} · <tspan font-weight="bold">${Number(r.value)}</tspan></text>`;
    })
    .join("");

  return `<svg viewBox="0 0 340 320" xmlns="http://www.w3.org/2000/svg" role="img" preserveAspectRatio="xMidYMid meet">
    ${grid}${axes}
    <polygon points="${dataPoly}" fill="var(--accent)" fill-opacity="0.25" stroke="var(--accent)" stroke-width="2.5"/>
    ${dots}${labels}
  </svg>`;
}

/* Horizontal bars (IQ domains): rows = [{ label, pct, valueText }]. */
function buildDomainBarsSvg(rows) {
  const ROW_H = 56, W = 640;
  const H = rows.length * ROW_H + 6;
  const body = rows
    .map((r, i) => {
      const y = i * ROW_H;
      const w = Math.max(6, (492 * Math.max(0, Math.min(100, r.pct))) / 100);
      return (
        `<text x="8" y="${y + 22}" font-size="15" fill="var(--text)">${escapeHTML(r.label)}</text>` +
        `<rect x="8" y="${y + 32}" width="492" height="14" rx="7" fill="var(--border)" opacity="0.55"/>` +
        `<rect x="8" y="${y + 32}" width="${w.toFixed(1)}" height="14" rx="7" fill="var(--accent)"/>` +
        `<text x="632" y="${y + 44}" text-anchor="end" font-size="14" fill="var(--text)">${escapeHTML(r.valueText)}</text>`
      );
    })
    .join("");
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" preserveAspectRatio="xMidYMid meet">${body}</svg>`;
}

/* Band ladder (analytical): 0–25 scale segmented into the named
   bands, marker triangle at the user's raw score. */
function buildBandLadderSvg(opts) {
  const raw = opts.raw;
  const bands = opts.bands;
  const currentIndex = opts.currentIndex;
  const X0 = 20, UNIT = 24; // 25 units → 600px wide track

  const segs = bands
    .map((b, i) => {
      const x = X0 + b.min * UNIT;
      const w = (b.max - b.min + 1) * UNIT;
      const isCur = i === currentIndex;
      return `<rect x="${x}" y="40" width="${w}" height="40" fill="var(--accent)" opacity="${isCur ? "0.45" : i % 2 ? "0.26" : "0.13"}"${isCur ? ' stroke="var(--accent)" stroke-width="2.5"' : ""}/>`;
    })
    .join("");

  const bounds = [...bands.map((b) => b.min), 25];
  const ticks = bounds
    .map((v) => {
      const x = v === 25 ? X0 + 25 * UNIT : X0 + v * UNIT;
      return `<text x="${x}" y="100" text-anchor="middle" font-size="13" fill="var(--text)" opacity="0.75">${v}</text>`;
    })
    .join("");

  const cx = X0 + (raw + 0.5) * UNIT;
  const marker =
    `<polygon points="${cx - 9},24 ${cx + 9},24 ${cx},38" fill="var(--text)"/>` +
    `<text x="${cx}" y="18" text-anchor="middle" font-size="15" font-weight="bold" fill="var(--text)">${Number(raw)}</text>`;

  return `<svg viewBox="0 0 640 112" xmlns="http://www.w3.org/2000/svg" role="img" preserveAspectRatio="xMidYMid meet">${segs}${ticks}${marker}</svg>`;
}
