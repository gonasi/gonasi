create function set_course_enrollment_expiry()
returns trigger
as $$
begin
  if NEW.payment_frequency = 'monthly' then
    NEW.expires_at := NEW.enrolled_at + interval '1 month';
  elsif NEW.payment_frequency = 'bi_monthly' then
    NEW.expires_at := NEW.enrolled_at + interval '2 months';
  elsif NEW.payment_frequency = 'quarterly' then
    NEW.expires_at := NEW.enrolled_at + interval '3 months';
  elsif NEW.payment_frequency = 'semi_annual' then
    NEW.expires_at := NEW.enrolled_at + interval '6 months';
  elsif NEW.payment_frequency = 'annual' then
    NEW.expires_at := NEW.enrolled_at + interval '12 months';
  else
    raise exception 'Unknown payment_frequency: %', NEW.payment_frequency;
  end if;

  return NEW;
end;
$$
language plpgsql
set search_path = '';
