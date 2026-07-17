-- Owner-scoped access to alerts/favorites for Supabase Auth users.
-- Tables already exist with RLS enabled; this adds grants + policies. Service-role
-- (backend pipeline) bypasses RLS and is unaffected.
create or replace function public.current_user_id() returns uuid
  language sql stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'
  )::uuid
$$;
grant execute on function public.current_user_id() to authenticated;

alter table public.favorites enable row level security;
alter table public.alerts enable row level security;

grant select, insert, update, delete on public.favorites to authenticated;
grant select, insert, update, delete on public.alerts to authenticated;

drop policy if exists "Users manage own favorites" on public.favorites;
create policy "Users manage own favorites" on public.favorites
  for all to authenticated
  using (public.current_user_id() = user_id)
  with check (public.current_user_id() = user_id);

drop policy if exists "Users manage own alerts" on public.alerts;
create policy "Users manage own alerts" on public.alerts
  for all to authenticated
  using (public.current_user_id() = user_id)
  with check (public.current_user_id() = user_id);
