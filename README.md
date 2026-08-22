# Vendari

Vendari is a business operations platform designed to help retailers and service businesses manage sales, inventory, and reporting from a single interface. The current codebase includes a Next.js frontend and a Django API backend that is being integrated in parallel as part of the migration.

## Current project status

- Frontend: Next.js app in the root project
- Backend: Django API under active migration/integration
- State: In progress, not yet finalized as a single unified stack
- Scope: Rename and cleanup pass only; no production logic changes were made

## Repository layout

- `app/` — frontend routes and dashboard UI
- `components/` — reusable UI and dashboard components
- `lib/` — shared utilities and integration helpers
- `scripts/` — operational scripts and test utilities
- `docs/archive/` — historical planning and status documents from the earlier project phase

## Local development

```bash
npm install
npm run dev
```

## Backend migration note

The project is in a transition from the earlier product branding and setup docs toward a more modular architecture. The frontend is active and the Django API backend is being aligned with it as part of the migration work.

## Documentation

Historical planning and project status notes have been archived in `docs/archive/` to keep the root directory clean while preserving the project record.

## Brand

The product name has been updated to Vendari for the active application surfaces and project metadata.
