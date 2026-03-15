"""Modelos de mesas y sesiones."""
from sqlalchemy import Column, Integer, String, ForeignKey, Numeric, DateTime, DateTime
from sqlalchemy.orm import relationship
import enum

from app.models.base import Base, TimestampMixin


class TableState(str, enum.Enum):
    LIBRE = "libre"
    OCUPADA = "ocupada"
    RESERVADA = "reservada"


class Table(Base, TimestampMixin):
    __tablename__ = "tables"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    capacity = Column(Integer, default=4)
    state = Column(String(20), default="libre")  # libre, ocupada, reservada
    position_x = Column(Numeric(6, 2), default=0)  # Para mapa visual
    position_y = Column(Numeric(6, 2), default=0)

    sessions = relationship("TableSession", back_populates="table")


class TableSession(Base, TimestampMixin):
    __tablename__ = "table_sessions"

    id = Column(Integer, primary_key=True, index=True)
    table_id = Column(Integer, ForeignKey("tables.id"), nullable=False)
    waiter_id = Column(Integer, ForeignKey("users.id"))
    opened_at = Column(DateTime)
    closed_at = Column(DateTime, nullable=True)
    guests_count = Column(Integer, default=0)

    table = relationship("Table", back_populates="sessions")
    orders = relationship("Order", back_populates="session")
