-- Start a transaction for atomicity
BEGIN;

-- 1. Add the 'department_id' column to the 'public.kpi_categories' table.
--    It's initially nullable because existing rows won't have a department_id yet.
ALTER TABLE public.kpi_categories
ADD COLUMN department_id UUID;

-- 2. Add the foreign key constraint.
--    This links 'kpi_categories.department_id' to 'departments.department_id'.
ALTER TABLE public.kpi_categories
ADD CONSTRAINT fk_kpi_categories_department
FOREIGN KEY (department_id)
REFERENCES public.departments(department_id)
ON DELETE SET NULL; -- Or ON DELETE CASCADE, ON DELETE RESTRICT, etc., choose based on your desired behavior.
                    -- SET NULL is chosen here as a common default for many-to-one relationships
                    -- where the category might exist without a department if the department is deleted.

-- 3. Add an index to the new foreign key column for performance.
CREATE INDEX idx_kpi_categories_department_id ON public.kpi_categories (department_id);

-- Commit the transaction if all steps are successful
COMMIT;
