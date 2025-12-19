import { NavLink } from "react-router-dom";
import { supabase } from "../config/supabaseClient";
import { useEffect, useState } from "react";

export type RecipePreview = {
    id: string;
    title: string;
    author_id: string;
    short_description: string;
    image_url: string;
    preparation_time: number;
    cooking_time: number;
    servings: number;
    difficulty: number;
};

export type Recipe = RecipePreview & {
    ingredients: Ingredient[];
    steps: Step[];
};

/**
 * Fetch recent recipes ordered by update time.
 */
export async function fetchRecentRecipes(limit: number) {
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(limit);
  
    if (error) {
      console.error("Error fetching recent recipes:", error);
      return [];
    }
  
    return data ?? [];
}

export async function fetchRecipesByLevel(level: string): Promise<RecipePreview[]> {
    const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("difficulty", level);

    if (error) {
        console.error("Error fetching recipes by level:", error);
        return [];
    }

    return data as RecipePreview[] ?? [];
}

export async function fetchPopularRecipes(limit: number = 20): Promise<RecipePreview[]> {
  const { data, error } = await supabase
    .from("popular_recipes")
    .select("*")
    .order("popularity", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching popular recipes:", error);
    return [];
  }

  return data;
}
export type Ingredient = {
    id: string;
    name: string;
    amount: string;
    unit?: string;
    note?: string;
};

export type Step = {
    id: string;
    index: number;
    description: string;
};

export default function UploadRecipeButton() {
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        (async () => {
            const { data } = await supabase.auth.getUser();
            if (!data.user) return;
            
            const { data: profile } = await supabase
                .from("profiles")
                .select("is_admin")
                .eq("auth_id", data.user.id)
                .single();
            
            setIsAdmin(profile?.is_admin || false);
        })();
    }, []);

    if (isAdmin) return null;

    return (
        <button className="bg-main text-bright text-3xl font-heading fixed right-6 bottom-10 py-2 px-4 rounded shadow-2xl hover:cursor-pointer hover:-translate-y-1 hover:opacity-80 transition-all">
            <NavLink to="/upload-recipe">+</NavLink>
        </button>
    )
}
