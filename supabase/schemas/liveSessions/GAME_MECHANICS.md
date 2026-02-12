# Live Session Game Mechanics & Business Rules v2.0

## Overview

This document defines the **complete state machine and business rules** for Live Interactive Sessions. It serves as the source of truth for when operations are allowed and how state transitions work.

**Purpose**: Product managers and developers can reference this to understand game flow, validate mechanics, and ensure the system behaves as expected.

**Version 2.0 Updates**: Based on product feedback, this version includes enhanced control modes, granular pause reasons, chat control, grace periods for fairness, host talking moments, and better late-joiner experience.

---

## Core Concepts

### Control Authority

Live sessions support three **control modes** that define who has authority over progression:

| Control Mode | Automatic Behavior | Host Control | Best For |
|--------------|-------------------|--------------|----------|
| `autoplay` | Timers advance everything automatically | Pause / End only | Fast-paced quizzes, minimal host intervention |
| `host_driven` | Nothing happens automatically | All transitions manual | Storytelling, classroom settings, full control |
| `hybrid` | Timers run but host can override | Can advance, pause, skip anytime | Most flexible, recommended default |

**Key Rules**:
- Control mode can only be changed when session status is `waiting` or `paused`
- In `autoplay` mode, play state advances automatically based on timers
- In `host_driven` mode, all state changes require explicit host action
- In `hybrid` mode, system advances on timers but host can interrupt anytime

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
│ paused  │ ← Session temporarily halted (with reason!)
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
- `active` → `paused`: Freezes all timers, participants can't submit responses. **MUST specify pause_reason**
- `paused` → `active`: Resumes timers, clears pause_reason
- Any status → `ended`: Makes session **completely read-only** (no going back)

#### Pause Reasons

When a session is paused, you **must** specify why:

| Pause Reason | When to Use | UI Behavior | Automatic Actions |
|-------------|-------------|-------------|-------------------|
| `host_hold` | Host intentionally paused to talk or manage | "Host is pausing. We'll resume shortly." | None |
| `technical_issue` | Network, server, or technical problem | "Technical difficulty. Please stand by." | None |
| `moderation` | Handling inappropriate behavior | "Session paused for moderation." | Chat locked to `muted` |
| `system` | Auto-recovery, timeout, or system pause | "System pause. Reconnecting..." | Depends on situation |

---

### 2. Play State (Participant UI) - Enhanced

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
         │ (timer expires in autoplay/hybrid)
         ▼
┌──────────────────────┐
│ question_soft_locked │ 🆕 Grace period (1-3 sec): inputs disabled,
└────────┬─────────────┘     late packets accepted, "Time's up!" animation
         │
         ▼
┌─────────────────┐
│ question_locked │ ← Fully locked. Suspense moment.
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
         ├─→ (or host_segment if host wants to talk)
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

🆕 Special States:

    ┌──────────────┐
    │ host_segment │ ← Host talking to crowd. No submissions, timers paused.
    └──────────────┘    Can transition to most other states.

    ┌───────────────┐
    │ block_skipped │ ← Block was skipped. Shown briefly (2-3 sec) before moving on.
    └───────────────┘    "This question was skipped by the host."

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
- `question_active` → `question_soft_locked`: Automatic in autoplay/hybrid, or manual
- `question_soft_locked`: Grace period where late responses still accepted (fairness!)
- `host_segment`: Host can talk without advancing game. Timers paused. Use for explanations, hype, sponsor moments
- `block_skipped`: Brief state showing transparency. No score impact. Transitions quickly to next state
- Host can manually control transitions (in host_driven or hybrid modes)

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
│ skipped  │ ← Intentionally skipped by host (triggers block_skipped play state)
└──────────┘
```

**Key Rules**:
- `pending` → `active`: When host activates the block, sets `activated_at` timestamp
- `active` → `closed`: When timer expires or host manually closes
- `closed` → `completed`: After results are processed and scores updated
- `pending` → `skipped`: Host decides to skip this block entirely
- `active` → `skipped`: Only if no responses submitted yet (otherwise must close)
- Once `completed` or `skipped`, block status cannot change

---

### 4. Chat Mode (Crowd Control) 🆕

Control granular chat behavior to manage crowd noise:

| Chat Mode | Who Can Send | Who Can React | When to Use |
|-----------|--------------|---------------|-------------|
| `open` | Everyone | Everyone | Results, leaderboard, breaks |
| `reactions_only` | Nobody | Everyone (emojis) | During active questions (focus!) |
| `host_only` | Facilitators only | Everyone can read | Announcements, instructions |
| `muted` | Nobody | Nobody | Critical moments, moderation |

**Automatic Triggers** (recommended):
- `question_active` → `reactions_only` (keep focus on question)
- `question_results` → `open` (let people discuss)
- `paused` (moderation) → `muted` (lock chat during moderation)
- `host_segment` → `host_only` or `muted` (host controls narrative)

**Key Rules**:
- Chat mode can be changed at any time by host
- When `pause_reason = 'moderation'`, chat automatically locks to `muted`
- Chat mode persists across play states unless explicitly changed

---

### 5. Late Join Context 🆕

When participants join late, capture context for better UX:

| Join Context | Meaning | UX Behavior |
|-------------|---------|-------------|
| `lobby` | Joined before session started | Normal onboarding |
| `mid_question` | Joined during active question | Show question but disable submission. Explain: "Joined mid-question, wait for next one!" |
| `results` | Joined during results phase | Jump to results, show explanation |
| `intermission` | Joined during countdown | Show countdown, ready for next question |
| `late` | Joined significantly late | Explain they missed blocks, still welcome to participate |

**Key Rules**:
- Join context is captured once when participant joins
- Used to customize onboarding messages
- Helps explain limitations (e.g., why they can't answer current question)

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
- Control mode (ONLY when status is `waiting` or `paused`)
- Chat mode (anytime)
- Scheduled start time

---

#### ✅ When Can You UPDATE Session Status?

**Allowed Transitions**:

| From Status | To Status   | Conditions                                         | Additional Requirements |
|-------------|-------------|---------------------------------------------------|------------------------|
| `draft`     | `waiting`   | ✅ Has at least 1 block                           | -                      |
| `waiting`   | `active`    | ✅ Always allowed                                 | Sets `actual_start_time` |
| `waiting`   | `paused`    | ✅ Always allowed                                 | **Must specify `pause_reason`** |
| `active`    | `paused`    | ✅ Always allowed                                 | **Must specify `pause_reason`** |
| `active`    | `ended`     | ✅ Always allowed                                 | Sets `ended_at` |
| `paused`    | `active`    | ✅ Always allowed                                 | Clears `pause_reason` |
| `paused`    | `ended`     | ✅ Always allowed                                 | Sets `ended_at` |

**Terminal State**:
- `ended` → **CANNOT** transition to any other status (immutable)

---

#### ✅ When Can You UPDATE Play State?

**Conditions**:
1. ✅ User is **facilitator or admin**
2. ✅ Session status is **NOT** `ended`
3. ✅ Org tier is **NOT** `temp`
4. ✅ Play state transition is **valid** (see state machine)
5. ✅ Control mode **allows** this transition:
   - `autoplay`: Host can only pause/end
   - `host_driven`: Host controls all transitions
   - `hybrid`: Host can override automatic transitions

**Special Validations**:
- `question_active`: Must have valid `current_block_id` that references active/pending block
- `final_results`: All blocks must be completed or skipped
- `question_soft_locked` → `question_locked`: Automatic after grace period (1-3 seconds)
- `block_skipped`: Must have actually skipped a block

---

#### ✅ When Can You UPDATE Control Mode?

**Conditions**:
1. ✅ User is **facilitator or admin**
2. ✅ Session status is `waiting` OR `paused` (NOT during active gameplay)
3. ✅ Session status is **NOT** `ended`

**Why This Restriction?**
Changing control mode mid-game would be confusing and could break expectations. Only allow changes during setup or explicit pause moments.

---

#### ✅ When Can You UPDATE Chat Mode?

**Conditions**:
1. ✅ User is **facilitator or admin**
2. ✅ Session status is **NOT** `ended`
3. ✅ Can change anytime during active session

**Automatic Overrides**:
- When `pause_reason = 'moderation'`, chat mode is **forced** to `muted` regardless of setting

---

### Block Updates

#### ✅ When Can You UPDATE Block Status?

**Conditions**:
1. ✅ User is **facilitator or admin**
2. ✅ Session status is **NOT** `ended`
3. ✅ Org tier is **NOT** `temp`
4. ✅ Status transition is **valid** (see block state machine)

**Allowed Transitions**:

| From Status  | To Status    | Conditions                                    | Side Effects |
|--------------|--------------|----------------------------------------------|--------------|
| `pending`    | `active`     | ✅ Session is `active` or `waiting`          | Sets `activated_at` |
| `pending`    | `skipped`    | ✅ Always allowed                            | Triggers `block_skipped` play state |
| `active`     | `closed`     | ✅ Always allowed                            | Sets `closed_at` |
| `active`     | `skipped`    | ✅ Only if zero responses submitted          | Triggers `block_skipped` play state |
| `closed`     | `completed`  | ✅ Always allowed                            | Finalizes scores |

**Terminal States**:
- `completed` → **CANNOT** change status
- `skipped` → **CANNOT** change status

---

### Participant Operations

#### ✅ When Can Participants JOIN?

**Conditions**:
1. ✅ User is **org member**
2. ✅ Session status is `waiting` OR (`active` AND `allow_late_join = true`)
3. ✅ Session is **NOT** at `max_participants` limit
4. ✅ User provides correct `session_code`
5. ✅ If visibility is `private`, user provides correct `session_key`

**Join Context Captured**:
- If session in `lobby` play state → `join_context = 'lobby'`
- If session in `question_active` → `join_context = 'mid_question'`
- If session in `question_results` → `join_context = 'results'`
- If session in `intermission` → `join_context = 'intermission'`
- If multiple blocks already completed → `join_context = 'late'`

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
3. ✅ Session play state is `question_active` **OR** `question_soft_locked` (grace period!)
4. ✅ Block status is `active`
5. ✅ Participant hasn't already submitted response for this block (unique constraint)

**Grace Period Behavior**:
- During `question_soft_locked`: Late responses still accepted (1-3 seconds)
- UI shows "Time's up!" but backend still processes submissions
- This prevents rage when answers "just miss" by milliseconds
- Especially important for crowded venues with shaky connections

**Blocked If**:
- ❌ Session status is `paused` → Submissions frozen
- ❌ Session status is `ended` → Session over
- ❌ Play state is NOT `question_active` or `question_soft_locked` → Wrong timing
- ❌ Block status is NOT `active` → Question not accepting answers
- ❌ Already submitted → One response per block per participant

---

## Permission Matrix

| Operation                         | Owner | Admin | Facilitator | Org Member | Participant |
|-----------------------------------|-------|-------|-------------|------------|-------------|
| Create Session                    | ✅    | ✅    | ✅          | ❌         | ❌          |
| View Session                      | ✅    | ✅    | ✅          | ✅         | ✅*         |
| Update Session Metadata           | ✅    | ✅    | ✅**        | ❌         | ❌          |
| Update Session Status             | ✅    | ✅    | ✅**        | ❌         | ❌          |
| Update Play State                 | ✅    | ✅    | ✅**        | ❌         | ❌          |
| Update Control Mode               | ✅    | ✅    | ✅**        | ❌         | ❌          |
| Update Chat Mode                  | ✅    | ✅    | ✅**        | ❌         | ❌          |
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
- \*\*\* Only if active participant in the session and chat mode allows it

---

## Ended Session Protection 🔒

Once a session reaches `status = 'ended'`, it becomes **completely read-only**.

### What's Blocked in Ended Sessions:

**Session Management**:
- ❌ Update session metadata (name, description, settings, control mode, chat mode)
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

## Auto-Recovery Rules 🆕

Live sessions can break. Here's how the system handles failures:

### Stalled Session Detection

**Trigger**: Session is `active` but no play state update for X seconds (configurable, default 60s)

**Actions**:
1. System flags session as `stalled` (internal flag)
2. Facilitators see alert: "Session may be stalled. Resume or Pause?"
3. If no action for Y seconds, system auto-pauses with `pause_reason = 'system'`

### Missing Timer Recovery

**Trigger**: Block is `active` but timer is missing or expired beyond max duration

**Actions**:
1. Force close block (`status = 'closed'`)
2. Notify facilitator: "Block auto-closed due to timer issue"
3. Log event for analytics

### Host Disconnect Recovery

**Trigger**: Primary facilitator disconnects during active session

**Actions**:
- If `control_mode = 'autoplay'`: Continue automatically (no host needed)
- If `control_mode = 'host_driven'`: Auto-pause with `pause_reason = 'system'`
- If `control_mode = 'hybrid'`: Downgrade to `autoplay` OR auto-pause (configurable)

These rules prevent sessions from dying silently.

---

## Analytics & Event Logging 🆕

Track host decisions to improve product:

### Logged Events

| Event | When | Why It Matters |
|-------|------|----------------|
| `host_skipped_block` | Block status → `skipped` | Which questions confuse or don't work |
| `manual_advance` | Host overrides autoplay timer | Where hosts feel rushed/bored |
| `manual_pause` | Host pauses during gameplay | Where hosts need to talk/explain |
| `override_autoplay` | Host changes play state in autoplay mode | Identifies control friction |
| `control_mode_changed` | Control mode updated | Host preferences evolve over time |
| `chat_mode_changed` | Chat mode manually updated | Crowd management needs |

### Analytics Questions Answered

- Where do hosts struggle?
- Which questions confuse players?
- Is autoplay too fast or too slow?
- Do hosts prefer manual or hybrid control?

---

## Running a Live Session (Human Reality) 🆕

### Recommended Flow for Hosts

#### Pre-Session (Status: `draft` → `waiting`)

1. **Create session** and add blocks
2. **Test blocks** using test responses (optional)
3. **Set control mode**:
   - New host? → `host_driven` (full control)
   - Experienced? → `hybrid` (best of both)
   - Hands-off quiz? → `autoplay` (minimal intervention)
4. **Transition to `waiting`** when ready for participants to join

#### Lobby Phase (Status: `waiting`, Play State: `lobby`)

5. **Monitor participants joining** (real-time)
6. **Optional: Show intro** (`play_state = 'intro'`)
   - Explain rules, prizes, format
   - Hype the crowd!
7. **Transition to `active`** when ready to start

#### During Gameplay (Status: `active`)

8. **For each question**:
   - Activate block (`block_status = 'active'`)
   - Transition to `play_state = 'question_active'`
   - In `autoplay`/`hybrid`: Timer advances automatically
   - In `host_driven`: Manually advance when ready

9. **Use `host_segment` when needed**:
   - Explain confusing question
   - Build hype before final question
   - Sponsor shoutout
   - Handle crowd confusion

10. **Handle chat noise**:
    - During questions: `chat_mode = 'reactions_only'` (keep focus)
    - During results: `chat_mode = 'open'` (let them discuss)
    - If chaos: `chat_mode = 'muted'` (emergency brake)

11. **Skip blocks gracefully**:
    - If question is broken/confusing, skip it (`block_status = 'skipped'`)
    - System shows `play_state = 'block_skipped'` briefly
    - UI tells participants: "This question was skipped by the host"

#### Pause Scenarios

12. **When to pause**:
    - **Technical issue**: `pause_reason = 'technical_issue'`
      - UI: "Technical difficulty. Please stand by."
    - **Need to talk**: `pause_reason = 'host_hold'` OR use `host_segment` instead
      - `host_segment` is better if you want timers paused but don't want "PAUSED" screens
    - **Moderation needed**: `pause_reason = 'moderation'`
      - Chat auto-locks to `muted`

#### End Session (Status: `ended`)

13. **Show final results** (`play_state = 'final_results'`)
14. **Transition to `ended`** (`status = 'ended'`)
15. Session becomes read-only. Data preserved for analytics.

---

### Best Practices for Large Crowds

- Use `hybrid` control mode (automatic progression with manual override)
- Set `chat_mode = 'reactions_only'` during questions
- Enable `host_segment` for hype moments between questions
- Use `question_soft_locked` grace period (prevents rage from late packets)
- Monitor late joiners (`join_context`) to ensure they understand limitations
- Have backup facilitators assigned in case primary host disconnects

---

### Common Pitfalls

❌ **Don't abuse `paused`**:
- Use `host_segment` for talking to crowd instead
- Use `paused` only for true stops (technical, moderation, emergency)

❌ **Don't skip blocks with responses**:
- If participants already answered, you must close the block (`status = 'closed'`)
- Skipping is only for unused blocks

❌ **Don't change control mode mid-game**:
- Only change in `waiting` or `paused` status
- Changing mid-game confuses expectations

✅ **Do use grace periods**:
- `question_soft_locked` prevents "my answer didn't count" rage
- Especially critical in venues with poor connectivity

✅ **Do explain skipped blocks**:
- System shows `block_skipped` play state automatically
- Participants see "This question was skipped by the host"

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
| `INVALID_PLAY_STATE`   | "Cannot transition play state from X to Y"   | Invalid play state transition             |
| `INVALID_BLOCK_STATE`  | "Block must be pending to edit content"      | Trying to edit active/completed block     |
| `ALREADY_RESPONDED`    | "You have already responded to this block"   | Unique constraint violation               |
| `SESSION_FULL`         | "Session is at maximum capacity"             | Max participants reached                  |
| `LATE_JOIN_DISABLED`   | "Late joining is not allowed"                | Session active but late join disabled     |
| `WRONG_SESSION_KEY`    | "Invalid session key"                        | Incorrect password for private session    |
| `ORG_TIER_TEMP`        | "Organization on temp tier"                  | Temp tier restrictions                    |
| `PAUSE_REASON_REQUIRED`| "Must specify pause_reason when pausing"     | Pausing without reason                    |
| `CONTROL_MODE_LOCKED`  | "Cannot change control mode during active gameplay" | Trying to change control mode while active |
| `SKIP_BLOCK_HAS_RESPONSES` | "Cannot skip block with existing responses" | Trying to skip block after responses submitted |

---

## Testing Checklist for Product Manager

### Session Lifecycle
- [ ] Create session in `draft` status
- [ ] Transition `draft` → `waiting` (should require at least 1 block)
- [ ] Transition `waiting` → `active` (starts session)
- [ ] Transition `active` → `paused` with each pause reason
- [ ] Verify UI messages differ based on pause reason
- [ ] Transition `paused` → `active` (resumes, clears pause_reason)
- [ ] Transition `active` → `ended` (makes read-only)
- [ ] Verify cannot edit ended session (any field)

### Control Modes
- [ ] Test `autoplay` mode: timers advance automatically
- [ ] Test `host_driven` mode: nothing happens automatically
- [ ] Test `hybrid` mode: timers run but host can override
- [ ] Verify control mode can only change in `waiting` or `paused`
- [ ] Try changing control mode during active gameplay (should fail)

### Play State Progression (Enhanced)
- [ ] Start in `lobby` state
- [ ] Transition to `intro` (welcome screen)
- [ ] Activate first block → `question_active`
- [ ] Timer expires → `question_soft_locked` (grace period)
- [ ] After grace → `question_locked`
- [ ] Show results → `question_results`
- [ ] Show leaderboard → `leaderboard`
- [ ] Use `host_segment` to talk to crowd
- [ ] Skip a block → verify `block_skipped` state appears
- [ ] Countdown → `intermission`
- [ ] Next question → `question_active` (repeat)
- [ ] Final results → `final_results`
- [ ] End session → `ended`

### Chat Mode Control
- [ ] Set `chat_mode = 'open'` (everyone can chat)
- [ ] Set `chat_mode = 'reactions_only'` (only emojis)
- [ ] Set `chat_mode = 'host_only'` (facilitators only)
- [ ] Set `chat_mode = 'muted'` (no interaction)
- [ ] Verify auto-lock when `pause_reason = 'moderation'`

### Late Joiner Experience
- [ ] Join during `lobby` → `join_context = 'lobby'`
- [ ] Join during `question_active` → `join_context = 'mid_question'`
- [ ] Verify late joiner sees explanation why they can't answer
- [ ] Join during `results` → `join_context = 'results'`
- [ ] Join during `intermission` → `join_context = 'intermission'`

### Block Lifecycle (Enhanced)
- [ ] Create block in `pending` status
- [ ] Activate block → `active` (sets timestamp)
- [ ] Close block → `closed` (sets timestamp)
- [ ] Complete block → `completed` (scores processed)
- [ ] Try skipping a pending block → `skipped` (success)
- [ ] Try skipping active block with 0 responses → `skipped` (success)
- [ ] Try skipping active block with responses (should fail)
- [ ] Verify `block_skipped` play state appears when skipping
- [ ] Verify cannot edit `active` or `completed` blocks

### Grace Period (Soft Lock)
- [ ] Submit response during `question_active` (should succeed)
- [ ] Submit response during `question_soft_locked` (should still succeed)
- [ ] Submit response during `question_locked` (should fail)
- [ ] Verify grace period lasts 1-3 seconds

### Host Segment
- [ ] Transition to `host_segment` from various states
- [ ] Verify submissions blocked during `host_segment`
- [ ] Verify timers paused during `host_segment`
- [ ] Transition from `host_segment` to next phase

### Permissions
- [ ] Verify facilitator can edit session
- [ ] Verify non-facilitator org member cannot edit
- [ ] Verify owner/admin can always edit (except ended sessions)
- [ ] Verify temp tier blocks all edits

### Ended Session Protection
- [ ] End a session
- [ ] Try updating session metadata (should fail)
- [ ] Try updating play state (should fail)
- [ ] Try updating control mode (should fail)
- [ ] Try updating chat mode (should fail)
- [ ] Try adding blocks (should fail)
- [ ] Try updating block status (should fail)
- [ ] Try submitting participant response (should fail)
- [ ] Verify can still view all data (should succeed)

---

## Implementation Locations

### Database Schema

**Enums**:
- `/Users/dc_dalin/Desktop/gonasi/supabase/schemas/liveSessions/enums/live_session_status.sql`
- `/Users/dc_dalin/Desktop/gonasi/supabase/schemas/liveSessions/enums/live_session_play_state.sql` (updated)
- `/Users/dc_dalin/Desktop/gonasi/supabase/schemas/liveSessions/enums/live_session_block_status.sql`
- `/Users/dc_dalin/Desktop/gonasi/supabase/schemas/liveSessions/enums/live_session_control_mode.sql` 🆕
- `/Users/dc_dalin/Desktop/gonasi/supabase/schemas/liveSessions/enums/live_session_pause_reason.sql` 🆕
- `/Users/dc_dalin/Desktop/gonasi/supabase/schemas/liveSessions/enums/live_session_chat_mode.sql` 🆕
- `/Users/dc_dalin/Desktop/gonasi/supabase/schemas/liveSessions/enums/live_participant_join_context.sql` 🆕

**Schema Updates**:
- `/Users/dc_dalin/Desktop/gonasi/supabase/schemas/liveSessions/live_sessions_add_control_features.sql` 🆕
- `/Users/dc_dalin/Desktop/gonasi/supabase/schemas/liveSessions/live_session_participants_add_join_context.sql` 🆕

**RLS Policies**:
- `/Users/dc_dalin/Desktop/gonasi/supabase/schemas/liveSessions/live_sessions_rls.sql`
- `/Users/dc_dalin/Desktop/gonasi/supabase/schemas/liveSessions/live_session_blocks_rls.sql`

**Functions**:
- `/Users/dc_dalin/Desktop/gonasi/supabase/schemas/liveSessions/utils/can_user_edit_live_session.sql`

### Application Layer

**Validation Functions**:
- `/Users/dc_dalin/Desktop/gonasi/shared/database/src/liveSessions/updateLiveSessionPlayState.ts` (updated)
- `/Users/dc_dalin/Desktop/gonasi/shared/database/src/liveSessions/updateLiveSessionBlockStatus.ts` (updated)
- `/Users/dc_dalin/Desktop/gonasi/shared/database/src/liveSessions/updateLiveSessionStatus.ts` (updated)

---

## Revision History

| Date       | Version | Changes                                      |
|------------|---------|---------------------------------------------|
| 2026-02-10 | 1.0     | Initial documentation of game mechanics     |
| 2026-02-10 | 2.0     | Enhanced based on product feedback: control modes, pause reasons, chat modes, grace periods, host segments, late join context, auto-recovery rules, analytics logging, practical guide |

