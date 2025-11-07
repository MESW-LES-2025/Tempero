import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../config/supabaseClient";

type Profile = {
  auth_id: string;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  bio?: string | null;
};

export default function EditProfilePage() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    let done = false;

    (async () => {
      const { data: auth } = await supabase.auth.getUser();

      if (!auth.user) {
        if (!done) setErr("You must be logged in to edit your profile.");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("auth_id", auth.user.id)
        .maybeSingle();

      if (done) return;

      if (error) {
        setErr(error.message);
        return;
      }

      setProfile(data);
      setFirstName(data?.first_name ?? "");
      setLastName(data?.last_name ?? "");
      setBio(data?.bio ?? "");
      setLoading(false);
    })();

    return () => {
      done = true;
    };
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    setErr(null);
    setInfo(null);
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        bio: bio.trim() || null,
      })
      .eq("auth_id", profile.auth_id);

    setSaving(false);

    if (error) {
    setErr(error.message);
    } else {
    setInfo("Profile updated successfully!");
    navigate(`/profile/${profile.username}`);
    }
    }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        Loading profile...
      </div>
    );

  return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50 px-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 sm:p-8 shadow-xl font-body">
        <h1 className="mb-4 text-3xl font-bold font-heading text-main text-center">
          Edit Profile
        </h1>

        {info && (
          <div className="mb-3 rounded-lg bg-main/10 px-3 py-2 text-sm text-main">
            {info}
          </div>
        )}
        {err && (
          <div className="mb-3 rounded-lg bg-main/10 px-3 py-2 text-sm text-danger">
            {err}
          </div>
        )}

        <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          {/* First name */}
          <div className="space-y-1">
            <label htmlFor="first_name" className="text-lg font-heading text-dark">
              First name
            </label>
            <input
              id="first_name"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-lg px-3 py-2 outline-none shadow-lg bg-amber-50 focus:ring-2 focus:ring-main transition"
            />
          </div>

          {/* Last name */}
          <div className="space-y-1">
            <label htmlFor="last_name" className="text-lg font-heading text-dark">
              Last name
            </label>
            <input
              id="last_name"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-lg px-3 py-2 outline-none shadow-lg bg-amber-50 focus:ring-2 focus:ring-main transition"
            />
          </div>

          {/* Bio */}
          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="bio" className="text-lg font-heading text-dark">
              Bio
            </label>
            <textarea
              id="bio"
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full rounded-lg px-3 py-2 outline-none shadow-lg bg-amber-50 focus:ring-2 focus:ring-main transition"
              placeholder="Tell us about your cooking style..."
            />
          </div>

          {/* Buttons */}
          <div className="sm:col-span-2 flex justify-between items-center mt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-gray-700 underline underline-offset-4 hover:text-black"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-secondary px-4 py-2.5 text-white font-medium hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-70 transition"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
