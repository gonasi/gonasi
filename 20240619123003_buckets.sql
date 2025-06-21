-- ===============================================
-- set up public storage bucket for user avatars
-- ===============================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- =================================================
-- set up public storage bucket for learning paths
-- =================================================
insert into storage.buckets (id, name, public)
values ('pathways', 'pathways', true)
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
insert into storage.buckets (id, name, public)
values ('thumbnails', 'thumbnails', true)
on conflict (id) do nothing;

-- =================================================================
-- set up public storage bucket for published course thumbnail media
-- =================================================================
insert into storage.buckets (id, name, public)
values ('published_thumbnails', 'published_thumbnails', true)
on conflict (id) do nothing;
