import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'invoices_db',
});

export const connectDB = async (): Promise<void> => {
    try {
        const client = await pool.connect();
        console.log('[DB] Conectado a PostgreSQL');
        client.release();
    } catch (error: any) {
        console.error('[DB] Error al conectar con PostgreSQL:', error.message);
        throw error;
    }
};

export const disconnectDB = async (): Promise<void> => {
    await pool.end();
    console.log('[DB] Conexión a PostgreSQL cerrada');
};

export const query = (text: string, params?: any[]) => {
    return pool.query(text, params);
};

export { pool };
