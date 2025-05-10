-- 1. Add the column with a default
ALTER TABLE public.blocks
ADD COLUMN settings jsonb not null default '{}'::jsonb;   
