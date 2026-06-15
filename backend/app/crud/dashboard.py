from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Customer, Order, Product


def stats(db: Session, low_stock_threshold: int):
    total_products = db.execute(select(func.count()).select_from(Product)).scalar_one()
    total_customers = db.execute(select(func.count()).select_from(Customer)).scalar_one()
    total_orders = db.execute(select(func.count()).select_from(Order)).scalar_one()

    low_stock_stmt = (
        select(Product)
        .where(Product.quantity_in_stock <= low_stock_threshold)
        .order_by(Product.quantity_in_stock.asc())
    )
    low_stock_products = list(db.execute(low_stock_stmt).scalars().all())

    return {
        "total_products": total_products,
        "total_customers": total_customers,
        "total_orders": total_orders,
        "low_stock_count": len(low_stock_products),
        "low_stock_threshold": low_stock_threshold,
        "low_stock_products": low_stock_products,
    }
