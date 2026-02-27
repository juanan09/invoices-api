import { Invoice, InvoiceRepository } from '../domain/Invoice';

export class InMemoryInvoiceRepository implements InvoiceRepository {
    private invoices: Invoice[] = [];
    private nextInvoiceNumber = 1;

    async save(invoice: Invoice): Promise<Invoice> {
        this.invoices.push(invoice);
        return invoice;
    }

    async findAll(filters?: { status?: string; clientCif?: string }): Promise<Invoice[]> {
        let filtered = this.invoices;
        if (filters?.status) {
            filtered = filtered.filter(inv => inv.status === filters.status);
        }
        if (filters?.clientCif) {
            filtered = filtered.filter(inv => inv.clientCif === filters.clientCif);
        }
        return filtered;
    }

    async findById(id: string): Promise<Invoice | null> {
        return this.invoices.find(inv => inv.id === id) || null;
    }

    async update(id: string, updateData: Partial<Invoice>): Promise<Invoice | null> {
        const index = this.invoices.findIndex(inv => inv.id === id);
        if (index === -1) return null;
        this.invoices[index] = { ...this.invoices[index], ...updateData };
        return this.invoices[index];
    }

    async delete(id: string): Promise<boolean> {
        const index = this.invoices.findIndex(inv => inv.id === id);
        if (index === -1) return false;
        this.invoices.splice(index, 1);
        return true;
    }

    async getNextInvoiceNumber(): Promise<number> {
        return this.nextInvoiceNumber++;
    }
}
