import express, { Request, Response } from 'express';
import { InMemoryInvoiceRepository } from './repositories/InMemoryInvoiceRepository';
import { InvoiceUseCases } from './use-cases/InvoiceUseCases';
import { InvoiceController } from './transport/InvoiceController';
import { createInvoiceRouter } from './transport/invoiceRoutes';

export const createApp = () => {
    const app = express();

    // Wiring de capas
    const invoiceRepository = new InMemoryInvoiceRepository();
    const invoiceUseCases = new InvoiceUseCases(invoiceRepository);
    const invoiceController = new InvoiceController(invoiceUseCases);
    const invoiceRouter = createInvoiceRouter(invoiceController);

    app.use(express.json());

    app.get('/', (req: Request, res: Response) => {
        res.send('Hello Word');
    });

    // Añadir rutas al path /api/invoices
    app.use('/api/invoices', invoiceRouter);

    return app;
};

export default createApp();
