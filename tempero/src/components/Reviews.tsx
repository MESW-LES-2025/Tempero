type ReviewsProps = {
  userId?: string;
  username?: string;
};

type Review = {
  id: number;
  author: string;
  rating: number;
  comment: string;
};

export default function Reviews({ userId, username }: ReviewsProps) {
  console.log("Reviews filtering by:", userId, username);

const reviews: Review[] = [
  {
    id: 1,
    author: "Julia Child",
    rating: 2,
    comment:
      "Auguste Escoffier revolutionized the way we perceive cooking. His precision and simplicity inspire chefs even today.",
  },
  {
    id: 2,
    author: "Gordon Ramsay",
    rating: 5,
    comment:
      "A master of discipline and creativity — Escoffier’s techniques define culinary professionalism.",
  },
  {
    id: 3,
    author: "Heston Blumenthal",
    rating: 4,
    comment:
      "Brilliant mind and timeless influence. His philosophy of balance and respect for ingredients shaped modern gastronomy.",
  },
];

  return (
    <div className="space-y-4">
      {reviews.map((rev) => (
        <article
          key={rev.id}
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-[#e57f22]">{rev.author}</h4>
            <span className="text-yellow-500">
              {"★".repeat(rev.rating)}
              {"☆".repeat(5 - rev.rating)}
            </span>
          </div>

          <p className="mt-2 text-gray-700 text-sm leading-relaxed">
            {rev.comment}
          </p>
        </article>
      ))}
    </div>
  );
}
