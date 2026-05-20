# Run With Docker

## Requirements
- Docker Desktop (Windows/macOS) or Docker Engine (Linux)

## Quick Start (Recommended)
From the project folder:

```bash
docker compose up --build
```

Open:
- http://localhost:8080

Stop:

```bash
docker compose down
```

## Change Port
Edit `docker-compose.yml`:

```yml
ports:
  - "8080:80"
```

Replace `8080` with the port you want, e.g. `3000:80`.

## Notes
- This app is a static site. Nginx serves `index.html`, `script.js`, `style.css`, `images/`, and `q_*.json`.
