import { Invoice, InvoiceRepository } from '../domain/Invoice';
import crypto from 'node:crypto';

export class InvoiceUseCases {
    constructor(private repository: InvoiceRepository) { }

    async createInvoice(data: { clientCif: string; clientName: string; clientAddress: string; baseAmount: number; vatAmount: number }): Promise<Invoice> {
        if (!data.clientCif || !data.clientName || !data.clientAddress || data.baseAmount === undefined || data.vatAmount === undefined) {
            throw new Error('Faltan campos requeridos');
        }

        const newInvoice: Invoice = {
            id: crypto.randomUUID(),
            clientCif: data.clientCif,
            clientName: data.clientName,
            clientAddress: data.clientAddress,
            baseAmount: data.baseAmount,
            vatAmount: data.vatAmount,
            totalAmount: data.baseAmount + data.vatAmount,
            status: 'borrador',
            invoiceNumber: null,
            createdAt: new Date().toISOString()
        };

        return await this.repository.save(newInvoice);
    }

    async getInvoices(filters?: { status?: string; clientCif?: string }): Promise<Invoice[]> {
        return await this.repository.findAll(filters);
    }

    async getInvoiceById(id: string): Promise<Invoice> {
        const invoice = await this.repository.findById(id);
        if (!invoice) throw new Error('Factura no encontrada');
        return invoice;
    }

    async updateInvoice(id: string, data: { clientCif?: string; clientName?: string; clientAddress?: string; baseAmount?: number; vatAmount?: number }): Promise<Invoice> {
        const invoice = await this.repository.findById(id);
        if (!invoice) throw new Error('Factura no encontrada');
        if (invoice.status !== 'borrador') throw new Error('No se puede modificar una factura en estado definitivo');

        if (!data.clientCif || !data.clientName || !data.clientAddress || data.baseAmount === undefined || data.vatAmount === undefined) {
            throw new Error('Faltan campos requeridos');
        }

        const updatedData: Partial<Invoice> = {
            ...data,
            totalAmount: data.baseAmount + data.vatAmount
        };

        const updatedInvoice = await this.repository.update(id, updatedData);
        if (!updatedInvoice) throw new Error('Factura no encontrada'); // Fallback en caso extraño
        return updatedInvoice;
    }

    async finalizeInvoice(id: string): Promise<Invoice> {
        const invoice = await this.repository.findById(id);
        if (!invoice) throw new Error('Factura no encontrada');
        if (invoice.status === 'definitivo') throw new Error('La factura ya es definitiva');

        const nextNum = await this.repository.getNextInvoiceNumber();
        const invoiceNumber = `BT${nextNum.toString().padStart(3, '0')}`;

        const updatedInvoice = await this.repository.update(id, { status: 'definitivo', invoiceNumber });
        if (!updatedInvoice) throw new Error('Factura no encontrada');
        return updatedInvoice;
    }

    async deleteInvoice(id: string): Promise<void> {
        const invoice = await this.repository.findById(id);
        if (!invoice) throw new Error('Factura no encontrada');
        if (invoice.status === 'definitivo') throw new Error('No se puede eliminar una factura definitiva');

        await this.repository.delete(id);
    }
}
