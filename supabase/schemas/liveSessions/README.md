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

When a participant submits a response, a trigger automatically:
1. Updates block statistics (total/correct responses, avg time)
2. Updates participant statistics (score, response count, avg time)
3. Recalculates leaderboard rankings
4. Updates session-wide analytics

This happens via the `trigger_update_stats_after_response()` function.

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
- **SELECT**: All org members can view
- **INSERT**: Active participants can submit (only for active blocks)

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

## Usage Flow

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
