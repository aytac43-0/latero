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

-- RLS Update (Ensure pinned items and reminders are covered by existing policies)
-- (Existing policies likely cover "all rows for user_id", so strictly no change needed if policies are "where user_id = auth.uid()")
