import { connectDB, disconnectDB } from '../connection';
import { runMigrations } from './migrator';

const main = async () => {
    try {
        await connectDB();
        await runMigrations();
    } catch (error: any) {
        console.error('[run-migrations] Error:', error.message);
        process.exit(1);
    } finally {
        await disconnectDB();
    }
};

main();
