# Course Publishing & Progress Tracking System

## Table of Contents
- [Overview](#overview)
- [Course Architecture](#course-architecture)
  - [Draft Courses](#draft-courses)
  - [Published Courses](#published-courses)
- [Publication Flow](#publication-flow)
- [Progress Tracking](#progress-tracking)
  - [Progress Hierarchy](#progress-hierarchy)
  - [Progress Calculations](#progress-calculations)
- [Version Tracking System](#version-tracking-system)
  - [Version Types](#version-types)
  - [Update Type Detection](#update-type-detection)
- [Granular Progress Invalidation](#granular-progress-invalidation)
  - [How It Works](#how-it-works)
  - [Change Detection](#change-detection)
  - [Progress Reset Process](#progress-reset-process)
- [Technical Implementation](#technical-implementation)
  - [Database Schema](#database-schema)
  - [Key Functions](#key-functions)
  - [Triggers](#triggers)
- [Developer Guide](#developer-guide)
  - [Publishing a Course](#publishing-a-course)
  - [Tracking Progress](#tracking-progress)
  - [Monitoring Changes](#monitoring-changes)
- [Migration Notes](#migration-notes)

---

## Overview

Gonasi's Learning Management System employs a **dual-course architecture** that separates course creation (draft) from course delivery (published). This architecture enables:

- **Safe Content Editing**: Modify courses without affecting active learners
- **Version Control**: Track what content changed and when
- **Granular Progress Management**: Only reset progress for content that actually changed
- **Performance Optimization**: Separate read-heavy published content from write-heavy draft content

---

## Course Architecture

### Draft Courses

Draft courses represent the **authoring environment** where course creators build and edit content.

**Tables:**
- `courses` - Course metadata (title, description, settings)
- `chapters` - Course sections/modules
- `lessons` - Individual learning units within chapters
- `lesson_blocks` - Granular content blocks (text, video, quiz, etc.)
- `course_pricing_tiers` - Pricing and access control
- `file_library` - Media assets (images, videos, documents)

**Characteristics:**
- **Mutable**: Content can be freely edited
- **Private**: Only accessible to course editors
- **Not Versioned for Delivery**: Changes don't affect learners until published
- **Storage**: Draft storage bucket (separate quota)

### Published Courses

Published courses represent the **delivery environment** where learners consume content.

**Tables:**
- `published_courses` - Published course metadata with version tracking
- `published_course_structure_content` - Complete course structure as JSONB
- `published_file_library` - Copied media assets for published courses

**Characteristics:**
- **Immutable (per version)**: Each publication is a snapshot
- **Public/Restricted**: Accessible based on enrollment and pricing
- **Versioned**: Every publication creates/updates version numbers
- **Storage**: Published storage bucket (separate quota)
- **Optimized for Reads**: Denormalized structure for fast queries

---

## Publication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        PUBLICATION PROCESS                       │
└─────────────────────────────────────────────────────────────────┘

1. DRAFT EDITING
   ├─► User edits content in draft tables
   ├─► Version numbers auto-increment on changes
   └─► Files stored in draft storage

2. PRE-PUBLICATION VALIDATION
   ├─► Transform draft data to publication format
   ├─► Validate content schema (blocks, settings)
   ├─► Check storage quota
   └─► Verify user permissions

3. PUBLICATION
   ├─► Copy course metadata to published_courses
   ├─► Serialize structure to JSONB in published_course_structure_content
   ├─► Copy files from file_library → published_file_library
   └─► Update version numbers and timestamps

4. CHANGE DETECTION
   ├─► Compare current draft versions with published versions
   ├─► Identify blocks that are: new, modified, or deleted
   └─► Return list of changed block IDs

5. GRANULAR PROGRESS INVALIDATION
   ├─► Delete progress ONLY for changed blocks
   ├─► Recalculate parent progress (lesson, chapter, course)
   └─► Log invalidation statistics

6. POST-PUBLICATION
   └─► Learners see updated content with preserved progress
```

---

## Progress Tracking

### Progress Hierarchy

Gonasi tracks progress at four levels, creating a hierarchical structure:

```
Course Progress (100%)
├─► Chapter 1 Progress (100%)
│   ├─► Lesson 1.1 Progress (100%)
│   │   ├─► Block 1 ✓ (completed)
│   │   ├─► Block 2 ✓ (completed)
│   │   └─► Block 3 ✓ (completed)
│   └─► Lesson 1.2 Progress (50%)
│       ├─► Block 4 ✓ (completed)
│       └─► Block 5 ✗ (not started)
└─► Chapter 2 Progress (0%)
    └─► Lesson 2.1 Progress (0%)
        └─► Block 6 ✗ (not started)
```

**Tables:**
- `course_progress` - Overall course completion
- `chapter_progress` - Chapter-level completion
- `lesson_progress` - Lesson-level completion
- `block_progress` - Individual block completion

### Progress Calculations

Progress is calculated using **weighted block completion**:

1. **Block Weight**: Each block has a weight (default: 1.0)
2. **Lesson Progress**: `(completed_block_weight / total_lesson_weight) × 100`
3. **Chapter Progress**: `(completed_lesson_weight / total_chapter_lesson_weight) × 100`
4. **Course Progress**: `(completed_weight / total_course_weight) × 100`

**Example:**
```sql
-- Lesson with 3 blocks (weights: 1.0, 2.0, 1.0)
-- User completed blocks 1 and 2
Lesson Progress = (1.0 + 2.0) / (1.0 + 2.0 + 1.0) × 100 = 75%
```

---

## Version Tracking System

### Version Types

The system tracks **three independent version numbers** for each course:

| Version Type | Tracks Changes To | Incremented When |
|--------------|-------------------|------------------|
| `content_version` | Chapters, Lessons, Blocks | Block content, settings, or structure changes |
| `pricing_version` | Pricing Tiers | Price, frequency, or tier settings change |
| `overview_version` | Course Metadata | Name, description, image, or category changes |

**Additionally:**
- Each block, lesson, chapter, and pricing tier has its own `content_version` / `pricing_version`
- `last_update_type` enum: `'content'`, `'pricing'`, `'overview'`, `'multiple'`
- Timestamps: `content_changed_at`, `pricing_changed_at`, `overview_changed_at`

### Update Type Detection

```sql
-- Automatic detection via triggers

-- 1. Block Content Change
UPDATE lesson_blocks SET content = '...' WHERE id = '...';
-- ► Increments: lesson_blocks.content_version
-- ► Cascade: courses.content_version + 1
-- ► Sets: courses.last_update_type = 'content'

-- 2. Pricing Change
UPDATE course_pricing_tiers SET price = 99.99 WHERE id = '...';
-- ► Increments: course_pricing_tiers.pricing_version
-- ► Cascade: courses.pricing_version + 1
-- ► Sets: courses.last_update_type = 'pricing'

-- 3. Overview Change
UPDATE courses SET name = 'New Title' WHERE id = '...';
-- ► Increments: courses.overview_version
-- ► Sets: courses.last_update_type = 'overview'
```

---

## Granular Progress Invalidation

### How It Works

**Old System (Pre-Version Tracking):**
```
Republish Course
└─► DELETE ALL user progress for this course
    └─► Users lose ALL progress, even for unchanged content ❌
```

**New System (Granular Invalidation):**
```
Republish Course
├─► Detect which blocks changed
├─► DELETE progress ONLY for changed blocks
├─► PRESERVE progress for unchanged blocks ✓
└─► Recalculate parent progress percentages
```

### Change Detection

The `detect_changed_blocks()` function compares versions:

```sql
-- Example: Detect changes between draft and published

DRAFT COURSE                    PUBLISHED COURSE
Block A: version 3              Block A: version 2  → MODIFIED
Block B: version 1              Block B: version 1  → UNCHANGED
Block C: version 1              (not published yet) → NEW
(deleted from draft)            Block D: version 1  → DELETED
```

**Returns:**
```json
[
  {
    "block_id": "uuid-a",
    "change_type": "modified",
    "old_version": 2,
    "new_version": 3
  },
  {
    "block_id": "uuid-c",
    "change_type": "new",
    "old_version": 0,
    "new_version": 1
  },
  {
    "block_id": "uuid-d",
    "change_type": "deleted",
    "old_version": 1,
    "new_version": 0
  }
]
```

### Progress Reset Process

**Step-by-Step Flow:**

1. **Collect Affected Data**
   ```sql
   -- Find all users who completed the changed blocks
   SELECT DISTINCT user_id, lesson_id
   FROM block_progress
   WHERE block_id IN (changed_block_ids)
   ```

2. **Delete Stale Progress**
   ```sql
   -- Remove progress for changed blocks only
   DELETE FROM block_progress
   WHERE block_id IN (changed_block_ids)
   ```

3. **Recalculate Lesson Progress**
   ```sql
   -- For each affected user-lesson combination
   CALL update_lesson_progress_for_user(user_id, published_course_id, lesson_id)
   -- Recalculates: completed_blocks, completed_weight, progress_percentage
   ```

4. **Recalculate Chapter Progress**
   ```sql
   -- For each affected user-chapter combination
   CALL update_chapter_progress_for_user(user_id, published_course_id, chapter_id)
   -- Recalculates: completed_lessons, lesson_progress_percentage
   ```

5. **Recalculate Course Progress**
   ```sql
   -- For each affected user
   CALL update_course_progress_for_user(user_id, published_course_id)
   -- Recalculates: overall completion_rate
   ```

**Result Summary:**
```json
{
  "invalidated_count": 5,           // 5 block completions deleted
  "affected_users": 2,               // 2 users had progress reset
  "affected_lessons": 2,             // 2 lessons affected
  "recalculated_lessons": 2,         // 2 lesson progress records updated
  "recalculated_chapters": 1         // 1 chapter progress record updated
}
```

---

## Technical Implementation

### Database Schema

**Version Columns Added:**

```sql
-- Draft Tables
ALTER TABLE courses ADD COLUMN content_version INTEGER DEFAULT 1;
ALTER TABLE courses ADD COLUMN pricing_version INTEGER DEFAULT 1;
ALTER TABLE courses ADD COLUMN overview_version INTEGER DEFAULT 1;
ALTER TABLE courses ADD COLUMN last_update_type course_update_type;

ALTER TABLE chapters ADD COLUMN content_version INTEGER DEFAULT 1;
ALTER TABLE lessons ADD COLUMN content_version INTEGER DEFAULT 1;
ALTER TABLE lesson_blocks ADD COLUMN content_version INTEGER DEFAULT 1;
ALTER TABLE course_pricing_tiers ADD COLUMN pricing_version INTEGER DEFAULT 1;

-- Published Tables
ALTER TABLE published_courses ADD COLUMN content_version INTEGER DEFAULT 1;
ALTER TABLE published_courses ADD COLUMN pricing_version INTEGER DEFAULT 1;
ALTER TABLE published_courses ADD COLUMN overview_version INTEGER DEFAULT 1;
ALTER TABLE published_courses ADD COLUMN last_update_type course_update_type;
ALTER TABLE published_courses ADD COLUMN content_changed_at TIMESTAMPTZ;
ALTER TABLE published_courses ADD COLUMN pricing_changed_at TIMESTAMPTZ;
ALTER TABLE published_courses ADD COLUMN overview_changed_at TIMESTAMPTZ;

-- Progress Tables
ALTER TABLE block_progress ADD COLUMN block_content_version INTEGER;
ALTER TABLE block_progress ADD COLUMN block_published_at TIMESTAMPTZ;
ALTER TABLE lesson_progress ADD COLUMN lesson_content_version INTEGER;
ALTER TABLE chapter_progress ADD COLUMN chapter_content_version INTEGER;
```

### Key Functions

#### 1. `detect_changed_blocks()`
**Location:** `supabase/schemas/publishedCourses/utils/detect_changed_blocks.sql`

**Purpose:** Compare draft course with published course to identify changed blocks

**Parameters:**
- `p_course_id` - Draft course UUID
- `p_published_course_id` - Published course UUID

**Returns:**
```sql
TABLE (
  block_id UUID,
  lesson_id UUID,
  chapter_id UUID,
  change_type TEXT,  -- 'new', 'modified', 'deleted'
  old_version INTEGER,
  new_version INTEGER
)
```

**Example Usage:**
```sql
SELECT * FROM detect_changed_blocks(
  'draft-course-uuid',
  'published-course-uuid'
);
```

#### 2. `invalidate_stale_block_progress()`
**Location:** `supabase/schemas/publishedCourses/utils/invalidate_stale_block_progress.sql`

**Purpose:** Delete progress for changed blocks and recalculate parent progress

**Parameters:**
- `p_published_course_id` - Published course UUID
- `p_changed_blocks` - JSONB array of changed blocks

**Returns:**
```sql
TABLE (
  invalidated_count INTEGER,
  affected_users UUID[],
  affected_lessons UUID[],
  recalculated_lessons INTEGER,
  recalculated_chapters INTEGER
)
```

**Example Usage:**
```typescript
const { data: changedBlocks } = await supabase.rpc('detect_changed_blocks', {
  p_course_id: courseId,
  p_published_course_id: publishedCourseId
});

const { data: result } = await supabase.rpc('invalidate_stale_block_progress', {
  p_published_course_id: publishedCourseId,
  p_changed_blocks: changedBlocks
});
```

#### 3. `complete_block()`
**Location:** `supabase/schemas/progress/utils/complete_block.sql`

**Purpose:** Mark a block as completed and update all parent progress levels

**Enhanced with Version Capture:**
```sql
-- Now captures and stores:
-- - block_content_version (from published structure)
-- - block_published_at (timestamp of publication)

-- This allows future change detection by comparing stored version
-- with current published version
```

### Triggers

**1. Version Increment Triggers (BEFORE UPDATE)**
```sql
-- Automatically increment version when content changes

CREATE TRIGGER trg_increment_lesson_block_version
  BEFORE UPDATE ON lesson_blocks
  FOR EACH ROW
  EXECUTE FUNCTION increment_lesson_block_version();
  -- Increments version if: content, settings, or plugin_type changed

CREATE TRIGGER trg_increment_lesson_version
  BEFORE UPDATE ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION increment_lesson_version();
  -- Increments version if: name or settings changed

CREATE TRIGGER trg_increment_chapter_version
  BEFORE UPDATE ON chapters
  FOR EACH ROW
  EXECUTE FUNCTION increment_chapter_version();
  -- Increments version if: name or description changed

CREATE TRIGGER trg_increment_pricing_tier_version
  BEFORE UPDATE ON course_pricing_tiers
  FOR EACH ROW
  EXECUTE FUNCTION increment_pricing_tier_version();
  -- Increments version if: pricing fields changed
```

**2. Cascade Update Trigger (AFTER UPDATE)**
```sql
-- Propagate child changes to parent course

CREATE TRIGGER trg_touch_course_on_lesson_block_update
  AFTER INSERT OR UPDATE OR DELETE ON lesson_blocks
  FOR EACH ROW
  EXECUTE FUNCTION trg_touch_course_updated_at();
  -- Updates courses.content_version and last_update_type

CREATE TRIGGER trg_touch_course_on_pricing_update
  AFTER INSERT OR UPDATE OR DELETE ON course_pricing_tiers
  FOR EACH ROW
  EXECUTE FUNCTION trg_touch_course_updated_at();
  -- Updates courses.pricing_version and last_update_type
```

**3. Update Type Tracking (BEFORE UPDATE)**
```sql
-- Track what type of update occurred on the course itself

CREATE TRIGGER trg_track_course_update_type
  BEFORE UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION track_course_update_type();
  -- Sets last_update_type based on which fields changed
```

---

## Developer Guide

### Publishing a Course

**TypeScript Example:**

```typescript
import { upsertPublishCourse } from '@gonasi/database/publishedCourses';

async function publishCourse(courseId: string) {
  const { supabase } = createClient(request);

  // Step 1: Transform draft data to publication format
  const transformedData = await getTransformedDataToPublish(supabase, courseId);

  // Step 2: Publish (includes automatic change detection and progress invalidation)
  const result = await upsertPublishCourse(supabase, courseId, transformedData);

  // Step 3: Check logs for invalidation results
  console.log('Publication result:', result);

  return result;
}
```

**Console Output:**
```
[upsertPublishCourse] Course published. Storage change: 1234567 bytes
[upsertPublishCourse] Detecting content changes for progress invalidation
[upsertPublishCourse] Detected 3 changed block(s), invalidating progress
[upsertPublishCourse] ✅ Progress invalidation complete: {
  invalidated_count: 5,
  affected_users: 2,
  affected_lessons: 2,
  recalculated_lessons: 2,
  recalculated_chapters: 1
}
```

### Tracking Progress

**Complete a Block:**

```typescript
async function completeBlock(data: {
  publishedCourseId: string;
  chapterId: string;
  lessonId: string;
  blockId: string;
  earnedScore?: number;
  timeSpentSeconds?: number;
}) {
  const { supabase } = createClient(request);

  const result = await supabase.rpc('complete_block', {
    p_published_course_id: data.publishedCourseId,
    p_chapter_id: data.chapterId,
    p_lesson_id: data.lessonId,
    p_block_id: data.blockId,
    p_earned_score: data.earnedScore,
    p_time_spent_seconds: data.timeSpentSeconds
  });

  if (!result.data?.success) {
    throw new Error(result.data?.error);
  }

  return result.data;
}
```

**Get Progress Overview:**

```typescript
const { data: progress } = await supabase.rpc('get_course_progress_overview', {
  p_published_course_id: publishedCourseId
});

console.log('Course progress:', progress);
// {
//   overall_progress_percentage: 75.5,
//   completed_blocks: 15,
//   total_blocks: 20,
//   completed_chapters: 1,
//   total_chapters: 2,
//   completed_lessons: 3,
//   total_lessons: 5
// }
```

### Monitoring Changes

**Check Version History:**

```sql
-- See when content was last changed
SELECT
  id,
  name,
  content_version,
  pricing_version,
  overview_version,
  last_update_type,
  content_changed_at,
  pricing_changed_at,
  overview_changed_at,
  updated_at
FROM published_courses
WHERE id = 'course-uuid';
```

**Audit Block Versions:**

```sql
-- See which blocks have higher versions in draft vs published
SELECT
  lb.id,
  lb.plugin_type,
  lb.content_version as draft_version,
  (
    SELECT (block->>'content_version')::integer
    FROM published_course_structure_content,
      jsonb_path_query(
        course_structure_content,
        '$.chapters[*].lessons[*].blocks[*] ? (@.id == $block_id)',
        jsonb_build_object('block_id', lb.id::text)
      ) as block
    WHERE id = lb.course_id
  ) as published_version
FROM lesson_blocks lb
WHERE lb.course_id = 'course-uuid'
  AND lb.content_version > COALESCE((
    SELECT (block->>'content_version')::integer
    FROM published_course_structure_content,
      jsonb_path_query(
        course_structure_content,
        '$.chapters[*].lessons[*].blocks[*] ? (@.id == $block_id)',
        jsonb_build_object('block_id', lb.id::text)
      ) as block
    WHERE id = lb.course_id
  ), 0);
```

---

## Migration Notes

### From Old System to New System

**Breaking Changes:**
- None! The system is fully backward compatible.

**Default Behavior:**
- All existing courses start with version 1 (via `DEFAULT 1`)
- All existing blocks without version info are treated as version 1
- First republication after migration will trigger full progress reset (no published version history)
- Subsequent republications use granular invalidation

**Recommended Migration Steps:**

1. **Apply Migration:**
   ```bash
   cd supabase
   supabase db reset  # or supabase migration up
   ```

2. **Regenerate TypeScript Types:**
   ```bash
   supabase gen types typescript --local > ../shared/database/src/schema/index.ts
   ```

3. **Rebuild Application:**
   ```bash
   npm run build
   ```

4. **Test Publication Flow:**
   - Publish an existing course
   - Make changes to specific blocks
   - Republish and verify only changed blocks reset progress

### Performance Considerations

**Indexes:**
The migration adds optimized indexes for version queries:

```sql
CREATE INDEX idx_block_progress_version_mismatch
  ON block_progress(published_course_id, block_id, block_content_version);

CREATE INDEX idx_courses_content_version
  ON courses(content_version);

CREATE INDEX idx_published_courses_content_version
  ON published_courses(content_version);
```

**Query Optimization:**
- Change detection uses JSONB path queries (indexed automatically)
- Progress invalidation uses CTEs for efficient batch operations
- Version comparisons use simple integer arithmetic (very fast)

**Expected Performance:**
- Change detection: ~50-100ms for courses with 100+ blocks
- Progress invalidation: ~200-500ms for 10 users with progress on changed blocks
- Version increment: <1ms (trigger execution)

---

## Best Practices

### For Course Creators

1. **Batch Your Changes**: Make multiple edits before publishing to minimize progress resets
2. **Communicate Updates**: Notify learners when significant content changes are published
3. **Test Before Publishing**: Preview changes in draft mode before committing to publication

### For Developers

1. **Always Check Versions**: When querying progress, consider version mismatches
2. **Log Invalidations**: Monitor progress invalidation logs to track user impact
3. **Handle Edge Cases**: Consider scenarios like:
   - First-time publication (no version history)
   - Block deletion (orphaned progress)
   - Bulk content imports (may trigger many version increments)

### For System Administrators

1. **Monitor Version Growth**: Track average version numbers to identify frequently-changed content
2. **Audit Progress Resets**: Review invalidation logs to ensure granular reset is working
3. **Database Maintenance**: Regularly vacuum and analyze tables with version columns

---

## Troubleshooting

### Common Issues

**Issue: All progress was reset instead of just changed blocks**

**Diagnosis:**
```sql
-- Check if published course has version history
SELECT content_version FROM published_courses WHERE id = 'course-uuid';
-- If content_version = 1, this is first publication (no history to compare)
```

**Solution:** This is expected behavior for first publication. Subsequent publications will use granular invalidation.

---

**Issue: Version numbers growing too large**

**Diagnosis:**
```sql
-- Check maximum version numbers
SELECT
  MAX(content_version) as max_content,
  MAX(pricing_version) as max_pricing,
  MAX(overview_version) as max_overview
FROM courses;
```

**Solution:** Version numbers are 32-bit integers (max: 2,147,483,647). Even 1000 edits/day = 365,000/year would take 5,000+ years to overflow. This is not a real concern.

---

**Issue: Progress not invalidating after republication**

**Diagnosis:**
```sql
-- Check if change detection is finding changes
SELECT * FROM detect_changed_blocks('draft-uuid', 'published-uuid');
-- Should return rows for changed blocks
```

**Solution:**
1. Verify block content actually changed (triggers only fire on specific field changes)
2. Check TypeScript logs for invalidation function errors
3. Ensure `upsertPublishCourse` includes change detection steps (check for recent code changes)

---

## Summary

The Gonasi course publishing and progress tracking system provides:

✅ **Safe Content Editing** - Draft/Published separation
✅ **Granular Progress Management** - Only reset changed content
✅ **Version Tracking** - Know what changed and when
✅ **Performance Optimization** - Efficient queries and indexes
✅ **User-Friendly** - Learners keep progress on unchanged content
✅ **Developer-Friendly** - Clear APIs and comprehensive logging

For questions or contributions, please refer to the main project documentation or contact the development team.

---

**Last Updated:** January 31, 2026
**Migration:** `20260131125756_add_version_tracking_and_progress_invalidation.sql`
**Related Files:**
- `/supabase/schemas/publishedCourses/utils/detect_changed_blocks.sql`
- `/supabase/schemas/publishedCourses/utils/invalidate_stale_block_progress.sql`
- `/shared/database/src/publishedCourses/upsertPublishCourse.ts`
- `/shared/database/src/publishedCourses/getTransformedDataToPublish.ts`
