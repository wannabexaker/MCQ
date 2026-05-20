#!/usr/bin/env node
/**
 * Copy the web app assets into ./www so Capacitor can bundle them into the APK.
 * The source of truth is the project root. Only specific files/folders are
 * shipped — node_modules, android/, scripts/, docker stuff, etc. are excluded.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DEST = path.join(ROOT, "www");

const FILES = [
  "index.html",
  "script.js",
  "style.css",
  "manifest.json",
  "sw.js",
  "sources_index.json",
  "questions_template.json",
];

const DIRS = ["images"];

function rmrf(target) {
  if (!fs.existsSync(target)) return;
  fs.rmSync(target, { recursive: true, force: true });
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

rmrf(DEST);
fs.mkdirSync(DEST, { recursive: true });

let copied = 0;

for (const f of FILES) {
  const s = path.join(ROOT, f);
  if (fs.existsSync(s)) {
    fs.copyFileSync(s, path.join(DEST, f));
    copied++;
  } else {
    console.warn(`[copy-www] missing optional file: ${f}`);
  }
}

const qFiles = fs
  .readdirSync(ROOT)
  .filter((f) => /^q_.*\.json$/i.test(f) && fs.statSync(path.join(ROOT, f)).isFile());
for (const f of qFiles) {
  fs.copyFileSync(path.join(ROOT, f), path.join(DEST, f));
  copied++;
}

for (const d of DIRS) {
  const s = path.join(ROOT, d);
  if (fs.existsSync(s)) {
    copyDir(s, path.join(DEST, d));
    copied++;
  }
}

console.log(`[copy-www] copied ${copied} entries into ${path.relative(ROOT, DEST)}/`);
