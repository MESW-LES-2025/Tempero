drop policy if exists "Anyone can read recipes" on "public"."recipes";

drop policy if exists "anyone can create recipes" on "public"."recipes";

alter table "public"."recipe-tags" drop constraint if exists "recipe-tags_recipe_id_fkey";

-- Only create comments table if it doesn't exist
create table if not exists "public"."comments" (
    "id" uuid not null default gen_random_uuid(),
    "review_id" uuid not null,
    "author_id" uuid not null,
    "body" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);

-- Add columns only if they don't exist
do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'reviews' and column_name = 'average_rating') then
        alter table "public"."reviews" add column "average_rating" real;
    end if;
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'reviews' and column_name = 'difficulty') then
        alter table "public"."reviews" add column "difficulty" smallint;
    end if;
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'reviews' and column_name = 'prep_time') then
        alter table "public"."reviews" add column "prep_time" smallint;
    end if;
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'reviews' and column_name = 'taste') then
        alter table "public"."reviews" add column "taste" smallint;
    end if;
end $$;

-- Add primary key only if not exists (handles both index and constraint)
do $$
begin
    if not exists (
        select 1 from information_schema.table_constraints 
        where constraint_name = 'comments_pkey' 
        and table_name = 'comments' 
        and table_schema = 'public'
    ) then
        alter table "public"."comments" add primary key ("id");
    end if;
end $$;

-- Add constraints with IF NOT EXISTS pattern
do $$
begin
    if not exists (select 1 from information_schema.table_constraints where constraint_name = 'fk_author' and table_name = 'comments' and table_schema = 'public') then
        alter table "public"."comments" add constraint "fk_author" FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    end if;
    if not exists (select 1 from information_schema.table_constraints where constraint_name = 'fk_review' and table_name = 'comments' and table_schema = 'public') then
        alter table "public"."comments" add constraint "fk_review" FOREIGN KEY (review_id) REFERENCES public.reviews(id) ON DELETE CASCADE;
    end if;
    if not exists (select 1 from information_schema.table_constraints where constraint_name = 'reviews_average_rating_check' and table_name = 'reviews' and table_schema = 'public') then
        alter table "public"."reviews" add constraint "reviews_average_rating_check" CHECK (((average_rating > ((0)::numeric)::double precision) AND (average_rating <= ((5)::numeric)::double precision)));
    end if;
    if not exists (select 1 from information_schema.table_constraints where constraint_name = 'reviews_difficulty_check' and table_name = 'reviews' and table_schema = 'public') then
        alter table "public"."reviews" add constraint "reviews_difficulty_check" CHECK (((difficulty > 0) AND (difficulty <= 5)));
    end if;
    if not exists (select 1 from information_schema.table_constraints where constraint_name = 'reviews_prep_time_check' and table_name = 'reviews' and table_schema = 'public') then
        alter table "public"."reviews" add constraint "reviews_prep_time_check" CHECK (((prep_time > 0) AND (prep_time <= 5)));
    end if;
    if not exists (select 1 from information_schema.table_constraints where constraint_name = 'reviews_taste_check' and table_name = 'reviews' and table_schema = 'public') then
        alter table "public"."reviews" add constraint "reviews_taste_check" CHECK (((taste > 0) AND (taste <= 5)));
    end if;
    if not exists (select 1 from information_schema.table_constraints where constraint_name = 'recipe-tags_recipe_id_fkey' and table_name = 'recipe-tags' and table_schema = 'public') then
        alter table "public"."recipe-tags" add constraint "recipe-tags_recipe_id_fkey" FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON UPDATE CASCADE ON DELETE CASCADE;
    end if;
end $$;

-- Grants (idempotent by nature)
grant delete on table "public"."comments" to "anon";
grant insert on table "public"."comments" to "anon";
grant references on table "public"."comments" to "anon";
grant select on table "public"."comments" to "anon";
grant trigger on table "public"."comments" to "anon";
grant truncate on table "public"."comments" to "anon";
grant update on table "public"."comments" to "anon";

grant delete on table "public"."comments" to "authenticated";
grant insert on table "public"."comments" to "authenticated";
grant references on table "public"."comments" to "authenticated";
grant select on table "public"."comments" to "authenticated";
grant trigger on table "public"."comments" to "authenticated";
grant truncate on table "public"."comments" to "authenticated";
grant update on table "public"."comments" to "authenticated";

grant delete on table "public"."comments" to "service_role";
grant insert on table "public"."comments" to "service_role";
grant references on table "public"."comments" to "service_role";
grant select on table "public"."comments" to "service_role";
grant trigger on table "public"."comments" to "service_role";
grant truncate on table "public"."comments" to "service_role";
grant update on table "public"."comments" to "service_role";

-- Policies (drop first to make idempotent)
drop policy if exists "Comments are readable by all authenticated users" on "public"."comments";
create policy "Comments are readable by all authenticated users"
on "public"."comments"
as permissive
for select
to authenticated
using (true);

drop policy if exists "Users can delete their own comments" on "public"."comments";
create policy "Users can delete their own comments"
on "public"."comments"
as permissive
for delete
to authenticated
using ((auth.uid() = author_id));

drop policy if exists "Users can update their own comments" on "public"."comments";
create policy "Users can update their own comments"
on "public"."comments"
as permissive
for update
to authenticated
using ((auth.uid() = author_id))
with check ((auth.uid() = author_id));

drop policy if exists "Users can write comments" on "public"."comments";
create policy "Users can write comments"
on "public"."comments"
as permissive
for insert
to authenticated
with check ((auth.uid() = author_id));

drop policy if exists "Allow authenticated users to insert reviews" on "public"."reviews";
create policy "Allow authenticated users to insert reviews"
on "public"."reviews"
as permissive
for insert
to authenticated
with check ((auth.role() = 'authenticated'::text));



