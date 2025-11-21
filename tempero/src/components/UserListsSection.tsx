import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../config/supabaseClient";
import type { Playlist } from "../services/playlistsService";
import { fetchUserPlaylists } from "../services/playlistsService";
import ListCard from "./ListCard";
import Loader from "./Loader";
import Toast from "./Toast";

type Props = {
  userId?: string;
  isOwnProfile: boolean;
};

export default function UserListsSection({ userId, isOwnProfile }: Props) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type?: "error" | "success" } | null>(
    null
  );

  useEffect(() => {
    if (!userId) return;
    setLoading(true);

    fetchUserPlaylists(userId, isOwnProfile)
      .then(setPlaylists)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId, isOwnProfile]);

  async function handleDelete(listId: string) {
    await supabase.from("lists").delete().eq("id", listId);

    setPlaylists((prev) => prev.filter((l) => l.id !== listId));

    setToast({ message: "List removed", type: "success" });
  }

  if (!userId) return <p className="text-sm text-slate-500">No user.</p>;
  if (loading) return <Loader message="Loading playlists…" />;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {playlists.map((p) => (
          <ListCard
            key={p.id}
            playlist={p}
            isOwnProfile={isOwnProfile}
            onDelete={handleDelete}
          />
        ))}

        {isOwnProfile && (
          <Link
            to="/lists/new"
            className="
              flex flex-col items-center justify-center
              rounded-xl border-2 border-dashed border-main/40
              bg-bright text-main h-40
              hover:border-main hover:bg-main/5 transition
            "
          >
            <span className="text-3xl font-bold">＋</span>
            <span className="mt-1 font-heading text-lg">Thematic List</span>
          </Link>
        )}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
