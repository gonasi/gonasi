-- Add check constraint for course_structure_content
alter table public.published_course_structure_content
add constraint chk_course_structure_content_valid
check (
  jsonb_matches_schema(
    '{
      "type": "object",
      "required": ["total_chapters", "total_lessons", "total_blocks", "chapters"],
      "properties": {
        "total_chapters": { "type": "number", "minimum": 1 },
        "total_lessons": { "type": "number", "minimum": 1 },
        "total_blocks": { "type": "number", "minimum": 1 },
        "chapters": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["id", "course_id", "lesson_count", "name", "description", "position", "total_lessons", "total_blocks", "lessons"],
            "properties": {
              "id": { "type": "string", "format": "uuid" },
              "course_id": { "type": "string", "format": "uuid" },
              "lesson_count": { "type": "number", "minimum": 0 },
              "name": { "type": "string", "minLength": 1 },
              "description": { "type": "string", "minLength": 1 },
              "position": { "type": "number", "minimum": 0 },
              "total_lessons": { "type": "number", "minimum": 1 },
              "total_blocks": { "type": "number", "minimum": 1 },
              "lessons": {
                "type": "array",
                "items": {
                  "type": "object",
                  "required": ["id", "course_id", "chapter_id", "lesson_type_id", "name", "position", "settings", "lesson_types", "total_blocks", "blocks"],
                  "properties": {
                    "id": { "type": "string", "format": "uuid" },
                    "course_id": { "type": "string", "format": "uuid" },
                    "chapter_id": { "type": "string", "format": "uuid" },
                    "lesson_type_id": { "type": "string", "format": "uuid" },
                    "name": { "type": "string", "minLength": 1 },
                    "position": { "type": "number", "minimum": 0 },
                    "settings": {},
                    "lesson_types": {
                      "type": "object",
                      "required": ["id", "name", "description", "lucide_icon", "bg_color"],
                      "properties": {
                        "id": { "type": "string", "format": "uuid" },
                        "name": { "type": "string" },
                        "description": { "type": "string" },
                        "lucide_icon": { "type": "string" },
                        "bg_color": { "type": "string" }
                      }
                    },
                    "total_blocks": { "type": "number", "minimum": 1 },
                    "blocks": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "required": ["id", "lesson_id", "plugin_type", "content", "settings", "position"],
                        "properties": {
                          "id": { "type": "string", "format": "uuid" },
                          "lesson_id": { "type": "string", "format": "uuid" },
                          "plugin_type": { "type": "string" },
                          "content": {},
                          "settings": {},
                          "position": { "type": "number", "minimum": 0 }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }'::json,
    course_structure_content
  )
);
