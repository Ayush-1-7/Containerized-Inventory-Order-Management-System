# Submission

Production-Ready Containerized Inventory & Order Management System.

| # | Deliverable | Link |
| - | --- | --- |
| 1 | **GitHub Repository (Frontend + Backend)** | https://github.com/Ayush-1-7/Containerized-Inventory-Order-Management-System |
| 2 | **Backend Docker Hub Image Link** | `https://hub.docker.com/r/<dockerhub-username>/ioms-backend` |
| 3 | **Frontend Hosted URL** | `https://<your-frontend>.vercel.app` |
| 4 | **Backend API Hosted URL** | `https://<your-backend>.onrender.com` |

> Items 2–4 require your own Docker Hub / Render / Vercel accounts. Follow
> [DEPLOYMENT.md](./DEPLOYMENT.md) to produce them, then paste the URLs above.

## Quick reference for graders

- **Run locally:** `cp .env.example .env && docker compose up --build`
  → Frontend http://localhost:8080 · API http://localhost:8000 · Docs http://localhost:8000/docs
- **Backend tests:** `cd backend && pip install -r requirements.txt && pytest` (20 tests, no external DB needed)
- **Business rules:** unique SKU/email, non-negative stock, insufficient-stock blocks the order (all-or-nothing), automatic stock decrement, server-side total calculation — see [README.md](./README.md#business-rules-enforced-at-api-and-db-level).

## Tech stack

Python · FastAPI · SQLAlchemy · PostgreSQL · React (Vite) · Docker · Docker Compose.
