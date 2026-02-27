# Comandos para probar la API de Facturas (PowerShell)

> **Requisito**: Asegúrate de que el servidor está corriendo con `npm run dev` en otra terminal.

Se usa `Invoke-RestMethod` que es nativo de PowerShell y no tiene problemas de escapado.

---

## 1. Crear una factura (POST)

```powershell
Invoke-RestMethod -Method POST -Uri http://localhost:3000/api/invoices -ContentType "application/json" -Body '{"clientCif":"B12345678","clientName":"Empresa Test S.L.","clientAddress":"Calle Falsa 123","baseAmount":1000,"vatAmount":210}'
```

## 2. Crear una segunda factura

```powershell
Invoke-RestMethod -Method POST -Uri http://localhost:3000/api/invoices -ContentType "application/json" -Body '{"clientCif":"A87654321","clientName":"Otra Empresa S.A.","clientAddress":"Avenida Real 456","baseAmount":500,"vatAmount":105}'
```

## 3. Listar todas las facturas (GET)

```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/invoices
```

## 4. Filtrar facturas por CIF de cliente

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/invoices?clientCif=B12345678"
```

## 5. Filtrar facturas por estado

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/invoices?status=borrador"
```

## 6. Obtener una factura por ID

> Sustituye `<ID>` por el `id` (UUID) que te devolvió el POST de creación.

```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/invoices/<ID>
```

## 7. Actualizar una factura en borrador (PUT)

```powershell
Invoke-RestMethod -Method PUT -Uri http://localhost:3000/api/invoices/<ID> -ContentType "application/json" -Body '{"clientCif":"B12345678","clientName":"Empresa Modificada S.L.","clientAddress":"Calle Nueva 789","baseAmount":2000,"vatAmount":420}'
```

## 8. Finalizar una factura (PATCH)

```powershell
Invoke-RestMethod -Method PATCH -Uri http://localhost:3000/api/invoices/<ID>/finalize
```

## 9. Intentar finalizar la misma factura otra vez (debería dar error 400)

```powershell
Invoke-RestMethod -Method PATCH -Uri http://localhost:3000/api/invoices/<ID>/finalize
```

## 10. Intentar eliminar una factura definitiva (debería dar error 403)

```powershell
Invoke-RestMethod -Method DELETE -Uri http://localhost:3000/api/invoices/<ID>
```

## 11. Eliminar una factura en borrador (DELETE 204)

> Usa el ID de una factura que **no** hayas finalizado.

```powershell
Invoke-RestMethod -Method DELETE -Uri http://localhost:3000/api/invoices/<ID_BORRADOR>
```

## 12. Intentar crear una factura sin campos obligatorios (error 400)

```powershell
Invoke-RestMethod -Method POST -Uri http://localhost:3000/api/invoices -ContentType "application/json" -Body '{"clientCif":"B12345678"}'
```

---

## Flujo completo de ejemplo

```powershell
# 1. Crear factura
Invoke-RestMethod -Method POST -Uri http://localhost:3000/api/invoices -ContentType "application/json" -Body '{"clientCif":"B99999999","clientName":"Demo S.L.","clientAddress":"Plaza Mayor 1","baseAmount":100,"vatAmount":21}'

# 2. Copiar el ID del JSON devuelto y usarlo abajo

# 3. Finalizar
Invoke-RestMethod -Method PATCH -Uri http://localhost:3000/api/invoices/<ID>/finalize

# 4. Intentar borrar (dará 403 porque es definitiva)
Invoke-RestMethod -Method DELETE -Uri http://localhost:3000/api/invoices/<ID>
```

---

## Endpoint protegido (requiere autenticación)

> El token válido es: `mi-token-secreto-123`

### Sin token (error 401)

```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/protected
```

### Con token incorrecto (error 403)

```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/protected -Headers @{Authorization="Bearer token-malo"}
```

### Con token correcto (200)

```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/protected -Headers @{Authorization="Bearer mi-token-secreto-123"}
```
