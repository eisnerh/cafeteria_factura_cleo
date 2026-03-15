"""Rutas de clientes."""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Client
from app.schemas.client import ClientCreate, ClientUpdate, ClientResponse
from app.auth import get_current_user
from app.models import User

router = APIRouter(prefix="/clients", tags=["clients"])


@router.get("", response_model=List[ClientResponse])
def list_clients(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    search: Optional[str] = Query(None),
):
    q = db.query(Client)
    if search:
        q = q.filter(
            Client.name.ilike(f"%{search}%") |
            Client.email.ilike(f"%{search}%") |
            (Client.nit.isnot(None) & Client.nit.ilike(f"%{search}%"))
        )
    return q.order_by(Client.name).limit(200).all()


@router.get("/{id}", response_model=ClientResponse)
def get_client(id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    c = db.query(Client).filter(Client.id == id).first()
    if not c:
        raise HTTPException(404, "Cliente no encontrado")
    return c


@router.post("", response_model=ClientResponse)
def create_client(
    data: ClientCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    c = Client(
        name=data.name,
        phone=data.phone,
        email=data.email,
        requiere_nit=data.requiere_nit,
        nit=data.nit if data.requiere_nit else None,
        nombre_legal=data.nombre_legal if data.requiere_nit else None,
        direccion=data.direccion if data.requiere_nit else None,
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@router.patch("/{id}", response_model=ClientResponse)
def update_client(
    id: int,
    data: ClientUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    c = db.query(Client).filter(Client.id == id).first()
    if not c:
        raise HTTPException(404, "Cliente no encontrado")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    return c


@router.delete("/{id}")
def delete_client(
    id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    c = db.query(Client).filter(Client.id == id).first()
    if not c:
        raise HTTPException(404, "Cliente no encontrado")
    db.delete(c)
    db.commit()
    return {"message": "Cliente eliminado"}
