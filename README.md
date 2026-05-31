# DocxAutoFill

A tool for **bulk-filling Word templates (.docx) with data from Excel** via a
visual node editor. No code required: upload your templates and spreadsheet,
connect nodes on the canvas to map columns to template variables, and download
a ZIP archive with all generated documents organised into folders (and
optionally merged per folder).

<!-- TODO: add a screenshot or GIF of the node editor here -->
<!-- ![DocxAutoFill node editor](docs/screenshot.png) -->

## How it works

The canvas has four node types. Edges always go **green → blue / violet / orange**:

| Node colour | Meaning | Source |
|-------------|---------|--------|
| 🟢 Green | Excel column (data source) | spreadsheet headers |
| 🔵 Blue | Template variable (`{{ … }}`) inside a specific .docx | template variables |
| 🟣 Violet | Word file / output filename pattern (`<название>`) | uploaded .docx names |
| 🟠 Orange | Folder-grouping key (which column splits output into folders) | single node |

Workflow:

1. **Import** — upload Excel + Word templates; the backend reads the columns and
   template variables and returns the canvas nodes.
2. **Connect** green nodes to blue/violet/orange nodes to define the mapping.
3. **Archive model** (optional) — preview the folder/file tree before generating.
4. **Запуск** — render every template for every spreadsheet row, group the
   files into folders, merge documents per folder, and download `archive.zip`.

## Quick start

### Docker

Two profiles are available:

```bash
# Build and run the local source (use this to test your changes)
docker compose --profile dev up --build

# Or run the pre-built ishikii/* images
docker compose --profile prod up
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

Overridable environment variables (all have sensible defaults):

| Variable | Used by | Default | Notes |
|----------|---------|---------|-------|
| `VITE_API_URL` | frontend | `http://localhost:3000` | backend URL the browser calls |
| `DOCXAUTOFILL_CORS_ORIGINS` | backend | `["*"]` | JSON array of allowed origins |
| `DOCXAUTOFILL_HOST` / `DOCXAUTOFILL_PORT` | backend | `0.0.0.0` / `3000` | bind address |

### Local development

**Backend** (Python 3.12, managed via [uv](https://github.com/astral-sh/uv)):

```bash
cd backend/src
uv venv && source .venv/bin/activate
uv pip install -r requirements.txt
uv run python main.py          # listens on 0.0.0.0:3000
```

Backend settings come from `backend/src/config.py` and can be overridden with
`DOCXAUTOFILL_*` env vars (or a `.env` file in `backend/src`).

**Frontend** (React + Vite):

```bash
cd frontend
npm install
npm run dev -- --host          # Vite dev server on :5173
```

The backend URL is read from `VITE_API_URL` (see `frontend/.env.example`),
defaulting to `http://localhost:3000`.

> `frontend/api/` is a small Express server that serves static JSON fixtures for
> offline UI development. It is **not** a drop-in backend — it does not implement
> document generation. See `frontend/api/README.md`.

## API

Backend on port 3000. Errors return `{ detail }` with a `400` (bad input) or
`500` (internal) status.

| Method | Path | Input | Output |
|--------|------|-------|--------|
| POST | `/api/import-nodes` | multipart: `excel`, `words[]` | `{ status, received, nodes[] }` |
| POST | `/api/archive-model` | JSON `{ nodes[], connections[] }` | folder/file tree `{ label, type, children[] }` |
| POST | `/api/process` | multipart: `excel`, `words[]`, `graph` (JSON string `{ nodes[], connections[] }`) | `archive.zip` (streamed) |

`nodes[]`: `{ id, type, data: { label, category? } }` · `connections[]`: `{ source, target }`.

## Code quality

```bash
# Backend
uvx ruff check backend/src     # lint
uvx ruff format backend/src    # format

# Frontend
cd frontend
npm run lint                   # ESLint
npm run typecheck              # tsc --noEmit
npm run format                 # Prettier
```

## Tech stack

- **Backend:** Python 3.12, FastAPI, docxtpl, docxcompose, pandas
- **Frontend:** React 18, TypeScript, Vite, @xyflow/react
- **Tooling:** uv, ruff, mypy, ESLint, Prettier
