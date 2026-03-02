export interface Invoice {
    id: string;
    clientCif: string;
    clientName: string;
    clientAddress: string;
    baseAmount: number;
    vatAmount: number;
    totalAmount: number;
    status: 'borrador' | 'definitivo';
    invoiceNumber: string | null;
    createdAt: string;
}

export interface InvoiceRepository {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    save(invoice: Invoice): Promise<Invoice>;
    findAll(filters?: { status?: string; clientCif?: string }): Promise<Invoice[]>;
    findById(id: string): Promise<Invoice | null>;
    update(id: string, invoice: Partial<Invoice>): Promise<Invoice | null>;
    delete(id: string): Promise<boolean>;
    getNextInvoiceNumber(): Promise<number>;
}
