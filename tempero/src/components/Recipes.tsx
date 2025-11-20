import { useEffect, useState } from "react";
import { supabase } from "../config/supabaseClient";
import type { RecipePreview } from "../types/Recipe";
import UploadRecipeButton from "../types/Recipe";
import Loader from "./Loader";
import RecipeCard from "./RecipeCard";

type RecipesProps = {
  userId?: string | null;
  username?: string | null;
};

export default function Recipes({ userId }: RecipesProps) {
  const [recipes, setRecipes] = useState<RecipePreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(true);
      return;
    }

    const fetchRecipes = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("authorId", userId);

      if (error) {
        console.error("Error fetching recipes:", error);
      } else {
        setRecipes(data as RecipePreview[]);
      }
      setLoading(false);
    };

    fetchRecipes();
  }, [userId]);

  if (loading) return <Loader message="Fetching recipes..." />;


  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {recipes.map((r) => (
        <RecipeCard
          key={r.id}
          variant="grid"
          recipe={{
            id: r.id,
            title: r.title,
            short_description: r.short_description,
            image_url: r.image_url,
          }}
        />
      ))}
      <UploadRecipeButton />
    </div>
  );
}
