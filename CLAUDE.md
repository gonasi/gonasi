# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Gonasi is a Learning Management System (LMS) built as a monorepo using Turborepo. The platform enables organizations to create, publish, and monetize interactive courses with rich multimedia content and custom learning experiences.

## Tech Stack

- **Frontend**: React Router v7 (SSR-enabled), React 19, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod
- **Rich Text**: Lexical Editor (custom implementation)
- **Build System**: Turborepo + Vite
- **Deployment**: Vercel (with React Router SSR)

## Monorepo Structure

```
apps/
  web/               # Main React Router application
shared/
  database/          # Supabase client, queries, and type-safe database functions
  gonasi-schemas/    # Zod validation schemas
  gonasi-utils/      # Shared utility functions
tooling/
  db-seed/           # Database seeding scripts
  eslint-config/     # Shared ESLint configuration
  typescript-config/ # Shared TypeScript configuration
  gonasi-vitest/     # Vitest configuration
supabase/
  migrations/        # Database migrations
  functions/         # Supabase Edge Functions
  seeds/             # Database seeds
```

## Key Development Commands

### Development

```bash
npm run dev                    # Start all workspaces in dev mode
npm run build                  # Build all workspaces
npm run typecheck              # Type check all workspaces
npm run typecheck:force        # Force type check (bypass cache)
npm run lint                   # Lint all workspaces
npm run lint:fix               # Fix linting issues
npm run test                   # Run all tests
```

### Supabase Local Development

```bash
cd supabase

# Generate TypeScript types from database schema
supabase gen types typescript --local > ../shared/database/src/schema/index.ts

# Reset database and apply migrations
supabase db reset

# Apply migrations
supabase migration up

# Start functions locally (without JWT verification)
supabase functions serve --no-verify-jwt

# Create a new migration
supabase db diff -f migration-name

# Create a comprehensive migration (reset and diff)
supabase db diff --schema public --schema auth --schema extensions --schema storage --schema pgmq --schema realtime -f migration_name

# Run database tests
supabase test db
```

## Architecture Highlights

### Authentication & Authorization

- JWT-based authentication via Supabase Auth
- Role-based access control with custom `app_role` enum: 'go_su', 'go_admin', 'go_staff'
- User roles decoded from JWT tokens in root loader (apps/web/app/root.tsx:75)
- Session and profile data stored in Zustand global store

### Database Layer (`shared/database/`)

- Type-safe database functions organized by domain (courses, lessons, organizations, etc.)
- All database operations use `TypedSupabaseClient` from `shared/database/src/client/index.ts`
- Database schema types auto-generated from Supabase: `shared/database/src/schema/index.ts`
- Functions follow naming convention: `fetch*`, `create*`, `edit*`, `delete*`
- Always use `getUserId(supabase)` helper for user-scoped queries

### React Router Application (`apps/web/`)

- File-based routing using React Router v7 conventions
- Routes located in `app/routes/` with nested layout pattern
- SSR enabled by default (see `react-router.config.ts`)
- Root loader provides global context: user, role, session, environment variables
- Layouts: auth, dashboard, course builder, profile, organizations
- Use `useLoaderData<typeof loader>()` to access loader data with full type safety

### Forms & Validation

- React Hook Form for form state management
- Conform for React Router integration and progressive enhancement
- Zod schemas in `shared/gonasi-schemas/` for validation
- Form utilities in `apps/web/app/utils/` for common patterns

### Course Builder & Content System

- Custom Lexical editor implementation (`apps/web/app/components/go-editor/`)
- Plugin-based content blocks system (`apps/web/app/components/plugins/`)
- Plugin categories: DragAndDrop, Quiz, Reveal, RichText, MediaInteraction
- Course structure: Course → Chapters → Lessons → Blocks (plugins)
- File library for managing course assets (images, videos, documents, 3D models)
- Preview mode vs Play mode for content creation and consumption

### Component Organization

- UI components in `apps/web/app/components/ui/` (Radix UI + custom implementations)
- Layout components in `apps/web/app/components/layouts/`
- Feature components co-located with routes
- Shared components exported via index.ts barrel files

### State Management

- Global state: Zustand store at `apps/web/app/store/index.tsx`
- Stores: activeSession, activeUserProfile, activeUserRole, preferences (sound, vibration), UI mode
- Local state: React hooks and React Hook Form
- Server state: React Router loaders and actions

### Environment Variables

- Server-side env handled in `apps/web/app/.server/env.server.ts`
- Client-side env passed via root loader: `useClientEnv()` hook
- Required env vars: Supabase keys, database URLs, Paystack keys, session secrets

### Testing

- Vitest for unit tests
- Database tests in `shared/database/src/__tests__/`
- Run tests with `npm run test` or `npm run test:ui` for UI

## Important Patterns

### Database Queries

Always follow this pattern for database functions:

```typescript
export async function fetchResourceById(supabase: TypedSupabaseClient, resourceId: string) {
  const userId = await getUserId(supabase);

  const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .eq('id', resourceId)
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data;
}
```

### React Router Loaders

```typescript
export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase, headers } = createClient(request);
  const data = await fetchData(supabase, params.id);

  return json({ data }, { headers });
}
```

### React Router Actions

```typescript
export async function action({ request }: Route.ActionArgs) {
  const { supabase, headers } = createClient(request);
  const formData = await request.formData();

  // Validate with Conform + Zod
  const submission = parseWithZod(formData, { schema: YourSchema });

  if (submission.status !== 'success') {
    return json(submission.reply(), { status: 400 });
  }

  await updateData(supabase, submission.value);

  return redirectWithToast(
    '/success',
    {
      message: 'Success!',
      type: 'success',
    },
    { headers },
  );
}
```

## Common Gotchas

1. **Supabase Headers**: Always return Supabase headers from loaders/actions to maintain auth state
2. **Role Decoding**: User roles are decoded from JWT in root loader, not from database
3. **File Uploads**: Use `@mjackson/form-data-parser` for handling multipart form data
4. **Type Generation**: Regenerate Supabase types after schema changes with `supabase gen types`
5. **Turborepo Cache**: Clear Turbo cache if seeing stale builds: `rm -rf .turbo`
6. **SSR Considerations**: Be mindful of client-only code (window, document) - use useEffect or clientOnly utilities

## Branching & Deployment

- Main branch: `main`
- Staging branch: `staging`
- Feature branches merge to `staging`, then to `main`
- Vercel deployment configured for both branches
- Run `npm run build` locally to verify build before pushing
