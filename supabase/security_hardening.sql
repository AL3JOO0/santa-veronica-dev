-- Ejecutar una vez en el SQL Editor de Supabase antes de desplegar esta versión.
-- El frontend ya no consulta tablas directamente; todo acceso pasa por el servidor.

begin;

alter table if exists public.institutions enable row level security;
alter table if exists public.events enable row level security;
alter table if exists public.students enable row level security;
alter table if exists public.photos enable row level security;
alter table if exists public.selections enable row level security;
alter table if exists public.selection_photos enable row level security;
alter table if exists public.email_notifications enable row level security;
alter table if exists public.users enable row level security;
alter table if exists public.usuarios_acceso enable row level security;

create table if not exists public.login_rate_limits (
  key_hash text primary key,
  attempt_count integer not null default 0,
  window_started_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists login_rate_limits_expires_at_idx
  on public.login_rate_limits (expires_at);

alter table public.login_rate_limits enable row level security;

revoke all on table public.institutions from anon, authenticated;
revoke all on table public.events from anon, authenticated;
revoke all on table public.students from anon, authenticated;
revoke all on table public.photos from anon, authenticated;
revoke all on table public.selections from anon, authenticated;
revoke all on table public.selection_photos from anon, authenticated;
revoke all on table public.email_notifications from anon, authenticated;
revoke all on table public.users from anon, authenticated;
revoke all on table public.usuarios_acceso from anon, authenticated;
revoke all on table public.login_rate_limits from anon, authenticated;

create or replace function public.consume_login_rate_limit(
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns table (allowed boolean, retry_after integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt_count integer;
  v_expires_at timestamptz;
  v_now timestamptz := now();
begin
  if length(p_key_hash) <> 64 or p_limit < 1 or p_window_seconds < 1 then
    raise exception 'INVALID_RATE_LIMIT_INPUT';
  end if;

  insert into public.login_rate_limits (
    key_hash,
    attempt_count,
    window_started_at,
    expires_at
  )
  values (
    p_key_hash,
    1,
    v_now,
    v_now + make_interval(secs => p_window_seconds)
  )
  on conflict (key_hash) do update
  set
    attempt_count = case
      when public.login_rate_limits.expires_at <= v_now then 1
      else public.login_rate_limits.attempt_count + 1
    end,
    window_started_at = case
      when public.login_rate_limits.expires_at <= v_now then v_now
      else public.login_rate_limits.window_started_at
    end,
    expires_at = case
      when public.login_rate_limits.expires_at <= v_now
        then v_now + make_interval(secs => p_window_seconds)
      else public.login_rate_limits.expires_at
    end
  returning attempt_count, expires_at into v_attempt_count, v_expires_at;

  return query select
    v_attempt_count <= p_limit,
    greatest(1, ceil(extract(epoch from (v_expires_at - v_now)))::integer);
end;
$$;

revoke all on function public.consume_login_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_login_rate_limit(text, integer, integer)
  to service_role;

create or replace function public.submit_student_selection(
  p_student_id uuid,
  p_photo_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_selection_id uuid;
  v_status text;
  v_owned_count integer;
  v_now timestamptz := now();
begin
  -- Serializa envíos concurrentes del mismo estudiante sin bloquear a los demás.
  perform pg_advisory_xact_lock(hashtextextended(p_student_id::text, 0));

  if coalesce(cardinality(p_photo_ids), 0) = 0 or cardinality(p_photo_ids) > 500 then
    raise exception 'INVALID_SELECTION_SIZE';
  end if;

  select count(*) into v_owned_count
  from public.photos
  where student_id = p_student_id and id = any(p_photo_ids);

  if v_owned_count <> cardinality(p_photo_ids) then
    raise exception 'INVALID_SELECTION_PHOTOS';
  end if;

  select id, status into v_selection_id, v_status
  from public.selections
  where student_id = p_student_id
  order by created_at desc
  limit 1
  for update;

  if v_status = 'SUBMITTED' then
    raise exception 'SELECTION_ALREADY_SUBMITTED';
  end if;

  if v_selection_id is null then
    insert into public.selections (student_id, status)
    values (p_student_id, 'DRAFT')
    returning id into v_selection_id;
  end if;

  delete from public.selection_photos where selection_id = v_selection_id;

  insert into public.selection_photos (selection_id, photo_id)
  select v_selection_id, photo_id
  from unnest(p_photo_ids) as photo_id;

  update public.selections
  set status = 'SUBMITTED', submitted_at = v_now, updated_at = v_now
  where id = v_selection_id;

  update public.students
  set status = 'SELECTION_SENT', updated_at = v_now
  where id = p_student_id;

  return v_selection_id;
end;
$$;

revoke all on function public.submit_student_selection(uuid, uuid[]) from public, anon, authenticated;
grant execute on function public.submit_student_selection(uuid, uuid[]) to service_role;

commit;
