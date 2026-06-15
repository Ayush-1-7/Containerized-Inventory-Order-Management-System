# Deployment Guide

This guide takes you from a local repo to four working public links:

1. **GitHub repository**
2. **Backend Docker Hub image**
3. **Live backend API** (Render — free web service + free Postgres)
4. **Live frontend** (Vercel or Netlify)

> Replace every `<you>` / `<repo>` / `<...>` placeholder with your real values.

---

## 0. Prerequisites

- Accounts (all free): [GitHub](https://github.com), [Docker Hub](https://hub.docker.com), [Render](https://render.com), and [Vercel](https://vercel.com) **or** [Netlify](https://netlify.com).
- Docker Desktop installed locally (for building/pushing the image).

---

## 1. Push to GitHub

```bash
cd "Containerized Inventory & Order Management System"
git init
git add .
git commit -m "feat: containerized inventory & order management system"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

Your **GitHub repository link** is `https://github.com/<you>/<repo>`.

---

## 2. Build & push the backend image to Docker Hub

```bash
docker login

# Build (run from the repo root). Use your Docker Hub username as the namespace.
docker build -t <you>/ioms-backend:latest ./backend

docker push <you>/ioms-backend:latest
```

Your **Docker Hub image link** is `https://hub.docker.com/r/<you>/ioms-backend`.

> Apple Silicon / ARM machines: build for the cloud's architecture with
> `docker buildx build --platform linux/amd64 -t <you>/ioms-backend:latest --push ./backend`.

---

## 3. Deploy the backend on Render

### Option A — Blueprint (recommended, provisions DB automatically)

1. Render Dashboard → **New → Blueprint**.
2. Connect your GitHub repo. Render reads [`render.yaml`](./render.yaml) at the repo root.
3. It creates **ioms-backend** (Docker web service) **and** **ioms-db** (free Postgres) and wires `DATABASE_URL` automatically.
4. After the first deploy, set the env var `FRONTEND_ORIGIN` to your frontend URL (you'll get it in step 4) and redeploy. Use a comma-separated list if you have multiple.

### Option B — Manual

1. **New → PostgreSQL** (free). Copy its **Internal Database URL**.
2. **New → Web Service** → select your repo → **Runtime: Docker**, **Root Directory: `backend`**, **Health Check Path: `/health`**.
3. Add environment variables:
   | Key | Value |
   | --- | --- |
   | `DATABASE_URL` | the Postgres URL from step 1 (the app auto-normalizes `postgres://`) |
   | `FRONTEND_ORIGIN` | your frontend URL (fill after step 4) |
   | `LOW_STOCK_THRESHOLD` | `10` |
   | `SEED_ON_STARTUP` | `true` (set to `false` after first boot if you like) |
4. Deploy. Migrations run automatically via the container entrypoint.

Your **backend API URL** is `https://<your-backend>.onrender.com` — verify `https://<your-backend>.onrender.com/health` returns `{"status":"ok"}` and `/docs` loads.

> Free Render services sleep after inactivity; the first request after idle takes ~30–60s to wake.

---

## 4. Deploy the frontend

The API URL is baked in at build time via `VITE_API_BASE_URL`, so set it **before** building.

### Vercel

1. Vercel → **Add New → Project** → import your repo.
2. **Root Directory: `frontend`** (Vercel auto-detects Vite; [`vercel.json`](./frontend/vercel.json) handles SPA routing).
3. **Environment Variables** → add `VITE_API_BASE_URL = https://<your-backend>.onrender.com`.
4. Deploy. Your **frontend URL** is `https://<your-frontend>.vercel.app`.

### Netlify (alternative)

1. Netlify → **Add new site → Import an existing project** → pick the repo.
2. **Base directory: `frontend`**. Build command `npm run build`, publish `frontend/dist` ([`netlify.toml`](./frontend/netlify.toml) covers this + SPA redirects).
3. **Site settings → Environment variables** → `VITE_API_BASE_URL = https://<your-backend>.onrender.com`.
4. Deploy.

---

## 5. Connect the two (CORS)

Go back to Render → backend service → set **`FRONTEND_ORIGIN`** to your exact frontend URL
(e.g. `https://<your-frontend>.vercel.app`) and **redeploy**. Without this, the browser blocks API calls with a CORS error.

---

## 6. Final verification checklist

- [ ] `https://<backend>/health` → `{"status":"ok"}`
- [ ] `https://<backend>/docs` loads Swagger
- [ ] Frontend loads, dashboard shows seeded data
- [ ] Creating a product / customer / order works end-to-end from the UI
- [ ] Placing an order reduces stock; over-ordering is rejected with a clear message
- [ ] No CORS errors in the browser console

Fill the four links into the table in [README.md](./README.md) and submit.
