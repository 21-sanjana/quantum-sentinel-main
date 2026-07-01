
-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  dms_enabled boolean not null default false,
  last_activity_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "own profile select" on public.profiles for select using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id);

-- DMS settings (1 per user)
create table public.dms_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  inactivity_days integer not null default 7,
  triggered boolean not null default false,
  triggered_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.dms_settings enable row level security;
create policy "own dms select" on public.dms_settings for select using (auth.uid() = user_id);
create policy "own dms insert" on public.dms_settings for insert with check (auth.uid() = user_id);
create policy "own dms update" on public.dms_settings for update using (auth.uid() = user_id);

-- Beneficiaries
create table public.beneficiaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  contact text,
  wallet_address text,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.beneficiaries enable row level security;
create policy "own beneficiaries all" on public.beneficiaries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Assets
create type public.asset_type as enum ('crypto_wallet', 'document', 'private_data', 'credentials');
create type public.asset_status as enum ('locked', 'unlocked', 'pending');

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  asset_type public.asset_type not null default 'private_data',
  encrypted_data text not null,
  beneficiary_id uuid references public.beneficiaries(id) on delete set null,
  status public.asset_status not null default 'locked',
  risk_level text not null default 'low',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.assets enable row level security;
create policy "own assets all" on public.assets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Activity logs
create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  category text not null default 'system',
  metadata jsonb,
  created_at timestamptz not null default now()
);
alter table public.activity_logs enable row level security;
create policy "own logs select" on public.activity_logs for select using (auth.uid() = user_id);
create policy "own logs insert" on public.activity_logs for insert with check (auth.uid() = user_id);

-- updated_at trigger
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated before update on public.profiles
  for each row execute function public.tg_set_updated_at();
create trigger dms_updated before update on public.dms_settings
  for each row execute function public.tg_set_updated_at();
create trigger assets_updated before update on public.assets
  for each row execute function public.tg_set_updated_at();

-- New user: create profile and dms settings
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, dms_enabled)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_user_meta_data ->> 'dms_enabled')::boolean, false)
  );
  insert into public.dms_settings (user_id, enabled, inactivity_days)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'dms_enabled')::boolean, false),
    7
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Realtime
alter publication supabase_realtime add table public.assets;
alter publication supabase_realtime add table public.beneficiaries;
alter publication supabase_realtime add table public.activity_logs;
alter publication supabase_realtime add table public.dms_settings;
alter publication supabase_realtime add table public.profiles;
