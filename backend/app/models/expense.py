"""Modelos de gastos y proveedores."""
from sqlalchemy import Column, Integer, String, Numeric, ForeignKey
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin


class Supplier(Base, TimestampMixin):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    contact = Column(String(255))
    phone = Column(String(50))
    email = Column(String(255))

    expenses = relationship("Expense", back_populates="supplier")


class ExpenseCategory(Base, TimestampMixin):
    __tablename__ = "expense_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)

    expenses = relationship("Expense", back_populates="category")


class Expense(Base, TimestampMixin):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Numeric(12, 2), nullable=False)
    description = Column(String(500))
    category_id = Column(Integer, ForeignKey("expense_categories.id"))
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    user_id = Column(Integer, ForeignKey("users.id"))

    category = relationship("ExpenseCategory", back_populates="expenses")
    supplier = relationship("Supplier", back_populates="expenses")
