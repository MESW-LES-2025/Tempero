create table if not exists public.recipe_likes (
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  auth_id uuid not null references public.profiles (auth_id) on delete cascade,
  created_at timestamptz default now() not null,

  -- 1 user so pode dar like 1 vez
  primary key (recipe_id, auth_id)
);

-- índice para rapidamente ver likes de um user
create index if not exists idx_recipe_likes_auth_id
  on public.recipe_likes (auth_id);

-- índice para contar likes por receita mais rápido
create index if not exists idx_recipe_likes_recipe_id
  on public.recipe_likes (recipe_id);
