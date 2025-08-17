import { sql } from 'drizzle-orm';
import { db } from '../index';

export async function addEmergencyTransportColumns() {
  try {
    // Check if the columns already exist
    const checkDestinationCoordinates = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'emergency_transport' AND column_name = 'destination_coordinates'
    `);

    const checkAssignedTime = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'emergency_transport' AND column_name = 'assigned_time'
    `);

    // Add destination_coordinates column if it doesn't exist
    if (checkDestinationCoordinates.rows.length === 0) {
      console.log('Adding destination_coordinates column to emergency_transport table');
      await db.execute(sql`
        ALTER TABLE emergency_transport 
        ADD COLUMN destination_coordinates TEXT
      `);
    }

    // Add assigned_time column if it doesn't exist
    if (checkAssignedTime.rows.length === 0) {
      console.log('Adding assigned_time column to emergency_transport table');
      await db.execute(sql`
        ALTER TABLE emergency_transport 
        ADD COLUMN assigned_time TIMESTAMP
      `);
    }

    console.log('Emergency transport table migration completed successfully');
  } catch (error) {
    console.error('Error in emergency transport migration:', error);
    throw error;
  }
}