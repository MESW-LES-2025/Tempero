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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data?.user?.id ?? null);
    });
  }, []);

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

  const isOwnProfile = currentUserId && userId && currentUserId === userId;

  return (
    <div className="relative w-full">
      <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4 justify-items-center sm:justify-items-start">
        {recipes.map((r) => (
          <RecipeCard key={r.id} recipe={r} />
        ))}
      </div>
      {isOwnProfile && (
        <div className="sticky bottom-16 w-full flex justify-end pr-4 pt-4">
          <UploadRecipeButton />
        </div>
      )}
    </div>
  );
}
