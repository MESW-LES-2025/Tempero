import { useEffect, useState } from "react";
import RecipeCard from "../components/RecipeCard";
import { supabase } from "../config/supabaseClient";
import type { RecipePreview } from "../types/Recipe";


export default function HomePage() {
  const previewSize = 10;
  const [recentRecipes, setRecentRecipes] = useState<RecipePreview[]>([]);

  useEffect(() => {
    const fetchRecentRecipes = async () => {
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(previewSize);

      if (error) {
        console.error("Error fetching recent recipes:", error);
      } else {
        setRecentRecipes(data );
      }
    };

    fetchRecentRecipes();
  }, []);

  return (
  <div className="main-section bg-bright min-h-screen flex flex-col items-center justify-start py-10 px-5 space-y-15">

    <div className="feed-preview-container flex flex-col max-w-full ">
      <div className="feed-preview-header mb-2">
        <h2 className="text-4xl font-heading-styled w-fit text-gradient-to-r py-2 ">What's new?</h2>
      </div>
      <div className="feed-preview-list flex flex-row max-w-full gap-6  bg-white rounded-lg shadow-lg overflow-x-scroll p-6  custom-scroll">
        {recentRecipes.map((recipe) => (
          <div key={recipe.id} >
            <RecipeCard key={recipe.id} recipe={recipe} backgroundColor="bright" />
          </div>
        ))}
      </div>
    </div>

    <div className="suggestions-preview-container flex flex-col md:items-center ">
      <div className="suggestions-preview-header mb-6 text-center">
        <h2 className="text-4xl font-heading-styled text-gradient-to-r py-2 mx-auto">
          Suggestions for you!
        </h2>
        <b className="font-body font-thin text-dark">
          Recipe selection curated to increase your experience level
        </b>
      </div>

      <div className="suggestions-preview-list flex flex-row gap-4 min-h-50 bg-white rounded-lg shadow-lg overflow-x-auto custom-scroll pb-4 w-full">
        {/* ... */}
      </div>
    </div>

    <div className="suggestions-preview-container flex flex-col md:items-end ">
      <div className="suggestions-preview-header  md:text-right mb-2">
        <h2 className="text-4xl font-heading-styled w-fit text-gradient-to-r   py-2 ">Popular recipes!</h2>

      </div>
      <div className="suggestions-preview-list flex flex-row gap-4 min-h-50 bg-white rounded-lg shadow-lg overflow-x-auto custom-scroll pb-4 w-full">
        {/* Suggetion preview items would go here */}
      </div>
    </div>

  </div>
  );
}
