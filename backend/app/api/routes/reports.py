"""Rutas de reportes visuales."""
from datetime import date, timedelta
from decimal import Decimal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import Invoice, InvoiceItem, Order, OrderItem, Expense
from app.auth import get_current_user
from app.models import User

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/sales")
def sales_report(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    desde: date = Query(None),
    hasta: date = Query(None),
):
    """Ventas por período para gráficos."""
    hasta = hasta or date.today()
    desde = desde or hasta - timedelta(days=30)
    rows = (
        db.query(
            func.date(Invoice.created_at).label("fecha"),
            func.sum(Invoice.total).label("total"),
        )
        .filter(
            Invoice.created_at >= desde,
            Invoice.created_at <= hasta,
        )
        .group_by(func.date(Invoice.created_at))
        .order_by("fecha")
        .all()
    )
    return {"data": [{"date": str(r.fecha), "total": float(r.total or 0)} for r in rows]}


@router.get("/top-products")
def top_products(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    desde: date = Query(None),
    hasta: date = Query(None),
    limit: int = Query(10, le=50),
):
    """Productos más vendidos."""
    hasta = hasta or date.today()
    desde = desde or hasta - timedelta(days=30)
    rows = (
        db.query(
            InvoiceItem.description,
            func.sum(InvoiceItem.quantity).label("cantidad"),
            func.sum(InvoiceItem.subtotal).label("monto"),
        )
        .join(Invoice)
        .filter(
            Invoice.created_at >= desde,
            Invoice.created_at <= hasta,
        )
        .group_by(InvoiceItem.description)
        .order_by(func.sum(InvoiceItem.quantity).desc())
        .limit(limit)
        .all()
    )
    return {
        "data": [
            {"producto": r.description, "cantidad": float(r.cantidad or 0), "monto": float(r.monto or 0)}
            for r in rows
        ]
    }


@router.get("/income-vs-expenses")
def income_vs_expenses(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    desde: date = Query(None),
    hasta: date = Query(None),
):
    """Ingresos vs gastos para rentabilidad."""
    hasta = hasta or date.today()
    desde = desde or hasta - timedelta(days=30)
    ingresos = (
        db.query(func.sum(Invoice.total))
        .filter(Invoice.created_at >= desde, Invoice.created_at <= hasta)
        .scalar() or Decimal("0")
    )
    gastos = (
        db.query(func.sum(Expense.amount))
        .filter(Expense.created_at >= desde, Expense.created_at <= hasta)
        .scalar() or Decimal("0")
    )
    return {
        "ingresos": float(ingresos),
        "gastos": float(gastos),
        "utilidad_bruta": float(ingresos - gastos),
    }


@router.get("/waiter-ranking")
def waiter_ranking(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    desde: date = Query(None),
    hasta: date = Query(None),
    limit: int = Query(10, le=50),
):
    """Ranking de camareros por ventas (requiere asociar sesiones a facturas)."""
    hasta = hasta or date.today()
    desde = desde or hasta - timedelta(days=30)
    # Simplificado: usar orders con session.waiter
    from app.models import TableSession
    rows = (
        db.query(
            TableSession.waiter_id,
            func.count(Order.id).label("pedidos"),
        )
        .join(Order, Order.session_id == TableSession.id)
        .filter(TableSession.opened_at >= desde, TableSession.opened_at <= hasta)
        .group_by(TableSession.waiter_id)
        .order_by(func.count(Order.id).desc())
        .limit(limit)
        .all()
    )
    return {"data": [{"waiter_id": r.waiter_id, "pedidos": r.pedidos} for r in rows]}
