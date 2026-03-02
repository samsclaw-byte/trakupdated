-- Run this immediately in your Supabase SQL Editor

-- 1. Create users table attached to Supabase Auth
create table public.users (
  id uuid references auth.users not null primary key,
  email text,
  name text,
  age numeric,
  weight numeric,
  height numeric,
  activity_level numeric,
  bmr numeric,
  daily_calories numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.users enable row level security;

create policy "Users can view own profile"
  on public.users for select
  using ( auth.uid() = id );

create policy "Users can update own profile"
  on public.users for update
  using ( auth.uid() = id );

create policy "Users can insert own profile"
  on public.users for insert
  with check ( auth.uid() = id );

-- 2. Create meals table
create table public.meals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  meal_type text not null,
  text_entry text not null,
  calories numeric,
  protein numeric,
  fat numeric,
  fibre numeric,
  sugar numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up RLS for meals
alter table public.meals enable row level security;

create policy "Users can view own meals"
  on public.meals for select
  using ( auth.uid() = user_id );

create policy "Users can insert own meals"
  on public.meals for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own meals"
  on public.meals for update
  using ( auth.uid() = user_id );

create policy "Users can delete own meals"
  on public.meals for delete
  using ( auth.uid() = user_id );
