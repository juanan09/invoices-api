import { Router } from 'express';
import { InvoiceController } from './InvoiceController';

export const createInvoiceRouter = (controller: InvoiceController) => {
    const router = Router();

    router.post('/', controller.createInvoice);
    router.get('/', controller.getInvoices);
    router.get('/:id', controller.getInvoiceById);
    router.put('/:id', controller.updateInvoice);
    router.patch('/:id/finalize', controller.finalizeInvoice);
    router.delete('/:id', controller.deleteInvoice);

    return router;
};
