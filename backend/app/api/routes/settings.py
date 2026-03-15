"""
Configuración del sistema: logo de la cafetería (upload desde la app).
"""
import shutil
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse

from app.auth import get_current_user, require_role
from app.models import User

# Directorio para archivos subidos (backend/uploads)
UPLOADS_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
LOGO_NAME = "logo"
ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".svg", ".webp"}
MAX_SIZE_MB = 2

router = APIRouter(prefix="/settings", tags=["settings"])


def _get_logo_path() -> Path | None:
    """Obtiene la ruta del logo si existe."""
    if not UPLOADS_DIR.exists():
        return None
    for ext in ALLOWED_EXTENSIONS:
        p = UPLOADS_DIR / f"{LOGO_NAME}{ext}"
        if p.exists():
            return p
    return None


@router.get("/logo")
def get_logo_url():
    """
    Retorna la URL del logo si está configurado. Público (Login muestra logo sin sesión).
    """
    p = _get_logo_path()
    if p is None:
        return {"url": None}
    # URL relativa que el frontend usa: /api/settings/logo/image
    return {"url": "/api/settings/logo/image"}


@router.get("/logo/image")
def get_logo_image():
    """Sirve la imagen del logo. Público para que <img src> funcione sin auth."""
    p = _get_logo_path()
    if p is None:
        raise HTTPException(404, "Logo no configurado")
    media_types = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml"}
    media_type = media_types.get(p.suffix.lower(), "image/png")
    return FileResponse(p, media_type=media_type)


@router.post("/logo")
def upload_logo(
    file: UploadFile = File(...),
    user: User = Depends(require_role("administrador")),
):
    """Sube o reemplaza el logo de la cafetería. Solo administrador."""
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            400,
            f"Formato no permitido. Use: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Eliminar logo previo si existe
    for e in ALLOWED_EXTENSIONS:
        old = UPLOADS_DIR / f"{LOGO_NAME}{e}"
        if old.exists():
            old.unlink()

    dest = UPLOADS_DIR / f"{LOGO_NAME}{ext}"

    try:
        with dest.open("wb") as f:
            total = 0
            for chunk in file.file:
                total += len(chunk)
                if total > MAX_SIZE_MB * 1024 * 1024:
                    dest.unlink(missing_ok=True)
                    raise HTTPException(400, f"Archivo muy grande. Máximo {MAX_SIZE_MB} MB")
                f.write(chunk)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error al guardar: {str(e)}")

    return {"url": "/api/settings/logo/image", "message": "Logo actualizado"}


@router.delete("/logo")
def delete_logo(user: User = Depends(require_role("administrador"))):
    """Elimina el logo. Solo administrador."""
    p = _get_logo_path()
    if p is None:
        return {"message": "No hay logo configurado"}
    p.unlink()
    return {"message": "Logo eliminado"}
