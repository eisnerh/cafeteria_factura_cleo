"""Modelo de clientes."""
from sqlalchemy import Column, Integer, String, Boolean, Numeric, ForeignKey
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin


class Client(Base, TimestampMixin):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    phone = Column(String(50))
    email = Column(String(255))

    # Para factura con NIT
    requiere_nit = Column(Boolean, default=False)
    nit = Column(String(50))
    nombre_legal = Column(String(255))
    direccion = Column(String(500))

    # Relaciones
    orders = relationship("Order", back_populates="client")
