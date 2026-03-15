"""
Servicio de facturación electrónica - Integración Hacienda Costa Rica.
Modo simulación: genera documentos sin enviar a Hacienda.
Modo real: (pendiente) envío a APIs de Hacienda CR.
"""
from decimal import Decimal
from typing import List, Dict, Any
from datetime import datetime

from config.settings import is_hacienda_simulation, get_hacienda_config


def generar_clave_electronica(
    pais: str = "506",
    dia: str = None,
    mes: str = None,
    anno: str = None,
    cedula: str = "00000000000",
    situacion: str = "1",
    consecutivo: str = "000000000001",
    codigo_seguridad: str = "1",
) -> str:
    """
    Genera clave electrónica para documento fiscal.
    Formato: país(3) + día(2) + mes(2) + año(2) + cédula(12) + situación(1) + consecutivo(20) + código(8)
    """
    now = datetime.utcnow()
    dia = dia or f"{now.day:02d}"
    mes = mes or f"{now.month:02d}"
    anno = anno or str(now.year)[-2:]
    return f"{pais}{dia}{mes}{anno}{cedula[:12].zfill(12)}{situacion}{consecutivo.zfill(20)}{codigo_seguridad.zfill(8)}"


def generar_xml_factura(cliente: Dict, items: List[Dict], total: Decimal, subtotal: Decimal, impuesto: Decimal) -> str:
    """Genera XML simplificado de factura (para simulación y contingencia)."""
    clave = generar_clave_electronica()
    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<FacturaElectronica xmlns="https://cdn.comprobanteselectronicos.go.cr/xml-schemas/v4.3/facturaElectronica">
  <Clave>{clave}</Clave>
  <CodigoActividad>471900</CodigoActividad>
  <NumeroConsecutivo>001-001-000000001</NumeroConsecutivo>
  <FechaEmision>{datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S-06:00')}</FechaEmision>
  <Receptor>
    <Nombre>{cliente.get('nombre', 'Cliente General')}</Nombre>
    <Identificacion>
      <Tipo>02</Tipo>
      <Numero>{cliente.get('nit', '0000000000')}</Numero>
    </Identificacion>
  </Receptor>
  <ResumenFactura>
    <TotalVenta>{total}</TotalVenta>
    <SubTotal>{subtotal}</SubTotal>
    <TotalImpuesto>{impuesto}</TotalImpuesto>
  </ResumenFactura>
</FacturaElectronica>"""
    return xml, clave


def emitir_documento_simulado(
    tipo: str, cliente: Dict, items: List[Dict], total: float, subtotal: float,
    consecutivo_num: int = None,
) -> Dict[str, Any]:
    """
    Emite documento en modo simulación.
    Retorna datos del documento sin enviar a Hacienda.
    consecutivo_num: número secuencial único para evitar claves duplicadas (opcional).
    """
    impuesto = total - subtotal
    if consecutivo_num is None:
        # Fallback: timestamp en microsegundos para unicidad
        import time
        consecutivo_num = int(time.time() * 1_000_000) % (10 ** 20)
    consecutivo_str = str(consecutivo_num).zfill(20)
    clave = generar_clave_electronica(consecutivo=consecutivo_str)
    # Formato máximo 20 chars para BD varchar(20): 001-001-YYMMDD-NNNN
    now = datetime.utcnow()
    consecutivo = f"001-001-{now.strftime('%y%m%d')}-{consecutivo_num % 10000:04d}"
    return {
        "clave": clave,
        "consecutivo": consecutivo,
        "estado": "aceptado" if is_hacienda_simulation() else "pendiente",
        "simulado": True,
        "total": total,
        "subtotal": subtotal,
        "impuesto": impuesto,
    }


class HaciendaService:
    """Servicio para emisión de documentos electrónicos (simulación o Hacienda real)."""

    def emitir_documento(
        self,
        tipo: str,
        cliente: Any,
        items: List[Dict],
        total: float,
        subtotal: float,
        consecutivo_num: int = None,
    ) -> Dict[str, Any]:
        """Emite documento. En modo simulación no envía a Hacienda."""
        client_dict = {}
        if cliente:
            client_dict = {
                "nombre": getattr(cliente, "nombre_legal", None) or getattr(cliente, "name", "Cliente General"),
                "nit": getattr(cliente, "nit", None) or "0000000000",
            }
        return emitir_documento_simulado(tipo, client_dict, items, total, subtotal, consecutivo_num)
