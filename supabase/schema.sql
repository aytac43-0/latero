-- PROFILES
-- id: uuid references auth.users
-- email: text
-- plan: text ('free' | 'premium')
-- role: text ('user' | 'admin') default 'user'

-- PAYMENTS (Required for PayTR / Admin)
-- id: uuid
-- user_id: uuid references profiles.id
-- amount: numeric
-- status: text
-- created_at: timestamp

-- SUBSCRIPTIONS (Optional, can be merged into profiles.plan)
-- user_id: uuid
-- is_active: boolean
-- current_period_end: timestamp

-- ITEM TABLE
-- Profiles Table: Authentication Extension
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  role text default 'user',       -- 'user' | 'admin'
  plan text default 'free',       -- 'free' | 'premium'
  subscription_status text default 'active',
  stripe_customer_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS for Profiles
alter table public.profiles enable row level security;

create policy "Users can view own profile" 
  on public.profiles for select 
  using ( auth.uid() = id );

create policy "Users can update own profile" 
  on public.profiles for update 
  using ( auth.uid() = id );

-- Admins can view all profiles
create policy "Admins can view all profiles" 
  on public.profiles for select 
  using ( 
    auth.uid() in (select id from public.profiles where role = 'admin') 
  );

-- Admins can update all profiles
create policy "Admins can update all profiles" 
  on public.profiles for update 
  using ( 
    auth.uid() in (select id from public.profiles where role = 'admin') 
  );

-- Function to handle new user signup (Trigger)
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Enhancements to Items Table
alter table public.items add column if not exists user_note text;
alter table public.items add column if not exists reminder_at timestamptz;
alter table public.items add column if not exists is_pinned boolean default false;

-- PLANS TABLE
create table if not exists public.plans (
  id text primary key,            -- 'free', 'premium', etc.
  name text not null,
  price numeric default 0,
  is_active boolean default true,
  features text[],                -- Array of feature strings
  created_at timestamptz default now()
);

-- RLS for Plans
alter table public.plans enable row level security;

create policy "Plans are viewable by everyone"
  on public.plans for select
  using ( true );

create policy "Admins can manage plans"
  on public.plans for all
  using ( 
    auth.uid() in (select id from public.profiles where role = 'admin')
  );

-- Seed Initial Plans
insert into public.plans (id, name, price, features)
values 
  ('free', 'Free Tier', 0, array['50 Items', 'Basic Support']),
  ('premium', 'Premium', 5, array['Unlimited Items', 'Smart Reminders', 'Priority Support'])
on conflict (id) do nothing;

-- RLS Update (Ensure pinned items and reminders are covered by existing policies)
-- (Existing policies likely cover "all rows for user_id", so strictly no change needed if policies are "where user_id = auth.uid()")
