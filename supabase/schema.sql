-- Run this in Supabase SQL Editor (new project) before starting the app.

-- Profiles table: extends auth.users with a role (citizen or authority)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'citizen' check (role in ('citizen', 'authority')),
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can view all profiles"
  on profiles for select
  using (true);

create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row whenever a new user signs up
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'citizen'),
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Hazards table
create table if not exists hazards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null,
  category text not null default 'other' check (
    category in ('pothole','streetlight','electrical','water','garbage','road_damage','other')
  ),
  severity text not null default 'medium' check (severity in ('low','medium','high','critical')),
  status text not null default 'reported' check (
    status in ('reported','acknowledged','in_progress','resolved')
  ),
  latitude double precision not null,
  longitude double precision not null,
  address text,
  ai_complaint_draft text,
  duplicate_of uuid references hazards(id) on delete set null,
  confirmations_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table hazards enable row level security;

-- Everyone (even anonymous, for the public map) can read hazards
create policy "Anyone can view hazards"
  on hazards for select
  using (true);

create policy "Authenticated users can insert hazards"
  on hazards for insert
  with check (auth.uid() = user_id);

create policy "Reporters can update their own hazards"
  on hazards for update
  using (auth.uid() = user_id);

create policy "Authorities can update any hazard"
  on hazards for update
  using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'authority')
  );

create policy "Reporters can delete their own hazards"
  on hazards for delete
  using (auth.uid() = user_id);

create index if not exists hazards_user_id_idx on hazards(user_id);
create index if not exists hazards_status_idx on hazards(status);
create index if not exists hazards_created_at_idx on hazards(created_at desc);

-- Confirmations table (community upvotes confirming a hazard still exists)
create table if not exists confirmations (
  id uuid primary key default gen_random_uuid(),
  hazard_id uuid not null references hazards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (hazard_id, user_id)
);

alter table confirmations enable row level security;

create policy "Anyone can view confirmations"
  on confirmations for select
  using (true);

create policy "Authenticated users can confirm"
  on confirmations for insert
  with check (auth.uid() = user_id);

create policy "Users can remove their own confirmation"
  on confirmations for delete
  using (auth.uid() = user_id);

-- Keep confirmations_count in sync automatically
create or replace function update_confirmations_count()
returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    update hazards set confirmations_count = confirmations_count + 1 where id = new.hazard_id;
  elsif (tg_op = 'DELETE') then
    update hazards set confirmations_count = greatest(confirmations_count - 1, 0) where id = old.hazard_id;
  end if;
  return null;
end;
$$ language plpgsql;

create trigger confirmations_count_trigger
  after insert or delete on confirmations
  for each row execute function update_confirmations_count();

-- Keep updated_at fresh on hazards
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger hazards_updated_at
  before update on hazards
  for each row execute function set_updated_at();
