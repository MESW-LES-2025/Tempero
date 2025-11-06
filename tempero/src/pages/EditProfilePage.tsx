import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../config/supabaseClient";

type Profile = {
  auth_id: string;
  username: string;
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
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr(null);

      const { data: auth, error: authErr } = await supabase.auth.getUser();
      if (authErr || !auth.user) {
        if (!cancelled) setErr("You must be logged in to edit your profile.");
        setLoading(false);
        return;
      }

      const uid = auth.user.id;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("auth_id", uid)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        setErr(error.message);
        setLoading(false);
        return;
      }

      setProfile(data);
      setFirstName(data?.first_name ?? "");
      setLastName(data?.last_name ?? "");
      setBio(data?.bio ?? "");
      setLoading(false);
    })();

    return () => {
      cancelled = true;
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

    if (error) setErr(error.message);
    else setInfo("Profile updated successfully!");

    setSaving(false);
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50 text-lg font-heading">
        Loading profile...
      </div>
    );

  if (err)
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50 text-danger font-heading">
        {err}
      </div>
    );

  if (!profile)
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50 text-lg font-heading">
        No profile found.
      </div>
    );

  return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50 px-6">
      <div className="rounded-xl bg-bright/90 p-6 sm:p-8 shadow-xl w-full max-w-2xl font-body">
        <h1 className="mb-4 text-3xl font-bold font-heading text-main text-center">
          Edit Profile
        </h1>

        <p className="mb-8 text-sm text-gray-600 text-center">
          Update your personal information. Keep it tasty!
        </p>

        {info && (
          <div className="mb-4 rounded-lg bg-main/10 px-3 py-2 text-sm text-main">
            {info}
          </div>
        )}
        {err && (
          <div className="mb-4 rounded-lg bg-main/10 px-3 py-2 text-sm text-danger">
            {err}
          </div>
        )}

        <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1">
            <label htmlFor="first_name" className="text-lg font-heading text-dark">
              First name
            </label>
            <input
              id="first_name"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-lg px-3 py-2 outline-none shadow-xl bg-white focus:ring-1 focus:ring-main focus:shadow-main/20 transition-all duration-200 ease-in-out"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="last_name" className="text-lg font-heading text-dark">
              Last name
            </label>
            <input
              id="last_name"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-lg px-3 py-2 outline-none shadow-xl bg-white focus:ring-1 focus:ring-main focus:shadow-main/20 transition-all duration-200 ease-in-out"
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="bio" className="text-lg font-heading text-dark">
              Bio
            </label>
            <textarea
              id="bio"
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full rounded-lg px-3 py-2 outline-none shadow-xl bg-white focus:ring-1 focus:ring-main focus:shadow-main/20 transition-all duration-200 ease-in-out"
              placeholder="Tell us about your cooking style..."
            />
          </div>

          <div className="sm:col-span-2 mt-4 flex justify-between">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-gray-700 hover:text-black underline underline-offset-4"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-secondary px-4 py-2.5 text-white font-medium hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-70 duration-150"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
