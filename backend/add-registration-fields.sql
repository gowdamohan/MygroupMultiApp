-- Add nationality and marital_status columns to user_registration_form table
ALTER TABLE user_registration_form 
ADD COLUMN IF NOT EXISTS nationality VARCHAR(100) NULL AFTER gender,
ADD COLUMN IF NOT EXISTS marital_status VARCHAR(50) NULL AFTER nationality;

-- Verify the columns were added
DESCRIBE user_registration_form;

