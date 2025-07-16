-- Start a transaction for atomicity
BEGIN;

-- 1. Add the 'key' column as TEXT with a default UUID.
--    It's temporarily nullable to allow the default to populate existing rows.
ALTER TABLE public.departments
ADD COLUMN key TEXT DEFAULT gen_random_uuid();

-- 2. Ensure all existing rows have a unique 'key'.
--    The DEFAULT gen_random_uuid() should handle this for new columns,
--    but this step explicitly updates any potential NULLs or if the default
--    wasn't applied correctly for some reason (e.g., if the table was empty
--    and then populated before this migration was fully applied).
--    This step is often redundant if `DEFAULT` works as expected on `ADD COLUMN`,
--    but it's a safe guard for existing data.
UPDATE public.departments
SET key = gen_random_uuid()
WHERE key IS NULL;

-- 3. Remove the default value from the 'key' column.
--    New inserts will now require an explicit value or fail if not provided.
ALTER TABLE public.departments
ALTER COLUMN key DROP DEFAULT;

-- 4. Add the NOT NULL constraint to the 'key' column.
ALTER TABLE public.departments
ALTER COLUMN key SET NOT NULL;

-- 5. Add a unique constraint to the 'key' column.
--    This also implicitly creates a unique index, ensuring fast lookups and uniqueness.
ALTER TABLE public.departments
ADD CONSTRAINT departments_key_unique UNIQUE (key);

-- Commit the transaction if all steps are successful
COMMIT;