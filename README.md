# Library Management System

A full-stack library management system built as a monorepo with a Node.js/Express backend and a Next.js frontend. The project includes catalog management, member workflows, circulation, acquisitions, fines, reports, notifications, and admin settings.

## Project overview

This repository contains two major apps:

- Backend: Express REST API with MongoDB and JWT-based authentication
- Frontend: Next.js application with TypeScript and a modern dashboard UI

The backend exposes a structured API for library operations, while the frontend provides a complete management dashboard for librarians, admins, and members.

## Architecture

```text
library-management-system/
├── backend/
│   ├── src/
│   ├── scripts/
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── public/
│   ├── .gitignore
│   ├── README.md
│   ├── package.json
│   └── next.config.mjs
├── README.md
└── .git/
```

## Tech stack

### Backend
- Node.js 18+
- Express.js
- MongoDB with Mongoose
- JWT authentication
- CORS, Helmet, Morgan, dotenv
- Nodemon for local development

### Frontend
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- shadcn-style UI primitives
- Recharts for analytics/dashboard charts

## Main features

- Book catalog and metadata management
- User and member management
- Authentication and role-based access
- Borrowing, returning, and return tracking
- Reservations and overdue/fine processing
- Acquisitions and vendor workflows
- Reporting, dashboards, and exports
- Settings, branches, notifications, and integrations

## Backend structure

The backend is organized under `backend/src`:

- `app.js` — Express app setup, CORS, middleware, and route registration
- `config/db.js` — MongoDB connection logic
- `controllers/` — request handling logic
- `middleware/` — auth, validation, and error handling
- `models/` — Mongoose schemas
- `routes/` — API route definitions
- `utils/` — utility functions

## Frontend structure

The frontend is a Next.js App Router project:

- `app/` — pages and route groups
- `components/` — reusable UI and feature components
- `lib/` — shared utilities, types, mocked data, and auth logic
- `hooks/` — UI hooks
- `public/` — static assets

## Environment configuration

### Backend
Copy the example environment file before running the API:

```bash
cd backend
cp .env.example .env
```

Then update values like:

- `PORT`
- `NODE_ENV`
- `MONGO_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `CLIENT_URL`

## Local setup

### 1) Install backend dependencies

```bash
cd backend
npm install
```

### 2) Install frontend dependencies

```bash
cd frontend
npm install
```

## Run the project

### Start backend

```bash
cd backend
npm run dev
```

The API runs at:

- http://localhost:5000/api
- http://localhost:5000/api/health

### Start frontend

```bash
cd frontend
npm run dev
```

The web app runs at:

- http://localhost:3000

## Useful scripts

### Backend
```bash
npm run dev
npm start
npm run seed
```

### Frontend
```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Notes

- The backend already includes environment files and gitignore handling inside its own folder.
- The frontend also has its own local documentation and project setup.
- This repository is designed for a development workflow where backend and frontend are started separately in their own directories.

## Recommended next step

If you want to make the repository easier for new contributors to manage, the next useful root-level additions would be:

1. A root-level .env.example if you want a single environment template for the entire monorepo
2. A root-level setup script or Makefile for launching both apps together

These are optional and should be added only if they fit your deployment and team workflow.
