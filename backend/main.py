"""
Punto de entrada de la aplicación Cafetería CLEO.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, get_db, init_db
from app.models.base import Base
from app.models import *  # noqa: F401, F403 - Registrar todos los modelos
from app.api.routes import auth, users, inventory, clients, tables, orders, expenses, invoices, reservations, reports, settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Inicialización al arranque: crear tablas si no existen."""
    init_db()
    yield
    # Shutdown si fuera necesario


app = FastAPI(
    title="Cafetería CLEO - API",
    description="Sistema de gestión para cafetería/restaurante con facturación electrónica Hacienda CR",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción restringir a dominios específicos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rutas API
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(inventory.router, prefix="/api")
app.include_router(clients.router, prefix="/api")
app.include_router(tables.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(expenses.router, prefix="/api")
app.include_router(invoices.router, prefix="/api")
app.include_router(reservations.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(settings.router, prefix="/api")


@app.get("/")
def root():
    return {"message": "Cafetería CLEO API", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}
