# MCQ Trainer

Multiple-choice question trainer. Pure static HTML + JS + CSS, runs as a webpage **and** as a native Android APK (Capacitor wrapper).

## Quick start

### Webpage (no install)

Open `index.html` via any local server (or Docker). Direct `file://` is blocked because the app fetches `q_*.json` files over HTTP.

```bash
# Python (fastest)
py -3 -m http.server 8000
# open http://localhost:8000

# Or Docker
docker compose up --build
# open http://localhost:8080
```

### Android APK

Requires Node.js, JDK and the Android SDK.

```bash
npm install
npm run build:apk
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

Install on a connected phone:

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

## Features

- **Bundled question sets**: Networking, Cybersecurity, IT General, plus a small Demo set
- **Import your own** `q_*.json` files — validated, persisted in `localStorage`
- **Built-in AI prompt** that turns any book/text into ready-to-import questions
- **Exam mode**, **practice mode** (only wrong questions), shuffle Q/A, timer, history
- Offline-capable PWA (manifest + service worker)

## Question file format

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

Required fields: `number`, `question_en`, `choices_en` (2-8 items), `correctIndex` (zero-based), and at least one boolean category tag.

Optional: `id`, `question_el`, `choices_el`, `code`, `image`, `image_answers`.

File name must match `q_*.json`. Root must be a JSON array.

## Live demo

[mcq-trainer on wannabexaker.github.io](https://wannabexaker.github.io/mcq-trainer/)

## License

MIT
