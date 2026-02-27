import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { Application } from 'express';

let app: Application;

beforeEach(() => {
    app = createApp();
});

describe('Protected Endpoint', () => {
    it('debería devolver 401 si no se proporciona token', async () => {
        const response = await request(app)
            .get('/api/protected')
            .expect(401);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toBe('Token no proporcionado');
    });

    it('debería devolver 403 si el token es incorrecto', async () => {
        const response = await request(app)
            .get('/api/protected')
            .set('Authorization', 'Bearer token-incorrecto')
            .expect(403);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toBe('Token inválido');
    });

    it('debería devolver 401 si el header Authorization no tiene formato Bearer', async () => {
        const response = await request(app)
            .get('/api/protected')
            .set('Authorization', 'mi-token-secreto-123')
            .expect(401);

        expect(response.body.error).toBe('Token no proporcionado');
    });

    it('debería devolver 200 con el token correcto', async () => {
        const response = await request(app)
            .get('/api/protected')
            .set('Authorization', 'Bearer mi-token-secreto-123')
            .expect(200);

        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('timestamp');
    });
});
