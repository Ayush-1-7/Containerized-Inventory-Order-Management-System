# Stockpilot — Inventory & Order Management System

A production-ready, fully containerized full-stack application for managing **products, customers, orders, and inventory tracking**.

- **Backend** — Python · FastAPI · SQLAlchemy 2.0 · Alembic · PostgreSQL
- **Frontend** — React 18 (Vite) · TanStack Query · Tailwind CSS · Framer Motion — a premium, responsive, dark/light SaaS UI
- **Infra** — Docker (multi-stage, slim images) · Docker Compose · 12-factor env config

---

## Submission links

| Deliverable | URL |
| --- | --- |
| GitHub repository | `https://github.com/<you>/<repo>` |
| Backend Docker Hub image | `https://hub.docker.com/r/<you>/ioms-backend` |
| Live frontend (Vercel/Netlify) | `https://<your-frontend>.vercel.app` |
| Live backend API (Render) | `https://<your-backend>.onrender.com` |

> Replace the placeholders above after deploying. See [DEPLOYMENT.md](./DEPLOYMENT.md).

---

## Architecture

```mermaid
flowchart LR
  U[Browser] -->|HTTPS| F[React SPA<br/>nginx :8080]
  F -->|REST / JSON<br/>VITE_API_BASE_URL| B[FastAPI<br/>gunicorn+uvicorn :8000]
  B -->|SQLAlchemy| D[(PostgreSQL 16)]
  subgraph Docker Compose
    F
    B
    D
  end
```

- Each service is independently containerized; Compose wires them together.
- The backend runs Alembic migrations on startup and (optionally) seeds demo data.
- PostgreSQL persists to a named volume (`pgdata`).

---

## Quick start (Docker Compose)

Requires Docker Desktop / Docker Engine with Compose v2.

```bash
cp .env.example .env        # then edit POSTGRES_PASSWORD etc.
docker compose up --build
```

| Service | URL |
| --- | --- |
| Frontend | http://localhost:8080 |
| Backend API | http://localhost:8000 |
| Swagger docs | http://localhost:8000/docs |
| Health | http://localhost:8000/health |

`SEED_ON_STARTUP=true` (default in `.env.example`) loads sample products, customers and an order so the dashboard is populated immediately.

To stop and wipe data: `docker compose down -v`.

---

## Local development (without Docker)

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
export DATABASE_URL="postgresql+psycopg2://ioms:ioms@localhost:5432/ioms"
alembic upgrade head
python -m app.seed                  # optional demo data
uvicorn app.main:app --reload --port 8000
```

Run the test suite (uses an in-memory SQLite DB — no Postgres needed):

```bash
cd backend
pytest
```

### Frontend

```bash
cd frontend
cp .env.example .env                # set VITE_API_BASE_URL=http://localhost:8000
npm install
npm run dev                         # http://localhost:5173
```

---

## API reference

Base URL: `/`. All responses are JSON. Errors use a uniform envelope:

```json
{ "error": { "code": 422, "type": "business_rule_violation", "message": "...", "details": { } } }
```

### Products

| Method | Path | Description | Codes |
| --- | --- | --- | --- |
| `GET` | `/products?search=&low_stock=&page=&page_size=` | List (paginated, searchable) | 200 |
| `POST` | `/products` | Create | 201, 409 (dup SKU), 422 |
| `GET` | `/products/{id}` | Get one | 200, 404 |
| `PUT` | `/products/{id}` | Update | 200, 404, 409, 422 |
| `DELETE` | `/products/{id}` | Delete | 204, 404 |

```bash
curl -X POST http://localhost:8000/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Mechanical Keyboard","sku":"KBD-1","price":129.99,"quantity_in_stock":80}'
```

### Customers

| Method | Path | Description | Codes |
| --- | --- | --- | --- |
| `GET` | `/customers?search=&page=&page_size=` | List | 200 |
| `POST` | `/customers` | Create | 201, 409 (dup email), 422 |
| `GET` | `/customers/{id}` | Get one | 200, 404 |
| `DELETE` | `/customers/{id}` | Delete | 204, 404 |

### Orders

| Method | Path | Description | Codes |
| --- | --- | --- | --- |
| `GET` | `/orders?page=&page_size=` | List (nested items + customer) | 200 |
| `POST` | `/orders` | Create order | 201, 404, 422 (insufficient stock) |
| `GET` | `/orders/{id}` | Get one | 200, 404 |
| `DELETE` | `/orders/{id}` | Cancel (restocks inventory) | 204, 404 |

```bash
curl -X POST http://localhost:8000/orders \
  -H "Content-Type: application/json" \
  -d '{"customer_id":"<uuid>","items":[{"product_id":"<uuid>","quantity":2}]}'
```

Insufficient stock returns `422`:

```json
{ "error": { "code": 422, "type": "business_rule_violation",
  "message": "Insufficient stock for 'Monitor': 8 available, 12 requested.",
  "details": { "available": 8, "requested": 12 } } }
```

### Dashboard

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/dashboard/stats` | Totals + low-stock product list |

---

## Business rules (enforced at API **and** DB level)

1. **Unique product SKU** → `409 Conflict`.
2. **Unique customer email** (format-validated) → `409 Conflict`.
3. **Stock can never go negative** — app validation + DB `CHECK` constraint.
4. **Insufficient stock blocks the order** — the whole order is rejected with `422`; **no partial deduction** (all-or-nothing in one transaction, with row locks on Postgres).
5. **Stock auto-decrements** atomically on order creation.
6. **Totals are computed server-side** from price snapshots — client-supplied totals are never trusted.
7. **All input is validated** before processing → `422` with field-level detail.
8. **Cancelling an order restocks** the reserved quantities.

These rules are covered by the automated test suite (`backend/app/tests`).

---

## Environment variables

### Root (`.env`, consumed by Docker Compose)

| Var | Purpose | Example |
| --- | --- | --- |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Database credentials | `ioms` / `secret` / `ioms` |
| `BACKEND_PORT` / `FRONTEND_PORT` / `POSTGRES_PORT` | Host port mappings | `8000` / `8080` / `5432` |
| `FRONTEND_ORIGIN` | Comma-separated CORS allow-list | `http://localhost:8080` |
| `LOW_STOCK_THRESHOLD` | Low-stock cutoff | `10` |
| `SEED_ON_STARTUP` | Seed demo data | `true` |
| `VITE_API_BASE_URL` | API URL baked into the frontend build | `http://localhost:8000` |

### Backend (`backend/.env.example`)

`DATABASE_URL`, `FRONTEND_ORIGIN`, `LOW_STOCK_THRESHOLD`, `SEED_ON_STARTUP`, `PORT`, `WEB_CONCURRENCY`.

### Frontend (`frontend/.env.example`)

`VITE_API_BASE_URL`.

No credentials are hardcoded anywhere — every secret comes from the environment.

---

## Deployment

Free-tier deployment (Render for the API + managed Postgres, Vercel/Netlify for the SPA) and Docker Hub publishing are documented step-by-step in **[DEPLOYMENT.md](./DEPLOYMENT.md)**.

---

## Project structure

```
.
├── backend/            FastAPI app, Alembic migrations, tests, Dockerfile
│   └── app/
│       ├── api/routes/ products, customers, orders, dashboard, health
│       ├── core/       config + db session
│       ├── crud/       business logic (incl. atomic order creation)
│       ├── models/     SQLAlchemy models + portable GUID type
│       ├── schemas/    Pydantic v2 schemas
│       └── tests/      pytest suite
├── frontend/           React + Vite SPA, design system, Dockerfile, nginx
│   └── src/
│       ├── components/ ui/ (design system) + feature components + layout
│       ├── context/    theme provider
│       ├── lib/        api client, query hooks, utils
│       └── pages/      Dashboard, Products, Customers, Orders
├── docker-compose.yml
├── .env.example
├── README.md
└── DEPLOYMENT.md
```

## Frontend highlights

Built to feel like a premium SaaS product: design-token theming with **dark/light mode**, a reusable component system (buttons, cards, modals, data tables, toasts, badges, skeletons, empty states), a **⌘K command palette**, live order building with real-time stock validation, KPI dashboard with charts, route-level code-splitting, smooth Framer-Motion transitions, full keyboard accessibility, and responsive layouts from 320px to 1440px.
