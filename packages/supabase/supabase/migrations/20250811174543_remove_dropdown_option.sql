-- Remove show_accounting_code_dropdown field from profiles table
ALTER TABLE profiles 
DROP COLUMN show_accounting_code_dropdown;
