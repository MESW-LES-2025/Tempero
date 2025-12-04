import { useEffect, useState } from "react";
import { supabase } from "../config/supabaseClient";
import type { RecipePreview } from "../types/Recipe";
import Loader from "./Loader";
import RecipeCard from "./RecipeCard";

type LikedRecipesProps = {
  userId?: string | null;
};

type RecipeWithLikes = RecipePreview & {
  recipe_likes?: { auth_id: string }[];
};

export default function LikedRecipes({ userId }: LikedRecipesProps) {
  const [recipes, setRecipes] = useState<RecipePreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setRecipes([]);
      setLoading(false);
      return;
    }

    const fetchLiked = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("recipes")
        .select(
          `
            id,
            title,
            short_description,
            image_url,
            prep_time,
            cook_time,
            servings,
            difficulty,
            recipe_likes!inner(auth_id)
          `
        )
        .eq("recipe_likes.auth_id", userId);

      if (error) {
        console.error("Error fetching liked recipes:", error);
        setRecipes([]);
      } else {
        const mapped =
          (data as unknown as RecipeWithLikes[] | null)?.map(({ recipe_likes, ...rest }) => rest) ??
          [];
        setRecipes(mapped);
      }

      setLoading(false);
    };

    fetchLiked();
  }, [userId]);

  if (loading) return <Loader message="Fetching liked recipes..." />;

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading-styled text-secondary">
            Liked Recipes
          </h2>
          <p className="text-sm text-dark/60 font-body">
            Recipes this chef has liked.
          </p>
        </div>
        <span className="text-xs font-heading-styled px-3 py-1 rounded-full bg-main/10 text-main border border-main/40">
          {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"}
        </span>
      </header>

      {recipes.length === 0 ? (
        <p className="text-sm text-dark/60 font-body">
          No liked recipes yet.
        </p>
      ) : (
        <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">
          {recipes.map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>
      )}
    </section>
  );
}
