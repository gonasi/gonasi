# Live Session Game Mechanics & Business Rules

## Overview

This document defines the **complete state machine and business rules** for Live Interactive Sessions. It serves as the source of truth for when operations are allowed and how state transitions work.

**Purpose**: Product managers and developers can reference this to understand game flow, validate mechanics, and ensure the system behaves as expected.

---

## State Machines

### 1. Session Status (Lifecycle)

The **session status** controls the high-level lifecycle of a live session.

```
┌─────────┐
│  draft  │ ← Initial state when session is created
└────┬────┘
     │ Can transition to: waiting
     ▼
┌──────────┐
│ waiting  │ ← Participants can join, session hasn't started
└────┬─────┘
     │ Can transition to: active, paused
     ▼
┌─────────┐
│ active  │ ← Session is live, gameplay ongoing
└────┬────┘
     │ Can transition to: paused, ended
     ▼
┌─────────┐
│ paused  │ ← Session temporarily halted
└────┬────┘
     │ Can transition to: active, ended
     ▼
┌─────────┐
│  ended  │ ← Session completed (TERMINAL STATE - READ ONLY)
└─────────┘
```

**Key Rules**:
- `draft` → `waiting`: Only when session has at least 1 block
- `waiting` → `active`: Starts the session timer
- `active` → `paused`: Freezes all timers, participants can't submit responses
- `paused` → `active`: Resumes timers
- Any status → `ended`: Makes session **completely read-only** (no going back)

---

### 2. Play State (Participant UI)

The **play state** controls what participants see on their screens during an active session.

```
┌───────┐
│ lobby │ ← Initial state (participants joining)
└───┬───┘
    │
    ▼
┌───────┐
│ intro │ ← Welcome screen, rules, prizes
└───┬───┘
    │
    ▼
┌─────────────────┐
│ question_active │ ← Question visible, accepting responses
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ question_locked │ ← Timer ended, answers locked (suspense)
└────────┬────────┘
         │
         ▼
┌──────────────────┐
│ question_results │ ← Show correct answer, explanation
└────────┬─────────┘
         │
         ▼
┌──────────────┐
│ leaderboard  │ ← Show rankings
└────────┬─────┘
         │
         ▼
┌──────────────┐
│ intermission │ ← Countdown before next question
└────────┬─────┘
         │
         ├─→ (back to question_active for next question)
         │
         ▼
┌────────────────┐
│ final_results  │ ← Final winners and rankings
└────────┬───────┘
         │
         ▼
┌────────┐
│ ended  │ ← Goodbye screen
└────────┘

    ┌────────┐
    │ paused │ ← Can pause from any state
    └────────┘

    ┌────────┐
    │ prizes │ ← Optional: show prizes/rewards
    └────────┘
```

**Key Rules**:
- Play state changes frequently during active sessions
- Participants render UI based on current play state
- Rejoining clients recover state from current play state
- `question_active` is the only state where responses can be submitted
- Host can manually control transitions (in manual mode) or let autoplay advance states

---

### 3. Block Status (Question Lifecycle)

The **block status** tracks the lifecycle of individual questions/blocks.

```
┌──────────┐
│ pending  │ ← Initial state, not yet shown
└─────┬────┘
      │
      ▼
┌──────────┐
│  active  │ ← Visible to participants, accepting responses
└─────┬────┘
      │
      ▼
┌──────────┐
│  closed  │ ← No more responses accepted, awaiting processing
└─────┬────┘
      │
      ▼
┌───────────┐
│ completed │ ← Results processed, scores updated
└───────────┘

      OR

┌──────────┐
│ skipped  │ ← Intentionally skipped by host
└──────────┘
```

**Key Rules**:
- `pending` → `active`: When host activates the block, sets `activated_at` timestamp
- `active` → `closed`: When timer expires or host manually closes
- `closed` → `completed`: After results are processed and scores updated
- `pending` → `skipped`: Host decides to skip this block entirely
- Once `completed` or `skipped`, block status cannot change

---

## Business Rules by Operation

### Session Updates

#### ✅ When Can You UPDATE Session Metadata?

**Conditions**:
1. ✅ User is **org owner/admin** OR **assigned facilitator**
2. ✅ Session status is **NOT** `ended`
3. ✅ Organization tier is **NOT** `temp`

**Blocked If**:
- ❌ Session status is `ended` → **Read-only mode**
- ❌ User is not facilitator or admin → **Permission denied**
- ❌ Org tier is `temp` → **Trial restrictions**

**Fields That Can Be Updated**:
- Session name, description, image
- Settings (max participants, allow late join, show leaderboard, enable chat/reactions)
- Play mode (manual vs autoplay)
- Scheduled start time

**Fields That CANNOT Be Updated** (after creation):
- Organization ID
- Created by
- Session code (auto-generated, immutable)

---

#### ✅ When Can You UPDATE Session Status?

**Allowed Transitions**:

| From Status | To Status   | Conditions                                         |
|-------------|-------------|---------------------------------------------------|
| `draft`     | `waiting`   | ✅ Has at least 1 block                           |
| `waiting`   | `active`    | ✅ Always allowed                                 |
| `waiting`   | `paused`    | ✅ Always allowed                                 |
| `active`    | `paused`    | ✅ Always allowed                                 |
| `active`    | `ended`     | ✅ Always allowed                                 |
| `paused`    | `active`    | ✅ Always allowed                                 |
| `paused`    | `ended`     | ✅ Always allowed                                 |

**Terminal State**:
- `ended` → **CANNOT** transition to any other status (immutable)

**Additional Requirements**:
- User must be facilitator or admin
- Org tier cannot be `temp`

---

#### ✅ When Can You UPDATE Play State?

**Conditions**:
1. ✅ User is **facilitator or admin**
2. ✅ Session status is **NOT** `ended`
3. ✅ Org tier is **NOT** `temp`
4. ✅ Session status should be `active` or `waiting` (recommended, not enforced)

**Allowed Transitions**:
- Play state can transition freely based on game flow
- Common flows:
  - `lobby` → `intro` → `question_active` (when first block activates)
  - `question_active` → `question_locked` (timer expires)
  - `question_locked` → `question_results` (show answer)
  - `question_results` → `leaderboard` (show rankings)
  - `leaderboard` → `intermission` → `question_active` (next question)
  - Any state → `paused` (when session status changes to paused)

**Special Rules**:
- Setting `play_state = 'question_active'` should also set `current_block_id`
- `current_block_id` should reference an `active` block

---

### Block Updates

#### ✅ When Can You UPDATE Block Status?

**Conditions**:
1. ✅ User is **facilitator or admin** (via `can_user_edit_live_session`)
2. ✅ Session status is **NOT** `ended`
3. ✅ Org tier is **NOT** `temp`

**Allowed Transitions**:

| From Status  | To Status    | Conditions                                    |
|--------------|--------------|----------------------------------------------|
| `pending`    | `active`     | ✅ Session is `active` or `waiting`          |
| `pending`    | `skipped`    | ✅ Always allowed                            |
| `active`     | `closed`     | ✅ Always allowed                            |
| `closed`     | `completed`  | ✅ Always allowed                            |
| `active`     | `skipped`    | ✅ If no responses submitted yet             |

**Terminal States**:
- `completed` → **CANNOT** change status
- `skipped` → **CANNOT** change status

**Side Effects**:
- `pending` → `active`: Sets `activated_at = now()`
- `active` → `closed`: Sets `closed_at = now()`

---

#### ✅ When Can You UPDATE Block Content/Settings?

**Conditions**:
1. ✅ User is **facilitator or admin**
2. ✅ Session status is **NOT** `ended`
3. ✅ Block status is **`pending`** (not yet shown to participants)

**Blocked If**:
- ❌ Block status is `active`, `closed`, `completed`, or `skipped` → **Already in use**
- ❌ Session status is `ended` → **Read-only**

**Recommendation**: Only edit blocks before session starts or while in `draft` status.

---

#### ✅ When Can You ADD Blocks?

**Conditions**:
1. ✅ User is **facilitator or admin**
2. ✅ Session status is **NOT** `ended`
3. ✅ Org tier is **NOT** `temp`

**Best Practice**: Add blocks while session is in `draft` or `waiting` status.

---

#### ✅ When Can You DELETE Blocks?

**Conditions**:
1. ✅ User is **facilitator or admin**
2. ✅ Session status is **NOT** `ended`
3. ✅ Org tier is **NOT** `temp`

**Warning**: Deleting a block cascades to:
- All participant responses for that block
- All test responses for that block
- Triggers recalculation of participant statistics

**Recommendation**: Only delete blocks before session starts.

---

### Participant Operations

#### ✅ When Can Participants JOIN?

**Conditions**:
1. ✅ User is **org member**
2. ✅ Session status is `waiting` OR (`active` AND `allow_late_join = true`)
3. ✅ Session is **NOT** at `max_participants` limit
4. ✅ User provides correct `session_code`
5. ✅ If visibility is `private`, user provides correct `session_key`

**Blocked If**:
- ❌ Session status is `draft` → Not yet open
- ❌ Session status is `ended` → Session over
- ❌ Session is at max capacity → Full
- ❌ Late join disabled and session is `active` → No late joins

---

#### ✅ When Can Participants SUBMIT Responses?

**Conditions**:
1. ✅ User is **active participant** in the session
2. ✅ Session status is `active`
3. ✅ Session play state is `question_active`
4. ✅ Block status is `active`
5. ✅ Participant hasn't already submitted response for this block (unique constraint)

**Blocked If**:
- ❌ Session status is `paused` → Submissions frozen
- ❌ Session status is `ended` → Session over
- ❌ Play state is NOT `question_active` → Wrong timing
- ❌ Block status is NOT `active` → Question not accepting answers
- ❌ Already submitted → One response per block per participant

---

### Facilitator Operations

#### ✅ When Can Facilitators SUBMIT Test Responses?

**Conditions**:
1. ✅ User is **facilitator or admin**
2. ✅ Session status is **NOT** `ended`
3. ✅ Session mode is `test` (recommended, not enforced)

**Best Practice**: Test responses should be in `test` mode, but system allows in `live` mode for debugging.

**Important**: Test responses do NOT affect:
- Block statistics
- Participant leaderboards
- Session analytics

---

## Permission Matrix

| Operation                         | Owner | Admin | Facilitator | Org Member | Participant |
|-----------------------------------|-------|-------|-------------|------------|-------------|
| Create Session                    | ✅    | ✅    | ✅          | ❌         | ❌          |
| View Session                      | ✅    | ✅    | ✅          | ✅         | ✅*         |
| Update Session Metadata           | ✅    | ✅    | ✅**        | ❌         | ❌          |
| Update Session Status             | ✅    | ✅    | ✅**        | ❌         | ❌          |
| Update Play State                 | ✅    | ✅    | ✅**        | ❌         | ❌          |
| Delete Session                    | ✅    | ✅    | ❌          | ❌         | ❌          |
| Add Blocks                        | ✅    | ✅    | ✅**        | ❌         | ❌          |
| Update Block Status               | ✅    | ✅    | ✅**        | ❌         | ❌          |
| Update Block Content              | ✅    | ✅    | ✅**        | ❌         | ❌          |
| Delete Blocks                     | ✅    | ✅    | ✅**        | ❌         | ❌          |
| Join Session                      | ✅    | ✅    | ✅          | ✅         | ✅***       |
| Submit Responses                  | ✅    | ✅    | ✅          | ✅         | ✅***       |
| Submit Test Responses             | ✅    | ✅    | ✅**        | ❌         | ❌          |
| Send Chat Messages                | ✅    | ✅    | ✅          | ✅         | ✅***       |
| Moderate Chat                     | ✅    | ✅    | ✅**        | ❌         | ❌          |
| View Analytics                    | ✅    | ✅    | ✅          | ✅         | ❌          |

**Notes**:
- \* Participants can view if they have session code (and key for private sessions)
- \*\* Only if designated as session facilitator
- \*\*\* Only if active participant in the session

---

## Ended Session Protection 🔒

Once a session reaches `status = 'ended'`, it becomes **completely read-only**.

### What's Blocked in Ended Sessions:

**Session Management**:
- ❌ Update session metadata (name, description, settings)
- ❌ Update session status (terminal state)
- ❌ Update play state
- ❌ Delete session (only owners/admins can delete via special permission)

**Block Management**:
- ❌ Add new blocks
- ❌ Update block status
- ❌ Update block content/settings
- ❌ Delete blocks
- ❌ Reorder blocks

**Participant Operations**:
- ❌ New participants cannot join
- ❌ Submit responses
- ❌ Facilitators cannot remove participants
- ✅ Participants can still view their own data
- ✅ Participants can update their own status (e.g., mark as "left")

**Facilitator Operations**:
- ❌ Add facilitators
- ❌ Remove facilitators
- ❌ Submit test responses
- ❌ Update test responses
- ❌ Delete test responses

**Interactions**:
- ❌ Send chat messages
- ❌ Add reactions
- ❌ Moderate messages
- ✅ View all historical data

### Why?

Ended sessions are preserved for:
- Reporting and analytics
- Audit trails
- Participant certificates/records
- Data integrity and compliance

---

## Error Codes & Messages

### Common Errors

| Error Code              | Message                                      | Cause                                      |
|------------------------|----------------------------------------------|-------------------------------------------|
| `PERMISSION_DENIED`    | "You don't have permission to edit this session" | Not facilitator/admin            |
| `SESSION_ENDED`        | "Cannot modify ended session"                | Session status is `ended`                 |
| `SESSION_NOT_FOUND`    | "Session not found"                          | Invalid session ID or RLS filtered it     |
| `BLOCK_NOT_FOUND`      | "Block not found"                            | Invalid block ID or RLS filtered it       |
| `INVALID_STATUS`       | "Cannot transition from X to Y"              | Invalid status transition                 |
| `INVALID_BLOCK_STATE`  | "Block must be pending to edit content"      | Trying to edit active/completed block     |
| `ALREADY_RESPONDED`    | "You have already responded to this block"   | Unique constraint violation               |
| `SESSION_FULL`         | "Session is at maximum capacity"             | Max participants reached                  |
| `LATE_JOIN_DISABLED`   | "Late joining is not allowed"                | Session active but late join disabled     |
| `WRONG_SESSION_KEY`    | "Invalid session key"                        | Incorrect password for private session    |
| `ORG_TIER_TEMP`        | "Organization on temp tier"                  | Temp tier restrictions                    |

---

## Testing Checklist for Product Manager

Use this checklist to verify game mechanics work as expected:

### Session Lifecycle
- [ ] Create session in `draft` status
- [ ] Transition `draft` → `waiting` (should require at least 1 block)
- [ ] Transition `waiting` → `active` (starts session)
- [ ] Transition `active` → `paused` (freezes gameplay)
- [ ] Transition `paused` → `active` (resumes)
- [ ] Transition `active` → `ended` (makes read-only)
- [ ] Verify cannot edit ended session (any field)

### Play State Progression
- [ ] Start in `lobby` state
- [ ] Transition to `intro` (welcome screen)
- [ ] Activate first block → `question_active`
- [ ] Close block → `question_locked`
- [ ] Show results → `question_results`
- [ ] Show leaderboard → `leaderboard`
- [ ] Countdown → `intermission`
- [ ] Next question → `question_active` (repeat)
- [ ] Final results → `final_results`
- [ ] End session → `ended`

### Block Lifecycle
- [ ] Create block in `pending` status
- [ ] Activate block → `active` (sets timestamp)
- [ ] Close block → `closed` (sets timestamp)
- [ ] Complete block → `completed` (scores processed)
- [ ] Try skipping a pending block → `skipped`
- [ ] Verify cannot edit `active` or `completed` blocks

### Participant Flow
- [ ] Join session in `waiting` status (should succeed)
- [ ] Join session in `active` status with late join enabled (should succeed)
- [ ] Join session in `active` status with late join disabled (should fail)
- [ ] Try joining ended session (should fail)
- [ ] Submit response during `question_active` (should succeed)
- [ ] Submit response during `question_locked` (should fail)
- [ ] Try submitting duplicate response (should fail)

### Permissions
- [ ] Verify facilitator can edit session
- [ ] Verify non-facilitator org member cannot edit
- [ ] Verify owner/admin can always edit (except ended sessions)
- [ ] Verify temp tier blocks all edits

### Ended Session Protection
- [ ] End a session
- [ ] Try updating session metadata (should fail)
- [ ] Try updating play state (should fail)
- [ ] Try adding blocks (should fail)
- [ ] Try updating block status (should fail)
- [ ] Try submitting participant response (should fail)
- [ ] Try submitting test response (should fail)
- [ ] Verify can still view all data (should succeed)

---

## State Machine Implementation

### Location

Business rules are enforced at multiple levels:

1. **Database RLS Policies**: `/Users/dc_dalin/Desktop/gonasi/supabase/schemas/liveSessions/*_rls.sql`
2. **Database Functions**: `/Users/dc_dalin/Desktop/gonasi/supabase/schemas/liveSessions/utils/*.sql`
3. **Application Layer**: `/Users/dc_dalin/Desktop/gonasi/shared/database/src/liveSessions/*.ts`

### Validation Flow

```
┌─────────────────────────┐
│ Client Request          │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Application Validation  │ ← Check business rules (NEW)
│ (TypeScript functions)  │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Database RLS            │ ← Enforce permissions
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Database Constraints    │ ← Data integrity
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Success / Error         │
└─────────────────────────┘
```

---

## Revision History

| Date       | Version | Changes                                      |
|------------|---------|---------------------------------------------|
| 2026-02-10 | 1.0     | Initial documentation of game mechanics     |

