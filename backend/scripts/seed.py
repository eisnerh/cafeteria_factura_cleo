"""
Script de inicialización de datos: roles, usuarios, categorías y datos de prueba.
Ejecutar: python -m scripts.seed (desde el directorio backend)
"""
import sys
from pathlib import Path
from datetime import datetime, timedelta

# Añadir backend al path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import SessionLocal, init_db
from app.models import (
    User, Role, ProductCategory, ExpenseCategory, Product, ProductMovement,
    Client, Table, Supplier, Expense, Reservation,
)
from app.auth import get_password_hash


def _get_or_create(db, model, **kwargs):
    """Obtiene o crea un registro. kwargs debe incluir al menos un campo único para buscar."""
    existing = db.query(model).filter_by(**kwargs).first()
    return existing if existing else None


def seed():
    init_db()
    db = SessionLocal()
    try:
        # ----- Roles -----
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

        # ----- Usuarios de prueba -----
        admin_role = db.query(Role).filter(Role.name == "administrador").first()
        camarero_role = db.query(Role).filter(Role.name == "camarero").first()
        cajero_role = db.query(Role).filter(Role.name == "cajero").first()
        users_data = [
            ("admin@cafeteria.local", "admin123", "Administrador", "administrador"),
            ("camarero@cafeteria.local", "camarero123", "María Camarero", "camarero"),
            ("cajero@cafeteria.local", "cajero123", "Carlos Cajero", "cajero"),
        ]
        for email, pwd, full_name, role_name in users_data:
            if not db.query(User).filter(User.email == email).first():
                role = admin_role if role_name == "administrador" else (camarero_role if role_name == "camarero" else cajero_role)
                db.add(User(
                    email=email,
                    hashed_password=get_password_hash(pwd),
                    full_name=full_name,
                    is_active=True,
                    role_id=role.id,
                ))
        db.commit()

        # ----- Categorías de productos -----
        for cat in ["Bebidas", "Comidas", "Postres", "Snacks"]:
            if not db.query(ProductCategory).filter(ProductCategory.name == cat).first():
                db.add(ProductCategory(name=cat))
        db.commit()

        # ----- Productos de prueba -----
        cat_beb = db.query(ProductCategory).filter(ProductCategory.name == "Bebidas").first()
        cat_com = db.query(ProductCategory).filter(ProductCategory.name == "Comidas").first()
        cat_pos = db.query(ProductCategory).filter(ProductCategory.name == "Postres").first()
        cat_sna = db.query(ProductCategory).filter(ProductCategory.name == "Snacks").first()
        products_data = [
            ("Café Americano", "Café negro estándar", 1200, 300, cat_beb and cat_beb.id, 100),
            ("Café con Leche", "Café con leche espumada", 1500, 350, cat_beb and cat_beb.id, 100),
            ("Capuchino", "Espresso con espuma de leche", 1700, 400, cat_beb and cat_beb.id, 80),
            ("Té Negro", "Té negro inglés", 1000, 200, cat_beb and cat_beb.id, 50),
            ("Jugo de Naranja", "Jugo natural de naranja", 1500, 400, cat_beb and cat_beb.id, 30),
            ("Refresco", "Gaseosa 350ml", 800, 250, cat_beb and cat_beb.id, 100),
            ("Sandwich Club", "Pollo, tocino, lechuga y tomate", 2500, 800, cat_com and cat_com.id, 20),
            ("Hamburguesa Clásica", "Carne, queso, lechuga", 3200, 1200, cat_com and cat_com.id, 15),
            ("Ensalada César", "Pollo, crutones, aderezo césar", 2800, 900, cat_com and cat_com.id, 25),
            ("Pizza Margarita", "Porción individual", 2200, 700, cat_com and cat_com.id, 30),
            ("Tarta de Manzana", "Porción con canela", 1800, 500, cat_pos and cat_pos.id, 25),
            ("Brownie", "Brownie con nueces", 1400, 400, cat_pos and cat_pos.id, 40),
            ("Flan de Vainilla", "Flan casero", 1200, 350, cat_pos and cat_pos.id, 30),
            ("Papas Fritas", "Porción mediana", 1500, 400, cat_sna and cat_sna.id, 50),
            ("Nachos con Queso", "Nachos con queso fundido", 2200, 700, cat_sna and cat_sna.id, 30),
        ]
        for name, desc, price, cost, cat_id, stock in products_data:
            if cat_id and not db.query(Product).filter(Product.name == name).first():
                p = Product(
                    name=name, description=desc, price=price, cost=cost,
                    category_id=cat_id, stock=stock, min_stock=10, is_active=True
                )
                db.add(p)
        db.commit()

        # ----- Clientes de prueba -----
        clients_data = [
            ("Juan Pérez", "8888-1234", "juan@email.com", False, None, None, None),
            ("María García", "8999-5678", "maria@empresa.com", True, "3-101-123456", "Empresa García S.A.", "San José, Costa Rica"),
            ("Consumidor Final", "0000-0000", None, False, None, None, None),
            ("Luis Rodríguez", "8777-9012", "luis@correo.cr", False, None, None, None),
        ]
        for name, phone, email, req_nit, nit, nom_legal, direccion in clients_data:
            if not db.query(Client).filter(Client.name == name).first():
                db.add(Client(
                    name=name, phone=phone, email=email,
                    requiere_nit=req_nit, nit=nit, nombre_legal=nom_legal, direccion=direccion
                ))
        db.commit()

        # ----- Mesas -----
        tables_data = [
            ("Mesa 1", 4, 50, 100),
            ("Mesa 2", 4, 150, 100),
            ("Mesa 3", 2, 250, 100),
            ("Mesa 4", 6, 50, 200),
            ("Mesa 5", 4, 150, 200),
            ("Barra", 3, 250, 200),
        ]
        for name, cap, x, y in tables_data:
            if not db.query(Table).filter(Table.name == name).first():
                db.add(Table(name=name, capacity=cap, state="libre", position_x=x, position_y=y))
        db.commit()

        # ----- Proveedores -----
        suppliers_data = [
            ("Café Britt", "Roberto López", "2256-7890", "pedidos@cafebritt.com"),
            ("Distribuidora Central", "Ana Mora", "2234-5678", "ventas@distcentral.co.cr"),
            ("Carnicería Don José", None, "2225-4321", None),
        ]
        for name, contact, phone, email in suppliers_data:
            if not db.query(Supplier).filter(Supplier.name == name).first():
                db.add(Supplier(name=name, contact=contact, phone=phone, email=email))
        db.commit()

        # ----- Gastos de ejemplo (opcional) -----
        exp_cat = db.query(ExpenseCategory).filter(ExpenseCategory.name == "Proveedores").first()
        exp_cat_ser = db.query(ExpenseCategory).filter(ExpenseCategory.name == "Servicios").first()
        supplier = db.query(Supplier).filter(Supplier.name == "Distribuidora Central").first()
        admin_user = db.query(User).filter(User.email == "admin@cafeteria.local").first()
        if exp_cat and supplier and admin_user:
            if db.query(Expense).filter(Expense.description.like("%Compra semanal%")).count() == 0:
                db.add(Expense(amount=45000, description="Compra semanal insumos", category_id=exp_cat.id, supplier_id=supplier.id, user_id=admin_user.id))
        if exp_cat_ser and admin_user:
            if db.query(Expense).filter(Expense.description.like("%Internet%")).count() == 0:
                db.add(Expense(amount=25000, description="Internet y teléfono", category_id=exp_cat_ser.id, user_id=admin_user.id))
        db.commit()

        # ----- Reservas de ejemplo (opcional) -----
        client = db.query(Client).filter(Client.name == "Juan Pérez").first()
        table = db.query(Table).filter(Table.name == "Mesa 4").first()
        if client and table and db.query(Reservation).count() == 0:
            tomorrow = datetime.now().replace(hour=19, minute=0, second=0, microsecond=0) + timedelta(days=1)
            db.add(Reservation(client_id=client.id, table_id=table.id, reserved_date=tomorrow, guests_count=4, notes="Cumpleaños", status="confirmada"))
        db.commit()

        print("Seed completado.")
        print("  Usuarios: admin@cafeteria.local/admin123 | camarero@cafeteria.local/camarero123 | cajero@cafeteria.local/cajero123")
        print("  Productos: 14  |  Clientes: 4  |  Mesas: 6  |  Proveedores: 3  |  Gastos y reservas de ejemplo")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
