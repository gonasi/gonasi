-- =============================================
-- REORDER LIVE SESSION BLOCKS RPC
-- =============================================
-- Similar to lesson blocks reordering

create or replace function reorder_live_session_blocks(
  block_positions jsonb,
  p_live_session_id uuid,
  p_updated_by uuid
)
returns void
language plpgsql
security definer
as $$
declare
  block_item jsonb;
begin
  -- Validate user has permission
  if not exists (
    select 1 from live_sessions
    where id = p_live_session_id
      and (
        created_by = p_updated_by
        or organization_id in (
          select organization_id from organization_members
          where user_id = p_updated_by and role in ('owner', 'admin')
        )
      )
  ) then
    raise exception 'Permission denied';
  end if;

  -- Update each block's position
  for block_item in select * from jsonb_array_elements(block_positions)
  loop
    update live_session_blocks
    set
      position = (block_item->>'position')::integer,
      updated_by = p_updated_by,
      updated_at = now()
    where id = (block_item->>'id')::uuid
      and live_session_id = p_live_session_id;
  end loop;
end;
$$;

comment on function reorder_live_session_blocks is 'Reorders blocks within a live session';
