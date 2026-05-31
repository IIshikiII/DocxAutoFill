# DocxAutoFill

A tool for **bulk-filling Word templates (.docx) with data from Excel** via a
visual node editor. No code required: upload your templates and spreadsheet,
connect nodes on the canvas to map columns to template variables, and download
a ZIP archive with all generated documents organised into folders.

## How it works

| Node colour | Meaning |
|-------------|---------|
| 🟢 Green | Excel column (data source) |
| 🔵 Blue | Template variable (`{{ … }}` inside a .docx file) |
| 🟣 Violet | Word file / output filename pattern (`<название>`) |
| 🟠 Orange | Folder-grouping key |

Connect green → blue/violet/orange to define the mapping, then click **Запуск**
to receive a ZIP with documents rendered for every row of the spreadsheet.

## Quick start

### Docker (pre-built images)

```bash
docker compose up
```

- Frontend: http://localhost:5173  
- Backend API: http://localhost:3000

### Local development

**Backend** (Python 3.12, managed via [uv](https://github.com/astral-sh/uv)):

```bash
cd backend/src
uv venv && source .venv/bin/activate
uv pip install -r requirements.txt
uv run python main.py          # listens on 0.0.0.0:3000
```

**Frontend** (React + Vite):

```bash
cd frontend
npm install
npm run dev -- --host          # Vite dev server on :5173
```

Optional — run the offline Express mock instead of the Python backend:

```bash
cd frontend && npm run api     # mock server on :3000
```

## API

| Method | Path | Input | Output |
|--------|------|-------|--------|
| POST | `/api/import-nodes` | multipart: `excel`, `words[]` | `{ status, nodes[] }` |
| POST | `/api/archive-model` | JSON `{ nodes[], connections[] }` | folder-tree preview |
| POST | `/api/process` | JSON `{ nodes[], connections[] }` | `archive.zip` |

## Code quality

```bash
# Backend
uvx ruff check backend/src     # lint
uvx ruff format backend/src    # format

# Frontend
cd frontend
npm run lint                   # ESLint
npm run format                 # Prettier
```

## Tech stack

- **Backend:** Python 3.12, FastAPI, docxtpl, docxcompose, pandas
- **Frontend:** React 18, TypeScript, Vite, @xyflow/react
- **Tooling:** ruff, mypy, ESLint, Prettier
