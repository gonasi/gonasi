# Live Sessions - Routes & Frontend Implementation Plan

## Overview

Live Sessions routes follow the **same structure as Courses**, with dedicated management pages for instructors/facilit

ators and public-facing pages for participants.

## Route Structure

### 📋 Organization Routes (Instructor/Facilitator View)

All organization routes are under the `organizations-layout.tsx` and require authentication + organization membership.

```
/:organizationId/live-sessions
├── / (index) - List all sessions
├── /new - Create new session
└── /:sessionId
    ├── / (index) - Session dashboard (redirect to overview)
    ├── /overview - Session settings & metadata
    │   ├── /edit-details - Edit name, description, dates
    │   ├── /edit-settings - Edit config (max participants, chat, etc.)
    │   └── /delete - Delete session
    ├── /blocks - Manage question blocks
    │   ├── /new - Add new block (select plugin)
    │   ├── /:blockId/edit - Edit block content
    │   ├── /:blockId/delete - Delete block
    │   └── /:blockId/upsert - API route for saving blocks
    ├── /facilitators - Manage assigned staff
    │   ├── /add - Add facilitator
    │   └── /:facilitatorId/remove - Remove facilitator
    ├── /control - Live control panel (run session in real-time)
    └── /analytics - View results & statistics
```

### 🌐 Public Routes (Participant View)

Public routes are under `main-layout.tsx` and accessible to anyone with the session code (+ key for private sessions).

```
/live/:sessionCode
├── /join - Landing page to join session
└── / (session-play) - Active session (participant view)
```

## Route Responsibilities

### Organization Routes

#### **`/:organizationId/live-sessions`** (Index)
**File**: `routes/organizations/liveSessions/live-sessions-index.tsx`

**Purpose**: List all sessions in the organization

**Features**:
- Card grid displaying sessions (draft, active, ended)
- Filter by status
- Search by name
- Visibility indicators (public/unlisted/private)
- "New Session" button
- Shows facilitators (avatars)
- Quick actions (edit, control, analytics)

**Similar to**: `routes/organizations/builder/builder-index.tsx` (course list)

---

#### **`/:organizationId/live-sessions/new`**
**File**: `routes/organizations/liveSessions/new-session.tsx`

**Purpose**: Create a new live session

**Features**:
- Form: name, description, visibility
- Generate session code automatically
- Set session key (for private sessions)
- Configure defaults (max participants, chat, reactions)
- Auto-assigns creator as facilitator if they're 'editor' role

**Action**: Creates session in DB, redirects to `/:sessionId/overview`

**Similar to**: `routes/organizations/builder/new-course-title.tsx`

---

#### **`/:organizationId/live-sessions/:sessionId`** (Index)
**File**: `routes/organizations/liveSessions/session/session-index.tsx`

**Purpose**: Session dashboard/navigation hub

**Features**:
- Tabs: Overview, Blocks, Facilitators, Control, Analytics
- Status badge (draft, waiting, active, paused, ended)
- Quick stats (participants, blocks, responses)
- Session code display (with copy button)
- Start/Stop session buttons

**Similar to**: `routes/organizations/builder/course/course-index.tsx`

---

#### **`/:organizationId/live-sessions/:sessionId/overview`**
**File**: `routes/organizations/liveSessions/session/overview/overview-index.tsx`

**Purpose**: View & edit session metadata

**Features**:
- Display session details (name, description, code, key)
- Visibility settings
- Configuration (max participants, late join, leaderboard, chat, reactions)
- Time limits
- Course integration (optional link to course/published_course)
- Actions: Edit Details, Edit Settings, Delete

**Child Routes**:
- `/edit-details` - Modal to edit name, description, scheduled time
- `/edit-settings` - Modal to edit config (max participants, chat, etc.)
- `/delete` - Confirmation modal to delete session

**Similar to**: `routes/organizations/builder/course/overview/overview-index.tsx`

---

#### **`/:organizationId/live-sessions/:sessionId/blocks`**
**File**: `routes/organizations/liveSessions/session/blocks/blocks-index.tsx`

**Purpose**: Manage question blocks (drag-drop reordering)

**Features**:
- List all blocks with preview
- Drag-and-drop reordering (like lesson blocks)
- Block status indicators (pending, active, closed, skipped)
- "Add Block" button → Opens plugin selector
- Click block → Edit
- Real-time stats (if session is active): response count, accuracy, avg time

**Child Routes**:
- `/new` - Plugin selector modal (reuse existing plugin UI)
- `/:blockId/edit` - Edit block content modal (reuse plugin editors)
- `/:blockId/delete` - Delete confirmation
- `/:blockId/upsert` - API route to save block

**Similar to**: `routes/organizations/builder/course/content/chapterId/lessonId/lesson-blocks/lesson-blocks-index.tsx`

**Reuses**: All existing quiz plugins (multiple_choice_single, true_or_false, etc.)

---

#### **`/:organizationId/live-sessions/:sessionId/facilitators`**
**File**: `routes/organizations/liveSessions/session/facilitators/facilitators-index.tsx`

**Purpose**: Manage assigned facilitators (staff members)

**Features**:
- List current facilitators (with avatars, usernames)
- "Add Facilitator" button (admins/owners only)
- Remove facilitator button (admins/owners only)
- Shows who added each facilitator + when

**Child Routes**:
- `/add` - Modal to select org member to add
- `/:facilitatorId/remove` - Confirmation modal to remove

**Similar to**: Course editors management

**Permissions**:
- Editors (facilitators) can VIEW but not modify
- Only admins/owners can add/remove

---

#### **`/:organizationId/live-sessions/:sessionId/control`**
**File**: `routes/organizations/liveSessions/session/control/control-panel.tsx`

**Purpose**: Live control panel for running the session

**Features**:
- **Session Controls**:
  - Start session (draft → waiting)
  - Pause/Resume
  - End session
- **Block Management**:
  - List blocks with position
  - "Activate" button (pending → active)
  - "Close" button (active → closed)
  - "Skip" button (pending → skipped)
  - Current active block highlighted
- **Live Stats Dashboard**:
  - Participant count (with join/leave activity feed)
  - Current block response rate (real-time progress bar)
  - Current block accuracy %
  - Average response time
- **Leaderboard** (real-time):
  - Top 10 participants
  - Score, rank, avg speed
  - Auto-updates via Supabase Realtime
- **Optional Features** (if enabled):
  - Chat feed (read-only or moderation)
  - Reactions display (emoji stream)

**Real-Time**: Heavy use of Supabase Realtime subscriptions

**Similar to**: Unique to live sessions (no direct course equivalent)

---

#### **`/:organizationId/live-sessions/:sessionId/analytics`**
**File**: `routes/organizations/liveSessions/session/analytics/analytics-index.tsx`

**Purpose**: View post-session analytics

**Features**:
- **Overview Stats**:
  - Total participants, peak participants
  - Total responses, participation rate
  - Average score, median score, accuracy rate
  - Session duration
- **Participation Chart**:
  - Timeline of joins/leaves
- **Performance Chart**:
  - Score distribution histogram
- **Block Breakdown**:
  - Each block with response count, accuracy, avg time
  - Difficulty indicator (based on accuracy)
- **Participant List**:
  - Sortable table (rank, name, score, responses, avg time)
  - Export to CSV
- **Detailed Responses** (optional):
  - View individual responses per block
  - Filter by participant

**Similar to**: Course learners analytics

---

### Public Routes

#### **`/live/:sessionCode/join`**
**File**: `routes/liveSessions/public/join-session.tsx`

**Purpose**: Landing page to join a live session

**Features**:
- Session info display (name, description, instructor)
- Status check (draft/waiting/active/ended)
- For **private sessions**: Password/key input field
- "Join Session" button
- Handles validation:
  - Session exists
  - Session is joinable (status check)
  - Key matches (for private)
  - Not full (max participants)
  - User is org member
- Optional display name input (for leaderboard)

**Action**: Calls `join_live_session()` RPC, redirects to `/live/:sessionCode`

**Similar to**: Course enrollment pages

---

#### **`/live/:sessionCode`** (Session Play)
**File**: `routes/liveSessions/public/session-play.tsx`

**Purpose**: Active session view for participants

**Features**:
- **Waiting State** (session not started):
  - "Waiting for host" message
  - Countdown to scheduled start (if set)
- **Active State**:
  - Current question display (uses existing plugin viewers)
  - Answer input (uses existing plugin UI)
  - Submit button
  - Timer countdown (if block has time limit)
  - "Your response has been recorded" confirmation
  - Block transition animations
- **Leaderboard** (if enabled):
  - Shows current rank
  - Top 10 with scores
  - Updates in real-time
- **Optional Features**:
  - Chat (if enabled)
  - Reactions (if enabled)
- **End State**:
  - Final leaderboard
  - Your stats summary
  - "Session Ended" message

**Real-Time**: Subscribes to:
- `live_session_blocks` (for new questions)
- `live_session_participants` (for leaderboard updates)
- `live_sessions` (for status changes)

**Similar to**: `routes/publishedCourses/lesson-play/lesson-play-index.tsx`

**Reuses**: All quiz plugin viewers (MultipleChoiceSingleAnswerView, TrueOrFalseView, etc.)

---

## Implementation Checklist

### Phase 1: Database & Backend
- [x] Database schema created
- [x] RLS policies configured
- [x] Helper functions created
- [x] Routes defined in routes.ts
- [ ] Generate TypeScript types from database
- [ ] Create database functions in `shared/database/src/liveSessions/`
- [ ] Create Zod schemas in `shared/gonasi-schemas/src/liveSessions/`

### Phase 2: Organization Routes (Instructor View)
- [ ] `live-sessions-index.tsx` (list)
- [ ] `new-session.tsx` (create)
- [ ] `session-index.tsx` (dashboard)
- [ ] `overview/overview-index.tsx` + child modals
- [ ] `blocks/blocks-index.tsx` + child modals (reuse plugins!)
- [ ] `facilitators/facilitators-index.tsx` + child modals
- [ ] `control/control-panel.tsx` (real-time control)
- [ ] `analytics/analytics-index.tsx` (results)

### Phase 3: Public Routes (Participant View)
- [ ] `public/join-session.tsx` (landing)
- [ ] `public/session-play.tsx` (active session)

### Phase 4: Real-Time Integration
- [ ] Set up Supabase Realtime subscriptions
- [ ] Control panel real-time updates
- [ ] Participant view real-time updates
- [ ] Leaderboard real-time updates
- [ ] Chat/reactions real-time updates

### Phase 5: Testing
- [ ] Test all instructor flows
- [ ] Test all participant flows
- [ ] Test real-time updates
- [ ] Test with multiple simultaneous participants
- [ ] Test permission system (admins, facilitators, participants)
- [ ] Load test (100+ participants)

## File Structure

```
apps/web/app/routes/
├── organizations/
│   └── liveSessions/
│       ├── live-sessions-index.tsx
│       ├── new-session.tsx
│       └── session/
│           ├── session-index.tsx
│           ├── overview/
│           │   ├── overview-index.tsx
│           │   ├── edit-details.tsx
│           │   ├── edit-settings.tsx
│           │   └── delete-session.tsx
│           ├── blocks/
│           │   ├── blocks-index.tsx
│           │   ├── new-block.tsx
│           │   ├── edit-block.tsx
│           │   ├── delete-block.tsx
│           │   └── upsert-block-api.tsx
│           ├── facilitators/
│           │   ├── facilitators-index.tsx
│           │   ├── add-facilitator.tsx
│           │   └── remove-facilitator.tsx
│           ├── control/
│           │   └── control-panel.tsx
│           └── analytics/
│               └── analytics-index.tsx
└── liveSessions/
    └── public/
        ├── join-session.tsx
        └── session-play.tsx
```

## Key Differences from Courses

| Feature | Courses | Live Sessions |
|---------|---------|---------------|
| **Structure** | Hierarchical (chapters → lessons → blocks) | Flat (just blocks) |
| **Publishing** | Draft → Published versions | No publishing (ephemeral) |
| **Access** | Enrollment-based | Code-based (+ optional key) |
| **Timing** | Self-paced | Real-time/synchronous |
| **State** | Progress tracking | Response tracking |
| **Interaction** | Individual, asynchronous | Collective, synchronous |
| **Leaderboard** | No | Yes (real-time) |
| **Control Panel** | No | Yes (instructor controls flow) |

## Shared/Reused Components

### From Course Builder
- ✅ **All quiz plugins** (multiple_choice_single, true_or_false, fill_in_blank, matching, swipe_categorize, etc.)
- ✅ Plugin selector modal
- ✅ Plugin edit modals
- ✅ Drag-and-drop block reordering
- ✅ Organization layout & navigation
- ✅ Permission checks (`can_user_edit_live_session()` mirrors `can_user_edit_course()`)

### From Course Play
- ✅ Plugin viewers (MultipleChoiceSingleAnswerView, etc.)
- ✅ Block rendering logic
- ✅ Answer submission flow
- ✅ Feedback display

### New Components Needed
- ❌ Session code display/copy component
- ❌ Real-time leaderboard component
- ❌ Session status badge component
- ❌ Control panel UI (activate/close blocks)
- ❌ Participant join/leave feed
- ❌ Real-time stats dashboard
- ❌ Join session form (with key input)
- ❌ Chat component (if chat enabled)
- ❌ Reactions component (if reactions enabled)

## Real-Time Architecture

### Control Panel Subscriptions
```typescript
// Subscribe to participant changes
supabase
  .channel('control-participants')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'live_session_participants',
    filter: `live_session_id=eq.${sessionId}`
  }, handleParticipantChange)
  .subscribe();

// Subscribe to response submissions
supabase
  .channel('control-responses')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'live_session_responses',
    filter: `live_session_id=eq.${sessionId}`
  }, handleNewResponse)
  .subscribe();
```

### Participant View Subscriptions
```typescript
// Subscribe to block changes
supabase
  .channel('participant-blocks')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'live_session_blocks',
    filter: `live_session_id=eq.${sessionId}`
  }, handleBlockUpdate)
  .subscribe();

// Subscribe to leaderboard updates
supabase
  .channel('participant-leaderboard')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'live_session_participants',
    filter: `live_session_id=eq.${sessionId}`
  }, handleLeaderboardUpdate)
  .subscribe();
```

## Next Steps

1. **Generate Database Types**:
   ```bash
   cd supabase
   supabase gen types typescript --local > ../shared/database/src/schema/index.ts
   ```

2. **Create Database Functions** (`shared/database/src/liveSessions/`):
   - `createLiveSession.ts`
   - `fetchLiveSession.ts`
   - `updateLiveSession.ts`
   - `deleteLiveSession.ts`
   - `createLiveSessionBlock.ts`
   - `updateLiveSessionBlock.ts`
   - `deleteLiveSessionBlock.ts`
   - `reorderLiveSessionBlocks.ts`
   - `addFacilitator.ts`
   - `removeFacilitator.ts`
   - `fetchSessionLeaderboard.ts`
   - `submitLiveResponse.ts`
   - etc.

3. **Create Zod Schemas** (`shared/gonasi-schemas/src/liveSessions/`):
   - `liveSessionSchema.ts`
   - `liveSessionBlockSchema.ts`
   - `joinSessionSchema.ts`
   - `submitResponseSchema.ts`
   - etc.

4. **Build Pages** (following the checklist above)

5. **Add Navigation Links**:
   - Add "Live Sessions" to organization sidebar
   - Update organization dashboard with live sessions card

6. **Test End-to-End**:
   - Create session → Add blocks → Add facilitators → Run session → View analytics
   - Join as participant → Submit responses → View leaderboard

## Summary

✅ **Routes defined in routes.ts**
✅ **Mirrors course structure for consistency**
✅ **Reuses existing quiz plugins**
✅ **Permission system matches courses**
✅ **Real-time architecture planned**
✅ **Clear separation: instructor vs participant routes**

Ready to build! Start with Phase 1 (database functions + schemas), then Phase 2 (organization routes), then Phase 3 (public routes).
