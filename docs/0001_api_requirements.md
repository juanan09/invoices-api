# Requisitos de la API de Facturas

## Casos de Uso Identificados

1. **Guardar Factura:**
   - Se debe poder guardar una factura que incluya el CIF del cliente, su denominación social y la dirección fiscal.
   - Debe contener el importe desglosado (base imponible + IVA).

2. **Numeración Correlativa:**
   - A cada factura se le asignará una numeración correlativa.
   - Esta numeración debe incluir un prefijo configurable mediante una variable de entorno (Ejemplo: `INVOICE_PREFIX=BT` para generar `BT001`, `BT002`, ...).

3. **Ciclo de Vida y Estados (Borrador vs Definitivo):**
   - Las facturas deben tener dos estados: **borrador** y **definitivo**.
   - **Borrador:** Estado inicial. En este estado la factura se puede eliminar o modificar libremente.
   - **Definitivo:** Al pasar a este estado, se le asigna el siguiente valor correlativo de la numeración. Una factura en estado definitivo ya **no** se puede eliminar ni alterar.

---

## Propuesta de Endpoints (REST API)

### 1. `POST /api/invoices`
- **Descripción:** Crea una nueva factura. Por defecto se crea en estado 'borrador'.
- **Body Request:**
  ```json
  {
    "clientCif": "B12345678",
    "clientName": "Empresa Ejemplo S.L.",
    "clientAddress": "Calle Falsa 123, Madrid",
    "baseAmount": 100.00,
    "vatAmount": 21.00
  }
  ```
- **Respuesta (201 Created):**
  ```json
  {
    "id": "uuid-factura",
    "status": "borrador",
    "clientCif": "B12345678",
    "clientName": "Empresa Ejemplo S.L.",
    "clientAddress": "Calle Falsa 123, Madrid",
    "baseAmount": 100.00,
    "vatAmount": 21.00,
    "totalAmount": 121.00,
    "invoiceNumber": null,
    "createdAt": "2026-02-24T18:00:00Z"
  }
  ```

### 2. `GET /api/invoices`
- **Descripción:** Lista todas las facturas, con opción de filtrado (por estado, CIF, etc.).
- **Respuesta (200 OK):**
  ```json
  [
    {
      "id": "uuid-factura-1",
      "status": "definitivo",
      "invoiceNumber": "BT001",
      "clientCif": "B12345678",
      "clientName": "Empresa Ejemplo S.L.",
      "totalAmount": 121.00,
      "createdAt": "2026-02-24T18:00:00Z"
    },
    {
      "id": "uuid-factura-2",
      "status": "borrador",
      "invoiceNumber": null,
      "clientCif": "A87654321",
      "clientName": "Otra Empresa S.A.",
      "totalAmount": 242.00,
      "createdAt": "2026-02-24T18:30:00Z"
    }
  ]
  ```

### 3. `GET /api/invoices/:id`
- **Descripción:** Obtiene los detalles de una factura específica por su ID interno.
- **Respuesta (200 OK):**
  ```json
  {
    "id": "uuid-factura",
    "status": "borrador",
    "clientCif": "B12345678",
    "clientName": "Empresa Ejemplo S.L.",
    "clientAddress": "Calle Falsa 123, Madrid",
    "baseAmount": 100.00,
    "vatAmount": 21.00,
    "totalAmount": 121.00,
    "invoiceNumber": null,
    "createdAt": "2026-02-24T18:00:00Z"
  }
  ```
- **Respuesta de Error (404 Not Found):**
  ```json
  {
    "error": "Factura no encontrada"
  }
  ```

### 4. `PUT /api/invoices/:id`
- **Descripción:** Actualiza los datos de la factura (solo permitido si `status == 'borrador'`).
- **Body Request:**
  ```json
  {
    "clientCif": "B12345678",
    "clientName": "Empresa Ejemplo Editada S.L.",
    "clientAddress": "Calle Verdadera 456, Madrid",
    "baseAmount": 150.00,
    "vatAmount": 31.50
  }
  ```
- **Respuesta (200 OK):**
  ```json
  {
    "id": "uuid-factura",
    "status": "borrador",
    "clientCif": "B12345678",
    "clientName": "Empresa Ejemplo Editada S.L.",
    "clientAddress": "Calle Verdadera 456, Madrid",
    "baseAmount": 150.00,
    "vatAmount": 31.50,
    "totalAmount": 181.50,
    "invoiceNumber": null,
    "createdAt": "2026-02-24T18:00:00Z"
  }
  ```
- **Respuesta de Error:** `400 Bad Request` o `403 Forbidden` si la factura está en estado 'definitivo'.
  ```json
  {
    "error": "No se puede modificar una factura en estado definitivo"
  }
  ```

### 5. `DELETE /api/invoices/:id`
- **Descripción:** Elimina la factura (solo permitido si `status == 'borrador'`).
- **Respuesta (204 No Content):**
  *(Sin cuerpo de respuesta)*
- **Respuesta de Error:** `400 Bad Request` o `403 Forbidden` si la factura está en estado 'definitivo'.
  ```json
  {
    "error": "No se puede eliminar una factura en estado definitivo"
  }
  ```

### 6. `PATCH /api/invoices/:id/finalize`
- **Descripción:** Cambia el estado de la factura de 'borrador' a 'definitivo'. Es en este momento donde se genera y asigna la numeración correlativa.
- **Body Request:**
  *(Vacío)*
- **Respuesta (200 OK):**
  ```json
  {
    "id": "uuid-factura",
    "status": "definitivo",
    "invoiceNumber": "BT001",
    "clientCif": "B12345678",
    "clientName": "Empresa Ejemplo S.L.",
    "clientAddress": "Calle Falsa 123, Madrid",
    "baseAmount": 100.00,
    "vatAmount": 21.00,
    "totalAmount": 121.00,
    "createdAt": "2026-02-24T18:00:00Z"
  }
  ```
- **Respuesta de Error (400 Bad Request):**
  ```json
  {
    "error": "La factura ya se encuentra en estado definitivo"
  }
  ```
