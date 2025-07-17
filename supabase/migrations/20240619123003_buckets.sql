-- Enable the "pg_jsonschema" extension
create extension pg_jsonschema with schema extensions;
create extension if not exists "uuid-ossp";


-- ===============================================
-- set up public storage bucket for user profile_photos
-- ===============================================
insert into storage.buckets (id, name, public)
values ('profile_photos', 'profile_photos', false)
on conflict (id) do nothing;

-- =================================================
-- set up public storage bucket for learning paths
-- =================================================
insert into storage.buckets (id, name, public)
values ('pathways', 'pathways', false)
on conflict (id) do nothing;

-- ====================================================
-- ensure private storage bucket exists for general files
-- ====================================================
insert into storage.buckets (id, name, public)
values ('files', 'files', false)
on conflict (id) do nothing;

-- ================================================================
-- ensure private storage bucket exists for published course files
-- ================================================================
insert into storage.buckets (id, name, public)
values ('published_files', 'published_files', false)
on conflict (id) do nothing;

-- ======================================================
-- set up public storage bucket for course thumbnail media
-- ======================================================
insert into storage.buckets (id, name, public)
values ('thumbnails', 'thumbnails', false)
on conflict (id) do nothing;

-- =================================================================
-- set up public storage bucket for published course thumbnail media
-- =================================================================
insert into storage.buckets (id, name, public)
values ('published_thumbnails', 'published_thumbnails', false)
on conflict (id) do nothing;

-- ================================================================
-- private bucket for organization_profile_photos  
-- ================================================================
insert into storage.buckets (id, name, public)
values ('organization_profile_photos', 'organization_profile_photos', false)
on conflict (id) do nothing; 

-- ================================================================
-- private bucket for organization_banner_photos  
-- ================================================================
insert into storage.buckets (id, name, public)
values ('organization_banner_photos', 'organization_banner_photos', false)
on conflict (id) do nothing;