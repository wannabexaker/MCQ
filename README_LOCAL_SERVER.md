# Run With Python (Local Server)

Why:
- Browsers block loading `q_*.json` when you open `index.html` via `file://`
- Running a local HTTP server fixes it

## Quick Start
From the folder that contains `index.html`:

```bash
python -m http.server 8000
```

Windows alternative:

```bash
py -3 -m http.server 8000
```

Open:
- http://localhost:8000

Stop:
- Press Ctrl+C in the terminal

