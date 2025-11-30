// src/types/Review.ts
import { supabase } from "../config/supabaseClient";

export interface Review {
  id: string;
  recipe_id?: string;
  author_id: string;
  text: string;
  rating: number; // 1-5
  created_at?: string;
  updated_at?: string;
}

export type ReviewCardData = {
  id: string;
  text: string;
  rating: number;
  author_id: string;
  created_at?: string;
};

/**
 * Fetch recent reviews for the homepage feed
 */
export async function fetchRecentReviews(
  limit: number
): Promise<ReviewCardData[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("id, text, rating, author_id, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching recent reviews:", error);
    return [];
  }

  return (data ?? []) as ReviewCardData[];
}
