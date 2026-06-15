from app.tests.conftest import make_customer


def test_create_and_get_customer(client):
    c = make_customer(client, email="jane@example.com", name="Jane")
    r = client.get(f"/customers/{c['id']}")
    assert r.status_code == 200
    assert r.json()["email"] == "jane@example.com"


def test_email_must_be_unique(client):
    make_customer(client, email="dup@example.com")
    r = client.post(
        "/customers",
        json={"full_name": "Another", "email": "dup@example.com", "phone": "9"},
    )
    assert r.status_code == 409
    assert r.json()["error"]["type"] == "conflict"


def test_invalid_email_rejected(client):
    r = client.post(
        "/customers", json={"full_name": "Bad", "email": "not-an-email", "phone": "9"}
    )
    assert r.status_code == 422


def test_delete_customer(client):
    c = make_customer(client, email="del@example.com")
    assert client.delete(f"/customers/{c['id']}").status_code == 204
    assert client.get(f"/customers/{c['id']}").status_code == 404
