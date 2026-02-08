# Live Sessions Feature - Complete Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [UI/Frontend Perspective](#uifrontend-perspective)
4. [Backend Perspective](#backend-perspective)
5. [Mode System (Test vs Live)](#mode-system-test-vs-live)
6. [Session Lifecycle](#session-lifecycle)
7. [Real-time Features](#real-time-features)
8. [Data Flow](#data-flow)
9. [Security & Permissions](#security--permissions)
10. [Technical Implementation Details](#technical-implementation-details)

---

## Overview

The Live Sessions feature enables organizations to create, manage, and run interactive real-time quiz sessions with participants. It's similar to platforms like Kahoot or Quizizz, allowing facilitators to host live Q&A sessions with features like:

- Real-time question-answer gameplay
- Live leaderboards and rankings
- Participant engagement tracking
- Multiple question types (using existing plugin system)
- Test mode for previewing sessions before going live
- Manual or automatic progression through questions

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                      Live Sessions System                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐│
│  │   Facilitator  │  │  Participants  │  │  Test Mode     ││
│  │   Dashboard    │  │    Experience  │  │  Preview       ││
│  └────────┬───────┘  └────────┬───────┘  └────────┬───────┘│
│           │                   │                     │        │
│           └───────────────────┼─────────────────────┘        │
│                               │                              │
│  ┌────────────────────────────┼─────────────────────────┐   │
│  │        React Router v7 Frontend (SSR)               │   │
│  │  - LiveSessionPlayEngine (core component)           │   │
│  │  - ViewLiveSessionPluginRenderer (question display) │   │
│  │  - Real-time UI updates via Supabase Realtime      │   │
│  └────────────────────────────┼─────────────────────────┘   │
│                               │                              │
│  ┌────────────────────────────┼─────────────────────────┐   │
│  │             Supabase Backend                        │   │
│  │  ┌───────────────────────────────────────────────┐  │   │
│  │  │  PostgreSQL Database                          │  │   │
│  │  │  - live_sessions (session metadata)           │  │   │
│  │  │  - live_session_blocks (questions)            │  │   │
│  │  │  - live_session_participants (user tracking)  │  │   │
│  │  │  - live_session_responses (answers)           │  │   │
│  │  │  - live_session_test_responses (test data)    │  │   │
│  │  │  - live_session_facilitators (permissions)    │  │   │
│  │  │  - live_session_messages (chat)               │  │   │
│  │  │  - live_session_reactions (engagement)        │  │   │
│  │  │  - live_session_analytics (stats)             │  │   │
│  │  └───────────────────────────────────────────────┘  │   │
│  │  ┌───────────────────────────────────────────────┐  │   │
│  │  │  Supabase Realtime                            │  │   │
│  │  │  - Broadcast play state changes               │  │   │
│  │  │  - Sync participant responses                 │  │   │
│  │  │  - Update leaderboards live                   │  │   │
│  │  └───────────────────────────────────────────────┘  │   │
│  │  ┌───────────────────────────────────────────────┐  │   │
│  │  │  Triggers & Functions                         │  │   │
│  │  │  - Mode change state reset                    │  │   │
│  │  │  - Automatic statistics updates               │  │   │
│  │  │  - Ranking calculations                       │  │   │
│  │  │  - Session validation                         │  │   │
│  │  └───────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## UI/Frontend Perspective

### 1. Facilitator Experience

#### Session Creation & Management

**Location**: `apps/web/app/routes/organizations/liveSessions/`

1. **Create Session**
   - Navigate to organization dashboard → Live Sessions
   - Click "Create New Session"
   - Fill in session details:
     - Name and description
     - Thumbnail image (required for starting)
     - Visibility: public, unlisted, or private
     - Session key (for private sessions)
     - Max participants (optional)
     - Settings: late join, leaderboard, chat, reactions

2. **Build Session Content**

   **Location**: `apps/web/app/routes/organizations/liveSessions/session/blocks/`

   - Add question blocks using the plugin button
   - Supported block types (via plugin system):
     - True or False
     - Multiple Choice (Single Answer)
     - Multiple Choice (Multiple Answers)
     - Fill in the Blank
     - Matching Game
     - Swipe Categorize
     - Rich Text (informational)
   - Configure each block:
     - Time limit (seconds)
     - Difficulty level (easy, medium, hard)
     - Question content and correct answers
   - Reorder blocks via drag-and-drop
   - Preview blocks in builder mode

3. **Test Mode**

   **Route**: `/l/{sessionCode}/test`

   - Click "Test Session" button
   - Opens in new tab
   - Allows facilitators to:
     - Preview all questions
     - Test timing and flow
     - Verify question correctness
     - Practice manual controls
     - Simulate participant experience
   - **Key Feature**: Test responses are stored separately and cleared when switching modes

4. **Session Controls** (during live session)
   - Start session (transitions from draft → waiting)
   - Navigate between play states:
     - Lobby (waiting room)
     - Intro (welcome screen)
     - Question Active (participants can answer)
     - Question Locked (timer expired, suspense)
     - Question Results (show correct answer)
     - Leaderboard (show rankings)
     - Intermission (break between questions)
     - Final Results (end of session)
   - Pause/Resume session
   - End session

### 2. Participant Experience

#### Joining a Session

**Route**: `/l/{sessionCode}` or `/live/{sessionCode}/join`

1. **Join Flow**:
   - Enter session code (e.g., "ABC123")
   - For private sessions: enter session key
   - Optionally set display name for leaderboard
   - Join button → Validates and creates participant record

2. **Session Validation** (backend checks):
   - Session exists and is not ended
   - Session is in joinable state (waiting or active)
   - If active, late join must be enabled
   - Session not full (if max participants set)
   - User is member of organization
   - For private sessions: correct session key provided

#### During Session

**Component**: `LiveSessionPlayEngine`

1. **Lobby State**
   - See session name and details
   - See other participants joining (real-time)
   - Wait for facilitator to start

2. **Question Active State**
   - See question and options
   - Timer counting down
   - Submit answer
   - Visual feedback on submission
   - Cannot change answer once submitted

3. **Question Results State**
   - See correct answer highlighted
   - See if own answer was correct/incorrect
   - See points earned
   - See explanation (if provided)

4. **Leaderboard State**
   - See current ranking
   - See top participants
   - See score changes
   - Animated rank transitions

5. **Final Results State**
   - See final placement
   - See total score
   - See session summary
   - Option to view detailed breakdown

### 3. UI States & Components

#### Key Components

1. **LiveSessionPlayEngine** (`apps/web/app/components/liveSession/`)
   - Core component managing session flow
   - Handles real-time state synchronization
   - Props:
     - `mode`: 'test' or 'live'
     - `sessionCode`: Unique session identifier
     - `sessionId`: UUID of session
     - `blocks`: Array of question blocks
     - `sessionTitle`: Display name

2. **ViewLiveSessionPluginRenderer** (`apps/web/app/components/plugins/liveSession/`)
   - Renders question blocks based on plugin type
   - Adapts existing plugin components for live mode
   - Handles response submission

3. **LiveSessionBlockWrapper** (`apps/web/app/components/plugins/liveSession/`)
   - Wrapper for block display in builder mode
   - Provides drag-and-drop functionality
   - Shows edit/delete controls for facilitators

#### Visual States

```
UI State Hierarchy:

1. Draft Mode (Builder)
   ├─ Session Settings Form
   ├─ Block Builder (drag-and-drop list)
   │  ├─ Preview Renderer (for each block)
   │  └─ Control Buttons (edit, delete, reorder)
   └─ Test Session Button

2. Test Mode
   ├─ [Test Mode] Badge
   ├─ Manual Navigation Controls
   ├─ Question Display
   └─ Ephemeral Response Tracking

3. Live Mode
   ├─ Facilitator View
   │  ├─ Participant Count
   │  ├─ Current State Display
   │  ├─ Navigation Controls (manual mode)
   │  └─ Live Statistics
   └─ Participant View
      ├─ Current Play State Screen
      ├─ Timer (if applicable)
      ├─ Response Interface
      └─ Live Leaderboard Updates
```

---

## Backend Perspective

### 1. Database Schema

#### Core Tables

##### `live_sessions`
Main session metadata table.

```sql
Columns:
- id (uuid, PK)
- organization_id (uuid, FK → organizations)
- created_by (uuid, FK → profiles)
- updated_by (uuid, FK → profiles)

-- Session Metadata
- name (text)
- description (text)
- image_url (text) -- Cloudinary public_id
- blur_hash (text)
- session_code (text, unique) -- e.g., "ABC123"

-- Visibility & Access
- visibility (enum: public, unlisted, private)
- session_key (text) -- Required for private sessions

-- Optional Course Integration
- course_id (uuid, FK → courses)
- published_course_id (uuid, FK → published_courses)

-- Session Lifecycle
- status (enum: draft, waiting, active, paused, ended)
- play_state (enum: lobby, intro, question_active, question_locked,
              question_results, leaderboard, intermission, paused,
              prizes, final_results, ended)
- play_mode (enum: manual, autoplay)
- mode (enum: test, live) -- NEW: Test vs Live mode

-- Session Settings
- max_participants (integer, nullable)
- allow_late_join (boolean, default: true)
- show_leaderboard (boolean, default: true)
- enable_chat (boolean, default: false)
- enable_reactions (boolean, default: true)

-- Timing
- scheduled_start_time (timestamptz)
- actual_start_time (timestamptz)
- ended_at (timestamptz)

-- Timestamps
- created_at (timestamptz)
- updated_at (timestamptz)

Indexes:
- organization_id, created_by, status, session_code,
  course_id, visibility, image_url, mode
```

##### `live_session_blocks`
Question blocks for sessions.

```sql
Columns:
- id (uuid, PK)
- live_session_id (uuid, FK → live_sessions)
- organization_id (uuid, FK → organizations)
- created_by (uuid, FK → profiles)
- updated_by (uuid, FK → profiles)

-- Block Content
- plugin_type (text) -- Reuses existing plugin types
- content (jsonb) -- Question data
- settings (jsonb) -- Plugin settings

-- Configuration
- position (integer) -- Display order
- time_limit (integer, default: 10) -- seconds
- difficulty (enum: easy, medium, hard)

-- Block State
- status (enum: pending, active, completed)
- activated_at (timestamptz)
- closed_at (timestamptz)

-- Statistics (computed)
- total_responses (integer, default: 0)
- correct_responses (integer, default: 0)
- average_response_time_ms (integer)

-- Timestamps
- created_at (timestamptz)
- updated_at (timestamptz)

Indexes:
- live_session_id, organization_id, status, position
```

##### `live_session_participants`
Tracks who's in each session.

```sql
Columns:
- id (uuid, PK)
- live_session_id (uuid, FK → live_sessions)
- user_id (uuid, FK → profiles)
- organization_id (uuid, FK → organizations)

-- Participation
- status (enum: joined, left)
- display_name (text, nullable)

-- Timing
- joined_at (timestamptz)
- left_at (timestamptz)

-- Statistics (computed)
- total_responses (integer, default: 0)
- correct_responses (integer, default: 0)
- total_score (numeric, default: 0)
- average_response_time_ms (integer)
- rank (integer) -- Current leaderboard position

-- Timestamps
- created_at (timestamptz)
- updated_at (timestamptz)

Unique Constraint:
- (live_session_id, user_id)

Indexes:
- live_session_id, user_id, status, rank
```

##### `live_session_responses`
Individual responses to questions (LIVE mode only).

```sql
Columns:
- id (uuid, PK)
- live_session_id (uuid, FK → live_sessions)
- live_session_block_id (uuid, FK → live_session_blocks)
- participant_id (uuid, FK → live_session_participants)
- user_id (uuid, FK → profiles)
- organization_id (uuid, FK → organizations)

-- Response Data
- response_data (jsonb) -- Format depends on plugin_type
- status (enum: correct, incorrect, partial, skipped)

-- Timing
- response_time_ms (integer) -- From block activation
- submitted_at (timestamptz)

-- Scoring
- score_earned (numeric, default: 0)
- max_score (numeric) -- Max possible for this question

-- Timestamps
- created_at (timestamptz)

Unique Constraint:
- (live_session_block_id, participant_id)

Indexes:
- live_session_id, live_session_block_id, participant_id,
  user_id, status
```

##### `live_session_test_responses`
Test responses from facilitators (TEST mode only).

```sql
Columns:
- id (uuid, PK)
- live_session_id (uuid, FK → live_sessions)
- live_session_block_id (uuid, FK → live_session_blocks)
- facilitator_id (uuid, FK → profiles) -- Not participant_id
- organization_id (uuid, FK → organizations)

-- Response Data (same as live_session_responses)
- response_data (jsonb)
- status (enum: correct, incorrect, partial, skipped)

-- Timing
- response_time_ms (integer)
- submitted_at (timestamptz)

-- Scoring
- score_earned (numeric, default: 0)
- max_score (numeric)

-- Test Metadata
- test_notes (text, nullable) -- Optional facilitator notes

-- Timestamps
- created_at (timestamptz)

Indexes:
- live_session_id, live_session_block_id, facilitator_id, status
```

##### `live_session_facilitators`
Assigned facilitators for sessions.

```sql
Columns:
- id (uuid, PK)
- live_session_id (uuid, FK → live_sessions)
- user_id (uuid, FK → profiles)
- organization_id (uuid, FK → organizations)

-- Role
- role (enum: host, co_host)

-- Timestamps
- created_at (timestamptz)
- updated_at (timestamptz)

Unique Constraint:
- (live_session_id, user_id)

Indexes:
- live_session_id, user_id
```

##### `live_session_messages`
Chat messages during sessions.

```sql
Columns:
- id (uuid, PK)
- live_session_id (uuid, FK → live_sessions)
- user_id (uuid, FK → profiles)
- organization_id (uuid, FK → organizations)

-- Message
- message (text)
- is_facilitator (boolean)

-- Timestamps
- created_at (timestamptz)

Indexes:
- live_session_id, user_id, created_at
```

##### `live_session_reactions`
Emoji reactions during sessions.

```sql
Columns:
- id (uuid, PK)
- live_session_id (uuid, FK → live_sessions)
- user_id (uuid, FK → profiles)

-- Reaction
- emoji (text) -- e.g., '👍', '❤️', '🔥'

-- Timestamps
- created_at (timestamptz)

Indexes:
- live_session_id, created_at
```

##### `live_session_analytics`
Aggregated session statistics.

```sql
Columns:
- id (uuid, PK)
- live_session_id (uuid, FK → live_sessions, unique)
- organization_id (uuid, FK → organizations)

-- Participant Stats
- total_participants (integer, default: 0)
- peak_concurrent_participants (integer, default: 0)

-- Response Stats
- total_responses (integer, default: 0)
- correct_responses (integer, default: 0)
- average_response_time_ms (integer)

-- Engagement Stats
- total_messages (integer, default: 0)
- total_reactions (integer, default: 0)

-- Timestamps
- created_at (timestamptz)
- updated_at (timestamptz)

Indexes:
- live_session_id, organization_id
```

### 2. Database Functions & Triggers

#### Mode Change Trigger

**Function**: `reset_live_session_on_mode_change()`
**Trigger**: `live_session_mode_change_reset`
**Fires**: BEFORE UPDATE of `mode` column on `live_sessions`

**Purpose**: Automatically reset session state when switching between test and live modes.

**Actions performed**:
1. Reset session lifecycle:
   - Set `status` to `'draft'`
   - Set `play_state` to `'lobby'`
   - Clear `actual_start_time` and `ended_at`

2. Delete all test responses:
   - `DELETE FROM live_session_test_responses`

3. Delete all live responses:
   - `DELETE FROM live_session_responses`

4. Remove all participants:
   - `DELETE FROM live_session_participants`
   - (Cascades to participant responses via FK)

5. Clear interactions:
   - `DELETE FROM live_session_messages`
   - `DELETE FROM live_session_reactions`

6. Reset block statistics:
   ```sql
   UPDATE live_session_blocks SET
     status = 'pending',
     activated_at = NULL,
     closed_at = NULL,
     total_responses = 0,
     correct_responses = 0,
     average_response_time_ms = NULL
   ```

7. Clear analytics:
   - `DELETE FROM live_session_analytics`

**Migration**: `20260208034753_add_live_session_mode.sql`

#### Statistics Update Triggers

**Function**: `update_live_session_block_stats()`
**Triggers**:
- `live_session_response_insert_update_block_stats` (AFTER INSERT)
- `live_session_response_update_update_block_stats` (AFTER UPDATE)
- `live_session_response_delete_update_block_stats` (AFTER DELETE)

**Purpose**: Automatically recalculate block statistics when responses change.

**Calculations**:
```sql
SELECT
  count(*) as total_responses,
  count(*) FILTER (WHERE status = 'correct') as correct_responses,
  avg(response_time_ms)::integer as average_response_time_ms
FROM live_session_responses
WHERE live_session_block_id = [block_id]
```

---

**Function**: `update_live_session_participant_stats()`
**Triggers**:
- `live_session_response_insert_update_participant_stats` (AFTER INSERT)
- `live_session_response_update_update_participant_stats` (AFTER UPDATE)
- `live_session_response_delete_update_participant_stats` (AFTER DELETE)

**Purpose**: Automatically recalculate participant statistics when responses change.

**Calculations**:
```sql
SELECT
  count(*) as total_responses,
  count(*) FILTER (WHERE status = 'correct') as correct_responses,
  coalesce(sum(score_earned), 0) as total_score,
  avg(response_time_ms)::integer as average_response_time_ms
FROM live_session_responses
WHERE participant_id = [participant_id]
```

---

**Function**: `update_participant_rankings()`
**Trigger**: `live_session_participant_update_rankings` (AFTER UPDATE of `total_score` or `average_response_time_ms`)

**Purpose**: Recalculate leaderboard rankings when scores change.

**Ranking logic**:
```sql
ROW_NUMBER() OVER (
  ORDER BY
    total_score DESC,
    average_response_time_ms ASC NULLS LAST,
    joined_at ASC
)
```

Ranking criteria (in order):
1. Higher total score is better
2. Faster average response time is better (tie-breaker)
3. Earlier join time is better (tie-breaker)

#### Validation Functions

**Function**: `can_start_live_session(arg_session_id uuid)`
**Returns**: `jsonb`
**Security**: `SECURITY DEFINER`

**Purpose**: Validates if a session can be started.

**Requirements**:
1. Session must have a thumbnail (`image_url` not null)
2. Session must have at least one block
3. Session must not be ended

**Returns**:
```json
{
  "can_start": true/false,
  "errors": ["error message 1", "error message 2", ...]
}
```

---

**Function**: `can_user_edit_live_session(arg_session_id uuid)`
**Returns**: `boolean`
**Security**: `SECURITY DEFINER`

**Purpose**: Checks if current user can edit a session.

**Permission granted to**:
1. Organization owners and admins
2. Assigned facilitators (via `live_session_facilitators` table)

**Restrictions**:
- Returns `false` if session status is `'ended'`
- Returns `false` if organization tier is `'temp'`

---

**Function**: `join_live_session(p_session_code text, p_session_key text, p_display_name text)`
**Returns**: `jsonb`
**Security**: `SECURITY INVOKER`

**Purpose**: Validates and joins a user to a live session.

**Validation checks**:
1. User is authenticated
2. Session exists
3. Session status is not `'draft'` or `'ended'`
4. If session is `'active'`, late join must be enabled
5. For private sessions, correct `session_key` required
6. User must be member of session's organization
7. Session not full (if `max_participants` set)

**Actions**:
- Inserts or updates participant record
- Sets status to `'joined'`
- Records join timestamp

**Returns**:
```json
{
  "success": true/false,
  "session_id": "uuid",
  "participant_id": "uuid",
  "error": "error message" // only if success = false
}
```

#### Utility Functions

**Function**: `generate_session_code()`
**Returns**: `text`

**Purpose**: Generates unique 6-character session codes (e.g., "ABC123").

**Trigger**: `live_sessions_generate_code_trigger` (BEFORE INSERT on `live_sessions`)

---

### 3. TypeScript Database Layer

**Location**: `shared/database/src/liveSessions/`

Key functions:
- `createLiveSession()` - Create new session
- `fetchLiveSessionById()` - Get session by ID
- `fetchLiveSessionByCode()` - Get session by code
- `fetchLiveSessionBlocks()` - Get all blocks for session
- `fetchLiveSessionBlockById()` - Get single block
- `upsertLiveSessionBlock()` - Create or update block
- `deleteLiveSessionBlock()` - Delete block
- `reorderLiveSessionBlocks()` - Update block positions
- `validateSessionReadyToStart()` - Client-side validation

All functions use `TypedSupabaseClient` for type safety and follow the pattern:
```typescript
export async function fetchLiveSessionById({
  supabase,
  sessionId
}: {
  supabase: TypedSupabaseClient;
  sessionId: string;
}) {
  const { data, error } = await supabase
    .from('live_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error) throw error;
  return data;
}
```

---

## Mode System (Test vs Live)

### Overview

The mode system provides complete data isolation between testing and production usage of live sessions.

```
┌──────────────────────────────────────────────────────┐
│                    Live Session                      │
│                                                      │
│  ┌────────────────┐        ┌──────────────────┐    │
│  │   TEST MODE    │  ◄──►  │    LIVE MODE     │    │
│  │                │        │                  │    │
│  │ - Facilitators │        │ - Real participants│   │
│  │ - No DB writes │        │ - Persistent data │    │
│  │ - Ephemeral    │        │ - Analytics saved │    │
│  │ - Multi-test OK│        │ - Leaderboards    │    │
│  └────────────────┘        └──────────────────┘    │
│                                                      │
│  Switching modes triggers automatic state reset     │
└──────────────────────────────────────────────────────┘
```

### Test Mode

**Purpose**: Allow facilitators to preview and test sessions before going live.

**Characteristics**:
1. **Separate Response Table**: Uses `live_session_test_responses` instead of `live_session_responses`
2. **No Participant Records**: Test responses linked directly to facilitator, not participants
3. **Manual Controls**: Facilitator manually navigates through play states
4. **Ephemeral Realtime**: Separate Realtime channel that doesn't interfere with live data
5. **Clear Indicators**: UI shows "Test Mode" badge and warnings

**Use Cases**:
- Preview questions before session starts
- Verify timing and flow
- Test manual vs autoplay mode
- Practice facilitator controls
- QA session content

**Access**:
- Route: `/l/{sessionCode}/test`
- Accessible to: Facilitators and organization admins
- Works on sessions in any status (even draft)

**Limitations**:
- No persistent leaderboards
- No analytics tracking
- Chat and reactions disabled
- No participant limit enforcement

### Live Mode

**Purpose**: Run actual session with real participants and persistent data.

**Characteristics**:
1. **Persistent Data**: Uses `live_session_responses` table
2. **Participant Tracking**: Full participant records in `live_session_participants`
3. **Real-time Sync**: All clients synced via Supabase Realtime
4. **Analytics**: All interactions tracked in `live_session_analytics`
5. **Leaderboards**: Real-time ranking calculations and displays

**Use Cases**:
- Actual quiz sessions with students/participants
- Competitive gameplay with leaderboards
- Engagement tracking and analytics
- Data collection for assessment

**Access**:
- Route: `/l/{sessionCode}` or `/live/{sessionCode}/join`
- Accessible to: Invited participants, organization members
- Requires session to be in `'waiting'` or `'active'` status

**Features**:
- Participant capacity limits
- Late join restrictions
- Chat and reactions (if enabled)
- Persistent leaderboards and rankings
- Full analytics tracking

### Mode Switching

**Trigger**: When `mode` column is updated on `live_sessions` table

**Automatic Actions** (via `reset_live_session_on_mode_change` trigger):

```sql
-- Example: Switching from test to live
UPDATE live_sessions
SET mode = 'live'
WHERE id = '{session_id}';

-- Trigger automatically:
-- 1. Resets status to 'draft'
-- 2. Resets play_state to 'lobby'
-- 3. Clears timestamps
-- 4. Deletes ALL responses (test AND live)
-- 5. Removes all participants
-- 6. Clears messages and reactions
-- 7. Resets block statistics
-- 8. Deletes analytics
```

**Why this design?**
- **Data Integrity**: Prevents test data from contaminating live results
- **Clean Slate**: Each mode starts fresh with no residual state
- **Security**: Test responses from facilitators don't mix with participant data
- **Analytics Accuracy**: Live analytics only reflect real participant engagement

**Best Practices**:
1. Always test in Test Mode before switching to Live Mode
2. Expect all data to be cleared when switching modes
3. Switch to Live Mode only when ready to start actual session
4. Cannot switch back to Test Mode after going live without losing data

---

## Session Lifecycle

### State Machine

```
                        ┌──────────┐
                        │  DRAFT   │ ◄── Initial state
                        └────┬─────┘
                             │
                             │ Start Session
                             ▼
                        ┌──────────┐
                        │ WAITING  │ ◄── Participants can join
                        └────┬─────┘
                             │
                             │ Begin Gameplay
                             ▼
                        ┌──────────┐
                   ┌──► │  ACTIVE  │ ◄── Session in progress
                   │    └────┬─────┘
                   │         │
        Pause ─────┘         │ End Session
                             ▼
                        ┌──────────┐
                        │  PAUSED  │
                        └────┬─────┘
                             │
                             │ Resume
                             │
                        ┌────▼─────┐
                        │  ENDED   │ ◄── Terminal state
                        └──────────┘
```

### Status Enum Values

```typescript
type LiveSessionStatus =
  | 'draft'    // Created, editable, not joinable
  | 'waiting'  // Open for joining, not started
  | 'active'   // In progress, gameplay happening
  | 'paused'   // Temporarily halted
  | 'ended';   // Completed, read-only
```

**Key Points**:
- `draft`: Session is being built, no participants can join
- `waiting`: Participants can join, lobby screen shown
- `active`: Questions are being played, responses accepted
- `paused`: Temporary stop, can be resumed
- `ended`: Cannot be restarted, data is read-only

### Play State Progression

Within `'active'` status, the session progresses through play states:

```
┌─────────────────────────────────────────────────────┐
│                   ACTIVE SESSION                     │
├─────────────────────────────────────────────────────┤
│                                                      │
│  lobby → intro → [QUESTION LOOP] → final_results    │
│                                                      │
│  QUESTION LOOP:                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │  question_active                              │  │
│  │       ↓                                       │  │
│  │  question_locked (timer expired)              │  │
│  │       ↓                                       │  │
│  │  question_results (show answer)               │  │
│  │       ↓                                       │  │
│  │  leaderboard (show rankings)                  │  │
│  │       ↓                                       │  │
│  │  intermission (break)                         │  │
│  │       ↓                                       │  │
│  │  [Next Question] or [Final Results]           │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Play State Enum Values

```typescript
type LiveSessionPlayState =
  | 'lobby'             // Waiting room
  | 'intro'             // Welcome screen
  | 'question_active'   // Question displayed, accepting answers
  | 'question_locked'   // Timer ended, no more answers
  | 'question_results'  // Show correct answer & explanation
  | 'leaderboard'       // Show rankings
  | 'intermission'      // Break between questions
  | 'paused'            // Session paused
  | 'prizes'            // Prize breakdown (optional)
  | 'final_results'     // Final standings
  | 'ended';            // Goodbye screen
```

**UI Rendering**: Frontend components should render based on `play_state`, not `status`.

### Play Mode

Determines how the session advances through play states:

```typescript
type LiveSessionPlayMode =
  | 'manual'    // Host clicks to advance
  | 'autoplay'; // Automatic advancement based on timers
```

**Manual Mode**:
- Facilitator has full control
- Explicit button clicks to advance
- Can pause at any play state
- Good for classroom environments
- Allows for discussion between questions

**Autoplay Mode**:
- System automatically advances
- Based on configured timers
- Minimal facilitator intervention
- Good for large-scale events
- Maintains consistent pacing

### Typical Session Flow

1. **Preparation Phase** (Status: `draft`)
   - Create session
   - Add blocks (questions)
   - Configure settings
   - Upload thumbnail
   - Test in Test Mode

2. **Pre-Session Phase** (Status: `waiting`, Play State: `lobby`)
   - Share session code with participants
   - Participants join and see waiting room
   - Facilitator sees participant count
   - When ready, facilitator clicks "Start"

3. **Intro Phase** (Status: `active`, Play State: `intro`)
   - Welcome screen
   - Session rules
   - Prize information (optional)
   - Duration: Manual advance or ~10 seconds

4. **Question Phase** (Status: `active`, repeats for each block)

   a. **Question Active** (Play State: `question_active`)
   - Question displayed to all participants
   - Timer starts (based on block's `time_limit`)
   - Participants submit answers
   - Responses recorded in real-time

   b. **Question Locked** (Play State: `question_locked`)
   - Timer expired or all answered
   - Suspense moment (~3 seconds)
   - "Calculating results..." message

   c. **Question Results** (Play State: `question_results`)
   - Correct answer highlighted
   - Explanation shown (if provided)
   - Individual feedback (correct/incorrect)
   - Points earned displayed
   - Duration: Manual advance or ~10 seconds

   d. **Leaderboard** (Play State: `leaderboard`)
   - Current rankings shown
   - Score changes animated
   - Top performers highlighted
   - Duration: Manual advance or ~8 seconds

   e. **Intermission** (Play State: `intermission`)
   - Break before next question
   - Countdown timer
   - Optional: Ads, announcements
   - Duration: Manual advance or ~5 seconds

5. **Completion Phase** (Status: `active`, Play State: `final_results`)
   - Final leaderboard
   - Winner announcement
   - Session summary statistics
   - Thank you message
   - Duration: Manual advance or ~20 seconds

6. **Post-Session Phase** (Status: `ended`)
   - Session marked as ended
   - Data becomes read-only
   - Analytics available for review
   - Participants can view results
   - Cannot restart session

---

## Real-time Features

### Supabase Realtime Integration

Live sessions heavily utilize Supabase Realtime for synchronization across all connected clients.

#### Realtime Channels

Each session has dedicated Realtime channels:

1. **Session State Channel**: `live-session:{sessionId}`
   - Broadcasts play state changes
   - Syncs session status updates
   - Notifies of participant joins/leaves

2. **Leaderboard Channel**: `live-session-leaderboard:{sessionId}`
   - Real-time ranking updates
   - Score change notifications
   - Top performer highlights

3. **Responses Channel**: `live-session-responses:{sessionId}`
   - Response submission events
   - Block statistics updates
   - Answer submission counts

4. **Chat Channel**: `live-session-chat:{sessionId}` (if enabled)
   - Message broadcasting
   - Typing indicators
   - Moderation events

5. **Reactions Channel**: `live-session-reactions:{sessionId}` (if enabled)
   - Emoji reactions
   - Engagement notifications

#### Broadcast Events

**Example: Play State Change**
```typescript
// Facilitator advances to next state
supabase.channel(`live-session:${sessionId}`)
  .send({
    type: 'broadcast',
    event: 'play_state_change',
    payload: {
      play_state: 'question_active',
      block_id: 'uuid-of-current-block',
      timestamp: new Date().toISOString()
    }
  });

// All participants receive and update UI
supabase.channel(`live-session:${sessionId}`)
  .on('broadcast', { event: 'play_state_change' }, (payload) => {
    // Update local state
    setCurrentPlayState(payload.play_state);
    setCurrentBlock(payload.block_id);
    startTimer();
  })
  .subscribe();
```

**Example: Response Submission**
```typescript
// Participant submits answer
supabase.channel(`live-session-responses:${sessionId}`)
  .send({
    type: 'broadcast',
    event: 'response_submitted',
    payload: {
      participant_id: 'uuid',
      block_id: 'uuid',
      response_time_ms: 2340
    }
  });

// Facilitator sees live response count
supabase.channel(`live-session-responses:${sessionId}`)
  .on('broadcast', { event: 'response_submitted' }, (payload) => {
    setResponseCount(prev => prev + 1);
  })
  .subscribe();
```

**Example: Leaderboard Update**
```typescript
// System calculates new rankings (triggered by response)
supabase.channel(`live-session-leaderboard:${sessionId}`)
  .send({
    type: 'broadcast',
    event: 'leaderboard_updated',
    payload: {
      top_10: [
        { rank: 1, display_name: 'Alice', score: 850 },
        { rank: 2, display_name: 'Bob', score: 720 },
        // ...
      ]
    }
  });

// All participants see updated leaderboard
supabase.channel(`live-session-leaderboard:${sessionId}`)
  .on('broadcast', { event: 'leaderboard_updated' }, (payload) => {
    setLeaderboard(payload.top_10);
    animateRankChanges();
  })
  .subscribe();
```

#### Database Changes Subscription

In addition to broadcasts, the system subscribes to database changes:

```typescript
// Subscribe to participant joins
supabase
  .channel(`db-participants:${sessionId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'live_session_participants',
      filter: `live_session_id=eq.${sessionId}`
    },
    (payload) => {
      // New participant joined
      addParticipantToList(payload.new);
    }
  )
  .subscribe();
```

#### Test Mode vs Live Mode Channels

**Test Mode**:
- Uses ephemeral channels with `test-` prefix
- Example: `test-live-session:{sessionId}`
- Not persisted, no interference with live data
- Isolated from live mode channels

**Live Mode**:
- Uses production channels
- Persistent event history (configurable)
- All participants and facilitators connected
- Real-time synchronization critical

---

## Data Flow

### 1. Response Submission Flow

```
┌──────────────────────────────────────────────────────────┐
│                  Response Submission Flow                 │
└──────────────────────────────────────────────────────────┘

1. Participant clicks answer
   │
   ├─► [Frontend] Validate selection
   │
   ├─► [Frontend] Calculate response_time_ms
   │
   ├─► [Frontend] Submit via form or RPC
   │
   └─► [Backend] Insert into live_session_responses
       │
       ├─► [Trigger] update_live_session_block_stats()
       │   └─► Recalculate block statistics
       │
       ├─► [Trigger] update_live_session_participant_stats()
       │   └─► Recalculate participant statistics
       │
       └─► [Trigger] update_participant_rankings()
           └─► Recalculate leaderboard rankings

2. [Realtime] Broadcast response_submitted event
   │
   └─► All connected clients receive update
       │
       ├─► Facilitator: Update response count
       │
       └─► Participants: See "Waiting for others..."

3. [Realtime] Broadcast leaderboard_updated event
   │
   └─► All participants see updated rankings
       │
       └─► Animated rank changes in UI
```

### 2. Session Start Flow

```
┌──────────────────────────────────────────────────────────┐
│                    Session Start Flow                     │
└──────────────────────────────────────────────────────────┘

1. Facilitator clicks "Start Session"
   │
   ├─► [Frontend] Call can_start_live_session() RPC
   │
   ├─► [Backend] Validate requirements
   │   ├─ Has thumbnail?
   │   ├─ Has blocks?
   │   └─ Not ended?
   │
   ├─► [Backend] Update live_sessions
   │   ├─ status: 'draft' → 'waiting'
   │   ├─ play_state: 'lobby'
   │   └─ actual_start_time: NOW()
   │
   └─► [Realtime] Broadcast session_started event
       │
       └─► All connected clients update state
           │
           ├─► Participants: Move to lobby screen
           │
           └─► Facilitator: Show control panel

2. Facilitator clicks "Begin Gameplay"
   │
   ├─► [Backend] Update live_sessions
   │   ├─ status: 'waiting' → 'active'
   │   ├─ play_state: 'lobby' → 'intro'
   │   └─ First block: status → 'active', activated_at → NOW()
   │
   └─► [Realtime] Broadcast play_state_change event
       │
       └─► All participants see intro screen
           │
           └─► Auto/manual advance to first question
```

### 3. Leaderboard Calculation Flow

```
┌──────────────────────────────────────────────────────────┐
│                Leaderboard Calculation Flow               │
└──────────────────────────────────────────────────────────┘

1. Response submitted
   │
   └─► [Trigger] update_live_session_participant_stats()
       │
       └─► Calculate totals for participant:
           ├─ total_responses (count)
           ├─ correct_responses (count where status='correct')
           ├─ total_score (sum of score_earned)
           └─ average_response_time_ms (avg)

2. Stats updated
   │
   └─► [Trigger] update_participant_rankings()
       │
       └─► Recalculate rankings for all participants:
           │
           ├─► ORDER BY:
           │   1. total_score DESC (higher is better)
           │   2. average_response_time_ms ASC (faster is better)
           │   3. joined_at ASC (earlier is better)
           │
           └─► UPDATE rank column for each participant

3. Rankings updated
   │
   └─► [Realtime] Broadcast leaderboard_updated event
       │
       └─► All clients receive updated leaderboard
           │
           └─► Animate rank changes with transitions
```

---

## Security & Permissions

### Row Level Security (RLS)

All tables have RLS enabled. Key policies:

#### `live_sessions`

**SELECT**: Organization members can view
```sql
using (
  public.get_user_org_role(organization_id, auth.uid()) IS NOT NULL
)
```

**INSERT**: Owners, admins, editors can create (except 'temp' tier)
```sql
with check (
  public.get_user_org_role(organization_id, auth.uid()) IN ('owner', 'admin', 'editor')
  AND public.get_org_tier(organization_id) != 'temp'
)
```

**UPDATE**: Admins or assigned facilitators
```sql
using (
  public.can_user_edit_live_session(id)
)
```

**DELETE**: Only owners and admins (except 'temp' tier)
```sql
using (
  public.get_user_org_role(organization_id, auth.uid()) IN ('owner', 'admin')
  AND public.get_org_tier(organization_id) != 'temp'
)
```

#### `live_session_blocks`

**SELECT**: Organization members
```sql
using (
  public.get_user_org_role(organization_id, auth.uid()) IS NOT NULL
)
```

**INSERT/UPDATE**: Admins or facilitators who can edit session
```sql
with check (
  public.can_user_edit_live_session(live_session_id)
)
```

**DELETE**: Same as INSERT/UPDATE

#### `live_session_participants`

**SELECT**:
- Organization members can view all participants
- Users can view their own participation

**INSERT**:
- Via `join_live_session()` RPC (validated)
- Or admins can manually add

**UPDATE**:
- System updates (statistics)
- Admins can modify

**DELETE**:
- Via `leave_live_session()` RPC
- Or admins can remove

#### `live_session_responses`

**SELECT**:
- Participants can view their own responses
- Facilitators can view all responses
- Organization admins can view all

**INSERT**:
- Participants can submit responses during active blocks
- Must be authenticated participant of session
- Validates: block is active, no duplicate response

**UPDATE/DELETE**:
- Generally not allowed (immutable record)
- Admins only for corrections

#### `live_session_test_responses`

**SELECT/INSERT**:
- Facilitators only
- Used in test mode

**DELETE**:
- Automatically deleted on mode change

### Facilitator Permissions

Facilitators are defined in `live_session_facilitators` table:

**Roles**:
- `host`: Primary facilitator, full control
- `co_host`: Assistant facilitator, can help manage

**Permissions granted**:
- Edit session metadata
- Manage blocks (add, edit, delete, reorder)
- Control session flow (start, pause, end)
- View all responses and analytics
- Manage participants (kick, etc.)

**Permissions NOT granted**:
- Delete session (owners/admins only)
- Change facilitator assignments (owners/admins only)
- Modify organization settings

**Assignment**:
- Creator automatically assigned as host
- Owners/admins can assign additional facilitators

### Privacy & Visibility

**Public Sessions**:
- Anyone with code can join
- Listed in organization's public sessions
- No key required

**Unlisted Sessions**:
- Anyone with code can join
- NOT listed publicly
- Must know the exact code
- No key required

**Private Sessions**:
- Requires session_key to join
- Not listed publicly
- Invitation-only effectively
- Must be organization member

### Organization Membership

**Requirement**: All participants must be members of the session's organization.

**Validation**: Checked in `join_live_session()` RPC:
```sql
IF NOT EXISTS (
  SELECT 1 FROM organization_members
  WHERE user_id = auth.uid()
    AND organization_id = v_organization_id
) THEN
  RAISE EXCEPTION 'Must be member of organization';
END IF;
```

**Rationale**:
- Ensures participants are vetted
- Protects organization data
- Enables proper access control
- Maintains tier limit enforcement

---

## Technical Implementation Details

### 1. Plugin System Integration

Live session blocks reuse the existing plugin system:

**Supported Plugin Types**:
- `true_or_false`
- `multiple_choice_single_answer`
- `multiple_choice_multiple_answers`
- `fill_in_the_blank`
- `matching_game`
- `swipe_categorize`
- `rich_text` (informational, no responses)

**Block Content Structure**:
```typescript
{
  plugin_type: 'multiple_choice_single_answer',
  content: {
    question: {
      text: 'What is 2 + 2?',
      media: null // Optional: image/video
    },
    options: [
      { id: '1', text: '3', is_correct: false },
      { id: '2', text: '4', is_correct: true },
      { id: '3', text: '5', is_correct: false },
      { id: '4', text: '6', is_correct: false }
    ],
    explanation: 'Basic arithmetic: 2 + 2 = 4'
  },
  settings: {
    randomize_options: true,
    show_explanation: true
  }
}
```

**Rendering**:
- Builder mode: Uses `ViewLiveSessionPluginRenderer`
- Live mode: Same renderer with different interaction mode
- Test mode: Same renderer with ephemeral data

### 2. Session Code Generation

**Function**: `generate_session_code()`
**Format**: 6 uppercase alphanumeric characters (e.g., "ABC123")
**Uniqueness**: Checked with retry logic
**Collision Handling**: Max 10 attempts before error

**Implementation**:
```sql
CREATE OR REPLACE FUNCTION generate_session_code()
RETURNS text AS $$
DECLARE
  code text;
  exists boolean;
  attempts int := 0;
BEGIN
  LOOP
    -- Generate random 6-char code
    code := upper(substr(md5(random()::text), 1, 6));

    -- Check uniqueness
    SELECT EXISTS(
      SELECT 1 FROM live_sessions WHERE session_code = code
    ) INTO exists;

    EXIT WHEN NOT exists;

    attempts := attempts + 1;
    IF attempts > 10 THEN
      RAISE EXCEPTION 'Failed to generate unique code';
    END IF;
  END LOOP;

  RETURN code;
END;
$$ LANGUAGE plpgsql;
```

### 3. Scoring System

**Base Score**: Defined per block in `max_score` column
**Factors**:
1. **Correctness**:
   - Correct: Full points
   - Partial: Proportional points (for multi-select)
   - Incorrect: 0 points

2. **Speed Bonus** (optional):
   - Faster responses earn bonus multiplier
   - Formula: `base_score * (1 + speed_bonus_percent)`
   - Speed bonus decreases linearly over time limit

3. **Streak Bonus** (optional):
   - Consecutive correct answers earn multipliers
   - Resets on incorrect answer

**Example Calculation**:
```typescript
// Base configuration
const maxScore = 1000;
const timeLimit = 10000; // ms
const responseTime = 3000; // ms
const speedBonusEnabled = true;

// Speed bonus: 20% at 0ms, 0% at timeLimit
const speedBonus = speedBonusEnabled
  ? (1 - responseTime / timeLimit) * 0.2
  : 0;

// Final score (if correct)
const score = Math.round(maxScore * (1 + speedBonus));
// Result: 1000 * 1.14 = 1140 points
```

### 4. Timer Synchronization

**Challenge**: Keep all clients' timers in sync despite network latency.

**Solution**: Server-authoritative timing with client prediction.

**Implementation**:
1. Server records `activated_at` timestamp when block becomes active
2. Server broadcasts `activated_at` to all clients
3. Clients calculate elapsed time: `Date.now() - activated_at`
4. Clients run local countdown: `timeLimit - elapsedTime`
5. Server enforces hard deadline: Responses after `activated_at + timeLimit` rejected

**Client Code**:
```typescript
const [timeRemaining, setTimeRemaining] = useState(block.time_limit);

useEffect(() => {
  const activatedAt = new Date(block.activated_at).getTime();
  const timeLimit = block.time_limit * 1000; // Convert to ms

  const interval = setInterval(() => {
    const now = Date.now();
    const elapsed = now - activatedAt;
    const remaining = Math.max(0, timeLimit - elapsed);

    setTimeRemaining(Math.ceil(remaining / 1000));

    if (remaining <= 0) {
      clearInterval(interval);
      handleTimeExpired();
    }
  }, 100); // Update every 100ms

  return () => clearInterval(interval);
}, [block]);
```

**Server Validation**:
```sql
-- In response submission handler
IF (NOW() > activated_at + (time_limit || ' seconds')::INTERVAL) THEN
  RAISE EXCEPTION 'Response submitted after time limit';
END IF;
```

### 5. Optimistic Updates

**Pattern**: Update UI immediately, confirm with server asynchronously.

**Example: Response Submission**
```typescript
const [hasSubmitted, setHasSubmitted] = useState(false);
const [selectedAnswer, setSelectedAnswer] = useState(null);

const submitResponse = async (answerId: string) => {
  // 1. Optimistic update
  setHasSubmitted(true);
  setSelectedAnswer(answerId);

  try {
    // 2. Submit to server
    const response = await supabase
      .from('live_session_responses')
      .insert({
        participant_id,
        live_session_block_id: blockId,
        response_data: { answer_id: answerId },
        response_time_ms: calculateResponseTime()
      });

    if (response.error) throw response.error;

    // 3. Server confirmed, keep optimistic state
  } catch (error) {
    // 4. Server rejected, revert optimistic state
    setHasSubmitted(false);
    setSelectedAnswer(null);
    showError('Failed to submit response');
  }
};
```

### 6. Error Handling & Retry Logic

**Connection Loss**:
- Client detects disconnection
- Queue pending actions locally
- Auto-reconnect with exponential backoff
- Replay queued actions on reconnection

**Response Conflicts**:
- Unique constraint prevents duplicate responses
- Client retries with updated data
- Max 3 retry attempts
- Show user-friendly error after failures

**State Desync**:
- Periodic state reconciliation
- Client polls server state every 30 seconds
- Detect drift and resync
- Notify user of forced refresh if necessary

### 7. Performance Optimizations

**Database Indexes**:
- All foreign keys indexed
- Composite indexes on frequently queried columns
- Example: `(live_session_id, status)` for participant filtering

**Query Optimization**:
- Use `select` to fetch only needed columns
- Batch updates where possible
- Leverage triggers for automatic calculations
- Avoid N+1 queries with proper joins

**Real-time Throttling**:
- Debounce high-frequency events
- Batch leaderboard updates (max 1/second)
- Use broadcast over presence for scalability

**Frontend**:
- Lazy load heavy components
- Virtualize long participant lists
- Cache static assets (images, thumbnails)
- Code splitting by route

### 8. Accessibility

**Keyboard Navigation**:
- All interactive elements keyboard accessible
- Tab order follows logical flow
- Enter key submits responses
- Escape key closes modals

**Screen Readers**:
- Semantic HTML structure
- ARIA labels on all controls
- Live region announcements for state changes
- Alternative text for all images

**Visual**:
- High contrast mode support
- Resizable text (up to 200%)
- Color not sole indicator (patterns/icons)
- Focus indicators visible

**Timing**:
- Option to disable timers (accessibility mode)
- Extended time limits available
- Pause functionality for breaks

---

## Appendices

### A. Database ERD

```
organizations
    │
    ├──1──────*─ live_sessions
    │              │
    │              ├──1──────*─ live_session_blocks
    │              │              │
    │              │              └──1──────*─ live_session_responses
    │              │                             │
    │              │                             └──*──────1─ live_session_participants
    │              │
    │              ├──1──────*─ live_session_participants
    │              │
    │              ├──1──────*─ live_session_facilitators
    │              │
    │              ├──1──────*─ live_session_messages
    │              │
    │              ├──1──────*─ live_session_reactions
    │              │
    │              ├──1──────1─ live_session_analytics
    │              │
    │              └──1──────*─ live_session_test_responses
    │
    └──1──────*─ profiles
                   │
                   ├── created live_sessions
                   ├── participant in live_session_participants
                   ├── facilitator in live_session_facilitators
                   ├── sent live_session_messages
                   └── sent live_session_reactions
```

### B. Environment Variables

**Required**:
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Public anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (server only)

**Optional**:
- `LIVE_SESSION_MAX_PARTICIPANTS_DEFAULT`: Default max participants
- `LIVE_SESSION_TIME_LIMIT_DEFAULT`: Default question time limit
- `LIVE_SESSION_AUTO_END_TIMEOUT`: Auto-end inactive sessions (minutes)

### C. Deployment Checklist

- [ ] Database migrations applied
- [ ] RLS policies verified
- [ ] Realtime enabled on tables
- [ ] Environment variables configured
- [ ] Storage buckets created (for thumbnails)
- [ ] CDN configured for assets
- [ ] Error tracking enabled (Sentry, etc.)
- [ ] Analytics configured
- [ ] Load testing completed
- [ ] Monitoring dashboards set up

### D. Common Troubleshooting

**Issue**: Participants can't join session
- Check session status (must be waiting or active)
- Verify organization membership
- Confirm session not full
- Check session visibility/key requirements

**Issue**: Timer desync
- Verify server clock accuracy
- Check client network latency
- Ensure activated_at timestamp set correctly
- Review client-side timer calculation logic

**Issue**: Responses not saving
- Check RLS policies
- Verify participant record exists
- Confirm block is active
- Check unique constraint (duplicate response?)

**Issue**: Leaderboard not updating
- Verify trigger execution
- Check Realtime subscriptions
- Confirm ranking calculation logic
- Review participant stats accuracy

---

## Conclusion

The Live Sessions feature provides a comprehensive platform for interactive real-time learning experiences. By leveraging Supabase's real-time capabilities, PostgreSQL's powerful triggers and functions, and a well-designed UI, the system delivers a seamless experience for both facilitators and participants.

The dual-mode system (test/live) ensures facilitators can thoroughly test sessions before going live, while the automatic state reset guarantees data integrity when switching modes. The plugin-based architecture allows for flexible question types, and the real-time synchronization keeps all participants engaged and in sync.

For support or questions, refer to the main project documentation or contact the development team.

---

**Document Version**: 1.0
**Last Updated**: 2026-02-08
**Maintained By**: Gonasi Development Team
