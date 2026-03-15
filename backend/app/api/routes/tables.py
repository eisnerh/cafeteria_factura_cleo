"""Rutas de mesas y sesiones."""
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.upload_utils import delete_image, save_image, serve_image
from app.models import Table, TableSession
from app.schemas.table import (
    TableCreate, TableUpdate, TableResponse,
    TableSessionCreate, TableSessionResponse,
)
from app.auth import get_current_user, require_role
from app.models import User

router = APIRouter(prefix="/tables", tags=["tables"])


@router.get("", response_model=List[TableResponse])
def list_tables(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Table).all()


@router.post("", response_model=TableResponse)
def create_table(
    data: TableCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("administrador")),
):
    t = Table(
        name=data.name,
        capacity=data.capacity,
        position_x=data.position_x,
        position_y=data.position_y,
    )
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


@router.delete("/{id}")
def delete_table(
    id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("administrador")),
):
    t = db.query(Table).filter(Table.id == id).first()
    if not t:
        raise HTTPException(404, "Mesa no encontrada")
    if t.state == "ocupada":
        raise HTTPException(400, "No se puede eliminar una mesa ocupada")
    db.delete(t)
    db.commit()
    return {"message": "Mesa eliminada"}


@router.get("/{id}/image")
def get_table_image(id: int, db: Session = Depends(get_db)):
    """Sirve la imagen de la mesa si existe."""
    t = db.query(Table).filter(Table.id == id).first()
    if not t:
        raise HTTPException(404, "Mesa no encontrada")
    return serve_image("tables", id)


@router.post("/{id}/image")
async def upload_table_image(
    id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_role("administrador")),
):
    """Sube o reemplaza la imagen de la mesa."""
    t = db.query(Table).filter(Table.id == id).first()
    if not t:
        raise HTTPException(404, "Mesa no encontrada")
    await save_image("tables", id, file)
    return {"message": "Imagen actualizada", "url": f"/api/tables/{id}/image"}


@router.delete("/{id}/image")
def delete_table_image(
    id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("administrador")),
):
    """Elimina la imagen de la mesa."""
    t = db.query(Table).filter(Table.id == id).first()
    if not t:
        raise HTTPException(404, "Mesa no encontrada")
    delete_image("tables", id)
    return {"message": "Imagen eliminada"}


@router.patch("/{id}", response_model=TableResponse)
def update_table(
    id: int,
    data: TableUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("administrador")),
):
    t = db.query(Table).filter(Table.id == id).first()
    if not t:
        raise HTTPException(404, "Mesa no encontrada")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(t, k, v)
    db.commit()
    db.refresh(t)
    return t


@router.get("/{table_id}/open-session")
def get_open_session(
    table_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Obtiene la sesión abierta de una mesa (cuando está ocupada)."""
    sess = (
        db.query(TableSession)
        .filter(
            TableSession.table_id == table_id,
            TableSession.closed_at.is_(None),
        )
        .first()
    )
    if not sess:
        raise HTTPException(404, "No hay sesión abierta para esta mesa")
    return {"session_id": sess.id}


@router.post("/{table_id}/sessions", response_model=TableSessionResponse)
def open_session(
    table_id: int,
    data: TableSessionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    t = db.query(Table).filter(Table.id == table_id).first()
    if not t:
        raise HTTPException(404, "Mesa no encontrada")
    if t.state == "ocupada":
        raise HTTPException(400, "La mesa ya está ocupada")
    sess = TableSession(
        table_id=table_id,
        waiter_id=data.waiter_id or user.id,
        guests_count=data.guests_count or 0,
        opened_at=datetime.utcnow(),
    )
    db.add(sess)
    t.state = "ocupada"
    db.commit()
    db.refresh(sess)
    return sess


@router.post("/sessions/{session_id}/close", response_model=TableSessionResponse)
def close_session(
    session_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    sess = db.query(TableSession).filter(TableSession.id == session_id).first()
    if not sess:
        raise HTTPException(404, "Sesión no encontrada")
    if sess.closed_at:
        raise HTTPException(400, "Sesión ya cerrada")
    sess.closed_at = datetime.utcnow()
    sess.table.state = "libre"
    db.commit()
    db.refresh(sess)
    return sess
