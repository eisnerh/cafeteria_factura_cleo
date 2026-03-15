"""Schemas para pedidos y split de cuentas."""
from pydantic import BaseModel
from typing import Optional, List
from decimal import Decimal
from datetime import datetime


class OrderItemBase(BaseModel):
    product_id: int
    quantity: float = 1
    unit_price: Decimal
    notes: Optional[str] = None
    split_group: int = 1


class OrderItemCreate(OrderItemBase):
    pass


class OrderItemResponse(OrderItemBase):
    id: int
    order_id: int

    class Config:
        from_attributes = True


class OrderBase(BaseModel):
    session_id: Optional[int] = None
    client_id: Optional[int] = None
    notes: Optional[str] = None


class OrderCreate(OrderBase):
    items: List[OrderItemCreate]


class OrderUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None


class OrderSplitRequest(BaseModel):
    split_type: str  # "items" | "iguales"
    total_guests: Optional[int] = None  # Para iguales


class OrderResponse(OrderBase):
    id: int
    status: str
    printed: bool
    items: List[OrderItemResponse] = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
