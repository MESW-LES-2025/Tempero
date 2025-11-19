


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$declare
  v_username     text;
  v_first_name   text;
  v_last_name    text;
  v_profile_url  text;
begin
  -- username normalizado + fallback
  v_username := coalesce(
    nullif(lower(new.raw_user_meta_data->>'username'), ''),
    'user_' || substr(new.id::text, 1, 8)
  );

  -- nunca inserir NULL nas NOT NULL
  v_first_name := coalesce(nullif(trim(new.raw_user_meta_data->>'first_name'), ''), '');
  v_last_name  := coalesce(nullif(trim(new.raw_user_meta_data->>'last_name'),  ''), '');

  -- foto (pode ser NULL; troca por coalesce(...,'') se a coluna for NOT NULL)
  v_profile_url := nullif(new.raw_user_meta_data->>'profile_picture_url','');

  insert into public.profiles (
    auth_id, username, first_name, last_name, profile_picture_url 
  ) values (
    new.id, v_username, v_first_name, v_last_name, v_profile_url
  );

  return new;
end;$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_username_available"("p_username" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$declare
  v_exists boolean;
begin
  select exists(
    select *
    from public.profiles
    where username = p_username
  ) into v_exists;

  return not v_exists;
end;$$;


ALTER FUNCTION "public"."is_username_available"("p_username" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_tags_trgm"("q" "text") RETURNS TABLE("id" integer, "name" "text")
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  RETURN QUERY
  SELECT id, name
  FROM tags
  WHERE similarity(name, q) > 0.20   -- ajuste o limiar conforme necessário
  ORDER BY similarity(name, q) DESC
  LIMIT 10;
END;
$$;


ALTER FUNCTION "public"."search_tags_trgm"("q" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_follow_counts"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles
    SET followers_count = followers_count + 1
    WHERE auth_id = NEW.followed_id;

    UPDATE profiles
    SET following_count = following_count + 1
    WHERE auth_id = NEW.follower_id;

  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles
    SET followers_count = GREATEST(followers_count - 1, 0)
    WHERE auth_id = OLD.followed_id;

    UPDATE profiles
    SET following_count = GREATEST(following_count - 1, 0)
    WHERE auth_id = OLD.follower_id;
  END IF;

  RETURN NULL;
END;$$;


ALTER FUNCTION "public"."update_follow_counts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_follow_counts_auth"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- someone gained a follower
    UPDATE profiles
      SET followers_count = followers_count + 1
      WHERE auth_id = NEW.following_id;

    -- someone followed another user
    UPDATE profiles
      SET following_count = following_count + 1
      WHERE auth_id = NEW.follower_id;

  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles
      SET followers_count = GREATEST(followers_count - 1, 0)
      WHERE auth_id = OLD.following_id;

    UPDATE profiles
      SET following_count = GREATEST(following_count - 1, 0)
      WHERE auth_id = OLD.follower_id;

  ELSIF TG_OP = 'UPDATE' THEN
    -- if either side changed, decrement old, increment new
    IF (OLD.following_id IS DISTINCT FROM NEW.following_id) THEN
      UPDATE profiles
        SET followers_count = GREATEST(followers_count - 1, 0)
        WHERE auth_id = OLD.following_id;
      UPDATE profiles
        SET followers_count = followers_count + 1
        WHERE auth_id = NEW.following_id;
    END IF;

    IF (OLD.follower_id IS DISTINCT FROM NEW.follower_id) THEN
      UPDATE profiles
        SET following_count = GREATEST(following_count - 1, 0)
        WHERE auth_id = OLD.follower_id;
      UPDATE profiles
        SET following_count = following_count + 1
        WHERE auth_id = NEW.follower_id;
    END IF;
  END IF;

  RETURN NULL; -- statement-level side effects only
END;
$$;


ALTER FUNCTION "public"."update_follow_counts_auth"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."followers" (
    "follower_id" "uuid" NOT NULL,
    "followed_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."followers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."list_recipes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "list_id" "uuid",
    "recipe_id" "uuid",
    "added_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."list_recipes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lists" (
    "user_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "visibility" "text" DEFAULT '''''''PRIVATE''''::text'::"text" NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."lists" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "auth_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "username" "text" DEFAULT ''::"text" NOT NULL,
    "bio" "text",
    "profile_picture_url" "text",
    "first_name" "text" DEFAULT ''::"text" NOT NULL,
    "last_name" "text" DEFAULT 'Last'::"text" NOT NULL,
    "followers_count" integer DEFAULT 0 NOT NULL,
    "following_count" integer DEFAULT 0 NOT NULL,
    "xp" smallint DEFAULT '0'::smallint NOT NULL,
    "level" smallint,
    "chef_type" "text",
    CONSTRAINT "profiles_bio_check" CHECK (("length"("bio") <= 1000)),
    CONSTRAINT "profiles_first_name_check" CHECK (("length"("first_name") <= 20)),
    CONSTRAINT "profiles_followers_count_check" CHECK (("followers_count" >= 0)),
    CONSTRAINT "profiles_following_count_check" CHECK (("following_count" >= 0)),
    CONSTRAINT "profiles_last_name_check" CHECK (("length"("last_name") <= 20)),
    CONSTRAINT "profiles_xp_check" CHECK (("xp" >= 0))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recipe-ingredients" (
    "id" bigint NOT NULL,
    "recipe_id" "uuid",
    "name" "text" NOT NULL,
    "amount" integer NOT NULL,
    "unit" "text",
    "notes" "text"
);


ALTER TABLE "public"."recipe-ingredients" OWNER TO "postgres";


ALTER TABLE "public"."recipe-ingredients" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."recipe-ingredients_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."recipe-steps" (
    "index" smallint NOT NULL,
    "recipe_id" "uuid" NOT NULL,
    "text" "text" NOT NULL,
    CONSTRAINT "recipe-steps_index_check" CHECK (("index" > 0))
);


ALTER TABLE "public"."recipe-steps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recipe-tags" (
    "recipe_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL
);


ALTER TABLE "public"."recipe-tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recipes" (
    "authorId" "uuid" NOT NULL,
    "title" "text" DEFAULT ''::"text" NOT NULL,
    "short_description" "text" NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "image_url" "text",
    "prep_time" smallint DEFAULT '1'::smallint NOT NULL,
    "cook_time" smallint DEFAULT '1'::smallint NOT NULL,
    "servings" smallint DEFAULT '1'::smallint NOT NULL,
    "difficulty" smallint DEFAULT '1'::smallint NOT NULL,
    CONSTRAINT "recipes_cook_time_check" CHECK ((("cook_time" > 0) AND ("cook_time" < 200))),
    CONSTRAINT "recipes_difficulty_check" CHECK ((("difficulty" > 0) AND ("difficulty" <= 10))),
    CONSTRAINT "recipes_prep_time_check" CHECK ((("prep_time" > 0) AND ("prep_time" < 200))),
    CONSTRAINT "recipes_servings_check" CHECK ((("servings" > 0) AND ("servings" < 101)))
);


ALTER TABLE "public"."recipes" OWNER TO "postgres";


COMMENT ON COLUMN "public"."recipes"."prep_time" IS 'in minutes';



COMMENT ON COLUMN "public"."recipes"."servings" IS 'Servings indicate how many people the recipe is meant to feed.';



CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "author_id" "uuid" NOT NULL,
    "review" smallint DEFAULT '0'::smallint NOT NULL,
    "description" "text",
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "recipe_id" "uuid" NOT NULL
);


ALTER TABLE "public"."reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tags" (
    "name" "text" NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "public"."tags" OWNER TO "postgres";


ALTER TABLE ONLY "public"."followers"
    ADD CONSTRAINT "followers_pkey" PRIMARY KEY ("follower_id", "followed_id");



ALTER TABLE ONLY "public"."list_recipes"
    ADD CONSTRAINT "list_recipes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lists"
    ADD CONSTRAINT "lists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("auth_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."recipe-ingredients"
    ADD CONSTRAINT "recipe-ingredients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."recipe-steps"
    ADD CONSTRAINT "recipe-steps_pkey" PRIMARY KEY ("recipe_id", "index");



ALTER TABLE ONLY "public"."recipe-tags"
    ADD CONSTRAINT "recipe-tags_pkey" PRIMARY KEY ("recipe_id", "tag_id");



ALTER TABLE ONLY "public"."recipes"
    ADD CONSTRAINT "recipes_id_key" UNIQUE ("id");



ALTER TABLE ONLY "public"."recipes"
    ADD CONSTRAINT "recipes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_id_key" UNIQUE ("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_pkey" PRIMARY KEY ("id");



CREATE OR REPLACE TRIGGER "followers_delete_trigger" AFTER DELETE ON "public"."followers" FOR EACH ROW EXECUTE FUNCTION "public"."update_follow_counts"();



CREATE OR REPLACE TRIGGER "followers_insert_trigger" AFTER INSERT ON "public"."followers" FOR EACH ROW EXECUTE FUNCTION "public"."update_follow_counts"();



ALTER TABLE ONLY "public"."recipes"
    ADD CONSTRAINT "Recipes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."profiles"("auth_id");



ALTER TABLE ONLY "public"."followers"
    ADD CONSTRAINT "followers_followed_id_fkey" FOREIGN KEY ("followed_id") REFERENCES "public"."profiles"("auth_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."followers"
    ADD CONSTRAINT "followers_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "public"."profiles"("auth_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."list_recipes"
    ADD CONSTRAINT "list_recipes_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "public"."lists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."list_recipes"
    ADD CONSTRAINT "list_recipes_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lists"
    ADD CONSTRAINT "lists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("auth_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_auth_id_fkey" FOREIGN KEY ("auth_id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recipe-ingredients"
    ADD CONSTRAINT "recipe-ingredients_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recipe-steps"
    ADD CONSTRAINT "recipe-steps_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recipe-tags"
    ADD CONSTRAINT "recipe-tags_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id");



ALTER TABLE ONLY "public"."recipe-tags"
    ADD CONSTRAINT "recipe-tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("auth_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON UPDATE CASCADE ON DELETE CASCADE;



CREATE POLICY "Users can follow others" ON "public"."followers" FOR INSERT WITH CHECK (("auth"."uid"() = "follower_id"));



CREATE POLICY "Users can unfollow others" ON "public"."followers" FOR DELETE USING (("auth"."uid"() = "follower_id"));



CREATE POLICY "Users can update their own XP" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "auth_id"));



CREATE POLICY "Users can view follow relationships" ON "public"."followers" FOR SELECT USING (true);



CREATE POLICY "anyone can create recipes" ON "public"."recipes" FOR INSERT WITH CHECK (true);



CREATE POLICY "anyone can see recipes" ON "public"."recipes" FOR SELECT USING (true);



CREATE POLICY "anyone can see reviews" ON "public"."reviews" FOR SELECT USING (true);



ALTER TABLE "public"."followers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_select_public" ON "public"."profiles" FOR SELECT USING (true);



ALTER TABLE "public"."recipes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_username_available"("p_username" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_username_available"("p_username" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."is_username_available"("p_username" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_username_available"("p_username" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_tags_trgm"("q" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."search_tags_trgm"("q" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_tags_trgm"("q" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "postgres";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "anon";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "service_role";



GRANT ALL ON FUNCTION "public"."show_limit"() TO "postgres";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_follow_counts"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_follow_counts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_follow_counts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_follow_counts_auth"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_follow_counts_auth"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_follow_counts_auth"() TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "service_role";


















GRANT ALL ON TABLE "public"."followers" TO "anon";
GRANT ALL ON TABLE "public"."followers" TO "authenticated";
GRANT ALL ON TABLE "public"."followers" TO "service_role";



GRANT ALL ON TABLE "public"."list_recipes" TO "anon";
GRANT ALL ON TABLE "public"."list_recipes" TO "authenticated";
GRANT ALL ON TABLE "public"."list_recipes" TO "service_role";



GRANT ALL ON TABLE "public"."lists" TO "anon";
GRANT ALL ON TABLE "public"."lists" TO "authenticated";
GRANT ALL ON TABLE "public"."lists" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."recipe-ingredients" TO "anon";
GRANT ALL ON TABLE "public"."recipe-ingredients" TO "authenticated";
GRANT ALL ON TABLE "public"."recipe-ingredients" TO "service_role";



GRANT ALL ON SEQUENCE "public"."recipe-ingredients_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."recipe-ingredients_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."recipe-ingredients_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."recipe-steps" TO "anon";
GRANT ALL ON TABLE "public"."recipe-steps" TO "authenticated";
GRANT ALL ON TABLE "public"."recipe-steps" TO "service_role";



GRANT ALL ON TABLE "public"."recipe-tags" TO "anon";
GRANT ALL ON TABLE "public"."recipe-tags" TO "authenticated";
GRANT ALL ON TABLE "public"."recipe-tags" TO "service_role";



GRANT ALL ON TABLE "public"."recipes" TO "anon";
GRANT ALL ON TABLE "public"."recipes" TO "authenticated";
GRANT ALL ON TABLE "public"."recipes" TO "service_role";



GRANT ALL ON TABLE "public"."reviews" TO "anon";
GRANT ALL ON TABLE "public"."reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews" TO "service_role";



GRANT ALL ON TABLE "public"."tags" TO "anon";
GRANT ALL ON TABLE "public"."tags" TO "authenticated";
GRANT ALL ON TABLE "public"."tags" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































