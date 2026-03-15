"""
Rutas de caja: apertura, cierre y historial.
"""
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from app.database import get_db
from app.models import CashRegisterSession, Order, OrderItem, Expense
from app.schemas.cash_register import (
    CashRegisterOpen, CashRegisterClose,
    CashRegisterResponse, CashRegisterCurrentResponse,
)
from app.auth import get_current_user, require_role
from app.models import User

router = APIRouter(prefix="/cash-register", tags=["cash-register"])


@router.get("/current", response_model=CashRegisterCurrentResponse)
def get_current_session(
    db: Session = Depends(get_db),
    user: User = Depends(require_role("administrador", "camarero", "cajero")),
):
    """Obtiene la caja abierta del usuario actual, o indica que no hay."""
    session = (
        db.query(CashRegisterSession)
        .filter(
            CashRegisterSession.user_id == user.id,
            CashRegisterSession.closed_at.is_(None),
        )
        .order_by(CashRegisterSession.opened_at.desc())
        .first()
    )
    if not session:
        return {"open": False, "session": None}

    # Calcular ventas y gastos de esta caja
    sales = (
        db.query(func.coalesce(func.sum(OrderItem.quantity * OrderItem.unit_price), 0))
        .join(Order, OrderItem.order_id == Order.id)
        .filter(
            Order.cash_register_id == session.id,
            Order.status == "cobrado",
        )
        .scalar() or 0
    )
    expenses_sum = (
        db.query(func.coalesce(func.sum(Expense.amount), 0))
        .filter(Expense.cash_register_id == session.id)
        .scalar() or 0
    )
    expected = float(session.opening_balance) + float(sales) - float(expenses_sum)
    return {
        "open": True,
        "session": {
            "id": session.id,
            "opened_at": session.opened_at,
            "opening_balance": float(session.opening_balance),
            "sales": float(sales),
            "expenses": float(expenses_sum),
            "expected_balance": expected,
        },
    }


@router.get("/suggested-opening")
def get_suggested_opening(
    db: Session = Depends(get_db),
    user: User = Depends(require_role("administrador", "cajero")),
):
    """Devuelve el monto sugerido para abrir caja (cierre anterior)."""
    last = (
        db.query(CashRegisterSession)
        .filter(CashRegisterSession.closed_at.isnot(None))
        .order_by(CashRegisterSession.closed_at.desc())
        .first()
    )
    if not last or last.closing_balance is None:
        return {"suggested_balance": 0}
    return {"suggested_balance": float(last.closing_balance)}


@router.post("", response_model=CashRegisterResponse)
def open_session(
    data: CashRegisterOpen,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("administrador", "cajero")),
):
    """Abre una nueva sesión de caja. Solo si no hay otra abierta."""
    existing = (
        db.query(CashRegisterSession)
        .filter(
            CashRegisterSession.user_id == user.id,
            CashRegisterSession.closed_at.is_(None),
        )
        .first()
    )
    if existing:
        raise HTTPException(400, "Ya tienes una caja abierta. Ciérrala primero.")
    session = CashRegisterSession(
        user_id=user.id,
        opening_balance=data.opening_balance,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("/{session_id}/detail")
def get_session_detail(
    session_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Detalle de una sesión: ventas (pedidos) y gastos."""
    session = db.query(CashRegisterSession).filter(CashRegisterSession.id == session_id).first()
    if not session:
        raise HTTPException(404, "Sesión no encontrada")
    if user.role and user.role.name != "administrador" and session.user_id != user.id:
        raise HTTPException(403, "No puedes ver esta sesión")

    orders = (
        db.query(Order)
        .filter(Order.cash_register_id == session_id, Order.status == "cobrado")
        .order_by(Order.updated_at.asc())
        .all()
    )
    expenses = db.query(Expense).filter(Expense.cash_register_id == session_id).order_by(Expense.created_at.asc()).all()

    sales_total = sum(
        float(oi.quantity or 0) * float(oi.unit_price or 0)
        for o in orders for oi in o.items
    )
    expenses_total = sum(float(e.amount or 0) for e in expenses)

    return {
        "session": {
            "id": session.id,
            "opened_at": session.opened_at,
            "closed_at": session.closed_at,
            "opening_balance": float(session.opening_balance),
            "closing_balance": float(session.closing_balance) if session.closing_balance else None,
            "expected_balance": float(session.expected_balance) if session.expected_balance else None,
            "sales_total": sales_total,
            "expenses_total": expenses_total,
        },
        "orders": [
            {
                "id": o.id,
                "total": sum(float(i.quantity or 0) * float(i.unit_price or 0) for i in o.items),
                "payment_type": o.payment_type or "efectivo",
                "updated_at": o.updated_at.isoformat() if o.updated_at else None,
            }
            for o in orders
        ],
        "expenses": [
            {"id": e.id, "amount": float(e.amount), "description": e.description, "payment_type": e.payment_type}
            for e in expenses
        ],
    }


@router.post("/{session_id}/close", response_model=CashRegisterResponse)
def close_session(
    session_id: int,
    data: CashRegisterClose,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("administrador", "cajero")),
):
    """Cierra la sesión de caja con el monto contado."""
    from datetime import datetime

    session = db.query(CashRegisterSession).filter(CashRegisterSession.id == session_id).first()
    if not session:
        raise HTTPException(404, "Sesión no encontrada")
    if session.closed_at:
        raise HTTPException(400, "Esta caja ya está cerrada")
    if session.user_id != user.id:
        raise HTTPException(403, "Solo quien abrió la caja puede cerrarla")

    # Calcular ventas y gastos
    sales = (
        db.query(func.coalesce(func.sum(OrderItem.quantity * OrderItem.unit_price), 0))
        .join(Order, OrderItem.order_id == Order.id)
        .filter(
            Order.cash_register_id == session.id,
            Order.status == "cobrado",
        )
        .scalar() or 0
    )
    expenses_sum = (
        db.query(func.coalesce(func.sum(Expense.amount), 0))
        .filter(Expense.cash_register_id == session.id)
        .scalar() or 0
    )
    expected = float(session.opening_balance) + float(sales) - float(expenses_sum)
    closing = float(data.closing_balance)
    diff = Decimal(str(closing - expected))

    session.closed_at = datetime.utcnow()
    session.closing_balance = Decimal(str(closing))
    session.expected_balance = Decimal(str(expected))
    session.difference = diff
    session.notes = data.notes
    db.commit()
    db.refresh(session)
    return session


@router.get("", response_model=List[CashRegisterResponse])
def list_sessions(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Lista el historial de sesiones de caja (todas o solo las del usuario)."""
    q = db.query(CashRegisterSession)
    if user.role and user.role.name != "administrador":
        q = q.filter(CashRegisterSession.user_id == user.id)
    return q.order_by(CashRegisterSession.opened_at.desc()).offset(skip).limit(limit).all()
