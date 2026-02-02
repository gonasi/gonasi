-- =============================================
-- CALCULATE LEADERBOARD RANKS
-- =============================================
-- Ranks all participants in a session by score (desc) then speed (asc)

create or replace function calculate_leaderboard_ranks(p_session_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  with ranked_participants as (
    select
      id,
      row_number() over (
        order by
          total_score desc,
          average_response_time_ms asc nulls last
      ) as new_rank
    from live_session_participants
    where live_session_id = p_session_id
      and status = 'joined'
  )
  update live_session_participants p
  set
    rank = rp.new_rank,
    updated_at = now()
  from ranked_participants rp
  where p.id = rp.id;
end;
$$;

comment on function calculate_leaderboard_ranks is 'Calculates and updates leaderboard rankings for a session (higher score wins, faster time breaks ties)';
