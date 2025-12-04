import { supabase } from "../config/supabaseClient";

/**
 * Fetch the list of user IDs that the given user follows.
 */
export async function fetchFollowingIds(followerId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("followers")
    .select("followed_id")
    .eq("follower_id", followerId);

  if (error) {
    console.error("Error fetching follow relationships:", error);
    return [];
  }

  return (data ?? [])
    .map((row: any) => row.followed_id)
    .filter(Boolean);
}
