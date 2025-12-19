-- Create a table for items
create table items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text,
  content text,
  category text check (category in ('read', 'watch', 'work', 'personal')),
  status text check (status in ('pending', 'done')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on Row Level Security
alter table items enable row level security;

-- Create a policy that allows users to see only their own items
create policy "Users can see their own items"
on items for select
using ( auth.uid() = user_id );

-- Create a policy that allows users to insert their own items
create policy "Users can insert their own items"
on items for insert
with check ( auth.uid() = user_id );

-- Create a policy that allows users to update their own items
create policy "Users can update their own items"
on items for update
using ( auth.uid() = user_id );

-- Create a policy that allows users to delete their own items
create policy "Users can delete their own items"
on items for delete
using ( auth.uid() = user_id );
