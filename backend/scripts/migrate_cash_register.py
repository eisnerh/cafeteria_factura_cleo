"""
Migración: Sistema de cierre de cajas.
Añade la tabla cash_register_sessions y las columnas cash_register_id a orders y expenses.
Ejecutar: python -m scripts.migrate_cash_register
"""
import sys
from pathlib import Path

# Asegurar que el backend esté en el path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import text
from app.database import engine


def migrate():
    with engine.connect() as conn:
        # 1. Crear tabla cash_register_sessions
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS cash_register_sessions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                opened_at TIMESTAMP NOT NULL DEFAULT NOW(),
                closed_at TIMESTAMP,
                opening_balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
                closing_balance NUMERIC(12, 2),
                expected_balance NUMERIC(12, 2),
                difference NUMERIC(12, 2),
                notes VARCHAR(500),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        """))
        conn.commit()
        print("Tabla cash_register_sessions: OK")

        # 2. Añadir cash_register_id a orders si no existe
        result = conn.execute(text("""
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'orders' AND column_name = 'cash_register_id'
        """))
        if result.scalar() is None:
            conn.execute(text("""
                ALTER TABLE orders ADD COLUMN cash_register_id INTEGER
                REFERENCES cash_register_sessions(id)
            """))
            conn.commit()
            print("Columna orders.cash_register_id: añadida")
        else:
            print("Columna orders.cash_register_id: ya existe")

        # 3. Añadir cash_register_id a expenses si no existe
        result = conn.execute(text("""
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'expenses' AND column_name = 'cash_register_id'
        """))
        if result.scalar() is None:
            conn.execute(text("""
                ALTER TABLE expenses ADD COLUMN cash_register_id INTEGER
                REFERENCES cash_register_sessions(id)
            """))
            conn.commit()
            print("Columna expenses.cash_register_id: añadida")
        else:
            print("Columna expenses.cash_register_id: ya existe")

    print("\nMigración completada. Puedes ejecutar: python -m scripts.seed")


if __name__ == "__main__":
    try:
        migrate()
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
