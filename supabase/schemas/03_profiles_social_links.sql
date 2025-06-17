-- Adds social media fields with strict URL format validations.
alter table public.profiles
add column twitter_url text check (twitter_url ~* '^https?://(www\.)?twitter\.com/[^/]+/?$'),
add column linkedin_url text check (linkedin_url ~* '^https?://(www\.)?linkedin\.com/in/[^/]+/?$'),
add column github_url text check (github_url ~* '^https?://(www\.)?github\.com/[^/]+/?$'),
add column instagram_url text check (instagram_url ~* '^https?://(www\.)?instagram\.com/[^/]+/?$'),
add column facebook_url text check (facebook_url ~* '^https?://(www\.)?facebook\.com/[^/]+/?$'),
add column tiktok_url text check (tiktok_url ~* '^https?://(www\.)?tiktok\.com/@[^/]+/?$'),
add column youtube_url text check (youtube_url ~* '^https?://(www\.)?youtube\.com/(c|channel|user)/[^/]+/?$'),
add column discord_url text check (discord_url ~* '^https?://(www\.)?discord\.gg/[^/]+/?$');
