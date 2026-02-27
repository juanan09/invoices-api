import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { Application } from 'express';
import app, { createApp } from '../src/app';

describe('Invoices API', () => {

    let app: Application;

    beforeEach(() => {
        app = createApp();
    });

    describe('POST /api/invoices', () => {
        it('debería crear una factura exitosamente y devolver estado 201', async () => {
            const newInvoice = {
                clientCif: 'B12345678',
                clientName: 'Empresa Ejemplo S.L.',
                clientAddress: 'Calle Falsa 123, Madrid',
                baseAmount: 100.00,
                vatAmount: 21.00
            };

            const response = await request(app)
                .post('/api/invoices')
                .send(newInvoice)
                .expect('Content-Type', /json/)
                .expect(201);

            expect(response.body).toMatchObject({
                ...newInvoice,
                status: 'borrador', // Por defecto debe ser borrador
                totalAmount: 121.00, // baseAmount + vatAmount
            });
            // Verificamos que se haya asignado un ID y la fecha de creación
            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('createdAt');
            // invoiceNumber debe ser null al crearse en borrador
            expect(response.body.invoiceNumber).toBeNull();
        });

        it('debería devolver un error 400 si faltan campos requeridos', async () => {
            const invalidInvoice = {
                // Falta clientCif
                clientName: 'Empresa Ejemplo S.L.',
                clientAddress: 'Calle Falsa 123, Madrid',
                baseAmount: 100.00,
                vatAmount: 21.00
            };

            const response = await request(app)
                .post('/api/invoices')
                .send(invalidInvoice)
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('GET /api/invoices', () => {
        it('debería devolver una lista de facturas vacía al inicio (200)', async () => {
            const response = await request(app)
                .get('/api/invoices')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(0);
        });

        it('debería listar facturas correctamente', async () => {
            // Creamos una factura primero para tener datos
            await request(app).post('/api/invoices').send({
                clientCif: 'B12345678',
                clientName: 'Empresa Test',
                clientAddress: 'Calle Test',
                baseAmount: 100,
                vatAmount: 21
            });

            const response = await request(app)
                .get('/api/invoices')
                .expect(200);

            expect(response.body.length).toBe(1);
            expect(response.body[0].clientCif).toBe('B12345678');
        });

        it('debería filtrar facturas por CIF de cliente', async () => {
            // Cliente A
            await request(app).post('/api/invoices').send({
                clientCif: 'CLI_A', clientName: 'A', clientAddress: '...', baseAmount: 10, vatAmount: 2
            });
            // Cliente B
            await request(app).post('/api/invoices').send({
                clientCif: 'CLI_B', clientName: 'B', clientAddress: '...', baseAmount: 10, vatAmount: 2
            });

            const response = await request(app)
                .get('/api/invoices?clientCif=CLI_A')
                .expect(200);

            expect(response.body.length).toBe(1);
            expect(response.body[0].clientCif).toBe('CLI_A');
        });

        it('debería filtrar facturas por estado', async () => {
            // Por defecto todas se crean en borrador. 
            // Más adelante usaremos el endpoint de finalización, por ahora validamos que las en borrador se filtran bien frente a estados que no existen
            await request(app).post('/api/invoices').send({ clientCif: 'CLI_1', clientName: '1', clientAddress: '...', baseAmount: 10, vatAmount: 2 });
            await request(app).post('/api/invoices').send({ clientCif: 'CLI_2', clientName: '2', clientAddress: '...', baseAmount: 20, vatAmount: 4 });
            await request(app).post('/api/invoices').send({ clientCif: 'CLI_3', clientName: '3', clientAddress: '...', baseAmount: 30, vatAmount: 6 });

            const responseAsBorrador = await request(app).get('/api/invoices?status=borrador');
            expect(responseAsBorrador.body.length).toBe(3);

            const responseAsDefinitivo = await request(app).get('/api/invoices?status=definitivo');
            expect(responseAsDefinitivo.body.length).toBe(0);
        });
    });
});

describe('GET /api/invoices/:id', () => {
    it('debería devolver 404 si la factura no existe', async () => {
        await request(app)
            .get('/api/invoices/b5657df6-5867-4bb9-abe4-6ed552d536ee')
            .expect(404);
    });

    it('debería devolver los detalles de una factura existente por id', async () => {
        const createRes = await request(app).post('/api/invoices').send({
            clientCif: 'CL_TEST', clientName: 'Test', clientAddress: '...', baseAmount: 50, vatAmount: 10
        });

        const invoiceId = createRes.body.id;

        const response = await request(app)
            .get(`/api/invoices/${invoiceId}`)
            .expect(200);

        expect(response.body.id).toBe(invoiceId);
        expect(response.body.clientCif).toBe('CL_TEST');
    });
});

describe('PUT /api/invoices/:id', () => {
    it('debería actualizar la factura si está en borrador', async () => {
        // 1. Crear factura
        const createRes = await request(app).post('/api/invoices').send({
            clientCif: 'CL_1', clientName: 'N_1', clientAddress: 'Dir 1', baseAmount: 10, vatAmount: 2
        });
        const invoiceId = createRes.body.id;

        // 2. Modificar factura
        const updatedData = {
            clientCif: 'CL_MOD', clientName: 'N_MOD', clientAddress: 'Dir MOD', baseAmount: 20, vatAmount: 4
        };

        const response = await request(app)
            .put(`/api/invoices/${invoiceId}`)
            .send(updatedData)
            .expect(200);

        expect(response.body.clientCif).toBe('CL_MOD');
        expect(response.body.totalAmount).toBe(24); // 20 + 4
    });

    it('debería devolver 400 si faltan datos obligatorios', async () => {
        const createRes = await request(app).post('/api/invoices').send({
            clientCif: 'CL_1', clientName: 'N_1', clientAddress: 'Dir 1', baseAmount: 10, vatAmount: 2
        });

        const response = await request(app)
            .put(`/api/invoices/${createRes.body.id}`)
            .send({ baseAmount: 20 }) // faltan datos
            .expect(400);

        expect(response.body).toHaveProperty('error');
    });

    it('debería devolver 404 si intento actualizar una factura que no existe', async () => {
        await request(app)
            .put('/api/invoices/b5657df6-5867-4bb9-abe4-6ed552d536ee')
            .send({
                clientCif: 'CL_1', clientName: 'N_1', clientAddress: 'Dir 1', baseAmount: 10, vatAmount: 2
            })
            .expect(404);
    });

    describe('PATCH /api/invoices/:id/finalize', () => {
        it('debería cambiar el estado a definitivo y asignar un número correlativo', async () => {
            // 1. Crear al menos dos facturas
            const res1 = await request(app).post('/api/invoices').send({
                clientCif: 'CL_A', clientName: 'A', clientAddress: 'A', baseAmount: 10, vatAmount: 2
            });
            const res2 = await request(app).post('/api/invoices').send({
                clientCif: 'CL_B', clientName: 'B', clientAddress: 'B', baseAmount: 10, vatAmount: 2
            });

            // 2. Finalizar la primera
            const fin1 = await request(app)
                .patch(`/api/invoices/${res1.body.id}/finalize`)
                .expect(200);

            expect(fin1.body.status).toBe('definitivo');
            expect(fin1.body.invoiceNumber).toBe('BT001');

            // 3. Finalizar la segunda
            const fin2 = await request(app)
                .patch(`/api/invoices/${res2.body.id}/finalize`)
                .expect(200);

            expect(fin2.body.status).toBe('definitivo');
            expect(fin2.body.invoiceNumber).toBe('BT002');
        });

        it('debería devolver 400 si la factura ya es definitiva o 404 si no existe', async () => {
            const res1 = await request(app).post('/api/invoices').send({
                clientCif: 'CL_A', clientName: 'A', clientAddress: 'A', baseAmount: 10, vatAmount: 2
            });

            await request(app).patch(`/api/invoices/${res1.body.id}/finalize`).expect(200);

            // Intentar finalizar de nuevo
            const errorRes = await request(app).patch(`/api/invoices/${res1.body.id}/finalize`).expect(400);
            expect(errorRes.body).toHaveProperty('error');
        });
    });

    describe('DELETE /api/invoices/:id', () => {
        it('debería eliminar una factura en estado borrador', async () => {
            const res = await request(app).post('/api/invoices').send({
                clientCif: 'CL_A', clientName: 'A', clientAddress: 'A', baseAmount: 10, vatAmount: 2
            });

            await request(app).delete(`/api/invoices/${res.body.id}`).expect(204);

            // Comprobar que ya no existe
            await request(app).get(`/api/invoices/${res.body.id}`).expect(404);
        });

        it('debería devolver 403 al intentar eliminar una factura definitiva', async () => {
            const res = await request(app).post('/api/invoices').send({
                clientCif: 'CL_A', clientName: 'A', clientAddress: 'A', baseAmount: 10, vatAmount: 2
            });

            await request(app).patch(`/api/invoices/${res.body.id}/finalize`).expect(200);

            const errRes = await request(app).delete(`/api/invoices/${res.body.id}`).expect(403);
            expect(errRes.body).toHaveProperty('error');
        });
    });
});
