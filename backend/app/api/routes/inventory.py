"""Rutas de inventario: productos, categorías, movimientos."""
from decimal import Decimal
from typing import Optional, List

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.upload_utils import get_image_path, save_image, delete_image, serve_image
from app.models import Product, ProductCategory, ProductMovement
from app.schemas.inventory import (
    ProductCreate, ProductUpdate, ProductResponse,
    ProductCategoryCreate, ProductCategoryResponse,
    ProductMovementCreate, ProductMovementResponse,
)
from app.auth import get_current_user, require_role
from app.models import User

router = APIRouter(prefix="/inventory", tags=["inventory"])


# ----- Categorías -----
@router.get("/categories", response_model=List[ProductCategoryResponse])
def list_categories(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(ProductCategory).all()


@router.post("/categories", response_model=ProductCategoryResponse)
def create_category(
    data: ProductCategoryCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("administrador")),
):
    cat = ProductCategory(name=data.name)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.patch("/categories/{id}", response_model=ProductCategoryResponse)
def update_category(
    id: int,
    data: ProductCategoryCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("administrador")),
):
    cat = db.query(ProductCategory).filter(ProductCategory.id == id).first()
    if not cat:
        raise HTTPException(404, "Categoría no encontrada")
    cat.name = data.name
    db.commit()
    db.refresh(cat)
    return cat


@router.get("/categories/{id}/image")
def get_category_image(id: int, db: Session = Depends(get_db)):
    """Sirve la imagen de la categoría si existe."""
    cat = db.query(ProductCategory).filter(ProductCategory.id == id).first()
    if not cat:
        raise HTTPException(404, "Categoría no encontrada")
    return serve_image("categories", id)


@router.post("/categories/{id}/image")
async def upload_category_image(
    id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_role("administrador")),
):
    """Sube o reemplaza la imagen de la categoría."""
    cat = db.query(ProductCategory).filter(ProductCategory.id == id).first()
    if not cat:
        raise HTTPException(404, "Categoría no encontrada")
    await save_image("categories", id, file)
    return {"message": "Imagen actualizada", "url": f"/api/inventory/categories/{id}/image"}


@router.delete("/categories/{id}/image")
def delete_category_image(
    id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("administrador")),
):
    """Elimina la imagen de la categoría."""
    cat = db.query(ProductCategory).filter(ProductCategory.id == id).first()
    if not cat:
        raise HTTPException(404, "Categoría no encontrada")
    delete_image("categories", id)
    return {"message": "Imagen eliminada"}


@router.delete("/categories/{id}")
def delete_category(
    id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("administrador")),
):
    cat = db.query(ProductCategory).filter(ProductCategory.id == id).first()
    if not cat:
        raise HTTPException(404, "Categoría no encontrada")
    db.delete(cat)
    db.commit()
    return {"message": "Categoría eliminada"}


# ----- Productos -----
@router.get("/products", response_model=List[ProductResponse])
def list_products(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    category_id: Optional[int] = None,
    low_stock: bool = Query(False, description="Solo productos con stock bajo"),
):
    q = db.query(Product).filter(Product.is_active == True)
    if category_id:
        q = q.filter(Product.category_id == category_id)
    if low_stock:
        q = q.filter(Product.stock <= Product.min_stock)
    products = q.all()
    return [
        ProductResponse.model_validate(p).model_copy(update={"has_image": get_image_path("products", p.id) is not None})
        for p in products
    ]


@router.get("/products/{id}", response_model=ProductResponse)
def get_product(id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    p = db.query(Product).filter(Product.id == id).first()
    if not p:
        raise HTTPException(404, "Producto no encontrado")
    return ProductResponse.model_validate(p).model_copy(update={"has_image": get_image_path("products", p.id) is not None})


@router.post("/products", response_model=ProductResponse)
def create_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("administrador")),
):
    p = Product(
        name=data.name,
        description=data.description,
        price=data.price,
        cost=data.cost or Decimal("0"),
        barcode=data.barcode,
        stock=data.stock or Decimal("0"),
        min_stock=data.min_stock or Decimal("0"),
        category_id=data.category_id,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@router.patch("/products/{id}", response_model=ProductResponse)
def update_product(
    id: int,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("administrador")),
):
    p = db.query(Product).filter(Product.id == id).first()
    if not p:
        raise HTTPException(404, "Producto no encontrado")
    updates = data.model_dump(exclude_unset=True)
    # Asegurar min_stock y stock como Decimal para SQLAlchemy Numeric
    if "min_stock" in updates and updates["min_stock"] is not None:
        from decimal import Decimal
        updates["min_stock"] = Decimal(str(updates["min_stock"]))
    if "stock" in updates and updates["stock"] is not None:
        from decimal import Decimal
        updates["stock"] = Decimal(str(updates["stock"]))
    for k, v in updates.items():
        setattr(p, k, v)
    db.flush()
    db.commit()
    db.refresh(p)
    return p


@router.get("/products/{id}/image")
def get_product_image(id: int, db: Session = Depends(get_db)):
    """Sirve la imagen del producto si existe."""
    p = db.query(Product).filter(Product.id == id).first()
    if not p:
        raise HTTPException(404, "Producto no encontrado")
    return serve_image("products", id)


@router.post("/products/{id}/image")
async def upload_product_image(
    id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_role("administrador")),
):
    """Sube o reemplaza la imagen del producto."""
    p = db.query(Product).filter(Product.id == id).first()
    if not p:
        raise HTTPException(404, "Producto no encontrado")
    await save_image("products", id, file)
    return {"message": "Imagen actualizada", "url": f"/api/inventory/products/{id}/image"}


@router.delete("/products/{id}/image")
def delete_product_image(
    id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("administrador")),
):
    """Elimina la imagen del producto."""
    p = db.query(Product).filter(Product.id == id).first()
    if not p:
        raise HTTPException(404, "Producto no encontrado")
    delete_image("products", id)
    return {"message": "Imagen eliminada"}


@router.delete("/products/{id}")
def delete_product(
    id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("administrador")),
):
    p = db.query(Product).filter(Product.id == id).first()
    if not p:
        raise HTTPException(404, "Producto no encontrado")
    p.is_active = False
    db.commit()
    return {"message": "Producto desactivado"}


# ----- Movimientos -----
@router.get("/products/{product_id}/movements", response_model=List[ProductMovementResponse])
def list_movements(
    product_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return db.query(ProductMovement).filter(ProductMovement.product_id == product_id).order_by(
        ProductMovement.created_at.desc()
    ).limit(100).all()


@router.post("/movements", response_model=ProductMovementResponse)
def create_movement(
    data: ProductMovementCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("administrador")),
):
    p = db.query(Product).filter(Product.id == data.product_id).first()
    if not p:
        raise HTTPException(404, "Producto no encontrado")
    prev = p.stock
    qty = data.quantity
    if data.movement_type == "entrada":
        p.stock = prev + qty
    elif data.movement_type == "salida":
        if prev < qty:
            raise HTTPException(400, "Stock insuficiente")
        p.stock = prev - qty
    elif data.movement_type == "ajuste":
        p.stock = qty
    else:
        raise HTTPException(400, "Tipo de movimiento inválido")
    mov = ProductMovement(
        product_id=data.product_id,
        movement_type=data.movement_type,
        quantity=qty,
        previous_stock=prev,
        notes=data.notes,
        user_id=user.id,
    )
    db.add(mov)
    db.commit()
    db.refresh(mov)
    return mov
