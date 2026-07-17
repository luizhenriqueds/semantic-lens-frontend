-- Mirror Supabase Auth users into a public.users table on signup.

create table if not exists public.users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text,
  full_name  text,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;
grant select on public.users to authenticated;

drop policy if exists "Users read own row" on public.users;
create policy "Users read own row" on public.users
  for select to authenticated
  using (public.current_user_id() = user_id);

create or replace function public.handle_new_user() returns trigger
  language plpgsql security definer set search_path = public
as $$
begin
  insert into public.users (user_id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (user_id) do nothing;
  return new;
end;
$$;
grant execute on function public.handle_new_user() to supabase_auth_admin;

-- Trigger lives on auth.users (owned by supabase_auth_admin); apply this statement
-- with a role that owns the auth schema.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
