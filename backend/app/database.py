"""
Configuración de base de datos PostgreSQL con SQLAlchemy.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from config.settings import get_database_url

engine = create_engine(get_database_url(), pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """Crea todas las tablas si no existen. Para migraciones usar Alembic."""
    from app.models.base import Base
    import app.models  # noqa: F401 - Load all models so Base knows about tables
    Base.metadata.create_all(bind=engine)


def get_db():
    """Dependency para obtener sesión de BD."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
