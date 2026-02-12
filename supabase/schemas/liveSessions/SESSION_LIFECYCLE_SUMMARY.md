# Live Session Lifecycle - Complete Summary

## Problem Fixed

**Error**: `[updateLiveSessionStatus] Invalid transition from "draft" to "active"`

**Root Cause**: The session status transitions only allowed `draft → waiting → active`, but not `draft → active` directly.

**Solution**: Updated `VALID_SESSION_STATUS_TRANSITIONS` to support both flows.

---

## Session Status Lifecycle

### Valid Status Transitions

```typescript
draft → waiting → active → ended  // Standard flow with lobby period
draft → active → ended            // Quick start flow
active ↔ paused → ended          // Can pause/resume during session
```

### Status Meanings

| Status | Description | play_state | actual_start_time |
|--------|-------------|------------|-------------------|
| `draft` | Session being edited, no participant access | `NULL` | `NULL` |
| `waiting` | Lobby open, participants can join, but session not started | `NULL` | `NULL` |
| `active` | Session started, gameplay active | Starts as `'lobby'` | Set automatically |
| `paused` | Temporarily halted | Preserved | Preserved |
| `ended` | Completed, read-only | Preserved | Preserved |

---

## Play State Lifecycle

### When play_state Changes

| Event | From | To | Trigger |
|-------|------|-----|---------|
| Session created | N/A | `NULL` | Default value |
| Status → `waiting` | `NULL` | `NULL` | Remains NULL |
| Status → `active` | `NULL` | `'lobby'` | **Database trigger** |
| Host changes state | Current | New state | Manual/automatic based on control_mode |

### Database Constraint (Enforced at DB Level)

```sql
-- If session hasn't started, play_state MUST be NULL
-- If session has started, play_state MUST NOT be NULL
CHECK (
  (actual_start_time IS NULL AND play_state IS NULL)
  OR
  (actual_start_time IS NOT NULL AND play_state IS NOT NULL)
)
```

### Backend Validation

- ❌ **Cannot change play_state** if `actual_start_time IS NULL`
- ✅ **Can change play_state** after session starts (`actual_start_time IS NOT NULL`)
- Error message: *"Cannot change play state. Session has not started yet. Please start the session first."*

---

## Two Valid Flows

### Flow 1: Standard (with lobby period)

```
DRAFT
  ↓
  [Transition to WAITING]
  ↓
WAITING
  - Lobby open for participants to join
  - Share session code
  - play_state = NULL (cannot change yet)
  - UI: Play state controls are DISABLED
  ↓
  [Host clicks "Start Session"]
  ↓
ACTIVE
  - actual_start_time = now()
  - play_state → 'lobby' (automatic via trigger)
  - UI: Play state controls now ENABLED
  ↓
  [Host manages play states]
  ↓
  countdown → intro → questions → results → leaderboard → final_results → ended
```

**Use When:**
- Need time for participants to join
- Want to prepare and test equipment
- Running public sessions where people arrive gradually

### Flow 2: Quick Start (no lobby period)

```
DRAFT
  ↓
  [Transition to ACTIVE directly]
  ↓
ACTIVE
  - actual_start_time = now()
  - play_state → 'lobby' (automatic via trigger)
  - UI: Play state controls now ENABLED
  ↓
  [Host manages play states]
  ↓
  countdown → intro → questions → results → leaderboard → final_results → ended
```

**Use When:**
- Testing sessions
- Immediate start needed
- Small/private groups already gathered
- No pre-gathering required

---

## Key Business Rules

### 1. play_state Initialization
- **Before start**: play_state = `NULL` (enforced by constraint)
- **On start**: trigger automatically sets play_state = `'lobby'`
- **After start**: host controls transitions via `updateLiveSessionPlayState()`

### 2. Status Transition Requirements

#### draft → waiting
- ✅ Requires: At least 1 block in session
- ✅ Effect: Lobby opens, participants can join
- ✅ play_state: Remains NULL

#### draft → active (NEW - Fixed)
- ✅ Requires: At least 1 block in session
- ✅ Effect: Session starts immediately, actual_start_time set
- ✅ play_state: Trigger sets to 'lobby'

#### waiting → active
- ✅ Requires: Already validated blocks when entering waiting
- ✅ Effect: Session starts, actual_start_time set
- ✅ play_state: Trigger sets to 'lobby'

### 3. Play State Transition Rules

```typescript
// Cannot change play_state if session hasn't started
if (!session.actual_start_time) {
  return error: "Cannot change play state. Session has not started yet."
}

// Valid transitions defined in VALID_PLAY_STATE_TRANSITIONS
// Example: lobby → countdown → intro → question_active → ...
```

---

## Database Trigger (Auto-Initialize)

```sql
CREATE OR REPLACE FUNCTION initialize_play_state_on_session_start()
RETURNS TRIGGER AS $$
BEGIN
  -- When actual_start_time is set AND play_state is NULL
  -- Automatically set play_state to 'lobby'
  IF OLD.actual_start_time IS NULL
     AND NEW.actual_start_time IS NOT NULL
     AND NEW.play_state IS NULL THEN
    NEW.play_state := 'lobby';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER live_session_initialize_play_state
  BEFORE UPDATE OF actual_start_time ON live_sessions
  FOR EACH ROW
  EXECUTE FUNCTION initialize_play_state_on_session_start();
```

**What it does:**
1. Watches for `actual_start_time` being set (NULL → value)
2. If `play_state` is NULL, sets it to `'lobby'`
3. Happens automatically, no manual intervention needed

---

## UI Behavior

### Before Session Starts (play_state = NULL)

```tsx
<PlayStateControls
  currentPlayState={null}  // NULL value
  disabled={true}          // Controls are disabled
  label="Not Started"
  description="Start the session to activate play state controls"
  showChevron={false}     // No dropdown since disabled
/>
```

**User sees:**
- Play state button showing "Not Started"
- Button is grayed out and not clickable
- Message: "Start the session to activate play state controls"

### After Session Starts (play_state = 'lobby')

```tsx
<PlayStateControls
  currentPlayState="lobby"  // Has value now
  disabled={false}          // Controls are enabled
  label="Lobby"
  description="Waiting room before session starts"
  showChevron={true}       // Can change states
/>
```

**User sees:**
- Play state button showing "Lobby"
- Button is clickable, shows dropdown on click
- Can transition to valid states: countdown, host_segment, paused

---

## Complete Example Flow

### Scenario: Host Running a Quiz Night

**Step 1: Preparation (DRAFT)**
```
- Create session
- Add 10 quiz question blocks
- Set control_mode = 'hybrid'
- Set chat_mode = 'reactions_only'
- status = 'draft'
- play_state = NULL
```

**Step 2: Open Lobby (DRAFT → WAITING)**
```typescript
await updateLiveSessionStatus({
  supabase,
  sessionId,
  status: 'waiting'  // Opens lobby
});
```
```
- status = 'waiting'
- play_state = NULL (still can't change it)
- Participants see join screen
- Share session code: "ABC123"
- 50 participants join over 10 minutes
```

**Step 3: Start Session (WAITING → ACTIVE)**
```typescript
await updateLiveSessionStatus({
  supabase,
  sessionId,
  status: 'active'  // Starts session
});
```
```
- status = 'active'
- actual_start_time = '2026-02-13T12:00:00Z'
- play_state = 'lobby' (set by trigger)
- Host can now control play states
```

**Step 4: Begin Game**
```typescript
// Host transitions through states
await updateLiveSessionPlayState({ playState: 'countdown' });  // 3...2...1...GO!
await updateLiveSessionPlayState({ playState: 'intro' });      // Welcome screen
await updateLiveSessionPlayState({
  playState: 'question_active',
  currentBlockId: block1.id
});
// ... continues through all blocks ...
```

**Step 5: End Session**
```typescript
await updateLiveSessionPlayState({ playState: 'final_results' });
await updateLiveSessionPlayState({ playState: 'ended' });
await updateLiveSessionStatus({ status: 'ended' });
```

---

## Testing Checklist

### ✅ Test Case 1: Standard Flow
- [ ] Create session in draft
- [ ] Try changing play_state → Should fail (NULL, disabled in UI)
- [ ] Transition to waiting
- [ ] Try changing play_state → Should fail (still NULL)
- [ ] Transition to active
- [ ] Verify play_state automatically became 'lobby'
- [ ] Change play_state → Should succeed

### ✅ Test Case 2: Quick Start Flow (NEW)
- [ ] Create session in draft
- [ ] Try changing play_state → Should fail
- [ ] Transition DIRECTLY to active (skip waiting)
- [ ] Verify play_state automatically became 'lobby'
- [ ] Change play_state → Should succeed

### ✅ Test Case 3: Database Constraint
- [ ] Try manually setting play_state in draft → Should fail
- [ ] Try manually setting play_state = NULL after start → Should fail
- [ ] Constraint enforces: (actual_start_time IS NULL) = (play_state IS NULL)

### ✅ Test Case 4: Backend Validation
- [ ] Call updateLiveSessionPlayState before session starts
- [ ] Should get error: "Cannot change play state. Session has not started yet."

### ✅ Test Case 5: UI Behavior
- [ ] Draft/Waiting: Play state controls should be disabled
- [ ] Active: Play state controls should be enabled
- [ ] Transitions should work smoothly

---

## Files Changed

### Backend
- ✅ `shared/database/src/liveSessions/updateLiveSessionStatus.ts`
  - Updated `VALID_SESSION_STATUS_TRANSITIONS` to allow `draft → active`
  - Added block count validation for both `waiting` and `active` transitions

- ✅ `shared/database/src/liveSessions/updateLiveSessionPlayState.ts`
  - Added validation: cannot change play_state if `actual_start_time IS NULL`
  - Handles nullable `play_state` gracefully

### Database Schema
- ✅ `supabase/schemas/liveSessions/live_sessions_schema_and_indexes.sql`
  - Made `play_state` nullable
  - Added constraint: `live_sessions_play_state_lifecycle_check`

- ✅ `supabase/schemas/liveSessions/live_sessions_triggers.sql`
  - Added trigger: `initialize_play_state_on_session_start()`
  - Updated mode change reset to set play_state = NULL

- ✅ `supabase/schemas/liveSessions/enums/live_session_status.sql`
  - Updated documentation to reflect both flows

- ✅ `supabase/schemas/liveSessions/enums/live_session_play_state.sql`
  - Updated documentation to explain NULL state

### Frontend
- ✅ `apps/web/app/routes/.../PlayStateControls.tsx`
  - Accepts `currentPlayState: LiveSessionPlayState | null`
  - Shows "Not Started" when NULL
  - Disables controls when NULL

- ✅ `apps/web/app/routes/.../live-session-controls-index.tsx`
  - Updated state types to handle NULL
  - Fixed realtime update handler

### Documentation
- ✅ `supabase/schemas/liveSessions/GAME_MECHANICS_FEEDBACK.md`
  - Added implementation status section
  - Documented complete hosting guide
  - Explained session start lifecycle

- ✅ `supabase/schemas/liveSessions/SESSION_LIFECYCLE_SUMMARY.md` (this file)

---

## Migration Required

After reviewing all schema changes, you'll need to:

1. **Generate migration**:
   ```bash
   cd supabase
   supabase db diff --schema public -f enforce_play_state_lifecycle
   ```

2. **Review migration includes**:
   - Make `play_state` nullable
   - Add `live_sessions_play_state_lifecycle_check` constraint
   - Create `initialize_play_state_on_session_start()` function
   - Create trigger on `actual_start_time` column

3. **Apply migration**:
   ```bash
   supabase db reset  # or apply migration file
   ```

4. **Regenerate types**:
   ```bash
   supabase gen types typescript --local > ../shared/database/src/schema/index.ts
   ```

---

## Summary

### What Was Broken
- ❌ Could not transition directly from `draft` → `active`
- ❌ play_state was required (`NOT NULL`), but shouldn't exist before start

### What Was Fixed
- ✅ Added `draft → active` transition (quick start flow)
- ✅ Made `play_state` nullable (NULL before session starts)
- ✅ Added database constraint to enforce lifecycle rules
- ✅ Added trigger to auto-initialize play_state on session start
- ✅ Added backend validation to prevent premature play_state changes
- ✅ Updated UI to handle NULL play_state gracefully
- ✅ Comprehensive documentation of both flows

### Result
Now supports two valid flows:
1. **Standard**: `draft → waiting → active` (with lobby period)
2. **Quick Start**: `draft → active` (immediate start)

Both flows properly handle the play_state lifecycle with automatic initialization when the session starts.
