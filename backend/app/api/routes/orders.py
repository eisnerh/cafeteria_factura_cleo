"""Rutas de pedidos y split de cuentas."""
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models import Order, OrderItem, OrderSplit, TableSession, Product
from app.schemas.order import OrderCreate, OrderUpdate, OrderResponse, OrderItemCreate, OrderSplitRequest
from app.auth import get_current_user, require_role
from app.models import User

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=OrderResponse)
def create_order(
    data: OrderCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("administrador", "camarero", "cajero")),
):
    """Crea un pedido con ítems."""
    order = Order(
        session_id=data.session_id,
        client_id=data.client_id,
        notes=data.notes,
        status="pendiente",
    )
    db.add(order)
    db.flush()
    for it in data.items:
        item = OrderItem(
            order_id=order.id,
            product_id=it.product_id,
            quantity=it.quantity,
            unit_price=it.unit_price,
            notes=it.notes,
            split_group=it.split_group,
        )
        db.add(item)
        product = db.query(Product).filter(Product.id == it.product_id).first()
        if product and product.stock is not None:
            new_stock = float(product.stock or 0) - float(it.quantity)
            product.stock = max(0, new_stock)
    db.commit()
    db.refresh(order)
    return order


@router.get("", response_model=List[OrderResponse])
def list_orders(
    session_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Lista pedidos con filtros."""
    q = db.query(Order)
    if session_id:
        q = q.filter(Order.session_id == session_id)
    if status:
        q = q.filter(Order.status == status)
    return q.offset(skip).limit(limit).all()


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Obtiene un pedido por ID."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return order


@router.patch("/{order_id}", response_model=OrderResponse)
def update_order(
    order_id: int,
    data: OrderUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("administrador", "camarero", "cocina", "cajero")),
):
    """Actualiza estado/notas de un pedido."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    if data.status is not None:
        order.status = data.status
    if data.notes is not None:
        order.notes = data.notes
    db.commit()
    db.refresh(order)
    return order


@router.post("/{order_id}/split")
def create_split(
    order_id: int,
    data: OrderSplitRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("administrador", "camarero", "cajero")),
):
    """Registra split de cuenta: por ítems o por iguales."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    total = sum(float(i.quantity or 0) * float(i.unit_price or 0) for i in order.items)
    amount_per_guest = None
    if data.split_type == "iguales" and data.total_guests and data.total_guests > 0:
        amount_per_guest = Decimal(str(round(total / data.total_guests, 2)))
    split = OrderSplit(
        order_id=order_id,
        split_type=data.split_type,
        total_guests=data.total_guests,
        amount_per_guest=amount_per_guest,
    )
    db.add(split)
    db.commit()
    return {"message": "Split registrado", "amount_per_guest": str(amount_per_guest) if amount_per_guest else None}


@router.post("/{order_id}/mark-printed")
def mark_printed(
    order_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("administrador", "camarero", "cocina", "cajero")),
):
    """Marca el pedido como impreso (comanda)."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    order.printed = True
    db.commit()
    return {"message": "Pedido marcado como impreso"}


@router.get("/{order_id}/ticket")
def get_ticket(
    order_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Retorna HTML formateado para impresora térmica (80mm).
    Usar window.print() desde el cliente para imprimir.
    """
    from fastapi.responses import HTMLResponse
    from sqlalchemy.orm import joinedload
    order = db.query(Order).options(
        joinedload(Order.items).joinedload(OrderItem.product)
    ).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    items_html = "".join(
        f"<tr><td>{float(i.quantity or 0)}x</td><td>{i.product.name if i.product else 'Item'}</td>"
        f"<td>₡{float(i.unit_price or 0) * float(i.quantity or 0):,.0f}</td></tr>"
        for i in order.items
    )
    total = sum(float(i.quantity or 0) * float(i.unit_price or 0) for i in order.items)
    html = f"""<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    body {{ font-family: monospace; width: 280px; margin: 0 auto; padding: 10px; font-size: 12px; }}
    .center {{ text-align: center; }}
    table {{ width: 100%; }}
    hr {{ border: none; border-top: 1px dashed #000; }}
    </style></head><body>
    <div class="center"><strong>CAFETERÍA CLEO</strong><br>COMANDA #{order.id}</div>
    <hr><table>{items_html}</table><hr>
    <div class="center"><strong>TOTAL: ₡{total:,.0f}</strong></div>
    <p class="center"><small>Gracias por su compra</small></p></body></html>"""
    return HTMLResponse(html)
