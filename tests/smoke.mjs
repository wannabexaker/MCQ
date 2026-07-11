#!/usr/bin/env node
// End-to-end smoke test: serves the app (GitHub-Pages-like: no directory
// listing) and drives headless Chrome over CDP with real input events.
// Run: node tests/smoke.mjs   (CHROME_PATH env overrides browser location)
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync, mkdtempSync } from "node:fs";
import { join, extname, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 8768;
const CDP_PORT = 9224;

// ── static server (no listing → landing-page code path, like Pages) ──
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml",
};
const server = createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p === "/" || p.endsWith("/")) p = "/index.html";
  const f = join(ROOT, p);
  if (!resolve(f).startsWith(resolve(ROOT))) { res.writeHead(403); return res.end(); }
  let st; try { st = statSync(f); } catch { res.writeHead(404); return res.end("not found"); }
  if (!st.isFile()) { res.writeHead(404); return res.end("not found"); }
  res.writeHead(200, { "Content-Type": TYPES[extname(f).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-store" });
  createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));

// ── launch headless chrome ──
const CANDIDATES = [
  process.env.CHROME_PATH,
  "/usr/bin/google-chrome", "/usr/bin/chromium-browser", "/usr/bin/chromium",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
].filter(Boolean);
const chrome = CANDIDATES.find(existsSync);
if (!chrome) { console.error("FAIL: no Chrome/Chromium found (set CHROME_PATH)"); process.exit(2); }

const profile = mkdtempSync(join(tmpdir(), "mcq-smoke-"));
const proc = spawn(chrome, [
  "--headless=new", `--remote-debugging-port=${CDP_PORT}`,
  "--no-first-run", "--no-default-browser-check", "--disable-gpu", "--no-sandbox",
  "--disable-dev-shm-usage", // CI containers have a tiny /dev/shm; without this Chrome crashes on startup
  `--user-data-dir=${profile}`, "about:blank",
], { stdio: ["ignore", "ignore", "pipe"] });

let chromeStderr = "";
proc.stderr.on("data", (d) => { chromeStderr += d; });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getWsUrl() {
  for (let i = 0; i < 60; i++) {
    if (proc.exitCode !== null)
      throw new Error(`Chrome exited (${proc.exitCode}): ${chromeStderr.slice(-400)}`);
    try {
      const targets = await fetch(`http://127.0.0.1:${CDP_PORT}/json`).then((r) => r.json());
      const page = targets.find((t) => t.type === "page");
      if (page) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(500);
  }
  throw new Error("CDP not reachable. Chrome stderr: " + chromeStderr.slice(-400));
}

let msgId = 0;
const pending = new Map();
const consoleErrors = [];
let ws;

function send(method, params = {}) {
  return new Promise((resolveP, rejectP) => {
    const id = ++msgId;
    pending.set(id, { resolveP, rejectP });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function evalJs(expression) {
  const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error("page threw: " + (r.exceptionDetails.exception?.description || "").slice(0, 200));
  return r.result?.value;
}
async function key(k, code, vk) {
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
}
async function waitFor(expr, timeoutMs = 8000, step = 200) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    if (await evalJs(expr)) return true;
    await sleep(step);
  }
  throw new Error("timeout waiting for: " + expr);
}

let passed = 0, failed = 0;
function check(name, ok, detail = "") {
  if (ok) { console.log(`  ok  ${name}`); passed++; }
  else { console.error(`  FAIL ${name} ${detail}`); failed++; }
}

try {
  ws = new WebSocket(await getWsUrl());
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id).resolveP(m.result || m); pending.delete(m.id); }
    if (m.method === "Runtime.exceptionThrown")
      consoleErrors.push(m.params?.exceptionDetails?.exception?.description || "exception");
    if (m.method === "Runtime.consoleAPICalled" && m.params?.type === "error")
      consoleErrors.push((m.params.args || []).map((a) => a.value).join(" "));
  };
  await send("Page.enable");
  await send("Runtime.enable");

  console.log("landing:");
  await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/index.html` });
  await waitFor(`!!document.querySelector('.welcome-title')`);
  check("landing page renders", true);
  const cards = await evalJs(`document.querySelectorAll('.welcome-set:not([hidden])').length`);
  check("bundled set cards visible", cards >= 19, `got ${cards}`);
  const sqlVis = await evalJs(`
    (() => { const i=document.querySelector('#welcomeSearch');
      i.value='sql'; i.dispatchEvent(new Event('input',{bubbles:true}));
      const v=[...document.querySelectorAll('.welcome-set')].filter(c=>c.style.display!=='none'&&!c.hidden);
      i.value=''; i.dispatchEvent(new Event('input',{bubbles:true}));
      return v.length; })()
  `);
  check("tag search filters to SQL sets", sqlVis === 7, `got ${sqlVis}`);

  console.log("quiz flow:");
  await evalJs(`
    [...document.querySelectorAll('.welcome-set')].find(c=>/SQL — Basics/.test(c.textContent))
      .querySelector('.welcome-set-load').click(); true
  `);
  // The app's near-duplicate detector may drop a question or two, so expect
  // "most of the set" rather than exactly 15.
  await waitFor(`document.querySelectorAll('#quiz .card').length >= 12`);
  const qCount = await evalJs(`document.querySelectorAll('#quiz .card').length`);
  check("SQL Basics loads its questions", qCount >= 12 && qCount <= 15, `got ${qCount}`);

  await evalJs(`document.querySelectorAll('#quiz .card')[0].querySelectorAll('.choice')[1].click(); true`);
  const score = await evalJs(`document.getElementById('score-correct').textContent+'/'+document.getElementById('score-total').textContent`);
  check("answering updates score", score === "1/1", `got ${score}`);

  console.log("keyboard:");
  await evalJs(`document.querySelectorAll('#quiz .card')[1].querySelector('.choice').focus(); true`);
  await key("ArrowDown", "ArrowDown", 40);
  await key("Enter", "Enter", 13);
  await sleep(250);
  const total = await evalJs(`document.getElementById('score-total').textContent`);
  check("arrow + Enter answers question 2", total === "2", `got ${total}`);
  const ariaChecked = await evalJs(`document.querySelectorAll('#quiz .card')[1].querySelectorAll('[aria-checked="true"]').length`);
  check("aria-checked set on selection", ariaChecked === 1, `got ${ariaChecked}`);

  console.log("exam mode:");
  await evalJs(`document.getElementById('toggleExam').click(); true`);
  await sleep(250);
  const revealHidden = await evalJs(`
    (() => { const b=document.querySelector('#quiz .card .btn-toggle');
      return getComputedStyle(b).pointerEvents === 'none' && parseFloat(getComputedStyle(b).opacity) < 0.5; })()
  `);
  check("exam mode visually disables Show answer", revealHidden);
  await evalJs(`
    (async () => { document.getElementById('toggleExam').click();
      await new Promise(r=>setTimeout(r,300));
      document.getElementById('modeResetConfirmYes')?.click(); return true; })()
  `);
  await sleep(350);

  console.log("language toggle:");
  const q1Before = await evalJs(`document.querySelector('#quiz .q-title').textContent`);
  await evalJs(`document.getElementById('toggleLang').click(); true`);
  await sleep(400);
  const q1After = await evalJs(`document.querySelector('#quiz .q-title').textContent`);
  check("EL toggle switches question text", q1Before !== q1After && /[Α-Ωα-ωίϊΐόάέύϋΰήώ]/.test(q1After), `got "${q1After.slice(0, 40)}"`);
  const persisted = await evalJs(`localStorage.getItem('quiz-lang-v1')`);
  check("language persisted", persisted === "el", `got ${persisted}`);
  await evalJs(`document.getElementById('toggleLang').click(); true`);

  console.log("hygiene:");
  const benign = /favicon|catfact|Failed to load resource/i;
  const realErrors = consoleErrors.filter((e) => !benign.test(e));
  check("no console errors", realErrors.length === 0, realErrors.slice(0, 3).join(" | "));
} catch (e) {
  console.error("FAIL (harness):", e.message);
  failed++;
} finally {
  try { ws?.close(); } catch {}
  proc.kill();
  server.close();
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
