"""
Autenticación JWT, verificación de roles y recuperación de contraseña.
"""
from datetime import datetime, timedelta
from typing import Optional
import secrets

import bcrypt
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from config.settings import get_config

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
security = HTTPBearer(auto_error=False)

SECRET_KEY = None
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


def _get_secret_key() -> str:
    global SECRET_KEY
    if SECRET_KEY is None:
        SECRET_KEY = get_config().get("jwt", {}).get("secret_key", "dev-secret-change-in-production")
    return SECRET_KEY


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, _get_secret_key(), algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, _get_secret_key(), algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    user = get_user_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        return None
    if not user.is_active:
        return None
    return user


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    if not credentials:
        raise HTTPException(status_code=401, detail="No autorizado")
    token = credentials.credentials
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token inválido")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    if not user.is_active:
        raise HTTPException(status_code=401, detail="Usuario inactivo")
    return user


def require_role(*allowed_roles: str):
    """Dependency que verifica que el usuario tenga uno de los roles permitidos."""
    async def role_checker(user: User = Depends(get_current_user)) -> User:
        if not user.role:
            raise HTTPException(status_code=403, detail="Sin rol asignado")
        role_name = user.role.name.lower()
        if role_name not in [r.lower() for r in allowed_roles]:
            raise HTTPException(status_code=403, detail="Permiso denegado")
        return user
    return role_checker


def create_reset_token() -> str:
    return secrets.token_urlsafe(32)
