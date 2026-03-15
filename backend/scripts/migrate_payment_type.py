"""
Migración: Tipo de pago en gastos.
Añade la columna payment_type a expenses (efectivo, sinpe, tarjeta_credito, tarjeta_debito).
Ejecutar: cd backend && python -m scripts.migrate_payment_type
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import text
from app.database import engine


def migrate():
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'expenses' AND column_name = 'payment_type'
        """))
        if result.scalar() is None:
            conn.execute(text("""
                ALTER TABLE expenses ADD COLUMN payment_type VARCHAR(30) DEFAULT 'efectivo'
            """))
            conn.commit()
            print("Columna expenses.payment_type: añadida")
        else:
            print("Columna expenses.payment_type: ya existe")
    print("Migración completada.")


if __name__ == "__main__":
    try:
        migrate()
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
