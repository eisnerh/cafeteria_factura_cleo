"""Utilidades compartidas para upload de imágenes (productos, categorías, mesas)."""
from pathlib import Path

from fastapi import HTTPException, UploadFile
from fastapi.responses import FileResponse

UPLOADS_DIR = Path(__file__).resolve().parent.parent / "uploads"
ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".svg", ".webp"}
MAX_SIZE_MB = 2
MEDIA_TYPES = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
}


def get_image_path(subdir: str, entity_id: int) -> Path | None:
    """Retorna la ruta del archivo de imagen si existe."""
    base = UPLOADS_DIR / subdir
    if not base.exists():
        return None
    for ext in ALLOWED_EXTENSIONS:
        p = base / f"{entity_id}{ext}"
        if p.exists():
            return p
    return None


async def save_image(subdir: str, entity_id: int, file: UploadFile) -> None:
    """Guarda una imagen subida, reemplazando la anterior si existe."""
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            400,
            f"Formato no permitido. Use: {', '.join(ALLOWED_EXTENSIONS)}",
        )
    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(500, f"Error al leer archivo: {e!s}")
    if not content:
        raise HTTPException(400, "Archivo vacío")
    _save_image_bytes(subdir, entity_id, content, ext)


def _save_image_bytes(subdir: str, entity_id: int, content: bytes, ext: str) -> None:
    """Guarda bytes de imagen en disco."""
    base = UPLOADS_DIR / subdir
    base.mkdir(parents=True, exist_ok=True)

    # Eliminar imagen previa si existe
    for e in ALLOWED_EXTENSIONS:
        old = base / f"{entity_id}{e}"
        if old.exists():
            old.unlink()

    if len(content) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(400, f"Archivo muy grande. Máximo {MAX_SIZE_MB} MB")

    dest = base / f"{entity_id}{ext}"
    try:
        dest.write_bytes(content)
    except HTTPException:
        raise
    except OSError as e:
        dest.unlink(missing_ok=True)
        raise HTTPException(500, f"Error de archivo: {e!s}")
    except Exception as e:
        dest.unlink(missing_ok=True)
        raise HTTPException(500, f"Error al guardar: {e!s}")


def delete_image(subdir: str, entity_id: int) -> bool:
    """Elimina la imagen si existe. Retorna True si se eliminó."""
    p = get_image_path(subdir, entity_id)
    if p is None:
        return False
    p.unlink()
    return True


def serve_image(subdir: str, entity_id: int):
    """Sirve la imagen. Si no existe, devuelve 404 (el frontend muestra placeholder)."""
    p = get_image_path(subdir, entity_id)
    if p is None:
        raise HTTPException(404, "Imagen no configurada")
    media_type = MEDIA_TYPES.get(p.suffix.lower(), "image/png")
    return FileResponse(p, media_type=media_type)
