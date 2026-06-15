"""Idempotent seed script for instant demo data.

Run directly:  python -m app.seed
Or set SEED_ON_STARTUP=true and it runs via the entrypoint.
"""
from decimal import Decimal

from sqlalchemy import select

from app.core.database import SessionLocal
from app.models import Customer, Order, OrderItem, OrderStatus, Product

PRODUCTS = [
    {"name": "Aeron Ergonomic Chair", "sku": "CHR-AER-001", "price": Decimal("1299.00"), "quantity_in_stock": 24},
    {"name": "Standing Desk Pro 140", "sku": "DSK-STD-140", "price": Decimal("749.50"), "quantity_in_stock": 12},
    {"name": "Mechanical Keyboard K8", "sku": "KBD-MEC-K8", "price": Decimal("129.99"), "quantity_in_stock": 80},
    {"name": "4K USB-C Monitor 27\"", "sku": "MON-4K-27", "price": Decimal("389.00"), "quantity_in_stock": 8},
    {"name": "Noise-Cancelling Headset", "sku": "AUD-NC-700", "price": Decimal("349.00"), "quantity_in_stock": 5},
    {"name": "Wireless Mouse MX", "sku": "MOU-MX-3", "price": Decimal("99.00"), "quantity_in_stock": 140},
    {"name": "Laptop Stand Aluminium", "sku": "STD-LAP-AL", "price": Decimal("59.00"), "quantity_in_stock": 3},
    {"name": "USB-C Docking Station", "sku": "DOC-USB-C", "price": Decimal("219.00"), "quantity_in_stock": 30},
]

CUSTOMERS = [
    {"full_name": "Ava Thompson", "email": "ava.thompson@example.com", "phone": "+1-202-555-0118"},
    {"full_name": "Liam Carter", "email": "liam.carter@example.com", "phone": "+1-202-555-0143"},
    {"full_name": "Sofia Nguyen", "email": "sofia.nguyen@example.com", "phone": "+1-202-555-0177"},
    {"full_name": "Noah Patel", "email": "noah.patel@example.com", "phone": "+1-202-555-0190"},
]


def seed() -> None:
    db = SessionLocal()
    try:
        if db.execute(select(Product).limit(1)).scalars().first() is not None:
            print("[seed] Data already present — skipping.")
            return

        products = [Product(**p) for p in PRODUCTS]
        customers = [Customer(**c) for c in CUSTOMERS]
        db.add_all(products + customers)
        db.flush()

        # One sample order so the dashboard isn't empty.
        kbd, mouse = products[2], products[5]
        order = Order(customer_id=customers[0].id, status=OrderStatus.CONFIRMED.value)
        for prod, qty in [(kbd, 2), (mouse, 1)]:
            line_total = Decimal(str(prod.price)) * qty
            order.items.append(
                OrderItem(
                    product_id=prod.id,
                    quantity=qty,
                    unit_price=Decimal(str(prod.price)),
                    line_total=line_total,
                )
            )
            prod.quantity_in_stock -= qty
        order.total_amount = sum((i.line_total for i in order.items), Decimal("0.00"))
        db.add(order)

        db.commit()
        print(f"[seed] Inserted {len(products)} products, {len(customers)} customers, 1 order.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
