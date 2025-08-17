-- Add destination_coordinates column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'emergency_transport' AND column_name = 'destination_coordinates'
    ) THEN
        ALTER TABLE emergency_transport ADD COLUMN destination_coordinates TEXT;
    END IF;
END $$;

-- Add assigned_time column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'emergency_transport' AND column_name = 'assigned_time'
    ) THEN
        ALTER TABLE emergency_transport ADD COLUMN assigned_time TIMESTAMP;
    END IF;
END $$;

-- Update existing records to set assigned_time based on status
UPDATE emergency_transport
SET assigned_time = request_date
WHERE status = 'assigned' OR status = 'in_progress' OR status = 'completed'
AND assigned_time IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_emergency_transport_status ON emergency_transport(status);
CREATE INDEX IF NOT EXISTS idx_emergency_transport_patient_id ON emergency_transport(patient_id);