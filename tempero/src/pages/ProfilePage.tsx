import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../config/supabaseClient";

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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      // Replace "profiles" with your table name; ensure it has a "username" column
      const { data, error: fetchErr } = await supabase
        .from<Profile>("profiles")
        .select("*")
        .eq("username", username)
        .maybeSingle();

      if (cancelled) return;
      setLoading(false);

      if (fetchErr) {
        setError(fetchErr.message);
        console.error("Profile fetch error:", fetchErr);
        setProfile(null);
        return;
      }

      if (!data) {
        setError("User not found.");
        setProfile(null);
        return;
      }

      setProfile(data);
    })();

    return () => {
      cancelled = true;
    };
  }, [username]);

  return (
    <section className="w-full flex items-start justify-center mt-10 px-4 sm:px-6 lg:px-8">
      <article className="w-full max-w-3xl rounded-xl bg-white shadow-md ring-1 ring-black/5 p-5 sm:p-7">
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : profile ? (
          <>
            <div className="flex gap-4 sm:gap-6">
              <img
                src={profile.avatar_url ?? chefImg}
                alt={profile.username ?? "User avatar"}
                className="h-24 w-24 sm:h-28 sm:w-28 rounded-lg object-cover ring-1 ring-black/10"
              />
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-semibold text-[#e57f22]">
                  {profile.first_name || profile.username || "Unnamed User"}{" "}
                  {profile.last_name ? profile.last_name : ""}
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
              {profile.bio ??
                `This user has not provided a bio yet.`}
            </p>
          </>
        ) : (
          <div>No profile to display.</div>
        )}
      </article>
    </section>
  );
}
