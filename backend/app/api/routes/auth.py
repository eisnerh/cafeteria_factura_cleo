"""Rutas de autenticación: login, recuperación de contraseña."""
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Role, PasswordResetToken, Role
from app.schemas.auth import LoginRequest, Token, UserResponse, PasswordResetRequest, PasswordResetConfirm
from app.auth import (
    authenticate_user,
    create_access_token,
    get_password_hash,
    create_reset_token,
    get_current_user,
    require_role,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/roles")
def list_roles(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """Lista roles para asignar a usuarios (requiere autenticación)."""
    roles = db.query(Role).order_by(Role.id).all()
    return [{"id": r.id, "name": r.name} for r in roles]


@router.post("/login", response_model=Token)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    """Login con email y contraseña. Retorna JWT."""
    user = authenticate_user(db, data.email, data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")
    token = create_access_token(data={"sub": str(user.id)})
    return Token(
        access_token=token,
        user=UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            is_active=user.is_active,
            role_id=user.role_id,
            created_at=user.created_at,
        ),
    )


@router.get("/roles")
def list_roles(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """Lista roles disponibles (para formularios)."""
    roles = db.query(Role).order_by(Role.id).all()
    return [{"id": r.id, "name": r.name} for r in roles]


@router.get("/roles")
def list_roles(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """Lista roles para formularios (ej: crear usuario)."""
    roles = db.query(Role).order_by(Role.name).all()
    return [{"id": r.id, "name": r.name} for r in roles]


@router.get("/me", response_model=UserResponse)
def get_me(user: User = Depends(get_current_user)):
    """Obtiene el usuario actual autenticado."""
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        role_id=user.role_id,
        created_at=user.created_at,
    )


@router.get("/roles")
def list_roles(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """Lista roles disponibles (para formularios de usuario)."""
    roles = db.query(Role).order_by(Role.id).all()
    return [{"id": r.id, "name": r.name} for r in roles]


@router.get("/roles")
def list_roles(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """Lista roles disponibles (para formularios de usuario)."""
    roles = db.query(Role).order_by(Role.id).all()
    return [{"id": r.id, "name": r.name} for r in roles]


@router.post("/password-reset/request")
def request_password_reset(data: PasswordResetRequest, db: Session = Depends(get_db)):
    """
    Solicita restablecimiento de contraseña. Genera token y debería enviar correo.
    Por ahora solo genera el token (implementar envío de email en producción).
    """
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        return {"message": "Si el correo existe, recibirá instrucciones"}
    token = create_reset_token()
    expires = datetime.utcnow() + timedelta(hours=1)
    reset = PasswordResetToken(user_id=user.id, token=token, expires_at=expires)
    db.add(reset)
    db.commit()
    # TODO: Enviar email con enlace: {BASE_URL}/reset-password?token={token}
    return {"message": "Si el correo existe, recibirá instrucciones de restablecimiento"}


@router.post("/password-reset/confirm")
def confirm_password_reset(data: PasswordResetConfirm, db: Session = Depends(get_db)):
    """Confirma el restablecimiento de contraseña con el token recibido."""
    reset = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == data.token,
        PasswordResetToken.used_at.is_(None),
        PasswordResetToken.expires_at > datetime.utcnow(),
    ).first()
    if not reset:
        raise HTTPException(status_code=400, detail="Token inválido o expirado")
    user = db.query(User).filter(User.id == reset.user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="Usuario no encontrado")
    user.hashed_password = get_password_hash(data.new_password)
    reset.used_at = datetime.utcnow()
    db.commit()
    return {"message": "Contraseña actualizada correctamente"}
