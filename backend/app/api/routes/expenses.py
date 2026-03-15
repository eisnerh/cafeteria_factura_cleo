"""Rutas de gastos y proveedores."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models import Expense, ExpenseCategory, Supplier
from app.schemas.expense import (
    ExpenseCreate, ExpenseUpdate, ExpenseResponse,
    ExpenseCategoryCreate, ExpenseCategoryUpdate, ExpenseCategoryResponse,
    SupplierCreate, SupplierUpdate, SupplierResponse,
)
from app.auth import get_current_user, require_role
from app.models import User

router = APIRouter(prefix="/expenses", tags=["expenses"])
router_categories = APIRouter(prefix="/expense-categories", tags=["expenses"])
router_suppliers = APIRouter(prefix="/suppliers", tags=["expenses"])


@router.post("", response_model=ExpenseResponse)
def create_expense(
    data: ExpenseCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("administrador", "cajero")),
):
    """Registra un gasto."""
    expense = Expense(
        amount=data.amount,
        description=data.description,
        category_id=data.category_id,
        supplier_id=data.supplier_id,
        user_id=user.id,
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@router.get("", response_model=List[ExpenseResponse])
def list_expenses(
    category_id: Optional[int] = Query(None),
    supplier_id: Optional[int] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Lista gastos con filtros."""
    q = db.query(Expense)
    if category_id:
        q = q.filter(Expense.category_id == category_id)
    if supplier_id:
        q = q.filter(Expense.supplier_id == supplier_id)
    return q.offset(skip).limit(limit).all()


@router.get("/{id}", response_model=ExpenseResponse)
def get_expense(
    id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ex = db.query(Expense).filter(Expense.id == id).first()
    if not ex:
        raise HTTPException(404, "Gasto no encontrado")
    return ex


@router.patch("/{id}", response_model=ExpenseResponse)
def update_expense(
    id: int,
    data: ExpenseUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("administrador", "cajero")),
):
    ex = db.query(Expense).filter(Expense.id == id).first()
    if not ex:
        raise HTTPException(404, "Gasto no encontrado")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(ex, k, v)
    db.commit()
    db.refresh(ex)
    return ex


@router.delete("/{id}")
def delete_expense(
    id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("administrador")),
):
    ex = db.query(Expense).filter(Expense.id == id).first()
    if not ex:
        raise HTTPException(404, "Gasto no encontrado")
    db.delete(ex)
    db.commit()
    return {"message": "Gasto eliminado"}


@router.post("/categories", response_model=ExpenseCategoryResponse)
def create_category(
    data: ExpenseCategoryCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("administrador")),
):
    """Crea categoría de gastos."""
    cat = ExpenseCategory(name=data.name)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.get("/categories", response_model=List[ExpenseCategoryResponse])
def list_categories(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(ExpenseCategory).all()


@router.patch("/categories/{id}", response_model=ExpenseCategoryResponse)
def update_category(
    id: int,
    data: ExpenseCategoryUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("administrador")),
):
    cat = db.query(ExpenseCategory).filter(ExpenseCategory.id == id).first()
    if not cat:
        raise HTTPException(404, "Categoría no encontrada")
    if data.name is not None:
        cat.name = data.name
    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/categories/{id}")
def delete_category(
    id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("administrador")),
):
    cat = db.query(ExpenseCategory).filter(ExpenseCategory.id == id).first()
    if not cat:
        raise HTTPException(404, "Categoría no encontrada")
    db.delete(cat)
    db.commit()
    return {"message": "Categoría eliminada"}


@router.post("/suppliers", response_model=SupplierResponse)
def create_supplier(
    data: SupplierCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("administrador")),
):
    """Registra proveedor."""
    sup = Supplier(
        name=data.name,
        contact=data.contact,
        phone=data.phone,
        email=data.email,
    )
    db.add(sup)
    db.commit()
    db.refresh(sup)
    return sup


@router.get("/suppliers", response_model=List[SupplierResponse])
def list_suppliers(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Supplier).all()


@router.patch("/suppliers/{id}", response_model=SupplierResponse)
def update_supplier(
    id: int,
    data: SupplierUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("administrador")),
):
    sup = db.query(Supplier).filter(Supplier.id == id).first()
    if not sup:
        raise HTTPException(404, "Proveedor no encontrado")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(sup, k, v)
    db.commit()
    db.refresh(sup)
    return sup


@router.delete("/suppliers/{id}")
def delete_supplier(
    id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("administrador")),
):
    sup = db.query(Supplier).filter(Supplier.id == id).first()
    if not sup:
        raise HTTPException(404, "Proveedor no encontrado")
    db.delete(sup)
    db.commit()
    return {"message": "Proveedor eliminado"}
