ALTER TABLE public.courses
ADD COLUMN blur_hash text;

ALTER TABLE public.pathways
ADD COLUMN blur_hash text;

ALTER TABLE public.file_library
ADD COLUMN blur_hash text;
