import { createApp } from './app';
import { pool } from './database/connection';
import { runMigrations } from './database/migrations/migrator';
import { PostgresInvoiceRepository } from './persistence/PostgresInvoiceRepository';

const port = Number(process.env.PORT) || 3000;

const start = async () => {
  const invoiceRepository = new PostgresInvoiceRepository(pool);

  try {
    // 1. Conectar el repositorio a PostgreSQL
    await invoiceRepository.connect();

    // 2. Ejecutar migraciones pendientes
    await runMigrations();

    // 3. Inyectar el repositorio en la app
    const app = createApp(invoiceRepository);

    // 4. Arrancar el servidor
    app.listen(port, '0.0.0.0', () => {
      console.log(`Server is running at http://localhost:${port}`);
    });

    // 5. Cerrar conexión al parar el proceso
    process.on('SIGINT', async () => {
      console.log('\nCerrando servidor...');
      await invoiceRepository.disconnect();
      process.exit(0);
    });

  } catch (error: any) {
    console.error('Error al arrancar el servidor:', error.message);
    await invoiceRepository.disconnect();
    process.exit(1);
  }
};

start();
