import { Link } from "react-router-dom";
import RecipeCard from "./RecipeCard";
import type { ReviewFeedItem, ReviewAuthor } from "../types/Review";

type Props = {
  review: ReviewFeedItem;
  className?: string;
  recipeCardBackground?: string;
};

export default function ReviewCard({
  review,
  className = "",
  recipeCardBackground = "var(--color-bright)",
}: Props) {
  const displayName = formatName(review.author);
  const profileHref = review.author?.username
    ? `/profile/${review.author.username}`
    : undefined;
  const safeRating = clampRating(review.rating);

  return (
    <article
      className={`flex flex-row shrink-0  max-w-full rounded-2xl border border-off-white bg-bright shadow-lg overflow-hidden ${className}`}
    >
      <div className="flex w-64 flex-col  bg-off-white/70 p-5 ">
        <Link
          to={`/review/${review.id}`}
          className="flex items-center justify-between gap-3 hover:text-main transition-colors"
        >
          <div className="text-lg font-heading text-dark">
            Review:{" "}
            <span className="font-semibold text-main">
              {safeRating}
              <span className="text-dark/60">/5</span>
            </span>
          </div>
          <Avatar author={review.author} />
        </Link>

        <div className="text-sm font-body text-dark/70 flex items-center gap-2 mb-10">
          <span className="text-xs uppercase tracking-wide text-dark/50">by</span>
          {profileHref ? (
            <Link
              to={profileHref}
              className="text-main font-semibold hover:text-secondary transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {displayName}
            </Link>
          ) : (
            <span className="font-semibold">{displayName}</span>
          )}
        </div>

        {review.description ? (
          <p className="text-sm text-dark/80 font-body leading-relaxed line-clamp-3">
            {review.description}
          </p>
        ) : (
          <p className="text-sm text-dark/50 font-body italic">No review text provided.</p>
        )}
      </div>

      <div className="flex-1 border-l border-off-white">
        {review.recipe ? (
          <RecipeCard
            recipe={review.recipe}
            backgroundColor={recipeCardBackground}
          />
        ) : (
          <div className="p-4 text-sm text-dark/60 font-body h-full flex items-center">
            Recipe unavailable
          </div>
        )}
      </div>
    </article>
  );
}

function formatName(author: ReviewAuthor | null) {
  if (!author) return "Tempero cook";
  const name = `${author.first_name ?? ""} ${author.last_name ?? ""}`.trim();
  return name || author.username || "Tempero cook";
}

function clampRating(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(5, Math.round(value)));
}

function Avatar({ author }: { author: ReviewAuthor | null }) {
  const src = author?.profile_picture_url;
  const initials = (author?.first_name?.[0] ?? author?.last_name?.[0] ?? "?").toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={author?.username ?? "Profile picture"}
        className="h-10 w-10 rounded-full object-cover border border-white shadow-sm"
      />
    );
  }

  return (
    <div className="h-10 w-10 rounded-full bg-main/10 text-main font-semibold flex items-center justify-center border border-main/20">
      {initials}
    </div>
  );
}
