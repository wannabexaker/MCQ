function getCorrectIndex(question) {
  if (Number.isInteger(question?.correctIndex)) return question.correctIndex;
  return ANSWER_KEY[getQuestionId(question)];
}

function escapeHTML(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function sanitizeToQFilename(name) {
  const base = String(name || "")
    .trim()
    .replace(/\.json$/i, "")
    .replace(/^q[_-]/i, "")
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
  return `q_${base || "new_questions"}.json`;
}

function buildQuestionsTemplate() {
  return [
    {
      number: 1,
      id: "replace-me-1",
      question_en: "REQUIRED: Write your question here (English). Example: What is 2 + 2?",
      // OPTIONAL: Greek translation (leave empty if you do not need it).
      question_el: "",
      // REQUIRED: 2-7 options. Keep them short and unique.
      choices_en: ["3", "4", "5", "22"],
      // OPTIONAL: Greek choices (same order as choices_en). Leave [] if not used.
      choices_el: [],
      // REQUIRED: zero-based index of the correct answer in choices_en/choices_el.
      correctIndex: 1,
      // REQUIRED: At least one boolean tag must be true (used for the Categories filter).
      // You can name tags however you want. Keep names simple and consistent.
      generalGK: true,

      // OPTIONAL: show an image under the question (path relative to index.html).
      // Example: "images/video_questions/video2_1.png"
      image: "",
      // OPTIONAL: show an image under the answers (path relative to index.html).
      image_answers: "",
      // OPTIONAL: show a code block under the question.
      code: "",

      // Template help fields (safe to delete). They are ignored by the app.
      __fieldGuide: {
        number: "REQUIRED integer. The app shows its own numbering in the UI; this is used for sorting and stable ids.",
        question_en: "REQUIRED non-empty string (English).",
        choices_en: "REQUIRED array (min 2). Use strings only.",
        correctIndex: "REQUIRED integer in range [0..choices_en.length-1].",
        categoryTags:
          "REQUIRED: at least one boolean tag must be true (example: generalGK: true). Used by Categories filter.",
        id: "OPTIONAL string. Recommended to keep stable identifiers when you edit/reorder questions.",
        question_el: "OPTIONAL Greek translation.",
        choices_el: "OPTIONAL Greek choices in the same order as choices_en.",
        image: "OPTIONAL path to an image shown under the question.",
        image_answers: "OPTIONAL path to an image shown under the answers.",
        code: "OPTIONAL code snippet shown under the question.",
      },
      __tips: [
        "File name must be q_*.json (example: q_my_new_set.json).",
        "Root JSON must be an array: [ {question1}, {question2}, ... ].",
        "Do not include comments in JSON. Use these __help fields instead (or delete them).",
      ],
      __quickCopyPasteExample:
        '{\n' +
        '  "number": 1,\n' +
        '  "question_en": "What color is the sky on a clear day?",\n' +
        '  "choices_en": ["Blue", "Green", "Red", "Yellow"],\n' +
        '  "correctIndex": 0,\n' +
        '  "generalGK": true\n' +
        '}',
    },
    {
      number: 2,
      id: "replace-me-2",
      question_en: "OPTIONAL example with code + images: Which SQL clause filters rows?",
      question_el: "",
      choices_en: ["ORDER BY", "WHERE", "GROUP BY", "SELECT"],
      choices_el: [],
      correctIndex: 1,
      // Example of a different category tag.
      sql: true,
      image: "images/video_questions/video2_1.png",
      image_answers: "images/video_questions/video2_1answer.png",
      code: "SELECT *\nFROM Users\nWHERE IsActive = 1;",
    },
  ];
}

function isMobileDevice() {
  return (
    navigator.maxTouchPoints > 0 ||
    window.Capacitor?.isNativePlatform?.() === true
  );
}

function _blobDownload(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function triggerDownload(filename, blob) {
  // On mobile/native, try Web Share API so the OS Save dialog appears.
  if (isMobileDevice() && navigator.canShare) {
    try {
      const file = new File([blob], filename, { type: blob.type });
      if (navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: filename }).catch(() => {
          _blobDownload(filename, blob);
        });
        return;
      }
    } catch (_) {
      // canShare/share not supported in this context — fall through
    }
  }
  _blobDownload(filename, blob);
}

function downloadJsonFile(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], {
    type: "application/json",
  });
  triggerDownload(filename, blob);
}

function downloadTextFile(filename, text, type = "text/plain") {
  const blob = new Blob([String(text ?? "")], { type });
  triggerDownload(filename, blob);
}

// Minimal ZIP writer (store/no compression) so we can download multiple files as one bundle.
// Avoids external deps (works offline).
function crc32(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    crc ^= bytes[i];
    for (let j = 0; j < 8; j += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function toDosTimeDate(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = Math.floor(date.getSeconds() / 2);
  const dosTime = (hours << 11) | (minutes << 5) | seconds;
  const dosDate = ((year - 1980) << 9) | (month << 5) | day;
  return { dosTime, dosDate };
}

function u16(n) {
  const b = new Uint8Array(2);
  b[0] = n & 0xff;
  b[1] = (n >>> 8) & 0xff;
  return b;
}

function u32(n) {
  const b = new Uint8Array(4);
  b[0] = n & 0xff;
  b[1] = (n >>> 8) & 0xff;
  b[2] = (n >>> 16) & 0xff;
  b[3] = (n >>> 24) & 0xff;
  return b;
}

function concatBytes(chunks) {
  const total = chunks.reduce((sum, c) => sum + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  chunks.forEach((c) => {
    out.set(c, offset);
    offset += c.length;
  });
  return out;
}

function toBytes(textOrBytes) {
  if (textOrBytes instanceof Uint8Array) return textOrBytes;
  return new TextEncoder().encode(String(textOrBytes ?? ""));
}

function downloadZip(zipName, entries) {
  const { dosTime, dosDate } = toDosTimeDate(new Date());

  const localParts = [];
  const centralParts = [];
  let offset = 0;

  entries.forEach(({ name, text, bytes }) => {
    const safeName = String(name || "file.txt").replace(/\\/g, "/");
    const nameBytes = toBytes(safeName);
    const dataBytes = bytes ? toBytes(bytes) : toBytes(text);
    const crc = crc32(dataBytes);

    // Local file header
    const localHeader = concatBytes([
      u32(0x04034b50), // signature
      u16(20), // version needed
      u16(0), // flags
      u16(0), // compression (store)
      u16(dosTime),
      u16(dosDate),
      u32(crc),
      u32(dataBytes.length),
      u32(dataBytes.length),
      u16(nameBytes.length),
      u16(0), // extra len
      nameBytes,
    ]);
    localParts.push(localHeader, dataBytes);

    // Central directory header
    const centralHeader = concatBytes([
      u32(0x02014b50), // signature
      u16(20), // version made by
      u16(20), // version needed
      u16(0), // flags
      u16(0), // compression
      u16(dosTime),
      u16(dosDate),
      u32(crc),
      u32(dataBytes.length),
      u32(dataBytes.length),
      u16(nameBytes.length),
      u16(0), // extra
      u16(0), // comment
      u16(0), // disk start
      u16(0), // internal attrs
      u32(0), // external attrs
      u32(offset), // local header offset
      nameBytes,
    ]);
    centralParts.push(centralHeader);

    offset += localHeader.length + dataBytes.length;
  });

  const centralDir = concatBytes(centralParts);
  const centralDirOffset = offset;
  const centralDirSize = centralDir.length;

  // End of central directory record
  const end = concatBytes([
    u32(0x06054b50), // signature
    u16(0), // disk #
    u16(0), // disk start
    u16(entries.length),
    u16(entries.length),
    u32(centralDirSize),
    u32(centralDirOffset),
    u16(0), // comment length
  ]);

  const zipBytes = concatBytes([...localParts, centralDir, end]);
  const blob = new Blob([zipBytes], { type: "application/zip" });
  triggerDownload(zipName, blob);
}

function getDockerTemplates() {
  const dockerfile = `FROM nginx:alpine

COPY . /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
`;

  const nginxConf = `server {
  listen 80;
  server_name _;

  root /usr/share/nginx/html;
  index index.html;
  autoindex off;

  location / {
    try_files $uri $uri/ =404;
  }

  location ~* \\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js)$ {
    expires 7d;
    add_header Cache-Control "public, max-age=604800";
    try_files $uri =404;
  }

  location ~* \\.json$ {
    default_type application/json;
    expires 1h;
    add_header Cache-Control "public, max-age=3600";
    try_files $uri =404;
  }
}
`;

  const compose = `services:
  mcq:
    build: .
    container_name: mcq
    ports:
      - "8080:80"
`;

  const dockerignore = `.git
.vscode
node_modules
*.log
dist
build
coverage
`;

  const readme = `# Run With Docker

IMPORTANT:
- Place Docker files in the SAME folder as index.html (project root), then run docker compose there.

## Quick Start
From the project folder:

\`\`\`bash
docker compose up --build
\`\`\`

Open:
- http://localhost:8080

Stop:

\`\`\`bash
docker compose down
\`\`\`

## Change Port
Edit docker-compose.yml:

\`\`\`yml
ports:
  - "8080:80"
\`\`\`

## Quick Local Server (No Docker)
If you have Python 3 installed, you can also run a local server:

\`\`\`bash
python -m http.server 8000
\`\`\`

Windows alternative:

\`\`\`bash
py -3 -m http.server 8000
\`\`\`

Open:
- http://localhost:8000
`;

  const manual = `# Manual Docker Templates

These templates are safe defaults. Customize if needed:

- Change port in docker-compose.yml
- Use a different server image (Caddy/Apache) if you prefer
- For development, you can mount the folder as a volume (advanced)
`;

  const readmeFirst = `MCQ Docker Setup

You downloaded ONLY Docker files.

Next steps:
1) Extract/copy these files into your MCQ project root (the folder that contains index.html).
2) Run: docker compose up --build
3) Open: http://localhost:8080
`;

  return { dockerfile, nginxConf, compose, dockerignore, readme, manual, readmeFirst };
}

function getLocalServerTemplates() {
  const readme = `# Run With Python (Local Server)

Why:
- Browsers block loading q_*.json when you open index.html via file://
- Running a local HTTP server fixes it

## Quick Start
From the folder that contains index.html:

\`\`\`bash
python -m http.server 8000
\`\`\`

Windows alternative:

\`\`\`bash
py -3 -m http.server 8000
\`\`\`

Open:
- http://localhost:8000

Stop:
- Press Ctrl+C in the terminal
`;

  const ps1 = `param(
  [int]$Port = 8000
)

Set-Location -LiteralPath $PSScriptRoot

Write-Host \"Starting local server on http://localhost:$Port\"
Write-Host \"Stop with Ctrl+C\"

try {
  python -m http.server $Port
  exit 0
} catch {
  try {
    py -3 -m http.server $Port
    exit 0
  } catch {
    Write-Host \"Python was not found. Install Python 3, then run: python -m http.server 8000\"
    exit 1
  }
}
`;

  const bat = `@echo off
setlocal
cd /d \"%~dp0\"
set PORT=8000

echo Starting local server on http://localhost:%PORT%
echo Stop with Ctrl+C
echo.

py -3 -m http.server %PORT% >nul 2>&1
if %errorlevel%==0 (
  py -3 -m http.server %PORT%
  exit /b 0
)

python -m http.server %PORT% >nul 2>&1
if %errorlevel%==0 (
  python -m http.server %PORT%
  exit /b 0
)

echo Python was not found. Install Python 3 and run: python -m http.server 8000
pause
exit /b 1
`;

  return { readme, ps1, bat };
}

async function tryFetchText(path) {
  try {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function tryFetchBytes(path) {
  try {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return new Uint8Array(buf);
  } catch {
    return null;
  }
}

async function fetchFileBytes(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch ${path} (${res.status})`);
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

function uniqueStrings(list) {
  return [...new Set((list || []).map((s) => String(s || "").trim()).filter(Boolean))];
}

function collectBundleFileList() {
  const files = [];
  // Core app files
  files.push(
    "index.html",
    "js/01-core.js",
    "js/02-proctor.js",
    "js/03-data.js",
    "js/04-source-filter.js",
    "js/05-tools.js",
    "js/06-import-ui.js",
    "js/07-quiz.js",
    "js/08-boot-theme.js",
    "js/09-modes-timer.js",
    "js/10-controls.js",
    "js/11-settings.js",
    "js/12-assess-data-iq.js",
    "js/13-assess-data-analytical.js",
    "js/14-assess-data-sd3.js",
    "js/15-assess-scoring.js",
    "js/16-assess-charts.js",
    "js/17-assess-results.js",
    "js/18-assess-engine.js",
    "js/19-assess-export.js",
    "js/20-share-links.js",
    "style.css",
    "sources_index.json",
    "questions_template.json",
    "manifest.json",
    "sw.js"
  );

  // Question sources currently known to the app (q_*.json)
  (SOURCE_DEFINITIONS || []).forEach((s) => {
    const f = String(s?.file || "");
    if (SOURCE_FILE_PATTERN.test(f)) files.push(f);
  });
  // Fallback: include source files observed in loaded data.
  (CURRENT_DATA || []).forEach((q) => {
    const f = String(q?.__sourceFile || "");
    if (SOURCE_FILE_PATTERN.test(f)) files.push(f);
  });

  // Static images used by UI
  files.push("images/favicon.png", "images/game_over.jpg", "images/sidebanner.jpg");

  // Images referenced by questions
  (CURRENT_DATA || []).forEach((q) => {
    if (q?.image) files.push(String(q.image));
    if (q?.image_answers) files.push(String(q.image_answers));
  });

  return uniqueStrings(files).filter((p) => !p.startsWith("http"));
}

async function downloadAppDockerBundleZip() {
  const t = getDockerTemplates();
  const local = getLocalServerTemplates();
  const appFiles = collectBundleFileList();

  // Prefer the project's real files (latest), fallback to built-in templates.
  const dockerfileText = (await tryFetchText("Dockerfile")) ?? t.dockerfile;
  const composeText = (await tryFetchText("docker-compose.yml")) ?? t.compose;
  const dockerignoreText = (await tryFetchText(".dockerignore")) ?? t.dockerignore;
  const nginxConfText = (await tryFetchText("nginx.conf")) ?? t.nginxConf;
  const dockerReadmeText = (await tryFetchText("README_DOCKER.md")) ?? t.readme;
  const manualText = (await tryFetchText("DOCKER_MANUAL_TEMPLATES.md")) ?? t.manual;
  const localReadmeText = (await tryFetchText("README_LOCAL_SERVER.md")) ?? local.readme;
  const localPs1Text = (await tryFetchText("start_server.ps1")) ?? local.ps1;
  const localBatText = (await tryFetchText("start_server.bat")) ?? local.bat;

  const entries = [
    { name: "README_FIRST.txt", text: "Extract this zip, then run: docker compose up --build\nOpen: http://localhost:8080\n" },
    { name: "Dockerfile", text: dockerfileText },
    { name: "docker-compose.yml", text: composeText },
    { name: ".dockerignore", text: dockerignoreText },
    { name: "nginx.conf", text: nginxConfText },
    { name: "README_DOCKER.md", text: dockerReadmeText },
    { name: "DOCKER_MANUAL_TEMPLATES.md", text: manualText },
    { name: "README_LOCAL_SERVER.md", text: localReadmeText },
    { name: "start_server.ps1", text: localPs1Text },
    { name: "start_server.bat", text: localBatText },
  ];

  // Fetch and include app assets (binary safe).
  for (const path of appFiles) {
    try {
      const bytes = (await tryFetchBytes(path)) ?? (await fetchFileBytes(path));
      entries.push({ name: path, bytes });
    } catch (e) {
      console.warn("Bundle missing file:", path, e);
    }
  }

  downloadZip("mcq-app-docker-bundle.zip", entries);
}

async function downloadQuestionsTemplate() {
  // One template file containing SIMPLE + ADVANCED sections.
  // Fallback to the JS-built template if the file can't be fetched.
  try {
    const res = await fetch("questions_template.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`template fetch failed (${res.status})`);
    const template = await res.json();
    downloadJsonFile("q_new_questions.json", template);
  } catch (e) {
    console.warn("Template download fallback used:", e);
    downloadJsonFile("q_new_questions.json", buildQuestionsTemplate());
  }
}

// ---------- Import management UI ----------
