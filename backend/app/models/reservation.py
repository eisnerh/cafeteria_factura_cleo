"""Modelo de reservas (calendario local)."""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin


class Reservation(Base, TimestampMixin):
    __tablename__ = "reservations"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"))
    table_id = Column(Integer, ForeignKey("tables.id"))
    reserved_date = Column(DateTime, nullable=False)
    guests_count = Column(Integer, default=2)
    notes = Column(String(500))
    status = Column(String(20), default="confirmada")  # confirmada, cancelada, completada
