"""Rutas de usuarios (solo administrador)."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Role
from app.schemas.auth import UserCreate, UserUpdate, UserResponse
from app.auth import get_current_user, require_role, get_password_hash

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/roles")
def list_roles(
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("administrador")),
):
    """Lista roles para selector en alta/edición de usuarios."""
    roles = db.query(Role).order_by(Role.name).all()
    return [{"id": r.id, "name": r.name} for r in roles]


@router.get("", response_model=list[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("administrador")),
):
    """Lista todos los usuarios."""
    users = db.query(User).all()
    return [UserResponse.model_validate(u) for u in users]


@router.post("", response_model=UserResponse)
def create_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("administrador")),
):
    """Crea un nuevo usuario."""
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    user = User(
        email=data.email,
        full_name=data.full_name,
        hashed_password=get_password_hash(data.password),
        is_active=data.is_active,
        role_id=data.role_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("administrador")),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return UserResponse.model_validate(user)


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("administrador")),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if data.full_name is not None:
        user.full_name = data.full_name
    if data.is_active is not None:
        user.is_active = data.is_active
    if data.role_id is not None:
        user.role_id = data.role_id
    if data.password:
        user.hashed_password = get_password_hash(data.password)
    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)
