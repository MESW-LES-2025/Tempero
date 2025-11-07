import { useEffect, useState } from "react";
import { supabase } from "../config/supabaseClient";

type Review = {
  id: number;
  author: string;
  rating: number;
  comment: string;
};

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select(
          `id,author_id,profiles(first_name, last_name),review,description,recipe_id,recipes(title)`
        )
        .order("id", { ascending: false });
      if (error) console.error("Error fetching reviews:", error);
      else setReviews(data as Review[]);
      setLoading(false);
    };
    fetchReviews();
  }, []);

  if (loading) return <p>Loading reviews...</p>;

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
        </article>
      ))}
    </div>
  );
}
