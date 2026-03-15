"""Schemas para clientes."""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ClientBase(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    requiere_nit: bool = False
    nit: Optional[str] = None
    nombre_legal: Optional[str] = None
    direccion: Optional[str] = None


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    requiere_nit: Optional[bool] = None
    nit: Optional[str] = None
    nombre_legal: Optional[str] = None
    direccion: Optional[str] = None


class ClientResponse(ClientBase):
    id: int
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True
