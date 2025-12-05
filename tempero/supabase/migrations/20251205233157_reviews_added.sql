drop policy if exists "Anyone can read recipes" on "public"."recipes";

drop policy if exists "anyone can create recipes" on "public"."recipes";

alter table "public"."recipe-tags" drop constraint "recipe-tags_recipe_id_fkey";


  create table "public"."comments" (
    "id" uuid not null default gen_random_uuid(),
    "review_id" uuid not null,
    "author_id" uuid not null,
    "body" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."reviews" add column "average_rating" real;

alter table "public"."reviews" add column "difficulty" smallint;

alter table "public"."reviews" add column "prep_time" smallint;

alter table "public"."reviews" add column "taste" smallint;

CREATE UNIQUE INDEX comments_pkey ON public.comments USING btree (id);

alter table "public"."comments" add constraint "comments_pkey" PRIMARY KEY using index "comments_pkey";

alter table "public"."comments" add constraint "fk_author" FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."comments" validate constraint "fk_author";

alter table "public"."comments" add constraint "fk_review" FOREIGN KEY (review_id) REFERENCES public.reviews(id) ON DELETE CASCADE not valid;

alter table "public"."comments" validate constraint "fk_review";

alter table "public"."reviews" add constraint "reviews_average_rating_check" CHECK (((average_rating > ((0)::numeric)::double precision) AND (average_rating <= ((5)::numeric)::double precision))) not valid;

alter table "public"."reviews" validate constraint "reviews_average_rating_check";

alter table "public"."reviews" add constraint "reviews_difficulty_check" CHECK (((difficulty > 0) AND (difficulty <= 5))) not valid;

alter table "public"."reviews" validate constraint "reviews_difficulty_check";

alter table "public"."reviews" add constraint "reviews_prep_time_check" CHECK (((prep_time > 0) AND (prep_time <= 5))) not valid;

alter table "public"."reviews" validate constraint "reviews_prep_time_check";

alter table "public"."reviews" add constraint "reviews_taste_check" CHECK (((taste > 0) AND (taste <= 5))) not valid;

alter table "public"."reviews" validate constraint "reviews_taste_check";

alter table "public"."recipe-tags" add constraint "recipe-tags_recipe_id_fkey" FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."recipe-tags" validate constraint "recipe-tags_recipe_id_fkey";

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


  create policy "Comments are readable by all authenticated users"
  on "public"."comments"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Users can delete their own comments"
  on "public"."comments"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = author_id));



  create policy "Users can update their own comments"
  on "public"."comments"
  as permissive
  for update
  to authenticated
using ((auth.uid() = author_id))
with check ((auth.uid() = author_id));



  create policy "Users can write comments"
  on "public"."comments"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = author_id));



  create policy "Allow authenticated users to insert reviews"
  on "public"."reviews"
  as permissive
  for insert
  to authenticated
with check ((auth.role() = 'authenticated'::text));



