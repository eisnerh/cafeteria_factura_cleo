-- Migración: Sistema de cierre de cajas
-- Ejecutar si ya tienes la base de datos creada (para añadir caja a un sistema existente).
-- Para instalación nueva, init_db() crea todo automáticamente.

-- 1. Crear tabla cash_register_sessions
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
);

-- 2. Añadir columna cash_register_id a orders (si no existe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'cash_register_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN cash_register_id INTEGER REFERENCES cash_register_sessions(id);
    END IF;
END $$;

-- 3. Añadir columna cash_register_id a expenses (si no existe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'expenses' AND column_name = 'cash_register_id'
    ) THEN
        ALTER TABLE expenses ADD COLUMN cash_register_id INTEGER REFERENCES cash_register_sessions(id);
    END IF;
END $$;
