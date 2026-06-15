from typing import List

from pydantic import BaseModel

from app.schemas.product import ProductOut


class DashboardStats(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    low_stock_count: int
    low_stock_threshold: int
    low_stock_products: List[ProductOut]
