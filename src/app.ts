import express, { Request, Response } from 'express';
import { InMemoryInvoiceRepository } from './repositories/InMemoryInvoiceRepository';
import { InvoiceUseCases } from './use-cases/InvoiceUseCases';
import { InvoiceController } from './transport/InvoiceController';
import { createInvoiceRouter } from './transport/invoiceRoutes';
import { requestLogger } from './middleware/requestLogger';
import { authMiddleware } from './middleware/auth';

export const createApp = () => {
    const app = express();

    // Wiring de capas
    const invoiceRepository = new InMemoryInvoiceRepository();
    const invoiceUseCases = new InvoiceUseCases(invoiceRepository);
    const invoiceController = new InvoiceController(invoiceUseCases);
    const invoiceRouter = createInvoiceRouter(invoiceController);

    app.use(express.json());
    app.use(requestLogger);

    app.get('/', (req: Request, res: Response) => {
        res.send('Hello Word');
    });

    // Rutas públicas
    app.use('/api/invoices', invoiceRouter);

    // Ruta protegida (requiere token)
    app.get('/api/protected', authMiddleware, (req: Request, res: Response) => {
        res.status(200).json({ message: 'Has accedido a un recurso protegido 🔐', timestamp: new Date().toISOString() });
    });

    return app;
};

export default createApp();
