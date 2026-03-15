"""Schemas para inventario: productos, categorías, movimientos."""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal


class ProductCategoryBase(BaseModel):
    name: str


class ProductCategoryCreate(ProductCategoryBase):
    pass


class ProductCategoryResponse(ProductCategoryBase):
    id: int
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True


class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: Decimal
    cost: Optional[Decimal] = 0
    barcode: Optional[str] = None
    min_stock: Optional[Decimal] = 0
    category_id: Optional[int] = None
    is_active: bool = True


class ProductCreate(ProductBase):
    stock: Optional[Decimal] = 0


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    cost: Optional[Decimal] = None
    barcode: Optional[str] = None
    min_stock: Optional[Decimal] = None
    category_id: Optional[int] = None
    is_active: Optional[bool] = None


class ProductResponse(ProductBase):
    id: int
    stock: Decimal
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True


class ProductMovementCreate(BaseModel):
    product_id: int
    movement_type: str  # entrada, salida, ajuste
    quantity: Decimal
    notes: Optional[str] = None


class ProductMovementResponse(BaseModel):
    id: int
    product_id: int
    movement_type: str
    quantity: Decimal
    previous_stock: Optional[Decimal] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True


# Aliases for routes that use shorter names
CategoryCreate = ProductCategoryCreate
CategoryResponse = ProductCategoryResponse
MovementCreate = ProductMovementCreate
MovementResponse = ProductMovementResponse
