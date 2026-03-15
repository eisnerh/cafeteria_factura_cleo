"""Modelos de inventario: productos, categorías y movimientos."""
from sqlalchemy import Column, Integer, String, Numeric, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum

from app.models.base import Base, TimestampMixin


class MovementType(str, enum.Enum):
    ENTRADA = "entrada"
    SALIDA = "salida"
    AJUSTE = "ajuste"


class ProductCategory(Base, TimestampMixin):
    __tablename__ = "product_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)

    products = relationship("Product", back_populates="category")


class Product(Base, TimestampMixin):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(String(500))
    price = Column(Numeric(12, 2), nullable=False)
    cost = Column(Numeric(12, 2), default=0)
    barcode = Column(String(100))
    stock = Column(Numeric(12, 3), default=0)
    min_stock = Column(Numeric(12, 3), default=0)
    category_id = Column(Integer, ForeignKey("product_categories.id"))
    is_active = Column(Boolean, default=True)

    category = relationship("ProductCategory", back_populates="products")
    movements = relationship("ProductMovement", back_populates="product", order_by="ProductMovement.created_at")


class ProductMovement(Base, TimestampMixin):
    __tablename__ = "product_movements"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    movement_type = Column(String(20), nullable=False)  # entrada, salida, ajuste
    quantity = Column(Numeric(12, 3), nullable=False)
    previous_stock = Column(Numeric(12, 3))
    notes = Column(String(500))
    user_id = Column(Integer, ForeignKey("users.id"))

    product = relationship("Product", back_populates="movements")
