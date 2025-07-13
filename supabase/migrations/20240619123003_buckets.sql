-- Enable the "pg_jsonschema" extension
create extension pg_jsonschema with schema extensions;


-- ===============================================
-- set up public storage bucket for user profile_photos
-- ===============================================
insert into storage.buckets (id, name)
values ('profile_photos', 'profile_photos')
on conflict (id) do nothing;

-- =================================================
-- set up public storage bucket for learning paths
-- =================================================
insert into storage.buckets (id, name)
values ('pathways', 'pathways')
on conflict (id) do nothing;

-- ====================================================
-- ensure private storage bucket exists for general files
-- ====================================================
insert into storage.buckets (id, name)
values ('files', 'files')
on conflict (id) do nothing;

-- ================================================================
-- ensure private storage bucket exists for published course files
-- ================================================================
insert into storage.buckets (id, name)
values ('published_files', 'published_files')
on conflict (id) do nothing;

-- ======================================================
-- set up public storage bucket for course thumbnail media
-- ======================================================
insert into storage.buckets (id, name)
values ('thumbnails', 'thumbnails')
on conflict (id) do nothing;

-- =================================================================
-- set up public storage bucket for published course thumbnail media
-- =================================================================
insert into storage.buckets (id, name)
values ('published_thumbnails', 'published_thumbnails')
on conflict (id) do nothing;

-- ================================================================
-- private bucket for organization  
-- ================================================================
insert into storage.buckets (id, name)
values ('organization', 'organization')
on conflict (id) do nothing; 