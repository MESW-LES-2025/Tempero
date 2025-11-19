import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../config/supabaseClient";

export default function CreatePlaylistPage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) {
      setError("You must be logged in.");
      setLoading(false);
      return;
    }

    const { error: insertErr } = await supabase.from("lists").insert({
      title,
      description,
      visibility,
      user_id: auth.user.id,
    });

    setLoading(false);

    if (insertErr) {
      setError(insertErr.message);
      return;
    }

    navigate("/lists");
  }

  return (
    <main className="min-h-screen bg-bright flex justify-center py-10 px-4">
      <section className="w-full max-w-xl bg-white rounded-xl shadow-md border border-secondary/20 p-6">
        <h1 className="font-heading-styled text-3xl text-secondary mb-6">
          Create a New Thematic List
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="font-heading text-dark">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full border border-dark/20 rounded-lg px-3 py-2 font-body"
              placeholder="Example: Portuguese Classics"
            />
          </div>

          {/* Description */}
          <div>
            <label className="font-heading text-dark">Description</label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full border border-dark/20 rounded-lg px-3 py-2 font-body h-28"
              placeholder="Describe this list..."
            />
          </div>

          {/* Visibility */}
          <div>
            <label className="font-heading text-dark">Visibility</label>
            <div className="mt-2 flex gap-5 font-body text-dark">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="PUBLIC"
                  checked={visibility === "PUBLIC"}
                  onChange={() => setVisibility("PUBLIC")}
                />
                Public
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="PRIVATE"
                  checked={visibility === "PRIVATE"}
                  onChange={() => setVisibility("PRIVATE")}
                />
                Private
              </label>
            </div>
          </div>

          {/* Error */}
          {error && <p className="text-red-600 text-sm">{error}</p>}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-main hover:bg-secondary text-bright font-heading-styled py-2.5 rounded-lg transition"
          >
            {loading ? "Creating..." : "Create List"}
          </button>
        </form>
      </section>
    </main>
  );
}
