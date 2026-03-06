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
  member_number serial,
  is_trak_plus boolean not null default false,
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
  carbs numeric,
  fat numeric,
  fibre numeric,
  sugar numeric,
  description text,
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

-- 5. Create squads table
create table public.squads (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  join_code text unique not null,
  created_by uuid references public.users(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.squads enable row level security;

-- Everyone can view squads (needed to join via code)
create policy "Users can view squads"
  on public.squads for select
  using ( auth.role() = 'authenticated' );

create policy "Users can create squads"
  on public.squads for insert
  with check ( auth.uid() = created_by );

create policy "Users can update own squads"
  on public.squads for update
  using ( auth.uid() = created_by );

-- 6. Create squad_members table
create table public.squad_members (
  squad_id uuid references public.squads(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  role text not null default 'member',
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (squad_id, user_id)
);

alter table public.squad_members enable row level security;

create policy "Users can view squad members"
  on public.squad_members for select
  using ( auth.role() = 'authenticated' );

create policy "Users can join squads"
  on public.squad_members for insert
  with check ( auth.uid() = user_id );

create policy "Users can leave squads"
  on public.squad_members for delete
  using ( auth.uid() = user_id );

-- 7. Create squad_feed table
create table public.squad_feed (
  id uuid default gen_random_uuid() primary key,
  squad_id uuid references public.squads(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  event_type text not null, -- 'perfect_day', 'calorie_target_hit', 'streak_5', 'joined'
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.squad_feed enable row level security;

create policy "Users can view feed of their squads"
  on public.squad_feed for select
  using ( exists (select 1 from public.squad_members where squad_id = public.squad_feed.squad_id and user_id = auth.uid()) );

create policy "Users can insert into feed"
  on public.squad_feed for insert
  with check ( auth.uid() = user_id );

-- 8. Create squad_reactions table
create table public.squad_reactions (
  id uuid default gen_random_uuid() primary key,
  feed_id uuid references public.squad_feed(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  emoji text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (feed_id, user_id, emoji)
);

alter table public.squad_reactions enable row level security;

create policy "Users can view reactions on their squad feed"
  on public.squad_reactions for select
  using ( exists (select 1 from public.squad_feed f join public.squad_members m on f.squad_id = m.squad_id where f.id = public.squad_reactions.feed_id and m.user_id = auth.uid()) );

create policy "Users can add reactions"
  on public.squad_reactions for insert
  with check ( auth.uid() = user_id );

create policy "Users can remove their reactions"
  on public.squad_reactions for delete
  using ( auth.uid() = user_id );

-- 9. RPC Function for calculating squad leaderboard
CREATE OR REPLACE FUNCTION calculate_squad_leaderboard(target_squad_id uuid, start_date date, end_date date)
RETURNS TABLE (
  user_id uuid,
  name text,
  total_score bigint,
  habit_completions bigint,
  perfect_days bigint,
  calorie_hits bigint,
  reactions_given bigint
) AS $$
BEGIN
  RETURN QUERY
  WITH member_list AS (
    SELECT u.id, u.name
    FROM public.users u
    JOIN public.squad_members sm ON sm.user_id = u.id
    WHERE sm.squad_id = target_squad_id
  ),
  habit_stats AS (
    SELECT 
      hl.user_id,
      COUNT(hl.id) FILTER (WHERE hl.completed = true) as completed_habits
    FROM public.habit_logs hl
    WHERE hl.date >= start_date AND hl.date <= end_date
    GROUP BY hl.user_id
  ),
  feed_stats AS (
    SELECT
      sf.user_id,
      COUNT(sf.id) FILTER (WHERE sf.event_type = 'perfect_day') as perfect_days,
      COUNT(sf.id) FILTER (WHERE sf.event_type = 'calorie_target_hit') as calorie_hits
    FROM public.squad_feed sf
    WHERE sf.squad_id = target_squad_id 
      AND (sf.created_at AT TIME ZONE 'UTC')::date >= start_date 
      AND (sf.created_at AT TIME ZONE 'UTC')::date <= end_date
    GROUP BY sf.user_id
  ),
  reaction_stats AS (
    SELECT
      sr.user_id,
      COUNT(sr.id) as reactions_given
    FROM public.squad_reactions sr
    JOIN public.squad_feed sf ON sf.id = sr.feed_id
    WHERE sf.squad_id = target_squad_id
      AND (sr.created_at AT TIME ZONE 'UTC')::date >= start_date 
      AND (sr.created_at AT TIME ZONE 'UTC')::date <= end_date
    GROUP BY sr.user_id
  )
  SELECT 
    m.id as user_id,
    m.name,
    COALESCE(hs.completed_habits, 0) * 5 + 
    COALESCE(fs.perfect_days, 0) * 25 + 
    COALESCE(fs.calorie_hits, 0) * 50 + 
    COALESCE(rs.reactions_given, 0) * 2 as total_score,
    COALESCE(hs.completed_habits, 0) as habit_completions,
    COALESCE(fs.perfect_days, 0) as perfect_days,
    COALESCE(fs.calorie_hits, 0) as calorie_hits,
    COALESCE(rs.reactions_given, 0) as reactions_given
  FROM member_list m
  LEFT JOIN habit_stats hs ON hs.user_id = m.id
  LEFT JOIN feed_stats fs ON fs.user_id = m.id
  LEFT JOIN reaction_stats rs ON rs.user_id = m.id
  ORDER BY total_score DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create workouts table
create table public.workouts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  activity_type text not null,
  intensity text not null, -- 'Light', 'Medium', 'Intense'
  duration_minutes integer not null,
  calories_burned integer not null,
  date date not null default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up RLS for workouts
alter table public.workouts enable row level security;

create policy "Users can view own workouts"
  on public.workouts for select
  using ( auth.uid() = user_id );

create policy "Users can insert own workouts"
  on public.workouts for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own workouts"
  on public.workouts for update
  using ( auth.uid() = user_id );

create policy "Users can delete own workouts"
  on public.workouts for delete
  using ( auth.uid() = user_id );
