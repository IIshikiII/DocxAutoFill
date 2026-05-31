# Offline dev-mock server

This directory contains a lightweight Express server (`server.js`) that serves
static JSON fixtures instead of the real Python backend.

**Use it only for frontend development when the Python backend is unavailable.**

```bash
# From the frontend/ directory
npm run api       # starts mock server on :3000
npm run start:all # starts both mock server and Vite dev server
```

The mock data files mirror the shape of real API responses:

| File | Endpoint |
|------|----------|
| `greenNodes.json` | `/api/import-nodes` (green nodes) |
| `blueNodes.json` | `/api/import-nodes` (blue nodes) |
| `violetNodes.json` | `/api/import-nodes` (violet nodes) |
| `orangeNode.json` | `/api/import-nodes` (orange node) |
| `archiveModel.json` | `/api/archive-model` |

**Note:** The ultimate fate of this mock (keep vs. delete) is tracked in
Stage 5 of `docs/REFACTORING_PLAN.md`.
