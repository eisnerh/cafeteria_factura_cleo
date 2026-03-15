"""Schemas para mesas y sesiones."""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal


class TableBase(BaseModel):
    name: str
    capacity: int = 4
    state: str = "libre"
    position_x: Decimal = 0
    position_y: Decimal = 0


class TableCreate(TableBase):
    pass


class TableUpdate(BaseModel):
    name: Optional[str] = None
    capacity: Optional[int] = None
    state: Optional[str] = None
    position_x: Optional[Decimal] = None
    position_y: Optional[Decimal] = None


class TableResponse(TableBase):
    id: int
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True


class TableSessionCreate(BaseModel):
    table_id: int
    waiter_id: Optional[int] = None
    guests_count: int = 0


class TableSessionResponse(BaseModel):
    id: int
    table_id: int
    waiter_id: Optional[int] = None
    opened_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    guests_count: int = 0
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True


# Aliases for routes using shorter names
SessionCreate = TableSessionCreate
SessionResponse = TableSessionResponse


# Aliases for routes using shorter names
SessionCreate = TableSessionCreate
SessionResponse = TableSessionResponse


# Aliases for routes using shorter names
SessionCreate = TableSessionCreate
SessionResponse = TableSessionResponse


# Aliases for routes using shorter names
SessionCreate = TableSessionCreate
SessionResponse = TableSessionResponse


# Aliases for routes using shorter names
SessionCreate = TableSessionCreate
SessionResponse = TableSessionResponse


# Aliases for routes using shorter names
SessionCreate = TableSessionCreate
SessionResponse = TableSessionResponse


# Aliases for routes using shorter names
SessionCreate = TableSessionCreate
SessionResponse = TableSessionResponse


# Aliases for routes using shorter names
SessionCreate = TableSessionCreate
SessionResponse = TableSessionResponse


# Aliases for routes using shorter names
SessionCreate = TableSessionCreate
SessionResponse = TableSessionResponse


# Aliases for routes using shorter names
SessionCreate = TableSessionCreate
SessionResponse = TableSessionResponse


# Aliases for routes using shorter names
SessionCreate = TableSessionCreate
SessionResponse = TableSessionResponse


# Aliases for routes using shorter names
SessionCreate = TableSessionCreate
SessionResponse = TableSessionResponse


# Aliases for routes using shorter names
SessionCreate = TableSessionCreate
SessionResponse = TableSessionResponse


# Aliases for routes using shorter names
SessionCreate = TableSessionCreate
SessionResponse = TableSessionResponse


# Aliases for routes using shorter names
SessionCreate = TableSessionCreate
SessionResponse = TableSessionResponse


# Aliases for routes using shorter names
SessionCreate = TableSessionCreate
SessionResponse = TableSessionResponse
