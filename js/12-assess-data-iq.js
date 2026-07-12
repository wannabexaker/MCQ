/* ═══════════════════════════════════════════════════════════════
   ASSESSMENTS · IQ TEST DATA — 20 original ICAR-style items,
   4 domains × 5 difficulties. Trusted static content: the SVG
   strings below are the ONLY markup the assessment renderer ever
   passes to innerHTML; they are authored here, never imported.
   SVG rules: root <svg> with viewBox; colors only via
   currentColor / var(--text) / var(--accent) / var(--border) /
   none; no <script>, no on* handlers, no href.
   Item formats are inspired by the ICAR public-domain item TYPES
   (matrix, verbal, numerical, spatial); no ICAR item is copied.
   ═══════════════════════════════════════════════════════════════ */

const IQ_TEST_META = {
  id: "iq",
  version: 1,
  domains: ["matrix", "verbal", "numerical", "spatial"],
};

// ── Shared SVG fragments (trusted, static) ──────────────────────
const IQ_SVG_GRID =
  '<rect x="2" y="2" width="296" height="296" fill="none" stroke="var(--border)" stroke-width="2"/>' +
  '<line x1="101" y1="2" x2="101" y2="298" stroke="var(--border)" stroke-width="2"/>' +
  '<line x1="199" y1="2" x2="199" y2="298" stroke="var(--border)" stroke-width="2"/>' +
  '<line x1="2" y1="101" x2="298" y2="101" stroke="var(--border)" stroke-width="2"/>' +
  '<line x1="2" y1="199" x2="298" y2="199" stroke="var(--border)" stroke-width="2"/>';
const IQ_SVG_QMARK =
  '<text x="250" y="266" text-anchor="middle" font-size="44" fill="var(--text)" opacity="0.65">?</text>';

// Up-pointing arrow centered at (cx,cy); other directions via rotate().
function iqArrow(cx, cy, angle) {
  const p = `${cx},${cy - 26} ${cx + 15},${cy - 6} ${cx + 6},${cy - 6} ${cx + 6},${cy + 24} ${cx - 6},${cy + 24} ${cx - 6},${cy - 6} ${cx - 15},${cy - 6}`;
  const rot = angle ? ` transform="rotate(${angle} ${cx} ${cy})"` : "";
  return `<polygon points="${p}" fill="var(--text)"${rot}/>`;
}

// Dice-style dot layouts (1..6 dots) centered at (cx,cy).
function iqDots(cx, cy, count) {
  const r = 7;
  const layouts = {
    1: [[0, 0]],
    2: [[-15, -15], [15, 15]],
    3: [[-18, -18], [0, 0], [18, 18]],
    4: [[-16, -16], [16, -16], [-16, 16], [16, 16]],
    5: [[-16, -16], [16, -16], [0, 0], [-16, 16], [16, 16]],
    6: [[-16, -18], [16, -18], [-16, 0], [16, 0], [-16, 18], [16, 18]],
  };
  return (layouts[count] || [])
    .map(([dx, dy]) => `<circle cx="${cx + dx}" cy="${cy + dy}" r="${r}" fill="var(--text)"/>`)
    .join("");
}

// Edge-segment cell (XOR item): subset of {top,bottom,left,right} around (cx,cy).
function iqEdges(cx, cy, half, segs) {
  const sw = 'stroke="var(--text)" stroke-width="4" stroke-linecap="round"';
  const L = [];
  if (segs.includes("top"))    L.push(`<line x1="${cx - half}" y1="${cy - half}" x2="${cx + half}" y2="${cy - half}" ${sw}/>`);
  if (segs.includes("bottom")) L.push(`<line x1="${cx - half}" y1="${cy + half}" x2="${cx + half}" y2="${cy + half}" ${sw}/>`);
  if (segs.includes("left"))   L.push(`<line x1="${cx - half}" y1="${cy - half}" x2="${cx - half}" y2="${cy + half}" ${sw}/>`);
  if (segs.includes("right"))  L.push(`<line x1="${cx + half}" y1="${cy - half}" x2="${cx + half}" y2="${cy + half}" ${sw}/>`);
  return L.join("");
}

// Shape with fill style for the Graeco-Latin item.
// kind: circle|square|diamond · style: outline|filled|striped
function iqShape(cx, cy, kind, style, scale) {
  const s = scale || 1;
  const stroke = 'stroke="var(--text)" stroke-width="3"';
  const fill = style === "filled" ? 'fill="var(--text)"' : 'fill="none"';
  let body = "";
  if (kind === "circle") body = `<circle cx="${cx}" cy="${cy}" r="${26 * s}" ${fill} ${stroke}/>`;
  if (kind === "square") body = `<rect x="${cx - 24 * s}" y="${cy - 24 * s}" width="${48 * s}" height="${48 * s}" ${fill} ${stroke}/>`;
  if (kind === "diamond") body = `<polygon points="${cx},${cy - 30 * s} ${cx + 30 * s},${cy} ${cx},${cy + 30 * s} ${cx - 30 * s},${cy}" ${fill} ${stroke}/>`;
  if (style === "striped") {
    const d = 14 * s;
    body += `<path d="M ${cx - d} ${cy + d} L ${cx + d} ${cy - d} M ${cx - d * 1.5} ${cy} L ${cx} ${cy - d * 1.5} M ${cx} ${cy + d * 1.5} L ${cx + d * 1.5} ${cy}" stroke="var(--text)" stroke-width="2.5" fill="none"/>`;
  }
  return body;
}

function iqSvg(viewBox, inner) {
  return `<svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">${inner}</svg>`;
}
const iqCell = (inner) => iqSvg("0 0 96 96", inner);

// ── The 20 items, ordered by difficulty block (1→5), domain order
//    matrix → verbal → numerical → spatial inside each block. ────
const IQ_ITEMS = [
  // ════ Difficulty 1 ════
  {
    id: "iq-mx-1", domain: "matrix", difficulty: 1,
    prompt_en: "Which option completes the pattern?",
    prompt_el: "Ποια επιλογή συμπληρώνει το μοτίβο;",
    stimulusSvg: iqSvg("0 0 300 300",
      IQ_SVG_GRID +
      // row 1: circles growing left→right
      '<circle cx="50" cy="50" r="12" fill="none" stroke="var(--text)" stroke-width="3"/>' +
      '<circle cx="150" cy="50" r="20" fill="none" stroke="var(--text)" stroke-width="3"/>' +
      '<circle cx="250" cy="50" r="28" fill="none" stroke="var(--text)" stroke-width="3"/>' +
      // row 2: squares growing
      '<rect x="38" y="138" width="24" height="24" fill="none" stroke="var(--text)" stroke-width="3"/>' +
      '<rect x="130" y="130" width="40" height="40" fill="none" stroke="var(--text)" stroke-width="3"/>' +
      '<rect x="222" y="122" width="56" height="56" fill="none" stroke="var(--text)" stroke-width="3"/>' +
      // row 3: triangles growing — last cell missing
      '<polygon points="50,238 62,262 38,262" fill="none" stroke="var(--text)" stroke-width="3"/>' +
      '<polygon points="150,230 170,270 130,270" fill="none" stroke="var(--text)" stroke-width="3"/>' +
      IQ_SVG_QMARK),
    choiceSvgs: [
      iqCell('<polygon points="48,28 68,68 28,68" fill="none" stroke="var(--text)" stroke-width="3"/>'),
      iqCell('<polygon points="48,18 84,78 12,78" fill="none" stroke="var(--text)" stroke-width="3"/>'),
      iqCell('<rect x="20" y="20" width="56" height="56" fill="none" stroke="var(--text)" stroke-width="3"/>'),
      iqCell('<circle cx="48" cy="48" r="30" fill="none" stroke="var(--text)" stroke-width="3"/>'),
    ],
    choices_en: null, choices_el: null,
    correctIndex: 1, // large triangle: rows fix the shape, columns grow the size
  },
  {
    id: "iq-vr-1", domain: "verbal", difficulty: 1,
    prompt_en: "OAK is to TREE as ROSE is to …",
    prompt_el: "Η ΒΕΛΑΝΙΔΙΑ είναι για το ΔΕΝΤΡΟ ό,τι το ΤΡΙΑΝΤΑΦΥΛΛΟ για …",
    stimulusSvg: null, choiceSvgs: null,
    choices_en: ["Garden", "Flower", "Thorn", "Red"],
    choices_el: ["Κήπος", "Λουλούδι", "Αγκάθι", "Κόκκινο"],
    correctIndex: 1,
  },
  {
    id: "iq-nm-1", domain: "numerical", difficulty: 1,
    prompt_en: "What number comes next? 2, 4, 6, 8, …",
    prompt_el: "Ποιος αριθμός ακολουθεί; 2, 4, 6, 8, …",
    stimulusSvg: null, choiceSvgs: null,
    choices_en: ["9", "10", "12", "16"],
    choices_el: ["9", "10", "12", "16"],
    correctIndex: 1,
  },
  {
    id: "iq-sp-1", domain: "spatial", difficulty: 1,
    prompt_en: "Which option shows the same figure, only rotated (not mirrored)?",
    prompt_el: "Ποια επιλογή δείχνει το ίδιο σχήμα, απλώς περιστραμμένο (όχι καθρεφτισμένο);",
    stimulusSvg: iqSvg("0 0 120 120",
      '<polygon points="36,22 56,22 56,62 78,62 78,84 36,84" fill="none" stroke="var(--text)" stroke-width="3.5"/>'),
    choiceSvgs: [
      // mirrored (flip about the vertical axis)
      iqCell('<polygon points="60,16 40,16 40,48 22,48 22,66 60,66" fill="none" stroke="var(--text)" stroke-width="3"/>'),
      // rotated 90° clockwise — correct
      iqCell('<polygon points="16,58 16,42 48,42 48,26 66,26 66,58" fill="none" stroke="var(--text)" stroke-width="3"/>'),
      // different figure (T-shape)
      iqCell('<polygon points="20,26 76,26 76,44 58,44 58,74 38,74 38,44 20,44" fill="none" stroke="var(--text)" stroke-width="3"/>'),
      // mirrored and rotated
      iqCell('<polygon points="16,26 16,42 48,42 48,58 66,58 66,26" fill="none" stroke="var(--text)" stroke-width="3"/>'),
    ],
    choices_en: null, choices_el: null,
    correctIndex: 1,
  },

  // ════ Difficulty 2 ════
  {
    id: "iq-mx-2", domain: "matrix", difficulty: 2,
    prompt_en: "Which option completes the pattern?",
    prompt_el: "Ποια επιλογή συμπληρώνει το μοτίβο;",
    stimulusSvg: iqSvg("0 0 300 300",
      IQ_SVG_GRID +
      iqArrow(50, 50, 0) + iqArrow(150, 50, 90) + iqArrow(250, 50, 180) +
      iqArrow(50, 150, 90) + iqArrow(150, 150, 180) + iqArrow(250, 150, 270) +
      iqArrow(50, 250, 180) + iqArrow(150, 250, 270) +
      IQ_SVG_QMARK),
    choiceSvgs: [
      iqCell(iqArrow(48, 48, 90)),
      iqCell(iqArrow(48, 48, 180)),
      iqCell(iqArrow(48, 48, 0)),   // correct: 90° clockwise each step wraps to "up"
      iqCell(iqArrow(48, 48, 270)),
    ],
    choices_en: null, choices_el: null,
    correctIndex: 2,
  },
  {
    id: "iq-vr-2", domain: "verbal", difficulty: 2,
    prompt_en: "Which word does NOT belong with the others?",
    prompt_el: "Ποια λέξη ΔΕΝ ταιριάζει με τις υπόλοιπες;",
    stimulusSvg: null, choiceSvgs: null,
    choices_en: ["Apple", "Pear", "Carrot", "Cherry"],
    choices_el: ["Μήλο", "Αχλάδι", "Καρότο", "Κεράσι"],
    correctIndex: 2,
  },
  {
    id: "iq-nm-2", domain: "numerical", difficulty: 2,
    prompt_en: "What number comes next? 3, 6, 12, 24, …",
    prompt_el: "Ποιος αριθμός ακολουθεί; 3, 6, 12, 24, …",
    stimulusSvg: null, choiceSvgs: null,
    choices_en: ["36", "42", "48", "30"],
    choices_el: ["36", "42", "48", "30"],
    correctIndex: 2,
  },
  {
    id: "iq-sp-2", domain: "spatial", difficulty: 2,
    prompt_en: "The figure is rotated by 180°. Which option shows the result?",
    prompt_el: "Το σχήμα περιστρέφεται κατά 180°. Ποια επιλογή δείχνει το αποτέλεσμα;",
    stimulusSvg: iqSvg("0 0 120 120",
      '<rect x="56" y="24" width="8" height="72" fill="var(--text)"/>' +
      '<polygon points="64,24 100,38 64,52" fill="none" stroke="var(--text)" stroke-width="3"/>'),
    choiceSvgs: [
      // unchanged (flag top-right)
      iqCell('<rect x="45" y="18" width="6" height="60" fill="var(--text)"/><polygon points="51,18 81,30 51,42" fill="none" stroke="var(--text)" stroke-width="2.5"/>'),
      // mirrored about the vertical axis (flag top-left)
      iqCell('<rect x="45" y="18" width="6" height="60" fill="var(--text)"/><polygon points="45,18 15,30 45,42" fill="none" stroke="var(--text)" stroke-width="2.5"/>'),
      // rotated 180° — correct (flag bottom-left)
      iqCell('<rect x="45" y="18" width="6" height="60" fill="var(--text)"/><polygon points="45,78 15,66 45,54" fill="none" stroke="var(--text)" stroke-width="2.5"/>'),
      // mirrored about the horizontal axis (flag bottom-right)
      iqCell('<rect x="45" y="18" width="6" height="60" fill="var(--text)"/><polygon points="51,78 81,66 51,54" fill="none" stroke="var(--text)" stroke-width="2.5"/>'),
    ],
    choices_en: null, choices_el: null,
    correctIndex: 2,
  },

  // ════ Difficulty 3 ════
  {
    id: "iq-mx-3", domain: "matrix", difficulty: 3,
    prompt_en: "Which option completes the pattern?",
    prompt_el: "Ποια επιλογή συμπληρώνει το μοτίβο;",
    stimulusSvg: iqSvg("0 0 300 300",
      IQ_SVG_GRID +
      iqDots(50, 50, 1) + iqDots(150, 50, 2) + iqDots(250, 50, 3) +
      iqDots(50, 150, 2) + iqDots(150, 150, 3) + iqDots(250, 150, 4) +
      iqDots(50, 250, 3) + iqDots(150, 250, 4) +
      IQ_SVG_QMARK),
    choiceSvgs: [
      iqCell(iqDots(48, 48, 4)),
      iqCell(iqDots(48, 48, 6)),
      iqCell(iqDots(48, 48, 3)),
      iqCell(iqDots(48, 48, 5)), // correct: +1 dot per column step
    ],
    choices_en: null, choices_el: null,
    correctIndex: 3,
  },
  {
    id: "iq-vr-3", domain: "verbal", difficulty: 3,
    prompt_en: "AUTHOR is to NOVEL as COMPOSER is to …",
    prompt_el: "Ο ΣΥΓΓΡΑΦΕΑΣ είναι για το ΜΥΘΙΣΤΟΡΗΜΑ ό,τι ο ΣΥΝΘΕΤΗΣ για …",
    stimulusSvg: null, choiceSvgs: null,
    choices_en: ["Orchestra", "Piano", "Concert", "Symphony"],
    choices_el: ["Ορχήστρα", "Πιάνο", "Συναυλία", "Συμφωνία"],
    correctIndex: 3,
  },
  {
    id: "iq-nm-3", domain: "numerical", difficulty: 3,
    prompt_en: "What number comes next? 2, 3, 5, 8, 12, …",
    prompt_el: "Ποιος αριθμός ακολουθεί; 2, 3, 5, 8, 12, …",
    stimulusSvg: null, choiceSvgs: null,
    choices_en: ["17", "15", "16", "18"],
    choices_el: ["17", "15", "16", "18"],
    correctIndex: 0,
  },
  {
    id: "iq-sp-3", domain: "spatial", difficulty: 3,
    prompt_en: "A square sheet is folded along the dashed line (right half onto the left), then a hole is punched through all layers. Which option shows the unfolded sheet?",
    prompt_el: "Ένα τετράγωνο φύλλο διπλώνεται στη διακεκομμένη γραμμή (το δεξί μισό πάνω στο αριστερό) και ανοίγεται μια τρύπα σε όλα τα φύλλα. Ποια επιλογή δείχνει το φύλλο ξεδιπλωμένο;",
    stimulusSvg: iqSvg("0 0 260 120",
      // panel 1: flat sheet with fold line + direction arrow
      '<rect x="10" y="10" width="100" height="100" fill="none" stroke="var(--text)" stroke-width="2.5"/>' +
      '<line x1="60" y1="10" x2="60" y2="110" stroke="var(--text)" stroke-width="2" stroke-dasharray="6 5"/>' +
      '<path d="M 95 60 A 24 24 0 0 0 72 42" fill="none" stroke="var(--accent)" stroke-width="3"/>' +
      '<polygon points="66,46 80,40 76,54" fill="var(--accent)"/>' +
      // panel 2: folded sheet with punched hole
      '<rect x="150" y="10" width="50" height="100" fill="none" stroke="var(--text)" stroke-width="2.5"/>' +
      '<line x1="200" y1="10" x2="200" y2="110" stroke="var(--accent)" stroke-width="4"/>' +
      '<circle cx="175" cy="35" r="6" fill="var(--text)"/>'),
    choiceSvgs: [
      // correct: two holes mirrored about the vertical center line
      iqCell('<rect x="8" y="8" width="80" height="80" fill="none" stroke="var(--text)" stroke-width="2.5"/><line x1="48" y1="8" x2="48" y2="88" stroke="var(--border)" stroke-width="1.5" stroke-dasharray="4 4"/><circle cx="28" cy="28" r="5" fill="var(--text)"/><circle cx="68" cy="28" r="5" fill="var(--text)"/>'),
      // both holes on the left (no mirroring)
      iqCell('<rect x="8" y="8" width="80" height="80" fill="none" stroke="var(--text)" stroke-width="2.5"/><line x1="48" y1="8" x2="48" y2="88" stroke="var(--border)" stroke-width="1.5" stroke-dasharray="4 4"/><circle cx="28" cy="28" r="5" fill="var(--text)"/><circle cx="28" cy="68" r="5" fill="var(--text)"/>'),
      // single hole
      iqCell('<rect x="8" y="8" width="80" height="80" fill="none" stroke="var(--text)" stroke-width="2.5"/><line x1="48" y1="8" x2="48" y2="88" stroke="var(--border)" stroke-width="1.5" stroke-dasharray="4 4"/><circle cx="28" cy="28" r="5" fill="var(--text)"/>'),
      // mirrored about the horizontal axis instead
      iqCell('<rect x="8" y="8" width="80" height="80" fill="none" stroke="var(--text)" stroke-width="2.5"/><line x1="48" y1="8" x2="48" y2="88" stroke="var(--border)" stroke-width="1.5" stroke-dasharray="4 4"/><circle cx="68" cy="28" r="5" fill="var(--text)"/><circle cx="68" cy="68" r="5" fill="var(--text)"/>'),
    ],
    choices_en: null, choices_el: null,
    correctIndex: 0,
  },

  // ════ Difficulty 4 ════
  {
    id: "iq-mx-4", domain: "matrix", difficulty: 4,
    prompt_en: "Each row follows the same rule. Which option completes the pattern?",
    prompt_el: "Κάθε σειρά ακολουθεί τον ίδιο κανόνα. Ποια επιλογή συμπληρώνει το μοτίβο;",
    // Rule: 3rd cell keeps the segments that appear in EXACTLY ONE of the first two cells (XOR).
    stimulusSvg: iqSvg("0 0 300 300",
      IQ_SVG_GRID +
      iqEdges(50, 50, 28, ["top"]) + iqEdges(150, 50, 28, ["right"]) + iqEdges(250, 50, 28, ["top", "right"]) +
      iqEdges(50, 150, 28, ["top", "bottom"]) + iqEdges(150, 150, 28, ["bottom", "left"]) + iqEdges(250, 150, 28, ["top", "left"]) +
      iqEdges(50, 250, 28, ["top", "left"]) + iqEdges(150, 250, 28, ["left", "bottom"]) +
      IQ_SVG_QMARK),
    choiceSvgs: [
      iqCell(iqEdges(48, 48, 30, ["top", "left"])),
      iqCell(iqEdges(48, 48, 30, ["top", "bottom"])), // correct: XOR of {top,left} and {left,bottom}
      iqCell(iqEdges(48, 48, 30, ["left", "bottom"])),
      iqCell(iqEdges(48, 48, 30, ["left", "right"])),
    ],
    choices_en: null, choices_el: null,
    correctIndex: 1,
  },
  {
    id: "iq-vr-4", domain: "verbal", difficulty: 4,
    prompt_en: "Which word expresses the STRONGEST intensity?",
    prompt_el: "Ποια λέξη εκφράζει τη ΜΕΓΑΛΥΤΕΡΗ ένταση;",
    stimulusSvg: null, choiceSvgs: null,
    choices_en: ["Scalding", "Warm", "Hot", "Lukewarm"],
    choices_el: ["Ζεματιστός", "Ζεστός", "Καυτός", "Χλιαρός"],
    correctIndex: 0,
  },
  {
    id: "iq-nm-4", domain: "numerical", difficulty: 4,
    prompt_en: "If 3 machines make 3 parts in 3 minutes, how many minutes do 100 machines need to make 100 parts?",
    prompt_el: "Αν 3 μηχανές φτιάχνουν 3 εξαρτήματα σε 3 λεπτά, πόσα λεπτά χρειάζονται 100 μηχανές για να φτιάξουν 100 εξαρτήματα;",
    stimulusSvg: null, choiceSvgs: null,
    choices_en: ["100", "33", "1", "3"],
    choices_el: ["100", "33", "1", "3"],
    correctIndex: 3,
  },
  {
    id: "iq-sp-4", domain: "spatial", difficulty: 4,
    prompt_en: "Which piece completes the square exactly (same orientation, no rotation)?",
    prompt_el: "Ποιο κομμάτι συμπληρώνει ακριβώς το τετράγωνο (ίδιος προσανατολισμός, χωρίς περιστροφή);",
    stimulusSvg: iqSvg("0 0 120 120",
      '<path d="M 10 10 H 110 V 30 H 70 V 70 H 90 V 90 H 110 V 110 H 10 Z" fill="none" stroke="var(--text)" stroke-width="3"/>' +
      '<polygon points="110,30 70,30 70,70 90,70 90,90 110,90" fill="none" stroke="var(--border)" stroke-width="2" stroke-dasharray="5 4"/>'),
    choiceSvgs: [
      // mirrored staircase
      iqCell('<polygon points="28,18 68,18 68,58 48,58 48,78 28,78" fill="var(--accent)" fill-opacity="0.35" stroke="var(--text)" stroke-width="2.5"/>'),
      // plain rectangle
      iqCell('<polygon points="28,18 68,18 68,78 28,78" fill="var(--accent)" fill-opacity="0.35" stroke="var(--text)" stroke-width="2.5"/>'),
      // correct piece: matches the dashed notch
      iqCell('<polygon points="68,18 28,18 28,58 48,58 48,78 68,78" fill="var(--accent)" fill-opacity="0.35" stroke="var(--text)" stroke-width="2.5"/>'),
      // staircase with the step at the wrong height
      iqCell('<polygon points="68,18 28,18 28,38 48,38 48,58 68,58" fill="var(--accent)" fill-opacity="0.35" stroke="var(--text)" stroke-width="2.5"/>'),
    ],
    choices_en: null, choices_el: null,
    correctIndex: 2,
  },

  // ════ Difficulty 5 ════
  {
    id: "iq-mx-5", domain: "matrix", difficulty: 5,
    prompt_en: "Every row and every column contains each shape once and each fill style once. Which option completes the pattern?",
    prompt_el: "Κάθε σειρά και κάθε στήλη περιέχει κάθε σχήμα μία φορά και κάθε στυλ γεμίσματος μία φορά. Ποια επιλογή συμπληρώνει το μοτίβο;",
    stimulusSvg: iqSvg("0 0 300 300",
      IQ_SVG_GRID +
      iqShape(50, 50, "circle", "outline") + iqShape(150, 50, "square", "filled") + iqShape(250, 50, "diamond", "striped") +
      iqShape(50, 150, "square", "striped") + iqShape(150, 150, "diamond", "outline") + iqShape(250, 150, "circle", "filled") +
      iqShape(50, 250, "diamond", "filled") + iqShape(150, 250, "circle", "striped") +
      IQ_SVG_QMARK),
    choiceSvgs: [
      iqCell(iqShape(48, 48, "diamond", "outline", 0.9)),
      iqCell(iqShape(48, 48, "square", "filled", 0.9)),
      iqCell(iqShape(48, 48, "circle", "outline", 0.9)),
      iqCell(iqShape(48, 48, "square", "outline", 0.9)), // correct: square + outline are the missing pair
    ],
    choices_en: null, choices_el: null,
    correctIndex: 3,
  },
  {
    id: "iq-vr-5", domain: "verbal", difficulty: 5,
    prompt_en: "SCARCE is to ABUNDANT as FLEETING is to …",
    prompt_el: "Το ΣΠΑΝΙΟ είναι για το ΑΦΘΟΝΟ ό,τι το ΦΕΥΓΑΛΕΟ για …",
    stimulusSvg: null, choiceSvgs: null,
    choices_en: ["Brief", "Rapid", "Enduring", "Rare"],
    choices_el: ["Σύντομο", "Ταχύ", "Διαρκές", "Σπάνιο"],
    correctIndex: 2,
  },
  {
    id: "iq-nm-5", domain: "numerical", difficulty: 5,
    prompt_en: "What number comes next? 3, 5, 9, 17, 33, …",
    prompt_el: "Ποιος αριθμός ακολουθεί; 3, 5, 9, 17, 33, …",
    stimulusSvg: null, choiceSvgs: null,
    choices_en: ["65", "57", "49", "66"],
    choices_el: ["65", "57", "49", "66"],
    correctIndex: 0,
  },
  {
    id: "iq-sp-5", domain: "spatial", difficulty: 5,
    prompt_en: "The sheet is folded twice as shown (bottom up, then right onto left) and a hole is punched through all layers. Which option shows the unfolded sheet?",
    prompt_el: "Το φύλλο διπλώνεται δύο φορές όπως φαίνεται (το κάτω μισό προς τα πάνω, μετά το δεξί πάνω στο αριστερό) και ανοίγεται μια τρύπα σε όλα τα φύλλα. Ποια επιλογή δείχνει το φύλλο ξεδιπλωμένο;",
    stimulusSvg: iqSvg("0 0 340 120",
      // panel 1: full sheet, horizontal fold line, arrow up
      '<rect x="10" y="10" width="100" height="100" fill="none" stroke="var(--text)" stroke-width="2.5"/>' +
      '<line x1="10" y1="60" x2="110" y2="60" stroke="var(--text)" stroke-width="2" stroke-dasharray="6 5"/>' +
      '<path d="M 60 95 A 22 22 0 0 0 42 74" fill="none" stroke="var(--accent)" stroke-width="3"/>' +
      '<polygon points="38,80 50,70 50,84" fill="var(--accent)"/>' +
      // panel 2: half sheet, vertical fold line, arrow left
      '<rect x="140" y="10" width="100" height="50" fill="none" stroke="var(--text)" stroke-width="2.5"/>' +
      '<line x1="190" y1="10" x2="190" y2="60" stroke="var(--text)" stroke-width="2" stroke-dasharray="6 5"/>' +
      '<path d="M 226 40 A 18 18 0 0 0 208 22" fill="none" stroke="var(--accent)" stroke-width="3"/>' +
      '<polygon points="203,26 216,20 213,33" fill="var(--accent)"/>' +
      // panel 3: quarter sheet with punched hole
      '<rect x="270" y="10" width="50" height="50" fill="none" stroke="var(--text)" stroke-width="2.5"/>' +
      '<circle cx="285" cy="25" r="6" fill="var(--text)"/>'),
    choiceSvgs: [
      // two holes, top edge only (forgot the horizontal unfold)
      iqCell('<rect x="8" y="8" width="80" height="80" fill="none" stroke="var(--text)" stroke-width="2.5"/><circle cx="20" cy="20" r="5" fill="var(--text)"/><circle cx="76" cy="20" r="5" fill="var(--text)"/>'),
      // two holes on a diagonal
      iqCell('<rect x="8" y="8" width="80" height="80" fill="none" stroke="var(--text)" stroke-width="2.5"/><circle cx="20" cy="20" r="5" fill="var(--text)"/><circle cx="76" cy="76" r="5" fill="var(--text)"/>'),
      // four holes in a cross/diamond arrangement
      iqCell('<rect x="8" y="8" width="80" height="80" fill="none" stroke="var(--text)" stroke-width="2.5"/><circle cx="48" cy="20" r="5" fill="var(--text)"/><circle cx="20" cy="48" r="5" fill="var(--text)"/><circle cx="76" cy="48" r="5" fill="var(--text)"/><circle cx="48" cy="76" r="5" fill="var(--text)"/>'),
      // correct: four holes mirrored about both center lines (near the corners)
      iqCell('<rect x="8" y="8" width="80" height="80" fill="none" stroke="var(--text)" stroke-width="2.5"/><circle cx="20" cy="20" r="5" fill="var(--text)"/><circle cx="76" cy="20" r="5" fill="var(--text)"/><circle cx="20" cy="76" r="5" fill="var(--text)"/><circle cx="76" cy="76" r="5" fill="var(--text)"/>'),
    ],
    choices_en: null, choices_el: null,
    correctIndex: 3,
  },
];

// ── Domain descriptions + strengths/weaknesses texts ────────────
const IQ_DOMAIN_INFO = {
  matrix: {
    label_en: "Abstract reasoning",
    label_el: "Αφηρημένος συλλογισμός",
    desc_en: "Spotting rules and patterns in visual material — the classic matrix-completion skill.",
    desc_el: "Εντοπισμός κανόνων και μοτίβων σε οπτικό υλικό — η κλασική δεξιότητα συμπλήρωσης μήτρας.",
    strong_en: "This was one of your strongest areas: you extract underlying rules quickly, even when several rules apply at once. That skill transfers to debugging, mathematics and any novel problem with hidden structure.",
    strong_el: "Ήταν από τους δυνατότερους τομείς σου: εξάγεις γρήγορα τους κρυφούς κανόνες, ακόμα κι όταν ισχύουν πολλοί ταυτόχρονα. Η δεξιότητα αυτή μεταφέρεται στο debugging, στα μαθηματικά και σε κάθε νέο πρόβλημα με κρυμμένη δομή.",
    weak_en: "This was one of your weaker areas this time. Matrix items reward slowing down and testing one candidate rule at a time (shape? size? count? position?) — practicing that checklist measurably improves performance.",
    weak_el: "Ήταν από τους πιο αδύναμους τομείς σου αυτή τη φορά. Οι μήτρες επιβραβεύουν το να επιβραδύνεις και να ελέγχεις έναν υποψήφιο κανόνα τη φορά (σχήμα; μέγεθος; πλήθος; θέση;) — η εξάσκηση σε αυτό βελτιώνει μετρήσιμα την επίδοση.",
    mid_en: "Solid, balanced performance on pattern extraction — neither your standout strength nor a weak point.",
    mid_el: "Σταθερή, ισορροπημένη επίδοση στην εξαγωγή μοτίβων — ούτε το δυνατό σου χαρτί ούτε αδύναμο σημείο.",
  },
  verbal: {
    label_en: "Verbal reasoning",
    label_el: "Λεκτικός συλλογισμός",
    desc_en: "Working with word meanings and relationships: analogies, categories, degrees of meaning.",
    desc_el: "Δουλειά με σημασίες και σχέσεις λέξεων: αναλογίες, κατηγορίες, διαβαθμίσεις σημασίας.",
    strong_en: "This was one of your strongest areas: you map relationships between concepts precisely — a core skill for writing, argumentation, and learning new domains through reading.",
    strong_el: "Ήταν από τους δυνατότερους τομείς σου: αποτυπώνεις με ακρίβεια τις σχέσεις μεταξύ εννοιών — βασική δεξιότητα για γράψιμο, επιχειρηματολογία και εκμάθηση νέων πεδίων μέσω διαβάσματος.",
    weak_en: "This was one of your weaker areas this time. On analogy items, the trick is naming the relationship first ('X is a kind of Y', 'X is a stronger version of Y') before scanning the options.",
    weak_el: "Ήταν από τους πιο αδύναμους τομείς σου αυτή τη φορά. Στις αναλογίες, το κλειδί είναι να ονομάσεις πρώτα τη σχέση («το Χ είναι είδος του Υ», «το Χ είναι εντονότερη εκδοχή του Υ») πριν κοιτάξεις τις επιλογές.",
    mid_en: "Solid handling of word relationships — comfortably in the middle of your profile.",
    mid_el: "Σταθερός χειρισμός των σχέσεων λέξεων — άνετα στο μέσο του προφίλ σου.",
  },
  numerical: {
    label_en: "Numerical reasoning",
    label_el: "Αριθμητικός συλλογισμός",
    desc_en: "Finding structure in numbers: sequences, rates, and arithmetic word problems.",
    desc_el: "Εύρεση δομής στους αριθμούς: ακολουθίες, ρυθμοί και αριθμητικά προβλήματα.",
    strong_en: "This was one of your strongest areas: you see the generating rule behind number series and resist the 'intuitive but wrong' answer in trick word problems.",
    strong_el: "Ήταν από τους δυνατότερους τομείς σου: βλέπεις τον κανόνα πίσω από τις ακολουθίες και αντιστέκεσαι στη «διαισθητική αλλά λάθος» απάντηση στα προβλήματα-παγίδες.",
    weak_en: "This was one of your weaker areas this time. For sequences, write the differences between terms — most patterns (add, multiply, growing step) reveal themselves in one pass.",
    weak_el: "Ήταν από τους πιο αδύναμους τομείς σου αυτή τη φορά. Στις ακολουθίες, γράψε τις διαφορές μεταξύ των όρων — τα περισσότερα μοτίβα (πρόσθεση, πολλαπλασιασμός, αυξανόμενο βήμα) αποκαλύπτονται με μία ματιά.",
    mid_en: "Balanced numerical performance — the rules of sequences and rates are within comfortable reach.",
    mid_el: "Ισορροπημένη αριθμητική επίδοση — οι κανόνες ακολουθιών και ρυθμών είναι σε άνετη απόσταση.",
  },
  spatial: {
    label_en: "Spatial reasoning",
    label_el: "Χωρικός συλλογισμός",
    desc_en: "Mentally rotating, folding and assembling shapes — imagining objects from other viewpoints.",
    desc_el: "Νοερή περιστροφή, δίπλωμα και συναρμολόγηση σχημάτων — φαντάζεσαι αντικείμενα από άλλες οπτικές.",
    strong_en: "This was one of your strongest areas: you manipulate shapes in your head reliably — the skill behind geometry, engineering drawings, navigation and design.",
    strong_el: "Ήταν από τους δυνατότερους τομείς σου: χειρίζεσαι σχήματα νοερά με αξιοπιστία — η δεξιότητα πίσω από τη γεωμετρία, τα τεχνικά σχέδια, τον προσανατολισμό και το design.",
    weak_en: "This was one of your weaker areas this time. Rotation and folding items become much easier if you track just one distinctive corner or feature through the transformation instead of the whole shape.",
    weak_el: "Ήταν από τους πιο αδύναμους τομείς σου αυτή τη φορά. Οι περιστροφές και τα διπλώματα γίνονται πολύ ευκολότερα αν παρακολουθείς μόνο μία χαρακτηριστική γωνία ή λεπτομέρεια μέσα στον μετασχηματισμό, όχι όλο το σχήμα.",
    mid_en: "Steady spatial performance — mental rotation is neither your edge nor a limitation.",
    mid_el: "Σταθερή χωρική επίδοση — η νοερή περιστροφή δεν είναι ούτε το πλεονέκτημά σου ούτε περιορισμός.",
  },
};

// ── IQ band interpretation texts (mean 100, SD 15) ──────────────
const IQ_RESULT_TEXTS = {
  bands: [
    {
      min: 55, max: 84,
      head_en: "Below the average zone on this test",
      head_el: "Κάτω από τη μέση ζώνη σε αυτό το τεστ",
      body_en: "Your estimate on this short practice test landed below the average zone (85–115). Read this loosely: on 20 items, a few slips, misread diagrams or rushed answers move the estimate a lot. Check the domain breakdown below — an uneven profile usually says more than the single number.",
      body_el: "Η εκτίμησή σου σε αυτό το σύντομο τεστ εξάσκησης βγήκε κάτω από τη μέση ζώνη (85–115). Διάβασέ το χαλαρά: σε 20 ερωτήσεις, λίγα λάθη απροσεξίας, παρανοήσεις διαγραμμάτων ή βιαστικές απαντήσεις μετακινούν πολύ την εκτίμηση. Δες την ανάλυση ανά τομέα παρακάτω — ένα ανομοιογενές προφίλ συνήθως λέει περισσότερα από τον έναν αριθμό.",
    },
    {
      min: 85, max: 99,
      head_en: "Average zone (lower half)",
      head_el: "Μέση ζώνη (κάτω μισό)",
      body_en: "You scored inside the average zone, where roughly half of all test-takers land. Within that zone the domain profile is what matters: most people have one clearly stronger channel — check yours below and lean on it when you learn new material.",
      body_el: "Σκόραρες μέσα στη μέση ζώνη, εκεί όπου πέφτει περίπου ο μισός πληθυσμός. Μέσα σε αυτή τη ζώνη σημασία έχει το προφίλ ανά τομέα: οι περισσότεροι έχουν ένα σαφώς δυνατότερο «κανάλι» — δες το δικό σου παρακάτω και πάτησε πάνω του όταν μαθαίνεις νέο υλικό.",
    },
    {
      min: 100, max: 114,
      head_en: "Average zone (upper half)",
      head_el: "Μέση ζώνη (πάνω μισό)",
      body_en: "You scored in the upper half of the average zone — above the midpoint of the population on this item mix. The strengths listed below are reliable enough to build on; the weaker domains respond well to the specific tactics noted next to them.",
      body_el: "Σκόραρες στο πάνω μισό της μέσης ζώνης — πάνω από το μέσο του πληθυσμού σε αυτό το μείγμα ερωτήσεων. Τα δυνατά σημεία παρακάτω είναι αρκετά αξιόπιστα για να χτίσεις πάνω τους· οι πιο αδύναμοι τομείς βελτιώνονται με τις τακτικές που σημειώνονται δίπλα τους.",
    },
    {
      min: 115, max: 129,
      head_en: "Above the average zone",
      head_el: "Πάνω από τη μέση ζώνη",
      body_en: "Your estimate sits clearly above the average zone — roughly the top sixth of test-takers on this item mix. Scores here usually mean the easy and medium items were nearly clean and several hard ones landed too. The domain chart shows where your ceiling is highest.",
      body_el: "Η εκτίμησή σου είναι καθαρά πάνω από τη μέση ζώνη — περίπου το πάνω 1/6 όσων δίνουν το τεστ σε αυτό το μείγμα ερωτήσεων. Τέτοια σκορ συνήθως σημαίνουν σχεδόν καθαρές εύκολες/μεσαίες ερωτήσεις και αρκετές δύσκολες σωστές. Το διάγραμμα τομέων δείχνει πού είναι ψηλότερα το ταβάνι σου.",
    },
    {
      min: 130, max: 145,
      head_en: "Well above the average zone",
      head_el: "Πολύ πάνω από τη μέση ζώνη",
      body_en: "You answered nearly everything correctly, including the hardest items — the top of what a 20-item test can measure. At this level the test runs out of headroom: a longer, professionally normed instrument would be needed to say anything more precise.",
      body_el: "Απάντησες σωστά σχεδόν τα πάντα, μαζί και τις δυσκολότερες ερωτήσεις — το μέγιστο που μπορεί να μετρήσει ένα τεστ 20 ερωτήσεων. Σε αυτό το επίπεδο το τεστ εξαντλεί το εύρος του: θα χρειαζόταν ένα μεγαλύτερο, επαγγελματικά σταθμισμένο εργαλείο για κάτι πιο ακριβές.",
    },
  ],
  limitations_en: "How to read this: this is a 20-item, unnormed practice test scored against assumed item difficulties — not a clinical or professionally administered IQ test. The estimate carries an uncertainty of at least ±7 points (that's why a range is shown), skipped items count as incorrect, and percentiles are rounded. Treat the result as an indication for entertainment and self-exploration, nothing more.",
  limitations_el: "Πώς να το διαβάσεις: πρόκειται για τεστ εξάσκησης 20 ερωτήσεων, χωρίς στάθμιση, που βαθμολογείται με υποτιθέμενες δυσκολίες ερωτήσεων — όχι για κλινικό ή επαγγελματικά χορηγούμενο τεστ IQ. Η εκτίμηση έχει αβεβαιότητα τουλάχιστον ±7 μονάδων (γι' αυτό εμφανίζεται εύρος), οι παραλειφθείσες ερωτήσεις μετρούν ως λάθος και τα εκατοστημόρια στρογγυλοποιούνται. Αντιμετώπισε το αποτέλεσμα ως ένδειξη για ψυχαγωγία και αυτοδιερεύνηση, τίποτα παραπάνω.",
};
