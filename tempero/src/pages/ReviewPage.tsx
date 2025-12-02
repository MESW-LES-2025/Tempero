/* import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import RecipeCard from "../components/RecipeCard";
import Loader from "../components/Loader";
import type { ReviewFeedItem, ReviewAuthor } from "../types/Review";
import { supabase } from "../config/supabaseClient";

type ReviewDetail = ReviewFeedItem & { description?: string | null };

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const [review, setReview] = useState<ReviewDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchReview = async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select(
          `
            id,
            review,
            description,
            recipe_id,
            author_id,
            created_at,
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
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching review:", error);
        setLoading(false);
        return;
      }

      let author: ReviewAuthor | null = null;
      if (data?.author_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select(
            "auth_id, username, first_name, last_name, profile_picture_url"
          )
          .eq("auth_id", data.author_id)
          .maybeSingle();
        author = (profile as ReviewAuthor) ?? null;
      }

      if (data) {
        setReview({
          id: data.id,
          rating: data.review,
          description: data.description ?? null,
          recipe: Array.isArray(data.recipes) ? data.recipes[0] ?? null : data.recipes ?? null,
          author,
        });
      }

      setLoading(false);
    };

    fetchReview();
  }, [id]);

  if (loading) return <Loader message="Loading review..." />;
  if (!review)
    return (
      <div className="max-w-4xl mx-auto px-5 py-10 text-center font-body text-dark/70">
        Review not found.
      </div>
    );

  const profileHref = review.author?.username
    ? `/profile/${review.author.username}`
    : null;

  return (
    <div className="max-w-5xl mx-auto px-5 py-10 space-y-8">
      <div className="rounded-2xl bg-white shadow-lg border border-off-white p-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-2xl font-heading text-dark">
            Review{" "}
            <span className="text-main font-semibold">{review.rating}/5</span>
          </div>
          {profileHref && (
            <Link
              to={profileHref}
              className="text-main text-sm font-semibold hover:text-secondary transition-colors"
            >
              View profile
            </Link>
          )}
        </div>

        {review.description ? (
          <p className="text-dark/70 font-body leading-relaxed">
            {review.description}
          </p>
        ) : (
          <p className="text-dark/50 font-body italic">
            No written feedback for this review.
          </p>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-heading-styled text-gradient-to-r">
          Reviewed recipe
        </h3>
        {review.recipe ? (
          <RecipeCard recipe={review.recipe} backgroundColor="white" />
        ) : (
          <p className="text-dark/60 font-body">Recipe unavailable.</p>
        )}
      </div>
    </div>
  );
}
 */