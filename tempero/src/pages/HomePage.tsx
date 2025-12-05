import {  useEffect, useState } from "react";
import RecipeCard from "../components/RecipeCard";
import ReviewCard from "../components/ReviewCard";
import { supabase } from "../config/supabaseClient";
import type { RecipePreview } from "../types/Recipe";
import { fetchRecentRecipes, fetchRecipesByLevel, fetchPopularRecipes } from "../types/Recipe";
import { fetchRecentReviews, type ReviewFeedItem } from "../types/Review";
import { fetchFollowingIds } from "../utils/FollowingList";


export default function HomePage() {
  const previewSize = 10;
  const [recentRecipes, setRecentRecipes] = useState<RecipePreview[]>([]);
  const [recentReviews, setRecentReviews] = useState<ReviewFeedItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [followingIds, setFollowingIds] = useState<string[] | null>(null);
  const [suggestions, setSuggestions] = useState<RecipePreview[]>([]);
  const [popularRecipes, setPopularRecipes] = useState<RecipePreview[]>([]);

  const [feedItems, setFeedItems] = useState<
    Array<
      | { kind: "recipe"; date: string | null; data: RecipePreview }
      | { kind: "review"; date: string | null; data: ReviewFeedItem }
    >
  >([]);

  useEffect(() => {
    fetchRecentRecipes(previewSize).then(setRecentRecipes);
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUserId(data.user?.id ?? null);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    if (!userId) {
      setFollowingIds([]);
      return;
    }
    fetchFollowingIds(userId).then((ids) => {
      if (!mounted) return;
      setFollowingIds(ids);
    });
    return () => {
      mounted = false;
    };
  }, [userId]);

  useEffect(() => {
    let mounted = true;
    if (followingIds === null) return;
    if (followingIds.length === 0) {
      setRecentReviews([]);
      return;
    }
    fetchRecentReviews(previewSize, followingIds).then((items) => {
      if (mounted) setRecentReviews(items);
    });
    return () => {
      mounted = false;
    };
  }, [followingIds]);

  // Merge and sort recipes + reviews by date so the feed keeps chronological order.
  useEffect(() => {
    const merged: Array<
      | { kind: "recipe"; date: string | null; data: RecipePreview }
      | { kind: "review"; date: string | null; data: ReviewFeedItem }
    > = [
      ...recentRecipes.map((r) => ({
        kind: "recipe" as const,
        date: (r as any)?.updated_at ?? (r as any)?.created_at ?? null,
        data: r,
      })),
      ...recentReviews.map((rev) => ({
        kind: "review" as const,
        date:
          (rev as any)?.created_at ??
          (rev as any)?.updated_at ??
          null,
        data: rev,
      })),
    ];

    merged.sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return db - da;
    });

    setFeedItems(merged);
  }, [recentRecipes, recentReviews]);

  useEffect(() => {
    // Fetch recipe suggestions based on user's experience level (equal level and some a level above)
    const fetchSuggestions = async () => {
      if (!userId) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("level")
        .eq("auth_id", userId)
        .single();
      if (error || !data) return;
      const userLevel = data.level;

      const levelSuggestions = await fetchRecipesByLevel(userLevel);
      const nextLevelSuggestions = await fetchRecipesByLevel(userLevel + 1);
      const combined = [...levelSuggestions, ...nextLevelSuggestions];
      setSuggestions(combined);
    };

    fetchSuggestions();
    }, [userId]);

  useEffect(() => {
      // Fetch popular recipes
      const fetchPopular = async () => {
        const popular = await fetchPopularRecipes(15);
        setPopularRecipes(popular);
        console.log(popular);
      };
      fetchPopular();
    }, []);

  return (
  <div className="main-section bg-bright min-h-screen flex flex-col items-center justify-start py-10 px-5 space-y-15">

      <div className="feed-preview-container flex flex-col max-w-full ">
        <div className="feed-preview-header mb-2">
        <h2 className="text-4xl font-heading-styled w-fit text-gradient-to-r py-2 ">What's new?</h2>
        </div>
        <div className="feed-preview-list flex flex-row gap-6 bg-white rounded-lg shadow-lg overflow-x-scroll p-6 custom-scroll w-full h-120">
        {feedItems.map((item, idx) => (
          <div key={`${item.kind}-${(item.data as any).id ?? idx}`}>
            {item.kind === "review" ? (
              <ReviewCard review={item.data as ReviewFeedItem} className="min-w-[300px]"  />
            ) : (
              <RecipeCard
                recipe={item.data as RecipePreview}
                backgroundColor={"var(--color-bright)"}
              />
            )}
          </div>
        ))}
        </div>
      </div>

      <div className="suggestions-preview-container flex flex-col md:items-center w-full">
        <div className="suggestions-preview-header mb-6 text-center">
          <h2 className="text-4xl font-heading-styled text-gradient-to-r py-2 mx-auto">
        Suggestions for you!
          </h2>
          <b className="font-body font-thin text-dark">
        Recipe selection curated to increase your experience level
          </b>
        </div>

        <div className="feed-preview-list flex flex-row gap-6 bg-white rounded-lg shadow-lg overflow-x-scroll p-6 custom-scroll w-full h-120">
          {suggestions.map((recipe) => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          backgroundColor="var(--color-bright)"
        />
          ))}
        </div>
      </div>

      <div className="suggestions-preview-container flex flex-col md:items-end w-full">
        <div className="suggestions-preview-header  md:text-right mb-2">
          <h2 className="text-4xl font-heading-styled w-fit text-gradient-to-r   py-2 ">Popular recipes!</h2>
        </div>
        <div className="feed-preview-list flex flex-row gap-6 bg-white rounded-lg shadow-lg overflow-x-scroll p-6 custom-scroll w-full h-120">
          {popularRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              backgroundColor="var(--color-bright)"
            />
              ))}
        </div>
      </div>
    </div>
  );
}
