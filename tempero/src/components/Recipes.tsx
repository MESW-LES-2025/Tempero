import { useEffect, useState } from "react";
import { supabase } from "../config/supabaseClient";
import Loader from "./Loader";
type Recipe = {
  id: number;
  title: string;
  description: string;
  image_url: string;
};

export default function Recipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecipes = async () => {
      const { data, error } = await supabase.from("recipes").select("*");
      console.log(data);
      if (error) {
        console.error("Error fetching recipes:", error);
      } else {
        setRecipes(data as Recipe[]);
        setLoading(false);
      }
    };

    fetchRecipes();
  }, []);

  if (loading) return <Loader message="Fetching recipes..." />;

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {recipes.map((r) => (
        <article
          key={r.id}
          className="rounded-lg overflow-hidden shadow-sm border border-gray-200 bg-white hover:shadow-md transition"
        >
          <img src={r.image_url} className="w-full h-44 object-cover" />

          <div className="p-4">
            <h3 className="text-lg font-semibold text-[#e57f22]">{r.title}</h3>
            <p className="mt-2 text-sm text-gray-700 leading-relaxed">
              {r.short_description}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
