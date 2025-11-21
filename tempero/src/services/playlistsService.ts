import { supabase } from "../config/supabaseClient";

export type Visibility = "PUBLIC" | "PRIVATE";

export type Playlist = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  visibility: Visibility;
  created_at: string;
  profiles?: {
    username: string;
    first_name: string | null;
    last_name: string | null;
    profile_picture_url: string | null;
  } | null;
  list_recipes?: { count: number }[];
};

export async function fetchAllPublicPlaylists(): Promise<Playlist[]> {
  const { data, error } = await supabase
    .from("lists")
    .select(
      `
      id,
      user_id,
      title,
      description,
      visibility,
      created_at,
      profiles:user_id (
        username,
        first_name,
        last_name,
        profile_picture_url
      ),
      list_recipes(count)
    `
    )
    .eq("visibility", "PUBLIC")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as Playlist[];
}

export async function fetchUserPlaylists(
  userId: string,
  includePrivate: boolean
): Promise<Playlist[]> {
  let query = supabase
    .from("lists")
    .select(
      `
      id,
      user_id,
      title,
      description,
      visibility,
      created_at,
      list_recipes(count)
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (!includePrivate) {
    query = query.eq("visibility", "PUBLIC");
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as Playlist[];
}

export async function fetchPlaylistWithRecipes(playlistId: string) {
  const { data: playlist, error: playlistError } = await supabase
    .from("lists")
    .select(
      `
      id,
      user_id,
      title,
      description,
      visibility,
      created_at,
      profiles:user_id (
        username,
        first_name,
        last_name,
        profile_picture_url
      )
    `
    )
    .eq("id", playlistId)
    .maybeSingle();

  if (playlistError) throw playlistError;
  if (!playlist) return { playlist: null, recipes: [] };

  const { data: recipes, error: recipesError } = await supabase
    .from("list_recipes")
    .select(
      `
      added_at,
      recipes:recipe_id (
        id,
        title,
        short_description,
        image_url,
        prep_time,
        cook_time,
        servings,
        difficulty
      )
    `
    )
    .eq("list_id", playlistId);

  if (recipesError) throw recipesError;

  return {
    playlist,
    recipes: recipes ?? [],
  };
}
