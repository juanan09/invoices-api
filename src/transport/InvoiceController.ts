import { Request, Response } from 'express';
import { InvoiceUseCases } from '../use-cases/InvoiceUseCases';

export class InvoiceController {
    constructor(private useCases: InvoiceUseCases) { }

    createInvoice = async (req: Request, res: Response) => {
        try {
            const invoice = await this.useCases.createInvoice(req.body);
            res.status(201).json(invoice);
        } catch (error: any) {
            if (error.message === 'Faltan campos requeridos') {
                return res.status(400).json({ error: error.message });
            }
            res.status(500).json({ error: error.message });
        }
    };

    getInvoices = async (req: Request, res: Response) => {
        try {
            const filters: { status?: string; clientCif?: string } = {};
            if (req.query.status) filters.status = req.query.status as string;
            if (req.query.clientCif) filters.clientCif = req.query.clientCif as string;
            const invoices = await this.useCases.getInvoices(filters);
            res.status(200).json(invoices);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    getInvoiceById = async (req: Request, res: Response) => {
        try {
            const invoice = await this.useCases.getInvoiceById(req.params.id as string);
            res.status(200).json(invoice);
        } catch (error: any) {
            if (error.message === 'Factura no encontrada') {
                return res.status(404).json({ error: error.message });
            }
            res.status(500).json({ error: error.message });
        }
    };

    updateInvoice = async (req: Request, res: Response) => {
        try {
            const invoice = await this.useCases.updateInvoice(req.params.id as string, req.body);
            res.status(200).json(invoice);
        } catch (error: any) {
            if (error.message === 'Factura no encontrada') {
                return res.status(404).json({ error: error.message });
            }
            if (error.message === 'No se puede modificar una factura en estado definitivo' || error.message === 'La factura ya es definitiva') {
                return res.status(403).json({ error: error.message });
            }
            if (error.message === 'Faltan campos requeridos') {
                return res.status(400).json({ error: error.message });
            }
            res.status(500).json({ error: error.message });
        }
    };

    finalizeInvoice = async (req: Request, res: Response) => {
        try {
            const invoice = await this.useCases.finalizeInvoice(req.params.id as string);
            res.status(200).json(invoice);
        } catch (error: any) {
            if (error.message === 'Factura no encontrada') {
                return res.status(404).json({ error: error.message });
            }
            if (error.message === 'La factura ya es definitiva') {
                return res.status(400).json({ error: error.message });
            }
            res.status(500).json({ error: error.message });
        }
    };

    deleteInvoice = async (req: Request, res: Response) => {
        try {
            await this.useCases.deleteInvoice(req.params.id as string);
            res.status(204).send();
        } catch (error: any) {
            if (error.message === 'Factura no encontrada') {
                return res.status(404).json({ error: error.message });
            }
            if (error.message === 'No se puede eliminar una factura definitiva') {
                return res.status(403).json({ error: error.message });
            }
            res.status(500).json({ error: error.message });
        }
    };
}
