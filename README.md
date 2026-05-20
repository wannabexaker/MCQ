# MCQ Trainer

[![Build APK](https://github.com/wannabexaker/MCQ/actions/workflows/build-apk.yml/badge.svg)](https://github.com/wannabexaker/MCQ/actions/workflows/build-apk.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Multiple-choice quiz engine with user-supplied JSON banks, offline storage, and an Android APK wrapper

## Overview

Loads question banks from files matching `q_*.json`, validates them against a fixed schema, and renders them as an interactive quiz with score tracking, exam mode, shuffle, timer, and a practice mode that surfaces only previously wrong questions. Three pre-built sets ship with the repo (Networking, Cybersecurity, IT General — 30 questions each) plus a 12-question demo. Users can add their own banks via a file picker or generate them with the built-in AI prompt that takes any text and returns ready-to-import JSON. Progress, imported sets, and stats persist in `localStorage`. The same web assets serve as a static webpage, an installable PWA, and a native Android APK with no server requirement.

## Features

- Question banks loaded from `q_*.json` files; root must be a JSON array of question objects
- Schema validation on import with per-question error reporting
- Duplicate detection by normalized text and Jaccard similarity across all loaded sets
- Three bundled sets (Networking, Cybersecurity, IT General — 30 Q each) + 12-question demo
- One-click import from a file picker; persists to `localStorage` under `imported-question-sources-v1`
- Per-imported-set actions: Rename, Edit (JSON editor), Export to file, Delete; plus Delete-all
- AI prompt modal with copy-to-clipboard that turns any book or text into ready-to-import questions
- Exam mode: hides reveal actions and lock-in answers until the test is submitted
- Practice mode: filter to questions wrong once, or wrong twice
- Per-question stats (attempts/correct/wrong/lastAt) under `question-stats-v1`
- Test history of the last 10 runs under `test-history-v1`
- Source and category filters; categories derived from boolean tags on each question
- Shuffle question order; shuffle answer choices; both reversible
- Timer panel, draggable; persisted position
- Per-question optional `image`, `image_answers`, and `code` fields rendered in the card
- English and Greek translations supported per question (`question_en` / `question_el`, `choices_en` / `choices_el`)
- Three themes (`dark`, `light`, `gay`), CSS-variable based
- Service worker app-shell caching + PWA manifest; installable on Android/iOS/desktop
- Docker image (nginx) for production hosting; one-command local server scripts for Windows
- Capacitor 6 Android wrapper that bundles assets into the APK; no network needed at runtime

## Architecture

Single-page web app. No framework. All logic in `script.js`; state lives in browser `localStorage`. Boot reads `sources_index.json` for bundled files, merges any user-imported sets from `localStorage`, validates and deduplicates the merged set, then renders quiz cards into `<main id="quiz">`. The exact same web assets are wrapped by Capacitor into an Android WebView for the APK target.

### Components

| File | Role |
|---|---|
| `index.html` | DOM skeleton, modals, mobile menu, PWA + iOS meta |
| `script.js` | All quiz logic, validation, dedup, localStorage I/O, rendering |
| `style.css` | Theming via CSS variables, layout, modals, welcome grid |
| `sw.js` | Service worker — cache-first app shell, network-first `q_*.json` |
| `manifest.json` | PWA manifest (name, icons, theme, standalone display) |
| `sources_index.json` | List of bundled `q_*.json` files auto-loaded at startup |
| `questions_template.json` | Documented template for new question files |
| `q_networking.json` | 30 networking questions, tag `networking` |
| `q_cybersecurity.json` | 30 cybersecurity questions, tag `cybersecurity` |
| `q_it_general.json` | 30 general IT questions, tag `itGeneral` |
| `q_demo.json` | 12-question demo set, tag `demo` |
| `scripts/copy-www.js` | Copies web assets into `www/` for Capacitor sync |
| `capacitor.config.json` | Capacitor app id, web dir, Android options |
| `nginx.conf` | Caching + SW-safe headers for Docker deploy |
| `Dockerfile` | nginx:alpine + static assets |

## Tech Stack

| Technology | Role |
|---|---|
| HTML5 / vanilla JavaScript / CSS3 | Runtime — no framework, no build step for the web target |
| `localStorage` | Progress, imported sets, per-question stats, history, practice mode |
| Service Worker | Offline app-shell cache; network-first for question files |
| Web App Manifest | Installable PWA |
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

Webpage: open `http://localhost:8000` (Python) or `http://localhost:8080` (Docker). The welcome screen shows three quick-start sets plus an import button. Imported sets persist across reloads.

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

## Question File Format

```json
[
  {
    "number": 1,
    "question_en": "Which OSI layer handles end-to-end reliable delivery?",
    "choices_en": ["Network (3)", "Transport (4)", "Session (5)", "Data Link (2)"],
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
- `question_el`, `choices_el` — Greek translations
- `code` — code snippet shown as a code block under the question
- `image`, `image_answers` — relative paths to images shown under the question and the answers

File name must match `q_*.json`. Root must be a JSON array. See `questions_template.json` for the full annotated example.

## Project Structure

```
mcq/
├── index.html               — DOM, modals, PWA meta
├── script.js                — quiz logic (all of it)
├── style.css                — theming, layout
├── sw.js                    — service worker
├── manifest.json            — PWA manifest
├── sources_index.json       — list of bundled q_*.json files
├── questions_template.json  — annotated question template
├── q_networking.json        — 30 networking questions
├── q_cybersecurity.json     — 30 cybersecurity questions
├── q_it_general.json        — 30 general IT questions
├── q_demo.json              — 12 demo questions
├── images/                  — favicon, side banner, game-over splash
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

- Service worker uses **network-first for `q_*.json` and `sources_index.json`** so freshly imported or edited question banks aren't served from a stale cache; the app shell (HTML/JS/CSS/images) is cache-first, which is what makes the page open offline.
- `nginx.conf` sets `Cache-Control: no-cache` for `sw.js` and `manifest.json` specifically. Without that, browsers can serve a stale service worker for up to 7 days under the default static-asset caching block and refuse to pick up updates.
- The Android WebView ships at `https://localhost` (per `capacitor.config.json` → `androidScheme: "https"`). The same-origin policy works correctly; `localStorage` is durable across app launches and survives APK updates.
- Imported question banks live entirely in the browser/WebView `localStorage`. There is no server-side store. To migrate between devices, use the **Export** action on each imported source and re-import on the target device.
- The validator rejects files whose name does not match `q_*.json` to avoid accidental imports of unrelated JSON. Files listed in `EXCLUDED_SOURCE_FILES` (legacy / template names) are also skipped.
- Duplicate questions across multiple loaded sets are hidden from the rendered quiz but not deleted from their source files. The dedup uses Jaccard similarity on tokenised question text plus an exact match on normalized correct-answer text.

## License

MIT
