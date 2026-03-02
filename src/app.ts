import path from 'node:path';
import express, { Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { InvoiceRepository } from './domain/Invoice';
import { InMemoryInvoiceRepository } from './persistence/InMemoryInvoiceRepository';
import { InvoiceUseCases } from './use-cases/InvoiceUseCases';
import { InvoiceController } from './transport/InvoiceController';
import { createInvoiceRouter } from './transport/invoiceRoutes';
import { requestLogger } from './middleware/requestLogger';
import { authMiddleware } from './middleware/auth';

// Cargar la especificación OpenAPI desde el YAML
const swaggerDocument = YAML.load(path.join(__dirname, '..', 'docs', 'openapi.yaml'));

export const createApp = (repository?: InvoiceRepository) => {
    const app = express();

    // Wiring de capas (si no se pasa repositorio, se usa el de memoria)
    const invoiceRepository = repository ?? new InMemoryInvoiceRepository();
    const invoiceUseCases = new InvoiceUseCases(invoiceRepository);
    const invoiceController = new InvoiceController(invoiceUseCases);
    const invoiceRouter = createInvoiceRouter(invoiceController);

    app.use(express.json());
    app.use(requestLogger);

    // Documentación Swagger UI
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

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

