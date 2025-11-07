import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../config/supabaseClient";
import Recipes from "../components/Recipes";
import Reviews from "../components/Reviews";
import chefImg from "../assets/febrian-zakaria-SiQgni-cqFg-unsplash.jpg";

type Badge = { label: string; icon: string };
const badges: Badge[] = [
  { label: "Master Chef", icon: "👨‍🍳" },
  { label: "Bake Off", icon: "🧁" },
  { label: "Sous Chef", icon: "🔪" },
  { label: "Vegetarian", icon: "🥕" },
];

type Profile = {
  auth_id: string;
  username: string;
  first_name?: string | null;
  last_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
};

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [tab, setTab] = useState<"recipes" | "reviews">("recipes");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!username) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      const { data, error: fetchErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .maybeSingle();

      if (cancelled) return;
      setLoading(false);

      if (fetchErr) {
        setError(fetchErr.message);
        setProfile(null);
        return;
      }
      if (!data) {
        setError("User not found.");
        setProfile(null);
        return;
      }
      setProfile(data as Profile);
    })();

    return () => {
      cancelled = true;
    };
  }, [username]);

  const displayName =
    (profile?.first_name || profile?.last_name)
      ? `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim()
      : profile?.username ?? "Unnamed User";

  return (
    <div className="min-h-screen w-full bg-amber-50 flex justify-center items-start py-10">
    <section className="w-full flex flex-col lg:flex-row items-start justify-center gap-8 mt-10 px-4 sm:px-6 lg:px-10">
      {/* Left card */}
      <article className="w-full lg:w-1/3 rounded-xl bg-white shadow-md ring-1 ring-black/5 p-5 sm:p-7">
        {loading ? (
          <div>Loading…</div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : !profile ? (
          <div>No profile to display.</div>
        ) : (
          <>
            <div className="flex gap-4 sm:gap-6">
              <img
                src={profile.avatar_url || chefImg}
                alt={displayName}
                className="h-24 w-24 sm:h-28 sm:w-28 rounded-lg object-cover ring-1 ring-black/10"
              />
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-semibold text-[#e57f22]">
                  {displayName}
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
              {profile.bio?.trim() || "This user has not provided a bio yet."}
            </p>
          </>
        )}
        {/* Edit profile button */}
        <button className="mt-6 w-full bg-[#e57f22] hover:bg-[#cf6e1d] text-white text-sm sm:text-base font-medium py-2.5 rounded-md transition-colors"
        onClick={() => navigate("/profile/edit")}
        >
          Edit profile
        </button>
      </article>

      {/* Right side: Tabs + content */}
      <div className="w-full lg:w-2/3">
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

        {/* Pass identifiers to child components so they can query Supabase */}
        {tab === "recipes" ? (
          <Recipes userId={profile?.auth_id} username={profile?.username} />
        ) : (
          <Reviews userId={profile?.auth_id} username={profile?.username} />
        )}
      </div>
    </section>
    </div>
  );
}
