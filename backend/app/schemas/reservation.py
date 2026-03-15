"""Schemas para reservas."""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ReservationBase(BaseModel):
    client_id: Optional[int] = None
    table_id: Optional[int] = None
    reserved_date: datetime
    guests_count: int = 2
    notes: Optional[str] = None


class ReservationCreate(ReservationBase):
    pass


class ReservationUpdate(BaseModel):
    client_id: Optional[int] = None
    table_id: Optional[int] = None
    reserved_date: Optional[datetime] = None
    guests_count: Optional[int] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class ReservationResponse(ReservationBase):
    id: int
    status: str = "confirmada"
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
