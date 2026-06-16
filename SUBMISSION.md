# Submission

Production-Ready Containerized Inventory & Order Management System.

| # | Deliverable | Link |
| - | --- | --- |
| 1 | **GitHub Repository (Frontend + Backend)** | https://github.com/Ayush-1-7/Containerized-Inventory-Order-Management-System |
| 2 | **Backend Docker Hub Image Link** | https://hub.docker.com/r/ayush17v/ioms-backend |
| 3 | **Frontend Hosted URL** | https://containerized-inventory-order-manag-psi.vercel.app |
| 4 | **Backend API Hosted URL** | https://ioms-backend-kjvj.onrender.com |

> Pull the image: `docker pull ayush17v/ioms-backend:latest`
> API docs (Swagger): https://ioms-backend-kjvj.onrender.com/docs
>
> Note: both hosts are free tier and sleep when idle — the first request after
> inactivity can take ~30–60s to wake. Refresh once if the first load is slow.

## Quick reference for graders

- **Live app:** https://containerized-inventory-order-manag-psi.vercel.app
- **Live API health:** https://ioms-backend-kjvj.onrender.com/health
- **Run locally:** `cp .env.example .env && docker compose up --build`
  → Frontend http://localhost:8080 · API http://localhost:8000 · Docs http://localhost:8000/docs
- **Backend tests:** `cd backend && pip install -r requirements.txt && pytest` (20 tests, no external DB needed)
- **Business rules:** unique SKU/email, non-negative stock, insufficient-stock blocks the order (all-or-nothing), automatic stock decrement, server-side total calculation — see [README.md](./README.md#business-rules-enforced-at-api-and-db-level).

## Tech stack

Python · FastAPI · SQLAlchemy · PostgreSQL · React (Vite) · Docker · Docker Compose.
