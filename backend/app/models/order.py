"""Modelos de pedidos y split de cuentas."""
from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, Boolean
from sqlalchemy.orm import relationship
import enum

from app.models.base import Base, TimestampMixin


class OrderStatus(str, enum.Enum):
    PENDIENTE = "pendiente"
    EN_PREPARACION = "en_preparacion"
    ENTREGADO = "entregado"
    COBRADO = "cobrado"
    CANCELADO = "cancelado"


class Order(Base, TimestampMixin):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("table_sessions.id"))
    client_id = Column(Integer, ForeignKey("clients.id"))
    status = Column(String(30), default="pendiente")
    notes = Column(String(500))
    printed = Column(Boolean, default=False)

    session = relationship("TableSession", back_populates="orders")
    client = relationship("Client", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    splits = relationship("OrderSplit", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base, TimestampMixin):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Numeric(10, 2), default=1)
    unit_price = Column(Numeric(12, 2), nullable=False)
    notes = Column(String(255))
    split_group = Column(Integer, default=1)  # Para split por ítems: grupo que paga

    order = relationship("Order", back_populates="items")
    product = relationship("Product", backref="order_items")


class OrderSplit(Base, TimestampMixin):
    """Registro de división de cuentas: por ítems o por iguales."""
    __tablename__ = "order_splits"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    split_type = Column(String(20), nullable=False)  # items, iguales
    total_guests = Column(Integer)  # Para split iguales
    amount_per_guest = Column(Numeric(12, 2))  # Para split iguales

    order = relationship("Order", back_populates="splits")
