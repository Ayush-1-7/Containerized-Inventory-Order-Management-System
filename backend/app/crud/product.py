from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.errors import ConflictError, NotFoundError
from app.models import Product
from app.schemas.product import ProductCreate, ProductUpdate


def _ensure_sku_unique(db: Session, sku: str, exclude_id: UUID | None = None) -> None:
    stmt = select(Product).where(func.lower(Product.sku) == sku.lower())
    if exclude_id is not None:
        stmt = stmt.where(Product.id != exclude_id)
    if db.execute(stmt).scalars().first() is not None:
        raise ConflictError(f"A product with SKU '{sku}' already exists.")


def get(db: Session, product_id: UUID) -> Product:
    product = db.get(Product, product_id)
    if product is None:
        raise NotFoundError("Product not found.")
    return product


def list_products(
    db: Session,
    *,
    page: int = 1,
    page_size: int = 50,
    search: str | None = None,
    low_stock: bool = False,
    low_stock_threshold: int = 10,
):
    stmt = select(Product)
    count_stmt = select(func.count()).select_from(Product)

    if search:
        pattern = f"%{search.lower()}%"
        cond = or_(
            func.lower(Product.name).like(pattern),
            func.lower(Product.sku).like(pattern),
        )
        stmt = stmt.where(cond)
        count_stmt = count_stmt.where(cond)

    if low_stock:
        cond = Product.quantity_in_stock <= low_stock_threshold
        stmt = stmt.where(cond)
        count_stmt = count_stmt.where(cond)

    total = db.execute(count_stmt).scalar_one()
    stmt = stmt.order_by(Product.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    items = list(db.execute(stmt).scalars().all())
    return items, total


def create(db: Session, payload: ProductCreate) -> Product:
    _ensure_sku_unique(db, payload.sku)
    product = Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def update(db: Session, product_id: UUID, payload: ProductUpdate) -> Product:
    product = get(db, product_id)
    data = payload.model_dump(exclude_unset=True)
    if "sku" in data and data["sku"] is not None:
        _ensure_sku_unique(db, data["sku"], exclude_id=product_id)
    for key, value in data.items():
        setattr(product, key, value)
    db.commit()
    db.refresh(product)
    return product


def delete(db: Session, product_id: UUID) -> None:
    product = get(db, product_id)
    db.delete(product)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ConflictError(
            "Cannot delete a product that appears in existing orders."
        )
