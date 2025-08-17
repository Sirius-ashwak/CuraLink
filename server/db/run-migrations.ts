import { addEmergencyTransportColumns } from './migrations/add_emergency_transport_columns';

async function runMigrations() {
  try {
    console.log('Starting database migrations...');
    
    // Run the emergency transport columns migration
    await addEmergencyTransportColumns();
    
    console.log('All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();