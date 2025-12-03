import { useEffect, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import Loader from "../components/Loader";
import { supabase } from "../config/supabaseClient";
import { uploadImage, deleteImage } from "../utils/ImageUtils";
import { profileImageUrl } from "../utils/ImageURL";

type Profile = {
  auth_id: string;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  bio?: string | null;
  profile_picture_url?: string | null;
};

export default function EditProfilePage() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePath, setImagePath] = useState<string | null>(null);

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
      setImagePath(data?.profile_picture_url ?? null);
      setLoading(false);
    })();

    return () => {
      done = true;
    };
  }, []);

  // Handle image file selection
  async function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const isValidImage = file.type.startsWith("image/");
    if (!isValidImage) {
      setErr("Please upload a valid image file.");
      return;
    }

    setProfileImage(file);

    try {
      setUploading(true);
      setErr(null);

      // Delete old image if exists
      if (imagePath) {
        try {
          await deleteImage(imagePath);
        } catch (delErr) {
          console.warn("Could not delete old profile image:", delErr);
        }
      }

      // Upload new image
      const newPath = await uploadImage(file, "profiles");
      setImagePath(newPath);
      setInfo("Image uploaded successfully!");
    } catch (uploadErr: any) {
      setErr(uploadErr.message || "Failed to upload image.");
    } finally {
      setUploading(false);
    }
  }

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
        profile_picture_url: imagePath,
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

  // Compute preview URL
  const previewUrl = profileImage
    ? URL.createObjectURL(profileImage)
    : imagePath
      ? profileImageUrl(imagePath)
      : null;

  if (loading) return <Loader message="Fetching User To Edit..." />;

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

        <form
          onSubmit={handleSave}
          className="grid grid-cols-1 sm:grid-cols-2 gap-6"
        >
          {/* Profile Image */}
          <div className="space-y-2 sm:col-span-2 flex flex-col items-center">
            <label className="text-lg font-heading text-dark">
              Profile Picture
            </label>
            <div className="relative">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Profile preview"
                  className="w-32 h-32 rounded-full object-cover border-4 border-main/20"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                  No image
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                  <span className="text-white text-sm">Uploading…</span>
                </div>
              )}
            </div>
            <input
              id="profile_image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={uploading}
              className="mt-2 text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-main file:text-white file:cursor-pointer hover:file:bg-main/90 disabled:opacity-50"
            />
          </div>

          {/* First name */}
          <div className="space-y-1">
            <label
              htmlFor="first_name"
              className="text-lg font-heading text-dark"
            >
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
            <label
              htmlFor="last_name"
              className="text-lg font-heading text-dark"
            >
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
              disabled={saving || uploading}
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
