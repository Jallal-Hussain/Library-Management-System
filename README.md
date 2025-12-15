# Library Management System (Next.js 16, App Router)

A fully client-side demo of a modern library management system built with Next.js App Router, Tailwind CSS (shadcn-style UI), and mock data/auth. This README documents the architecture, setup, development workflows, and key features.

## Table of Contents
1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Core Features](#core-features)
4. [Architecture](#architecture)
5. [Data & Mock Backend](#data--mock-backend)
6. [Authentication & Roles](#authentication--roles)
7. [Setup & Installation](#setup--installation)
8. [Running the App](#running-the-app)
9. [Environment Configuration](#environment-configuration)
10. [Development Workflow](#development-workflow)
11. [Linting & Formatting](#linting--formatting)
12. [Testing](#testing)
13. [Build & Deploy](#build--deploy)
14. [Key Pages & Components](#key-pages--components)
15. [Currency Handling](#currency-handling)
16. [Troubleshooting](#troubleshooting)
17. [Contributing](#contributing)
18. [License](#license)

## Overview
This project showcases a comprehensive LMS frontend: circulation, catalog, acquisitions, fines, reports, notifications, approvals, and settings. All data and auth are mocked for demo purposes; no real backend is required.

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI**: Tailwind CSS 4 + shadcn-style components
- **Charts**: recharts
- **Utilities**: local mock data, localStorage-based auth, CSV parsing (mock)

## Core Features
- Mock authentication with role-based navigation (admin, librarian, patron)
- Dashboard with stats, charts, alerts, notifications
- Catalog browsing, book detail pages, holds indicators
- Circulation: checkout, renew, return, lost, fines blocking
- Members: add/edit, approvals, expiry warnings, blocked status
- Fines: view/pay (mock payment gateway)
- Acquisitions: requests, invoices, vendor quote comparison, budget tracking
- Reports: circulation, inventory, overdue, popular; export CSV/PDF
- Settings: fee structures, budgets, integrations, role policies
- Batch import, keyword tagging, advanced search, date range picker

## Architecture
- **App Router** under `app/` with nested routes per feature.
- **Components** under `components/` for shared UI (dialogs, tables, cards).
- **Lib** utilities under `lib/`: auth, data, circulation, membership, search, export/import, mock notifications.
- **Context**: sidebar state, auth context.
- **Mock data** powers all views; no API calls needed.

## Data & Mock Backend
- Source: `lib/mock-data.ts` (users, books, transactions, reservations, branches, stats).
- Types: `lib/types.ts`.
- Mock notifications: `lib/mock-notifications.ts`.
- Import utilities: `lib/import-utils.ts` (mock CSV parsing).

## Authentication & Roles
- Defined in `lib/auth-context.tsx`.
- Stored in `localStorage`; supports login/register/logout.
- Roles: `admin`, `librarian`, `patron`; navigation and permissions adapt per role.
- New registrations can be pending approval.

## Setup & Installation
```bash
pnpm install    # or npm install / yarn install
```

## Running the App
```bash
pnpm dev
# open http://localhost:3000
```

## Environment Configuration
This demo uses only mock/local data; no env vars are required for core flows. If you add APIs, create a `.env.local` and load via `process.env`.

## Development Workflow
- Edit components/pages in `app/` and `components/`.
- Keep types in sync (`lib/types.ts`).
- Use utilities (e.g., `formatCurrency`, `exportToCSV`, `generateTableHTML`) instead of duplicating logic.

## Linting & Formatting
```bash
pnpm lint
pnpm lint --fix   # if desired
```
Tailwind/shadcn classes should follow existing patterns; keep TypeScript strict.

## Testing
No automated tests are included. For contributions, add unit tests (Vitest/Jest) and basic component tests where feasible.

## Build & Deploy
```bash
pnpm build
pnpm start
```
Static assets and mock data are bundled; no external services are required.

## Key Pages & Components
- Dashboard: `app/dashboard/page.tsx`
- Catalog & Book detail: `app/dashboard/catalog/page.tsx`, `app/dashboard/books/[id]/page.tsx`
- Circulation: `app/dashboard/circulation/page.tsx`
- Members & Pending approvals: `app/dashboard/members/page.tsx`, `app/dashboard/members/pending/page.tsx`
- Fines & Payments: `app/dashboard/fines/page.tsx`, `components/payment-gateway-form.tsx`
- Acquisitions & Quotes: `app/dashboard/acquisitions/page.tsx`, `components/vendor-quote-comparison.tsx`
- Reports & Exports: `app/dashboard/reports/page.tsx`
- Settings: `app/dashboard/settings/page.tsx` (fees, budgets, integrations, policies)
- Search: `app/dashboard/search/page.tsx`, `lib/search-utils.ts`
- UI primitives: `components/ui/` (shadcn-style)

## Currency Handling
- Global currency formatter: `formatCurrency` in `lib/circulation-utils.ts`
- Currency: PKR (`Rs.`), conversion applied at **280 PKR per USD** before formatting.
- Use `formatCurrency(amount)` for all monetary display; avoid hardcoding symbols.

## Troubleshooting
- If navigation doesn’t adapt to role, ensure `auth-context` is initialized and `localStorage` is available.
- Mock data not loading: verify imports from `lib/mock-data.ts`.
- Styling issues: confirm Tailwind classes and shadcn components are used consistently.
- Charts not rendering: ensure data arrays are non-empty and recharts components are imported from `recharts`.

## Contributing
1. Fork and branch from `main`.
2. Keep changes typed and lint-clean.
3. Prefer existing utilities/components; avoid duplicate logic.
4. Submit concise PRs with a summary and testing notes.

## License
This project is licensed under the MIT License.