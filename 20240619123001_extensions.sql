-- Enable the "pg_jsonschema" extension
create extension pg_jsonschema with schema extensions;
create extension if not exists "uuid-ossp";

-- Enable pg_cron
create extension if not exists pg_cron;

create extension if not exists pg_net;

-- Enable pgmq (for message queueing)
create extension if not exists pgmq;

create extension if not exists supabase_vault;
