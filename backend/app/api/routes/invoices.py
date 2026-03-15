"""Rutas de facturación electrónica."""
import traceback
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Invoice, InvoiceItem, Order, OrderItem, Client
from app.schemas.invoice import InvoiceCreate, InvoiceResponse, InvoiceListResponse
from app.auth import get_current_user, require_role
from app.models import User
from app.services.hacienda import HaciendaService

router = APIRouter(prefix="/invoices", tags=["invoices"])


@router.get("", response_model=list[InvoiceListResponse])
def list_invoices(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    tipo: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
):
    """Lista facturas emitidas."""
    q = db.query(Invoice)
    if tipo:
        q = q.filter(Invoice.tipo_documento == tipo)
    if search:
        s = f"%{search.strip()}%"
        q = q.filter(
            (Invoice.consecutivo.ilike(s)) | (Invoice.clave.ilike(s))
        )
    invoices = q.order_by(Invoice.created_at.desc()).limit(limit).all()
    return [InvoiceListResponse.model_validate(inv) for inv in invoices]


@router.post("", response_model=InvoiceResponse)
def create_invoice(
    data: InvoiceCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Crea una factura desde un pedido.
    En modo simulación genera clave y consecutivo local sin enviar a Hacienda.
    """
    try:
        order = db.query(Order).filter(Order.id == data.order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Pedido no encontrado")
        client = db.query(Client).filter(Client.id == data.cliente_id).first() if data.cliente_id else None

        total = Decimal("0")
        subtotal = Decimal("0")
        items_data = []
        for oi in order.items:
            st = (oi.quantity or 1) * (oi.unit_price or 0)
            tax = st * Decimal("0.13")  # IVA 13% CR
            total += st + tax
            subtotal += st
            items_data.append({
                "product_id": oi.product_id,
                "description": oi.product.name if oi.product else "Producto",
                "quantity": oi.quantity,
                "unit_price": oi.unit_price,
                "subtotal": st,
                "tax": tax,
            })

        # Consecutivo único para evitar claves duplicadas
        next_seq = db.query(Invoice).count() + 1
        hacienda = HaciendaService()
        result = hacienda.emitir_documento(
            tipo=data.tipo_documento,
            cliente=client,
            items=items_data,
            total=float(total),
            subtotal=float(subtotal),
            consecutivo_num=next_seq,
        )

        inv = Invoice(
            cliente_id=data.cliente_id,
            order_id=order.id,
            tipo_documento=data.tipo_documento,
            clave=result.get("clave"),
            consecutivo=result.get("consecutivo"),
            estado_hacienda=result.get("estado"),
            is_simulated=result.get("simulado", True),
            total=total,
            subtotal=subtotal,
            impuesto=total - subtotal,
        )
        db.add(inv)
        db.commit()
        db.refresh(inv)

        for it in items_data:
            item = InvoiceItem(
                invoice_id=inv.id,
                product_id=it.get("product_id"),
                description=it["description"],
                quantity=it["quantity"],
                unit_price=it["unit_price"],
                subtotal=it["subtotal"],
                tax=it["tax"],
            )
            db.add(item)
        db.commit()
        db.refresh(inv)
        return InvoiceResponse.model_validate(inv)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al facturar: {str(e)}")


@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Obtiene detalle de una factura."""
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    return InvoiceResponse.model_validate(inv)
