import { useEffect, useState } from "react";
import { supabase } from "../config/supabaseClient";
import Loader from "./Loader";
import ReportModal from "./ReportModal";

type Review = {
  id: number;
  author_id: string;
  profiles: {
    first_name: string;
    last_name: string;
  };
  review: number;
  description: string;
  recipe_id: number;
  recipes: {
    title: string;
  };
};

type ReviewsProps = {
  userId?: string;
  username?: string;
};

export default function Reviews({ userId }: ReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      let query = supabase
        .from("reviews")
        .select(
          `id,author_id,profiles(first_name, last_name),review,description,recipe_id,recipes(title)`
        );
      if (userId) query = query.eq("author_id", userId);
      const { data, error } = await query.order("id", { ascending: false });
      if (error) console.error("Error fetching reviews:", error);
      else setReviews(data as unknown as Review[]);
      setLoading(false);
    };
    fetchReviews();
  }, [userId]);

  if (loading) return <Loader message="Fetching reviews..." />;

  return (
    <div className="space-y-4">
      {reviews.map((rev) => (
        <article
          key={rev.id}
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-[#e57f22]">
              {rev.profiles.first_name} {rev.profiles.last_name}
            </h4>
            <h5 className="text-gray-500 text-sm">{rev.recipes.title}</h5>
            <span className="text-yellow-500">
              {"★".repeat(rev.review)}
              {"☆".repeat(5 - rev.review)}
            </span>
          </div>
          <p className="mt-2 text-gray-700 text-sm leading-relaxed">
            {rev.description}
          </p>
          <button
            onClick={() => {
              setSelectedReviewId(rev.id.toString());
              setReportModalOpen(true);
            }}
            className="mt-2 text-xs text-gray-500 hover:text-[#e57f22] transition-colors"
          >
            🚩 Report
          </button>
        </article>
      ))}
      
      {selectedReviewId && (
        <ReportModal
          isOpen={reportModalOpen}
          onClose={() => {
            setReportModalOpen(false);
            setSelectedReviewId(null);
          }}
          itemType="review"
          itemId={selectedReviewId}
        />
      )}
    </div>
  );
}
