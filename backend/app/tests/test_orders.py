from app.tests.conftest import make_customer, make_product


def test_create_order_reduces_stock_and_computes_total(client):
    cust = make_customer(client, email="o1@example.com")
    p1 = make_product(client, sku="O-A", qty=10, price="10.00")
    p2 = make_product(client, sku="O-B", qty=5, price="2.50")

    r = client.post(
        "/orders",
        json={
            "customer_id": cust["id"],
            "items": [
                {"product_id": p1["id"], "quantity": 2},
                {"product_id": p2["id"], "quantity": 4},
            ],
        },
    )
    assert r.status_code == 201, r.text
    order = r.json()

    # total = 2*10.00 + 4*2.50 = 30.00 (computed server-side)
    assert float(order["total_amount"]) == 30.00
    assert len(order["items"]) == 2

    # Stock reduced atomically.
    assert client.get(f"/products/{p1['id']}").json()["quantity_in_stock"] == 8
    assert client.get(f"/products/{p2['id']}").json()["quantity_in_stock"] == 1


def test_order_rejected_when_insufficient_stock(client):
    cust = make_customer(client, email="o2@example.com")
    p = make_product(client, sku="O-LOW", qty=3, price="5.00")

    r = client.post(
        "/orders",
        json={"customer_id": cust["id"], "items": [{"product_id": p["id"], "quantity": 5}]},
    )
    assert r.status_code == 422
    body = r.json()["error"]
    assert body["type"] == "business_rule_violation"
    assert body["details"]["available"] == 3
    assert body["details"]["requested"] == 5

    # Stock must be untouched after a rejected order.
    assert client.get(f"/products/{p['id']}").json()["quantity_in_stock"] == 3


def test_multi_line_order_is_all_or_nothing(client):
    cust = make_customer(client, email="o3@example.com")
    ok = make_product(client, sku="O-OK", qty=10, price="1.00")
    short = make_product(client, sku="O-SHORT", qty=1, price="1.00")

    r = client.post(
        "/orders",
        json={
            "customer_id": cust["id"],
            "items": [
                {"product_id": ok["id"], "quantity": 2},
                {"product_id": short["id"], "quantity": 5},
            ],
        },
    )
    assert r.status_code == 422
    # The valid line must NOT have been deducted (no partial deduction).
    assert client.get(f"/products/{ok['id']}").json()["quantity_in_stock"] == 10


def test_order_with_unknown_customer_404(client):
    p = make_product(client, sku="O-NC", qty=5)
    r = client.post(
        "/orders",
        json={
            "customer_id": "00000000-0000-0000-0000-000000000000",
            "items": [{"product_id": p["id"], "quantity": 1}],
        },
    )
    assert r.status_code == 404


def test_zero_quantity_rejected(client):
    cust = make_customer(client, email="o4@example.com")
    p = make_product(client, sku="O-ZERO", qty=5)
    r = client.post(
        "/orders",
        json={"customer_id": cust["id"], "items": [{"product_id": p["id"], "quantity": 0}]},
    )
    assert r.status_code == 422


def test_delete_order_restocks(client):
    cust = make_customer(client, email="o5@example.com")
    p = make_product(client, sku="O-RES", qty=10, price="1.00")
    order = client.post(
        "/orders",
        json={"customer_id": cust["id"], "items": [{"product_id": p["id"], "quantity": 4}]},
    ).json()
    assert client.get(f"/products/{p['id']}").json()["quantity_in_stock"] == 6

    assert client.delete(f"/orders/{order['id']}").status_code == 204
    assert client.get(f"/products/{p['id']}").json()["quantity_in_stock"] == 10


def test_cannot_delete_product_in_order(client):
    cust = make_customer(client, email="o6@example.com")
    p = make_product(client, sku="O-DEL", qty=10, price="1.00")
    client.post(
        "/orders",
        json={"customer_id": cust["id"], "items": [{"product_id": p["id"], "quantity": 1}]},
    )
    r = client.delete(f"/products/{p['id']}")
    assert r.status_code == 409


def test_cannot_delete_customer_with_orders(client):
    cust = make_customer(client, email="o7@example.com")
    p = make_product(client, sku="O-CDEL", qty=10, price="1.00")
    client.post(
        "/orders",
        json={"customer_id": cust["id"], "items": [{"product_id": p["id"], "quantity": 1}]},
    )
    r = client.delete(f"/customers/{cust['id']}")
    assert r.status_code == 409


def test_dashboard_stats(client):
    make_customer(client, email="d1@example.com")
    make_product(client, sku="D-LOW", qty=1)
    make_product(client, sku="D-HIGH", qty=999)
    r = client.get("/dashboard/stats")
    assert r.status_code == 200
    data = r.json()
    assert data["total_products"] == 2
    assert data["total_customers"] == 1
    assert any(p["sku"] == "D-LOW" for p in data["low_stock_products"])
