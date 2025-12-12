import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import chefImg from "../assets/febrian-zakaria-SiQgni-cqFg-unsplash.jpg";
import Recipes from "../components/Recipes";
import Reviews from "../components/Reviews";
import UserListsSection from "../components/UserListsSection";
import { supabase } from "../config/supabaseClient";
import { profileImageUrl } from "../utils/ImageURL";

//type Badge = { label: string; icon: string };
/* const badges: Badge[] = [
  { label: "Master Chef", icon: "👨‍🍳" },
  { label: "Bake Off", icon: "🧁" },
  { label: "Sous Chef", icon: "🔪" },
  { label: "Vegetarian", icon: "🥕" },
]; */

type Profile = {
  auth_id: string;
  username: string;
  first_name?: string | null;
  last_name?: string | null;
  bio?: string | null;
  level?: number | null;
  chef_type?: string | null;
  profile_picture_url?: string | null;
};

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [tab, setTab] = useState<"recipes" | "reviews" | "lists" >("recipes");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileNotFound, setProfileNotFound] = useState<boolean>(false);
  const [showFullBio, setShowFullBio] = useState(false);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [followLoading, setFollowLoading] = useState<boolean>(false);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [, setProfilePicture] = useState<string | null>(null);
  const [followingCount, setFollowingCount] = useState<number>(0);
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

    (async () => {
      const { data, error: fetchErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .maybeSingle();

      if (cancelled) return;

      if (fetchErr || !data) {
        setProfile(null);
        setProfileNotFound(true);
        return;
      }
      setProfileNotFound(false);
      setProfile(data as Profile);

      // Get follower count
      const { count: followersCount } = await supabase
        .from("followers")
        .select("*", { count: "exact", head: true })
        .eq("followed_id", data.auth_id);

      // Get following count
      const { count: followingCount } = await supabase
        .from("followers")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", data.auth_id);

      if (!cancelled) {
        setFollowersCount(followersCount || 0);
        setFollowingCount(followingCount || 0);
      }

      setProfilePicture(data.profile_picture_url || null);
      console.log("Profile picture:", data.profile_picture_url);

      // Check if current user is following this profile
      if (currentUser && data && currentUser.id !== data.auth_id) {
        const { data: followData } = await supabase
          .from("followers")
          .select("follower_id")
          .eq("follower_id", currentUser.id)
          .eq("followed_id", data.auth_id)
          .maybeSingle();

        if (!cancelled) setIsFollowing(!!followData);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [username, currentUser]);

  async function handleFollow() {
    if (!currentUser || !profile) return;

    setFollowLoading(true);

    try {
      if (isFollowing) {
        await supabase
          .from("followers")
          .delete()
          .eq("follower_id", currentUser.id)
          .eq("followed_id", profile.auth_id);
        setIsFollowing(false);
        setFollowersCount((prev) => prev - 1);
      } else {
        await supabase.from("followers").insert({
          follower_id: currentUser.id,
          followed_id: profile.auth_id,
        });
        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
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

  const bioText = profile?.bio || "";
  const shortBio = bioText.slice(0, 120);
  const shouldCollapse = bioText.length > 120;

  // Show error message if profile not found
  if (profileNotFound) {
    return (
      <div className="min-h-screen w-full bg-bright flex justify-center items-center">
        <div className="text-center">
          <h1 className="text-2xl font-heading-styled text-secondary mb-4">
            User not found.
          </h1>
          <p className="text-gray-600">
            The profile you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-bright flex  items-start py-10">
      <section className="w-full  flex flex-col lg:flex-row items-start justify-center gap-10 px-4 sm:px-6 lg:px-10">
        {/* LEFT CARD */}
        <article className="relative min-w-75 w-full lg:max-w-75 sm lg:w-1/3 bg-white border border-secondary/30 rounded-xl shadow-sm px-4 sm:px-6 py-6 flex flex-col items-center">
          {/* Avatar */}
          <img
            src={
              profile?.profile_picture_url
                ? profileImageUrl(profile.profile_picture_url)
                : chefImg
            }
            alt={displayName}
            className="
              absolute left-0 sm:left-0 top-0
              h-44 w-32 sm:h-48 sm:w-32 
              object-cover rounded-tl-lg rounded-br-lg
            "
          />

          {/* Content */}
          <div className="w-full max-w-[320px] mt-2 sm:mt-6 mx-auto text-center flex flex-col items-end">
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

            {/* Followers counts */}
            <div className="flex items-center justify-center gap-10 text-center font-body text-dark my-2">
              <div>
                <p className="text-lg text-main font-heading-styled font-semibold">
                  {followersCount}
                </p>
                <p className="text-sm font-heading-styled">Followers</p>
              </div>

              <div>
                <p className="text-lg text-main font-heading-styled font-semibold">
                  {followingCount}
                </p>
                <p className="text-sm font-heading-styled">Following</p>
              </div>
            </div>

            {/* Follow button */}
            {currentUser && profile?.auth_id !== currentUser.id && (
              <button
                className={`mt-3 w-full max-w-[460px] font-heading-styled py-2.5 rounded-lg transition ${
                  isFollowing
                    ? "bg-gray-500 hover:bg-gray-600 text-white"
                    : "bg-main hover:bg-secondary text-bright"
                }`}
                onClick={handleFollow}
                disabled={followLoading}
              >
                {followLoading ? "..." : isFollowing ? "Unfollow" : "Follow"}
              </button>
            )}

            {/* Dotted separator */}
            {/* <div className="border-t border-dotted border-dark/40 w-full my-5"></div> */}

            {/* Badges */}
            {/* 
            <div className="w-full max-w-[300px] flex flex-wrap gap-3 justify-center bg-white rounded-xl p-3 shadow-sm">
              {badges.map((b, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-bright font-body text-dark text-sm"
              >
                {b.icon} {b.label}
              </span>
              ))}
            </div>
            */}

            {/* Dotted separator */}
            <div className="border-t border-dotted border-dark/40 w-full my-10"></div>

            {/* BIO */}
            <p className="font-body text-dark leading-7 text-left">
              {bioText ? (
                <>
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
                </>
              ) : (
                <span className="text-gray-500 italic">
                  This user has not provided a bio yet.
                </span>
              )}
            </p>

            {/* Edit */}
            {isOwnProfile && (
              <button
                className="my-6 w-full max-w-[460px] bg-main hover:bg-secondary transition text-bright font-heading-styled py-2.5 rounded-lg items-start"
                onClick={() => navigate("/profile/edit")}
              >
                Edit Profile
              </button>
            )}
          </div>
        </article>

        {/* RIGHT SIDE */}
        <div className="w-full ">
          <div className="flex gap-6 mb-5 border-b border-dark/10 font-heading text-lg ">
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
                tab === "lists"
                  ? "text-secondary border-b-2 border-secondary"
                  : "text-dark/60 hover:text-secondary"
              }`}
              onClick={() => setTab("lists")}
            >
              Lists
            </button>

          </div>

          {tab === "recipes" ? (
            <Recipes userId={profile?.auth_id} username={profile?.username} />
          ) : tab === "reviews" ? (
            <Reviews userId={profile?.auth_id} username={profile?.username} />
          ) : (
            <UserListsSection
              userId={profile?.auth_id}
              isOwnProfile={isOwnProfile}
            />
          )}
        </div>
      </section>
    </div>
  );
}
