#!/usr/bin/env sh
set -e

echo "[entrypoint] Waiting for database..."
python - <<'PY'
import time, sys
from sqlalchemy import create_engine, text
from app.core.config import settings

for attempt in range(30):
    try:
        engine = create_engine(settings.DATABASE_URL)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("[entrypoint] Database is ready.")
        break
    except Exception as exc:  # noqa: BLE001
        print(f"[entrypoint] DB not ready ({attempt+1}/30): {exc}")
        time.sleep(2)
else:
    print("[entrypoint] Database never became ready.")
    sys.exit(1)
PY

echo "[entrypoint] Running migrations..."
alembic upgrade head

if [ "${SEED_ON_STARTUP}" = "true" ]; then
    echo "[entrypoint] Seeding demo data..."
    python -m app.seed
fi

echo "[entrypoint] Starting server..."
exec gunicorn app.main:app \
    --worker-class uvicorn.workers.UvicornWorker \
    --workers "${WEB_CONCURRENCY:-2}" \
    --bind "0.0.0.0:${PORT:-8000}" \
    --access-logfile - \
    --error-logfile -
