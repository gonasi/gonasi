-- Response status enum
create type "public"."live_response_status" as enum (
  'submitted',  -- Response submitted
  'correct',    -- Correct answer
  'incorrect',  -- Incorrect answer
  'partial'     -- Partial credit (for multi-answer questions)
);

comment on type "public"."live_response_status" is 'Status/result of a participant response';
