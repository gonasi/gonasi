-- Enable the "pg_jsonschema" extension
create extension pg_jsonschema with schema extensions;
create extension if not exists "uuid-ossp";

-- Enable pg_cron
create extension if not exists pg_cron with schema pg_catalog;
-- Enable pgmq (for message queueing)
create extension if not exists pgmq;