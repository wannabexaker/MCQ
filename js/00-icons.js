// ── Icon set: small line icons (24×24, stroke = currentColor) ──────────────
// Buttons carry data-icon="name" (and data-label="…" for text next to it);
// dynamic buttons go through setButtonIconLabel(), which maps the legacy emoji
// names used across the code to these icons.
const ICON_PATHS = {
  sources: '<path d="M12 3 3 8l9 5 9-5-9-5Z"/><path d="m3 12.5 9 5 9-5"/><path d="m3 17 9 5 9-5"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>',
  shuffle: '<path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="m15 15 6 6"/><path d="M4 4l5 5"/>',
  exam: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2.5h6V4"/><path d="m8.5 13 2.5 2.5 4.5-5"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M2 12s3.6-7 10-7c2 0 3.7.7 5.1 1.6M22 12s-3.6 7-10 7c-2 0-3.7-.7-5.1-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/><path d="m3 3 18 18"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20.5 13.5A8.5 8.5 0 1 1 10.5 3.5a6.8 6.8 0 0 0 10 10Z"/>',
  rainbow: '<path d="M2 18a10 10 0 0 1 20 0"/><path d="M6 18a6 6 0 0 1 12 0"/><path d="M10 18a2 2 0 0 1 4 0"/>',
  widgets: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  timer: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 2"/><path d="M9.5 2.5h5"/>',
  both: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><circle cx="17" cy="12.5" r="4.5"/><path d="M17 10.5v2l1.3 1"/>',
  off: '<circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/>',
  reset: '<path d="M3 12a9 9 0 1 0 2.8-6.5"/><path d="M3 3.5V9h5.5"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
  chevronLeft: '<path d="m15 18-6-6 6-6"/>',
  chevronRight: '<path d="m9 18 6-6-6-6"/>',
  home: '<path d="M3 11 12 4l9 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5.5h4V20"/>',
  folder: '<path d="M3 7.5A2 2 0 0 1 5 5.5h4l2 2h8a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
};

function iconSvg(name, badge) {
  const body = ICON_PATHS[name];
  if (!body) return "";
  const b = badge ? `<text x="23" y="23.5" text-anchor="end" font-size="9" font-weight="800" fill="currentColor" stroke="none" font-family="system-ui,sans-serif">${badge}</text>` : "";
  return `<svg class="ic" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}${b}</svg>`;
}

// Legacy emoji names still passed by the app code → icon names.
const ICON_BY_EMOJI = {
  "📚": "sources", "🎯": "target", "📝": "exam", "👁️": "eye", "🙈": "eyeOff",
  "🧠": "bolt", "⚡": "bolt", "💡": "sun", "🌙": "moon", "🌈": "rainbow",
  "🧩": "widgets", "⏱️": "timer", "🧩⏱️": "both", "🚫": "off", "♻️": "reset",
};

// Put an icon (plus an optional visible label) into a button.
function setIconContent(btn, name, label, badge) {
  if (!btn) return;
  btn.innerHTML = iconSvg(name, badge);
  if (label) {
    const span = document.createElement("span");
    span.className = "ic-label";
    span.textContent = label;
    btn.appendChild(span);
  }
}

// Static buttons in index.html: <button data-icon="…" data-label="…" data-badge="…">
function applyStaticIcons(root = document) {
  root.querySelectorAll("[data-icon]").forEach((el) => {
    setIconContent(el, el.dataset.icon, el.dataset.label || "", el.dataset.badge || "");
  });
}
applyStaticIcons();
