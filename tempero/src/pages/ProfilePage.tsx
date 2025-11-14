import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import chefImg from "../assets/febrian-zakaria-SiQgni-cqFg-unsplash.jpg";
import Loader from "../components/Loader";
import Recipes from "../components/Recipes";
import Reviews from "../components/Reviews";
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
  profile_picture_url?: string | null;
};

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [tab, setTab] = useState<"recipes" | "reviews">("recipes");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [followLoading, setFollowLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!username) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!cancelled) setCurrentUser(user);

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

      // Check if current user is following this profile (only for other users)
      if (user && data && user.id !== data.auth_id) {
        const { data: followData } = await supabase
          .from("followers")
          .select("follower_id")
          .eq("follower_id", user.id)
          .eq("followed_id", data.auth_id)
          .maybeSingle();
        
        if (!cancelled) setIsFollowing(!!followData);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [username]);

  async function handleFollow() {
    if (!currentUser || !profile) return;
    
    setFollowLoading(true);
    
    try {
      if (isFollowing) {
        // Unfollow
        await supabase
          .from("followers")
          .delete()
          .eq("follower_id", currentUser.id)
          .eq("followed_id", profile.auth_id);
        setIsFollowing(false);
      } else {
        // Follow
        await supabase
          .from("followers")
          .insert({
            follower_id: currentUser.id,
            followed_id: profile.auth_id
          });
        setIsFollowing(true);
      }
    } catch (error) {
      console.error("Follow error:", error);
    } finally {
      setFollowLoading(false);
    }
  }

  const displayName =
    profile?.first_name || profile?.last_name
      ? `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim()
      : profile?.username ?? "Unnamed User";

  return (
    <div className="min-h-screen w-full bg-amber-50 flex justify-center items-start py-10">
      <section className="w-full flex flex-col lg:flex-row items-start justify-center gap-2 mt-10 px-4 sm:px-6 lg:px-10">
        {/* Left card */}
        <article className="w-full lg:w-1/3 rounded-xl bg-white shadow-md ring-1 ring-black/5 p-0 relative overflow-hidden">
          {loading ? (
            <div>
              <Loader message="Fetching User..." />
            </div>
          ) : error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : !profile ? (
            <div>No profile to display.</div>
          ) : (
            <>
              <div className="flex gap-2 sm:gap-3 h-full">
                <div className="flex-shrink-0">
                  <img
                    src={profile.profile_picture_url || chefImg}
                    alt={displayName}
                    className="h-full w-40 sm:w-44 rounded-tl-xl rounded-br-xl object-cover ring-1 ring-black/10"
                  />
                </div>
                <div className="flex-1 pt-2 pr-5 pb-5 pl-5 sm:pt-3 sm:pr-7 sm:pb-7 sm:pl-7 flex flex-col justify-between">
                  <h1 className="text-xl sm:text-xl font-semibold text-[#e57f22]">
                    {displayName}
                  </h1>
                  
                  {profile?.level && profile?.chef_type && (
                    <div className="mt-2 bg-orange-50 text-[#e57f22] text-xs sm:text-sm font-medium rounded-md shadow-sm px-2 py-1">
                      <span className="text-black">Level {profile.level}</span> ·{" "}
                      {profile.chef_type}
                    </div>
                  )}
                  
                  {/* Follower/Following counts */}
                  <div className="mt-2 flex gap-22 justify-center">
                    <div className="text-center">
                      <div className="text-base font-semibold text-[#e57f22]">127</div>
                      <div className="text-xs text-gray-600">Followers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-base font-semibold text-[#e57f22]">89</div>
                      <div className="text-xs text-gray-600">Following</div>
                    </div>
                  </div>
                  
                  {currentUser && profile?.auth_id !== currentUser.id && (
                    <button
                      className={`mt-3 w-full text-sm font-medium py-2 px-4 rounded-md transition-colors ${
                        isFollowing
                          ? "bg-gray-500 hover:bg-gray-600 text-white"
                          : "bg-[#e57f22] hover:bg-[#cf6e1d] text-white"
                      }`}
                      onClick={handleFollow}
                      disabled={followLoading}
                    >
                      {followLoading ? "..." : isFollowing ? "Unfollow" : "Follow"}
                    </button>
                  )}
                  
                </div>
              </div>

              <div className="mx-5 sm:mx-7 my-4 border-t border-dashed border-gray-300" />

              <div className="px-5 sm:px-7 flex flex-wrap gap-2">
                {badges.map((b, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-2.5 py-1 text-xs sm:text-sm"
                  >
                    <span aria-hidden>{b.icon}</span>
                    <span className="font-medium">{b.label}</span>
                  </span>
                ))}
              </div>

              <div className="mx-5 sm:mx-7 my-4 border-t border-dashed border-gray-300" />

              <p className="px-5 sm:px-7 pb-4 text-sm sm:text-base leading-7 text-slate-700">
                {profile.bio?.trim() || "This user has not provided a bio yet."}
              </p>
            </>
          )}
          {/* Edit profile button - only show for own profile */}
          {currentUser && profile?.auth_id === currentUser.id && (
            <div className="px-5 sm:px-7 pb-5 sm:pb-7">
              <button
                className="mt-6 w-full bg-[#e57f22] hover:bg-[#cf6e1d] text-white text-sm sm:text-base font-medium py-2.5 rounded-md transition-colors"
                onClick={() => navigate("/profile/edit")}
              >
                Edit Profile
              </button>
            </div>
          )}
          {/* Follow button - only show for other users' profiles */}
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
