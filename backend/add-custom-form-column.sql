-- Add custom_form column to create_details table
ALTER TABLE create_details 
ADD COLUMN IF NOT EXISTS custom_form TEXT NULL AFTER url;

-- Verify the column was added
DESCRIBE create_details;

