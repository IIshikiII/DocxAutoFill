# DocxAutoFill

A tool for **bulk-filling Word templates (.docx) with data from Excel** via a
visual node editor. No code required: log in, upload your templates and
spreadsheet, connect nodes on the canvas to map columns to template variables,
and download a ZIP archive with all generated documents organised into folders
(and merged into one file per template). The whole app is multi-user with
roles, and the UI is available in Russian and English.

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

1. **Log in** — the whole app is behind authentication (see below).
2. **Import** — upload Excel + Word templates; the backend reads the columns and
   template variables and returns the canvas nodes.
3. **Connect** green nodes to blue/violet/orange nodes to define the mapping.
   You can save a wiring as a named **connection template** and re-apply it after
   a fresh import.
4. **Archive model** (optional) — preview the folder/file tree before generating,
   and edit output names in the tree.
5. **Запуск** — render every template for every spreadsheet row, group the files
   into folders, merge each template's copies into one file, and download
   `archive.zip`. Progress streams live (a fill phase, then a separate bar per
   merge).

## Features

- **Visual node mapping** — no code; connect columns to template variables.
- **Folder grouping & per-template merge** — output is split into folders by a
  chosen column and each template's documents are concatenated into one file.
- **Configurable archive names** — merged folder/file names are overridable, and
  output names are editable segment-by-segment in the archive-model tree (Excel
  substitutions and extensions stay frozen).
- **Connection templates** — save and re-apply a wiring; matched by node
  signature so it survives re-imports. Templates are per-user.
- **Authentication & roles** — server-side sessions, an admin who manages users.
- **Live streaming progress** — Server-Sent Events with a fill phase and a fresh
  progress bar for each template merge.
- **RU/EN interface** — language switch in the top bar and on the login screen.

## Quick start

### Docker

Configuration comes from a root `.env` file:

```bash
cp .env.example .env          # then edit the secrets (admin + DB passwords)
```

Two profiles are available (both include a PostgreSQL service with a persistent
`pgdata` volume):

```bash
# Build and run the local source (use this to test your changes)
docker compose --profile dev up --build

# Or run the pre-built ishikii/* images
docker compose --profile prod up
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Default login (override in `.env`): `admin` / `change-me-now-please`

The `dev` profile builds for the host architecture, so it runs natively on both
Intel and Apple Silicon. The pre-built `prod` images are multi-architecture
(`amd64` + `arm64`).

> Deploying to a server (nginx + HTTPS, including a Let's Encrypt certificate on
> a bare IP with automatic renewal, and an update-delivery script) is documented
> separately in **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** (`deploy/` +
> `scripts/release.sh` / `scripts/deploy.sh`).

#### Building the published images (multi-arch)

```bash
# Build + push amd64 and arm64 manifests (uses docker-bake.hcl)
scripts/build-images.sh
REGISTRY=me TAG=v1.0.0 scripts/build-images.sh

# Build just the host arch and load it locally (for testing, no push)
PUSH=0 scripts/build-images.sh
```

CI also publishes multi-arch images on version tags via
`.github/workflows/release-images.yml` (needs `DOCKERHUB_USERNAME` /
`DOCKERHUB_TOKEN` secrets).

#### Configuration

All settings have sensible defaults; override via env (compose reads the root
`.env`). The most relevant ones:

| Variable | Used by | Default | Notes |
|----------|---------|---------|-------|
| `VITE_API_URL` | frontend | `http://localhost:3000` | backend URL the browser calls |
| `DOCXAUTOFILL_DATABASE_URL` | backend | `sqlite:///./data/app.db` | SQLAlchemy URL; compose sets a PostgreSQL URL |
| `DOCXAUTOFILL_ADMIN_USERNAME` / `_PASSWORD` | backend | `admin` / `change-me-now` | bootstrap admin, created on first start |
| `DOCXAUTOFILL_COOKIE_SECURE` | backend | `false` | set `true` when serving over HTTPS |
| `DOCXAUTOFILL_CORS_ORIGINS` | backend | `["http://localhost:5173"]` | JSON array; cannot be `"*"` with credentials |
| `DOCXAUTOFILL_HOST` / `DOCXAUTOFILL_PORT` | backend | `0.0.0.0` / `3000` | bind address |
| `POSTGRES_USER` / `_PASSWORD` / `_DB` | compose | `docxautofill` | Postgres credentials (compose builds `DATABASE_URL`) |

### Local development

**Backend** (Python 3.12, managed via [uv](https://github.com/astral-sh/uv)):

```bash
cd backend/src
uv venv && source .venv/bin/activate
uv pip install -r requirements.txt
uv run python main.py          # listens on 0.0.0.0:3000
```

With no `DATABASE_URL` set, the backend creates a local SQLite database
(`backend/src/data/app.db`) and seeds the bootstrap admin on first start.
Settings come from `backend/src/config.py` and can be overridden with
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
> document generation or auth. See `frontend/api/README.md`.

## Authentication & roles

The whole app sits behind authentication (added in the "Stage 12" work):

- **Sessions** are server-side. A login issues an opaque token in an
  **httpOnly + SameSite** cookie; only its SHA-256 hash is stored in the
  database, so a database leak does not yield valid sessions. Reloading the page
  restores the session via `/api/auth/me`.
- **Passwords** are hashed with **argon2id**. Login is rate-limited
  (defense-in-depth against brute force) and returns generic errors (no user
  enumeration).
- **Roles**: a regular `user` owns their own connection templates; an `admin`
  can create/delete users, reset passwords, and view/delete any user's
  templates. A bootstrap admin is created from `DOCXAUTOFILL_ADMIN_*` on startup
  if it does not exist.
- **Persistence** uses SQLAlchemy 2.0 — PostgreSQL under docker-compose, SQLite
  locally — selected by `DOCXAUTOFILL_DATABASE_URL`. Behind nginx, set
  `DOCXAUTOFILL_COOKIE_SECURE=true` and explicit `DOCXAUTOFILL_CORS_ORIGINS`.

## Internationalization

The UI ships in **Russian and English** via a small dependency-free i18n layer
(`frontend/src/i18n/`): a flat key dictionary with O(1) lookup, persisted in
`localStorage`. Domain data from the backend (node labels, archive folder/file
names) and server-sent messages are intentionally not translated.

## API

Backend on port 3000. All `/api/*` endpoints require an authenticated session
**except** `/api/auth/*`; `/api/admin/*` additionally require the `admin` role.
Errors return `{ detail }` with `400` (bad input), `401`/`403` (auth), or `500`
(internal) status.

### Generation

| Method | Path | Input | Output |
|--------|------|-------|--------|
| POST | `/api/import-nodes` | multipart: `excel`, `words[]` | `{ status, received, nodes[] }` |
| POST | `/api/archive-model` | JSON `{ nodes[], connections[], options? }` | folder/file tree `{ label, type, children[], edit? }` |
| POST | `/api/process` | multipart: `excel`, `words[]`, `graph` (JSON string `{ nodes[], connections[], options? }`) | `archive.zip` (streamed) |
| POST | `/api/process/stream` | same as `/process` | Server-Sent Events: `progress` `{ done, total, percent, message, phase, label }`, then `done` `{ filename, data }` (base64 zip), or `error` `{ detail }` |

### Connection templates (per user)

| Method | Path | Input | Output |
|--------|------|-------|--------|
| GET | `/api/templates` | — | `{ templates: [{ name, connection_count }] }` |
| POST | `/api/templates` | JSON `{ name, graph }` | `{ name, connection_count }` |
| POST | `/api/templates/apply` | JSON `{ name, nodes[] }` | `{ connections[], matched, total }` |
| DELETE | `/api/templates?name=…` | query `name` | `{ status, name }` |

### Auth & admin

| Method | Path | Input | Output |
|--------|------|-------|--------|
| POST | `/api/auth/login` | JSON `{ username, password }` | user + sets session cookie |
| POST | `/api/auth/logout` | — | `{ status }` + clears cookie |
| GET | `/api/auth/me` | — (cookie) | current user, or `401` |
| GET | `/api/admin/users` | — (admin) | `[{ id, username, role, is_active, template_count }]` |
| POST | `/api/admin/users` | JSON `{ username, password }` (admin) | created user |
| POST | `/api/admin/users/{id}/password` | JSON `{ password }` (admin) | `{ status }` |
| DELETE | `/api/admin/users/{id}` | — (admin) | `{ status }` (not self / last admin) |
| GET | `/api/admin/users/{id}/templates` | — (admin) | `[{ id, name, connection_count }]` |
| DELETE | `/api/admin/templates/{id}` | — (admin) | `{ status }` |

### Payload shapes

`nodes[]`: `{ id, type, data: { label, category? } }` · `connections[]`: `{ source, target }`.

`options?` (optional, inside the graph JSON): `{ merged_dir_name?, merged_file_template? }` — configurable
archive names. Omitted/empty fields fall back to the server defaults (see `config`). In `merged_file_template`
the `<…>` placeholder is replaced with the source template's base name. Each rendered document is written
directly into its grouping folder (`<group>/<file>.docx`).

Names are edited **in the archive-model tree** (after "Создать модель архива"), nowhere else. For each editable
item the response carries `edit = { target, segments[] }`: `target` says where the edit applies
(`merged_dir` / `merged_file` / `file` with a `nodeId`); `segments[]` is an ordered mix of `text` (editable),
`lock` (an Excel substitution — frozen; carries the display `value` and the original `<…>` `token`) and `ext`
(the file extension — frozen). The frontend lets you edit only the `text` segments, so the substituted text and
the extension can never be changed. Per-row file names freeze the Excel substitution; **merged-file names**
freeze only the extension and are otherwise fully editable. Each merged file is named per template — by default
the template's own name is substituted in (`Объединённый_<template>.docx`), so the name says which template was
merged; a manual rename is stored per template on its violet node (`data.merged_label`).

For long jobs the UI calls `/api/process/stream`, which reports live progress via Server-Sent Events and returns
the finished archive in the final `done` event. Progress is **phased**: `phase: "fill"` while templates are
rendered (one bar across all rows), then `phase: "merge"` with a fresh bar (`done`/`total` reset, `label` =
template) for each combined file. The non-streaming `/api/process` returns the archive directly.

## Code quality & tests

```bash
# Backend (from backend/)
uv run ruff check src tests        # lint
uv run ruff format src tests       # format
uv run mypy                        # type-check
uv run pytest                      # tests (domain + TestClient integration)

# Frontend (from frontend/)
npm run lint                       # ESLint
npm run typecheck                  # tsc --noEmit
npm run test                       # Vitest
npm run format                     # Prettier
```

CI runs both suites on every push (`.github/workflows/ci.yml`).

## Tech stack

- **Backend:** Python 3.12, FastAPI, SQLAlchemy 2.0 (PostgreSQL in Docker /
  SQLite locally), argon2-cffi, docxtpl, docxcompose, pandas, pydantic-settings
- **Frontend:** React 18, TypeScript, Vite, @xyflow/react, custom RU/EN i18n
- **Tooling:** uv, ruff, mypy, pytest · ESLint, Prettier, Vitest
- **Deploy:** Docker Compose, nginx, Let's Encrypt (lego, short-lived IP certs)
