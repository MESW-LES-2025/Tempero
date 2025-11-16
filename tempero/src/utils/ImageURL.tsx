import { supabase } from "../config/supabaseClient";


export function recipeImageUrl(
  path?: string | null,
  width: number = 800
): string | undefined {
  if (!path) return undefined;

  const { data } = supabase.storage
    .from("images")
    .getPublicUrl(path, {
      transform: {
        width,
        quality: 80,
        format: "origin",
      },
    });

  return data.publicUrl;
}
