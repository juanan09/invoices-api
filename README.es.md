# 🧾 Invoices API

API REST para la gestión de facturas. Permite crear, listar, modificar, finalizar y eliminar facturas con numeración correlativa y control de estados.

## 📋 Tabla de contenidos

- [Tecnologías](#-tecnologías)
- [Arquitectura](#-arquitectura)
- [Instalación](#-instalación)
- [Docker](#-docker)
- [Variables de entorno](#-variables-de-entorno)
- [Scripts disponibles](#-scripts-disponibles)
- [Endpoints](#-endpoints)
- [Autenticación](#-autenticación)
- [Testing](#-testing)
- [Base de datos](#-base-de-datos)
- [Documentación](#-documentación)

## 🛠 Tecnologías

| Tecnología               | Uso                            |
| ------------------------ | ------------------------------ |
| **Node.js + TypeScript** | Runtime y lenguaje             |
| **Express**              | Framework HTTP                 |
| **PostgreSQL**           | Base de datos relacional       |
| **pg**                   | Driver PostgreSQL para Node.js |
| **dotenv**               | Variables de entorno           |
| **Docker**               | Contenedor para PostgreSQL     |
| **Vitest**               | Framework de testing           |
| **Supertest**            | Testing de endpoints HTTP      |
| **Swagger UI Express**   | Documentación interactiva API  |
| **YAMLjs**               | Parseo de YAML (OpenAPI)       |

## 🏗 Arquitectura

El proyecto sigue una **arquitectura por capas (Clean Architecture)** con separación clara de responsabilidades:

```
src/
├── domain/                          # 🧠 Capa de Dominio
│   └── Invoice.ts                   # Entidad Invoice + interfaz InvoiceRepository
│
├── use-cases/                       # 📋 Capa de Negocio (Use Cases)
│   └── InvoiceUseCases.ts           # Lógica de negocio pura
│
├── persistence/                     # 💾 Capa de Persistencia (Repository)
│   ├── InMemoryInvoiceRepository.ts # Implementación en memoria (tests)
│   └── PostgresInvoiceRepository.ts # Implementación con PostgreSQL (producción)
│
├── transport/                       # 🌐 Capa de Transporte (Express)
│   ├── InvoiceController.ts         # Manejo de request/response HTTP
│   └── invoiceRoutes.ts             # Definición de rutas
│
├── middleware/                      # ⚙️ Middlewares
│   ├── requestLogger.ts             # Logging de peticiones (método, URL, status, tiempo)
│   └── auth.ts                      # Autenticación por Bearer token
│
├── database/                        # 🗄️ Base de datos
│   ├── connection.ts                # Pool de conexiones PostgreSQL
│   └── migrations/
│       ├── 001_create_invoices_table.sql  # Migración: tabla invoices
│       ├── migrator.ts              # Motor de migraciones con tabla de control
│       └── run-migrations.ts        # Script ejecutable
│
├── app.ts                           # Wiring de todas las capas
└── server.ts                        # Arranque del servidor
```

### Principios de diseño

- **Inyección de dependencias**: Las capas superiores reciben sus dependencias, no las crean. `createApp()` acepta un repositorio opcional, permitiendo inyectar diferentes implementaciones.
- **Patrón Repository**: La capa de dominio define una interfaz (`InvoiceRepository`) con métodos `connect()`, `disconnect()`, `save()`, `findAll()`, etc. La persistencia la implementa.
  - `InMemoryInvoiceRepository`: Para tests (connect/disconnect son no-ops).
  - `PostgresInvoiceRepository`: Para producción (connect verifica la conexión al pool).
- **Separación de responsabilidades**: Cada capa tiene una única función (transporte → HTTP, use cases → negocio, persistence → datos).

### Flujo de arranque del servidor

```
1. Se crea el repositorio (PostgresInvoiceRepository)
2. Se llama a repository.connect() → verifica conexión a PostgreSQL
3. Se ejecutan las migraciones pendientes
4. Se inyecta el repositorio en createApp()
5. Se arranca el servidor Express
6. Al recibir SIGINT → repository.disconnect() cierra el pool
```

## 🚀 Instalación

```bash
# Clonar el repositorio
git clone https://github.com/juanan09/invoices-api.git
cd invoices-api

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus datos de conexión
```

## 🐳 Docker

El proyecto incluye un `Dockerfile` para generar la imagen del servidor y un `docker-compose.yml` que levanta todo el stack (PostgreSQL + API).

### Levantar todo con Docker Compose

```powershell
# Levantar PostgreSQL + API (reconstruye la imagen si hay cambios)
docker compose up --build

# En segundo plano
docker compose up --build -d

# Ver estado de los contenedores
docker compose ps

# Ver logs
docker compose logs api
docker compose logs postgres

# Parar todo
docker compose down

# Parar y eliminar datos de la BD
docker compose down -v
```

### Solo PostgreSQL (desarrollo local)

Si prefieres ejecutar el servidor con `npm run dev` y solo usar Docker para PostgreSQL:

```powershell
docker compose up postgres -d
npm run db:migrate
npm run dev
```

### Construir la imagen del servidor

```powershell
# Construir
docker build -t invoices-api .

# Ejecutar manualmente
docker run --rm -p 3000:3000 --env-file .env invoices-api
```

### Servicios de Docker Compose

| Servicio   | Imagen               | Puerto externo | Descripción                    |
| ---------- | -------------------- | -------------- | ------------------------------ |
| `postgres` | `postgres:16-alpine` | `5555`         | Base de datos PostgreSQL       |
| `api`      | `invoices-api`       | `3000`         | Servidor Express (build local) |

> **Nota**: El puerto `5555` se usa porque el `5432` puede estar ocupado por una instalación local de PostgreSQL. Se configura desde `.env` con `DB_PORT`.

## 🔐 Variables de entorno

Copia `.env.example` a `.env` y configura los valores:

| Variable      | Descripción                     | Valor por defecto      |
| ------------- | ------------------------------- | ---------------------- |
| `DB_HOST`     | Host de PostgreSQL              | `localhost`            |
| `DB_PORT`     | Puerto de PostgreSQL            | `5432`                 |
| `DB_USER`     | Usuario de PostgreSQL           | `postgres`             |
| `DB_PASSWORD` | Contraseña de PostgreSQL        | `postgres`             |
| `DB_NAME`     | Nombre de la base de datos      | `invoices_db`          |
| `PORT`        | Puerto del servidor             | `3000`                 |
| `AUTH_TOKEN`  | Token para endpoints protegidos | `mi-token-secreto-123` |

## 📜 Scripts disponibles

| Comando                 | Descripción                                           |
| ----------------------- | ----------------------------------------------------- |
| `npm run dev`           | Arranca el servidor en modo desarrollo con hot-reload |
| `npm run build`         | Compila TypeScript a JavaScript                       |
| `npm start`             | Arranca el servidor compilado (producción)            |
| `npm test`              | Ejecuta todos los tests                               |
| `npm run test:watch`    | Ejecuta los tests en modo watch                       |
| `npm run test:ui`       | Abre la interfaz visual de Vitest                     |
| `npm run test:coverage` | Ejecuta tests con reporte de cobertura                |
| `npm run db:migrate`    | Ejecuta las migraciones pendientes en PostgreSQL      |

## 📡 Endpoints

### Facturas (públicos)

| Método   | Ruta                         | Descripción                                                  |
| -------- | ---------------------------- | ------------------------------------------------------------ |
| `POST`   | `/api/invoices`              | Crear una factura (estado `borrador`)                        |
| `GET`    | `/api/invoices`              | Listar facturas (filtros: `?status=`, `?clientCif=`)         |
| `GET`    | `/api/invoices/:id`          | Obtener una factura por ID                                   |
| `PUT`    | `/api/invoices/:id`          | Modificar una factura (solo en `borrador`)                   |
| `PATCH`  | `/api/invoices/:id/finalize` | Finalizar factura (pasa a `definitivo`, asigna número BT001) |
| `DELETE` | `/api/invoices/:id`          | Eliminar factura (solo en `borrador`)                        |

### Endpoint protegido

| Método | Ruta             | Descripción                               |
| ------ | ---------------- | ----------------------------------------- |
| `GET`  | `/api/protected` | Recurso protegido (requiere Bearer token) |

### Ejemplos con PowerShell

```powershell
# Crear factura
Invoke-RestMethod -Method POST -Uri http://localhost:3000/api/invoices -ContentType "application/json" -Body '{"clientCif":"B12345678","clientName":"Empresa S.L.","clientAddress":"Calle 123","baseAmount":1000,"vatAmount":210}'

# Listar facturas
Invoke-RestMethod -Uri http://localhost:3000/api/invoices

# Filtrar por estado
Invoke-RestMethod -Uri "http://localhost:3000/api/invoices?status=borrador"

# Finalizar factura (sustituir <ID> por el UUID real)
Invoke-RestMethod -Method PATCH -Uri http://localhost:3000/api/invoices/<ID>/finalize

# Acceder a recurso protegido
Invoke-RestMethod -Uri http://localhost:3000/api/protected -Headers @{Authorization="Bearer mi-token-secreto-123"}
```

### Campos del body (POST / PUT)

```json
{
  "clientCif": "B12345678",
  "clientName": "Empresa Test S.L.",
  "clientAddress": "Calle Falsa 123",
  "baseAmount": 1000,
  "vatAmount": 210
}
```

> El `totalAmount` se calcula automáticamente (`baseAmount + vatAmount`).

### Códigos de respuesta

| Código | Significado                                                          |
| ------ | -------------------------------------------------------------------- |
| `200`  | Operación exitosa                                                    |
| `201`  | Factura creada                                                       |
| `204`  | Factura eliminada                                                    |
| `400`  | Faltan campos requeridos o la factura ya es definitiva               |
| `401`  | Token no proporcionado                                               |
| `403`  | Token inválido o acción no permitida (ej: borrar factura definitiva) |
| `404`  | Factura no encontrada                                                |

## 🔒 Autenticación

El endpoint `/api/protected` requiere un token Bearer en el header `Authorization`:

```powershell
# Sin token → 401
Invoke-RestMethod -Uri http://localhost:3000/api/protected

# Token incorrecto → 403
Invoke-RestMethod -Uri http://localhost:3000/api/protected -Headers @{Authorization="Bearer token-malo"}

# Token correcto → 200
Invoke-RestMethod -Uri http://localhost:3000/api/protected -Headers @{Authorization="Bearer mi-token-secreto-123"}
```

## 🧪 Testing

El proyecto usa **TDD (Test-Driven Development)**. Los tests se escriben primero y luego se implementa el código para que pasen.

Los tests usan `InMemoryInvoiceRepository` automáticamente (no necesitan PostgreSQL):

```bash
# Ejecutar todos los tests
npm test

# Modo watch (re-ejecuta al guardar)
npm run test:watch

# Con cobertura
npm run test:coverage
```

### Suites de tests

| Archivo                  | Tests | Descripción                                                            |
| ------------------------ | ----- | ---------------------------------------------------------------------- |
| `tests/invoices.test.ts` | 15    | CRUD completo de facturas, filtros, finalización y borrado             |
| `tests/auth.test.ts`     | 4     | Autenticación: sin token, token malo, formato incorrecto, token válido |
| `tests/dummy.test.ts`    | 1     | Test de verificación del framework                                     |

## 🗄 Base de datos

### PostgreSQL

La aplicación usa PostgreSQL como base de datos en producción. La tabla principal es `invoices`:

| Columna          | Tipo                       | Notas                                      |
| ---------------- | -------------------------- | ------------------------------------------ |
| `id`             | `UUID`                     | Clave primaria                             |
| `client_cif`     | `VARCHAR(20)`              | CIF del cliente (indexado)                 |
| `client_name`    | `VARCHAR(255)`             | Nombre del cliente                         |
| `client_address` | `VARCHAR(500)`             | Dirección del cliente                      |
| `base_amount`    | `DECIMAL(12,2)`            | Importe base                               |
| `vat_amount`     | `DECIMAL(12,2)`            | Importe IVA                                |
| `total_amount`   | `DECIMAL(12,2)`            | Total (base + IVA)                         |
| `status`         | `VARCHAR(20)`              | `borrador` o `definitivo` (indexado)       |
| `invoice_number` | `VARCHAR(20)`              | Número correlativo, **UNIQUE** (ej: BT001) |
| `created_at`     | `TIMESTAMP WITH TIME ZONE` | Fecha de creación                          |

### Doble implementación de persistencia

| Repositorio                 | Uso                 | Requiere BD     |
| --------------------------- | ------------------- | --------------- |
| `InMemoryInvoiceRepository` | Tests automatizados | No              |
| `PostgresInvoiceRepository` | Servidor real       | Sí (PostgreSQL) |

Ambos implementan la misma interfaz `InvoiceRepository`, incluyendo `connect()` y `disconnect()`. Esto permite intercambiarlos sin tocar ninguna otra capa.

### Sistema de migraciones

Las migraciones se gestionan con un motor propio que:

1. Crea una tabla `migrations` para registrar las ejecutadas
2. Lee los archivos `.sql` del directorio de migraciones
3. Ejecuta solo las pendientes, en orden alfabético
4. Cada migración se ejecuta dentro de una transacción (rollback si falla)

```bash
# Ejecutar migraciones
npm run db:migrate
```

Para añadir nuevas migraciones, crear archivos con prefijo numérico:
```
src/database/migrations/
├── 001_create_invoices_table.sql
├── 002_add_new_column.sql        # ← Ejemplo futuro
└── 003_create_clients_table.sql  # ← Ejemplo futuro
```

## 📚 Documentación

La API proporciona documentación interactiva basada en OpenAPI (Swagger). 

### Swagger UI (Interfaz interactiva)

Una vez que el servidor esté en ejecución (ya sea en local o mediante Docker), puedes acceder a la documentación interactiva directamente desde tu navegador:

👉 **http://localhost:3000/api-docs**

Desde esta interfaz podrás explorar detalladamente todos los endpoints, ver los esquemas de datos requeridos y respuestas, e incluso realizar peticiones de prueba directamente desde el navegador.

### Archivos de referencia

- [Especificación OpenAPI (YAML)](docs/openapi.yaml)
- [Requisitos iniciales de la API](docs/0001_api_requirements.md)
- [Comandos de prueba (PowerShell)](docs/curl_commands.md)
