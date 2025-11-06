import { useState } from "react";
import chefImg from "../assets/febrian-zakaria-SiQgni-cqFg-unsplash.jpg";
import Recipes from "../components/Recipes";
import Reviews from "../components/Reviews";

type Badge = { label: string; icon: string };
const badges: Badge[] = [
  { label: "Master Chef", icon: "👨‍🍳" },
  { label: "Bake Off", icon: "🧁" },
  { label: "Sous Chef", icon: "🔪" },
  { label: "Vegetarian", icon: "🥕" },
];

export default function ProfilePage() {
  const [tab, setTab] = useState<"recipes" | "reviews">("recipes");

  return (
    <section className="w-full flex flex-col lg:flex-row items-start justify-center gap-8 mt-10 px-4 sm:px-6 lg:px-10">
      {/* Lft */}
      <article className="w-full lg:w-1/3 rounded-xl bg-white shadow-md ring-1 ring-black/5 p-5 sm:p-7">
        <div className="flex gap-4 sm:gap-6">
          <img
            src={chefImg}
            alt="Auguste Escoffier"
            className="h-24 w-24 sm:h-28 sm:w-28 rounded-lg object-cover ring-1 ring-black/10"
          />
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#e57f22]">
              Auguste Escoffier
            </h1>

            <div className="mt-3 flex flex-wrap gap-2">
              {badges.map((b, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-md border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs sm:text-sm"
                >
                  <span aria-hidden>{b.icon}</span>
                  <span className="font-medium">{b.label}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="my-4 border-t border-dashed border-gray-300" />

        <p className="text-sm sm:text-base leading-7 text-slate-700">
          I am Auguste Escoffier, a French chef devoted to the art of refinement
          and balance in cuisine. I believe that great cooking is born from
          simplicity, discipline, and respect for ingredients. Throughout my
          life I have sought to bring order to the kitchen and elegance to every
          plate, creating dishes that honor both tradition and innovation. My
          passion lies in transforming the ordinary into the extraordinary, from
          a humble sauce to a timeless creation like Peach Melba. For me cooking
          is not just a craft, it is harmony, precision and pure joy.
        </p>
      </article>

      {/* R8 */}
      <div className="w-full lg:w-2/3">
        {/* Tgle */}
        <div className="flex gap-3 mb-5 border-b border-gray-200">
          <button
            className={`pb-2 text-sm sm:text-base font-medium ${
              tab === "recipes"
                ? "text-[#e57f22] border-b-2 border-[#e57f22]"
                : "text-gray-600 hover:text-[#e57f22]"
            }`}
            onClick={() => setTab("recipes")}
          >
            Recipes
          </button>
          <button
            className={`pb-2 text-sm sm:text-base font-medium ${
              tab === "reviews"
                ? "text-[#e57f22] border-b-2 border-[#e57f22]"
                : "text-gray-600 hover:text-[#e57f22]"
            }`}
            onClick={() => setTab("reviews")}
          >
            Reviews
          </button>
        </div>

        {tab === "recipes" ? <Recipes /> : <Reviews />}
      </div>
    </section>
  );
}
