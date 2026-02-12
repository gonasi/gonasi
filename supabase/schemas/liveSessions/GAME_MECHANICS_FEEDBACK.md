# Live Session Game Mechanics - Implementation Status

## ✅ Implemented Features

### 1. ✅ Control Mode (IMPLEMENTED)
- `control_mode` enum: `autoplay`, `host_driven`, `hybrid`
- Controls how session progresses: automatic timers vs manual host control
- Can only be changed in specific states to maintain consistency

### 2. ✅ Pause Reason (IMPLEMENTED)
- `pause_reason` enum: `host_hold`, `technical_issue`, `moderation`, `system`
- Provides context for why session was paused
- Enables appropriate UI messaging and chat control

### 3. ✅ Soft Lock Grace Period (IMPLEMENTED)
- `question_soft_locked` state (1-3 seconds grace period)
- Prevents harsh rejection of late packets
- Smooth transition: `question_active` → `question_soft_locked` → `question_locked`

### 4. ✅ Host Segment State (IMPLEMENTED)
- `host_segment` play state for host talking moments
- No submissions allowed, timers paused
- Perfect for explanations, hype moments, sponsor shoutouts

### 5. ✅ Chat Mode Controls (IMPLEMENTED)
- `chat_mode` enum: `open`, `reactions_only`, `host_only`, `muted`
- Automatic triggers based on play state
- Gives hosts crowd control without manual policing

### 6. ✅ Block Skipping (IMPLEMENTED)
- `block_skipped` play state
- Clear UI messaging: "This question was skipped by the host"
- No score penalties, maintains trust

### 7. ✅ Late Join Context (IMPLEMENTED)
- `join_context` enum: `lobby`, `mid_question`, `results`, `intermission`
- Smart behavior based on when user joins
- Prevents "why can't I answer?" confusion

### 8. ✅ Session Start Lifecycle (NEWLY IMPLEMENTED)
- **Before session starts**: `play_state` is `NULL`
- **Play state controls disabled** until session officially starts
- **When session transitions to `active`**: `actual_start_time` is set, trigger automatically sets `play_state` to `lobby`
- **Database constraint enforces**:
  - If `actual_start_time IS NULL` → `play_state` MUST be NULL
  - If `actual_start_time IS NOT NULL` → `play_state` MUST NOT be NULL
- **Prevents premature play state changes** before session has begun

## 🚧 Partially Implemented / TODO

### 8. Auto-Recovery Rules (PARTIAL)
- ⚠️ Session stall detection - TODO
- ⚠️ Timer validation - TODO
- ⚠️ Host disconnect handling - TODO

### 9. Analytics Hooks (PARTIAL)
- ⚠️ Basic analytics implemented
- ⚠️ Need more granular event logging for host decisions

### 10. Comprehensive Documentation (TODO)
- ❌ "Running a Live Session (Human Reality)" guide needed
- ❌ Best practices for hosts
- ❌ Troubleshooting guide

---

## Original Feedback & Suggestions

### 1. Make "Control Mode" a First-Class Concept

Right now you mention manual vs autoplay, but it’s treated like a setting. In practice, it behaves like a control authority.

Suggested Improvement

Introduce a Session Control Mode:

control_mode:

- autoplay
- host_driven
- hybrid
  Behaviors by Mode
  Mode What Happens Automatically What Host Controls
  autoplay Timers, block transitions, play state Pause / End only
  host_driven Nothing All transitions
  hybrid Timers run, but host can override Advance, rewind, skip

Why this matters

Hosts often want to talk, read the room, react to confusion.

Hybrid lets you keep momentum without locking the host out.

Makes product behavior predictable.

Rule addition

Changing control_mode is only allowed in waiting or paused.

2. Separate “System Paused” vs “Host Hold”

Right now paused does too much.

Problem

A pause caused by a host decision is very different from:

Network issue

Admin stepping away

Emergency moderation

Suggested Improvement

Add a pause_reason enum:

pause_reason:

- host_hold
- technical_issue
- moderation
- system

Rules

pause_reason = host_hold → host UI shows “Resume when ready”

pause_reason = technical_issue → participants see reassurance copy

pause_reason = moderation → chat locked automatically

This improves:

UX messaging

Analytics

Audit logs

3. Add a “Soft Lock” Before Question Close

Your question_locked state is good, but you can improve suspense and fairness.

Suggested Improvement

Introduce a grace window:

question_active
↓ (timer hits 0)
question_soft_locked (1–3 seconds)
↓
question_locked

Behavior

Inputs disabled instantly

UI still animates “Time’s up…”

Late packets don’t get rejected harshly

Prevents rage when answers “just miss” by milliseconds

This is huge in live crowds with shaky connections.

4. Explicit Host Talking Moments

Admins often want to talk to the crowd without advancing the game.

Suggested Improvement

Add a play state:

host_segment

Use cases

Explaining a tricky question

Hype moments

Sponsor shoutouts

Handling confusion

Rules

No submissions allowed

Timers paused

Chat optionally enabled

Transitionable only by host

This avoids abusing paused or intermission for things they weren’t designed for.

5. Crowd Noise & Engagement Controls

Right now chat is binary: on/off.

Suggested Improvement

Add chat modes:

chat_mode:

- open
- reactions_only
- host_only
- muted

Automatic Triggers

question_active → reactions_only

question_results → open

paused (moderation) → muted

This gives hosts crowd control without manual policing.

6. Block Skipping: Make It Visible and Fair

You allow skipping blocks, which is good — but participants need clarity.

Suggested Improvement

When a block is skipped:

Play state briefly transitions to block_skipped

UI message: “This question was skipped by the host”

Scores unaffected

No leaderboard update for that block

This builds trust and avoids confusion.

7. Late Join Experience Needs a Catch-Up State

Late joiners currently “recover state”, but UX-wise that’s vague.

Suggested Improvement

Add a join_context:

join_context:

- lobby
- mid_question
- results
- intermission

Behavior

mid_question: show question, but disable submission

results: jump straight to results

intermission: show countdown

This avoids awkward “why can’t I answer?” moments.

8. Add a Safety Net: Auto-Recovery Rules

Live sessions break. Plan for it.

Suggested Auto-Recovery Rules

If session is active but no play state update for X seconds:

System flags stalled

Facilitators see “Resume or Pause?”

If current block is active but timer is missing:

Force close after max duration

If host disconnects:

Downgrade to autoplay or auto-pause (configurable)

These rules save sessions from dying silently.

9. Analytics Hooks for Human Decisions

You already protect data integrity. Now measure why decisions happened.

Suggested Event Logging

Log events like:

host_skipped_block

manual_advance

manual_pause

override_autoplay

Later this tells you:

Where hosts struggle

Which questions confuse players

Where automation should improve

10. Documentation Improvement (Small but Powerful)

Add a section called:

“Running a Live Session (Human Reality)”

Explain:

Recommended flow for a host

When to pause vs host_segment

How to handle confusion

How to skip gracefully

Best practices for large crowds

This turns the doc from correct into usable.

---

## 11. Session Lifecycle & Hosting Guide (NEWLY DOCUMENTED)

### Complete Session Lifecycle

```
DRAFT                    Session created, fully editable
  ↓                      No participants can join yet
  ↓                      play_state = NULL
  ↓
  ├─────────────────────────────────────┐
  │                                     │
  ↓ (Standard Flow)                     ↓ (Quick Start)
  │                                     │
WAITING                                 │
  Lobby open for joining                │
  play_state = NULL                     │
  Cannot change play state yet          │
  Host prepares, participants arrive    │
  ↓                                     │
  ↓ [Host clicks "Start Session"]      │
  │                                     │
  └─────────────────┬───────────────────┘
                    ↓
                 ACTIVE
                    Session officially begins
                    actual_start_time set automatically
                    play_state automatically becomes 'lobby'
                    Now host can control play states
                    ↓
                    ↓ [Host manages play state transitions]
                    ↓
                    ├─→ countdown → intro → questions → results → leaderboard
                    │                                  ↓
                    │                             [Repeat for each block]
                    │                                  ↓
                    └─→ final_results → ended
```

**Two Valid Flows:**
1. **Standard Flow**: `draft` → `waiting` → `active`
   - Use when you want a lobby period for participants to join before starting
   - Gives time to prepare, test equipment, gather participants

2. **Quick Start Flow**: `draft` → `active`
   - Use for immediate starts, test sessions, or no pre-gathering needed
   - Skips waiting phase, goes straight to active session

### Session Status vs Play State

**Session Status** (High-level lifecycle):
- `draft` - Editing mode, no access
- `waiting` - Open for joining, but not started
- `active` - Session running (actual_start_time set)
- `paused` - Temporarily halted
- `ended` - Completed

**Play State** (What users see):
- `NULL` - Session hasn't started (status = draft or waiting)
- `lobby` - Users joining, waiting to begin
- `countdown` - 3...2...1...GO! Building anticipation
- `intro` - Welcome screen with rules
- `question_active` - Question visible, accepting answers
- `question_soft_locked` - Time's up, grace period (1-3s)
- `question_locked` - No more answers, suspense moment
- `question_results` - Show correct answer & explanation
- `leaderboard` - Display rankings after question
- `intermission` - Break before next question
- `host_segment` - Host talking to crowd (everything paused)
- `block_skipped` - Question skipped by host
- `prizes` - Prize breakdown screen
- `final_results` - Final winners and rankings
- `ended` - Session over, goodbye screen
- `paused` - Session temporarily halted

### Key Business Rules

1. **Play state is NULL until session starts**
   - While status = `draft` or `waiting`, play_state must be NULL
   - UI prevents play state changes
   - Backend validates and rejects attempts
   - Database constraint enforces this

2. **Session start triggers play state initialization**
   - When transitioning to `active`, actual_start_time is set
   - Trigger automatically sets play_state to 'lobby'
   - From this point, host can control play states

3. **Play state transitions follow strict rules**
   - Cannot jump from lobby directly to results
   - Cannot end session from lobby (must have started gameplay)
   - paused can resume to most states except lobby/countdown
   - ended is terminal - no transitions allowed

### Recommended Host Flow

**Pre-Session (DRAFT status)**
1. Create session and add blocks in draft mode
2. Choose your flow:
   - **Option A**: Go to WAITING status (open lobby for participants to join)
   - **Option B**: Go directly to ACTIVE status (quick start)

**Pre-Session (WAITING status)** - If you chose Option A
1. Session transitions to WAITING
2. Share session code with participants
3. Watch participants join the lobby
4. **Cannot change play state yet** - play_state is NULL until you start
5. When ready, click "Start Session" → transitions to ACTIVE

**Session Start (Transition to ACTIVE)**
1. System sets actual_start_time
2. play_state automatically becomes 'lobby'
3. You can now control play states
4. Participants see the lobby screen

**During Session (ACTIVE status)**
1. Choose control mode:
   - `autoplay`: Timers run automatically, you can pause/end
   - `host_driven`: Full manual control of all transitions
   - `hybrid`: Timers run, but you can override

2. Typical question flow:
   ```
   lobby → countdown → question_active
      ↓
   [timer expires or host advances]
      ↓
   question_soft_locked (1-3s grace)
      ↓
   question_locked (suspense build)
      ↓
   question_results (reveal + explanation)
      ↓
   leaderboard (show rankings)
      ↓
   intermission → [next question]
   ```

3. Host override options:
   - **Pause**: Use when you need to handle something
     - Select reason: host_hold, technical_issue, moderation
     - Chat can auto-mute if moderation pause
   - **Host Segment**: Talk to crowd without timers running
     - Perfect for explanations, hype, sponsor moments
   - **Skip Block**: Question too hard/broken?
     - Participants see "Question skipped by host"
     - No score penalty, maintains trust

4. Chat control:
   - `open`: Free discussion
   - `reactions_only`: Emojis only (during questions)
   - `host_only`: Announcements mode
   - `muted`: Complete silence (moderation)

**Ending Session**
1. After final question, go to `final_results`
2. Then transition to `ended`
3. Session becomes read-only
4. Data preserved for analytics

### Common Scenarios

**"I need to explain this question"**
→ Transition to `host_segment`, talk, then resume to `question_active`

**"Someone complained about lag"**
→ Pause (reason: technical_issue), handle it, resume

**"This question is broken"**
→ Transition to `block_skipped`, participants see clear message

**"Crowd is too chatty during question"**
→ Set chat_mode to `reactions_only`

**"I need to step away briefly"**
→ Pause (reason: host_hold), clear message to participants

**"Late joiner asks why they can't answer"**
→ System automatically handles with join_context
→ They see question but can't submit (fair play)

### Test vs Live Mode

- **Test Mode**: Preview questions, test flow, no real data
  - Switching modes resets everything
  - play_state reset to NULL
  - All responses deleted
  - Fresh start

- **Live Mode**: Actual session with real participants
  - All actions are permanent
  - Analytics captured
  - Cannot switch to test without reset

### Best Practices

1. **Always test first**: Run in test mode before going live
2. **Start in hybrid mode**: Gives you safety net + control
3. **Use host_segment**: Don't abuse pause for talking
4. **Skip gracefully**: Better to skip than show broken content
5. **Watch the chat mode**: Auto-switches help, but monitor
6. **Don't start until ready**: You can't change play state until you officially start
7. **Prepare your participants**: Explain rules in the lobby before starting

### Troubleshooting

**"Play state controls are disabled"**
→ Session hasn't started yet (status = draft or waiting)
→ Click "Start Session" to activate play state controls

**"I can't go back to lobby"**
→ Once started, lobby is one-way (by design)
→ Use host_segment or intermission instead

**"Participants say they missed the timer"**
→ question_soft_locked gives 1-3s grace period
→ But they might be on slow connection

**"Session feels stuck"**
→ Check if in paused state
→ Check if waiting for manual advance (host_driven mode)
→ Use host_segment to buy time while you figure it out

### Future Enhancements Needed

1. **Auto-stall detection**: Alert host if no updates for X seconds
2. **Host disconnect recovery**: Configurable auto-pause or promote co-facilitator
3. **Better analytics**: Log every host decision (skip, pause, advance)
4. **Countdown customization**: Let hosts set countdown duration
5. **Question preview**: Show next question to host only
6. **Co-host controls**: Multiple facilitators with different permissions
