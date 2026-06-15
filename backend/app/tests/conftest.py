import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import get_db
from app.main import app
from app.models import Base


@pytest.fixture()
def client():
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    # Enforce FK + CHECK constraints under SQLite (off by default).
    @event.listens_for(engine, "connect")
    def _fk_pragma(dbapi_conn, _):
        cur = dbapi_conn.cursor()
        cur.execute("PRAGMA foreign_keys=ON")
        cur.close()

    Base.metadata.create_all(engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    def override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def make_product(client, sku="SKU-1", qty=10, price="9.99", name="Widget"):
    r = client.post(
        "/products",
        json={"name": name, "sku": sku, "price": price, "quantity_in_stock": qty},
    )
    assert r.status_code == 201, r.text
    return r.json()


def make_customer(client, email="a@b.com", name="Test User"):
    r = client.post(
        "/customers", json={"full_name": name, "email": email, "phone": "123"}
    )
    assert r.status_code == 201, r.text
    return r.json()
