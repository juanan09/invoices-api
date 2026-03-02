import fs from 'node:fs';
import path from 'node:path';
import { pool } from '../connection';

const MIGRATIONS_DIR = path.join(__dirname, '.');

const createMigrationsTable = async (): Promise<void> => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS migrations (
            id          SERIAL PRIMARY KEY,
            filename    VARCHAR(255) UNIQUE NOT NULL,
            executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );
    `);
};

const getExecutedMigrations = async (): Promise<string[]> => {
    const result = await pool.query('SELECT filename FROM migrations ORDER BY filename');
    return result.rows.map(row => row.filename);
};

const markAsExecuted = async (filename: string): Promise<void> => {
    await pool.query('INSERT INTO migrations (filename) VALUES ($1)', [filename]);
};

export const runMigrations = async (): Promise<void> => {
    console.log('[Migrations] Comprobando migraciones pendientes...');

    // 1. Crear tabla de control si no existe
    await createMigrationsTable();

    // 2. Obtener migraciones ya ejecutadas
    const executed = await getExecutedMigrations();

    // 3. Leer archivos .sql del directorio, ordenados por nombre
    const migrationFiles = fs.readdirSync(MIGRATIONS_DIR)
        .filter(file => file.endsWith('.sql'))
        .sort();

    // 4. Filtrar las pendientes
    const pending = migrationFiles.filter(file => !executed.includes(file));

    if (pending.length === 0) {
        console.log('[Migrations] No hay migraciones pendientes');
        return;
    }

    console.log(`[Migrations] ${pending.length} migración(es) pendiente(s)`);

    // 5. Ejecutar cada migración pendiente
    for (const file of pending) {
        const filePath = path.join(MIGRATIONS_DIR, file);
        const sql = fs.readFileSync(filePath, 'utf-8');

        try {
            await pool.query('BEGIN');
            await pool.query(sql);
            await markAsExecuted(file);
            await pool.query('COMMIT');
            console.log(`[Migrations] ✅ ${file} ejecutada correctamente`);
        } catch (error: any) {
            await pool.query('ROLLBACK');
            console.error(`[Migrations] ❌ Error al ejecutar ${file}:`, error.message);
            throw error;
        }
    }

    console.log('[Migrations] Todas las migraciones ejecutadas');
};
