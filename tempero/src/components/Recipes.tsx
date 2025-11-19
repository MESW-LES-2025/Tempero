import { useEffect, useState } from "react";
import { supabase } from "../config/supabaseClient";
import type { RecipePreview } from "../types/Recipe";
import UploadRecipeButton from "../types/Recipe";
import { recipeImageUrl } from "../utils/ImageURL";
import Loader from "./Loader";

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
      {recipes.map((r) => {
        const imgUrl = recipeImageUrl(r.image_url, 600); // <-- build URL for this recipe
        return (
          <article
            key={r.id}
            className="rounded-lg overflow-hidden shadow-sm border border-gray-200 bg-white hover:shadow-md transition"
          >
            {imgUrl && (
              <div className="w-full aspect-4/3 overflow-hidden rounded-lg">
                <img
                  src={imgUrl}
                  alt={r.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="p-4">
              <h3 className="text-lg font-semibold text-[#e57f22]">{r.title}</h3>
              <p className="mt-2 text-sm text-gray-700 leading-relaxed">
                {r.short_description}
              </p>
            </div>
          </article>
        );
      })}
      <UploadRecipeButton />
    </div>
  );
}
