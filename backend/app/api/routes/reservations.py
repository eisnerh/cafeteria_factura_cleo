"""Rutas del calendario de reservas (local)."""
from datetime import datetime, date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Reservation, Client, Table
from app.schemas.reservation import ReservationCreate, ReservationUpdate, ReservationResponse
from app.auth import get_current_user
from app.models import User

router = APIRouter(prefix="/reservations", tags=["reservations"])


@router.get("", response_model=list[ReservationResponse])
def list_reservations(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    desde: date = Query(..., description="Fecha inicio"),
    hasta: date = Query(..., description="Fecha fin"),
):
    """Lista reservas en el rango de fechas (vista calendario)."""
    desde_dt = datetime.combine(desde, datetime.min.time())
    hasta_dt = datetime.combine(hasta, datetime.max.time())
    reservations = (
        db.query(Reservation)
        .filter(
            Reservation.reserved_date >= desde_dt,
            Reservation.reserved_date <= hasta_dt,
            Reservation.status == "confirmada",
        )
        .order_by(Reservation.reserved_date)
        .all()
    )
    return [ReservationResponse.model_validate(r) for r in reservations]


@router.post("", response_model=ReservationResponse)
def create_reservation(
    data: ReservationCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Crea una reserva."""
    if data.table_id:
        table = db.query(Table).filter(Table.id == data.table_id).first()
        if not table:
            raise HTTPException(status_code=404, detail="Mesa no encontrada")
    r = Reservation(
        client_id=data.client_id,
        table_id=data.table_id,
        reserved_date=data.reserved_date,
        guests_count=data.guests_count or 2,
        notes=data.notes,
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    return ReservationResponse.model_validate(r)


@router.patch("/{reservation_id}", response_model=ReservationResponse)
def update_reservation(
    reservation_id: int,
    data: ReservationUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Actualiza una reserva."""
    r = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    if data.reserved_date is not None:
        r.reserved_date = data.reserved_date
    if data.guests_count is not None:
        r.guests_count = data.guests_count
    if data.notes is not None:
        r.notes = data.notes
    if data.status is not None:
        r.status = data.status
    if data.table_id is not None:
        r.table_id = data.table_id
    db.commit()
    db.refresh(r)
    return ReservationResponse.model_validate(r)


@router.delete("/{reservation_id}")
def cancel_reservation(
    reservation_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Cancela una reserva."""
    r = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    r.status = "cancelada"
    db.commit()
    return {"message": "Reserva cancelada"}
