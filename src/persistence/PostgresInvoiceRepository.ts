import { Pool } from 'pg';
import { Invoice, InvoiceRepository } from '../domain/Invoice';

export class PostgresInvoiceRepository implements InvoiceRepository {
    constructor(private pool: Pool) { }

    async connect(): Promise<void> {
        try {
            const client = await this.pool.connect();
            console.log('[PostgresRepository] Conectado a PostgreSQL');
            client.release();
        } catch (error: any) {
            console.error('[PostgresRepository] Error al conectar con PostgreSQL:', error.message);
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        await this.pool.end();
        console.log('[PostgresRepository] Conexión a PostgreSQL cerrada');
    }
    async save(invoice: Invoice): Promise<Invoice> {
        const result = await this.pool.query(
            `INSERT INTO invoices (id, client_cif, client_name, client_address, base_amount, vat_amount, total_amount, status, invoice_number, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING *`,
            [
                invoice.id,
                invoice.clientCif,
                invoice.clientName,
                invoice.clientAddress,
                invoice.baseAmount,
                invoice.vatAmount,
                invoice.totalAmount,
                invoice.status,
                invoice.invoiceNumber,
                invoice.createdAt
            ]
        );

        return this.mapRowToInvoice(result.rows[0]);
    }

    async findAll(filters?: { status?: string; clientCif?: string }): Promise<Invoice[]> {
        let query = 'SELECT * FROM invoices';
        const params: string[] = [];
        const conditions: string[] = [];

        if (filters?.status) {
            conditions.push(`status = $${params.length + 1}`);
            params.push(filters.status);
        }

        if (filters?.clientCif) {
            conditions.push(`client_cif = $${params.length + 1}`);
            params.push(filters.clientCif);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY created_at DESC';

        const result = await this.pool.query(query, params);
        return result.rows.map(row => this.mapRowToInvoice(row));
    }

    async findById(id: string): Promise<Invoice | null> {
        const result = await this.pool.query('SELECT * FROM invoices WHERE id = $1', [id]);

        if (result.rows.length === 0) return null;
        return this.mapRowToInvoice(result.rows[0]);
    }

    async update(id: string, updateData: Partial<Invoice>): Promise<Invoice | null> {
        const fields: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (updateData.clientCif !== undefined) {
            fields.push(`client_cif = $${paramIndex++}`);
            values.push(updateData.clientCif);
        }
        if (updateData.clientName !== undefined) {
            fields.push(`client_name = $${paramIndex++}`);
            values.push(updateData.clientName);
        }
        if (updateData.clientAddress !== undefined) {
            fields.push(`client_address = $${paramIndex++}`);
            values.push(updateData.clientAddress);
        }
        if (updateData.baseAmount !== undefined) {
            fields.push(`base_amount = $${paramIndex++}`);
            values.push(updateData.baseAmount);
        }
        if (updateData.vatAmount !== undefined) {
            fields.push(`vat_amount = $${paramIndex++}`);
            values.push(updateData.vatAmount);
        }
        if (updateData.totalAmount !== undefined) {
            fields.push(`total_amount = $${paramIndex++}`);
            values.push(updateData.totalAmount);
        }
        if (updateData.status !== undefined) {
            fields.push(`status = $${paramIndex++}`);
            values.push(updateData.status);
        }
        if (updateData.invoiceNumber !== undefined) {
            fields.push(`invoice_number = $${paramIndex++}`);
            values.push(updateData.invoiceNumber);
        }

        if (fields.length === 0) return this.findById(id);

        values.push(id);
        const query = `UPDATE invoices SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

        const result = await this.pool.query(query, values);
        if (result.rows.length === 0) return null;
        return this.mapRowToInvoice(result.rows[0]);
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.pool.query('DELETE FROM invoices WHERE id = $1', [id]);
        return (result.rowCount ?? 0) > 0;
    }

    async getNextInvoiceNumber(): Promise<number> {
        const result = await this.pool.query("SELECT nextval('invoice_number_seq') AS next_number");
        return parseInt(result.rows[0].next_number, 10);
    }

    // Mapea una fila de PostgreSQL (snake_case) a la entidad del dominio (camelCase)
    private mapRowToInvoice(row: any): Invoice {
        return {
            id: row.id,
            clientCif: row.client_cif,
            clientName: row.client_name,
            clientAddress: row.client_address,
            baseAmount: parseFloat(row.base_amount),
            vatAmount: parseFloat(row.vat_amount),
            totalAmount: parseFloat(row.total_amount),
            status: row.status,
            invoiceNumber: row.invoice_number,
            createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
        };
    }
}
