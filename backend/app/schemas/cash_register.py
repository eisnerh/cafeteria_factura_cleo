"""Schemas para cierre de cajas."""
from pydantic import BaseModel
from typing import Optional
from decimal import Decimal
from datetime import datetime


class CashRegisterOpen(BaseModel):
    """Datos para abrir caja."""
    opening_balance: Decimal = 0


class CashRegisterClose(BaseModel):
    """Datos para cerrar caja."""
    closing_balance: Decimal
    notes: Optional[str] = None


class CashRegisterResponse(BaseModel):
    id: int
    user_id: int
    opened_at: datetime
    closed_at: Optional[datetime] = None
    opening_balance: Decimal
    closing_balance: Optional[Decimal] = None
    expected_balance: Optional[Decimal] = None
    difference: Optional[Decimal] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class CashRegisterCurrentSession(BaseModel):
    """Datos de la caja abierta para /current."""
    id: int
    opened_at: datetime
    opening_balance: float
    sales: float
    expenses: float
    expected_balance: float


class CashRegisterCurrentResponse(BaseModel):
    """Respuesta de GET /current."""
    open: bool
    session: Optional[CashRegisterCurrentSession] = None
