import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import chefImg from "../assets/febrian-zakaria-SiQgni-cqFg-unsplash.jpg";
import Recipes from "../components/Recipes";
import Reviews from "../components/Reviews";
import UserPlaylistsSection from "../components/UserPlaylistsSection";
import { supabase } from "../config/supabaseClient";

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
  level?: number | null;
  chef_type?: string | null;
};

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [tab, setTab] = useState<"recipes" | "reviews" | "lists">("recipes");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showFullBio, setShowFullBio] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUser(data?.user ?? null);
    })();
  }, []);

  const isOwnProfile =
    currentUser && profile ? currentUser.id === profile.auth_id : false;

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
    profile?.first_name || profile?.last_name
      ? `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim()
      : profile?.username ?? "Unnamed User";

  const bioText = profile?.bio || "";
  const shortBio = bioText.slice(0, 120);
  const shouldCollapse = bioText.length > 120;

  return (
    <div className="min-h-screen w-full bg-bright flex justify-center items-start py-10">
      <section className="w-full max-w-7xl flex flex-col lg:flex-row items-start justify-center gap-10 px-4 sm:px-6 lg:px-10">
        {/* LEFT CARD */}
        {/* LEFT CARD */}
        <article
          className="
    relative w-full lg:w-1/3 bg-white border border-secondary/30 
    rounded-xl shadow-sm px-4 sm:px-6 py-6
    flex flex-col items-center
  "
        >
          {/* Avatar overlapping card - stays where you placed it */}
          <img
            src={profile?.avatar_url || chefImg}
            alt={displayName}
            className="
      absolute left-0 sm:left-0 -top-0
      h-44 w-32 sm:h-48 sm:w-32 object-cover rounded-tl-lg rounded-br-lg
    "
          />

          {/* RIGHT SIDE OF AVATAR CONTENT */}
          <div
            className="
      w-full max-w-[320px]
      mt-2 sm:mt-6 
      mx-auto text-center flex flex-col items-end
    "
          >
            {/* Name */}
            <h1 className="font-heading-styled text-3xl text-secondary mb-2">
              {displayName}
            </h1>

            {/* Level */}
            {profile?.level && profile?.chef_type && (
              <div className="bg-bright text-dark py-1 px-4 rounded-lg shadow-sm w-fit mb-4 font-body">
                <span className="font-heading-styled font-semibold">
                  Level {profile.level}
                </span>{" "}
                ·{" "}
                <span className="text-main font-heading-styled font-semibold">
                  {profile.chef_type}
                </span>
              </div>
            )}

            {/* Followers / Following */}
            <div className="flex items-center justify-center gap-10 text-center font-body text-dark my-2">
              <div>
                <p className="text-lg text-main font-heading-styled font-semibold">
                  {profile?.followers_count ?? 0}
                </p>
                <p className="text-sm font-heading-styled">Followers</p>
              </div>

              <div>
                <p className="text-lg text-main font-heading-styled font-semibold">
                  {profile?.following_count ?? 0}
                </p>
                <p className="text-sm font-heading-styled">Following</p>
              </div>
            </div>

            {/* Follow button */}
            {!isOwnProfile && (
              <button className="mt-3 bg-dark text-bright px-5 py-1.5 rounded-lg font-heading-styled font-semibold hover:bg-secondary transition">
                Unfollow
              </button>
            )}

            {/* Dotted separator */}
            <div className="border-t border-dotted border-dark/40 w-full my-5"></div>

            {/* Badges */}
            <div
              className="
        w-full max-w-[300px]
        flex flex-wrap gap-3 justify-center 
        bg-white rounded-xl p-3 shadow-sm
      "
            >
              {badges.map((b, i) => (
                <span
                  key={i}
                  className="
            inline-flex items-center gap-2 px-3 py-1 rounded-md 
            bg-bright font-body text-dark text-sm
          "
                >
                  {b.icon} {b.label}
                </span>
              ))}
            </div>

            {/* Dotted separator */}
            <div className="border-t border-dotted border-dark/40 w-full my-5"></div>

            {/* BIO */}
            <p className="font-body text-dark leading-7 text-left">
              {showFullBio ? bioText : shortBio}
              {shouldCollapse && !showFullBio && "... "}
              {shouldCollapse && (
                <button
                  onClick={() => setShowFullBio(!showFullBio)}
                  className="text-main font-semibold ml-1"
                >
                  {showFullBio ? "Show less" : "Read more"}
                </button>
              )}
            </p>

            {/* Edit button */}
            {isOwnProfile && (
              <button
                className="
          my-6 w-full max-w-[460px] 
          bg-main hover:bg-secondary transition 
          text-bright font-heading-styled py-2.5 rounded-lg items-start
        "
                onClick={() => navigate("/profile/edit")}
              >
                Edit Profile
              </button>
            )}
          </div>
        </article>

        {/* RIGHT SIDE */}
        <div className="w-full lg:w-2/3">
          {/* Tabs */}
          <div className="flex gap-6 mb-5 border-b border-dark/10 font-heading text-lg">
            <button
              className={`pb-2 ${
                tab === "recipes"
                  ? "text-secondary border-b-2 border-secondary"
                  : "text-dark/60 hover:text-secondary"
              }`}
              onClick={() => setTab("recipes")}
            >
              Recipes
            </button>

            <button
              className={`pb-2 ${
                tab === "reviews"
                  ? "text-secondary border-b-2 border-secondary"
                  : "text-dark/60 hover:text-secondary"
              }`}
              onClick={() => setTab("reviews")}
            >
              Reviews
            </button>

            <button
              className={`pb-2 ${
                tab === "playlists"
                  ? "text-secondary border-b-2 border-secondary"
                  : "text-dark/60 hover:text-secondary"
              }`}
              onClick={() => setTab("playlists")}
            >
              Lists
            </button>
          </div>

          {/* Content */}
          {tab === "recipes" ? (
            <Recipes userId={profile?.auth_id} username={profile?.username} />
          ) : tab === "reviews" ? (
            <Reviews userId={profile?.auth_id} username={profile?.username} />
          ) : (
            <UserPlaylistsSection
              userId={profile?.auth_id}
              isOwnProfile={isOwnProfile}
            />
          )}
        </div>
      </section>
    </div>
  );
}
