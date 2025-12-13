import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { supabase } from "../config/supabaseClient";
import type { Ingredient, Step } from "../types/Recipe";
import { recipeImageUrl } from "../utils/ImageURL";
import Loader from "../components/Loader";
import { deleteImage } from "../utils/ImageUtils";
import ReportModal from "../components/ReportModal";

type RecipeRow = {
  id: string;
  title: string;
  short_description: string;
  image_url: string | null;
  authorId: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  difficulty: number;
  created_at?: string;
  updated_at?: string;
  profiles?: {
    auth_id: string;
    username: string | null;
    first_name: string | null;
    last_name: string | null;
  };
  recipe_ingredients?: Array<{
    id: number;
    name: string;
    amount: number;
    unit: string | null;
    notes: string | null;
  }>;
  recipe_steps?: Array<{
    index: number;
    text: string;
  }>;
  recipe_tags?: Array<{
    tag_id: string;
    tags: { name: string };
  }>;
};

type RecipeDetails = {
  id: string;
  title: string;
  short_description: string;
  image_url: string | null;
  authorId: string;
  authorUsername: string | null;
  authorName: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  difficulty: number;
  ingredients: Ingredient[];
  steps: Step[];
  tags: string[];
  created_at?: string;
  updated_at?: string;
};

type ReviewData = {
  id: string;
  difficulty: number;
  prep_time: number;
  taste: number;
  average_rating: number;
  description: string | null;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    chef_type: string | null;
  } | null;
};

type CommentData = {
  id: string;
  body: string;
  created_at: string;
  author: {
    username: string | null;
    first_name: string | null;
    last_name: string | null;
  } | null;
};

export default function RecipePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [showXpToast, setShowXpToast] = useState(false);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const xpGained = (location.state as any)?.xpGained ?? 0;
  const leveledUp = (location.state as any)?.leveledUp ?? false;
  const newLevel = (location.state as any)?.newLevel ?? 1;
  const newChefType = (location.state as any)?.newChefType ?? "";
  const [recipe, setRecipe] = useState<RecipeDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [likesCount, setLikesCount] = useState<number>(0);
  const [likedByUser, setLikedByUser] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [avgDifficulty, setAvgDifficulty] = useState<number>(0);
  const [avgPrepTime, setAvgPrepTime] = useState<number>(0);
  const [avgTaste, setAvgTaste] = useState<number>(0);
  const [overallRating, setOverallRating] = useState<number>(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (leveledUp) {
      setShowLevelUpModal(true);
      const timer = setTimeout(() => setShowLevelUpModal(false), 4000);
      return () => clearTimeout(timer);
    } else if (xpGained > 0) {
      setShowXpToast(true);
      const timer = setTimeout(() => setShowXpToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [xpGained, leveledUp]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setCurrentUserId(data?.user?.id ?? null);
      
      if (data?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("auth_id", data.user.id)
          .single();
        if (!mounted) return;
        setIsAdmin(profile?.is_admin || false);
      }
    })();

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setCurrentUserId(session?.user?.id ?? null);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!id) return;

    const fetchRecipe = async () => {
      setLoading(true);

      const { data: recipeRow, error: recipeError } = await supabase
        .from("recipes")
        .select(
          `
          id,
          title,
          short_description,
          image_url,
          authorId,
          prep_time,
          cook_time,
          servings,
          difficulty,
          created_at,
          updated_at,
          profiles:profiles!Recipes_authorId_fkey(auth_id, username, first_name, last_name),
          recipe_ingredients:recipe-ingredients(id, name, amount, unit, notes),
          recipe_steps:recipe-steps(index, text),
          recipe_tags:recipe-tags(tag_id, tags(name))
          `
        )
        .eq("id", id)
        .single<RecipeRow>();

      if (recipeError || !recipeRow) {
        console.error(recipeError);
        setRecipe(null);
        setLoading(false);
        return;
      }

      const mapped: RecipeDetails = {
        id: recipeRow.id,
        title: recipeRow.title,
        short_description: recipeRow.short_description,
        image_url: recipeRow.image_url,
        authorId: recipeRow.authorId,
        authorUsername: recipeRow.profiles?.username ?? null,
        authorName: buildAuthorName(recipeRow),
        prep_time: recipeRow.prep_time,
        cook_time: recipeRow.cook_time,
        servings: recipeRow.servings,
        difficulty: recipeRow.difficulty,
        created_at: recipeRow.created_at,
        updated_at: recipeRow.updated_at,
        ingredients:
          recipeRow.recipe_ingredients?.map((ing) => ({
            id: String(ing.id),
            name: ing.name,
            amount: String(ing.amount),
            unit: ing.unit ?? undefined,
            note: ing.notes ?? undefined,
          })) ?? [],
        steps:
          recipeRow.recipe_steps?.map((step) => ({
            id: `step-${step.index}`,
            index: step.index,
            description: step.text,
          })) ?? [],
        tags:
          recipeRow.recipe_tags?.map(
            (t: { tags: { name: string } }) => t.tags.name
          ) ?? [],
      };

      setRecipe(mapped);
      setLoading(false);
    };

    fetchRecipe();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const fetchLikes = async () => {
      try {
        // buscar todos os likes desta recipe
        const { data, error } = await supabase
          .from("recipe_likes")
          .select("auth_id")
          .eq("recipe_id", id);

        if (error) {
          console.error("Error fetching likes:", error);
          return;
        }

        const count = data?.length ?? 0;
        setLikesCount(count);

        if (currentUserId) {
          const alreadyLiked = data?.some(
            (row) => row.auth_id === currentUserId
          );
          setLikedByUser(!!alreadyLiked);
        } else {
          setLikedByUser(false);
        }
      } catch (err) {
        console.error("Unexpected error fetching likes:", err);
      }
    };

    fetchLikes();
  }, [id, currentUserId]);

  useEffect(() => {
    if (!id) return;

    const fetchReviews = async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          id,
          difficulty,
          prep_time,
          taste,
          average_rating,
          description,
          profiles!reviews_author_id_fkey(first_name, last_name, chef_type)
        `)
        .eq("recipe_id", id);

      if (error) {
        console.error("Error fetching reviews:", error);
        return;
      }

      const mapped = (data || []).map((review) => ({
        ...review,
        profiles: Array.isArray(review.profiles) ? review.profiles[0] : review.profiles,
        average_rating: review.average_rating ?? 0,
      })) as ReviewData[];

      setReviews(mapped);

      if (mapped.length > 0) {
        const avgDiff = mapped.reduce((sum, r) => sum + r.difficulty, 0) / mapped.length;
        const avgPrep = mapped.reduce((sum, r) => sum + r.prep_time, 0) / mapped.length;
        const avgTst = mapped.reduce((sum, r) => sum + r.taste, 0) / mapped.length;
        const overall = (avgDiff + avgPrep + avgTst) / 3;

        setAvgDifficulty(avgDiff);
        setAvgPrepTime(avgPrep);
        setAvgTaste(avgTst);
        setOverallRating(overall);
      }
    };

    fetchReviews();
  }, [id]);

  const heroImage = useMemo(
    () => recipeImageUrl(recipe?.image_url ?? null, 900),
    [recipe?.image_url]
  );

  const isAuthor = !!recipe && currentUserId === recipe.authorId;

  const handleEdit = () => {
    if (!recipe) return;
    navigate(`/upload-recipe?recipeId=${recipe.id}`);
  };

  const handleDelete = async () => {
    if (!recipe || !isAuthor || !currentUserId) return;

    const confirmed = window.confirm(
      "Delete this recipe? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      if (recipe.image_url) {
        await deleteImage(recipe.image_url);
      }
      const { error } = await supabase
        .from("recipes")
        .delete()
        .eq("id", recipe.id)
        .eq("authorId", currentUserId);

      if (error) throw error;
      navigate("/");
    } catch (err) {
      console.error("Failed to delete recipe", err);
      alert("Couldn't delete the recipe. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleLike = async () => {
    if (!recipe) return;
    if (!currentUserId) {
      alert("You need to login to like a recipe.");
      return;
    }

    setLikeLoading(true);
    try {
      if (likedByUser) {
        // tirar like
        const { error } = await supabase
          .from("recipe_likes")
          .delete()
          .eq("recipe_id", recipe.id)
          .eq("auth_id", currentUserId);

        if (error) throw error;

        setLikedByUser(false);
        setLikesCount((prev) => Math.max(0, prev - 1));
      } else {
        // dar like
        const { error } = await supabase
          .from("recipe_likes")
          .insert({
            recipe_id: recipe.id,
            auth_id: currentUserId,
          });

        if (error) throw error;

        setLikedByUser(true);
        setLikesCount((prev) => prev + 1);
      }
    } catch (err) {
      console.error("Error toggling like:", err);
      alert("It was not possible to update the like. Try again.");
    } finally {
      setLikeLoading(false);
    }
  };


  if (loading) return <Loader message="Whisking the recipe..." />;
  if (!recipe)
    return (
      <div className="min-h-screen bg-bright flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-3xl font-heading-styled text-secondary">
            Recipe not found
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-lg bg-main text-bright font-heading"
          >
            Go back
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-bright text-dark">
      {showLevelUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-bright rounded-2xl p-8 shadow-2xl border-4 border-main max-w-md mx-4 text-center animate-bounce-in">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-heading-styled text-main mb-2">Congratulations!</h2>
            <p className="text-xl font-heading text-secondary mb-4">
              You've reached Level {newLevel}
            </p>
            <p className="text-lg font-body text-dark mb-2">
              You are now a <span className="font-semibold text-main">{newChefType}</span>
            </p>
            <p className="text-sm font-body text-dark/70">+{xpGained} XP</p>
          </div>
        </div>
      )}
      {showXpToast && !leveledUp && (
        <div className="fixed bottom-6 right-6 z-50 bg-main text-bright px-6 py-3 rounded-lg shadow-lg font-heading animate-fade-in">
          🎉 Great job! You earned {xpGained} XP
        </div>
      )}
      <div className="pt-24 pb-16 px-4 sm:px-10 max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-10">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
            <div className="flex-1 min-w-[260px] space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center rounded-lg bg-main/10 text-main border border-main px-4 py-1 font-heading">
                  Level {recipe.difficulty ?? 1}
                </span>
                <div className="flex gap-2 flex-wrap">
                  {recipe.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1.5 rounded-lg border border-secondary/40 text-secondary text-sm font-heading"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                  <button
                    onClick={handleToggleLike}
                    disabled={likeLoading || !currentUserId}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 border font-heading text-sm transition-colors ${
                      likedByUser
                        ? "bg-main text-bright border-main"
                        : "bg-white text-main border-main hover:bg-main/10"
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    <span>{likedByUser ? "🤍 Liked" : "💖 Like"}</span>
                    <span className="text-xs text-dark/80">
                      {likesCount} {likesCount === 1 ? "like" : "likes"}
                    </span>
                </button>
              </div>
              <h1 className="text-4xl sm:text-5xl font-heading-styled text-secondary mt-8">
                {recipe.title}
              </h1>
            </div>

            <div className="flex gap-2 self-start">
              {isAuthor ? (
                <>
                  <button
                    onClick={handleEdit}
                    className="inline-flex items-center gap-2 rounded-lg border border-secondary px-4 py-1 font-heading text-secondary hover:bg-secondary hover:text-bright transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="inline-flex items-center gap-2 rounded-lg bg-danger/80 px-4 py-1 font-heading text-bright hover:bg-danger focus:ring-none  disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                </>
              ) : currentUserId && (
                <button
                  onClick={() => setShowReportModal(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-dark/20 px-4 py-1 font-heading text-dark/60 hover:text-main hover:border-main transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                  </svg>
                  Report Recipe
                </button>
              )}
            </div>
          </div>

          {/* Description + Ratings Card */}
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <p className="text-dark/70 font-body flex-1">
              {recipe.short_description}
            </p>
            <aside className="w-full lg:w-80 bg-white/70 border border-main/40 rounded-2xl p-6 shadow-sm">
              <h2 className="mb-4 text-2xl font-heading-styled text-main text-center">
                Rating
              </h2>
              <ul className="space-y-3 font-body text-dark mb-6">
                <li className="flex justify-between">
                  <span className="font-semibold">Difficulty</span>
                  <span>
                    <span className="text-dark">{avgDifficulty.toFixed(1)}</span>
                    <span className="text-main">/5</span>
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="font-semibold">Time Required</span>
                  <span>
                    <span className="text-dark">{avgPrepTime.toFixed(1)}</span>
                    <span className="text-main">/5</span>
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="font-semibold">Quality and Taste</span>
                  <span>
                    <span className="text-dark">{avgTaste.toFixed(1)}</span>
                    <span className="text-main">/5</span>
                  </span>
                </li>
              </ul>
              <div className="flex items-center justify-center gap-2 pt-4 border-t border-main/20">
                <StarRating rating={overallRating} />
                <span className="text-lg font-heading text-dark">{overallRating.toFixed(1)}</span>
              </div>
              {currentUserId && !isAuthor && !isAdmin && (
                <button
                  className="mt-4 w-full bg-main hover:bg-secondary text-bright font-heading text-sm py-1.5 rounded-lg transition-colors"
                  onClick={() => navigate(`/review/${recipe.id}`)}
                >
                  Review Recipe
                </button>
              )}
            </aside>
          </div>
        </header>

        {/* Image + Ingredients */}
        <section className="flex flex-col lg:flex-row gap-8 mb-12">
          <div className="flex-1">
            {heroImage && (
              <div className="rounded-2xl overflow-hidden shadow-lg border border-secondary/20">
                <img
                  src={heroImage}
                  alt={recipe.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 font-heading text-sm text-dark/80">
              <Stat label="Prep time" value={`${recipe.prep_time} min`} />
              <Stat label="Cook time" value={`${recipe.cook_time} min`} />
              <Stat label="Servings" value={recipe.servings} />
              <AuthorStat
                label="Author"
                username={recipe.authorUsername}
                displayName={recipe.authorName}
              />
            </div>
          </div>

          <aside className="w-full lg:w-80 bg-white/70 border border-main/40 rounded-2xl p-6 shadow-sm">
            <h2 className="mb-4 text-2xl font-heading-styled text-main text-center">
              Ingredients
            </h2>
            <ul className="space-y-3 font-body text-dark">
              {recipe.ingredients.map((ing) => (
                <li key={ing.id} className="flex gap-2">
                  <span className="text-main">•</span>
                  <div>
                    <span className="font-semibold">{ing.name}</span>
                    {ing.amount && (
                      <>
                        {" "}-{" "}
                        <span className="text-main">
                          {ing.amount} {ing.unit ?? ""}
                        </span>
                      </>
                    )}
                    {ing.note && (
                      <p className="text-xs text-dark/50 mt-0.5">{ing.note}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </aside>
        </section>

        {/* Steps */}
        <section className="space-y-6">
          {recipe.steps
            .sort((a, b) => a.index - b.index)
            .map((step) => (
              <article
                key={step.id}
                className="bg-white/80 border border-main/30 rounded-2xl p-6 shadow-sm"
              >
                <h3 className="text-2xl font-heading-styled text-main mb-2">
                  Step {step.index}
                </h3>
                <p className="text-dark font-body leading-relaxed">
                  {step.description}
                </p>
              </article>
            ))}
        </section>

        {/* Reviews */}
        <section className="mt-16">
          <h2 className="text-3xl font-heading-styled text-secondary mb-8">Reviews</h2>
          {reviews.length === 0 ? (
            <p className="text-dark/60 font-body text-center py-8">No reviews yet. Be the first to review this recipe!</p>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <Review key={review.id} review={review} />
              ))}
            </div>
          )}
        </section>

        {/* Created / Last edited notes */}
        <div className="mt-6 text-xs text-dark/60 flex flex-col sm:flex-row sm:justify-end gap-2">
          <span>
            Created at{" "}
            {recipe.created_at
              ? new Date(recipe.created_at).toLocaleString()
              : "--"}
          </span>
          <span>
            Last edited at{" "}
            {recipe.updated_at
              ? new Date(recipe.updated_at).toLocaleString()
              : "--"}
          </span>
        </div>
      </div>
      
      {recipe && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          itemType="recipe"
          itemId={recipe.id}
        />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="rounded-xl bg-white/70 border border-secondary/20 p-3 text-center shadow-sm">
      <p className="text-xs uppercase tracking-wide text-secondary/60 font-heading">
        {label}
      </p>
      <p className="text-lg font-heading text-secondary">{value ?? "--"}</p>
    </div>
  );
}

function AuthorStat({
  label,
  username,
  displayName,
}: {
  label: string;
  username: string | null;
  displayName: string;
}) {
  return (
    <div className="rounded-xl bg-white/70 border border-secondary/20 p-3 text-center shadow-sm">
      <p className="text-xs uppercase tracking-wide text-secondary/60 font-heading">
        {label}
      </p>
      {username ? (
        <Link
          to={`/profile/${username}`}
          className="text-lg font-heading text-main hover:text-secondary transition-colors"
        >
          {displayName}
        </Link>
      ) : (
        <p className="text-lg font-heading text-secondary/70">{displayName || "Unknown"}</p>
      )}
    </div>
  );
}

function buildAuthorName(row: RecipeRow): string {
  const first = row.profiles?.first_name?.trim() ?? "";
  const last = row.profiles?.last_name?.trim() ?? "";
  const combined = `${first} ${last}`.trim();
  if (combined) return combined;
  return row.profiles?.username ?? "Unknown author";
}

function StarRating({ rating }: { rating: number }) {
  const stars = [];
  const safeRating = Math.max(0, Math.min(5, rating));
  
  for (let i = 1; i <= 5; i++) {
    const isFilled = i <= Math.floor(safeRating);
    const isPartial = i === Math.ceil(safeRating) && safeRating % 1 !== 0;
    const fillPercent = isPartial ? (safeRating % 1) * 100 : (isFilled ? 100 : 0);
    
    stars.push(
      <svg
        key={i}
        className="w-6 h-6"
        viewBox="0 0 24 24"
        fill="none"
      >
        <defs>
          <linearGradient id={`star-gradient-${i}-${rating}`}>
            <stop offset={`${fillPercent}%`} stopColor="#FF6B35" />
            <stop offset={`${fillPercent}%`} stopColor="#E5E7EB" />
          </linearGradient>
        </defs>
        <path
          d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
          fill={`url(#star-gradient-${i}-${rating})`}
          stroke="#FF6B35"
          strokeWidth="1"
        />
      </svg>
    );
  }
  return <div className="flex gap-1">{stars}</div>;
}

function Review({ review }: { review: ReviewData }) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportItemType, setReportItemType] = useState<"review" | "comment">("review");
  const [reportItemId, setReportItemId] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);

  const chefType = review.profiles?.chef_type || "Cook";
  const reviewerName = review.profiles
    ? `${review.profiles.first_name || ""} ${review.profiles.last_name || ""}`.trim() || "Anonymous"
    : "Anonymous";
  const avgRating = Number(review.average_rating) || 0;

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setCurrentUserId(data?.user?.id ?? null);
      
      if (data?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("auth_id", data.user.id)
          .single();
        setIsAdmin(profile?.is_admin || false);
      }
    });
  }, []);

  useEffect(() => {
    const fetchComments = async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("id, body, created_at, author_id")
        .eq("review_id", review.id)
        .order("created_at", { ascending: true });

      if (!error && data) {
        const authorIds = data.map((c: any) => c.author_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("auth_id, username, first_name, last_name")
          .in("auth_id", authorIds);

        const profileMap = new Map(profiles?.map(p => [p.auth_id, p]) || []);

        setComments(
          data.map((c: any) => ({
            id: c.id,
            body: c.body,
            created_at: c.created_at,
            author: profileMap.get(c.author_id) || null,
          }))
        );
      }
    };

    fetchComments();
  }, [review.id]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !currentUserId) return;

    setSubmitting(true);
    const { data, error } = await supabase
      .from("comments")
      .insert({
        review_id: review.id,
        author_id: currentUserId,
        body: newComment.trim(),
      })
      .select("id, body, created_at, author_id")
      .single();

    setSubmitting(false);

    if (!error && data) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, first_name, last_name")
        .eq("auth_id", currentUserId)
        .single();

      setComments((prev) => [
        ...prev,
        {
          id: data.id,
          body: data.body,
          created_at: data.created_at,
          author: profile || null,
        },
      ]);
      setNewComment("");
    }
  };

  return (
    <div className="bg-white/80 border border-main/30 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-heading text-dark">
          <span className="text-main">{chefType}</span> — {reviewerName}
        </h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <StarRating rating={avgRating} />
            <span className="text-sm font-heading text-dark">{avgRating.toFixed(1)}</span>
          </div>
          <button
            onClick={() => {
              setReportItemType("review");
              setReportItemId(review.id);
              setShowReportModal(true);
            }}
            className="text-dark/40 hover:text-main transition-colors"
            title="Report review"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-4 text-sm font-body">
        <div>
          <span className="text-dark/60">Difficulty: </span>
          <span className="text-dark">{review.difficulty}</span>
          <span className="text-main">/5</span>
        </div>
        <div>
          <span className="text-dark/60">Time Required: </span>
          <span className="text-dark">{review.prep_time}</span>
          <span className="text-main">/5</span>
        </div>
        <div>
          <span className="text-dark/60">Quality & Taste: </span>
          <span className="text-dark">{review.taste}</span>
          <span className="text-main">/5</span>
        </div>
      </div>
      {review.description && (
        <p className="text-dark/80 font-body mb-4">{review.description}</p>
      )}

      <button
        onClick={() => setShowComments(!showComments)}
        className="flex items-center gap-2 text-sm font-heading text-main hover:text-secondary transition-colors mb-4"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
        </svg>
        See comments
      </button>
      
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        itemType={reportItemType}
        itemId={reportItemId}
      />

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-main/20">
          <h4 className="text-sm font-heading text-secondary mb-3">Comments ({comments.length})</h4>
        
        <div className="space-y-3 mb-4">
          {comments.map((comment) => {
            const authorName = comment.author
              ? `${comment.author.first_name || ""} ${comment.author.last_name || ""}`.trim() || comment.author.username || "Anonymous"
              : "Anonymous";
            return (
              <div key={comment.id} className="bg-bright/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-heading text-main">{authorName}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-dark/50">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => {
                        setReportItemType("comment");
                        setReportItemId(comment.id);
                        setShowReportModal(true);
                      }}
                      className="text-dark/40 hover:text-main transition-colors"
                      title="Report comment"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="text-sm font-body text-dark">{comment.body}</p>
              </div>
            );
          })}
        </div>

        {currentUserId && !isAdmin && (
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
              placeholder="Add a comment..."
              className="flex-1 rounded-lg border border-dark/20 px-3 py-2 text-sm font-body outline-none focus:ring-2 focus:ring-main"
            />
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim() || submitting}
              className="bg-main hover:bg-secondary text-bright px-4 py-2 rounded-lg text-sm font-heading disabled:opacity-50"
            >
              {submitting ? "..." : "Post"}
            </button>
          </div>
        )}
        </div>
      )}
    </div>
  );
}
