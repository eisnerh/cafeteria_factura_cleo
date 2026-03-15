"""Schemas para gastos y proveedores."""
from pydantic import BaseModel
from typing import Optional
from decimal import Decimal
from datetime import datetime


class SupplierBase(BaseModel):
    name: str
    contact: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    contact: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None


class SupplierResponse(SupplierBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ExpenseCategoryBase(BaseModel):
    name: str


class ExpenseCategoryCreate(ExpenseCategoryBase):
    pass


class ExpenseCategoryUpdate(BaseModel):
    name: Optional[str] = None


class ExpenseCategoryResponse(ExpenseCategoryBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


PAYMENT_TYPES = ("efectivo", "sinpe", "tarjeta_credito", "tarjeta_debito")


class ExpenseBase(BaseModel):
    amount: Decimal
    description: Optional[str] = None
    category_id: Optional[int] = None
    supplier_id: Optional[int] = None
    cash_register_id: Optional[int] = None
    payment_type: Optional[str] = None


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    amount: Optional[Decimal] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    supplier_id: Optional[int] = None
    payment_type: Optional[str] = None


class ExpenseResponse(ExpenseBase):
    id: int
    user_id: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
