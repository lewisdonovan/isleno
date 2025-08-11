-- Add show_accounting_code_dropdown field to profiles table
ALTER TABLE profiles 
ADD COLUMN show_accounting_code_dropdown BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN profiles.show_accounting_code_dropdown IS 'Controls whether user sees the category dropdown in invoice approvals';
