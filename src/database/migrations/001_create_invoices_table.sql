CREATE TABLE IF NOT EXISTS invoices (
    id              UUID PRIMARY KEY,
    client_cif      VARCHAR(20) NOT NULL,
    client_name     VARCHAR(255) NOT NULL,
    client_address  VARCHAR(500) NOT NULL,
    base_amount     DECIMAL(12, 2) NOT NULL,
    vat_amount      DECIMAL(12, 2) NOT NULL,
    total_amount    DECIMAL(12, 2) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'borrador',
    invoice_number  VARCHAR(20) UNIQUE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para las consultas más frecuentes
CREATE INDEX IF NOT EXISTS idx_invoices_client_cif ON invoices (client_cif);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices (status);

-- Secuencia para la numeración correlativa de facturas definitivas
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START WITH 1 INCREMENT BY 1;
