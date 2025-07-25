alter table public.published_courses
add constraint chk_pricing_tiers_valid
check (
  jsonb_matches_schema(
    '{
      "type": "array",
      "items": {
        "type": "object",
        "required": [
          "id",
          "course_id",
          "organization_id",
          "payment_frequency",
          "is_free",
          "price",
          "currency_code",
          "is_active",
          "position",
          "is_popular",
          "is_recommended"
        ],
        "properties": {
          "id": { "type": "string", "format": "uuid" },
          "course_id": { "type": "string", "format": "uuid" },
          "organization_id": { "type": "string", "format": "uuid" },
          "payment_frequency": {
            "type": "string",
            "enum": ["monthly", "bi_monthly", "quarterly", "semi_annual", "annual"]
          },
          "is_free": { "type": "boolean" },
          "price": { "type": "number", "minimum": 0 },
          "currency_code": { "type": "string", "minLength": 3, "maxLength": 3 },
          "promotional_price": { "type": ["number", "null"], "minimum": 0 },
          "promotion_start_date": {
            "oneOf": [
              { "type": "string", "format": "date-time" },
              { "type": "null" }
            ]
          },
          "promotion_end_date": {
            "oneOf": [
              { "type": "string", "format": "date-time" },
              { "type": "null" }
            ]
          },
          "tier_name": { "type": ["string", "null"] },
          "tier_description": { "type": ["string", "null"] },
          "is_active": { "type": "boolean" },
          "position": { "type": "number", "minimum": 0 },
          "is_popular": { "type": "boolean" },
          "is_recommended": { "type": "boolean" }
        }
      }
    }'::json,
    pricing_tiers
  )
);
