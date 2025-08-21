-- Add odoo_group_id field to departments table
-- This field will store the Odoo group ID for linking departments to Odoo groups

ALTER TABLE departments 
ADD COLUMN odoo_group_id INTEGER DEFAULT NULL;

-- Add comment to document the field purpose
COMMENT ON COLUMN departments.odoo_group_id IS 'Odoo group ID for linking departments to departments in Odoo accounting analytics';
