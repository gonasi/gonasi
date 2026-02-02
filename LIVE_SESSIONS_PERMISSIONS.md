# Live Sessions - Permission System

## Overview

The Live Sessions feature uses the **same permission model as Courses**, ensuring consistency across the platform.

## Permission Hierarchy

### Organization Roles

1. **Owner** - Full access to everything
2. **Admin** - Full access to everything
3. **Editor (Staff)** - Can only access sessions they're assigned to as facilitators

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│ PERMISSION HIERARCHY                                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Owner/Admin                                                 │
│  ✓ Create sessions                                           │
│  ✓ Edit ANY session in their organization                   │
│  ✓ Delete ANY session                                        │
│  ✓ Add/remove facilitators                                   │
│  ✓ Full control over all aspects                            │
│                                                              │
│  Editor (Staff) - Must be assigned as facilitator            │
│  ✓ Create sessions (auto-assigned as facilitator)           │
│  ✓ Edit ONLY sessions they're assigned to                   │
│  ✗ Cannot delete sessions                                    │
│  ✗ Cannot add/remove other facilitators                      │
│  ✓ Control blocks, participants, etc. for their sessions    │
│                                                              │
│  Organization Members (no specific role)                     │
│  ✓ View sessions                                             │
│  ✓ Join as participants                                      │
│  ✗ Cannot create or edit sessions                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Database Tables

### `live_session_facilitators`

Stores which staff members (editors) are assigned to each session.

**Structure:**
- `live_session_id` - The session
- `user_id` - The staff member assigned as facilitator
- `organization_id` - Must match session's organization
- `added_by` - Who assigned this facilitator (admin/owner)
- `added_at` - When they were assigned

**Key Features:**
- Unique constraint: One user can't be added twice to same session
- Validates user is org member
- Validates org_id matches session's org

## Key Functions

### `can_user_edit_live_session(session_id)`

Central permission check function. Returns `true` if user can edit the session.

**Checks:**
1. ❌ Block if org is on 'temp' tier (suspended)
2. ✅ Allow if user is owner/admin
3. ✅ Allow if user is assigned facilitator
4. ❌ Deny otherwise

**Usage in RLS:**
```sql
create policy "Update: Admins or facilitators can update sessions"
on public.live_sessions
for update
using (
  public.can_user_edit_live_session(id)
);
```

### `add_creator_as_facilitator()`

Trigger function that automatically assigns editor-role users as facilitators when they create a session.

**Logic:**
1. User creates a session
2. Check their org role
3. If role is 'editor', add them to `live_session_facilitators`
4. If role is 'admin' or 'owner', skip (they have access anyway)

This ensures editors can immediately work on sessions they create without admin intervention.

## RLS Policies Summary

### `live_sessions`
- **SELECT**: All org members
- **INSERT**: Owner, Admin, Editor
- **UPDATE**: Admins OR assigned facilitators
- **DELETE**: Admins/Owners ONLY

### `live_session_facilitators`
- **SELECT**: All org members (editor+)
- **INSERT**: Admins/Owners ONLY
- **DELETE**: Admins/Owners ONLY

### `live_session_blocks`
- **SELECT**: All org members
- **INSERT/UPDATE/DELETE**: Admins OR assigned facilitators

### `live_session_participants`
- **SELECT**: All org members
- **INSERT**: Self (via RPC with validation)
- **UPDATE**: Self OR facilitators
- **DELETE**: Facilitators only

### `live_session_responses`
- **SELECT**: All org members
- **INSERT**: Active participants (to active blocks only)

### `live_session_messages`
- **SELECT**: Active participants
- **INSERT**: Active participants (if chat enabled)
- **UPDATE**: Facilitators (for moderation)

### `live_session_reactions`
- **SELECT**: Participants
- **INSERT**: Active participants (if reactions enabled)

### `live_session_analytics`
- **SELECT**: All org members
- **INSERT/UPDATE**: System-managed (triggers)

## Workflow Examples

### Example 1: Editor Creates Session

```
1. Sarah (editor) creates a new live session
   → Trigger fires: add_creator_as_facilitator()
   → Sarah is automatically added to live_session_facilitators
   → Sarah can now edit this session

2. Sarah adds blocks, configures settings
   → RLS checks can_user_edit_live_session()
   → Finds Sarah in facilitators table
   → ✅ Allowed

3. Sarah tries to delete the session
   → RLS checks user role
   → Sarah is 'editor', not 'admin'/'owner'
   → ❌ Denied
```

### Example 2: Admin Assigns Facilitator

```
1. Mike (admin) creates a session

2. Mike assigns Jennifer (editor) as facilitator
   INSERT INTO live_session_facilitators (live_session_id, user_id, ...)
   → RLS checks: Mike is admin ✅
   → Validation trigger: Jennifer is org member ✅
   → Jennifer added successfully

3. Jennifer can now edit this session
   → can_user_edit_live_session() returns true
   → ✅ Full edit access to blocks, participants, etc.
```

### Example 3: Cross-Check Prevents Privilege Escalation

```
1. Hacker tries to manually insert themselves as facilitator
   INSERT INTO live_session_facilitators (...)
   → RLS policy checks: has_org_role('admin', ...)
   → Hacker is 'editor'
   → ❌ Denied at RLS level

2. Hacker tries to update session directly
   UPDATE live_sessions SET ... WHERE id = ...
   → RLS checks can_user_edit_live_session()
   → Looks up facilitators table
   → Hacker not found
   → ❌ Denied
```

## Comparison with Courses

| Feature | Courses | Live Sessions |
|---------|---------|---------------|
| Assignment table | `course_editors` | `live_session_facilitators` |
| Permission function | `can_user_edit_course()` | `can_user_edit_live_session()` |
| Auto-assign trigger | `add_creator_as_course_editor()` | `add_creator_as_facilitator()` |
| Staff can delete | ❌ No | ❌ No |
| Temp tier blocked | ✅ Yes | ✅ Yes |

**Implementation is 1:1 identical** - just renamed for live sessions context.

## Database Migration

When you run `supabase db diff`, you'll see:

### New Tables
- `live_session_facilitators`

### New Functions
- `ensure_facilitator_is_valid()` (trigger)
- `can_user_edit_live_session()`
- `add_creator_as_facilitator()` (trigger)

### Updated Policies
- All live session RLS policies now use proper permission checks

## Testing Checklist

### As Admin/Owner
- [ ] Create a session (should auto-succeed)
- [ ] Edit any session in org
- [ ] Delete any session
- [ ] Add/remove facilitators
- [ ] View all sessions

### As Editor (Staff)
- [ ] Create a session (should auto-assign as facilitator)
- [ ] Edit own session
- [ ] Try to edit unassigned session (should fail)
- [ ] Try to delete own session (should fail)
- [ ] Try to add facilitator (should fail)
- [ ] Get assigned to session by admin
- [ ] Edit newly assigned session

### As Org Member (no role)
- [ ] View sessions
- [ ] Join as participant
- [ ] Try to create session (should fail)
- [ ] Try to edit session (should fail)

### Security Tests
- [ ] Try to manually insert into facilitators table (should fail unless admin)
- [ ] Try to edit facilitators org_id to mismatch (should fail via trigger)
- [ ] Try to add non-org-member as facilitator (should fail via trigger)
- [ ] Verify temp tier blocks all editing

## Code Examples

### Check if user can edit

**TypeScript:**
```typescript
const { data, error } = await supabase
  .rpc('can_user_edit_live_session', { arg_session_id: sessionId });

if (data) {
  // User can edit
} else {
  // User cannot edit
}
```

### Add facilitator (admin only)

```typescript
const { error } = await supabase
  .from('live_session_facilitators')
  .insert({
    live_session_id: sessionId,
    user_id: staffUserId,
    organization_id: orgId,
    added_by: adminUserId
  });
```

### Query sessions user can edit

```typescript
// Admins/owners see all sessions in org
// Editors only see sessions they're assigned to

const { data } = await supabase
  .from('live_sessions')
  .select('*')
  .filter('organization_id', 'eq', orgId);

// RLS automatically filters based on can_user_edit_live_session()
```

## Summary

✅ **Exact same permission model as courses**
✅ **Admins/Owners: Full control**
✅ **Editors (Staff): Must be assigned as facilitators**
✅ **Auto-assignment when editors create sessions**
✅ **Secure RLS policies prevent privilege escalation**
✅ **Temp tier protection built-in**

This ensures platform consistency and familiar permission patterns for your team.
