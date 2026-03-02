# 🧾 Invoices API

🇪🇸 [Leer en Español (Read in Spanish)](README.es.md)

REST API for invoice management. Features include creating, listing, updating, finalizing, and deleting invoices with sequential numbering and state control.

## 📋 Table of Contents

- [Technologies](#-technologies)
- [Architecture](#-architecture)
- [Installation](#-installation)
- [Docker](#-docker)
- [Environment Variables](#-environment-variables)
- [Available Scripts](#-available-scripts)
- [Endpoints](#-endpoints)
- [Authentication](#-authentication)
- [Testing](#-testing)
- [Database](#-database)
- [Documentation](#-documentation)

## 🛠 Technologies

| Technology               | Usage                         |
| ------------------------ | ----------------------------- |
| **Node.js + TypeScript** | Runtime and language          |
| **Express**              | HTTP Framework                |
| **PostgreSQL**           | Relational database           |
| **pg**                   | PostgreSQL driver for Node.js |
| **dotenv**               | Environment variables         |
| **Docker**               | Container for PostgreSQL      |
| **Vitest**               | Testing framework             |
| **Supertest**            | HTTP endpoint testing         |
| **Swagger UI Express**   | Interactive API documentation |
| **YAMLjs**               | YAML parser (OpenAPI spec)    |

## 🏗 Architecture

The project follows a **layered architecture (Clean Architecture)** with a clear separation of concerns:

```
src/
├── domain/                          # 🧠 Domain Layer
│   └── Invoice.ts                   # Invoice entity + InvoiceRepository interface
│
├── use-cases/                       # 📋 Business Layer (Use Cases)
│   └── InvoiceUseCases.ts           # Pure business logic
│
├── persistence/                     # 💾 Persistence Layer (Repository)
│   ├── InMemoryInvoiceRepository.ts # In-memory implementation (tests)
│   └── PostgresInvoiceRepository.ts # PostgreSQL implementation (production)
│
├── transport/                       # 🌐 Transport Layer (Express)
│   ├── InvoiceController.ts         # HTTP request/response handling
│   └── invoiceRoutes.ts             # Route definitions
│
├── middleware/                      # ⚙️ Middlewares
│   ├── requestLogger.ts             # Request logging (method, URL, status, time)
│   └── auth.ts                      # Bearer token authentication
│
├── database/                        # 🗄️ Database
│   ├── connection.ts                # PostgreSQL connection pool
│   └── migrations/
│       ├── 001_create_invoices_table.sql  # Migration: invoices table
│       ├── migrator.ts              # Migration engine with control table
│       └── run-migrations.ts        # Executable script
│
├── app.ts                           # Wiring of all layers
└── server.ts                        # Server startup
```

### Design Principles

- **Dependency Injection**: Upper layers receive their dependencies, they do not create them. `createApp()` accepts an optional repository, allowing different implementations to be injected.
- **Repository Pattern**: The domain layer defines an interface (`InvoiceRepository`) with methods `connect()`, `disconnect()`, `save()`, `findAll()`, etc. Persistence implements it.
  - `InMemoryInvoiceRepository`: For tests (connect/disconnect are no-ops).
  - `PostgresInvoiceRepository`: For production (connect verifies connection to the pool).
- **Separation of Concerns**: Each layer has a single function (transport → HTTP, use cases → business, persistence → data).

### Server Startup Flow

```
1. Repository is created (PostgresInvoiceRepository)
2. repository.connect() is called → verifies PostgreSQL connection
3. Pending migrations are executed
4. Repository is injected into createApp()
5. Express server is started
6. On receiving SIGINT → repository.disconnect() closes the pool
```

## 🚀 Installation

```bash
# Clone the repository
git clone https://github.com/juanan09/invoices-api.git
cd invoices-api

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your connection data
```

## 🐳 Docker

The project includes a `Dockerfile` to generate the server image and a `docker-compose.yml` that stands up the entire stack (PostgreSQL + API).

### Run Everything with Docker Compose

```powershell
# Stand up PostgreSQL + API (rebuilds the image if there are changes)
docker compose up --build

# In the background
docker compose up --build -d

# View container status
docker compose ps

# View logs
docker compose logs api
docker compose logs postgres

# Stop everything
docker compose down

# Stop and remove database data
docker compose down -v
```

### PostgreSQL Only (Local Development)

If you prefer to run the server with `npm run dev` and only use Docker for PostgreSQL:

```powershell
docker compose up postgres -d
npm run db:migrate
npm run dev
```

### Build the Server Image

```powershell
# Build
docker build -t invoices-api .

# Run manually
docker run --rm -p 3000:3000 --env-file .env invoices-api
```

### Docker Compose Services

| Service    | Image                | External Port | Description                  |
| ---------- | -------------------- | ------------- | ---------------------------- |
| `postgres` | `postgres:16-alpine` | `5555`        | PostgreSQL database          |
| `api`      | `invoices-api`       | `3000`        | Express server (local build) |

> **Note**: Port `5555` is used because `5432` might be occupied by a local PostgreSQL installation. It is configured from `.env` using `DB_PORT`.

## 🔐 Environment Variables

Copy `.env.example` to `.env` and configure the values:

| Variable      | Description                   | Default Value          |
| ------------- | ----------------------------- | ---------------------- |
| `DB_HOST`     | PostgreSQL Host               | `localhost`            |
| `DB_PORT`     | PostgreSQL Port               | `5432`                 |
| `DB_USER`     | PostgreSQL User               | `postgres`             |
| `DB_PASSWORD` | PostgreSQL Password           | `postgres`             |
| `DB_NAME`     | Database Name                 | `invoices_db`          |
| `PORT`        | Server Port                   | `3000`                 |
| `AUTH_TOKEN`  | Token for protected endpoints | `mi-token-secreto-123` |

## 📜 Available Scripts

| Command                 | Description                                           |
| ----------------------- | ----------------------------------------------------- |
| `npm run dev`           | Starts the server in development mode with hot-reload |
| `npm run build`         | Compiles TypeScript to JavaScript                     |
| `npm start`             | Starts the compiled server (production)               |
| `npm test`              | Runs all tests                                        |
| `npm run test:watch`    | Runs tests in watch mode                              |
| `npm run test:ui`       | Opens the Vitest UI                                   |
| `npm run test:coverage` | Runs tests with coverage report                       |
| `npm run db:migrate`    | Runs pending migrations in PostgreSQL                 |

## 📡 Endpoints

### Invoices (Public)

| Method   | Route                        | Description                                                   |
| -------- | ---------------------------- | ------------------------------------------------------------- |
| `POST`   | `/api/invoices`              | Create an invoice (status `borrador` - draft)                 |
| `GET`    | `/api/invoices`              | List invoices (filters: `?status=`, `?clientCif=`)            |
| `GET`    | `/api/invoices/:id`          | Get an invoice by ID                                          |
| `PUT`    | `/api/invoices/:id`          | Update an invoice (only if `borrador`)                        |
| `PATCH`  | `/api/invoices/:id/finalize` | Finalize invoice (sets to `definitivo`, assigns BT001 number) |
| `DELETE` | `/api/invoices/:id`          | Delete an invoice (only if `borrador`)                        |

### Protected Endpoint

| Method | Route            | Description                                |
| ------ | ---------------- | ------------------------------------------ |
| `GET`  | `/api/protected` | Protected resource (requires Bearer token) |

### PowerShell Examples

```powershell
# Create an invoice
Invoke-RestMethod -Method POST -Uri http://localhost:3000/api/invoices -ContentType "application/json" -Body '{"clientCif":"B12345678","clientName":"Empresa S.L.","clientAddress":"Calle 123","baseAmount":1000,"vatAmount":210}'

# List invoices
Invoke-RestMethod -Uri http://localhost:3000/api/invoices

# Filter by status
Invoke-RestMethod -Uri "http://localhost:3000/api/invoices?status=borrador"

# Finalize an invoice (replace <ID> with the actual UUID)
Invoke-RestMethod -Method PATCH -Uri http://localhost:3000/api/invoices/<ID>/finalize

# Access protected resource
Invoke-RestMethod -Uri http://localhost:3000/api/protected -Headers @{Authorization="Bearer mi-token-secreto-123"}
```

### Body Fields (POST / PUT)

```json
{
  "clientCif": "B12345678",
  "clientName": "Empresa Test S.L.",
  "clientAddress": "Calle Falsa 123",
  "baseAmount": 1000,
  "vatAmount": 210
}
```

> The `totalAmount` is calculated automatically (`baseAmount + vatAmount`).

### Response Codes

| Code  | Meaning                                                              |
| ----- | -------------------------------------------------------------------- |
| `200` | Successful operation                                                 |
| `201` | Invoice created                                                      |
| `204` | Invoice deleted                                                      |
| `400` | Missing required fields or invoice is already finalized              |
| `401` | Token not provided                                                   |
| `403` | Invalid token or action not allowed (e.g., delete finalized invoice) |
| `404` | Invoice not found                                                    |

## 🔒 Authentication

The `/api/protected` endpoint requires a Bearer token in the `Authorization` header:

```powershell
# Without token → 401
Invoke-RestMethod -Uri http://localhost:3000/api/protected

# Incorrect token → 403
Invoke-RestMethod -Uri http://localhost:3000/api/protected -Headers @{Authorization="Bearer token-malo"}

# Correct token → 200
Invoke-RestMethod -Uri http://localhost:3000/api/protected -Headers @{Authorization="Bearer mi-token-secreto-123"}
```

## 🧪 Testing

The project uses **TDD (Test-Driven Development)**. Tests are written before implementing the code to make them pass.

Tests automatically use `InMemoryInvoiceRepository` (they do not require PostgreSQL):

```bash
# Run all tests
npm test

# Watch mode (re-runs on save)
npm run test:watch

# With coverage
npm run test:coverage
```

### Test Suites

| File                     | Tests | Description                                                        |
| ------------------------ | ----- | ------------------------------------------------------------------ |
| `tests/invoices.test.ts` | 15    | Full CRUD for invoices, filters, finalization, and deletion        |
| `tests/auth.test.ts`     | 4     | Authentication: no token, bad token, incorrect format, valid token |
| `tests/dummy.test.ts`    | 1     | Framework verification test                                        |

## 🗄 Database

### PostgreSQL

The application uses PostgreSQL as the database in production. The main table is `invoices`:

| Column           | Type                       | Notes                                     |
| ---------------- | -------------------------- | ----------------------------------------- |
| `id`             | `UUID`                     | Primary key                               |
| `client_cif`     | `VARCHAR(20)`              | Client CIF (indexed)                      |
| `client_name`    | `VARCHAR(255)`             | Client name                               |
| `client_address` | `VARCHAR(500)`             | Client address                            |
| `base_amount`    | `DECIMAL(12,2)`            | Base amount                               |
| `vat_amount`     | `DECIMAL(12,2)`            | VAT amount                                |
| `total_amount`   | `DECIMAL(12,2)`            | Total (base + VAT)                        |
| `status`         | `VARCHAR(20)`              | `borrador` or `definitivo` (indexed)      |
| `invoice_number` | `VARCHAR(20)`              | Sequential number, **UNIQUE** (eg. BT001) |
| `created_at`     | `TIMESTAMP WITH TIME ZONE` | Creation date                             |

### Dual Persistence Implementation

| Repository                  | Usage           | Requires DB      |
| --------------------------- | --------------- | ---------------- |
| `InMemoryInvoiceRepository` | Automated tests | No               |
| `PostgresInvoiceRepository` | Real server     | Yes (PostgreSQL) |

Both implement the same `InvoiceRepository` interface, including `connect()` and `disconnect()`. This allows switching them without touching any other layer.

### Migration System

Migrations are handled by custom engine that:

1. Creates a `migrations` table to register executed ones
2. Reads `.sql` files from the migrations directory
3. Executes only pending ones, in alphabetical order
4. Each migration runs within a transaction (rollback if it fails)

```bash
# Run migrations
npm run db:migrate
```

To add new migrations, create files with a numeric prefix:
```
src/database/migrations/
├── 001_create_invoices_table.sql
├── 002_add_new_column.sql        # ← Future example
└── 003_create_clients_table.sql  # ← Future example
```

## 📚 Documentation

The API provides interactive documentation based on OpenAPI (Swagger).

### Swagger UI (Interactive Interface)

Once the server is running (either locally or via Docker), you can access the interactive documentation directly from your browser:

👉 **http://localhost:3000/api-docs**

From this interface, you will be able to explore all endpoints in detail, see the required data schemas and responses, and even perform test requests directly from the browser.

### Reference Files

- [OpenAPI Specification (YAML)](docs/openapi.yaml)
- [Initial API Requirements (ES)](docs/0001_api_requirements.md)
- [Test Commands (PowerShell)](docs/curl_commands.md)
