"""
Configuración de la aplicación según entorno (dev, staging, prod).
Las credenciales de Hacienda y DB se cargan desde archivos JSON.
"""
import json
import os
from pathlib import Path
from typing import Optional

# Directorio base del backend
BASE_DIR = Path(__file__).resolve().parent.parent
CONFIG_DIR = BASE_DIR / "config"


def get_env() -> str:
    """Obtiene el entorno actual (dev, staging, prod)."""
    return os.getenv("APP_ENV", "dev")


def load_config() -> dict:
    """Carga la configuración según el entorno."""
    env = get_env()
    config_file = CONFIG_DIR / f"{env}.json"
    if not config_file.exists():
        raise FileNotFoundError(f"Archivo de configuración no encontrado: {config_file}")
    with open(config_file, "r", encoding="utf-8") as f:
        return json.load(f)


_config: Optional[dict] = None


def get_config() -> dict:
    """Obtiene la configuración cacheada."""
    global _config
    if _config is None:
        _config = load_config()
    return _config


def get_database_url() -> str:
    """URL de conexión a PostgreSQL."""
    cfg = get_config()
    db = cfg.get("database", {})
    user = db.get("user", "postgres")
    password = os.getenv("DB_PASSWORD", db.get("password", "1234"))
    host = os.getenv("DB_HOST", db.get("host", "localhost"))
    port = db.get("port", 5432)
    name = db.get("name", "cafeteria_cleo")
    return f"postgresql://{user}:{password}@{host}:{port}/{name}"


def is_hacienda_simulation() -> bool:
    """Indica si se usa modo simulación de Hacienda (sin envío real)."""
    cfg = get_config()
    return cfg.get("hacienda", {}).get("simulation_mode", True)


def get_hacienda_config() -> dict:
    """Configuración para integración con Hacienda CR."""
    return get_config().get("hacienda", {})
