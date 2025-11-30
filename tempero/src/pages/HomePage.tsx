import { useEffect, useState } from "react";
import RecipeCard from "../components/RecipeCard";
import ReviewCard from "../components/ReviewCard";
import { supabase } from "../config/supabaseClient";
import type { RecipePreview } from "../types/Recipe";
import { fetchRecentReviews, type ReviewFeedItem } from "../types/Review";


export default function HomePage() {
  const previewSize = 10;
  const [recentRecipes, setRecentRecipes] = useState<RecipePreview[]>([]);
  const [recentReviews, setRecentReviews] = useState<ReviewFeedItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [followingIds, setFollowingIds] = useState<string[] | null>(null);
  const [feedItems, setFeedItems] = useState<
    Array<
      | { kind: "recipe"; date: string | null; data: RecipePreview }
      | { kind: "review"; date: string | null; data: ReviewFeedItem }
    >
  >([]);

  useEffect(() => {
    const fetchRecentRecipes = async () => {
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(previewSize);

      if (error) {
        console.error("Error fetching recent recipes:", error);
      } else {
        setRecentRecipes(data );
      }
    };

    fetchRecentRecipes();
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
    supabase
      .from("followers")
      .select("followed_id")
      .eq("follower_id", userId)
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          console.error("Error fetching follow relationships:", error);
          setFollowingIds([]);
          return;
        }
        const ids = (data ?? []).map((row: any) => row.followed_id).filter(Boolean);
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

  return (
  <div className="main-section bg-bright min-h-screen flex flex-col items-center justify-start py-10 px-5 space-y-15">

      <div className="feed-preview-container flex flex-col max-w-full ">
        <div className="feed-preview-header mb-2">
        <h2 className="text-4xl font-heading-styled w-fit text-gradient-to-r py-2 ">What's new?</h2>
        </div>
      <div className="feed-preview-list flex flex-row max-w-full gap-6  bg-white rounded-lg shadow-lg overflow-x-scroll p-6  custom-scroll">
        {feedItems.map((item, idx) => (
          <div key={`${item.kind}-${(item.data as any).id ?? idx}`}>
            {item.kind === "review" ? (
              <ReviewCard review={item.data as ReviewFeedItem} className="min-w-[300px]" />
            ) : (
              <RecipeCard recipe={item.data as RecipePreview} backgroundColor="bright" />
            )}
          </div>
        ))}
        </div>
      </div>

      <div className="suggestions-preview-container flex flex-col md:items-center ">
        <div className="suggestions-preview-header mb-6 text-center">
          <h2 className="text-4xl font-heading-styled text-gradient-to-r py-2 mx-auto">
            Suggestions for you!
          </h2>
          <b className="font-body font-thin text-dark">
            Recipe selection curated to increase your experience level
          </b>
        </div>

        <div className="suggestions-preview-list flex flex-row gap-4 min-h-50 bg-white rounded-lg shadow-lg overflow-x-auto custom-scroll pb-4 w-full">
          {/* ... */}
        </div>
      </div>

      <div className="suggestions-preview-container flex flex-col md:items-end ">
        <div className="suggestions-preview-header  md:text-right mb-2">
        <h2 className="text-4xl font-heading-styled w-fit text-gradient-to-r   py-2 ">Popular recipes!</h2>

        </div>
        <div className="suggestions-preview-list flex flex-row gap-4 min-h-50 bg-white rounded-lg shadow-lg overflow-x-auto custom-scroll pb-4 w-full">
          {/* Suggetion preview items would go here */}
        </div>
      </div>

    </div>
  );
}
