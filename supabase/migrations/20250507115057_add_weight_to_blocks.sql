-- 1. Add the column with a default
ALTER TABLE public.blocks
ADD COLUMN weight INTEGER NOT NULL DEFAULT 1;

-- 2. (Optional) Update all existing rows to ensure the value is set
-- This is not strictly necessary since the column has a default + NOT NULL,
-- but can be included to make the migration step explicit
UPDATE public.blocks
SET weight = 1
WHERE weight IS NULL;