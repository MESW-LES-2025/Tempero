import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../config/supabaseClient";
import { getLevelInfo } from "../utils/Levels";
import Loader from "../components/Loader";

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recipeTitle, setRecipeTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [difficulty, setDifficulty] = useState(0);
  const [timeRequired, setTimeRequired] = useState(0);
  const [qualityTaste, setQualityTaste] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchRecipe = async () => {
      const { data, error } = await supabase
        .from("recipes")
        .select("title")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching recipe:", error);
        setLoading(false);
        return;
      }

      setRecipeTitle(data?.title ?? null);
      setLoading(false);
    };

    fetchRecipe();
  }, [id]);

  async function handleSubmit() {
    if (!id) return;
    if (difficulty === 0 || timeRequired === 0 || qualityTaste === 0) {
      setError("Please rate all three categories before submitting.");
      return;
    }

    if (difficulty < 1 || difficulty > 5 || timeRequired < 1 || timeRequired > 5 || qualityTaste < 1 || qualityTaste > 5) {
      setError("All ratings must be between 1 and 5.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("You must be logged in to submit a review.");
        return;
      }

      const averageRating = parseFloat(((difficulty + timeRequired + qualityTaste) / 3).toFixed(4));

      const now = new Date().toISOString();
      const payload = {
        recipe_id: id,
        author_id: user.id,
        difficulty: Number(difficulty),
        prep_time: Number(timeRequired),
        taste: Number(qualityTaste),
        average_rating: Number(averageRating),
        description: reviewText.trim() || null,
        created_at: now,
        updated_at: now,
      };
      
      console.log("Review payload:", payload);
      console.log("Taste value type:", typeof payload.taste, "value:", payload.taste);

      const { error: insertError } = await supabase.from("reviews").insert(payload);

      if (insertError) {
        console.error("Insert error details:", JSON.stringify(insertError, null, 2));
        throw insertError;
      }

      // Update XP after successful review
      const { data: recipeData } = await supabase
        .from("recipes")
        .select("difficulty")
        .eq("id", id)
        .single();

      const { data: profileData } = await supabase
        .from("profiles")
        .select("xp, level")
        .eq("auth_id", user.id)
        .single();

      let xpGained = 0;
      let leveledUp = false;
      let newLevel = 1;
      let newChefType = "New Cook";
      if (recipeData && profileData) {
        const recipeDifficulty = recipeData.difficulty ?? 1;
        const userLevel = profileData.level ?? 1;
        const currentXp = profileData.xp ?? 0;

        xpGained = 100 + (recipeDifficulty - userLevel) * 20;
        const newXp = currentXp + xpGained;
        const levelInfo = getLevelInfo(newXp);

        leveledUp = levelInfo.level > userLevel;
        newLevel = levelInfo.level;
        newChefType = levelInfo.name;

        await supabase
          .from("profiles")
          .update({
            xp: newXp,
            level: levelInfo.level,
            chef_type: levelInfo.name,
          })
          .eq("auth_id", user.id);
      }

      navigate(`/recipe/${id}`, { state: { xpGained, leveledUp, newLevel, newChefType } });
    } catch (err: any) {
      console.error("Error submitting review:", err);
      setError(err?.message || "Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Loader message="Loading..." />;

  return (
    <div className="min-h-screen bg-bright">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-heading-styled text-secondary">
          Review recipe
        </h1>
        <p className="text-xl font-heading-styled text-dark mt-2">{recipeTitle ?? ""}</p>

        <div className="mt-8 space-y-6">
          <RatingCard
            title="Difficulty"
            description="How challenging was this recipe to follow?"
            rating={difficulty}
            onRate={setDifficulty}
          />
          <RatingCard
            title="Time Required"
            description="Was the cooking time accurate and reasonable?"
            rating={timeRequired}
            onRate={setTimeRequired}
          />
          <RatingCard
            title="Quality & Taste"
            description="How satisfied were you with the final result?"
            rating={qualityTaste}
            onRate={setQualityTaste}
          />

          <div className="bg-white/80 border border-main/30 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-heading text-secondary mb-2">Your Review</h2>
            <p className="text-sm font-body text-dark/70 mb-4">Share your experience with this recipe</p>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="w-full rounded-lg border border-dark/20 px-3 py-2 font-body outline-none focus:ring-2 focus:ring-main transition-all"
              rows={6}
              placeholder="Write your review here..."
            />
          </div>

          {error && (
            <div className="bg-danger/20 text-danger rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <button
            className="w-full bg-main hover:bg-secondary text-bright font-heading py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RatingCard({
  title,
  description,
  rating,
  onRate,
}: {
  title: string;
  description: string;
  rating: number;
  onRate: (rating: number) => void;
}) {
  return (
    <div className="bg-white/80 border border-main/30 rounded-2xl p-6 shadow-sm">
      <h2 className="text-xl font-heading text-secondary mb-2">{title}</h2>
      <p className="text-sm font-body text-dark/70 mb-4">{description}</p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onRate(star)}
            className="transition-transform hover:scale-110"
          >
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                fill={star <= rating ? "#FF6B35" : "#E5E7EB"}
                stroke="#FF6B35"
                strokeWidth="1"
              />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}