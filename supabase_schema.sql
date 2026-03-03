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

-- 3. Create habit_definitions table
create table public.habit_definitions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  name text not null,
  icon text not null default 'Circle',
  color text not null default 'emerald',
  target_value numeric not null default 1,
  unit text,
  increment_by numeric not null default 1,
  track_type text not null default 'boolean',  -- 'boolean' | 'count' | 'exercise'
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.habit_definitions enable row level security;

create policy "Users can view own habit definitions"
  on public.habit_definitions for select
  using ( auth.uid() = user_id );

create policy "Users can insert own habit definitions"
  on public.habit_definitions for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own habit definitions"
  on public.habit_definitions for update
  using ( auth.uid() = user_id );

create policy "Users can delete own habit definitions"
  on public.habit_definitions for delete
  using ( auth.uid() = user_id );

-- 4. Create habit_logs table
create table public.habit_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  habit_id uuid references public.habit_definitions(id) not null,
  date date not null default current_date,
  value numeric not null default 0,
  completed boolean not null default false,
  completed_at timestamp with time zone,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, habit_id, date)
);

alter table public.habit_logs enable row level security;

create policy "Users can view own habit logs"
  on public.habit_logs for select
  using ( auth.uid() = user_id );

create policy "Users can insert own habit logs"
  on public.habit_logs for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own habit logs"
  on public.habit_logs for update
  using ( auth.uid() = user_id );

create policy "Users can delete own habit logs"
  on public.habit_logs for delete
  using ( auth.uid() = user_id );
