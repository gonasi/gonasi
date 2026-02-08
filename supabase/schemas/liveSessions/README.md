# Live Interactive Sessions Feature

## Overview

The Live Interactive Sessions feature enables educators to run real-time Q&A sessions where learners answer questions with instant scoring and leaderboards. Think live trivia meets interactive course blocks.

## Key Features

### Core Functionality
- **Real-time Question Display**: Questions appear simultaneously for all participants
- **Instant Answer Submission**: Participants submit answers in real-time
- **Automatic Scoring**: Immediate feedback with score calculation
- **Live Leaderboards**: Rankings update in real-time based on score and speed
- **Analytics**: Track participation, speed, accuracy, and engagement

### Visibility Options
- **Public**: Anyone with the session code can join
- **Unlisted**: Anyone with the code can join, but session isn't listed publicly
- **Private**: Requires both session code AND session key (password) to join

### Optional Features
- **Live Chat**: Real-time messaging during sessions
- **Reactions**: Emoji reactions to questions and overall session
- **Course Integration**: Link sessions to existing courses for reinforcement

## Database Schema

### Core Tables

#### `live_sessions`
Main session management table with:
- Session metadata (name, description, code)
- Visibility and access control (public/unlisted/private with optional key)
- Configuration (max participants, late join, leaderboard visibility)
- Timing settings (time limits, scheduled start)
- Optional course integration

#### `live_session_blocks`
Questions/content blocks (reuses existing plugin types):
- Supports all quiz plugin types (multiple choice, true/false, fill-in-blank, etc.)
- Position ordering
- Individual time limits
- Real-time statistics (response count, accuracy, avg time)

#### `live_session_participants`
Participant tracking and statistics:
- Join/leave timestamps
- Real-time stats (total responses, correct count, score, avg speed)
- Leaderboard rank (calculated automatically)
- Custom display names

#### `live_session_responses`
Individual answer submissions:
- Response data (format matches plugin type)
- Timing metrics (response time in milliseconds)
- Scoring (earned score vs max score)
- Status (correct/incorrect/partial)
- Unique constraint: one response per participant per block

#### `live_session_test_responses` 🆕
Test responses from facilitators for session testing:
- **Purpose**: Allows facilitators to test questions before running live sessions
- **Separation**: Completely isolated from participant responses
- Response data (format matches plugin type)
- Timing metrics (response time in milliseconds)
- Scoring (earned score vs max score)
- Test notes field for facilitator annotations
- **No impact** on block statistics or participant leaderboards
- Facilitators can submit multiple test responses per block

#### `live_session_messages` (Optional)
Real-time chat functionality:
- Message content
- Instructor flagging
- Pinned messages
- Moderation (soft delete)

#### `live_session_reactions` (Optional)
Emoji reactions:
- Session-level reactions
- Block-specific reactions
- Emoji identifier

#### `live_session_analytics`
Aggregate analytics per session:
- Participation metrics (total/peak/average participants)
- Engagement metrics (response rate, avg response time)
- Performance metrics (scores, accuracy rate)
- Session duration

## Real-Time Architecture

### Supabase Realtime

All live session tables are enabled for **Supabase Realtime** broadcasting:

```sql
alter publication supabase_realtime add table live_sessions;
alter publication supabase_realtime add table live_session_blocks;
alter publication supabase_realtime add table live_session_participants;
alter publication supabase_realtime add table live_session_responses;
alter publication supabase_realtime add table live_session_messages;
alter publication supabase_realtime add table live_session_reactions;
alter publication supabase_realtime add table live_session_analytics;
```

### Real-Time Subscriptions

#### Instructor View
```typescript
// Subscribe to session state
const sessionChannel = supabase
  .channel('live-session')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'live_session_participants',
      filter: `live_session_id=eq.${sessionId}`
    },
    handleParticipantChange
  )
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'live_session_responses',
      filter: `live_session_id=eq.${sessionId}`
    },
    handleNewResponse
  )
  .subscribe();
```

#### Participant View
```typescript
// Subscribe to active question and leaderboard
const participantChannel = supabase
  .channel('participant-view')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'live_session_blocks',
      filter: `live_session_id=eq.${sessionId}`
    },
    handleBlockUpdate
  )
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'live_session_participants',
      filter: `live_session_id=eq.${sessionId}`
    },
    handleLeaderboardUpdate
  )
  .subscribe();
```

### Automatic Statistics Updates

When a participant submits a response, triggers automatically:
1. **Update block statistics** (total/correct responses, avg time)
2. **Update participant statistics** (score, response count, avg time)
3. **Recalculate leaderboard rankings** based on score and speed
4. **Update session-wide analytics**

### Enhanced Triggers 🆕

The system now includes comprehensive triggers for data consistency:

#### Response Statistics Triggers
- `update_live_session_block_stats()` - Recalculates block aggregates on response insert/update/delete
- `update_live_session_participant_stats()` - Recalculates participant aggregates on response changes
- Triggered automatically for `live_session_responses` (NOT test responses)

#### Ranking Trigger
- `update_participant_rankings()` - Recalculates all participant ranks when scores change
- Ranking algorithm:
  1. Higher total score (descending)
  2. Faster average response time (ascending)
  3. Earlier join time (ascending)

#### Cleanup Trigger
- `cleanup_live_session_data()` - Ensures orphaned analytics are removed when sessions are deleted
- Most cleanup handled by CASCADE foreign keys
- Additional safety layer for data consistency

**Note**: Test responses (`live_session_test_responses`) do NOT trigger statistics updates, ensuring facilitator testing doesn't affect live session data.

## Key Functions

### Session Management

#### `generate_session_code()`
- Generates unique 6-character alphanumeric codes
- Excludes confusing characters (0, O, I, 1)
- Automatically called when creating sessions

#### `join_live_session(p_session_code, p_session_key, p_display_name)`
- Validates session exists and is joinable
- Checks visibility and session key for private sessions
- Verifies user is organization member
- Enforces max participant limits
- Returns success/error response

#### `leave_live_session(p_session_id)`
- Marks participant as "left"
- Records leave timestamp

### Statistics Management

#### `update_participant_stats(p_participant_id)`
- Recalculates all participant statistics
- Called automatically after response submission

#### `update_block_stats(p_block_id)`
- Recalculates block-level aggregates
- Updates response counts and average times

#### `calculate_leaderboard_ranks(p_session_id)`
- Ranks all active participants
- Primary sort: Total score (descending)
- Tiebreaker: Average response time (ascending - faster wins)

#### `update_session_analytics(p_session_id)`
- Updates or creates aggregate analytics
- Calculates participation rate, accuracy, score distributions

### Block Management

#### `reorder_live_session_blocks(block_positions, p_live_session_id, p_updated_by)`
- Reorders blocks within a session
- Similar to lesson blocks reordering

## Row Level Security (RLS)

All tables have RLS enabled with policies:

### `live_sessions`
- **SELECT**: Organization members can view
- **INSERT**: Org editors/admins/owners can create
- **UPDATE**: Session creators or org admins can update
- **DELETE**: Session creators or org admins can delete

### `live_session_blocks`
- **SELECT**: All org members can view
- **ALL**: Session creators or org admins can manage

### `live_session_participants`
- **SELECT**: All org members can view
- **INSERT**: Users can join via RPC (with validation)
- **UPDATE**: Users can update their own participation
- **DELETE**: Session creators can remove participants

### `live_session_responses`
- **SELECT**: Org members can view all responses OR users can view their own responses
- **INSERT**: Active participants can submit (only for active blocks in non-ended sessions)

### `live_session_test_responses` 🆕
- **SELECT**: Org members can view all test responses OR facilitators can view their own
- **INSERT**: Facilitators can submit test responses (session not ended)
- **UPDATE**: Facilitators can update their own test responses (session not ended)
- **DELETE**: Facilitators can delete their own test responses (session not ended)

### `live_session_messages`
- **SELECT**: Active participants can view
- **INSERT**: Participants can send (if chat enabled)
- **UPDATE**: Instructors can moderate

### `live_session_reactions`
- **SELECT**: All participants can view
- **INSERT**: Participants can react (if enabled)

### `live_session_analytics`
- **SELECT**: All org members can view
- **ALL**: System-managed

## Ended Session Protection 🔒

Once a live session reaches the `status = 'ended'` state, it becomes **read-only** to preserve data integrity for reporting and audit purposes.

### What's Restricted in Ended Sessions:

**Session Management:**
- ❌ Cannot update session metadata (name, description, settings)
- ❌ Cannot delete the session (unless you're an owner/admin with special privileges)

**Block Management:**
- ❌ Cannot add new blocks
- ❌ Cannot update existing blocks
- ❌ Cannot delete blocks
- ❌ Cannot reorder blocks

**Participant Management:**
- ❌ Cannot join ended sessions (new participants blocked)
- ❌ Facilitators cannot remove participants
- ✅ Existing participants can still update their own status (e.g., mark as "left")

**Facilitator Management:**
- ❌ Cannot add new facilitators
- ❌ Cannot remove facilitators

**Responses:**
- ❌ Cannot submit new responses
- ✅ Can view existing responses

**Test Responses:**
- ❌ Cannot submit new test responses
- ❌ Cannot update existing test responses
- ❌ Cannot delete test responses
- ✅ Can view existing test responses

**Interactions:**
- ❌ Cannot send new chat messages
- ❌ Cannot add new reactions
- ✅ Can view existing messages and reactions
- ❌ Facilitators cannot moderate messages in ended sessions

### Implementation:

The protection is implemented at multiple levels:

1. **Function Level**: `can_user_edit_live_session()` checks if `session.status = 'ended'`
2. **Policy Level**: RLS policies explicitly check `ls.status != 'ended'` for INSERT operations
3. **Application Level**: Frontend should disable editing UI for ended sessions

**Location**: `/Users/dc_dalin/Desktop/gonasi/supabase/schemas/liveSessions/utils/can_user_edit_live_session.sql:1`

## Usage Flow

### Testing Workflow (Before Going Live) 🆕

1. **Facilitator creates session**
   ```sql
   INSERT INTO live_sessions (
     organization_id,
     created_by,
     name,
     status  -- 'draft'
   ) VALUES (...);
   ```

2. **Add blocks (questions)**
   ```sql
   INSERT INTO live_session_blocks (
     live_session_id,
     plugin_type,
     content,
     settings
   ) VALUES (...);
   ```

3. **Test individual blocks**
   ```sql
   -- Activate block for testing
   UPDATE live_session_blocks
   SET status = 'active', activated_at = now()
   WHERE id = block_id;
   ```

4. **Facilitator submits test responses**
   ```sql
   INSERT INTO live_session_test_responses (
     live_session_id,
     live_session_block_id,
     facilitator_id,
     organization_id,
     response_data,
     status,
     response_time_ms,
     score_earned,
     max_score,
     test_notes  -- Optional notes
   ) VALUES (...);
   ```

5. **Review and iterate**
   - Test responses don't affect block/participant statistics
   - Facilitator can delete and retry as needed
   - Can add notes about timing, clarity, difficulty

6. **Finalize for live session**
   - Optionally delete test responses
   - Set session status to 'scheduled' or 'active'

### Creating a Session

1. **Instructor creates session**
   ```sql
   INSERT INTO live_sessions (
     organization_id,
     created_by,
     name,
     visibility,
     session_key,  -- Only for private
     enable_chat,
     show_leaderboard
   ) VALUES (...);
   ```

2. **Add blocks (questions)**
   ```sql
   INSERT INTO live_session_blocks (
     live_session_id,
     plugin_type,
     content,
     settings,
     position
   ) VALUES (...);
   ```

3. **Start session**
   ```sql
   UPDATE live_sessions
   SET status = 'waiting'
   WHERE id = session_id;
   ```

### Participant Journey

1. **Join session**
   ```sql
   SELECT join_live_session('ABC123', 'secret-key', 'Display Name');
   ```

2. **Wait for questions** (subscribe to real-time updates)

3. **Instructor activates block**
   ```sql
   UPDATE live_session_blocks
   SET status = 'active', activated_at = now()
   WHERE id = block_id;
   ```

4. **Participant submits response**
   ```sql
   INSERT INTO live_session_responses (
     live_session_id,
     live_session_block_id,
     participant_id,
     user_id,
     response_data,
     status,
     response_time_ms,
     score_earned,
     max_score
   ) VALUES (...);
   ```

5. **Stats auto-update** (trigger fires)
   - Leaderboard recalculates
   - Participant rank updates
   - Block stats refresh

6. **Instructor closes block**
   ```sql
   UPDATE live_session_blocks
   SET status = 'closed', closed_at = now()
   WHERE id = block_id;
   ```

7. **Repeat for next blocks**

8. **End session**
   ```sql
   UPDATE live_sessions
   SET status = 'ended', ended_at = now()
   WHERE id = session_id;
   ```

## Integration with Existing Features

### Plugin System
- Reuses all existing quiz plugin types (multiple_choice_single, true_or_false, etc.)
- Uses same content and settings schemas
- No modifications needed to existing plugins

### Course Integration (Optional)
- Link sessions to `courses` or `published_courses`
- Use session as supplementary live practice
- Analytics can feed back into course progress (future enhancement)

### Organizations
- Full multi-tenancy support
- Organization-scoped sessions
- Member-based access control
- Org-level analytics

## Performance Considerations

### Indexing
- All foreign keys indexed
- Status fields indexed for filtering
- Session codes indexed for quick lookups
- Rank indexed for leaderboard queries

### Real-Time Optimization
- Use Supabase Realtime filters to reduce bandwidth
- Subscribe only to relevant session data
- Unsubscribe when leaving session

### Statistics Caching
- Statistics stored in tables (not calculated on-the-fly)
- Triggers handle automatic updates
- Analytics table provides pre-computed aggregates

## Cascade Delete Behavior 🆕

When deleting records, the following automatic cascades occur:

### Delete `live_sessions`
✅ Automatically deletes:
- All `live_session_blocks`
- All `live_session_participants`
- All `live_session_responses`
- All `live_session_test_responses` 🆕
- All `live_session_facilitators`
- All `live_session_messages`
- All `live_session_reactions`
- All `live_session_analytics` (via cleanup trigger)

### Delete `live_session_blocks`
✅ Automatically deletes:
- All responses for that block (`live_session_responses`)
- All test responses for that block (`live_session_test_responses`) 🆕

⚡ Automatically triggers:
- Recalculation of participant statistics

### Delete `live_session_participants`
✅ Automatically deletes:
- All responses from that participant

⚡ Automatically triggers:
- Recalculation of block statistics
- Recalculation of remaining participant rankings

### Delete `organizations`
✅ Cascades to all live sessions in that organization
✅ Cascades to all related data via session deletion

### Delete `profiles` (users)
✅ Cascades to:
- All participant records for that user
- All facilitator records for that user
- All test responses from that user 🆕

## Future Enhancements

### Potential Features
- **Polls & Surveys**: Non-scored questions for feedback
- **Team Mode**: Participants grouped into teams
- **Bonus Points**: Time-based scoring multipliers
- **Power-ups**: Lifelines, hints, skip options
- **Replay Mode**: Review past sessions
- **Export**: Download results as CSV/PDF
- **Webhooks**: Notify external systems of events
- **Advanced Analytics**: Cohort analysis, question difficulty ratings
- **Mobile App**: Native mobile experience
- **Screen Sharing**: Instructor can share slides/content

## Security Considerations

### Access Control
- RLS enforced on all tables
- Session keys for private sessions (consider hashing)
- Organization membership required
- Role-based permissions (owner/admin/editor)

### Rate Limiting
- Consider rate limits on response submissions
- Prevent spam in chat/reactions
- Monitor for abusive behavior

### Data Privacy
- Analytics aggregated (no individual PII in reports)
- GDPR compliance: right to deletion
- Audit logs for sensitive operations

## Migration Notes

After adding schema files to `config.toml`, run:

```bash
cd supabase
supabase db reset  # For local development

# Or generate migration for production
supabase db diff --schema public -f live_sessions_feature
```

Remember to update TypeScript types:

```bash
supabase gen types typescript --local > ../shared/database/src/schema/index.ts
```

## Testing Checklist

### Core Functionality
- [ ] Create public session and join with code
- [ ] Create private session and verify key requirement
- [ ] Test max participants limit
- [ ] Submit responses and verify scoring
- [ ] Check leaderboard ranking accuracy
- [ ] Test real-time updates (multiple clients)
- [ ] Verify chat/reactions when enabled
- [ ] Test RLS policies for all roles
- [ ] Check analytics accuracy
- [ ] Test session state transitions
- [ ] Verify block reordering
- [ ] Test late join prevention
- [ ] Verify organization scoping

### Test Responses Feature 🆕
- [ ] Create session as facilitator
- [ ] Add blocks with various plugin types
- [ ] Activate blocks and submit test responses
- [ ] Verify test responses don't affect block statistics
- [ ] Verify test responses don't appear in participant leaderboards
- [ ] Test adding notes to test responses
- [ ] Update and delete test responses
- [ ] Verify facilitator-only access (other org members can't submit test responses)
- [ ] Delete a block and verify test responses are cascade deleted
- [ ] Delete a session and verify all test responses are cascade deleted

### Triggers & Statistics
- [ ] Submit participant response and verify block stats update
- [ ] Submit participant response and verify participant stats update
- [ ] Submit multiple responses and verify rankings recalculate correctly
- [ ] Delete a response and verify statistics adjust accordingly
- [ ] Verify test responses don't trigger statistics updates

### Ended Session Protection 🔒
- [ ] Mark a session as ended (status = 'ended')
- [ ] Verify cannot update session metadata after ended
- [ ] Verify cannot add new blocks to ended session
- [ ] Verify cannot update existing blocks in ended session
- [ ] Verify cannot delete blocks from ended session
- [ ] Verify cannot add new facilitators to ended session
- [ ] Verify cannot remove facilitators from ended session
- [ ] Verify new participants cannot join ended session
- [ ] Verify cannot submit responses to ended session
- [ ] Verify cannot send chat messages in ended session
- [ ] Verify cannot add reactions to ended session
- [ ] Verify cannot submit new test responses to ended session
- [ ] Verify cannot update existing test responses in ended session
- [ ] Verify cannot delete test responses from ended session
- [ ] Verify participants can still view their own responses in ended session
- [ ] Verify org members can still view all data from ended session
