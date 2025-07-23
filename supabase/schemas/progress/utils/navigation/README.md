# Course Navigation System Documentation

## Overview

The Course Navigation System is a PostgreSQL-based solution that provides comprehensive navigation and progress tracking for an interactive course platform. It manages the hierarchical structure of courses (Course → Chapter → Lesson → Block) and tracks user progress at each level.

## Architecture

### Hierarchical Structure

```
Course
├── Chapter 1
│   ├── Lesson 1.1
│   │   ├── Block 1.1.1
│   │   ├── Block 1.1.2
│   │   └── Block 1.1.3
│   └── Lesson 1.2
│       ├── Block 1.2.1
│       └── Block 1.2.2
└── Chapter 2
    └── Lesson 2.1
        └── Block 2.1.1
```

### Core Concepts

- **Block**: The smallest unit of content (video, quiz, reading material)
- **Lesson**: A collection of related blocks
- **Chapter**: A collection of related lessons
- **Course**: The top-level container for all content

## Database Tables

The system relies on several progress tracking tables:

- `published_courses`: Course metadata
- `published_course_structure_content`: JSONB structure of course hierarchy
- `block_progress`: User progress on individual blocks
- `lesson_progress`: User progress on lessons
- `chapter_progress`: User progress on chapters

## Function Overview

### 1. `get_unified_navigation()` - Main Entry Point

**Purpose**: The primary function that orchestrates all navigation data for a given context.

**Parameters**:

- `p_user_id`: UUID of the user
- `p_published_course_id`: UUID of the course
- `p_current_block_id`: Current block (optional)
- `p_current_lesson_id`: Current lesson (optional)
- `p_current_chapter_id`: Current chapter (optional)

**Returns**: Complete navigation state as JSONB

**Use Cases**:

- Loading a course page with navigation controls
- Displaying progress indicators
- Enabling next/previous navigation
- Showing "continue where you left off" functionality

```sql
-- Example: Get navigation for a specific block
SELECT get_unified_navigation(
  'user-uuid'::uuid,
  'course-uuid'::uuid,
  'block-uuid'::uuid,
  null,
  null
);
```

### 2. `resolve_current_context()` - Context Resolution

**Purpose**: Resolves the current position in the course hierarchy and calculates global ordering.

**Key Features**:

- Handles hierarchical resolution (block → lesson → chapter)
- Calculates global order indices for navigation
- Works with partial context (e.g., only chapter specified)

**Use Cases**:

- Determining exact position when user navigates to a URL
- Calculating relative positions for next/previous navigation
- Validating navigation requests

### 3. `get_current_navigation_state()` - Current Progress

**Purpose**: Retrieves progress information for the current context.

**Returns**:

```json
{
  "block": {
    "id": "uuid",
    "is_completed": true,
    "completed_at": "2024-01-15T10:30:00Z",
    "progress_percentage": 85
  },
  "lesson": {
    /* similar structure */
  },
  "chapter": {
    /* similar structure */
  },
  "course": { "id": "uuid" }
}
```

**Use Cases**:

- Displaying completion status in UI
- Showing progress bars
- Enabling/disabling navigation based on completion

### 4. `get_next_navigation_state()` - Sequential Navigation

**Purpose**: Finds the next block, lesson, and chapter in sequential order.

**Use Cases**:

- "Next" button functionality
- Auto-advancing after completion
- Sequential course consumption

### 5. `get_previous_navigation_state()` - Backward Navigation

**Purpose**: Finds the previous block, lesson, and chapter in sequential order.

**Use Cases**:

- "Previous" button functionality
- Allowing users to review content
- Backward navigation support

### 6. `get_continue_navigation_state()` - Smart Resume

**Purpose**: Finds the next incomplete content, prioritizing blocks over lessons over chapters.

**Algorithm**:

1. Look for next incomplete block after current position
2. If no incomplete blocks, find next incomplete lesson
3. If no incomplete lessons, find next incomplete chapter

**Use Cases**:

- "Continue Learning" buttons
- Smart resume functionality
- Personalized learning paths

### 7. `get_completion_navigation_state()` - Progress Analytics

**Purpose**: Calculates comprehensive completion statistics across all levels.

**Returns**:

```json
{
  "blocks": {
    "total": 50,
    "completed": 35,
    "percentage": 70.0,
    "is_complete": false
  },
  "lessons": {
    /* similar structure */
  },
  "chapters": {
    /* similar structure */
  },
  "course": {
    "is_complete": false
  }
}
```

**Use Cases**:

- Progress dashboards
- Completion certificates
- Analytics and reporting
- Motivational progress indicators

### 8. `get_course_navigation_info()` - Course Metadata

**Purpose**: Retrieves basic course information for navigation context.

**Use Cases**:

- Displaying course title in navigation
- Breadcrumb navigation
- Course switching interfaces

## Common Use Cases & Examples

### 1. Loading a Course Page

When a user navigates to a specific block in a course:

```sql
-- Get complete navigation state for block
SELECT get_unified_navigation(
  '550e8400-e29b-41d4-a716-446655440000'::uuid,  -- user_id
  '6ba7b810-9dad-11d1-80b4-00c04fd430c8'::uuid,  -- course_id
  '6ba7b811-9dad-11d1-80b4-00c04fd430c8'::uuid,  -- current_block_id
  null,
  null
);
```

This returns everything needed to render:

- Current progress status
- Next/Previous buttons
- Continue learning suggestions
- Overall progress indicators

### 2. Implementing "Continue Learning"

For a course dashboard showing where to resume:

```sql
-- Get just the continue navigation
SELECT jsonb_extract_path(
  get_unified_navigation(user_id, course_id, null, null, null),
  'continue'
) as continue_targets
FROM user_courses
WHERE user_id = $1;
```

### 3. Progress Dashboard

For displaying course completion statistics:

```sql
-- Get completion stats for all enrolled courses
SELECT
  course_id,
  jsonb_extract_path(
    get_unified_navigation(user_id, course_id, null, null, null),
    'completion'
  ) as progress_stats
FROM user_enrollments
WHERE user_id = $1;
```

### 4. Navigation Validation

Before allowing navigation to ensure valid paths:

```sql
-- Check if a specific block exists in course structure
SELECT EXISTS(
  SELECT 1
  FROM resolve_current_context(
    (SELECT course_structure_content FROM published_course_structure_content WHERE id = $1),
    $2,  -- block_id to validate
    null,
    null
  )
) as is_valid_block;
```

## Frontend Integration Patterns

### React Navigation Hook Example

```javascript
const useCourseNavigation = (userId, courseId, currentBlockId) => {
  const [navigation, setNavigation] = useState(null);

  useEffect(() => {
    const fetchNavigation = async () => {
      const { data } = await supabase.rpc('get_unified_navigation', {
        p_user_id: userId,
        p_published_course_id: courseId,
        p_current_block_id: currentBlockId,
      });
      setNavigation(data);
    };

    fetchNavigation();
  }, [userId, courseId, currentBlockId]);

  return {
    navigation,
    canGoNext: navigation?.next?.block != null,
    canGoPrevious: navigation?.previous?.block != null,
    continueTarget:
      navigation?.continue?.block || navigation?.continue?.lesson || navigation?.continue?.chapter,
    progress: navigation?.completion,
  };
};
```

### Navigation Component Example

```javascript
const CourseNavigation = ({ userId, courseId, currentBlockId }) => {
  const { navigation, canGoNext, canGoPrevious } = useCourseNavigation(
    userId,
    courseId,
    currentBlockId,
  );

  const handleNext = () => {
    if (navigation?.next?.block) {
      router.push(`/course/${courseId}/block/${navigation.next.block.id}`);
    }
  };

  const handlePrevious = () => {
    if (navigation?.previous?.block) {
      router.push(`/course/${courseId}/block/${navigation.previous.block.id}`);
    }
  };

  return (
    <div className='navigation-controls'>
      <button onClick={handlePrevious} disabled={!canGoPrevious}>
        Previous
      </button>

      <ProgressBar
        completed={navigation?.completion?.blocks?.completed}
        total={navigation?.completion?.blocks?.total}
      />

      <button onClick={handleNext} disabled={!canGoNext}>
        Next
      </button>
    </div>
  );
};
```

## Performance Considerations

### Indexing Strategy

Ensure these indexes exist for optimal performance:

```sql
-- Progress table indexes
CREATE INDEX idx_block_progress_user_course ON block_progress(user_id, published_course_id);
CREATE INDEX idx_lesson_progress_user_course ON lesson_progress(user_id, published_course_id);
CREATE INDEX idx_chapter_progress_user_course ON chapter_progress(user_id, published_course_id);

-- Course structure index
CREATE INDEX idx_published_course_structure_content_id ON published_course_structure_content(id);
```

### Caching Strategy

Consider caching navigation data at the application level:

- Cache course structure (changes infrequently)
- Cache user progress (invalidate on progress updates)
- Use Redis or similar for session-based caching

## Error Handling

The functions include built-in error handling:

```sql
-- Example error response
{
  "error": "course structure not found"
}

-- Or
{
  "error": "could not resolve current context"
}
```

Always check for error keys in the response before processing navigation data.

## Testing Strategies

### Unit Testing Functions

```sql
-- Test context resolution
SELECT resolve_current_context(
  '{"chapters": [{"id": "test-chapter", "order_index": 1, "lessons": [...]}]}'::jsonb,
  'test-block-id'::uuid,
  null,
  null
);

-- Test navigation with no progress
SELECT get_unified_navigation(
  'test-user'::uuid,
  'test-course'::uuid,
  'first-block'::uuid,
  null,
  null
);
```

### Integration Testing

1. Create test course structure
2. Create test user with partial progress
3. Verify navigation responses match expected behavior
4. Test edge cases (first/last content, completed courses)

## Common Pitfalls & Debugging

### 1. Null Context Resolution

- **Issue**: `current_context` returns null
- **Cause**: Provided IDs don't exist in course structure
- **Solution**: Validate IDs against course structure first

### 2. Missing Progress Data

- **Issue**: Progress shows as incomplete when it should be complete
- **Cause**: Progress records not created or updated properly
- **Solution**: Ensure progress tracking triggers are working

### 3. Incorrect Global Ordering

- **Issue**: Next/Previous navigation jumps incorrectly
- **Cause**: Course structure `order_index` values are incorrect
- **Solution**: Validate and fix order_index values in course structure

### 4. Performance Issues

- **Issue**: Slow navigation responses
- **Cause**: Missing indexes or complex course structures
- **Solution**: Add appropriate indexes and consider structure optimization

## Migration & Deployment

When deploying these functions:

1. **Run in order**: Start with `resolve_current_context()`, then utility functions, finally `get_unified_navigation()`
2. **Test thoroughly**: Verify with existing course data before going live
3. **Monitor performance**: Watch query execution times in production
4. **Have rollback plan**: Keep previous navigation logic available during transition

## Future Enhancements

Potential improvements to consider:

- **Adaptive Learning**: Modify continue logic based on user performance
- **Bookmarking**: Allow users to bookmark specific positions
- **Learning Paths**: Support branching narratives and prerequisites
- **Analytics**: Add detailed learning analytics and time tracking
- **Offline Support**: Cache navigation data for offline learning
