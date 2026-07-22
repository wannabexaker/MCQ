# MCQ Trainer

[![CI](https://github.com/wannabexaker/MCQ/actions/workflows/ci.yml/badge.svg)](https://github.com/wannabexaker/MCQ/actions/workflows/ci.yml)
[![Build APK](https://github.com/wannabexaker/MCQ/actions/workflows/build-apk.yml/badge.svg)](https://github.com/wannabexaker/MCQ/actions/workflows/build-apk.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Multiple-choice quiz engine with 21 bundled bilingual question banks, user-supplied JSON imports, offline storage, and an Android APK wrapper.

**Live:** https://wannabexaker.github.io/mcq-trainer/

## Overview

Opens on a landing page with pickable question sets, validates every bank against a fixed schema, and renders an interactive quiz with score tracking, exam mode, shuffle, timer, and a practice mode that surfaces only previously wrong questions. **21 sets ship with the repo** — Networking, Cybersecurity, IT General, a demo, 7 SQL sets (basics through CTEs/window functions), 8 C# sets (types through async/await), and 2 hidden Discrete Math sets reachable via the landing search. Every question carries English and Greek text; a topbar **EL/EN** toggle switches the whole quiz between languages. Users can add their own banks via a file picker or generate them with the built-in AI prompt that turns any text into ready-to-import JSON. Progress, imported sets, and stats persist in `localStorage`. The same web assets serve as a static webpage, an installable PWA, and a native Android APK with no server requirement.

## Features

### Content
- **21 bundled question sets** (~660 questions), all bilingual EN/ΕΛ:
  - Networking, Cybersecurity, IT General (30 Q each), Demo (12 Q)
  - **SQL01–07**: basics, JOINs & subqueries, GROUP BY/aggregates, string & date functions, transactions & ACID, indexes & performance, CTEs & window functions (15 Q each)
  - **CS01–08 (C#)**: types & control flow, OOP, null handling, collections, LINQ & lambdas, strings & StringBuilder, ADO.NET, exceptions & async/await (15 Q each)
  - Rosen Discrete Math ×2 — hidden; surface via the landing search
- **EL/EN question language toggle** (topbar + mobile menu, persisted) — UI stays English, question and choice text switches
- Per-question optional `image`, `image_answers`, and `code` fields rendered in the card

### Assessments (special section)
- **Three self-tests** behind the 🎯 topbar button and a landing-page card — a parallel track to the quiz engine with a sequential one-question-at-a-time flow, progress bar, skip & return (clickable dot strip), autosave/resume, and rich explained results:
  - **IQ Test** — 20 original ICAR-style items (4 domains × 5 difficulties; matrix/spatial items use inline-SVG stimuli and visual answer tiles) → IQ estimate band on a bell curve, per-domain percentiles, strengths/weaknesses with concrete guidance
  - **Analytical Thinking Test** — 25 logic items (deduction, patterns, syllogisms, critical thinking, trap puzzles) → 7 named bands (Chaotic Thinker → Mastermind Intelligence) on a band ladder, plus per-area notes
  - **Dark Triad (SD-3 style)** — 27 Likert statements (no right answers) → narcissism / Machiavellianism / psychopathy radar, each trait scored 0–100% on a graded 5-level scale (Very low → Very high), and one of **13 named archetypes** (gentle → moderate → dark) with fictional examples and a cognitive-tendency note
- Fully bilingual EN/ΕΛ — items, UI labels and result texts all switch with the existing language toggle
- **Shareable results** via a compact `?ar=` URL payload (aggregates only, never per-item answers); opening a share link renders a read-only result and writes nothing to storage
- **Save any result as a designed PNG image or a real one-page PDF** — generated fully client-side from a themed SVG card (canvas rasterization + a hand-built minimal PDF writer, zero dependencies)
- Honest scoring: disclosed model assumptions, clamped estimates, a limitations box on every result screen, a persistent "not a clinical assessment" disclaimer, and ICAR-format + SD3 (Jones & Paulhus, 2014) attributions
- Results and in-progress sessions persist locally (`assessments-*-v1` keys) and are wiped by Settings → Clear all data
- Assessment data lives in `js/12–14` as JS constants — **not** `q_*.json` — so the quiz import/validation pipeline is completely untouched

### Quiz engine
- Landing page with tag search; each set is a card with Load / **Share** / Download actions
- **Clean, shareable deep links (hash routing)** — every test has its own tidy `#hash` URL, no `?query`: assessments are `#iq` / `#analytical` / `#dark-triad` (`#assessments` = the hub), question sets are `#sql01` / `#cs02` / `#networking` (etc.). Opening a link drops a visitor straight into that test (assessment links start it; set links show only that set, isolated); the address bar always tracks the active test so it is ready to copy; each hub/landing card has a 🔗 Share button (Web Share where available, clipboard + toast otherwise); and the browser **Back** button walks the natural stack (test → hub/picker → quiz) instead of leaving the site
- Schema validation on import with per-question error reporting
- Duplicate detection by normalized text and Jaccard similarity across all loaded sets
- Exam mode and God mode — reveal actions are blocked *and* visually disabled
- Practice mode: filter to questions wrong once, or wrong twice
- Per-question stats (attempts/correct/wrong/lastAt) and test history of the last 10 runs
- Source and category filters; categories derived from boolean tags on each question
- Shuffle question order; shuffle answer choices; both reversible
- Timer panel and widgets, draggable with persisted position

### Accessibility
- **Full keyboard support on answers**: every choice is a focusable `radio` in a labelled `radiogroup`; Tab to reach, arrow keys cycle with wrap-around, Enter/Space selects, `aria-checked` tracks state (including restored progress)
- Theme-colored `:focus-visible` ring; all controls carry `aria-label`s

### Import & export
- One-click import from a file picker; persists to `localStorage` under `imported-question-sources-v1`
- Per-imported-set actions: Rename, Edit (JSON editor), Export to file, Delete; plus Delete-all
- AI prompt modal with copy-to-clipboard that turns any book or text into ready-to-import questions
- Docker-bundle export: downloads the whole app + loaded banks as a ready-to-serve zip

### Platform
- Three themes (`dark`, `light`, `gay`), CSS-variable based — the third one is an easter egg with a fleeing "No" button (Esc ×3 always returns to dark)
- **Guarded storage**: all `localStorage` access goes through a wrapper with an in-memory fallback, so private browsing modes and quota errors never crash the app
- Service worker (cache `mcq-v14`): network-first app shell and question files, cache-first images; installable PWA
- Open Graph + Twitter card meta for link previews
- Optimized assets: ~140 KB of images on page load (512px icon loads only on PWA install)
- Docker image (nginx) for production hosting; one-command local server scripts for Windows
- Capacitor 6 Android wrapper that bundles assets into the APK; no network needed at runtime

### Quality
- **CI on every push/PR** (GitHub Actions): syntax check, question-bank validation, assessment-data validation, headless E2E smoke test
- `tests/validate-questions.mjs` — structural validation of all `q_*.json` (schema, `correctIndex` range, EL/EN choice parity, sequential numbering, single category tag)
- `tests/validate-assessments.mjs` — assessment data + scoring validation (item counts per domain/trait, SVG safety, bilingual completeness, reverse-key structure, band coverage, archetype table, scoring sanity, share-codec round-trips)
- `tests/smoke.mjs` — self-contained E2E: serves the app GitHub-Pages-style (no directory listing) and drives headless Chrome over CDP with real input events; covers landing, search, set loading, scoring, keyboard access, exam mode, language toggle, the assessments section (hub, full run, resume, exit, shared links), the clean-hash deep-links (assessments #iq/#analytical/#dark-triad + sets #sql01…, Back/Forward, Share), and console-error hygiene

## Architecture

Single-page web app. No framework, no build step. App code lives in `js/` as **20 ordered classic scripts split by concern** (11 quiz files, 8 assessment files `js/12–19`, and the clean-hash share-links router `js/20`) — they share one top-level scope, so load order matters and is fixed in `index.html`. The assessments section is a parallel track: a single guard at the top of `applySourceFilter()` re-routes rendering while assessment mode is active, and the quiz state is never touched. State lives in browser `localStorage` behind a guarded wrapper. Boot shows the landing page; picking a card imports that set, after which validation, dedup, and rendering into `<main id="quiz">` run. The exact same web assets are wrapped by Capacitor into an Android WebView for the APK target.

### Components

| File | Role |
|---|---|
| `index.html` | DOM skeleton, modals, mobile menu, PWA/iOS/social meta, ordered script tags |
| `js/01-core.js` | Guarded storage wrapper, progress/mode state, language init, source constants |
| `js/02-proctor.js` | Activity log, audio preferences, proctor tones, clear-all-data |
| `js/03-data.js` | Stats, history, imported sources, validation, dedup, question loading |
| `js/04-source-filter.js` | Sources/categories filter panel + search |
| `js/05-tools.js` | escapeHTML, templates, downloads, zip writer, docker-bundle export |
| `js/06-import-ui.js` | Text prompt, JSON editor, import modal + library grid |
| `js/07-quiz.js` | `BUNDLED_SETS`, quiz rendering, scoring, answer selection |
| `js/08-boot-theme.js` | Boot sequence, themes, language toggle, easter egg |
| `js/09-modes-timer.js` | Exam/God mode state, confirm modal, timer |
| `js/10-controls.js` | Topbar buttons, widgets, drag & drop, shuffle answers |
| `js/11-settings.js` | Settings modal (tabs), docs modal, activity viewer, mobile menu |
| `js/12-assess-data-iq.js` | IQ test data — 20 bilingual items incl. inline-SVG matrix/spatial stimuli, domain & band texts |
| `js/13-assess-data-analytical.js` | Analytical test data — 25 bilingual items, 7 score bands, per-area notes |
| `js/14-assess-data-sd3.js` | SD-3-style data — 27 Likert items, trait texts (low/mid/high), 13 graded archetypes |
| `js/15-assess-scoring.js` | Pure scoring: IQ estimate/percentiles, band mapping, SD-3 reverse-keying, share codec |
| `js/16-assess-charts.js` | SVG chart builders: bell curve, radar, domain bars, band ladder |
| `js/17-assess-results.js` | Rich results screens per test (hero, charts, explanations, limitations, actions) |
| `js/18-assess-engine.js` | Assessments state machine: hub, sequential runner, sessions, mode toggle, share boot |
| `js/19-assess-export.js` | Result export: themed SVG card → PNG (canvas) and one-page PDF (hand-built, zero deps) |
| `js/20-share-links.js` | Clean-hash share links for assessments **and** sets: `#iq`/`#analytical`/`#dark-triad`, `#sql01`… ; Share buttons, URL sync, Back/Forward history (additive; wraps nav functions, no body edits) |
| `style.css` | Theming via CSS variables, layout, modals, welcome grid, focus styles |
| `sw.js` | Service worker — network-first shell + questions, cache-first images |
| `manifest.json` | PWA manifest (192px + 512px icons, theme, standalone display) |
| `sources_index.json` | **Kept empty on purpose** — populating it auto-loads every set and skips the landing page; bundled sets are registered in `BUNDLED_SETS` (`js/07-quiz.js`) instead |
| `questions_template.json` | Documented template for new question files |
| `q_*.json` (21 files) | Question banks — see Content above |
| `tests/` | Question + assessment validators, headless E2E smoke suite |
| `.github/workflows/ci.yml` | CI: syntax check + all three test suites |
| `scripts/copy-www.js` | Copies web assets (incl. `js/`) into `www/` for Capacitor sync |
| `capacitor.config.json` | Capacitor app id, web dir, Android options |
| `nginx.conf` | Caching + SW-safe headers for Docker deploy |
| `Dockerfile` | nginx:alpine + static assets |

## Tech Stack

| Technology | Role |
|---|---|
| HTML5 / vanilla JavaScript / CSS3 | Runtime — no framework, no build step for the web target |
| `localStorage` (guarded wrapper) | Progress, imported sets, per-question stats, history, practice mode, language |
| Service Worker | Offline cache; network-first for shell + question files |
| Web App Manifest | Installable PWA |
| Node.js 22 + Chrome DevTools Protocol | Test harness (validator + headless E2E smoke) |
| GitHub Actions | CI on every push/PR |
| `@capacitor/core` 6, `@capacitor/android` 6, `@capacitor/cli` 6 | Android WebView wrapper, builds an APK with bundled assets |
| `nginx:alpine` (Docker) | Static file server for the web deploy |
| Python `http.server` / Node static servers | Local development |

## Installation

Webpage requires only a static HTTP server. The Android APK build additionally needs Node.js, a JDK, and the Android SDK.

```bash
git clone https://github.com/wannabexaker/mcq.git
cd mcq
```

Web (Python, no install):

```bash
py -3 -m http.server 8000
```

Web (Docker):

```bash
docker compose up --build
```

Android APK — download pre-built:

- Tagged releases: [Releases page](https://github.com/wannabexaker/MCQ/releases) (one `.apk` per release)
- Latest from `main`: [Actions → Build Android APK](https://github.com/wannabexaker/MCQ/actions/workflows/build-apk.yml) → most recent run → `mcq-trainer-debug-apk` artifact (requires GitHub login, 30-day retention)

Android APK — build locally:

```bash
npm install
npm run build:apk
```

## Usage

Webpage: open `http://localhost:8000` (Python) or `http://localhost:8080` (Docker). The landing page lists every bundled set as a card — search by tag (`sql`, `c#`, `networking`, …), then **Load**. The **EL** button in the topbar switches questions to Greek. Imported sets persist across reloads.

Android: install the generated APK and launch.

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

Build commands:

```bash
npm run copy:www          # copy web files into www/
npm run sync              # copy:www + cap sync android
npm run open:android      # sync + open in Android Studio
npm run build:apk         # sync + assembleDebug → app-debug.apk
npm run build:apk:release # sync + assembleRelease (requires signing config)
```

## Testing

```bash
node tests/validate-questions.mjs     # structural validation of all q_*.json
node tests/validate-assessments.mjs   # assessment data / scoring / share-codec validation (js/12–15)
node tests/smoke.mjs                  # headless E2E (needs Chrome; CHROME_PATH overrides location)
```

All three run in CI on every push and pull request, plus a syntax check of every `js/*.js` file. The smoke test starts its own static server (no directory listing, mimicking GitHub Pages) and drives a real headless Chrome through the DevTools Protocol with genuine input events.

## Question File Format

```json
[
  {
    "number": 1,
    "question_en": "Which OSI layer handles end-to-end reliable delivery?",
    "question_el": "Ποιο επίπεδο OSI χειρίζεται την αξιόπιστη παράδοση άκρο-σε-άκρο;",
    "choices_en": ["Network (3)", "Transport (4)", "Session (5)", "Data Link (2)"],
    "choices_el": ["Δικτύου (3)", "Μεταφοράς (4)", "Συνόδου (5)", "Ζεύξης Δεδομένων (2)"],
    "correctIndex": 1,
    "networking": true
  }
]
```

Required:

- `number` — integer, used for default sort order
- `question_en` — non-empty string
- `choices_en` — array of 2 to 8 strings
- `correctIndex` — integer in `[0, choices_en.length - 1]`
- At least one boolean field set to `true` — used as the category tag

Optional:

- `id` — stable string identifier; survives edits and reorders
- `question_el`, `choices_el` — Greek translations (same order/length as EN; shown by the EL toggle)
- `code` — code snippet shown as a code block under the question
- `image`, `image_answers` — relative paths to images shown under the question and the answers

File name must match `q_*.json`. Root must be a JSON array. See `questions_template.json` for the full annotated example. To ship a new set as a landing-page card, add an entry to `BUNDLED_SETS` in `js/07-quiz.js` — do **not** add it to `sources_index.json` (see Components).

## Project Structure

```
mcq/
├── index.html               — DOM, modals, PWA/social meta, ordered script tags
├── js/                      — app code, 19 ordered files (01–11 quiz, 12–19 assessments)
├── style.css                — theming, layout, focus styles
├── sw.js                    — service worker (cache mcq-v14)
├── manifest.json            — PWA manifest
├── sources_index.json       — intentionally empty (see Components)
├── questions_template.json  — annotated question template
├── q_networking.json        — 30 networking questions
├── q_cybersecurity.json     — 30 cybersecurity questions
├── q_it_general.json        — 30 general IT questions
├── q_demo.json              — 12 demo questions
├── q_sql01..07.json         — 7 SQL sets, 15 questions each
├── q_cs01..08.json          — 8 C# sets, 15 questions each
├── q_RosenCh*.json          — 2 hidden Discrete Math sets
├── images/                  — favicon (192px), icon-512, side banner, game-over splash
├── tests/
│   ├── validate-questions.mjs   — schema/parity validation of all banks
│   ├── validate-assessments.mjs — assessment data/scoring/codec validation
│   └── smoke.mjs                — headless E2E via Chrome DevTools Protocol
├── .github/workflows/
│   ├── ci.yml               — syntax check + validators + smoke on push/PR
│   └── build-apk.yml        — Android APK build
├── scripts/
│   └── copy-www.js          — copies web assets into www/ for Capacitor
├── capacitor.config.json    — Capacitor app config
├── package.json             — npm scripts (build:apk, sync, etc.)
├── android/                 — Capacitor-generated Android project (Gradle)
├── Dockerfile               — nginx:alpine + assets
├── docker-compose.yml       — service definition, exposes :8080
├── nginx.conf               — cache headers + SW-safe rules
├── start_server.bat         — one-click local Python server (Windows cmd)
└── start_server.ps1         — one-click local Python server (PowerShell)
```

## Notes

- Service worker uses **network-first for the app shell (`index.html`, `style.css`, every `js/*.js`, `manifest.json`, `sw.js`) and for `q_*.json` / `sources_index.json`**, so code and content updates land immediately; images and other assets are cache-first, which keeps the app opening offline. Bump `CACHE_VERSION` in `sw.js` when cache-first assets change.
- `sources_index.json` must stay **empty**. It is the discovery fallback for hosts without directory listing (GitHub Pages, the APK); populating it auto-loads every listed bank at boot and the landing page never appears. Bundled sets belong in `BUNDLED_SETS` (`js/07-quiz.js`).
- The `js/` files are **order-sensitive**: they share one top-level scope, so a file may only reference earlier files' bindings at load time (calls made after load, e.g. inside functions or event handlers, can reference anything). Keep the `index.html` script-tag order in sync when adding files.
- `nginx.conf` sets `Cache-Control: no-cache` for `sw.js` and `manifest.json` specifically. Without that, browsers can serve a stale service worker for up to 7 days under the default static-asset caching block and refuse to pick up updates.
- The Android WebView ships at `https://localhost` (per `capacitor.config.json` → `androidScheme: "https"`). The same-origin policy works correctly; `localStorage` is durable across app launches and survives APK updates.
- Imported question banks live entirely in the browser/WebView `localStorage`. There is no server-side store. To migrate between devices, use the **Export** action on each imported source and re-import on the target device.
- The validator rejects files whose name does not match `q_*.json` to avoid accidental imports of unrelated JSON. Files listed in `EXCLUDED_SOURCE_FILES` (legacy / template names) are also skipped.
- Duplicate questions across multiple loaded sets are hidden from the rendered quiz but not deleted from their source files. The dedup uses Jaccard similarity on tokenised question text plus an exact match on normalized correct-answer text — it may trim a question or two even within a single set (e.g. SQL Basics renders 14 of 15).

## License

MIT
