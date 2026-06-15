from app.tests.conftest import make_product


def test_create_and_get_product(client):
    p = make_product(client, sku="ABC-1", qty=5, price="12.50")
    assert p["sku"] == "ABC-1"
    assert p["quantity_in_stock"] == 5

    r = client.get(f"/products/{p['id']}")
    assert r.status_code == 200
    assert r.json()["id"] == p["id"]


def test_sku_must_be_unique(client):
    make_product(client, sku="DUP-1")
    r = client.post(
        "/products",
        json={"name": "Other", "sku": "DUP-1", "price": "1.00", "quantity_in_stock": 1},
    )
    assert r.status_code == 409
    assert r.json()["error"]["type"] == "conflict"


def test_negative_quantity_rejected(client):
    r = client.post(
        "/products",
        json={"name": "Bad", "sku": "NEG-1", "price": "1.00", "quantity_in_stock": -3},
    )
    assert r.status_code == 422


def test_negative_price_rejected(client):
    r = client.post(
        "/products",
        json={"name": "Bad", "sku": "NEG-2", "price": "-5.00", "quantity_in_stock": 1},
    )
    assert r.status_code == 422


def test_update_and_delete_product(client):
    p = make_product(client, sku="UPD-1", qty=2)
    r = client.put(f"/products/{p['id']}", json={"quantity_in_stock": 99})
    assert r.status_code == 200
    assert r.json()["quantity_in_stock"] == 99

    r = client.delete(f"/products/{p['id']}")
    assert r.status_code == 204
    assert client.get(f"/products/{p['id']}").status_code == 404


def test_low_stock_filter(client):
    make_product(client, sku="LOW-1", qty=2)
    make_product(client, sku="HIGH-1", qty=500)
    r = client.get("/products", params={"low_stock": True})
    skus = {i["sku"] for i in r.json()["items"]}
    assert "LOW-1" in skus
    assert "HIGH-1" not in skus


def test_get_missing_product_404(client):
    r = client.get("/products/00000000-0000-0000-0000-000000000000")
    assert r.status_code == 404
