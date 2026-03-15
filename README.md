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
python -m scripts.seed     # Crea roles, usuarios, categorías y datos de prueba
uvicorn main:app --reload --port 8000
```

**Usuarios de prueba:** `admin@cafeteria.local` / `admin123` (admin), `camarero@cafeteria.local` / `camarero123`, `cajero@cafeteria.local` / `cajero123`

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
| Caja        | Apertura/cierre de caja, monto inicial, diferencias |
| Inventario  | Productos, categorías, movimientos, alertas stock |
| Mesas       | Mapa visual, apertura/cierre, asignación camarero |
| Pedidos     | Creación, split por ítems o por iguales           |
| Facturación | FE, TE, NC, ND - modo simulación Hacienda CR      |
| Clientes    | Registro, NIT para facturación                    |
| Gastos      | Categorías, proveedores, reportes rentabilidad    |
| Reservas    | Calendario local (sin integración externa)        |
| Reportes    | Ventas, productos más vendidos, ingresos vs gastos |

## Configuración por Entorno

- `config/dev.json` - Desarrollo local (simulación Hacienda)
- `config/staging.json` - Pruebas Hacienda
- `config/prod.json` - Producción

Variable de entorno `APP_ENV` selecciona el archivo (`dev` por defecto).

## Personalización

### Nombre del negocio

El título de la pestaña del navegador y el texto que se muestra cuando no hay logo usan el nombre de tu restaurante o cafetería. En `frontend/.env`:

```
VITE_APP_NAME=Mi Cafetería
```

Si no se configura, se usa "Cafetería CLEO" por defecto.

### Logo

Para mostrar el logo en el sidebar y la pantalla de login:

1. **Opción A** – Coloca tu logo en `frontend/public/logo.png`
2. En `frontend/.env` añade:
   ```
   VITE_LOGO_URL=/logo.png
   ```
3. **Opción B** – Usa una URL externa:
   ```
   VITE_LOGO_URL=https://tu-sitio.com/logo.png
   ```
4. Reinicia el servidor (`npm run dev`).

## Datos de prueba

El comando `python -m scripts.seed` crea datos listos para probar el sistema:

| Tipo | Cantidad | Ejemplos |
|------|----------|----------|
| **Usuarios** | 3 | admin/admin123, camarero/camarero123, cajero/cajero123 |
| **Productos** | 14 | Café Americano, Capuchino, Sandwich Club, Tarta de Manzana, Papas Fritas... |
| **Categorías productos** | 4 | Bebidas, Comidas, Postres, Snacks |
| **Clientes** | 4 | Juan Pérez, María García (con NIT), Consumidor Final, Luis Rodríguez |
| **Mesas** | 6 | Mesa 1-5, Barra (con posiciones para mapa) |
| **Proveedores** | 3 | Café Britt, Distribuidora Central, Carnicería Don José |
| **Categorías gastos** | 4 | Proveedores, Servicios, Alquiler, Otros |
| **Gastos** | 2 | Compra insumos, Internet |
| **Reservas** | 1 | Reserva mañana para Juan Pérez en Mesa 4 |

Los productos incluyen precio, costo y stock inicial. Las mesas tienen coordenadas para el mapa visual. Puedes volver a ejecutar `python -m scripts.seed`; los datos ya existentes no se duplican.

## Licencia
Proyecto de uso interno. Todos los derechos reservados.
