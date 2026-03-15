# Cafetería CLEO - Sistema de Gestión Integral

Sistema de gestión para cafetería/restaurante con **FastAPI** (backend), **React + TypeScript** (frontend), **PostgreSQL**, facturación electrónica (Hacienda Costa Rica), control de mesas, pedidos con split de cuentas, inventario, clientes, gastos, reservas y reportes visuales.

## Estructura del Proyecto

```
Cafeteria_CLEO/
├── backend/          # FastAPI + SQLAlchemy + Alembic
│   ├── app/
│   │   ├── api/routes/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── auth.py
│   │   └── database.py
│   ├── config/       # dev.json, staging.json, prod.json
│   ├── alembic/
│   └── scripts/seed.py
├── frontend/         # React + TypeScript + Vite (PWA-ready)
└── docs/             # INSTALACION.md, GUIA_USUARIO.md
```

## Inicio Rápido

### Requisitos
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

### 1. Base de datos
```bash
# Crear base de datos
createdb cafeteria_cleo

# O con psql:
psql -U postgres -c "CREATE DATABASE cafeteria_cleo;"
```

### 2. Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows
# source .venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
python -m scripts.seed     # Crea roles, admin, categorías
uvicorn main:app --reload --port 8000
```

**Usuario admin por defecto:** `admin@cafeteria.local` / `admin123`

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Acceso
- **API:** http://localhost:8000  
- **Docs Swagger:** http://localhost:8000/docs  
- **Frontend:** http://localhost:5173  

## Módulos Principales

| Módulo       | Descripción                                      |
|-------------|---------------------------------------------------|
| Inventario  | Productos, categorías, movimientos, alertas stock |
| Mesas      | Mapa visual, apertura/cierre, asignación camarero |
| Pedidos    | Creación, split por ítems o por iguales           |
| Facturación| FE, TE, NC, ND - modo simulación Hacienda CR      |
| Clientes   | Registro, NIT para facturación                    |
| Gastos     | Categorías, proveedores, reportes rentabilidad    |
| Reservas   | Calendario local (sin integración externa)        |
| Reportes   | Ventas, productos más vendidos, ingresos vs gastos|

## Configuración por Entorno

- `config/dev.json` - Desarrollo local (simulación Hacienda)
- `config/staging.json` - Pruebas Hacienda
- `config/prod.json` - Producción

Variable de entorno `APP_ENV` selecciona el archivo (`dev` por defecto).

## Personalización del logo

Para mostrar el logo de tu cafetería en el sidebar y la pantalla de login:

1. **Opción A** – Coloca tu logo en `frontend/public/logo.png`
2. Crea o edita `frontend/.env` y añade:
   ```
   VITE_LOGO_URL=/logo.png
   ```
3. **Opción B** – Usa una URL externa:
   ```
   VITE_LOGO_URL=https://tu-sitio.com/logo.png
   ```
4. Reinicia el servidor del frontend (`npm run dev`).

Si no se configura, se mostrará el texto "Cafetería CLEO" por defecto.

## Licencia
Proyecto de uso interno. Todos los derechos reservados.
