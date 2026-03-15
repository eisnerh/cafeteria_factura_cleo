"""Schemas para facturación electrónica."""
from pydantic import BaseModel
from typing import Optional, List
from decimal import Decimal
from datetime import datetime


class InvoiceItemBase(BaseModel):
    product_id: Optional[int] = None
    description: str
    quantity: Decimal
    unit_price: Decimal
    subtotal: Optional[Decimal] = None
    tax: Optional[Decimal] = None


class InvoiceItemCreate(InvoiceItemBase):
    pass


class InvoiceItemResponse(InvoiceItemBase):
    id: int
    invoice_id: int

    class Config:
        from_attributes = True


class InvoiceBase(BaseModel):
    cliente_id: Optional[int] = None
    order_id: Optional[int] = None
    tipo_documento: str = "FE"  # FE, TE, NC, ND


class InvoiceCreate(InvoiceBase):
    """items se obtienen del pedido (order_id)."""
    pass


class InvoiceListResponse(BaseModel):
    """Resumen para listado de facturas."""
    id: int
    order_id: Optional[int] = None
    clave: Optional[str] = None
    consecutivo: Optional[str] = None
    tipo_documento: str
    estado_hacienda: Optional[str] = None
    is_simulated: bool = False
    total: Optional[Decimal] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class InvoiceResponse(InvoiceBase):
    id: int
    clave: Optional[str] = None
    consecutivo: Optional[str] = None
    estado_hacienda: Optional[str] = None
    is_simulated: bool = False
    total: Optional[Decimal] = None
    subtotal: Optional[Decimal] = None
    impuesto: Optional[Decimal] = None
    created_at: Optional[datetime] = None
    items: List[InvoiceItemResponse] = []

    class Config:
        from_attributes = True
