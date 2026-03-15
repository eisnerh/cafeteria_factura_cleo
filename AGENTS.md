# Prompt para Agentes AI - Cafetería CLEO

## Proyecto
Sistema de gestión para cafetería/restaurante con FastAPI (backend), React + TypeScript (frontend), PostgreSQL.

## Reglas generales
1. **Idioma UI**: Todo texto visible al usuario en español.
2. **Código**: Nombres de variables/funciones en inglés.
3. **Estilos**: Usar variables CSS del proyecto (`--green-main`, `--cream`, `--border`, etc.).

## Stack técnico
- **Backend**: FastAPI, SQLAlchemy, Alembic, JWT
- **Frontend**: React 18, TypeScript, Vite, React Router
- **Base de datos**: PostgreSQL

## Rutas principales
| Recurso      | Prefijo API      | Frontend          |
|-------------|------------------|-------------------|
| Auth        | /api/auth        | /login            |
| Inventario  | /api/inventory   | /inventory        |
| Mesas       | /api/tables      | /tables           |
| Pedidos     | /api/orders      | /orders, /pos     |
| Clientes    | /api/clients     | /clients          |
| Facturación | /api/invoices    | /invoices         |
| Gastos      | /api/expenses    | /expenses         |
| Reservas    | /api/reservations| /reservations     |
| Configuración| /api/settings   | /settings         |

## Cliente API (frontend)
- `api.get('/ruta')`, `api.post('/ruta', body)`, `api.patch()`, `api.delete()`
- `api.upload('/ruta', FormData)` para subir archivos (logo, imágenes de productos/mesas)

## Funcionalidades especiales
- **Logo**: LogoContext. Al cambiar en Settings, `refreshLogo()` actualiza Layout, Login y POS.
- **Pedidos para llevar**: `notes` con `PARA_LLEVAR:Nombre`. Panel de pendientes con botón "Cobrar".
- **Stock bajo**: Filtro en inventario, link desde Dashboard y alerta.
- **Imágenes**: Productos, categorías y mesas tienen upload en modal de edición.
