-- =========================================
-- set up public storage bucket for avatars
-- =========================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- ==========================================
-- set up public storage bucket for pathways
-- ==========================================
insert into storage.buckets (id, name, public)
values ('pathways', 'pathways', true)
on conflict (id) do nothing;

-- ====================================================
-- ensure private storage bucket exists for general files
-- ====================================================
insert into storage.buckets (id, name)
values ('files', 'files')
on conflict (id) do nothing;

-- ============================================
-- set up public storage bucket for course media
-- ============================================
insert into storage.buckets (id, name, public)
values ('courses', 'courses', true)
on conflict (id) do nothing;
