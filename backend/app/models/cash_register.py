"""Modelo de caja (cierre de cajas)."""
from sqlalchemy import Column, Integer, Numeric, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.models.base import Base, TimestampMixin


class CashRegisterSession(Base, TimestampMixin):
    """Sesión de caja: apertura y cierre."""
    __tablename__ = "cash_register_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    opened_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    closed_at = Column(DateTime, nullable=True)
    opening_balance = Column(Numeric(12, 2), default=0, nullable=False)
    closing_balance = Column(Numeric(12, 2), nullable=True)
    expected_balance = Column(Numeric(12, 2), nullable=True)
    difference = Column(Numeric(12, 2), nullable=True)
    notes = Column(String(500), nullable=True)

    user = relationship("User", back_populates="cash_register_sessions")
    orders = relationship("Order", back_populates="cash_register", foreign_keys="Order.cash_register_id")
    expenses = relationship("Expense", back_populates="cash_register")
