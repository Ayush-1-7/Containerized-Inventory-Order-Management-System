from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.errors import BusinessRuleError, NotFoundError
from app.models import Customer, Order, OrderItem, OrderStatus, Product
from app.schemas.order import OrderCreate


def get(db: Session, order_id: UUID) -> Order:
    order = db.get(Order, order_id)
    if order is None:
        raise NotFoundError("Order not found.")
    return order


def list_orders(db: Session, *, page: int = 1, page_size: int = 50):
    total = db.execute(select(func.count()).select_from(Order)).scalar_one()
    stmt = (
        select(Order)
        .order_by(Order.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    items = list(db.execute(stmt).scalars().unique().all())
    return items, total


def create(db: Session, payload: OrderCreate) -> Order:
    """Create an order atomically.

    Steps (all within one transaction):
      1. Verify the customer exists.
      2. Merge duplicate line items by product.
      3. Lock each product row (FOR UPDATE on Postgres) and verify stock.
      4. If ANY line is short, abort the whole order (422) — no partial deduction.
      5. Decrement stock, compute line totals + order total server-side, persist.
    """
    customer = db.get(Customer, payload.customer_id)
    if customer is None:
        raise NotFoundError("Customer not found.")

    # Merge duplicate product references so a product requested twice is summed.
    requested: dict[UUID, int] = {}
    for item in payload.items:
        requested[item.product_id] = requested.get(item.product_id, 0) + item.quantity

    order = Order(customer_id=customer.id, status=OrderStatus.CONFIRMED.value)
    total = Decimal("0.00")

    for product_id, qty in requested.items():
        stmt = select(Product).where(Product.id == product_id)
        # Row-level lock prevents oversell under concurrency (ignored by SQLite).
        if db.bind.dialect.name == "postgresql":
            stmt = stmt.with_for_update()
        product = db.execute(stmt).scalars().first()

        if product is None:
            db.rollback()
            raise NotFoundError(f"Product {product_id} not found.")

        if product.quantity_in_stock < qty:
            db.rollback()
            raise BusinessRuleError(
                f"Insufficient stock for '{product.name}': "
                f"{product.quantity_in_stock} available, {qty} requested.",
                details={
                    "product_id": str(product.id),
                    "product_name": product.name,
                    "available": product.quantity_in_stock,
                    "requested": qty,
                },
            )

        unit_price = Decimal(str(product.price))
        line_total = unit_price * qty
        total += line_total
        product.quantity_in_stock -= qty

        order.items.append(
            OrderItem(
                product_id=product.id,
                quantity=qty,
                unit_price=unit_price,
                line_total=line_total,
            )
        )

    order.total_amount = total
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


def delete(db: Session, order_id: UUID, *, restock: bool = True) -> None:
    """Cancel/delete an order. By default returns reserved stock to inventory."""
    order = get(db, order_id)
    if restock and order.status == OrderStatus.CONFIRMED.value:
        for item in order.items:
            product = db.get(Product, item.product_id)
            if product is not None:
                product.quantity_in_stock += item.quantity
    db.delete(order)
    db.commit()
