from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud import order as crud
from app.models import Order
from app.schemas.common import Page
from app.schemas.customer import CustomerOut
from app.schemas.order import OrderCreate, OrderItemOut, OrderOut

router = APIRouter(prefix="/orders", tags=["orders"])


def _serialize(order: Order) -> OrderOut:
    return OrderOut(
        id=order.id,
        customer_id=order.customer_id,
        status=order.status,
        total_amount=order.total_amount,
        created_at=order.created_at,
        customer=CustomerOut.model_validate(order.customer),
        items=[
            OrderItemOut(
                id=it.id,
                product_id=it.product_id,
                product_name=it.product.name if it.product else "(deleted product)",
                product_sku=it.product.sku if it.product else "—",
                quantity=it.quantity,
                unit_price=it.unit_price,
                line_total=it.line_total,
            )
            for it in order.items
        ],
    )


@router.get("", response_model=Page[OrderOut])
def list_orders(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
):
    items, total = crud.list_orders(db, page=page, page_size=page_size)
    return Page(
        items=[_serialize(o) for o in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(payload: OrderCreate, db: Session = Depends(get_db)):
    return _serialize(crud.create(db, payload))


@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: UUID, db: Session = Depends(get_db)):
    return _serialize(crud.get(db, order_id))


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: UUID, db: Session = Depends(get_db)):
    crud.delete(db, order_id)
