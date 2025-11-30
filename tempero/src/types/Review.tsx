// src/types/Review.ts
import { supabase } from "../config/supabaseClient";

export interface Review {
  id: string;
  recipe_id?: string;
  author_id: string;
  description: string;
  review: number; // 1-5
  created_at?: string;
  updated_at?: string;
}

export type ReviewRecipePreview = {
  id: string;
  title: string;
  short_description?: string | null;
  image_url?: string | null;
  prep_time?: number | null;
  cook_time?: number | null;
  servings?: number | null;
  difficulty?: number | string | null;
};

export type ReviewAuthor = {
  auth_id?: string;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  profile_picture_url?: string | null;
};

export type ReviewFeedItem = {
  id: string;
  rating: number; // 1-5
  description?: string | null;
  updated_at?: string | null;
  recipe: ReviewRecipePreview | null;
  author: ReviewAuthor | null;
};

/**
 * Fetch recent reviews for the homepage feed with recipe info and author profile details.
 * Uses two simple queries: reviews (with recipes) and profiles by author_id.
 */
export async function fetchRecentReviews(
  limit: number,
  allowedAuthorIds?: string[]
): Promise<ReviewFeedItem[]> {
  if (allowedAuthorIds && allowedAuthorIds.length === 0) {
    return [];
  }

  let query = supabase
    .from("reviews")
    .select(
      `
        id,
        author_id,
        review,
        description,
        recipe_id,
        created_at,
        updated_at,
        recipes(
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
    .order("updated_at", { ascending: false });

  if (allowedAuthorIds && allowedAuthorIds.length > 0) {
    query = query.in("author_id", allowedAuthorIds);
  }

  query = query.limit(limit);

  const { data: reviewsData, error: reviewsError } = await query;

  if (reviewsError) {
    console.error("Error fetching recent reviews:", reviewsError);
    return [];
  }

  const reviews = (reviewsData ?? []).map((r: any) => ({
    ...r,
    recipes: Array.isArray(r.recipes) ? r.recipes[0] ?? null : r.recipes ?? null,
  })) as Array<Review & { recipes?: ReviewRecipePreview | null }>;

  const authorIds = Array.from(
    new Set(reviews.map((r) => r.author_id).filter(Boolean))
  );

  let profileByAuthId = new Map<string, ReviewAuthor>();
  if (authorIds.length > 0) {
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("auth_id, username, first_name, last_name, profile_picture_url")
      .in("auth_id", authorIds);

    if (profilesError) {
      console.error("Error fetching profiles for reviews:", profilesError);
    } else {
      profileByAuthId = new Map(
        (profilesData ?? []).map((p) => [p.auth_id, p])
      );
    }
  }

  return reviews.map((r) => ({
    id: r.id,
    rating: r.review,
    description: r.description ?? null,
    updated_at: r.updated_at ?? r.created_at ?? null,
    recipe: r.recipes ?? null,
    author: profileByAuthId.get(r.author_id) ?? null,
  }));
}
