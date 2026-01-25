import { supabase } from "../config/supabaseClient";


export function recipeImageUrl(
  path?: string | null
): string | undefined {
  if (!path) return undefined;

  const { data } = supabase.storage
    .from("images")
    .getPublicUrl(path);

  return data.publicUrl;
}

export function profileImageUrl(
  path?: string | null
): string | undefined {
  if (!path) return undefined;

  const { data } = supabase.storage
    .from("images")
    .getPublicUrl(path);

  return data.publicUrl;
}