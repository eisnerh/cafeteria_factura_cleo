# Manual de Instalación - Cafetería CLEO

## 1. Requisitos del Sistema

- **Python** 3.10 o superior  
- **Node.js** 18+ y npm  
- **PostgreSQL** 14+  
- **Git** (opcional)

---

## 2. Instalación Local (Windows/Linux)

### 2.1 PostgreSQL

**Windows:** Descargar e instalar desde https://www.postgresql.org/download/  
**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

Crear base de datos y usuario:
```sql
CREATE USER cafeteria WITH PASSWORD '1234';
CREATE DATABASE cafeteria_cleo OWNER cafeteria;
```

O usar el usuario `postgres` por defecto (configurable en `config/dev.json`).

### 2.2 Backend

```bash
cd backend
python -m venv .venv

# Activar entorno
.venv\Scripts\activate        # Windows CMD/PowerShell
# source .venv/bin/activate   # Linux/Mac

pip install -r requirements.txt
```

Configurar variables de entorno (opcional):
```bash
set APP_ENV=dev
set DB_PASSWORD=1234
```

Inicializar datos:
```bash
python -m scripts.seed
```

Esto crea:
- Roles: administrador, camarero, cocina, cajero
- Usuario admin: `admin@cafeteria.local` / `admin123`
- Categorías de productos y gastos

Iniciar servidor:
```bash
uvicorn main:app --reload --port 8000
```

### 2.3 Frontend

```bash
cd frontend
npm install
npm run dev
```

El frontend se sirve en `http://localhost:5173` y usa proxy para la API en `http://localhost:8000`.

---

## 3. Configuración de Entornos

### Desarrollo (dev)
- `config/dev.json`
- Conexión local a PostgreSQL
- `hacienda.simulation_mode: true` (no envía a Hacienda)

### Staging
- `config/staging.json`
- Credenciales de prueba de Hacienda Costa Rica
- `hacienda.simulation_mode: false`

### Producción (prod)
- `config/prod.json`
- Credenciales oficiales de Hacienda
- Cambiar `jwt.secret_key` y contraseñas

---

## 4. Migraciones (Alembic)

```bash
cd backend
alembic revision --autogenerate -m "descripcion"
alembic upgrade head
```

---

## 5. Despliegue en Nube (Fase 2)

Para VPS (AWS, GCP, VPS):

1. Instalar PostgreSQL en el servidor o usar servicio gestionado (RDS, Cloud SQL).
2. Clonar repositorio.
3. Configurar `APP_ENV=prod` y `config/prod.json`.
4. Usar `gunicorn` o `uvicorn` como servidor de producción.
5. Servir frontend compilado (`npm run build`) con nginx o similar.
6. Configurar SSL (Let's Encrypt) y proxy reverso.

---

## 6. Resolución de Problemas

**Error de conexión a PostgreSQL:**
- Verificar que el servicio esté activo.
- Revisar host, puerto y credenciales en `config/dev.json` o variables de entorno.

**Error 401 en login:**
- Asegurarse de haber ejecutado `python -m scripts.seed`.
- Verificar que el usuario `admin@cafeteria.local` exista.

**CORS en desarrollo:**
- El backend permite `allow_origins=["*"]` en dev. En producción restringir a dominios específicos.
