from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.errors import ConflictError, NotFoundError
from app.models import Customer
from app.schemas.customer import CustomerCreate


def _ensure_email_unique(db: Session, email: str) -> None:
    stmt = select(Customer).where(func.lower(Customer.email) == email.lower())
    if db.execute(stmt).scalars().first() is not None:
        raise ConflictError(f"A customer with email '{email}' already exists.")


def get(db: Session, customer_id: UUID) -> Customer:
    customer = db.get(Customer, customer_id)
    if customer is None:
        raise NotFoundError("Customer not found.")
    return customer


def list_customers(
    db: Session, *, page: int = 1, page_size: int = 50, search: str | None = None
):
    stmt = select(Customer)
    count_stmt = select(func.count()).select_from(Customer)
    if search:
        pattern = f"%{search.lower()}%"
        cond = or_(
            func.lower(Customer.full_name).like(pattern),
            func.lower(Customer.email).like(pattern),
        )
        stmt = stmt.where(cond)
        count_stmt = count_stmt.where(cond)

    total = db.execute(count_stmt).scalar_one()
    stmt = stmt.order_by(Customer.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    items = list(db.execute(stmt).scalars().all())
    return items, total


def create(db: Session, payload: CustomerCreate) -> Customer:
    _ensure_email_unique(db, str(payload.email))
    customer = Customer(
        full_name=payload.full_name,
        email=str(payload.email),
        phone=payload.phone,
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


def delete(db: Session, customer_id: UUID) -> None:
    customer = get(db, customer_id)
    db.delete(customer)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ConflictError(
            "Cannot delete a customer who has existing orders. "
            "Delete their orders first."
        )
