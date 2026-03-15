"""
Script de inicialización de datos: roles, usuario administrador, categorías base.
Ejecutar: python -m scripts.seed (desde el directorio backend)
"""
import sys
from pathlib import Path

# Añadir backend al path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import SessionLocal, init_db
from app.models import User, Role, ProductCategory, ExpenseCategory
from app.auth import get_password_hash


def seed():
    init_db()
    db = SessionLocal()
    try:
        # Roles
        roles_data = [
            ("administrador", "Acceso total al sistema"),
            ("camarero", "Gestión de mesas y pedidos"),
            ("cocina", "Visualización de pedidos y comandas"),
            ("cajero", "Facturación y caja"),
        ]
        for name, desc in roles_data:
            if not db.query(Role).filter(Role.name == name).first():
                db.add(Role(name=name, description=desc))
        db.commit()

        # Usuario administrador por defecto (cambiar en producción)
        admin_role = db.query(Role).filter(Role.name == "administrador").first()
        if admin_role and not db.query(User).filter(User.email == "admin@cafeteria.local").first():
            db.add(User(
                email="admin@cafeteria.local",
                hashed_password=get_password_hash("admin123"),
                full_name="Administrador",
                is_active=True,
                role_id=admin_role.id,
            ))
        db.commit()

        # Categorías de productos
        for cat in ["Bebidas", "Comidas", "Postres", "Snacks"]:
            if not db.query(ProductCategory).filter(ProductCategory.name == cat).first():
                db.add(ProductCategory(name=cat))
        db.commit()

        # Categorías de gastos
        for cat in ["Proveedores", "Servicios", "Alquiler", "Otros"]:
            if not db.query(ExpenseCategory).filter(ExpenseCategory.name == cat).first():
                db.add(ExpenseCategory(name=cat))
        db.commit()

        print("Seed completado: roles, admin (admin@cafeteria.local / admin123), categorías.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
