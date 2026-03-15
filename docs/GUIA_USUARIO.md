# Guía de Usuario - Cafetería CLEO

## 1. Acceso al Sistema

1. Abrir el navegador en la URL del sistema (ej. `http://localhost:5173`).
2. Ingresar **email** y **contraseña**.
3. Usuario inicial: `admin@cafeteria.local` / `admin123`.

### Recuperar contraseña
- En la pantalla de login, usar "¿Olvidaste tu contraseña?".
- Ingresar email y seguir instrucciones (el enlace se genera; en desarrollo puede consultarse el token en logs).

---

## 2. Dashboard

- Resumen de **productos**, **stock bajo**, **mesas totales** y **mesas ocupadas**.
- Acceso rápido a las secciones del menú lateral.

---

## 3. Inventario

- **Listar productos:** ver nombre, precio, stock y mínimo.
- **Alertas:** productos con stock bajo se muestran destacados.
- **Crear/editar producto:** nombre, descripción, precio, costo, código de barras, stock mínimo.
- **Movimientos:** entradas, salidas, ajustes con historial.

---

## 4. Mesas

- **Mapa de mesas:** estado (libre, ocupada, reservada).
- **Abrir mesa:** asignar camarero y número de comensales.
- **Cerrar mesa:** finalizar la sesión y liberar la mesa.

---

## 5. Pedidos

- Crear pedido desde una sesión de mesa abierta.
- Añadir ítems (producto, cantidad, precio).
- **Split de cuenta:**
  - **Por ítems:** asignar cada ítem a un grupo (cada cliente paga lo suyo).
  - **Por iguales:** dividir el total entre N comensales.
- Marcar como impreso (comanda enviada a cocina/barra).

---

## 6. Clientes

- Registrar cliente: nombre, teléfono, correo.
- **Factura con NIT:** activar opción y completar NIT, nombre legal, dirección.
- Historial de compras visible en el detalle del cliente.

---

## 7. Facturación

- Emitir factura (FE), ticket (TE), nota de crédito (NC) o débito (ND).
- Seleccionar pedido y cliente.
- En modo **simulación**, se genera documento local sin envío a Hacienda.
- Ver e imprimir documentos emitidos.

---

## 8. Gastos

- Registrar gastos con monto, descripción, categoría y proveedor.
- Categorías: Proveedores, Servicios, Alquiler, Otros.
- Asociar proveedores (nombre, contacto, teléfono, email).

---

## 9. Reservas

- Calendario día/semana/mes.
- Crear reserva: fecha, hora, mesa, comensales, notas.
- Modificar y cancelar reservas.
- Notificaciones visuales cuando se acerca una reserva.

---

## 10. Reportes

- **Ventas:** gráficos por día/semana/mes.
- **Productos más vendidos:** ranking.
- **Ingresos vs gastos:** rentabilidad.
- **Ranking de camareros:** por ventas.
- Exportar a PDF/Excel (según implementación).

---

## 11. Roles y Permisos

| Rol         | Permisos principales                                      |
|------------|------------------------------------------------------------|
| Administrador | Todo el sistema, usuarios, configuración                  |
| Camarero    | Mesas, pedidos, reservas                                  |
| Cocina      | Pedidos, comandas                                         |
| Cajero      | Facturación, caja                                         |

---

## 12. Impresión Térmica

- Configurar impresoras por área (cocina, barra).
- Imprimir comandas y tickets desde el navegador.
- El formato se adapta a impresoras Epson/Star (80mm típico).
