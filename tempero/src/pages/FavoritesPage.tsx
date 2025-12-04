import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../config/supabaseClient";
import Loader from "../components/Loader";
import RecipeCard from "../components/RecipeCard";

type FavoriteRecipe = {
  id: string;
  title: string;
  short_description: string | null;
  image_url: string | null;
  prep_time: number | null;
  cook_time: number | null;
  servings: number | null;
  difficulty: number | null;
};

export default function FavoritesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [recipes, setRecipes] = useState<FavoriteRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user ?? null);
    })();
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchFavorites = async () => {
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
        .eq("recipe_likes.auth_id", user.id);

      if (error) {
        console.error("Error fetching favorite recipes:", error);
        setRecipes([]);
        setLoading(false);
        return;
      }

      const cleaned: FavoriteRecipe[] = (data ?? []).map(
        ({ recipe_likes, ...rest }: any) => rest
      );

      setRecipes(cleaned);
      setLoading(false);
    };

    fetchFavorites();
  }, [user]);

  if (loading) {
    return <Loader message="Fetching your favorite recipes..." />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-bright flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-heading-styled text-secondary">
            Favorites
          </h1>
          <p className="text-dark/70 font-body">
            You need to be logged in to see your favorite recipes.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 rounded-lg bg-main text-bright font-heading hover:bg-secondary transition-colors"
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bright">
      <main className="max-w-6xl mx-auto pt-24 pb-16 px-4 sm:px-8">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-heading-styled text-secondary mb-2">
              Favorites
            </h1>
            <p className="text-dark/70 font-body max-w-xl">
              Your curated collection of recipes you&apos;ve liked on Tempero.
            </p>
          </div>
          <span className="inline-flex items-center rounded-full bg-main/10 text-main border border-main/40 px-4 py-1 font-heading text-sm">
            {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"}
          </span>
        </header>

        {recipes.length === 0 ? (
          <p className="text-dark/70 font-body">
            You haven&apos;t added any favorites yet. Browse recipes and tap the
            like button to save your favorites here.
          </p>
        ) : (
          <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
