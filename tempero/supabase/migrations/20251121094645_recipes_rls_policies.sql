-- =====================================================================
-- Enable RLS
-- =====================================================================
alter table public.recipes enable row level security;

-- =====================================================================
-- RLS Policies
-- =====================================================================

-- 1) Any AUTHENTICATED user can CREATE recipes
drop policy if exists "Authenticated users can create recipes" 
    on public.recipes;

create policy "Authenticated users can create recipes"
on public.recipes
for insert
to authenticated
with check (auth.uid() = "authorId");

-- 2) ANY user (including anonymous) can READ recipes
drop policy if exists "Anyone can read recipes"
    on public.recipes;

create policy "Anyone can read recipes"
on public.recipes
for select
using (true);

-- 3) A user can only UPDATE **their own** recipes
drop policy if exists "Users can update their own recipes"
    on public.recipes;

create policy "Users can update their own recipes"
on public.recipes
for update
to authenticated
using (auth.uid() = "authorId")
with check (auth.uid() = "authorId");

-- 4) A user can only DELETE **their own** recipes
drop policy if exists "Users can delete their own recipes"
    on public.recipes;

create policy "Users can delete their own recipes"
on public.recipes
for delete
to authenticated
using (auth.uid() = "authorId");
