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
    <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">
      {recipes.map((r) => (
            <RecipeCard key={r.id} recipe={r} />
      ))}
      <UploadRecipeButton />
    </div>
  );
}
