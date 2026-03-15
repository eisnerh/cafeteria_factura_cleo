"""Modelos de facturación electrónica."""
from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
import enum

from app.models.base import Base, TimestampMixin


class InvoiceType(str, enum.Enum):
    FACTURA = "FE"
    TICKET = "TE"
    NOTA_CREDITO = "NC"
    NOTA_DEBITO = "ND"


class Invoice(Base, TimestampMixin):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clients.id"))
    order_id = Column(Integer, ForeignKey("orders.id"))
    tipo_documento = Column(String(5), nullable=False)  # FE, TE, NC, ND
    clave = Column(String(50), unique=True)
    consecutivo = Column(String(20))
    estado_hacienda = Column(String(50))  # aceptado, rechazado, pendiente
    xml_content = Column(Text)
    pdf_path = Column(String(500))
    is_simulated = Column(Boolean, default=False)
    total = Column(Numeric(12, 2))
    subtotal = Column(Numeric(12, 2))
    impuesto = Column(Numeric(12, 2))

    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")


class InvoiceItem(Base, TimestampMixin):
    __tablename__ = "invoice_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"))
    description = Column(String(255), nullable=False)
    quantity = Column(Numeric(10, 2), nullable=False)
    unit_price = Column(Numeric(12, 2), nullable=False)
    subtotal = Column(Numeric(12, 2))
    tax = Column(Numeric(12, 2))

    invoice = relationship("Invoice", back_populates="items")
